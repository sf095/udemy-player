import React, { useState, useEffect, useRef } from 'react';
import { Play, BookOpen, Menu, Award, Activity, CheckSquare, Settings } from 'lucide-react';
import CourseSelector from './components/CourseSelector';
import Sidebar from './components/Sidebar';
import VideoPlayer from './components/VideoPlayer';
import DocViewer from './components/DocViewer';
import NotesPanel from './components/NotesPanel';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [coursePath, setCoursePath] = useState('');
  const [history, setHistory] = useState([]);
  const [sections, setSections] = useState([]);
  const [progress, setProgress] = useState({});
  const [notes, setNotes] = useState({});
  const [settings, setSettings] = useState({ geminiApiKey: '' });
  
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeLang, setActiveLang] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState('video'); // 'video' or 'doc'
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notesCollapsed, setNotesCollapsed] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const playerRef = useRef(null);
  const saveProgressThrottleRef = useRef(null);

  // Initialize and load user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async (shouldScanContent = true) => {
    try {
      const response = await fetch('/api/userdata');
      const data = await response.json();
      setCoursePath(data.activeCoursePath);
      setHistory(data.history);
      setProgress(data.progress || {});
      setNotes(data.notes || {});
      setSettings(data.settings || { geminiApiKey: '' });
      
      if (shouldScanContent && data.activeCoursePath) {
        fetchCourseContent(data.activeCoursePath);
      }
    } catch (err) {
      console.error('Failed to load user data', err);
      setError('Failed to fetch user progress state.');
    }
  };

  const handleSaveSettings = async (newSettings) => {
    try {
      const res = await fetch('/api/userdata/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      setSettings(data.settings || { geminiApiKey: '' });
      return true;
    } catch (err) {
      console.error('Failed to save settings', err);
      return false;
    }
  };

  const handleSubtitlesUpdated = async () => {
    if (!coursePath || !activeLesson) return;
    try {
      const response = await fetch(`/api/course-content?path=${encodeURIComponent(coursePath)}`);
      const data = await response.json();
      if (data.success) {
        setSections(data.sections);
        let updatedLesson = null;
        for (const sec of data.sections) {
          const found = sec.lessons.find((l) => l.id === activeLesson.id);
          if (found) {
            updatedLesson = found;
            break;
          }
        }
        if (updatedLesson) {
          setActiveLesson(updatedLesson);
        }
      }
    } catch (err) {
      console.error('Failed to update subtitle list after translation', err);
    }
  };

  const fetchCourseContent = async (path) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/course-content?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      if (data.success) {
        setSections(data.sections);
      } else {
        setError(data.error || 'Failed to scan course content.');
      }
    } catch (err) {
      console.error('Failed to scan course content', err);
      setError('Failed to reach backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Change course folder path
  const handleSelectPath = async (newPath) => {
    try {
      setLoading(true);
      const res = await fetch('/api/userdata/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: newPath })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setCoursePath(data.activeCoursePath);
      setHistory(data.history);
      setActiveLesson(null);
      await fetchCourseContent(data.activeCoursePath);
    } catch (err) {
      console.error('Failed to change course path', err);
      setError('Error scanning selected course path.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle completion of lesson manually in sidebar
  const handleToggleComplete = async (lessonId, completed) => {
    try {
      const currentLessonProgress = progress[lessonId] || {};
      const res = await fetch('/api/userdata/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          completed,
          watchTime: currentLessonProgress.watchTime || 0,
          duration: currentLessonProgress.duration || 0
        })
      });
      const data = await res.json();
      setProgress(data.progress);
    } catch (err) {
      console.error('Failed to update completion state', err);
    }
  };

  // Triggered on timeupdate from VideoPlayer
  const handleTimeUpdate = (time, duration) => {
    setCurrentTime(time);
    if (!activeLesson) return;

    // 1. Auto-complete check (watch progress >= 90%)
    const isCompleted = progress[activeLesson.id]?.completed;
    if (!isCompleted && duration > 0 && (time / duration) >= 0.90) {
      handleToggleComplete(activeLesson.id, true);
    }

    // 2. Throttled save to progress DB (every 5 seconds)
    const now = Date.now();
    if (!saveProgressThrottleRef.current || (now - saveProgressThrottleRef.current > 5000)) {
      saveProgressThrottleRef.current = now;
      
      fetch('/api/userdata/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: activeLesson.id,
          watchTime: Math.floor(time),
          duration: Math.floor(duration)
        })
      })
      .then(res => res.json())
      .then(data => {
        // Silently update progress mapping
        setProgress(data.progress);
      })
      .catch(err => console.error('Auto-save progress error:', err));
    }
  };

  // Add notes
  const handleAddNote = async (timestamp, text) => {
    if (!activeLesson) return;
    try {
      const res = await fetch('/api/userdata/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: activeLesson.id,
          timestamp,
          text
        })
      });
      const data = await res.json();
      setNotes(data.notes);
      
      // Resume video playback after adding note
      if (playerRef.current) {
        playerRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Failed to add note', err);
    }
  };

  // Edit notes
  const handleEditNote = async (noteId, timestamp, text) => {
    if (!activeLesson) return;
    try {
      const res = await fetch('/api/userdata/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: activeLesson.id,
          noteId,
          timestamp,
          text
        })
      });
      const data = await res.json();
      setNotes(data.notes);
    } catch (err) {
      console.error('Failed to edit note', err);
    }
  };

  // Delete notes
  const handleDeleteNote = async (noteId) => {
    if (!activeLesson) return;
    try {
      const res = await fetch('/api/userdata/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: activeLesson.id,
          noteId
        })
      });
      const data = await res.json();
      setNotes(data.notes);
    } catch (err) {
      console.error('Failed to delete note', err);
    }
  };

  // Seek video to specific timestamp
  const handleSeek = (timestamp) => {
    if (playerRef.current) {
      playerRef.current.currentTime = timestamp;
      playerRef.current.play().catch(() => {});
    }
  };

  // Pause video
  const handlePauseVideo = () => {
    if (playerRef.current && !playerRef.current.paused) {
      playerRef.current.pause();
    }
  };

  // Select lesson click handler
  const handleSelectLesson = (lesson) => {
    setActiveLesson(lesson);
    setCurrentTime(0);
    // Auto-select tab based on available assets
    if (lesson.type === 'video') {
      setActiveTab('video');
    } else {
      setActiveTab('doc');
    }
  };

  // Calculate overall course statistics
  const getCourseStats = () => {
    let totalLessons = 0;
    let completedLessons = 0;

    sections.forEach((sec) => {
      sec.lessons.forEach((l) => {
        totalLessons++;
        if (progress[l.id]?.completed) {
          completedLessons++;
        }
      });
    });

    const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return { total: totalLessons, completed: completedLessons, percent };
  };

  const { total, completed, percent } = getCourseStats();
  const activeLessonNotes = activeLesson ? (notes[activeLesson.id] || []) : [];
  const activeLessonProgress = activeLesson ? (progress[activeLesson.id] || {}) : {};

  // Check if active lesson has both video and resource documents (PDF/HTML)
  const hasMultipleTabs = activeLesson && activeLesson.video && (activeLesson.pdf || activeLesson.html);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title="Toggle Sidebar"
            style={{
              background: sidebarCollapsed ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: sidebarCollapsed ? '1px dashed var(--primary)' : '1px solid transparent',
              color: sidebarCollapsed ? 'var(--primary)' : 'var(--text-secondary)',
              padding: '6px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-fast)'
            }}
          >
            <Menu size={18} />
          </button>
          <Play size={20} style={{ fill: 'var(--primary)', color: 'var(--primary)' }} />
          <span>Udemy Offline Player</span>
        </div>

        <CourseSelector
          currentPath={coursePath}
          history={history}
          onSelectPath={handleSelectPath}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {sections.length > 0 && (
            <div className="course-progress-container">
              <span className="course-progress-text">
                {percent}% Completed ({completed}/{total})
              </span>
              <div className="course-progress-bar">
                <div className="course-progress-fill" style={{ width: `${percent}%` }} />
              </div>
            </div>
          )}

          {activeLesson && activeLesson.type === 'video' && (
            <button
              className="btn-toggle"
              onClick={() => setNotesCollapsed(!notesCollapsed)}
              title="Toggle Notes"
              style={{
                background: notesCollapsed ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: notesCollapsed ? '1px dashed var(--primary)' : '1px solid var(--border-color)',
                color: notesCollapsed ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition-fast)'
              }}
            >
              <BookOpen size={18} />
            </button>
          )}

          <button
            className="btn-toggle"
            onClick={() => setShowSettingsModal(true)}
            title="Settings"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      <main className={`dashboard-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${notesCollapsed ? 'notes-collapsed' : ''}`}>
        
        {/* Left Sidebar */}
        <Sidebar
          sections={sections}
          progress={progress}
          activeLesson={activeLesson}
          onSelectLesson={handleSelectLesson}
          onToggleComplete={handleToggleComplete}
        />

        {/* Center Screen Stage */}
        <section className="stage-panel">
          {/* Main content stage renders here without overlapping float controls */}

          {loading ? (
            <div className="empty-state">
              <Activity className="empty-state-icon animate-pulse" style={{ color: 'var(--primary)' }} />
              <div className="empty-state-title">Scanning Course Content...</div>
              <div className="empty-state-desc">Loading folders, sections, and compiling files.</div>
            </div>
          ) : error ? (
            <div className="empty-state">
              <span className="empty-state-icon" style={{ color: 'var(--accent-red)' }}>⚠️</span>
              <div className="empty-state-title">An Error Occurred</div>
              <div className="empty-state-desc">{error}</div>
            </div>
          ) : activeLesson ? (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
              
              {/* Tab Selector (only shown if a lesson has multiple assets, e.g. video and companion PDF sheet) */}
              {hasMultipleTabs && (
                <div className="stage-tabs">
                  <button
                    className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
                    onClick={() => setActiveTab('video')}
                  >
                    <Play size={14} /> Video Lesson
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'doc' ? 'active' : ''}`}
                    onClick={() => setActiveTab('doc')}
                  >
                    <BookOpen size={14} /> Companion Resources
                  </button>
                </div>
              )}

              {/* Media viewport content */}
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {activeTab === 'video' && activeLesson.video ? (
                  <VideoPlayer
                    videoPath={activeLesson.video}
                    subtitles={activeLesson.subtitles}
                    initialTime={activeLessonProgress.watchTime || 0}
                    onTimeUpdate={handleTimeUpdate}
                    playerRef={playerRef}
                    onSubtitlesUpdated={handleSubtitlesUpdated}
                    activeLang={activeLang}
                    setActiveLang={setActiveLang}
                  />
                ) : (
                  <DocViewer
                    path={activeLesson.pdf || activeLesson.html}
                    type={activeLesson.pdf ? 'pdf' : 'html'}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Award className="empty-state-icon" style={{ strokeWidth: 1.5, size: 48 }} />
              <div className="empty-state-title">Ready to Learn?</div>
              <div className="empty-state-desc">
                Select a section chapter and choose a lesson from the left sidebar to start playing.
              </div>
            </div>
          )}
        </section>

        {/* Right Sidebar Notes */}
        {activeLesson && activeLesson.type === 'video' && !notesCollapsed && (
          <NotesPanel
            notes={activeLessonNotes}
            currentTime={currentTime}
            onAddNote={handleAddNote}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            onSeek={handleSeek}
            onPauseVideo={handlePauseVideo}
            activeLesson={activeLesson}
            activeLang={activeLang}
            hasApiKey={!!settings.geminiApiKey}
          />
        )}
      </main>

      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}
