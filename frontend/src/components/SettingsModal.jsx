import React, { useState } from 'react';
import { X, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const DEFAULT_SETTINGS = {
  aiProvider: 'gemini',
  geminiApiKey: '',
  anthropicApiKey: '',
  anthropicModel: 'claude-3-5-sonnet-latest',
  anthropicBaseUrl: 'https://api.anthropic.com',
  autoplayNext: false,
  autoCreateTimeline: false,
  autoCreateTimelineLang: 'en',
  autoCreateSummary: false,
  autoCreateSummaryLang: 'en'
};

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'it', name: 'Italian' }
];

export default function SettingsModal({ settings, onSave, onClose }) {
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  const [aiProvider, setAiProvider] = useState(merged.aiProvider);
  const [geminiApiKey, setGeminiApiKey] = useState(merged.geminiApiKey);
  const [anthropicApiKey, setAnthropicApiKey] = useState(merged.anthropicApiKey);
  const [anthropicModel, setAnthropicModel] = useState(merged.anthropicModel);
  const [anthropicBaseUrl, setAnthropicBaseUrl] = useState(merged.anthropicBaseUrl);
  const [autoplayNext, setAutoplayNext] = useState(merged.autoplayNext);
  const [autoCreateTimeline, setAutoCreateTimeline] = useState(merged.autoCreateTimeline);
  const [autoCreateTimelineLang, setAutoCreateTimelineLang] = useState(merged.autoCreateTimelineLang);
  const [autoCreateSummary, setAutoCreateSummary] = useState(merged.autoCreateSummary);
  const [autoCreateSummaryLang, setAutoCreateSummaryLang] = useState(merged.autoCreateSummaryLang);

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    const result = await onSave({
      aiProvider,
      geminiApiKey: geminiApiKey.trim(),
      anthropicApiKey: anthropicApiKey.trim(),
      anthropicModel: anthropicModel.trim() || 'claude-3-5-sonnet-latest',
      anthropicBaseUrl: anthropicBaseUrl.trim() || 'https://api.anthropic.com',
      autoplayNext,
      autoCreateTimeline,
      autoCreateTimelineLang,
      autoCreateSummary,
      autoCreateSummaryLang
    });
    setSaving(false);
    if (result) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    }
  };

  const isKeyEntered = aiProvider === 'anthropic' ? !!anthropicApiKey : !!geminiApiKey;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container settings-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          animation: 'fade-in 0.2s ease'
        }}
      >
        {/* Header */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Application Settings</h2>
          <button 
            onClick={onClose} 
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px',
              borderRadius: '4px',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {/* AI Provider dropdown */}
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="ai-provider" 
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              Active AI Provider
            </label>
            <select
              id="ai-provider"
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              <option value="gemini">Google Gemini</option>
              <option value="anthropic">Anthropic Claude / Compatible</option>
            </select>
          </div>

          {/* Conditional provider inputs */}
          {aiProvider === 'gemini' ? (
            <div style={{ marginBottom: '20px' }}>
              <label 
                htmlFor="gemini-key" 
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}
              >
                Gemini API Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="gemini-key"
                  type={showGeminiKey ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px 40px 10px 12px',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'var(--transition-fast)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p 
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginTop: '8px',
                  lineHeight: 1.4
                }}
              >
                Required for translation, summarization, and AI chat. Get a free API key from{' '}
                <a 
                  href="https://aistudio.google.com/" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Google AI Studio
                </a>.
              </p>
            </div>
          ) : (
            <>
              {/* Anthropic API Key */}
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="anthropic-key" 
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }}
                >
                  Anthropic API Key
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="anthropic-key"
                    type={showAnthropicKey ? 'text' : 'password'}
                    placeholder="sk-ant-api03-..."
                    value={anthropicApiKey}
                    onChange={(e) => setAnthropicApiKey(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '10px 40px 10px 12px',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'var(--transition-fast)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    {showAnthropicKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Anthropic Model */}
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="anthropic-model" 
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }}
                >
                  Claude Model Name
                </label>
                <input
                  id="anthropic-model"
                  type="text"
                  placeholder="claude-3-5-sonnet-latest"
                  value={anthropicModel}
                  onChange={(e) => setAnthropicModel(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'var(--transition-fast)'
                  }}
                />
              </div>

              {/* Anthropic Custom Base URL */}
              <div style={{ marginBottom: '20px' }}>
                <label 
                  htmlFor="anthropic-url" 
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }}
                >
                  Custom Base URL (Optional)
                </label>
                <input
                  id="anthropic-url"
                  type="text"
                  placeholder="https://api.anthropic.com"
                  value={anthropicBaseUrl}
                  onChange={(e) => setAnthropicBaseUrl(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'var(--transition-fast)'
                  }}
                />
                <p 
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginTop: '8px',
                    lineHeight: 1.4
                  }}
                >
                  Leave default or point to Anthropic-compatible proxies/backends (e.g. OpenRouter, self-hosted LLM routers).
                </p>
              </div>
            </>
          )}
          {/* Autoplay Next Video */}
          <div style={{ marginBottom: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <label 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}
            >
              <input
                type="checkbox"
                checked={autoplayNext}
                onChange={(e) => setAutoplayNext(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: 'var(--primary)',
                  cursor: 'pointer'
                }}
              />
              <span>Autoplay Next Video</span>
            </label>
            <p 
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginTop: '6px',
                marginLeft: '28px',
                lineHeight: 1.4
              }}
            >
              Automatically start playing the next lesson video when the current video ends.
            </p>
          </div>

          {/* AI Auto-generation Settings */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>AI Auto-generation</h4>
            
            {/* Automatically Create Timeline */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <label 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={autoCreateTimeline}
                    onChange={(e) => setAutoCreateTimeline(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: 'var(--primary)',
                      cursor: 'pointer'
                    }}
                  />
                  <span>Automatically Create Timeline Chapters</span>
                </label>
                  <select
                    disabled={!autoCreateTimeline}
                    value={autoCreateTimelineLang}
                    onChange={(e) => setAutoCreateTimelineLang(e.target.value)}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      outline: 'none',
                      cursor: autoCreateTimeline ? 'pointer' : 'not-allowed',
                      opacity: autoCreateTimeline ? 1 : 0.5
                    }}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
              </div>
              <p 
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginTop: '6px',
                  marginLeft: '28px',
                  lineHeight: 1.4
                }}
              >
                Generate video chapters on the playback timeline using subtitles and AI when a video is loaded (if not cached).
              </p>
            </div>

            {/* Automatically Create Summary */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <label 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={autoCreateSummary}
                    onChange={(e) => setAutoCreateSummary(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: 'var(--primary)',
                      cursor: 'pointer'
                    }}
                  />
                  <span>Automatically Create Lesson Summary</span>
                </label>
                  <select
                    disabled={!autoCreateSummary}
                    value={autoCreateSummaryLang}
                    onChange={(e) => setAutoCreateSummaryLang(e.target.value)}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      outline: 'none',
                      cursor: autoCreateSummary ? 'pointer' : 'not-allowed',
                      opacity: autoCreateSummary ? 1 : 0.5
                    }}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
              </div>
              <p 
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginTop: '6px',
                  marginLeft: '28px',
                  lineHeight: 1.4
                }}
              >
                Generate lesson summaries using subtitles and AI when a lesson is loaded (if not cached).
              </p>
            </div>
          </div>

          {/* Alert check */}
          {isKeyEntered && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginBottom: '20px'
              }}
            >
              <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--primary)' }} />
              <div>
                <strong>Secure Storage:</strong> This key will be saved locally inside your offline database and is never shared or uploaded elsewhere.
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '24px'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: success ? 'var(--accent-green)' : 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                if (!success) e.currentTarget.style.background = 'var(--primary-hover)';
              }}
              onMouseLeave={(e) => {
                if (!success) e.currentTarget.style.background = 'var(--primary)';
              }}
            >
              {saving ? 'Saving...' : success ? 'Saved ✓' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
