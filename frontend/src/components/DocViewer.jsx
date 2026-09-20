import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, FolderOpen, ExternalLink } from 'lucide-react';
import { revealResourceInFolder, openResourceFile, getFileManagerName } from '../utils/fileActions';

export default function DocViewer({ path, type }) {
  const src = `/api/resource?path=${encodeURIComponent(path)}`;
  const [prevPath, setPrevPath] = useState(path);
  const [zoom, setZoom] = useState(1);
  const fileManagerName = getFileManagerName();

  // Reset zoom when the file path changes
  if (prevPath !== path) {
    setPrevPath(path);
    setZoom(1);
  }

  const handleZoomIn = () => {
    setZoom((z) => Math.min(z + 0.1, 2.5));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const handleLoad = (e) => {
    if (type !== 'html') return;
    try {
      const iframe = e.target;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Intercept any click event on anchor elements in the iframe
      iframeDoc.addEventListener('click', (event) => {
        const anchor = event.target.closest('a');
        if (anchor) {
          const href = anchor.getAttribute('href');
          
          // If it is a valid link and doesn't start with a hash (#), open in a new tab
          if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            event.preventDefault();
            window.open(href, '_blank', 'noopener,noreferrer');
          }
        }
      });
    } catch (err) {
      console.error('Failed to attach link interception inside iframe:', err);
    }
  };

  return (
    <div className="document-frame-container" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Top Controls Bar */}
      <div
        className="doc-header-controls"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          background: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border-color)',
          justifyContent: 'space-between',
          zIndex: 10
        }}
      >
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {type === 'pdf' ? 'PDF Document' : 'HTML Document'}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {type === 'html' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '6px' }}>
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                disabled={zoom <= 0.5}
                style={{
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)',
                  color: zoom <= 0.5 ? 'var(--text-muted)' : 'var(--text-primary)',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  cursor: zoom <= 0.5 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'var(--transition-fast)'
                }}
              >
                <ZoomOut size={13} />
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', minWidth: '42px', textAlign: 'center', fontWeight: 600 }}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                disabled={zoom >= 2.5}
                style={{
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)',
                  color: zoom >= 2.5 ? 'var(--text-muted)' : 'var(--text-primary)',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  cursor: zoom >= 2.5 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'var(--transition-fast)'
                }}
              >
                <ZoomIn size={13} />
              </button>
              <button
                onClick={handleResetZoom}
                title="Reset Zoom"
                style={{
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'var(--transition-fast)'
                }}
              >
                <RotateCcw size={13} />
              </button>
            </div>
          )}

          <button
            onClick={() => revealResourceInFolder(path)}
            title={`Show in ${fileManagerName}`}
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: 'var(--primary-light, #818cf8)',
              padding: '5px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
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

          <button
            onClick={() => openResourceFile(path)}
            title="Open in default system app"
            style={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              padding: '5px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--border-active)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <ExternalLink size={14} />
            <span>Open</span>
          </button>
        </div>
      </div>

      {/* Frame content */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        {type === 'pdf' ? (
          <embed
            src={src}
            type="application/pdf"
            className="document-frame"
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <iframe
            src={src}
            title="Lesson Resource"
            className="document-frame"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              background: 'white',
              border: 'none',
              transition: 'transform 0.1s ease-out, width 0.1s ease-out, height 0.1s ease-out'
            }}
            sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
            onLoad={handleLoad}
          />
        )}
      </div>
    </div>
  );
}
