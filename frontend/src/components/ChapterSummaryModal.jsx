import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  FileText,
  RefreshCw,
  Check,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Globe,
  Trash2,
  Send,
  ExternalLink
} from 'lucide-react';
import { renderMarkdown } from './markdown';
import { SUMMARY_LANGUAGES } from '../languages';

export default function ChapterSummaryModal({
  isOpen,
  onClose,
  section,
  coursePath,
  hasApiKey,
  aiProvider = 'gemini',
  defaultLang = 'en',
  onLanguageChange
}) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'chat'
  const [selectedLang, setSelectedLang] = useState(defaultLang);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCached, setIsCached] = useState(false);

  // Chat states
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  const providerName = aiProvider === 'anthropic' ? 'Anthropic' : aiProvider === 'openai' ? 'OpenAI' : 'Gemini';
  const genIdRef = useRef(0);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const sectionPath = section && coursePath ? `${coursePath}/${section.id}` : '';

  const [prevDefaultLang, setPrevDefaultLang] = useState(defaultLang);
  if (defaultLang !== prevDefaultLang) {
    setPrevDefaultLang(defaultLang);
    setSelectedLang(defaultLang);
  }

  const [prevSectionId, setPrevSectionId] = useState(section?.id);
  if (section?.id !== prevSectionId) {
    setPrevSectionId(section?.id);
    setChatMessages([]);
    setChatInput('');
    setChatError(null);
  }

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading, activeTab]);

  // Focus chat input when switching to chat tab
  useEffect(() => {
    if (activeTab === 'chat') {
      const timer = setTimeout(() => {
        chatInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Check cache only (does not call AI generation)
  const checkCache = useCallback(
    async (lang) => {
      if (!sectionPath) return;

      const genId = ++genIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const cacheRes = await fetch('/api/summarize-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sectionPath, langCode: lang, checkCacheOnly: true })
        });
        const cacheData = await cacheRes.json();
        if (genId !== genIdRef.current) return;

        if (cacheData.success && cacheData.summary) {
          setSummary(cacheData.summary);
          setIsCached(true);
        } else {
          setSummary('');
          setIsCached(false);
        }
      } catch (err) {
        if (genId !== genIdRef.current) return;
        console.error('Error checking chapter summary cache:', err);
        setSummary('');
        setIsCached(false);
      } finally {
        if (genId === genIdRef.current) {
          setLoading(false);
        }
      }
    },
    [sectionPath]
  );

  // Generate summary via AI API
  const generateSummary = useCallback(
    async (lang, forceRegenerate = false) => {
      if (!sectionPath) return;

      const lessons = (section?.lessons || []).map((l) => ({
        title: l.title,
        subtitle: l.subtitle,
        subtitles: l.subtitles
      }));

      const genId = ++genIdRef.current;
      setLoading(true);
      setError(null);
      setSummary('');

      try {
        if (forceRegenerate) {
          await fetch('/api/clear-section-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sectionPath, langCode: lang })
          });
        }

        const res = await fetch('/api/summarize-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sectionPath, langCode: lang, lessons })
        });
        const data = await res.json();
        if (genId !== genIdRef.current) return;

        if (data.success) {
          setSummary(data.summary);
          setIsCached(data.cached || false);
        } else {
          setError(data.error || 'Failed to generate chapter summary.');
        }
      } catch (err) {
        if (genId !== genIdRef.current) return;
        console.error('Error in chapter summary generation:', err);
        setError('Network error while summarizing chapter.');
      } finally {
        if (genId === genIdRef.current) {
          setLoading(false);
        }
      }
    },
    [sectionPath, section]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen && sectionPath) {
        checkCache(selectedLang);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, sectionPath, selectedLang, checkCache]);

  const handleLangChange = (newLang) => {
    setSelectedLang(newLang);
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
  };

  // Chat Submission Handler
  const handleChatSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading || !sectionPath) return;

    const userMessage = { role: 'user', content: chatInput.trim() };
    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);
    setChatError(null);

    const lessons = (section?.lessons || []).map((l) => ({
      title: l.title,
      subtitle: l.subtitle,
      subtitles: l.subtitles
    }));

    try {
      const response = await fetch('/api/chat-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionPath,
          messages: newMessages,
          langCode: selectedLang,
          enableWebSearch: webSearchEnabled,
          lessons
        })
      });
      const data = await response.json();
      if (data.success) {
        setChatMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: data.reply,
            sources: data.sources || [],
            searchedWeb: Boolean(webSearchEnabled && data.sources && data.sources.length > 0)
          }
        ]);
      } else {
        const errorText = data.error || 'Failed to get AI response for chapter.';
        setChatError(errorText);
        setChatMessages([...newMessages, { role: 'error', content: `❌ ${errorText}` }]);
      }
    } catch (err) {
      console.error('Error in chapter chat:', err);
      const errorText = 'Network error during chapter chat.';
      setChatError(errorText);
      setChatMessages([...newMessages, { role: 'error', content: `❌ ${errorText}` }]);
    } finally {
      setChatLoading(false);
      requestAnimationFrame(() => {
        chatInputRef.current?.focus();
      });
    }
  };

  const handleNewChat = () => {
    setChatMessages([]);
    setChatInput('');
    setChatError(null);
    requestAnimationFrame(() => {
      chatInputRef.current?.focus();
    });
  };

  const handlePromptSuggestion = (promptText) => {
    setChatInput(promptText);
    requestAnimationFrame(() => {
      chatInputRef.current?.focus();
    });
  };

  if (!isOpen || !section) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        style={{
          width: '760px',
          maxWidth: '92vw',
          height: '680px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px',
          background: 'var(--bg-main)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <Sparkles size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <h2
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {section.title}
              </h2>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginTop: '1px'
                }}
              >
                Chapter Overview • {section.lessons.length} lessons
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-hover)',
                padding: '3px',
                borderRadius: '8px',
                gap: '4px'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                style={{
                  background: activeTab === 'summary' ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === 'summary' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: activeTab === 'summary' ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: activeTab === 'summary' ? 'var(--shadow-sm)' : 'none',
                  transition: 'var(--transition-fast)'
                }}
              >
                <FileText size={13} style={{ color: activeTab === 'summary' ? 'var(--primary)' : 'inherit' }} />
                <span>Summary</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                style={{
                  background: activeTab === 'chat' ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === 'chat' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: activeTab === 'chat' ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: activeTab === 'chat' ? 'var(--shadow-sm)' : 'none',
                  transition: 'var(--transition-fast)'
                }}
              >
                <MessageSquare size={13} style={{ color: activeTab === 'chat' ? 'var(--primary)' : 'inherit' }} />
                <span>AI Chat</span>
                {chatMessages.length > 0 && (
                  <span
                    style={{
                      background: 'var(--primary)',
                      color: 'white',
                      fontSize: '0.65rem',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: 600
                    }}
                  >
                    {chatMessages.filter((m) => m.role === 'user').length}
                  </span>
                )}
              </button>
            </div>

            <button
              className="shortcuts-close-btn"
              onClick={onClose}
              title="Close (Esc)"
              style={{ flexShrink: 0 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar Bar */}
        <div
          style={{
            padding: '10px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-notes-tabs)',
            gap: '12px',
            minHeight: '45px'
          }}
        >
          {activeTab === 'summary' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    whiteSpace: 'nowrap'
                  }}
                >
                  Language:
                </label>
                <select
                  className="summary-lang-select"
                  value={selectedLang}
                  onChange={(e) => handleLangChange(e.target.value)}
                  disabled={loading}
                >
                  {Object.entries(SUMMARY_LANGUAGES).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {summary && !loading && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Check size={12} style={{ color: 'var(--accent-green)' }} />{' '}
                    {isCached ? 'Saved to Disk (Offline)' : 'Generated'}
                  </span>
                )}
                {hasApiKey && (
                  <button
                    onClick={() => generateSummary(selectedLang, true)}
                    disabled={loading}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      color: loading ? 'var(--text-muted)' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: loading ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.currentTarget.style.borderColor = 'var(--primary)';
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    Regenerate
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Chat Sub-toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Check size={12} style={{ color: 'var(--accent-green)' }} /> Grounded in Chapter Content
                </span>
                <button
                  type="button"
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  title={
                    webSearchEnabled
                      ? 'Web search enabled: AI can search the internet for current info'
                      : 'Web search disabled: AI answers strictly from chapter content'
                  }
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
              >
                <Trash2 size={12} /> New Chat
              </button>
            </>
          )}
        </div>

        {/* Content Body */}
        {activeTab === 'summary' ? (
          <div
            style={{
              flex: 1,
              padding: '24px',
              overflowY: 'auto',
              background: 'var(--bg-main)',
              transform: 'translateZ(0)'
            }}
          >
            {!hasApiKey ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <AlertCircle
                  size={32}
                  style={{ color: 'var(--accent-red)', marginBottom: '12px' }}
                />
                <div className="empty-state-title">{providerName} API Key Missing</div>
                <div className="empty-state-desc">
                  Please enter your {providerName} API Key in Settings to generate AI
                  chapter summaries.
                </div>
              </div>
            ) : loading ? (
              <div className="empty-state" style={{ padding: '50px 20px' }}>
                <RefreshCw
                  size={28}
                  className="animate-spin"
                  style={{ color: 'var(--primary)', marginBottom: '14px' }}
                />
                <div className="empty-state-title">
                  Summarizing Chapter Content...
                </div>
                <div className="empty-state-desc">
                  {providerName} is aggregating subtitle transcripts across all{' '}
                  {section.lessons.length} lessons in this chapter.
                </div>
              </div>
            ) : error ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <AlertCircle
                  size={32}
                  style={{ color: 'var(--accent-red)', marginBottom: '12px' }}
                />
                <div className="empty-state-title">Chapter Summary Failed</div>
                <div
                  style={{
                    color: 'var(--accent-red)',
                    fontSize: '0.8rem',
                    marginTop: '10px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}
                >
                  {error}
                </div>
                <button
                  className="btn-add-note"
                  style={{ marginTop: '16px' }}
                  onClick={() => generateSummary(selectedLang, true)}
                >
                  <RefreshCw size={14} style={{ marginRight: '6px' }} /> Try Again
                </button>
              </div>
            ) : summary ? (
              <div style={{ lineHeight: '1.6' }}>{renderMarkdown(summary)}</div>
            ) : (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <FileText
                  size={36}
                  style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}
                />
                <div className="empty-state-title">No Summary Generated</div>
                <div className="empty-state-desc">
                  Summarize all video lessons in "{section.title}" (
                  {SUMMARY_LANGUAGES[selectedLang] || selectedLang}).
                </div>
                <button
                  className="btn-add-note"
                  style={{ marginTop: '16px' }}
                  onClick={() => generateSummary(selectedLang, false)}
                >
                  <Sparkles size={14} style={{ marginRight: '6px' }} /> Generate
                  Chapter Summary
                </button>
              </div>
            )}
          </div>
        ) : (
          /* AI Chat Tab View */
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: '16px 20px',
              background: 'var(--bg-main)'
            }}
          >
            {!hasApiKey ? (
              <div className="empty-state" style={{ padding: '40px 20px', height: '100%' }}>
                <AlertCircle size={32} style={{ color: 'var(--accent-red)', marginBottom: '12px' }} />
                <div className="empty-state-title">{providerName} API Key Missing</div>
                <div className="empty-state-desc">
                  Please enter your {providerName} API Key in Settings to chat with chapter AI.
                </div>
              </div>
            ) : (
              <>
                {/* Chat Log */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    marginBottom: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    paddingRight: '6px'
                  }}
                >
                  {chatMessages.length === 0 ? (
                    <div
                      className="empty-state"
                      style={{
                        padding: '30px 20px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <MessageSquare size={36} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
                      <div className="empty-state-title">Chat about this Chapter</div>
                      <div className="empty-state-desc" style={{ maxWidth: '480px', margin: '0 auto 16px' }}>
                        Ask questions synthesizing concepts across all {section.lessons.length} lessons in "
                        {section.title}". Grounded in the chapter summary and lesson transcripts.
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() =>
                            handlePromptSuggestion(
                              'Can you give me an overview of the key concepts covered in this chapter?'
                            )
                          }
                          style={{
                            background: 'var(--bg-hover)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'var(--transition-fast)'
                          }}
                        >
                          💡 Overview of key concepts
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handlePromptSuggestion(
                              'What are the most important actionable takeaways from these lessons?'
                            )
                          }
                          style={{
                            background: 'var(--bg-hover)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'var(--transition-fast)'
                          }}
                        >
                          🎯 Actionable takeaways
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handlePromptSuggestion(
                              'How do the lessons in this chapter connect with each other?'
                            )
                          }
                          style={{
                            background: 'var(--bg-hover)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'var(--transition-fast)'
                          }}
                        >
                          🔗 How lessons connect
                        </button>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent:
                            msg.role === 'user'
                              ? 'flex-end'
                              : msg.role === 'error'
                              ? 'center'
                              : 'flex-start',
                          width: '100%'
                        }}
                      >
                        <div
                          style={{
                            maxWidth: msg.role === 'error' ? '90%' : '85%',
                            padding: '12px 16px',
                            borderRadius: '14px',
                            borderTopRightRadius: msg.role === 'user' ? '4px' : '14px',
                            borderTopLeftRadius: msg.role === 'user' ? '14px' : '4px',
                            background:
                              msg.role === 'user'
                                ? 'var(--primary)'
                                : msg.role === 'error'
                                ? 'rgba(239, 68, 68, 0.1)'
                                : 'var(--bg-hover)',
                            border:
                              msg.role === 'error'
                                ? '1px solid rgba(239, 68, 68, 0.2)'
                                : msg.role === 'user'
                                ? 'none'
                                : '1px solid var(--border-color)',
                            color:
                              msg.role === 'error'
                                ? 'var(--accent-red)'
                                : msg.role === 'user'
                                ? 'white'
                                : 'var(--text-primary)',
                            fontSize: msg.role === 'error' ? '0.8rem' : '0.85rem',
                            lineHeight: '1.5',
                            wordBreak: 'break-word'
                          }}
                        >
                          {msg.role === 'user' ? (
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                          ) : msg.role === 'error' ? (
                            <div>{msg.content}</div>
                          ) : (
                            <div style={{ lineHeight: '1.6' }}>
                              {renderMarkdown(msg.content)}
                            </div>
                          )}

                          {msg.sources && msg.sources.length > 0 && (
                            <div
                              style={{
                                marginTop: '10px',
                                paddingTop: '8px',
                                borderTop: '1px solid var(--border-color)',
                                fontSize: '0.75rem'
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 600,
                                  color: 'var(--text-secondary)',
                                  marginBottom: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
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
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.textDecoration = 'underline')
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.textDecoration = 'none')
                                    }
                                    title={source.title || source.url}
                                  >
                                    <ExternalLink size={10} style={{ flexShrink: 0 }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {source.title || source.url}
                                    </span>
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
                          padding: '10px 14px',
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
                        <RefreshCw size={12} className="animate-spin" />{' '}
                        {webSearchEnabled
                          ? 'Searching web & formulating answer...'
                          : 'AI is formulating answer...'}
                      </div>
                    </div>
                  )}

                  {chatError && (
                    <div
                      style={{
                        color: 'var(--accent-red)',
                        fontSize: '0.75rem',
                        padding: '8px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px'
                      }}
                    >
                      {chatError}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input form */}
                <form
                  onSubmit={handleChatSubmit}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '12px'
                  }}
                >
                  <input
                    ref={chatInputRef}
                    type="text"
                    placeholder={`Ask a question about "${section.title}"...`}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    style={{
                      flex: 1,
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '9px 14px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      transition: 'var(--transition-fast)'
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    style={{
                      background: 'var(--primary)',
                      border: 'none',
                      borderRadius: '8px',
                      width: '38px',
                      height: '38px',
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
                    <Send size={15} />
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
