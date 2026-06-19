import React, { useState, useEffect } from 'react';
import { FolderOpen } from 'lucide-react';

export default function CourseSelector({ currentPath, history, onSelectPath }) {
  const [inputPath, setInputPath] = useState(currentPath || '');

  useEffect(() => {
    if (currentPath) {
      setInputPath(currentPath);
    }
  }, [currentPath]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputPath.trim()) {
      onSelectPath(inputPath.trim());
    }
  };

  return (
    <form className="course-loader-form" onSubmit={handleSubmit}>
      <FolderOpen size={18} style={{ color: 'var(--text-secondary)', minWidth: '18px' }} />
      <input
        type="text"
        className="input-path"
        placeholder="Paste absolute path to downloaded Udemy course..."
        value={inputPath}
        onChange={(e) => setInputPath(e.target.value)}
      />
      {history && history.length > 1 && (
        <select
          value={currentPath}
          onChange={(e) => {
            setInputPath(e.target.value);
            onSelectPath(e.target.value);
          }}
          style={{
            background: 'var(--bg-input)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '8px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            maxWidth: '150px',
            outline: 'none'
          }}
        >
          {history.map((histPath, idx) => (
            <option key={idx} value={histPath}>
              {histPath.split('/').pop()}
            </option>
          ))}
        </select>
      )}
      <button type="submit" className="btn-load">
        Scan Course
      </button>
    </form>
  );
}
