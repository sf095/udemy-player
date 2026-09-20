import { FileText, Globe, Link, FileIcon, ExternalLink, HelpCircle, FolderOpen, Archive, FileCode } from 'lucide-react';
import { revealResourceInFolder, getFileManagerName } from '../utils/fileActions';

export default function ResourceList({ resources, activeResource, onSelectResource }) {
  const fileManagerName = getFileManagerName();

  const getIcon = (res) => {
    switch (res.type) {
      case 'pdf':
        return <FileText size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />;
      case 'html':
        return <Globe size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />;
      case 'quiz':
        return <HelpCircle size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />;
      case 'url':
        return <Link size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />;
      default: {
        const ext = (res.ext || '').toLowerCase();
        if (['.zip', '.tar', '.gz', '.rar', '.7z'].includes(ext)) {
          return <Archive size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />;
        }
        if (['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.cs', '.go', '.rs', '.sql', '.sh', '.css', '.json'].includes(ext)) {
          return <FileCode size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />;
        }
        return <FileIcon size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />;
      }
    }
  };

  return (
    <div className="resource-list-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', gap: '16px' }}>
      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        Lesson Resources ({resources.length})
      </h4>
      <div className="resource-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
        {resources.map((res, index) => {
          const isPreviewable = res.type === 'pdf' || res.type === 'html' || res.type === 'quiz';
          const isActive = activeResource && activeResource.path === res.path;
          
          const handleItemClick = () => {
            if (res.type === 'url') {
              window.open(res.path, '_blank', 'noopener,noreferrer');
            } else {
              onSelectResource(res);
            }
          };

          return (
            <div
              key={index}
              className={`resource-card ${isActive ? 'active' : ''}`}
              onClick={handleItemClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '8px',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-input)',
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--border-active)';
                  e.currentTarget.style.background = 'var(--bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'var(--bg-input)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                {getIcon(res)}
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span
                    className="resource-title"
                    title={res.title}
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {res.title}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={res.name}>
                    {res.type.toUpperCase()} • {res.name}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {res.type === 'url' ? (
                  <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
                ) : isPreviewable ? (
                  <>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Preview</span>
                    <button
                      className="resource-reveal-btn"
                      title={`Show in ${fileManagerName}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        revealResourceInFolder(res.path);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '4px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--primary)';
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <FolderOpen size={15} />
                    </button>
                  </>
                ) : (
                  <button
                    className="resource-reveal-btn"
                    title={`Show in ${fileManagerName}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      revealResourceInFolder(res.path);
                    }}
                    style={{
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: 'var(--primary-light, #818cf8)',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      transition: 'var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--primary)';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
                      e.currentTarget.style.color = 'var(--primary-light, #818cf8)';
                    }}
                  >
                    <FolderOpen size={14} />
                    <span>{fileManagerName}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
