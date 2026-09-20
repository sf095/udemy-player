import { useState } from 'react';
import { FolderOpen, ExternalLink, Archive, FileCode, FileText, Link, Copy, Check } from 'lucide-react';
import { revealResourceInFolder, openResourceFile, getFileManagerName } from '../utils/fileActions';

export default function LocalResourceCard({ resource }) {
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const fileManagerName = getFileManagerName();

  if (!resource) return null;

  const isUrl = resource.type === 'url';
  const ext = (resource.ext || '').toLowerCase();

  const getFileBadgeText = () => {
    if (isUrl) return 'EXTERNAL LINK';
    if (['.zip', '.tar', '.gz', '.rar', '.7z'].includes(ext)) return `${ext.slice(1).toUpperCase()} ARCHIVE`;
    if (['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.cs', '.go', '.rs', '.sql', '.sh', '.css', '.json'].includes(ext)) {
      return `${ext.slice(1).toUpperCase()} CODE`;
    }
    if (ext) return `${ext.slice(1).toUpperCase()} FILE`;
    return 'LOCAL FILE';
  };

  const getBigIcon = () => {
    if (isUrl) {
      return <Link size={44} style={{ color: 'var(--accent-blue)' }} />;
    }
    if (['.zip', '.tar', '.gz', '.rar', '.7z'].includes(ext)) {
      return <Archive size={44} style={{ color: 'var(--accent-amber)' }} />;
    }
    if (['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.cs', '.go', '.rs', '.sql', '.sh', '.css', '.json'].includes(ext)) {
      return <FileCode size={44} style={{ color: 'var(--accent-blue)' }} />;
    }
    return <FileText size={44} style={{ color: 'var(--primary)' }} />;
  };

  const handleCopyPath = () => {
    if (!resource.path) return;
    navigator.clipboard.writeText(resource.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReveal = async () => {
    setStatusMessage(null);
    const result = await revealResourceInFolder(resource.path);
    if (!result.success && result.error) {
      setStatusMessage(`Error: ${result.error}`);
    }
  };

  const handleOpen = async () => {
    setStatusMessage(null);
    if (isUrl) {
      window.open(resource.path, '_blank', 'noopener,noreferrer');
      return;
    }
    const result = await openResourceFile(resource.path);
    if (!result.success && result.error) {
      setStatusMessage(`Error: ${result.error}`);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '32px 20px',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '540px',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '36px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '20px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Icon container */}
        <div style={{
          width: '84px',
          height: '84px',
          borderRadius: '20px',
          background: 'var(--bg-hover)',
          border: '1px solid var(--border-active)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '4px'
        }}>
          {getBigIcon()}
        </div>

        {/* Badge & Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            padding: '4px 10px',
            borderRadius: '100px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--primary-light, #818cf8)',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            {getFileBadgeText()}
          </span>

          <h3 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            wordBreak: 'break-word',
            lineHeight: 1.4
          }}>
            {resource.title || resource.name}
          </h3>

          {resource.title !== resource.name && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
              {resource.name}
            </span>
          )}
        </div>

        {/* Path container with Copy button */}
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '8px 12px',
          textAlign: 'left'
        }}>
          <span
            style={{
              flex: 1,
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={resource.path}
          >
            {resource.path}
          </span>
          <button
            onClick={handleCopyPath}
            title={copied ? 'Copied to clipboard!' : 'Copy file path'}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: copied ? 'var(--accent-green, #10b981)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: '4px',
              flexShrink: 0,
              transition: 'var(--transition-fast)'
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', width: '100%', marginTop: '8px' }}>
          {isUrl ? (
            <button
              onClick={handleOpen}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              <ExternalLink size={16} />
              Open in Browser
            </button>
          ) : (
            <>
              <button
                onClick={handleReveal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                <FolderOpen size={16} />
                Show in {fileManagerName}
              </button>

              <button
                onClick={handleOpen}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-hover)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-active)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'var(--bg-hover)';
                }}
              >
                <ExternalLink size={15} />
                Open File
              </button>
            </>
          )}
        </div>

        {statusMessage && (
          <span style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '4px' }}>
            {statusMessage}
          </span>
        )}
      </div>
    </div>
  );
}
