import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Plus, Trash2, Edit2, Check, X, BookOpen, FileText, MessageSquare, RefreshCw, Send, AlertCircle } from 'lucide-react';

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

function formatInlineStyles(text) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  if (parts.length > 1) {
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} style={{ color: 'var(--text-primary)' }}>{part}</strong> : part);
  }
  return text;
}

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    if (line.startsWith('### ')) {
      return <h4 key={idx} style={{ marginTop: '12px', marginBottom: '6px', color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600 }}>{line.substring(4)}</h4>;
    }
    if (line.startsWith('## ')) {
      return <h3 key={idx} style={{ marginTop: '16px', marginBottom: '8px', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>{line.substring(3)}</h3>;
    }
    if (line.startsWith('# ')) {
      return <h2 key={idx} style={{ marginTop: '18px', marginBottom: '10px', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>{line.substring(2)}</h2>;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.substring(2);
      return <li key={idx} style={{ marginLeft: '16px', marginBottom: '4px', listStyleType: 'disc', fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>{formatInlineStyles(content)}</li>;
    }
    if (line.trim() === '') {
      return <div key={idx} style={{ height: '8px' }} />;
    }
    return <p key={idx} style={{ marginBottom: '8px', fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>{formatInlineStyles(line)}</p>;
  });
}

export default function NotesPanel({
  notes = [],
  currentTime = 0,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onSeek,
  onPauseVideo,
  
  // New props for Summarization & Chat
  activeLesson,
  activeLang,
  hasApiKey,
  onResizeStart,
  onResizeReset
}) {
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'summary' | 'chat'
  
  // Notes states
  const [newNoteText, setNewNoteText] = useState('');
  const [noteTime, setNoteTime] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Summary states
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // Chat states
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  const chatEndRef = useRef(null);

  // Summary action handlers
  const checkSummaryCache = useCallback(async () => {
    const subtitlePath = activeLesson?.subtitles?.[activeLang];
    if (!subtitlePath) return;

    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const response = await fetch('/api/summarize-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtitlePath, langCode: activeLang, checkCacheOnly: true })
      });
      const data = await response.json();
      if (data.success && data.summary) {
        setSummary(data.summary);
      }
    } catch (e) {
      console.error('Error checking summary cache:', e);
    } finally {
      setSummaryLoading(false);
    }
  }, [activeLesson, activeLang]);

  // Reset state when lesson or language changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setSummary('');
      setSummaryError(null);
      setChatMessages([]);
      setChatError(null);
      setChatInput('');
      
      if (activeLesson && activeLang) {
        checkSummaryCache();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [activeLesson, activeLang, checkSummaryCache]);

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

  const generateSummary = async () => {
    const subtitlePath = activeLesson?.subtitles?.[activeLang];
    if (!subtitlePath) return;

    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const response = await fetch('/api/summarize-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtitlePath, langCode: activeLang })
      });
      const data = await response.json();
      if (data.success) {
        setSummary(data.summary);
      } else {
        setSummaryError(data.error || 'Failed to generate summary.');
      }
    } catch (e) {
      console.error('Error generating summary:', e);
      setSummaryError('Network error while generating summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const clearSummaryCache = async () => {
    const subtitlePath = activeLesson?.subtitles?.[activeLang];
    if (!subtitlePath) return;

    setSummaryLoading(true);
    try {
      const response = await fetch('/api/clear-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtitlePath, langCode: activeLang })
      });
      const data = await response.json();
      if (data.success) {
        setSummary('');
      }
    } catch (e) {
      console.error('Error clearing summary:', e);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Chat action handlers
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = { role: 'user', content: chatInput.trim() };
    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);
    setChatError(null);

    const subtitlePath = activeLesson?.subtitles?.[activeLang];
    if (!subtitlePath) {
      setChatError('No subtitles available for chat.');
      setChatLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/chat-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtitlePath, messages: newMessages })
      });
      const data = await response.json();
      if (data.success) {
        setChatMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      } else {
        setChatError(data.error || 'Failed to get AI response.');
      }
    } catch (err) {
      console.error('Error in chat:', err);
      setChatError('Network error during chat.');
    } finally {
      setChatLoading(false);
    }
  };

  const currentSubtitlePath = activeLesson?.subtitles?.[activeLang];

  return (
    <div className="notes-panel">
      {/* Right Sidebar Tabs */}
      <div className="panel-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-notes-tabs)' }}>
        <button
          className={`panel-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
          style={{
            flex: 1,
            padding: '12px 6px',
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
            gap: '6px',
            transition: 'var(--transition-fast)'
          }}
        >
          <BookOpen size={14} /> Notes ({notes.length})
        </button>
        <button
          className={`panel-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
          style={{
            flex: 1,
            padding: '12px 6px',
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
            gap: '6px',
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
            padding: '12px 6px',
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
            gap: '6px',
            transition: 'var(--transition-fast)'
          }}
        >
          <MessageSquare size={14} /> AI Chat
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'notes' && (
        <>
          <div className="notes-scrollable">
            {notes.length === 0 ? (
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
        </>
      )}

      {activeTab === 'summary' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px' }}>
          {!currentSubtitlePath ? (
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
              <div className="empty-state-title">Gemini API Key Missing</div>
              <div className="empty-state-desc">
                Please enter your Gemini API Key in Settings to generate AI summaries.
              </div>
            </div>
          ) : summaryLoading ? (
            <div className="empty-state" style={{ height: '100%' }}>
              <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '12px' }} />
              <div className="empty-state-title">Analyzing Transcript...</div>
              <div className="empty-state-desc">Gemini is compiling your offline summary.</div>
            </div>
          ) : summary ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={12} style={{ color: 'var(--accent-green)' }} /> Saved to Disk (Offline)
                </span>
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
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', lineHeight: '1.5' }}>
                {renderMarkdown(summary)}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px 20px', height: '100%' }}>
              <FileText size={32} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
              <div className="empty-state-title">No Summary Generated</div>
              <div className="empty-state-desc">
                Summarize this video lesson based on the active ({activeLang.toUpperCase()}) subtitle track.
              </div>
              <button
                className="btn-add-note"
                style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={generateSummary}
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
      )}

      {activeTab === 'chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px' }}>
          {!currentSubtitlePath ? (
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
              <div className="empty-state-title">Gemini API Key Missing</div>
              <div className="empty-state-desc">
                Please enter your Gemini API Key in Settings to chat with lesson contexts.
              </div>
            </div>
          ) : (
            <>
              {/* Chat Log */}
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                {chatMessages.length === 0 ? (
                  <div className="empty-state" style={{ padding: '20px 10px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <MessageSquare size={32} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
                    <div className="empty-state-title">Grounding Chat</div>
                    <div className="empty-state-desc">
                      Ask quick questions based on the transcript subtitles of this lesson.
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        width: '100%'
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '85%',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          borderTopRightRadius: msg.role === 'user' ? '4px' : '12px',
                          borderTopLeftRadius: msg.role === 'user' ? '12px' : '4px',
                          background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-hover)',
                          border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                          color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                          fontSize: '0.825rem',
                          lineHeight: '1.4',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {msg.content}
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
                      <RefreshCw size={12} className="animate-spin" /> AI is formulating answer...
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
                  type="text"
                  placeholder="Ask about this video..."
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
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <Send size={14} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
      <div 
        className="resize-handle left-handle" 
        onPointerDown={onResizeStart} 
        onDoubleClick={onResizeReset} 
      />
    </div>
  );
}
