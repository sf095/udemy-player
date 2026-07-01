import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function DocViewer({ path, type }) {
  const src = `/api/resource?path=${encodeURIComponent(path)}`;
  const [zoom, setZoom] = useState(1);

  // Reset zoom when the file path changes
  useEffect(() => {
    setZoom(1);
  }, [path]);

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

  if (type === 'pdf') {
    return (
      <div className="document-frame-container" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <embed
          src={src}
          type="application/pdf"
          className="document-frame"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  // HTML content
  return (
    <div className="document-frame-container" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Zoom Control Bar */}
      <div
        className="zoom-controls"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          background: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border-color)',
          justifyContent: 'flex-end',
          zIndex: 10
        }}
      >
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: 'auto', fontWeight: 500 }}>
          HTML Preview
        </span>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          disabled={zoom <= 0.5}
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-color)',
            color: zoom <= 0.5 ? 'var(--text-muted)' : 'var(--text-primary)',
            padding: '6px 10px',
            borderRadius: '6px',
            cursor: zoom <= 0.5 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'var(--transition-fast)'
          }}
        >
          <ZoomOut size={14} />
        </button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', minWidth: '45px', textAlign: 'center', fontWeight: 600 }}>
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
            padding: '6px 10px',
            borderRadius: '6px',
            cursor: zoom >= 2.5 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'var(--transition-fast)'
          }}
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={handleResetZoom}
          title="Reset Zoom"
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '6px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'var(--transition-fast)'
          }}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Frame content */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
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
      </div>
    </div>
  );
}
