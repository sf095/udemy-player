export default function DocViewer({ path, type }) {
  const src = `/api/resource?path=${encodeURIComponent(path)}`;

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
    <div className="document-frame-container" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <iframe
        src={src}
        title="Lesson Resource"
        className="document-frame"
        style={{ width: '100%', height: '100%', background: 'white' }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
        onLoad={handleLoad}
      />
    </div>
  );
}
