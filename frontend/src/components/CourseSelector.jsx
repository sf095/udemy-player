import React, { useState, useEffect } from 'react';
import { FolderOpen, Loader2, Folders, ChevronDown } from 'lucide-react';

export default function CourseSelector({ currentPath, history, onSelectPath, onManageCourses }) {
  const [inputPath, setInputPath] = useState(currentPath || '');
  const [isBrowsing, setIsBrowsing] = useState(false);

  useEffect(() => {
    if (currentPath) {
      setInputPath(currentPath);
    }
  }, [currentPath]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputPath.trim() && !isBrowsing) {
      onSelectPath(inputPath.trim());
    }
  };

  const handleBrowse = async () => {
    if (isBrowsing) return;
    setIsBrowsing(true);
    try {
      if (window.electronAPI) {
        const data = await window.electronAPI.browseFolder();
        if (data.selectedPath) {
          setInputPath(data.selectedPath);
          onSelectPath(data.selectedPath);
        }
      } else {
        const res = await fetch('/api/browse-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.selectedPath) {
          setInputPath(data.selectedPath);
          onSelectPath(data.selectedPath);
        } else if (data.error) {
          alert(`Error opening folder selector: ${data.error}`);
        }
      }
    } catch (err) {
      console.error('Failed to browse folder', err);
      alert('Failed to connect to backend server.');
    } finally {
      setIsBrowsing(false);
    }
  };

  return (
    <form className="course-loader-form" onSubmit={handleSubmit}>
      <div className="input-path-wrapper">
        {isBrowsing ? (
          <Loader2 size={18} className="spinner icon-prefix" style={{ color: 'var(--primary)' }} />
        ) : (
          <FolderOpen size={18} className="icon-prefix" />
        )}
        <input
          type="text"
          className="input-path"
          placeholder={isBrowsing ? "Opening native folder picker..." : "Paste absolute path to downloaded Udemy course..."}
          value={inputPath}
          onChange={(e) => setInputPath(e.target.value)}
          disabled={isBrowsing}
        />
      </div>

      <button
        type="button"
        className="btn-browse"
        onClick={handleBrowse}
        disabled={isBrowsing}
      >
        {isBrowsing ? (
          <Loader2 size={16} className="spinner" />
        ) : (
          <FolderOpen size={16} style={{ color: 'var(--text-secondary)' }} />
        )}
        <span className="btn-browse-text">{isBrowsing ? 'Browsing...' : 'Browse...'}</span>
      </button>

      {history && history.length > 1 && (
        <div className="select-history-wrapper">
          <select
            value={currentPath}
            onChange={(e) => {
              setInputPath(e.target.value);
              onSelectPath(e.target.value);
            }}
            disabled={isBrowsing}
            className="select-history"
          >
            {history.map((histPath, idx) => {
              const parts = histPath.split(/[/\\]/).filter(Boolean);
              const dirName = parts.pop() || histPath;
              return (
                <option key={idx} value={histPath}>
                  {dirName}
                </option>
              );
            })}
          </select>
          <ChevronDown size={16} className="select-chevron" />
        </div>
      )}

      {history && history.length > 0 && (
        <button
          type="button"
          className="btn-browse btn-manage-courses"
          onClick={onManageCourses}
          disabled={isBrowsing}
          title="Manage Opened Courses"
        >
          <Folders size={16} style={{ color: 'var(--text-secondary)' }} />
        </button>
      )}

      <button type="submit" className="btn-load" disabled={isBrowsing || !inputPath.trim()}>
        Scan Course
      </button>
    </form>
  );
}
