import React, { useState, useEffect, useRef } from 'react';
import { Play, BookOpen, Menu, Award, Activity, CheckSquare } from 'lucide-react';
import CourseSelector from './components/CourseSelector';
import Sidebar from './components/Sidebar';
import VideoPlayer from './components/VideoPlayer';
import DocViewer from './components/DocViewer';
import NotesPanel from './components/NotesPanel';

export default function App() {
  const [coursePath, setCoursePath] = useState('');
  const [history, setHistory] = useState([]);
  const [sections, setSections] = useState([]);
  const [progress, setProgress] = useState({});
  const [notes, setNotes] = useState({});
  
  const [activeLesson, setActiveLesson] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState('video'); // 'video' or 'doc'
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notesCollapsed, setNotesCollapsed] = useState(false);
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
      
      if (shouldScanContent && data.activeCoursePath) {
        fetchCourseContent(data.activeCoursePath);
      }
    } catch (err) {
      console.error('Failed to load user data', err);
      setError('Failed to fetch user progress state.');
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
        <div className="brand">
          <Play size={20} style={{ fill: 'var(--primary)', color: 'var(--primary)' }} />
          <span>Udemy Offline Player</span>
        </div>

        <CourseSelector
          currentPath={coursePath}
          history={history}
          onSelectPath={handleSelectPath}
        />

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
          {/* Header toggles for collapse sidebar/notes */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 10,
              display: 'flex',
              gap: '8px'
            }}
          >
            <button
              className="btn-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title="Toggle Sidebar"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid var(--border-color)' }}
            >
              <Menu size={16} />
            </button>
          </div>

          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10,
              display: 'flex',
              gap: '8px'
            }}
          >
            {activeLesson && activeLesson.type === 'video' && (
              <button
                className="btn-toggle"
                onClick={() => setNotesCollapsed(!notesCollapsed)}
                title="Toggle Notes"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid var(--border-color)' }}
              >
                <BookOpen size={16} />
              </button>
            )}
          </div>

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
                    subtitlePath={activeLesson.subtitle}
                    initialTime={activeLessonProgress.watchTime || 0}
                    onTimeUpdate={handleTimeUpdate}
                    playerRef={playerRef}
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
          />
        )}
      </main>
    </div>
  );
}
