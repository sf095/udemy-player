import React from 'react';
import { FileText, Globe, Link, FileIcon, ExternalLink, Download } from 'lucide-react';

export default function ResourceList({ resources, activeResource, onSelectResource }) {
  const getIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FileText size={18} style={{ color: 'var(--primary)' }} />;
      case 'html':
        return <Globe size={18} style={{ color: 'var(--accent-amber)' }} />;
      case 'url':
        return <Link size={18} style={{ color: 'var(--accent-blue)' }} />;
      default:
        return <FileIcon size={18} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  return (
    <div className="resource-list-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', gap: '16px' }}>
      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        Lesson Resources ({resources.length})
      </h4>
      <div className="resource-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
        {resources.map((res, index) => {
          const isPreviewable = res.type === 'pdf' || res.type === 'html';
          const isActive = activeResource && activeResource.path === res.path;
          
          const handleItemClick = (e) => {
            if (isPreviewable) {
              onSelectResource(res);
            } else if (res.type === 'url') {
              window.open(res.path, '_blank', 'noopener,noreferrer');
            } else {
              // Standard file, trigger download
              const downloadUrl = `/api/resource?path=${encodeURIComponent(res.path)}`;
              window.open(downloadUrl, '_blank');
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
                transition: 'var(--transition-fast)'
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
                {getIcon(res.type)}
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
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                {res.type === 'url' ? (
                  <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
                ) : isPreviewable ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Preview</span>
                ) : (
                  <Download size={16} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
