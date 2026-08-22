import { useState, useEffect, useCallback, useRef } from 'react';
import { X, FileText, RefreshCw, Check, AlertCircle, Sparkles } from 'lucide-react';
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
  const [selectedLang, setSelectedLang] = useState(defaultLang);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCached, setIsCached] = useState(false);

  const providerName = aiProvider === 'anthropic' ? 'Anthropic' : 'Gemini';
  const genIdRef = useRef(0);

  const sectionPath = section && coursePath ? `${coursePath}/${section.id}` : '';

  useEffect(() => {
    if (isOpen) {
      setSelectedLang(defaultLang);
    }
  }, [isOpen, defaultLang]);

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

  if (!isOpen || !section) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        style={{
          width: '720px',
          maxWidth: '90vw',
          maxHeight: '85vh',
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
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <h2
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0
                }}
              >
                Chapter Summary
              </h2>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginTop: '2px'
                }}
              >
                {section.title} ({section.lessons.length} lessons)
              </span>
            </div>
          </div>
          <button
            className="shortcuts-close-btn"
            onClick={onClose}
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar Bar */}
        <div
          style={{
            padding: '12px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-notes-tabs)',
            gap: '12px'
          }}
        >
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
                  padding: '6px 12px',
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
        </div>

        {/* Content Body */}
        <div
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
            background: 'var(--bg-main)',
            // Promote to a compositor layer so scrolling stays on the GPU and
            // does not repaint the overlay (which would flash the app behind).
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
                Summarize all video lessons in "{section.title}" ({SUMMARY_LANGUAGES[selectedLang] || selectedLang}).
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
      </div>
    </div>
  );
}
