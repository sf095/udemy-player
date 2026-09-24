import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, BookOpen, Menu, Award, Activity, CheckSquare, Settings, Keyboard, Sun, Moon, Minimize2 } from 'lucide-react';
import CourseSelector from './components/CourseSelector';
import AppLogo from './components/AppLogo';
import VideoPlayer from './components/VideoPlayer';
import DocViewer from './components/DocViewer';
import QuizViewer from './components/QuizViewer';
import ResourceList from './components/ResourceList';
import LocalResourceCard from './components/LocalResourceCard';
import NotesPanel from './components/NotesPanel';
import SettingsModal from './components/SettingsModal';
import CourseManagerModal from './components/CourseManagerModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import ChapterSummaryModal from './components/ChapterSummaryModal';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';

const DEFAULT_SETTINGS = {
  aiProvider: 'gemini',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  anthropicApiKey: '',
  anthropicModel: 'claude-3-5-sonnet-latest',
  anthropicBaseUrl: 'https://api.anthropic.com',
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  openaiBaseUrl: 'https://api.openai.com',
  autoplayNext: false,
  controlsPosition: 'floating',
  autoCreateTimeline: false,
  autoCreateTimelineLang: 'en',
  autoCreateSummary: false,
  autoCreateSummaryLang: 'en',
  featureModels: {
    timeline: { provider: '', model: '' },
    subtitleTranslation: { provider: '', model: '' },
    lessonSummary: { provider: '', model: '' },
    chapterSummary: { provider: '', model: '' },
    lessonChat: { provider: '', model: '' },
    chapterChat: { provider: '', model: '' }
  }
};

// Safe helper to get resources with backwards compatibility fallback
function getLessonResources(lesson) {
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
}

