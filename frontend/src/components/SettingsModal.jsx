import React, { useState } from 'react';
import { X, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function SettingsModal({ settings, onSave, onClose }) {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    const result = await onSave({ geminiApiKey: apiKey.trim() });
    setSaving(false);
    if (result) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    }
  };

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
                type={showKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
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
                onClick={() => setShowKey(!showKey)}
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
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
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
              Required for Vietnamese subtitle translation. Get a free API key from the{' '}
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

          {/* Alert check */}
          {apiKey && (
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
