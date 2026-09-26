import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Plus, Trash2, Edit2, Check, X, BookOpen, FileText, MessageSquare, RefreshCw, Send, AlertCircle, ListOrdered, Globe, ExternalLink, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { renderMarkdown, renderChatMessage } from './markdown';
import { SUMMARY_LANGUAGES } from '../languages';
import Sidebar from './Sidebar';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === null) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function NotesPanel({
  notes = [],
  currentTime = 0,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onSeek,
  onPauseVideo,

  // Props for Course Content Tab
  sections = [],
  progress = {},
  onSelectLesson,
  onToggleComplete,
  onOpenSectionSummary,

  // Props for Summarization & Chat
  activeLesson,
  coursePath,
  activeLang,
  summaryLang,
  setSummaryLang,
  hasApiKey,
  onResizeStart,
  onResizeReset,
  aiProvider = 'gemini',
  autoCreateSummary = false,
  autoCreateSummaryLang = 'en'
}) {
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'summary' | 'chat' | 'notes'
  const providerName = aiProvider === 'anthropic' ? 'Anthropic' : aiProvider === 'openai' ? 'OpenAI' : 'Gemini';
  
  // Notes states
  const [newNoteText, setNewNoteText] = useState('');
  const [noteTime, setNoteTime] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Summary states
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [showSummarySearch, setShowSummarySearch] = useState(false);
  const [summarySearchQuery, setSummarySearchQuery] = useState('');
  const [summaryActiveMatchIndex, setSummaryActiveMatchIndex] = useState(0);
  const [summaryTotalMatches, setSummaryTotalMatches] = useState(0);

  const summarySearchInputRef = useRef(null);
  const summaryContentRef = useRef(null);

  // Chat states
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  // Compute lesson scope key for database persistence
  const currentScopeKey = activeLesson?.id ? `lesson:${activeLesson.id}` : null;

  // Load chat history from progress_db when scope or course changes
  useEffect(() => {
    let active = true;
    if (!coursePath || !currentScopeKey) {
      queueMicrotask(() => {
        if (active) setChatMessages([]);
      });
      return () => {
        active = false;
      };
    }
    fetch(`/api/userdata/chat?coursePath=${encodeURIComponent(coursePath)}&scopeKey=${encodeURIComponent(currentScopeKey)}`)
      .then(r => r.json())
      .then(data => {
        if (active && data.success && Array.isArray(data.messages)) {
          setChatMessages(data.messages);
        } else if (active) {
          setChatMessages([]);
        }
      })
      .catch(err => {
        console.warn('Failed to load chat history:', err);
        if (active) setChatMessages([]);
      });
    return () => {
      active = false;
    };
  }, [coursePath, currentScopeKey]);

  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Compute effective summary language: user choice > active subtitle language.
  // This variable feeds into the dependency chain:
  //   effectiveSummaryLang → checkSummaryCache (useCallback) → reset useEffect
  // When summaryLang changes, effectiveSummaryLang recalculates, checkSummaryCache
  // recreates with the new langCode, and the reset effect calls the fresh callback.
  const effectiveSummaryLang = summaryLang || activeLang;

  useEffect(() => {
    if (activeTab === 'chat') {
      requestAnimationFrame(() => {
        chatInputRef.current?.focus();
      });
    }
  }, [activeTab]);

  // Guard against stale async calls when lesson/lang changes mid-request
  const summaryGenIdRef = useRef(0);
  const cacheGenIdRef = useRef(0);

  // Summary action handlers
  const generateSummary = useCallback(async (lang = (effectiveSummaryLang || autoCreateSummaryLang || activeLang)) => {
    const subtitlePath = activeLesson?.subtitles?.[activeLang] || (activeLesson?.subtitles ? Object.values(activeLesson.subtitles)[0] : null);
    if (!subtitlePath) return;

    const genId = ++summaryGenIdRef.current;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const response = await fetch('/api/summarize-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtitlePath, langCode: lang })
      });
      const data = await response.json();
      if (genId !== summaryGenIdRef.current) return; // stale request
      if (data.success) {
        setSummary(data.summary);
      } else {
        setSummaryError(data.error || 'Failed to generate summary.');
      }
    } catch (e) {
      if (genId !== summaryGenIdRef.current) return; // stale request
      console.error('Error generating summary:', e);
      setSummaryError('Network error while generating summary.');
    } finally {
      if (genId === summaryGenIdRef.current) {
        setSummaryLoading(false);
      }
    }
  }, [activeLesson, activeLang, effectiveSummaryLang, autoCreateSummaryLang]);

  // Keep a ref to the latest generateSummary to break the dep chain with checkSummaryCache
  const generateSummaryRef = useRef(generateSummary);
  generateSummaryRef.current = generateSummary;

  const checkSummaryCache = useCallback(async () => {
    const subtitlePath = activeLesson?.subtitles?.[activeLang] || (activeLesson?.subtitles ? Object.values(activeLesson.subtitles)[0] : null);
    if (!subtitlePath) return;

    // When auto-creating, honor the configured autoCreateSummaryLang; otherwise
    // fall back to the display language (manual choice, then subtitle language).
    const langCode = autoCreateSummary
      ? (summaryLang || autoCreateSummaryLang || activeLang)
      : (summaryLang || activeLang);
    const cacheId = ++cacheGenIdRef.current;

    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const response = await fetch('/api/summarize-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtitlePath, langCode, checkCacheOnly: true })
      });
      const data = await response.json();
      if (cacheId !== cacheGenIdRef.current) return; // stale request
      if (data.success) {
        if (data.summary) {
          setSummary(data.summary);
        } else if (autoCreateSummary && hasApiKey) {
          await generateSummaryRef.current(langCode);
        }
      }
    } catch (e) {
      if (cacheId !== cacheGenIdRef.current) return; // stale request
      console.error('Error checking summary cache:', e);
    } finally {
      if (cacheId === cacheGenIdRef.current) {
        setSummaryLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLesson, activeLang, summaryLang, effectiveSummaryLang, autoCreateSummary, autoCreateSummaryLang, hasApiKey]);

  // Reset state when lesson or language changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setSummary('');
      setSummaryError(null);
      setChatMessages([]);
      setChatError(null);
      setChatInput('');
      setShowSummarySearch(false);
      setSummarySearchQuery('');
      setSummaryActiveMatchIndex(0);
      setSummaryTotalMatches(0);
      
      if (activeLesson && activeLang) {
        checkSummaryCache();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [activeLesson, activeLang, summaryLang, checkSummaryCache]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

  // Notes action handlers
  const handleFocus = () => {
    onPauseVideo();
    setNoteTime(Math.floor(currentTime));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const timestamp = noteTime !== null ? noteTime : Math.floor(currentTime);
    onAddNote(timestamp, newNoteText.trim());
    setNewNoteText('');
    setNoteTime(null);
  };

  const startEditing = (note) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.text);
  };

  const handleEditSubmit = (noteId, timestamp) => {
    if (!editingNoteText.trim()) return;
    onEditNote(noteId, timestamp, editingNoteText.trim());
    setEditingNoteId(null);
    setEditingNoteText('');
  };



  const clearSummaryCache = async () => {
    const subtitlePath = activeLesson?.subtitles?.[activeLang] || (activeLesson?.subtitles ? Object.values(activeLesson.subtitles)[0] : null);
    if (!subtitlePath) return;

    const langCode = effectiveSummaryLang || activeLang;

    setSummaryLoading(true);
    try {
      const response = await fetch('/api/clear-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtitlePath, langCode })
      });
      const data = await response.json();
      if (data.success) {
        setSummary('');
        await generateSummary(langCode);
      } else {
        setSummaryLoading(false);
      }
    } catch (e) {
      console.error('Error clearing summary:', e);
      setSummaryLoading(false);
    }
  };

  // Summary search action handlers & effects
  const handleCloseSearch = useCallback(() => {
    setShowSummarySearch(false);
    setSummarySearchQuery('');
    setSummaryActiveMatchIndex(0);
    setSummaryTotalMatches(0);
  }, []);

  const handleNextMatch = useCallback(() => {
    if (summaryTotalMatches <= 1) return;
    setSummaryActiveMatchIndex((prev) => (prev + 1) % summaryTotalMatches);
  }, [summaryTotalMatches]);

  const handlePrevMatch = useCallback(() => {
    if (summaryTotalMatches <= 1) return;
    setSummaryActiveMatchIndex((prev) => (prev - 1 + summaryTotalMatches) % summaryTotalMatches);
  }, [summaryTotalMatches]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCloseSearch();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevMatch();
      } else {
        handleNextMatch();
      }
    }
  };

  // Listen for Cmd+F (Mac) or Ctrl+F (Win/Linux) to search within Summary tab
  useEffect(() => {
    if (activeTab !== 'summary' || !summary) return;

    const handleKeyDown = (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        e.stopPropagation();
        setShowSummarySearch(true);
        requestAnimationFrame(() => {
          summarySearchInputRef.current?.focus();
          summarySearchInputRef.current?.select();
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [activeTab, summary]);

  // Recalculate total matches in DOM when query, summary, or search visibility changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!summarySearchQuery.trim() || !showSummarySearch) {
        setSummaryTotalMatches(0);
        setSummaryActiveMatchIndex(0);
        return;
      }
      const matches = summaryContentRef.current?.querySelectorAll('.summary-search-match') || [];
      setSummaryTotalMatches(matches.length);
      setSummaryActiveMatchIndex(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [summarySearchQuery, summary, showSummarySearch]);

  // Scroll active match into view smoothly
  useEffect(() => {
    if (summaryTotalMatches > 0 && showSummarySearch) {
      const activeEl = document.getElementById(`summary-match-${summaryActiveMatchIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [summaryActiveMatchIndex, summaryTotalMatches, showSummarySearch]);

  // Chat action handlers
  const saveChatHistory = useCallback(async (key, messages) => {
    if (!coursePath || !key) return;
    try {
      await fetch('/api/userdata/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coursePath, scopeKey: key, messages })
      });
    } catch (err) {
      console.warn('Failed to save chat history:', err);
    }
  }, [coursePath]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = { role: 'user', content: chatInput.trim() };
    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);
    setChatError(null);

    // Immediately save user message to disk
    if (currentScopeKey) {
      saveChatHistory(currentScopeKey, newMessages);
    }

    const subtitlePath = activeLesson?.subtitles?.[activeLang] || (activeLesson?.subtitles ? Object.values(activeLesson.subtitles)[0] : null);
    if (!subtitlePath) {
      setChatError('No subtitles available for this lesson.');
      setChatLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/chat-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtitlePath,
          messages: newMessages,
          enableWebSearch: webSearchEnabled,
          currentTime: typeof currentTime === 'number' ? currentTime : undefined
        })
      });
      const data = await response.json();
      if (data.success) {
        const updatedMessages = [
          ...newMessages,
          {
            role: 'assistant',
            content: data.reply,
            sources: data.sources || [],
            searchedWeb: Boolean(webSearchEnabled && data.sources && data.sources.length > 0)
          }
        ];
        setChatMessages(updatedMessages);
        if (currentScopeKey) {
          saveChatHistory(currentScopeKey, updatedMessages);
        }
      } else {
        const errorText = data.error || 'Failed to get AI response.';
        setChatError(errorText);
        const updatedMessages = [...newMessages, { role: 'error', content: `❌ ${errorText}` }];
        setChatMessages(updatedMessages);
        if (currentScopeKey) {
          saveChatHistory(currentScopeKey, updatedMessages);
        }
      }
    } catch (err) {
      console.error('Error in chat:', err);
      const errorText = 'Network error during chat.';
      setChatError(errorText);
      const updatedMessages = [...newMessages, { role: 'error', content: `❌ ${errorText}` }];
      setChatMessages(updatedMessages);
      if (currentScopeKey) {
        saveChatHistory(currentScopeKey, updatedMessages);
      }
    } finally {
      setChatLoading(false);
      requestAnimationFrame(() => {
        chatInputRef.current?.focus();
      });
    }
  };

  const handleNewChat = async () => {
    setChatMessages([]);
    setChatInput('');
    setChatError(null);
    if (coursePath && currentScopeKey) {
      try {
        await fetch('/api/userdata/chat', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coursePath, scopeKey: currentScopeKey })
        });
      } catch (err) {
        console.warn('Failed to clear chat history on disk:', err);
      }
    }
    requestAnimationFrame(() => {
      chatInputRef.current?.focus();
    });
  };

  const currentSubtitlePath = activeLesson?.subtitles?.[activeLang];

  return (
    <div className="notes-panel">
      {/* Right Sidebar Tabs */}
      <div className="panel-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-notes-tabs)', overflowX: 'auto' }}>
        <button
          className={`panel-tab-btn ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
          style={{
            flex: 1,
            padding: '12px 4px',
            border: 'none',
            borderBottom: activeTab === 'content' ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'transparent',
            color: activeTab === 'content' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'content' ? 600 : 500,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            whiteSpace: 'nowrap',
            transition: 'var(--transition-fast)'
          }}
        >
          <ListOrdered size={14} /> Content
        </button>
        <button
          className={`panel-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
          style={{
            flex: 1,
            padding: '12px 4px',
            border: 'none',
            borderBottom: activeTab === 'summary' ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'transparent',
            color: activeTab === 'summary' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'summary' ? 600 : 500,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            whiteSpace: 'nowrap',
            transition: 'var(--transition-fast)'
          }}
        >
          <FileText size={14} /> Summary
        </button>
        <button
          className={`panel-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
          style={{
            flex: 1,
            padding: '12px 4px',
            border: 'none',
            borderBottom: activeTab === 'chat' ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'transparent',
            color: activeTab === 'chat' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'chat' ? 600 : 500,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            whiteSpace: 'nowrap',
            transition: 'var(--transition-fast)'
          }}
        >
          <MessageSquare size={14} /> AI Chat
        </button>
        <button
          className={`panel-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
          style={{
            flex: 1,
            padding: '12px 4px',
            border: 'none',
            borderBottom: activeTab === 'notes' ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'transparent',
            color: activeTab === 'notes' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'notes' ? 600 : 500,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            whiteSpace: 'nowrap',
            transition: 'var(--transition-fast)'
          }}
        >
          <BookOpen size={14} /> Notes{notes.length > 0 ? ` (${notes.length})` : ''}
        </button>
      </div>

      {/* Tab Contents */}
      {/* Content Tab */}
      <div
        style={{
          display: activeTab === 'content' ? 'flex' : 'none',
          flex: 1,
          flexDirection: 'column',
          height: 'calc(100% - 45px)',
          overflow: 'hidden'
        }}
      >
        <Sidebar
          sections={sections}
          progress={progress}
          activeLesson={activeLesson}
          onSelectLesson={onSelectLesson}
          onToggleComplete={onToggleComplete}
          onOpenSectionSummary={onOpenSectionSummary}
          embedded
          isActive={activeTab === 'content'}
        />
      </div>

      {/* Notes Tab */}
      <div
        style={{
          display: activeTab === 'notes' ? 'flex' : 'none',
          flex: 1,
          flexDirection: 'column',
          height: 'calc(100% - 45px)',
          overflow: 'hidden'
        }}
      >
        <div className="notes-scrollable">
          {!activeLesson ? (
            <div className="empty-state" style={{ padding: '40px 20px', height: 'auto' }}>
              <BookOpen size={32} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
              <div className="empty-state-title" style={{ fontSize: '0.9rem' }}>No Active Lesson</div>
              <div className="empty-state-desc" style={{ fontSize: '0.75rem' }}>
                Select a lesson from the Course Content tab to view or take notes.
              </div>
            </div>
          ) : notes.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 10px', height: 'auto' }}>
                <span style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📝</span>
                <div className="empty-state-title" style={{ fontSize: '0.9rem' }}>No Notes Yet</div>
                <div className="empty-state-desc" style={{ fontSize: '0.75rem' }}>
                  Type in the box below to save timestamped notes. The video will pause while you type.
                </div>
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="note-item">
                  <div className="note-header">
                    <span className="note-timestamp" onClick={() => onSeek(note.timestamp)} title="Click to seek video">
                      <Clock size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      {formatTime(note.timestamp)}
                    </span>
                    
                    {editingNoteId !== note.id && (
                      <div className="note-actions">
                        <button className="note-action-btn" onClick={() => startEditing(note)} title="Edit Note">
                          <Edit2 size={12} />
                        </button>
                        <button className="note-action-btn" onClick={() => onDeleteNote(note.id)} title="Delete Note">
                          <Trash2 size={12} style={{ color: 'var(--accent-red)' }} />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingNoteId === note.id ? (
                    <div style={{ marginTop: '8px' }}>
                      <textarea
                        className="textarea-note"
                        style={{ height: '60px', fontSize: '0.8rem', marginBottom: '4px' }}
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn-add-note"
                          style={{ background: 'var(--text-muted)', padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => setEditingNoteId(null)}
                        >
                          <X size={12} />
                        </button>
                        <button
                          className="btn-add-note"
                          style={{ background: 'var(--accent-green)', padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => handleEditSubmit(note.id, note.timestamp)}
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="note-text">{note.text}</div>
                  )}
                </div>
              ))
            )}
          </div>

          {activeLesson && (
            <form className="notes-form" onSubmit={handleAddSubmit}>
              <textarea
                className="textarea-note"
                placeholder="Take a note... Video will pause automatically."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                onFocus={handleFocus}
              />
              <div className="form-actions">
                <span className="note-time-badge">
                  {newNoteText.trim() && (
                    <>
                      Timestamp: <strong>{formatTime(noteTime !== null ? noteTime : currentTime)}</strong>
                    </>
                  )}
                </span>
                <button type="submit" className="btn-add-note">
                  <Plus size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Add Note
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Summary Tab */}
        <div style={{ display: activeTab === 'summary' ? 'flex' : 'none', flex: 1, flexDirection: 'column', overflow: 'hidden', padding: '16px', height: 'calc(100% - 45px)' }}>
          {/* Language Selector — always visible when subtitles and API key are ready */}
          {currentSubtitlePath && hasApiKey && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
              paddingBottom: '10px',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                Summarize in:
              </label>
              <select
                className="summary-lang-select"
                value={summaryLang || activeLang}
                onChange={(e) => setSummaryLang(e.target.value === activeLang ? '' : e.target.value)}
              >
                {/* Show "Same as subtitles" as the default option */}
                <option value={activeLang}>
                  Same as subtitles ({SUMMARY_LANGUAGES[activeLang?.toLowerCase()] || activeLang?.toUpperCase()})
                </option>
                {Object.entries(SUMMARY_LANGUAGES)
                  .filter(([code]) => code !== activeLang?.toLowerCase())
                  .map(([code, label]) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
              </select>
            </div>
          )}
          {!activeLesson ? (
            <div className="empty-state" style={{ padding: '40px 20px', height: '100%' }}>
              <FileText size={28} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
              <div className="empty-state-title">No Active Lesson</div>
              <div className="empty-state-desc">
                Please select a video lesson to view or generate its summary.
              </div>
            </div>
          ) : activeLesson.type !== 'video' ? (
            <div className="empty-state" style={{ padding: '40px 20px', height: '100%' }}>
              <FileText size={28} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
              <div className="empty-state-title">Not a Video Lesson</div>
              <div className="empty-state-desc">
                Summarization is available for video lessons with subtitles.
              </div>
            </div>
          ) : !currentSubtitlePath ? (
            <div className="empty-state" style={{ padding: '40px 20px', height: '100%' }}>
              <AlertCircle size={28} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
              <div className="empty-state-title">No Subtitles Track</div>
              <div className="empty-state-desc">
                Summarization requires subtitles. Please select a subtitle track or translate subtitles first.
              </div>
            </div>
          ) : !hasApiKey ? (
            <div className="empty-state" style={{ padding: '40px 20px', height: '100%' }}>
              <AlertCircle size={28} style={{ color: 'var(--accent-red)', marginBottom: '12px' }} />
              <div className="empty-state-title">{providerName} API Key Missing</div>
              <div className="empty-state-desc">
                Please enter your {providerName} API Key in Settings to generate AI summaries.
              </div>
            </div>
          ) : summaryLoading ? (
            <div className="empty-state" style={{ height: '100%' }}>
              <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '12px' }} />
              <div className="empty-state-title">Analyzing Transcript...</div>
              <div className="empty-state-desc">{providerName} is compiling your offline summary.</div>
            </div>
          ) : summary ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={12} style={{ color: 'var(--accent-green)' }} /> Saved to Disk (Offline)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setShowSummarySearch((prev) => {
                        const next = !prev;
                        if (next) {
                          requestAnimationFrame(() => {
                            summarySearchInputRef.current?.focus();
                            summarySearchInputRef.current?.select();
                          });
                        } else {
                          handleCloseSearch();
                        }
                        return next;
                      });
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: showSummarySearch ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Find in summary (Cmd+F / Ctrl+F)"
                    onMouseEnter={(e) => { if (!showSummarySearch) e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { if (!showSummarySearch) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <Search size={12} /> Find
                  </button>
                  <button
                    onClick={clearSummaryCache}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    <RefreshCw size={12} /> Regenerate
                  </button>
                </div>
              </div>

              {/* In-Summary Search Bar */}
              {showSummarySearch && (
                <div className="summary-search-bar">
                  <Search size={13} className="summary-search-icon" />
                  <input
                    ref={summarySearchInputRef}
                    type="text"
                    className="summary-search-input"
                    placeholder="Find in summary... (Enter/Shift+Enter, Esc)"
                    value={summarySearchQuery}
                    onChange={(e) => setSummarySearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                  />
                  {summarySearchQuery.trim() && (
                    <span className="summary-search-count">
                      {summaryTotalMatches === 0 ? 'No results' : `${summaryActiveMatchIndex + 1} of ${summaryTotalMatches}`}
                    </span>
                  )}
                  <div className="summary-search-actions">
                    <button
                      type="button"
                      className="summary-search-btn"
                      onClick={handlePrevMatch}
                      disabled={summaryTotalMatches <= 1}
                      title="Previous match (Shift+Enter)"
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      type="button"
                      className="summary-search-btn"
                      onClick={handleNextMatch}
                      disabled={summaryTotalMatches <= 1}
                      title="Next match (Enter)"
                    >
                      <ChevronDown size={13} />
                    </button>
                    <button
                      type="button"
                      className="summary-search-btn summary-search-close-btn"
                      onClick={handleCloseSearch}
                      title="Close search (Esc)"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              )}

              <div ref={summaryContentRef} style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', lineHeight: '1.5' }}>
                {renderMarkdown(summary, {
                  searchQuery: showSummarySearch ? summarySearchQuery : '',
                  activeMatchIndex: summaryActiveMatchIndex
                })}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px 20px', height: '100%' }}>
              <FileText size={32} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
              <div className="empty-state-title">No Summary Generated</div>
              <div className="empty-state-desc">
                Summarize this video lesson in {SUMMARY_LANGUAGES[effectiveSummaryLang?.toLowerCase()] || effectiveSummaryLang?.toUpperCase() || 'the selected language'}.
              </div>
              <button
                className="btn-add-note"
                style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => generateSummary()}
              >
                <RefreshCw size={14} /> Generate Summary
              </button>
              {summaryError && (
                <div style={{ color: 'var(--accent-red)', fontSize: '0.75rem', marginTop: '12px', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  {summaryError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Tab */}
        <div style={{ display: activeTab === 'chat' ? 'flex' : 'none', flex: 1, flexDirection: 'column', overflow: 'hidden', padding: '16px', height: 'calc(100% - 45px)' }}>
          {!activeLesson ? (
            <div className="empty-state" style={{ padding: '40px 20px', height: '100%' }}>
              <MessageSquare size={28} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
              <div className="empty-state-title">No Active Lesson</div>
              <div className="empty-state-desc">
                Please select a video lesson to chat with AI about its transcript.
              </div>
            </div>
          ) : activeLesson.type !== 'video' ? (
            <div className="empty-state" style={{ padding: '40px 20px', height: '100%' }}>
              <MessageSquare size={28} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
              <div className="empty-state-title">Not a Video Lesson</div>
              <div className="empty-state-desc">
                AI chat is available for video lessons with subtitles.
              </div>
            </div>
          ) : !currentSubtitlePath ? (
            <div className="empty-state" style={{ padding: '40px 20px', height: '100%' }}>
              <AlertCircle size={28} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
              <div className="empty-state-title">No Subtitles Track</div>
              <div className="empty-state-desc">
                AI chat features require subtitles. Please select a subtitle track or translate subtitles first.
              </div>
            </div>
          ) : !hasApiKey ? (
            <div className="empty-state" style={{ padding: '40px 20px', height: '100%' }}>
              <AlertCircle size={28} style={{ color: 'var(--accent-red)', marginBottom: '12px' }} />
              <div className="empty-state-title">{providerName} API Key Missing</div>
              <div className="empty-state-desc">
                Please enter your {providerName} API Key in Settings to chat with lesson contexts.
              </div>
            </div>
          ) : (
            <>
              {/* Chat sub-header bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} style={{ color: 'var(--accent-green)' }} /> Grounded in Transcript
                  </span>
                  <button
                    type="button"
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    title={webSearchEnabled ? 'Web search enabled: AI can search the internet for current info' : 'Web search disabled: AI answers strictly from lesson transcript'}
                    style={{
                      background: webSearchEnabled ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-hover-subtle)',
                      border: webSearchEnabled ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      color: webSearchEnabled ? 'var(--primary)' : 'var(--text-secondary)',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '0.725rem',
                      fontWeight: webSearchEnabled ? 600 : 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    <Globe size={11} />
                    <span>{webSearchEnabled ? 'Web Search: ON' : 'Web Search: OFF'}</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleNewChat}
                  disabled={chatLoading}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: chatLoading ? 'var(--text-muted)' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    cursor: chatLoading ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: chatLoading ? 0.5 : 1,
                    transition: 'var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    if (!chatLoading) e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!chatLoading) e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                  title="Clear conversation history for this lesson"
                >
                  <Trash2 size={12} /> New Chat
                </button>
              </div>

              {/* Chat Log */}
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                {chatMessages.length === 0 ? (
                  <div className="empty-state" style={{ padding: '20px 10px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <MessageSquare size={32} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
                    <div className="empty-state-title">Grounding Chat</div>
                    <div className="empty-state-desc">
                      Ask quick questions based on the transcript subtitles of this lesson. Timestamps in answers (e.g. [02:30]) can be clicked to seek.
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : msg.role === 'error' ? 'center' : 'flex-start',
                        width: '100%'
                      }}
                    >
                      <div
                        style={{
                          maxWidth: msg.role === 'error' ? '90%' : '85%',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          borderTopRightRadius: msg.role === 'user' ? '4px' : '12px',
                          borderTopLeftRadius: msg.role === 'user' ? '12px' : '4px',
                          background: msg.role === 'user' ? 'var(--primary)' : msg.role === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-hover)',
                          border: msg.role === 'error' ? '1px solid rgba(239, 68, 68, 0.2)' : msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                          color: msg.role === 'error' ? 'var(--accent-red)' : msg.role === 'user' ? 'white' : 'var(--text-primary)',
                          fontSize: msg.role === 'error' ? '0.8rem' : '0.825rem',
                          lineHeight: '1.45',
                          wordBreak: 'break-word'
                        }}
                      >
                        {msg.role === 'assistant' ? renderChatMessage(msg.content, { onSeek }) : msg.content}
                        {msg.sources && msg.sources.length > 0 && (
                          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Globe size={11} /> Sources:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {msg.sources.map((source, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: 'var(--primary)',
                                    textDecoration: 'none',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '0.725rem'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                  title={source.title || source.url}
                                >
                                  <ExternalLink size={10} style={{ flexShrink: 0 }} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{source.title || source.url}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                    <div
                      style={{
                        maxWidth: '85%',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        borderTopLeftRadius: '4px',
                        background: 'var(--bg-hover-subtle)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RefreshCw size={12} className="animate-spin" /> {webSearchEnabled ? 'Searching web & formulating answer...' : 'AI is formulating answer...'}
                    </div>
                  </div>
                )}
                {chatError && (
                  <div style={{ color: 'var(--accent-red)', fontSize: '0.75rem', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                    {chatError}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <input
                  ref={chatInputRef}
                  type="text"
                  placeholder="Ask about this video lesson (e.g. explain code at 02:15)..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                  style={{
                    flex: 1,
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    transition: 'var(--transition-fast)'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  style={{
                    background: 'var(--primary)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: chatLoading || !chatInput.trim() ? 'default' : 'pointer',
                    opacity: chatLoading || !chatInput.trim() ? 0.5 : 1,
                    transition: 'var(--transition-fast)',
                    flexShrink: 0
                  }}
                  title="Send message"
                >
                  <Send size={14} />
                </button>
              </form>
            </>
          )}
        </div>
      <div 
        className="resize-handle left-handle" 
        onPointerDown={onResizeStart} 
        onDoubleClick={onResizeReset} 
      />
    </div>
  );
}