export default function App() {
  const [coursePath, setCoursePath] = useState('');
  const [history, setHistory] = useState([]);
  const [sections, setSections] = useState([]);
  const [progress, setProgress] = useState({});
  const [notes, setNotes] = useState({});
  const [courseStates, setCourseStates] = useState({});
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
  const hasApiKey = useMemo(() => {
    if (settings.aiProvider === 'anthropic' && settings.anthropicApiKey) return true;
    if (settings.aiProvider === 'openai' && settings.openaiApiKey) return true;
    if (settings.aiProvider === 'gemini' && settings.geminiApiKey) return true;
    return !!(settings.geminiApiKey || settings.anthropicApiKey || settings.openaiApiKey);
  }, [settings.aiProvider, settings.anthropicApiKey, settings.openaiApiKey, settings.geminiApiKey]);
  
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
  const [autoPlayVideo, setAutoPlayVideo] = useState(false);
  const [activeTab, setActiveTab] = useState('video'); // 'video' or 'doc'
  const [activeResource, setActiveResource] = useState(null);
  
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [activeSectionForSummary, setActiveSectionForSummary] = useState(null);
  const [showChapterSummaryModal, setShowChapterSummaryModal] = useState(false);
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
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('udemy-player-volume');
    return saved !== null ? parseFloat(saved) : 1;
  });
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('udemy-player-muted');
    return saved === 'true';
  });
  const [toast, setToast] = useState({ message: null, id: 0 });

  const playerRef = useRef(null);
  const saveProgressThrottleRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(prev => ({ message: msg, id: prev.id + 1 }));
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(prev => ({ ...prev, message: null })), 1500);
  }, []);

  // Flush current playback watchTime and active lesson immediately to backend
  const flushCurrentPlayback = useCallback(async () => {
    if (!activeLesson || !coursePath) return;

    let timeToSave = currentTime;
    let durationToSave = 0;
    if (playerRef.current) {
      timeToSave = playerRef.current.currentTime || currentTime;
      durationToSave = playerRef.current.duration || 0;
    }

    try {
      await fetch('/api/userdata/course-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coursePath,
          lastLessonId: activeLesson.id,
          lastActiveTab: activeTab,
          watchTime: Math.floor(timeToSave),
          duration: Math.floor(durationToSave)
        })
      });
    } catch (err) {
      console.error('Failed to flush course playback state:', err);
    }
  }, [activeLesson, coursePath, currentTime, activeTab]);

  // Handle browser tab/window close or navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeLesson && coursePath) {
        let timeToSave = currentTime;
        let durationToSave = 0;
        if (playerRef.current) {
          timeToSave = playerRef.current.currentTime || currentTime;
          durationToSave = playerRef.current.duration || 0;
        }
        const payload = JSON.stringify({
          coursePath,
          lastLessonId: activeLesson.id,
          lastActiveTab: activeTab,
          watchTime: Math.floor(timeToSave),
          duration: Math.floor(durationToSave)
        });
        navigator.sendBeacon('/api/userdata/course-state', new Blob([payload], { type: 'application/json' }));
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeLesson, coursePath, currentTime, activeTab]);

  // Restore study state (last active lesson, watch time, active tab)
  const restoreCourseStudyState = useCallback((sectionsList, courseState, currentProgress) => {
    if (!sectionsList || sectionsList.length === 0) {
      setActiveLesson(null);
      return;
    }

    const allLessons = [];
    sectionsList.forEach((sec) => {
      sec.lessons.forEach((l) => allLessons.push(l));
    });

    if (allLessons.length === 0) {
      setActiveLesson(null);
      return;
    }

    let targetLesson = null;
    let isResume = false;

    // 1. Try to restore last active lesson from courseState
    if (courseState?.lastLessonId) {
      targetLesson = allLessons.find(l => l.id === courseState.lastLessonId) || null;
      if (targetLesson) {
        isResume = true;
      }
    }

    // 2. If no saved last active lesson, find first incomplete lesson or lesson 0
    if (!targetLesson) {
      targetLesson = allLessons.find(l => !currentProgress?.[l.id]?.completed) || allLessons[0];
    }

    if (targetLesson) {
      setAutoPlayVideo(false);
      setActiveLesson(targetLesson);

      const resources = getLessonResources(targetLesson);
      const defaultResource = resources.find(r => r.type === 'pdf' || r.type === 'html' || r.type === 'quiz') || resources[0] || null;
      setActiveResource(defaultResource);

      // Restore activeTab if valid for this lesson
      if (courseState?.lastActiveTab === 'doc' && resources.length > 0) {
        setActiveTab('doc');
      } else if (courseState?.lastActiveTab === 'video' && targetLesson.video) {
        setActiveTab('video');
      } else {
        setActiveTab(targetLesson.type === 'video' ? 'video' : 'doc');
      }

      const lessonProg = currentProgress?.[targetLesson.id];
      const initialWatchTime = lessonProg?.watchTime || 0;
      setCurrentTime(initialWatchTime);

      if (isResume) {
        showToast(`Resumed: ${targetLesson.title}`);
      }
    }
  }, [showToast]);

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
      if (data.courseStates) {
        setCourseStates(data.courseStates);
      }
      
      if (shouldScanContent && data.activeCoursePath) {
        await fetchCourseContent(data.activeCoursePath, data.courseStates?.[data.activeCoursePath]);
      }
    } catch (err) {
      console.error('Failed to load user data', err);
      setError('Failed to fetch user progress state.');
    }
  };

  // Initialize and load user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

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

  const fetchCourseContent = async (path, targetCourseState = null) => {
    if (!path) {
      setSections([]);
      setError(null);
      setActiveLesson(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/course-content?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      if (data.success) {
        setSections(data.sections);
        const effectiveProg = data.progress || progress;
        if (data.progress) {
          setProgress(data.progress);
        }
        if (data.courseState) {
          setCourseStates(prev => ({ ...prev, [path]: data.courseState }));
        }
        const stateToRestore = targetCourseState || data.courseState || courseStates[path] || null;
        restoreCourseStudyState(data.sections, stateToRestore, effectiveProg);
      } else {
        setError(data.error || 'Failed to scan course content.');
        setActiveLesson(null);
      }
    } catch (err) {
      console.error('Failed to scan course content', err);
      setError('Failed to reach backend server.');
      setActiveLesson(null);
    } finally {
      setLoading(false);
    }
  };

  // Change course folder path
  const handleSelectPath = async (newPath) => {
    if (!newPath || newPath === coursePath) return;
    try {
      setLoading(true);
      await flushCurrentPlayback();

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
      if (data.courseStates) {
        setCourseStates(data.courseStates);
      }
      if (data.progress) {
        setProgress(data.progress);
      }
      setTheaterMode(false);
      await fetchCourseContent(data.activeCoursePath, data.courseStates?.[data.activeCoursePath]);
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
      if (pathToDelete === coursePath) {
        await flushCurrentPlayback();
      }
      const res = await fetch('/api/userdata/course', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: pathToDelete })
      });
      const data = await res.json();
      setHistory(data.history);
      if (data.courseStates) {
        setCourseStates(data.courseStates);
      }
      if (data.activeCoursePath !== coursePath) {
        setCoursePath(data.activeCoursePath);
        setActiveLesson(null);
        await fetchCourseContent(data.activeCoursePath, data.courseStates?.[data.activeCoursePath]);
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
      if (oldPath === coursePath) {
        await flushCurrentPlayback();
      }
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
      if (data.courseStates) {
        setCourseStates(data.courseStates);
      }
      if (oldPath === coursePath) {
        setCoursePath(data.activeCoursePath);
        await fetchCourseContent(data.activeCoursePath, data.courseStates?.[data.activeCoursePath]);
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
          coursePath,
          lessonId,
          completed,
          watchTime: currentLessonProgress.watchTime || 0,
          duration: currentLessonProgress.duration || 0
        })
      });
      const data = await res.json();
      setProgress(data.progress);
      if (data.courseStates) {
        setCourseStates(data.courseStates);
      }
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
          coursePath,
          lessonId: activeLesson.id,
          watchTime: Math.floor(time),
          duration: Math.floor(duration)
        })
      })
      .then(res => res.json())
      .then(data => {
        // Silently update progress mapping
        setProgress(data.progress);
        if (data.courseStates) {
          setCourseStates(data.courseStates);
        }
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

  // Resizing event handlers for side panel
  const handleNotesResizeStart = (e) => {
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing');

    const handlePointerMove = (moveEvent) => {
      const clientX = moveEvent.clientX;
      const maxNotesWidth = window.innerWidth - 400;
      const calculatedWidth = window.innerWidth - clientX;
      const clampedWidth = Math.max(280, Math.min(650, maxNotesWidth, calculatedWidth));
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

  const handleNotesResizeReset = () => {
    setNotesWidth(360);
  };

  // Select lesson click handler
  const handleSelectLesson = (lesson, shouldAutoPlay = true) => {
    setAutoPlayVideo(shouldAutoPlay);
    setActiveLesson(lesson);
    setCurrentTime(0);

    const resources = getLessonResources(lesson);
    const defaultResource = resources.find(r => r.type === 'pdf' || r.type === 'html' || r.type === 'quiz') || resources[0] || null;
    setActiveResource(defaultResource);

    // Auto-select tab based on available assets
    const defaultTab = lesson.type === 'video' ? 'video' : 'doc';
    setActiveTab(defaultTab);

    // Save study state for this course
    if (coursePath) {
      const lessonWatchTime = progress[lesson.id]?.watchTime || 0;
      fetch('/api/userdata/course-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coursePath,
          lastLessonId: lesson.id,
          lastActiveTab: defaultTab,
          watchTime: lessonWatchTime
        })
      }).catch(err => console.error('Failed to update course state on lesson select:', err));
    }
  };

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (coursePath && activeLesson) {
      fetch('/api/userdata/course-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coursePath,
          lastLessonId: activeLesson.id,
          lastActiveTab: tab
        })
      }).catch(err => console.error('Failed to save active tab state:', err));
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

  const handleToggleControlsPosition = async () => {
    const nextVal = (settings.controlsPosition || 'floating') === 'bottom' ? 'floating' : 'bottom';
    const updatedSettings = { ...settings, controlsPosition: nextVal };
    setSettings(updatedSettings);

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
      console.error('Failed to save controlsPosition setting', err);
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

  const handleVolumeChange = (newVol, showFeedback = false) => {
    const clamped = Math.min(4, Math.max(0, Math.round(newVol * 100) / 100));
    setVolume(clamped);
    localStorage.setItem('udemy-player-volume', clamped);
    if (isMuted && clamped > 0) {
      setIsMuted(false);
      localStorage.setItem('udemy-player-muted', 'false');
    }
    if (showFeedback) {
      const pct = Math.round(clamped * 100);
      showToast(clamped > 1 ? `⚡ ${pct}%` : `🔊 ${pct}%`);
    }
  };

  const handleToggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('udemy-player-muted', next ? 'true' : 'false');
      const pct = Math.round(volume * 100);
      showToast(next ? '🔇 Muted' : (volume > 1 ? `⚡ ${pct}%` : `🔊 ${pct}%`));
      return next;
    });
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

  const handleOpenSectionSummary = (section) => {
    setActiveSectionForSummary(section);
    setShowChapterSummaryModal(true);
  };

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
    { key: 'ArrowUp', modifiers: ['shift'], action: () => handleVolumeChange(volume + 0.5, true), when: isVideoActive },
    { key: 'ArrowDown', modifiers: ['shift'], action: () => handleVolumeChange(volume - 0.5, true), when: isVideoActive },
    { key: 'ArrowUp', action: () => handleVolumeChange(volume + 0.1, true), when: isVideoActive },
    { key: 'ArrowDown', action: () => handleVolumeChange(volume - 0.1, true), when: isVideoActive },
    { key: 'm', action: handleToggleMute, when: isVideoActive },
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
    { key: 'b', action: () => setPanelCollapsed(c => !c) },
    { key: 'n', action: () => setPanelCollapsed(c => !c) },
    { key: 't', action: handleToggleTheaterMode, when: hasLesson },
    { key: 'Escape', action: () => {
      if (showShortcutsModal) setShowShortcutsModal(false);
      else if (showSettingsModal) setShowSettingsModal(false);
      else if (showCourseManager) setShowCourseManager(false);
      else if (showChapterSummaryModal) setShowChapterSummaryModal(false);
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
    <div className={`app-container ${theaterMode ? 'theater-mode' : ''} ${activeTab === 'video' && activeLesson?.video ? 'video-active' : ''}`}>
      <header className="app-header">
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

          <button
            className="btn-toggle"
            onClick={() => setPanelCollapsed(c => !c)}
            title={panelCollapsed ? "Open Sidebar (B or N)" : "Collapse Sidebar (B or N)"}
            style={{
              background: panelCollapsed ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-hover)',
              border: panelCollapsed ? '1px dashed var(--primary)' : '1px solid var(--border-color)',
              color: panelCollapsed ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-fast)'
            }}
          >
            <Menu size={18} />
          </button>

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
            onClick={() => setShowShortcutsModal(true)}
            title="Keyboard Shortcuts (?)"
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
            <Keyboard size={18} />
          </button>

          <button
            className="btn-toggle"
            onClick={() => setShowSettingsModal(true)}
            title="Settings (,)"
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
        className={`dashboard-content ${panelCollapsed ? 'notes-collapsed' : ''}`}
        style={{
          '--notes-width': panelCollapsed ? '0px' : `${notesWidth}px`
        }}
      >
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
              
              {/* Unified Stage Header Bar */}
              <div className="stage-header-banner">
                <div className="stage-header-left">
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

                <div className="stage-header-right">
                  {/* Tab Selector (only shown if a lesson has multiple assets, e.g. video and companion PDF sheet) */}
                  {hasMultipleTabs && (
                    <div className="stage-nav-tabs">
                      <button
                        className={`stage-nav-tab ${activeTab === 'video' ? 'active' : ''}`}
                        onClick={() => handleSelectTab('video')}
                      >
                        <Play size={13} /> Video Lesson
                      </button>
                      <button
                        className={`stage-nav-tab ${activeTab === 'doc' ? 'active' : ''}`}
                        onClick={() => handleSelectTab('doc')}
                      >
                        <BookOpen size={13} /> Companion Resources
                      </button>
                    </div>
                  )}

                  {/* Theater toggle button on stage bar when in theater mode */}
                  {theaterMode && (
                    <button
                      className="stage-theater-toggle-btn"
                      onClick={handleToggleTheaterMode}
                      title="Exit Theater Mode (t)"
                    >
                      <Minimize2 size={14} />
                    </button>
                  )}
                </div>
              </div>

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
                    key={`${coursePath}:${activeLesson.id}`}
                    videoPath={activeLesson.video}
                    subtitles={activeLesson.subtitles}
                    initialTime={activeLessonProgress.watchTime || 0}
                    autoPlay={autoPlayVideo}
                    onTimeUpdate={handleTimeUpdate}
                    playerRef={playerRef}
                    onSubtitlesUpdated={handleSubtitlesUpdated}
                    activeLang={activeLang}
                    setActiveLang={setActiveLang}
                    secondaryLang={secondaryLang}
                    setSecondaryLang={setSecondaryLang}
                    speed={speed}
                    onSpeedChange={handleSpeedChange}
                    volume={volume}
                    onVolumeChange={handleVolumeChange}
                    isMuted={isMuted}
                    onToggleMute={handleToggleMute}
                    toastMessage={toast.message}
                    toastId={toast.id}
                    autoplayEnabled={settings.autoplayNext}
                    onToggleAutoplay={handleToggleAutoplay}
                    hasNextLesson={!!nextLesson}
                    nextLessonTitle={nextLesson?.title || ''}
                    onPlayNextLesson={goToNextLesson}
                    theaterMode={theaterMode}
                    onToggleTheaterMode={handleToggleTheaterMode}
                    sidebarCollapsed={panelCollapsed}
                    onToggleSidebar={() => setPanelCollapsed(c => !c)}
                    notesCollapsed={panelCollapsed}
                    onToggleNotes={() => setPanelCollapsed(c => !c)}
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                    autoCreateTimeline={settings.autoCreateTimeline}
                    autoCreateTimelineLang={settings.autoCreateTimelineLang}
                    hasApiKey={hasApiKey}
                    hasMultipleTabs={hasMultipleTabs}
                    activeTab={activeTab}
                    onSelectTab={handleSelectTab}
                    controlsPosition={settings.controlsPosition || 'floating'}
                    onToggleControlsPosition={handleToggleControlsPosition}
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
                      ) : activeResource ? (
                        <LocalResourceCard resource={activeResource} />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', color: 'var(--text-secondary)', textAlign: 'center', gap: '16px' }}>
                          <BookOpen size={48} style={{ color: 'var(--text-muted)' }} />
                          <div>
                            <h5 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>Companion Resource Viewer</h5>
                            <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '360px' }}>
                              No resource selected. Select a resource on the left to view it.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
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
                Select a section chapter and choose a lesson from the right sidebar to start playing.
              </div>
            </div>
          )}
        </section>

        {/* Right Sidebar */}
        {!panelCollapsed && (
          <NotesPanel
            notes={activeLessonNotes}
            currentTime={currentTime}
            onAddNote={handleAddNote}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            onSeek={handleSeek}
            onPauseVideo={handlePauseVideo}
            sections={sections}
            progress={progress}
            onSelectLesson={handleSelectLesson}
            onToggleComplete={handleToggleComplete}
            onOpenSectionSummary={handleOpenSectionSummary}
            activeLesson={activeLesson}
            coursePath={coursePath}
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
      {showChapterSummaryModal && (
        <ChapterSummaryModal
          isOpen={showChapterSummaryModal}
          onClose={() => setShowChapterSummaryModal(false)}
          section={activeSectionForSummary}
          coursePath={coursePath}
          hasApiKey={hasApiKey}
          aiProvider={settings.aiProvider || 'gemini'}
          defaultLang={summaryLang || activeLang || 'en'}
          onLanguageChange={setSummaryLang}
        />
      )}
    </div>
  );
}
