import React, { useState } from 'react';
import { X, Trash2, Edit2, Check, FolderOpen, Loader2, Play } from 'lucide-react';

export default function CourseManagerModal({ currentPath, history, onSelectPath, onDeletePath, onModifyPath, onClose }) {
  const [editingPath, setEditingPath] = useState(null); // stores the path being edited (string)
  const [editValue, setEditValue] = useState('');
  const [errorPath, setErrorPath] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingPath, setLoadingPath] = useState('');

  const handleStartEdit = (path) => {
    setEditingPath(path);
    setEditValue(path);
    setErrorPath('');
    setErrorMessage('');
  };

  const handleCancelEdit = () => {
    setEditingPath(null);
    setEditValue('');
    setErrorPath('');
    setErrorMessage('');
  };

  const handleBrowseForEdit = async () => {
    try {
      let selectedPath = null;
      if (window.electronAPI) {
        const data = await window.electronAPI.browseFolder();
        if (data.selectedPath) {
          selectedPath = data.selectedPath;
        }
      } else {
        const res = await fetch('/api/browse-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.selectedPath) {
          selectedPath = data.selectedPath;
        }
      }
      if (selectedPath) {
        setEditValue(selectedPath);
      }
    } catch (err) {
      console.error('Failed to browse folder', err);
    }
  };

  const handleSaveEdit = async (oldPath) => {
    const trimmedVal = editValue.trim();
    if (!trimmedVal) return;

    setLoadingPath(oldPath);
    setErrorPath('');
    setErrorMessage('');

    try {
      const success = await onModifyPath(oldPath, trimmedVal);
      if (success) {
        setEditingPath(null);
      } else {
        setErrorPath(oldPath);
        setErrorMessage('Failed to modify course path. Ensure the path is valid and exists on disk.');
      }
    } catch (err) {
      setErrorPath(oldPath);
      setErrorMessage('Network or server error.');
    } finally {
      setLoadingPath('');
    }
  };

  const handleDelete = async (path) => {
    const confirmDelete = window.confirm(`Are you sure you want to remove this course from history?\n\nPath: ${path}\n\nNote: Your course progress and notes are kept safe.`);
    if (confirmDelete) {
      await onDeletePath(path);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container course-manager-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '600px',
          background: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          animation: 'fade-in 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh'
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
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Manage Opened Courses</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Switch, edit, or remove previously loaded course paths
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              padding: '6px',
              borderRadius: '6px',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {(!history || history.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <p>No opened courses in your history yet.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Load a course folder using the scanner to see it here.</p>
            </div>
          ) : (
            history.map((pathItem, index) => {
              const isActive = currentPath === pathItem;
              const isEditing = editingPath === pathItem;
              const isLoading = loadingPath === pathItem;
              const hasError = errorPath === pathItem;
              const parts = pathItem.split(/[/\\]/).filter(Boolean);
              const dirName = parts.pop() || pathItem;

              return (
                <div
                  key={index}
                  style={{
                    background: isActive ? 'rgba(99, 102, 241, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                    border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  {!isEditing ? (
                    // Display Mode
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flex: 1,
                          minWidth: 0,
                          cursor: isActive ? 'default' : 'pointer'
                        }}
                        onClick={() => {
                          if (!isActive) {
                            onSelectPath(pathItem);
                            onClose();
                          }
                        }}
                      >
                        <div
                          style={{
                            background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            padding: '10px',
                            borderRadius: '8px',
                            color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <FolderOpen size={18} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h3
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              margin: 0
                            }}
                          >
                            {dirName}
                          </h3>
                          <p
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              direction: 'rtl',
                              textAlign: 'left',
                              marginTop: '2px',
                              margin: 0
                            }}
                          >
                            {pathItem}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {isActive && (
                          <span
                            style={{
                              background: 'rgba(74, 222, 128, 0.15)',
                              color: '#4ade80',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid rgba(74, 222, 128, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Play size={10} style={{ fill: '#4ade80' }} />
                            Active
                          </span>
                        )}

                        <button
                          onClick={() => handleStartEdit(pathItem)}
                          title="Edit Course Path"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            padding: '6px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            transition: 'var(--transition-fast)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                            e.currentTarget.style.color = 'var(--primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }}
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => handleDelete(pathItem)}
                          title="Remove from History"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            padding: '6px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            transition: 'var(--transition-fast)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.color = '#ef4444';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Edit Mode
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            disabled={isLoading}
                            placeholder="Enter full course folder path..."
                            style={{
                              width: '100%',
                              background: 'var(--bg-input)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              padding: '8px 40px 8px 12px',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              outline: 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleBrowseForEdit}
                            disabled={isLoading}
                            title="Browse folder"
                            style={{
                              position: 'absolute',
                              right: '8px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              display: 'flex',
                              padding: '4px'
                            }}
                          >
                            <FolderOpen size={16} />
                          </button>
                        </div>

                        {/* Save / Cancel buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleSaveEdit(pathItem)}
                            disabled={isLoading || !editValue.trim()}
                            title="Save Path"
                            style={{
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              padding: '8px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '34px',
                              height: '34px'
                            }}
                          >
                            {isLoading ? (
                              <Loader2 size={14} className="spinner" />
                            ) : (
                              <Check size={14} />
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isLoading}
                            title="Cancel"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-secondary)',
                              padding: '8px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '34px',
                              height: '34px'
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      {hasError && (
                        <p style={{ fontSize: '0.75rem', color: '#f87171', margin: '4px 0 0 0', lineHeight: 1.3 }}>
                          {errorMessage}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
