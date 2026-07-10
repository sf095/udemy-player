import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, BookOpen, Menu, Award, Activity, CheckSquare, Settings, Keyboard, Sun, Moon, Minimize2 } from 'lucide-react';
import CourseSelector from './components/CourseSelector';
import Sidebar from './components/Sidebar';
import AppLogo from './components/AppLogo';
import VideoPlayer from './components/VideoPlayer';
import DocViewer from './components/DocViewer';
import QuizViewer from './components/QuizViewer';
import ResourceList from './components/ResourceList';
import NotesPanel from './components/NotesPanel';
import SettingsModal from './components/SettingsModal';
import CourseManagerModal from './components/CourseManagerModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';

const DEFAULT_SETTINGS = {
  aiProvider: 'gemini',
  geminiApiKey: '',
  anthropicApiKey: '',
  anthropicModel: 'claude-3-5-sonnet-latest',
  anthropicBaseUrl: 'https://api.anthropic.com',
  autoplayNext: false,
  autoCreateTimeline: false,
  autoCreateTimelineLang: 'en',
  autoCreateSummary: false,
  autoCreateSummaryLang: 'en'
};

export default function App() {
  const [coursePath, setCoursePath] = useState('');
  const [history, setHistory] = useState([]);
  const [sections, setSections] = useState([]);
  const [progress, setProgress] = useState({});
  const [notes, setNotes] = useState({});
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
  const hasApiKey = useMemo(() =>
    settings.aiProvider === 'anthropic'
      ? !!settings.anthropicApiKey
      : !!settings.geminiApiKey,
    [settings.aiProvider, settings.anthropicApiKey, settings.geminiApiKey]
  );
  
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeLang, setActiveLang] = useState('');
  const [secondaryLang, setSecondaryLang] = useState(() => {
    const saved = localStorage.getItem('udemy-player-secondary-lang');
    return saved || '';
  });
  const [summaryLang, setSummaryLang] = useState(() => {
    const saved = localStorage.getItem('udemy-player-summary-lang');
    return saved || '';
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('video'); // 'video' or 'doc'
  const [activeResource, setActiveResource] = useState(null);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notesCollapsed, setNotesCollapsed] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('udemy-player:sidebar-width');
    return saved ? parseInt(saved, 10) : 320;
  });
  const [notesWidth, setNotesWidth] = useState(() => {
    const saved = localStorage.getItem('udemy-player:notes-width');
    return saved ? parseInt(saved, 10) : 360;
  });
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('udemy-player-theme');
    return saved || 'dark';
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCourseManager, setShowCourseManager] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [toast, setToast] = useState({ message: null, id: 0 });

  const playerRef = useRef(null);
  const saveProgressThrottleRef = useRef(null);
  const toastTimerRef = useRef(null);

  // Initialize and load user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  // Reset video playback status on lesson change
  useEffect(() => {
    setIsVideoPlaying(false);
  }, [activeLesson]);

  // Update document title dynamically based on active lesson and playback state
  useEffect(() => {
    if (!activeLesson) {
      document.title = 'Udemy Offline Player - Custom Learning Portal';
      return;
    }

    let statusPrefix = '';
    let suffix = ' - Udemy Offline Player';
    
    if (activeLesson.type === 'video' && activeTab === 'video') {
      statusPrefix = isVideoPlaying ? '▶ ' : '⏸ ';
    } else {
      const typeSuffix = activeLesson.type === 'pdf' ? ' (PDF)' : 
                         activeLesson.type === 'html' ? ' (HTML)' : 
                         activeLesson.type === 'quiz' ? ' (Quiz)' : '';
      statusPrefix = '';
      suffix = `${typeSuffix} - Udemy Offline Player`;
    }

    document.title = `${statusPrefix}${activeLesson.title}${suffix}`;
  }, [activeLesson, activeTab, isVideoPlaying]);

  useEffect(() => {
    localStorage.setItem('udemy-player:sidebar-width', sidebarWidth);
  }, [sidebarWidth]);

  useEffect(() => {
    localStorage.setItem('udemy-player:notes-width', notesWidth);
  }, [notesWidth]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    localStorage.setItem('udemy-player-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('udemy-player-secondary-lang', secondaryLang);
  }, [secondaryLang]);

  useEffect(() => {
    localStorage.setItem('udemy-player-summary-lang', summaryLang);
  }, [summaryLang]);

  useEffect(() => {
    if (activeLang && activeLang === secondaryLang) {
      setSecondaryLang('');
    }
  }, [activeLang, secondaryLang]);

  const fetchUserData = async (shouldScanContent = true) => {
    try {
      const response = await fetch('/api/userdata');
      const data = await response.json();
      setCoursePath(data.activeCoursePath);
      setHistory(data.history);
      setProgress(data.progress || {});
      setNotes(data.notes || {});
      setSettings(data.settings || { ...DEFAULT_SETTINGS });
      
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
      setSettings(data.settings || { ...DEFAULT_SETTINGS });
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
    if (!path) {
      setSections([]);
      setError(null);
      return;
    }
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
      setTheaterMode(false);
      await fetchCourseContent(data.activeCoursePath);
    } catch (err) {
      console.error('Failed to change course path', err);
      setError('Error scanning selected course path.');
    } finally {
      setLoading(false);
    }
  };

  // Delete course path from history
  const handleDeletePath = async (pathToDelete) => {
    try {
      const res = await fetch('/api/userdata/course', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: pathToDelete })
      });
      const data = await res.json();
      setHistory(data.history);
      if (data.activeCoursePath !== coursePath) {
        setCoursePath(data.activeCoursePath);
        setActiveLesson(null);
        fetchCourseContent(data.activeCoursePath);
      }
      return true;
    } catch (err) {
      console.error('Failed to delete path', err);
      return false;
    }
  };

  // Modify/rename course path in history
  const handleModifyPath = async (oldPath, newPath) => {
    try {
      const res = await fetch('/api/userdata/course', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newPath })
      });
      if (!res.ok) {
        return false;
      }
      const data = await res.json();
      setHistory(data.history);
      if (oldPath === coursePath) {
        setCoursePath(data.activeCoursePath);
        await fetchCourseContent(data.activeCoursePath);
      }
      return true;
    } catch (err) {
      console.error('Failed to modify path', err);
      return false;
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

  // Safe helper to get resources with backwards compatibility fallback
  const getLessonResources = (lesson) => {
    if (!lesson) return [];
    if (lesson.resources) return lesson.resources;
    const fallback = [];
    if (lesson.pdf) {
      const parts = lesson.pdf.split(/[/\\]/);
      const name = parts[parts.length - 1];
      fallback.push({ name: name, title: 'PDF Document', path: lesson.pdf, ext: '.pdf', type: 'pdf' });
    }
    if (lesson.html) {
      const parts = lesson.html.split(/[/\\]/);
      const name = parts[parts.length - 1];
      fallback.push({ name: name, title: 'HTML Document', path: lesson.html, ext: '.html', type: 'html' });
    }
    return fallback;
  };

  // Resizing event handlers for side panels
  const handleSidebarResizeStart = (e) => {
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing');

    const handlePointerMove = (moveEvent) => {
      const clientX = moveEvent.clientX;
      const maxSidebarWidth = window.innerWidth - notesWidth - 400;
      const clampedWidth = Math.max(200, Math.min(500, maxSidebarWidth, clientX));
      setSidebarWidth(clampedWidth);
    };

    const handlePointerUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.classList.remove('resizing');
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handleNotesResizeStart = (e) => {
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing');

    const handlePointerMove = (moveEvent) => {
      const clientX = moveEvent.clientX;
      const maxNotesWidth = window.innerWidth - sidebarWidth - 400;
      const calculatedWidth = window.innerWidth - clientX;
      const clampedWidth = Math.max(260, Math.min(600, maxNotesWidth, calculatedWidth));
      setNotesWidth(clampedWidth);
    };

    const handlePointerUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.classList.remove('resizing');
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handleSidebarResizeReset = () => {
    setSidebarWidth(320);
  };

  const handleNotesResizeReset = () => {
    setNotesWidth(360);
  };

  // Select lesson click handler
  const handleSelectLesson = (lesson) => {
    setActiveLesson(lesson);
    setCurrentTime(0);

    const resources = getLessonResources(lesson);
    const firstPreviewable = resources.find(r => r.type === 'pdf' || r.type === 'html' || r.type === 'quiz') || null;
    setActiveResource(firstPreviewable);

    // Auto-select tab based on available assets
    if (lesson.type === 'video') {
      setActiveTab('video');
    } else {
      setActiveTab('doc');
      setTheaterMode(false);
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
  const activeSection = useMemo(() => {
    if (!activeLesson || !sections) return null;
    return sections.find(sec => sec.lessons.some(l => l.id === activeLesson.id));
  }, [activeLesson, sections]);

  // --- Keyboard Shortcuts Infrastructure ---
  const SPEED_STEPS = [1, 1.25, 1.5, 1.75, 2];

  const showToast = (msg) => {
    setToast(prev => ({ message: msg, id: prev.id + 1 }));
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(prev => ({ ...prev, message: null })), 1500);
  };

  const allLessonsFlat = useMemo(() => {
    const all = [];
    sections.forEach(sec => sec.lessons.forEach(l => all.push(l)));
    return all;
  }, [sections]);

  const goToNextLesson = useCallback(() => {
    const idx = allLessonsFlat.findIndex(l => l.id === activeLesson?.id);
    if (idx >= 0 && idx < allLessonsFlat.length - 1) {
      handleSelectLesson(allLessonsFlat[idx + 1]);
      showToast(`⏭ ${allLessonsFlat[idx + 1].title}`);
    }
  }, [allLessonsFlat, activeLesson]);

  const goToPrevLesson = useCallback(() => {
    const idx = allLessonsFlat.findIndex(l => l.id === activeLesson?.id);
    if (idx > 0) {
      handleSelectLesson(allLessonsFlat[idx - 1]);
      showToast(`⏮ ${allLessonsFlat[idx - 1].title}`);
    }
  }, [allLessonsFlat, activeLesson]);

  const handleVideoPlay = useCallback(() => setIsVideoPlaying(true), []);
  const handleVideoPause = useCallback(() => setIsVideoPlaying(false), []);

  const nextLesson = useMemo(() => {
    if (!activeLesson) return null;
    const idx = allLessonsFlat.findIndex(l => l.id === activeLesson.id);
    if (idx >= 0 && idx < allLessonsFlat.length - 1) {
      return allLessonsFlat[idx + 1];
    }
    return null;
  }, [allLessonsFlat, activeLesson]);

  const handleToggleAutoplay = async () => {
    const nextVal = !settings.autoplayNext;
    const updatedSettings = { ...settings, autoplayNext: nextVal };

    try {
      const res = await fetch('/api/userdata/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to save autoplay setting', err);
    }
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (playerRef.current) {
      playerRef.current.playbackRate = newSpeed;
    }
  };

  const changeSpeedStep = (direction) => {
    const idx = SPEED_STEPS.indexOf(speed);
    const currentIdx = idx >= 0 ? idx : SPEED_STEPS.findIndex(s => s >= speed);
    const nextIdx = direction === 'up'
      ? Math.min(SPEED_STEPS.length - 1, currentIdx + 1)
      : Math.max(0, currentIdx - 1);
    const newSpeed = SPEED_STEPS[nextIdx];
    handleSpeedChange(newSpeed);
    showToast(`⏱ ${newSpeed}x`);
  };

  const handleToggleTheaterMode = () => {
    setTheaterMode(t => {
      const next = !t;
      showToast(next ? '🎬 Theater Mode ON' : '📺 Theater Mode OFF');
      return next;
    });
  };

  const isVideoActive = () => !!activeLesson?.video && activeTab === 'video';
  const hasLesson = () => !!activeLesson;

  useKeyboardShortcuts([
    // --- Video Playback ---
    { key: ' ', action: () => {
      const video = playerRef.current;
      if (!video) return;
      if (video.paused) { video.play().catch(() => {}); showToast('▶ Playing'); }
      else { video.pause(); showToast('⏸ Paused'); }
    }, when: isVideoActive },
    { key: 'ArrowLeft', action: () => {
      const video = playerRef.current;
      if (video) { video.currentTime = Math.max(0, video.currentTime - 5); showToast('⏪ -5s'); }
    }, when: isVideoActive },
    { key: 'ArrowRight', action: () => {
      const video = playerRef.current;
      if (video) { video.currentTime = Math.min(video.duration || 0, video.currentTime + 5); showToast('⏩ +5s'); }
    }, when: isVideoActive },
    { key: 'j', action: () => {
      const video = playerRef.current;
      if (video) { video.currentTime = Math.max(0, video.currentTime - 10); showToast('⏪ -10s'); }
    }, when: isVideoActive },
    { key: 'l', action: () => {
      const video = playerRef.current;
      if (video) { video.currentTime = Math.min(video.duration || 0, video.currentTime + 10); showToast('⏩ +10s'); }
    }, when: isVideoActive },
    { key: 'ArrowUp', action: () => {
      const video = playerRef.current;
      if (video) { video.volume = Math.min(1, video.volume + 0.1); showToast(`🔊 ${Math.round(video.volume * 100)}%`); }
    }, when: isVideoActive },
    { key: 'ArrowDown', action: () => {
      const video = playerRef.current;
      if (video) { video.volume = Math.max(0, video.volume - 0.1); showToast(`🔉 ${Math.round(video.volume * 100)}%`); }
    }, when: isVideoActive },
    { key: 'm', action: () => {
      const video = playerRef.current;
      if (video) { video.muted = !video.muted; showToast(video.muted ? '🔇 Muted' : '🔊 Unmuted'); }
    }, when: isVideoActive },
    { key: 'f', action: () => {
      const video = playerRef.current;
      if (!video) return;
      const container = video.closest('.video-container');
      if (!container) return;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else container.requestFullscreen().catch(() => {});
    }, when: isVideoActive },
    { key: '[', action: () => changeSpeedStep('down'), when: isVideoActive },
    { key: ']', action: () => changeSpeedStep('up'), when: isVideoActive },
    // 0-9 percentage seek
    ...Array.from({ length: 10 }, (_, i) => ({
      key: String(i),
      action: () => {
        const video = playerRef.current;
        if (video && video.duration) {
          video.currentTime = video.duration * (i / 10);
          showToast(`⏩ ${i * 10}%`);
        }
      },
      when: isVideoActive
    })),
    // --- Lesson Navigation ---
    { key: 'N', modifiers: ['shift'], action: goToNextLesson, when: hasLesson },
    { key: 'P', modifiers: ['shift'], action: goToPrevLesson, when: hasLesson },
    { key: 'Enter', modifiers: ['shift'], action: () => {
      if (!activeLesson) return;
      const isCompleted = progress[activeLesson.id]?.completed;
      handleToggleComplete(activeLesson.id, !isCompleted);
      showToast(isCompleted ? '⬜ Unmarked' : '✅ Completed');
    }, when: hasLesson },
    // --- UI Panels ---
    { key: 'b', action: () => setSidebarCollapsed(c => !c) },
    { key: 'n', action: () => {
      if (activeLesson?.type === 'video') setNotesCollapsed(c => !c);
    }},
    { key: 't', action: handleToggleTheaterMode, when: () => isVideoActive() || theaterMode },
    { key: 'Escape', action: () => {
      if (showShortcutsModal) setShowShortcutsModal(false);
      else if (showSettingsModal) setShowSettingsModal(false);
      else if (showCourseManager) setShowCourseManager(false);
      else if (theaterMode) setTheaterMode(false);
    }},
    // --- App-Level ---
    { key: '?', modifiers: ['shift'], action: () => setShowShortcutsModal(s => !s) },
    { key: ',', action: () => setShowSettingsModal(true) },
  ]);

  // Check if active lesson has both video and resource documents (PDF/HTML)
  const lessonResources = getLessonResources(activeLesson);
  const hasMultipleTabs = activeLesson && activeLesson.video && lessonResources.length > 0;

  return (
    <div className={`app-container ${theaterMode ? 'theater-mode' : ''}`}>
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
          <AppLogo size={24} />
          <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>Udemy Offline Player</span>
        </div>

        <CourseSelector
          currentPath={coursePath}
          history={history}
          onSelectPath={handleSelectPath}
          onManageCourses={() => setShowCourseManager(true)}
        />

        <div className="header-actions-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                background: notesCollapsed ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-hover)',
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
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            style={{
              background: 'var(--bg-hover)',
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
              e.currentTarget.style.background = 'var(--bg-hover-active)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'var(--bg-hover)';
            }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            className="btn-toggle"
            onClick={() => setShowSettingsModal(true)}
            title="Settings"
            style={{
              background: 'var(--bg-hover)',
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
              e.currentTarget.style.background = 'var(--bg-hover-active)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'var(--bg-hover)';
            }}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      <main 
        className={`dashboard-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${notesCollapsed ? 'notes-collapsed' : ''}`}
        style={{
          '--sidebar-width': sidebarCollapsed ? '0px' : `${sidebarWidth}px`,
          '--notes-width': (notesCollapsed || !activeLesson || activeLesson.type !== 'video') ? '0px' : `${notesWidth}px`
        }}
      >
        
        {/* Left Sidebar */}
        <Sidebar
          sections={sections}
          progress={progress}
          activeLesson={activeLesson}
          onSelectLesson={handleSelectLesson}
          onToggleComplete={handleToggleComplete}
          onResizeStart={handleSidebarResizeStart}
          onResizeReset={handleSidebarResizeReset}
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
              
              {/* Stage Header Banner */}
              <div className="stage-header-banner">
                <div className="stage-header-breadcrumbs">
                  <span className="stage-header-section" title={activeSection?.title}>
                    {activeSection?.title || 'Section'}
                  </span>
                  <span className="stage-header-separator">&gt;</span>
                  <span className="stage-header-lesson" title={activeLesson.title}>
                    {activeLesson.title}
                  </span>
                </div>
                <div className={`stage-header-badge ${activeLesson.type || 'video'}`}>
                  {activeLesson.type === 'video' ? 'Video' : activeLesson.type === 'pdf' ? 'PDF' : activeLesson.type === 'html' ? 'HTML' : activeLesson.type === 'quiz' ? 'Quiz' : 'Lesson'}
                </div>
              </div>

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
                {activeLesson.type === 'quiz' ? (
                  <QuizViewer
                    path={activeLesson.quiz}
                    onComplete={(completed) => handleToggleComplete(activeLesson.id, completed)}
                    isCompleted={!!progress[activeLesson.id]?.completed}
                  />
                ) : activeTab === 'video' && activeLesson.video ? (
                  <VideoPlayer
                    videoPath={activeLesson.video}
                    subtitles={activeLesson.subtitles}
                    initialTime={activeLessonProgress.watchTime || 0}
                    onTimeUpdate={handleTimeUpdate}
                    playerRef={playerRef}
                    onSubtitlesUpdated={handleSubtitlesUpdated}
                    activeLang={activeLang}
                    setActiveLang={setActiveLang}
                    secondaryLang={secondaryLang}
                    setSecondaryLang={setSecondaryLang}
                    speed={speed}
                    onSpeedChange={handleSpeedChange}
                    toastMessage={toast.message}
                    toastId={toast.id}
                    autoplayEnabled={settings.autoplayNext}
                    onToggleAutoplay={handleToggleAutoplay}
                    hasNextLesson={!!nextLesson}
                    nextLessonTitle={nextLesson?.title || ''}
                    onPlayNextLesson={goToNextLesson}
                    theaterMode={theaterMode}
                    onToggleTheaterMode={handleToggleTheaterMode}
                    sidebarCollapsed={sidebarCollapsed}
                    onToggleSidebar={() => setSidebarCollapsed(c => !c)}
                    notesCollapsed={notesCollapsed}
                    onToggleNotes={() => setNotesCollapsed(c => !c)}
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                    autoCreateTimeline={settings.autoCreateTimeline}
                    autoCreateTimelineLang={settings.autoCreateTimelineLang}
                    hasApiKey={hasApiKey}
                  />
                ) : (
                  <div style={{ display: 'flex', width: '100%', height: '100%', background: 'var(--bg-main)' }}>
                    {lessonResources.length > 1 && (
                      <div style={{ width: '320px', minWidth: '320px', borderRight: '1px solid var(--border-color)', height: '100%', overflowY: 'auto' }}>
                        <ResourceList
                          resources={lessonResources}
                          activeResource={activeResource}
                          onSelectResource={setActiveResource}
                        />
                      </div>
                    )}
                    <div style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      {activeResource && (activeResource.type === 'pdf' || activeResource.type === 'html') ? (
                        <DocViewer
                          path={activeResource.path}
                          type={activeResource.type}
                        />
                      ) : activeResource && activeResource.type === 'quiz' ? (
                        <QuizViewer
                          path={activeResource.path}
                          onComplete={(completed) => handleToggleComplete(activeLesson.id, completed)}
                          isCompleted={!!progress[activeLesson.id]?.completed}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', color: 'var(--text-secondary)', textAlign: 'center', gap: '16px' }}>
                          <BookOpen size={48} style={{ color: 'var(--text-muted)' }} />
                          <div>
                            <h5 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>Companion Resource Viewer</h5>
                            <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '360px' }}>
                              {activeResource 
                                ? `"${activeResource.title}" is an external or downloadable resource. Look for your download, or select a PDF/HTML resource on the left to preview.`
                                : "No previewable resource selected. Select a PDF or HTML resource on the left to preview it here."
                              }
                            </p>
                          </div>
                          {lessonResources.length === 1 && (
                            <div style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                              <ResourceList
                                resources={lessonResources}
                                activeResource={activeResource}
                                onSelectResource={setActiveResource}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Floating tab bar in theater mode — overlays the video area */}
              {theaterMode && hasMultipleTabs && (
                <div className="stage-tabs-floating">
                  <button
                    className={`tab-btn-floating ${activeTab === 'video' ? 'active' : ''}`}
                    onClick={() => setActiveTab('video')}
                    title="Video Lesson"
                  >
                    <Play size={14} /> Video
                  </button>
                  <button
                    className={`tab-btn-floating ${activeTab === 'doc' ? 'active' : ''}`}
                    onClick={() => setActiveTab('doc')}
                    title="Companion Resources"
                  >
                    <BookOpen size={14} /> Resources
                  </button>
                  <div className="tab-separator" />
                  <button
                    className="theater-exit-btn"
                    onClick={handleToggleTheaterMode}
                    title="Exit Theater Mode (t)"
                  >
                    <Minimize2 size={14} />
                  </button>
                </div>
              )}
              </div>
            </div>
          ) : !coursePath ? (
            <div className="empty-state">
              <Award className="empty-state-icon animate-pulse" style={{ strokeWidth: 1.5, size: 48, color: 'var(--primary)' }} />
              <div className="empty-state-title">Welcome to Udemy Offline Player!</div>
              <div className="empty-state-desc">
                To get started, please select a course folder directory using the selector in the top bar.
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
            summaryLang={summaryLang}
            setSummaryLang={setSummaryLang}
            hasApiKey={hasApiKey}
            aiProvider={settings.aiProvider || 'gemini'}
            onResizeStart={handleNotesResizeStart}
            onResizeReset={handleNotesResizeReset}
            autoCreateSummary={settings.autoCreateSummary}
            autoCreateSummaryLang={settings.autoCreateSummaryLang}
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

      {showCourseManager && (
        <CourseManagerModal
          currentPath={coursePath}
          history={history}
          onSelectPath={handleSelectPath}
          onDeletePath={handleDeletePath}
          onModifyPath={handleModifyPath}
          onClose={() => setShowCourseManager(false)}
        />
      )}
      {showShortcutsModal && (
        <KeyboardShortcutsModal
          onClose={() => setShowShortcutsModal(false)}
        />
      )}
    </div>
  );
}
