import React, { useState } from 'react';
import { Clock, Plus, Trash2, Edit2, Check, X, BookOpen } from 'lucide-react';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === null) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function NotesPanel({
  notes = [],
  currentTime = 0,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onSeek,
  onPauseVideo
}) {
  const [newNoteText, setNewNoteText] = useState('');
  const [noteTime, setNoteTime] = useState(null);
  
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  const handleFocus = () => {
    // Capture timestamp and pause playback
    onPauseVideo();
    setNoteTime(Math.floor(currentTime));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const timestamp = noteTime !== null ? noteTime : Math.floor(currentTime);
    onAddNote(timestamp, newNoteText.trim());
    setNewNoteText('');
    setNoteTime(null);
  };

  const startEditing = (note) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.text);
  };

  const handleEditSubmit = (noteId, timestamp) => {
    if (!editingNoteText.trim()) return;
    onEditNote(noteId, timestamp, editingNoteText.trim());
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  return (
    <div className="notes-panel">
      <div className="notes-header">
        <h3 className="sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={16} /> Notes
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {notes.length} note(s)
        </span>
      </div>

      <div className="notes-scrollable">
        {notes.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px 10px', height: 'auto' }}>
            <span style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📝</span>
            <div className="empty-state-title" style={{ fontSize: '0.9rem' }}>No Notes Yet</div>
            <div className="empty-state-desc" style={{ fontSize: '0.75rem' }}>
              Type in the box below to save timestamped notes. The video will pause while you type.
            </div>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="note-item">
              <div className="note-header">
                <span className="note-timestamp" onClick={() => onSeek(note.timestamp)} title="Click to seek video">
                  <Clock size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {formatTime(note.timestamp)}
                </span>
                
                {editingNoteId !== note.id && (
                  <div className="note-actions">
                    <button className="note-action-btn" onClick={() => startEditing(note)} title="Edit Note">
                      <Edit2 size={12} />
                    </button>
                    <button className="note-action-btn" onClick={() => onDeleteNote(note.id)} title="Delete Note">
                      <Trash2 size={12} style={{ color: 'var(--accent-red)' }} />
                    </button>
                  </div>
                )}
              </div>

              {editingNoteId === note.id ? (
                <div style={{ marginTop: '8px' }}>
                  <textarea
                    className="textarea-note"
                    style={{ height: '60px', fontSize: '0.8rem', marginBottom: '4px' }}
                    value={editingNoteText}
                    onChange={(e) => setEditingNoteText(e.target.value)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <button
                      className="btn-add-note"
                      style={{ background: 'var(--text-muted)', padding: '4px 8px', fontSize: '0.75rem' }}
                      onClick={() => setEditingNoteId(null)}
                    >
                      <X size={12} />
                    </button>
                    <button
                      className="btn-add-note"
                      style={{ background: 'var(--accent-green)', padding: '4px 8px', fontSize: '0.75rem' }}
                      onClick={() => handleEditSubmit(note.id, note.timestamp)}
                    >
                      <Check size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="note-text">{note.text}</div>
              )}
            </div>
          ))
        )}
      </div>

      <form className="notes-form" onSubmit={handleAddSubmit}>
        <textarea
          className="textarea-note"
          placeholder="Take a note... Video will pause automatically."
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          onFocus={handleFocus}
        />
        <div className="form-actions">
          <span className="note-time-badge">
            {newNoteText.trim() && (
              <>
                Timestamp: <strong>{formatTime(noteTime !== null ? noteTime : currentTime)}</strong>
              </>
            )}
          </span>
          <button type="submit" className="btn-add-note">
            <Plus size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Add Note
          </button>
        </div>
      </form>
    </div>
  );
}
