import React from 'react';

export default function DocViewer({ path, type }) {
  const src = `http://localhost:3001/api/resource?path=${encodeURIComponent(path)}`;

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
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
}
