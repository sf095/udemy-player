import React, { useEffect, useState, useRef } from 'react';
import { Maximize2, Minimize2, Menu, BookOpen } from 'lucide-react';
import ShortcutToast from './ShortcutToast';

const CURATED_LANGUAGES = [
  { code: 'vi', name: 'Vietnamese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' }
];

function parseTimestamp(timeStr) {
  if (!timeStr) return 0;
  const cleanTimeStr = timeStr.trim().replace(/,/g, '.');
  const parts = cleanTimeStr.split(':');
  
  const hours = parts.length === 3 ? (parseInt(parts[0], 10) || 0) : 0;
  const minutes = parts.length === 3 
    ? (parseInt(parts[1], 10) || 0) 
    : (parts.length === 2 ? (parseInt(parts[0], 10) || 0) : 0);
  
  const secondsWithMs = parts.length === 3 
    ? parts[2] 
    : (parts.length === 2 ? parts[1] : parts[0]);

  const secondsParts = secondsWithMs.split('.');
  const seconds = parseInt(secondsParts[0], 10) || 0;
  const ms = parseInt(secondsParts[1], 10) || 0;

  return hours * 3600 + minutes * 60 + seconds + ms / 1000;
}

function formatTimestamp(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const ms = Math.round((totalSeconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function parseVttCues(vttText) {
  const cues = [];
  if (!vttText) return cues;
  
  const normalized = vttText.replace(/\r\n/g, '\n').replace(/\uFEFF/g, '');
  const blocks = normalized.split(/\n\n+/);
  
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    
    if (lines[0].startsWith('WEBVTT') || lines[0].startsWith('NOTE')) {
      continue;
    }
    
    const timeLineIndex = lines.findIndex(l => l.includes('-->'));
    if (timeLineIndex === -1) continue;
    
    const timeLine = lines[timeLineIndex];
    const parts = timeLine.split('-->');
    if (parts.length < 2) continue;
    
    const start = parseTimestamp(parts[0].trim());
    const end = parseTimestamp(parts[1].trim());
    
    const textLines = lines.slice(timeLineIndex + 1);
    if (textLines.length === 0) continue;
    
    const text = textLines.join('\n');
    cues.push({ start, end, text });
  }
  
  cues.sort((a, b) => a.start - b.start);
  return cues;
}

function mergeVttCues(cuesA, cuesB) {
  const merged = [];
  const usedB = new Set();
  
  for (const a of cuesA) {
    const overlaps = cuesB.filter((b, index) => {
      const isOverlap = b.start < a.end && b.end > a.start;
      if (isOverlap) {
        usedB.add(index);
      }
      return isOverlap;
    });
    
    if (overlaps.length > 0) {
      const secondaryText = overlaps.map(o => o.text).join(' ');
      merged.push({
        start: a.start,
        end: a.end,
        text: `${a.text}\n<c.secondary>${secondaryText}</c>`
      });
    } else {
      merged.push({
        start: a.start,
        end: a.end,
        text: a.text
      });
    }
  }
  
  cuesB.forEach((b, index) => {
    if (!usedB.has(index)) {
      merged.push({
        start: b.start,
        end: b.end,
        text: `<c.secondary>${b.text}</c>`
      });
    }
  });
  
  merged.sort((a, b) => a.start - b.start);
  return merged;
}

function generateVtt(cues) {
  if (!cues || cues.length === 0) return null;
  let vtt = 'WEBVTT\n\n';
  cues.forEach((cue, index) => {
    vtt += `${index + 1}\n`;
    vtt += `${formatTimestamp(cue.start)} --> ${formatTimestamp(cue.end)}\n`;
    vtt += `${cue.text}\n\n`;
  });
  return vtt;
}

export default function VideoPlayer({
  videoPath,
  subtitles = {},
  initialTime,
  onTimeUpdate,
  playerRef,
  onSubtitlesUpdated,
  activeLang,
  setActiveLang,
  secondaryLang = '',
  setSecondaryLang,
  speed,
  onSpeedChange,
  toastMessage,
  toastId,
  autoplayEnabled = false,
  onToggleAutoplay,
  hasNextLesson = false,
  nextLessonTitle = '',
  onPlayNextLesson,
  theaterMode = false,
  onToggleTheaterMode,
  sidebarCollapsed = false,
  onToggleSidebar,
  notesCollapsed = false,
  onToggleNotes
}) {
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);
  const [subtitleSize, setSubtitleSize] = useState(() => {
    return localStorage.getItem('udemy-player-subtitle-size') || '100%';
  });
  const [countdown, setCountdown] = useState(5);
  const [showAutoplayOverlay, setShowAutoplayOverlay] = useState(false);
  const [mergedSubtitleUrl, setMergedSubtitleUrl] = useState(null);
  const [loadingMergedSubs, setLoadingMergedSubs] = useState(false);
  const mergedUrlRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [confirmReTranslate, setConfirmReTranslate] = useState(null);

  // Auto-hide overlays and cursor on mouse inactivity when playing
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      return;
    }

    let timeoutId;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    };

    const container = playerRef.current?.closest('.video-container');
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('touchstart', handleMouseMove);
    }

    timeoutId = setTimeout(() => {
      setShowControls(false);
    }, 2500);

    return () => {
      clearTimeout(timeoutId);
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('touchstart', handleMouseMove);
      }
    };
    // playerRef is a stable ref object — no need to list it as a dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  useEffect(() => {
    localStorage.setItem('udemy-player-subtitle-size', subtitleSize);
  }, [subtitleSize]);

  // Close context menu on outside click or Escape key.
  // Defer listener registration to the next tick so the right-click that opened
  // the menu doesn't immediately fire the click-outside handler.
  useEffect(() => {
    if (!contextMenu) return;

    const handleClick = () => setContextMenu(null);
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setConfirmReTranslate(null);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleClick);
      document.addEventListener('keydown', handleKey);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [contextMenu]);

  // Sync active language when subtitles list or video path changes
  useEffect(() => {
    const keys = Object.keys(subtitles || {});
    let nextLang = '';
    if (keys.length > 0) {
      if (activeLang && keys.includes(activeLang)) {
        nextLang = activeLang;
      } else if (keys.includes('en')) {
        nextLang = 'en';
      } else {
        nextLang = keys[0];
      }
    }
    const timer = setTimeout(() => {
      if (nextLang !== activeLang) {
        setActiveLang(nextLang);
      }
      setTranslationError(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [videoPath, subtitles, activeLang, setActiveLang]);

  const handleStartTranslation = async (targetLangCode) => {
    const sourcePath = subtitles?.[activeLang];
    if (!sourcePath) return;

    setTranslating(true);
    setTranslationError(null);

    try {
      const response = await fetch('/api/translate-subtitle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtitlePath: sourcePath, targetLang: targetLangCode })
      });
      const data = await response.json();
      if (data.success) {
        if (onSubtitlesUpdated) {
          await onSubtitlesUpdated();
        }
        // Select the newly translated language
        setActiveLang(targetLangCode);
      } else {
        setTranslationError(data.error || 'Failed to translate subtitles.');
      }
    } catch (err) {
      console.error('Translation error', err);
      setTranslationError('Network error during translation.');
    } finally {
      setTranslating(false);
    }
  };

  const handleReTranslate = async (targetLangCode) => {
    const sourcePath = subtitles?.[activeLang];
    if (!sourcePath) return;

    setTranslating(true);
    setTranslationError(null);

    try {
      const response = await fetch('/api/translate-subtitle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtitlePath: sourcePath, targetLang: targetLangCode })
      });
      const data = await response.json();
      if (data.success) {
        if (onSubtitlesUpdated) await onSubtitlesUpdated();
        setActiveLang(targetLangCode);
      } else {
        setTranslationError(data.error || 'Failed to re-translate subtitles.');
      }
    } catch (err) {
      console.error('Re-translation error', err);
      setTranslationError('Network error during re-translation.');
    } finally {
      setTranslating(false);
      setConfirmReTranslate(null);
      setContextMenu(null);
    }
  };

  const getLangName = (code) => {
    const found = CURATED_LANGUAGES.find(l => l.code === code);
    return found ? found.name : code.toUpperCase();
  };

  const getBackendOrigin = () => {
    if (window.location.port === '3002') {
      return 'http://127.0.0.1:3003';
    }
    return window.location.origin;
  };

  // Clean up Blob URL on unmount
  useEffect(() => {
    return () => {
      if (mergedUrlRef.current) {
        URL.revokeObjectURL(mergedUrlRef.current);
      }
    };
  }, []);

  const backendOrigin = getBackendOrigin();
  const primarySubtitlePath = subtitles?.[activeLang];
  const secondarySubtitlePath = secondaryLang ? subtitles?.[secondaryLang] : null;

  useEffect(() => {
    // If we have both activeLang and secondaryLang, merge them!
    if (activeLang && secondaryLang && primarySubtitlePath && secondarySubtitlePath) {
      let isCancelled = false;
      const controller = new AbortController();

      Promise.resolve().then(() => {
        if (!isCancelled) {
          setLoadingMergedSubs(true);
        }
      });

      const fetchAndMerge = async () => {
        try {
          const [resA, resB] = await Promise.all([
            fetch(`${backendOrigin}/api/subtitle?path=${encodeURIComponent(primarySubtitlePath)}`, { signal: controller.signal }),
            fetch(`${backendOrigin}/api/subtitle?path=${encodeURIComponent(secondarySubtitlePath)}`, { signal: controller.signal })
          ]);

          if (!resA.ok || !resB.ok) {
            throw new Error('Failed to fetch subtitle files');
          }

          const [textA, textB] = await Promise.all([resA.text(), resB.text()]);

          if (isCancelled) return;

          const cuesA = parseVttCues(textA);
          const cuesB = parseVttCues(textB);
          const mergedCues = mergeVttCues(cuesA, cuesB);
          const mergedVtt = generateVtt(mergedCues);

          if (!mergedVtt) {
            // No cues in either source — fall back to single-track
            setLoadingMergedSubs(false);
            setMergedSubtitleUrl(null);
            return;
          }

          const blob = new Blob([mergedVtt], { type: 'text/vtt' });
          const url = URL.createObjectURL(blob);

          if (!isCancelled) {
            if (mergedUrlRef.current) {
              URL.revokeObjectURL(mergedUrlRef.current);
            }
            mergedUrlRef.current = url;
            setMergedSubtitleUrl(url);
            setLoadingMergedSubs(false);
          } else {
            URL.revokeObjectURL(url);
          }
        } catch (err) {
          if (err.name === 'AbortError') return; // expected on cleanup — no action needed
          console.error('Error fetching or merging subtitles:', err);
          if (!isCancelled) {
            setLoadingMergedSubs(false);
            if (mergedUrlRef.current) {
              URL.revokeObjectURL(mergedUrlRef.current);
              mergedUrlRef.current = null;
            }
            setMergedSubtitleUrl(null);
          }
        }
      };

      fetchAndMerge();

      return () => {
        isCancelled = true;
        controller.abort();
      };
    } else {
      if (mergedUrlRef.current) {
        URL.revokeObjectURL(mergedUrlRef.current);
        mergedUrlRef.current = null;
      }
      Promise.resolve().then(() => {
        setMergedSubtitleUrl(null);
        setLoadingMergedSubs(false);
      });
    }
  }, [videoPath, activeLang, secondaryLang, primarySubtitlePath, secondarySubtitlePath, backendOrigin]);

  const videoSrc = `${backendOrigin}/api/stream?path=${encodeURIComponent(videoPath)}`;
  const subtitleSrc = mergedSubtitleUrl
    ? mergedSubtitleUrl
    : (primarySubtitlePath ? `${backendOrigin}/api/subtitle?path=${encodeURIComponent(primarySubtitlePath)}` : null);

  const hasSeekedRef = React.useRef(false);

  // Reset states when the video file changes
  useEffect(() => {
    hasSeekedRef.current = false;
    setShowAutoplayOverlay(false);
    setCountdown(5);
  }, [videoPath]);

  // Stable ref for the play-next callback to avoid effect re-runs
  const onPlayNextLessonRef = useRef(onPlayNextLesson);
  onPlayNextLessonRef.current = onPlayNextLesson;

  // Countdown timer logic when autoplay overlay is showing
  useEffect(() => {
    if (!showAutoplayOverlay) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Brief fade-out before transitioning
          const overlay = document.querySelector('.autoplay-overlay');
          if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.2s ease';
          }
          setTimeout(() => {
            setShowAutoplayOverlay(false);
            onPlayNextLessonRef.current?.();
          }, 200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showAutoplayOverlay]);

  const handleCancelAutoplay = () => {
    setShowAutoplayOverlay(false);
  };

  const handlePlayNow = () => {
    setShowAutoplayOverlay(false);
    if (onPlayNextLesson) {
      onPlayNextLesson();
    }
  };

  useEffect(() => {
    const video = playerRef.current;
    if (!video) return;

    // Keep speed constant across source changes
    video.playbackRate = speed;

    const handleLoadedMetadata = () => {
      video.playbackRate = speed;
      if (!hasSeekedRef.current) {
        hasSeekedRef.current = true;
        if (initialTime && initialTime > 0) {
          video.currentTime = initialTime;
        }
      }
    };

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime, video.duration);
    };

    const handleEnded = () => {
      if (autoplayEnabled && hasNextLesson) {
        setCountdown(5);
        setShowAutoplayOverlay(true);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // If video is already loaded or metadata is cached
    if (video.readyState >= 1 && !hasSeekedRef.current) {
      hasSeekedRef.current = true;
      if (initialTime && initialTime > 0) {
        video.currentTime = initialTime;
      }
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoPath, initialTime, autoplayEnabled, hasNextLesson]);

  const availableLangs = Object.keys(subtitles || {});
  const translatableLangs = CURATED_LANGUAGES.filter(lang => !availableLangs.includes(lang.code));

  return (
    <div 
      className={`video-container ${!showControls ? 'controls-hidden' : ''}`}
      style={{ 
        outline: 'none', 
        width: '100%', 
        height: '100%',
        '--subtitle-size': subtitleSize
      }}
    >
      <video
        key={videoPath} // Force recreation of player state when path changes
        ref={playerRef}
        src={videoSrc}
        crossOrigin="anonymous"
        className="custom-video"
        controls
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%' }}
      >
        {subtitleSrc && (
          <track
            key={mergedSubtitleUrl ? `merged-${activeLang}-${secondaryLang}` : `single-${activeLang}`}
            kind="subtitles"
            src={subtitleSrc}
            srcLang={activeLang}
            label={getLangName(activeLang)}
            default
          />
        )}
      </video>

      {/* Symmetrical Floating Control Panels (Left & Right) inside absolute container */}
      <div className="video-overlays-container">
        {/* Subtitles & Translation Panel (Left) */}
        <div className="video-overlay-left">
          <span className="video-overlay-label">Subtitles:</span>
          {availableLangs.map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveLang(lang)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (translating) return;
                // Don't re-translate the active language to itself
                if (lang === activeLang) return;
                // Match .context-menu min-width + padding from CSS
                const menuWidth = 200;
                const x = Math.min(e.clientX, window.innerWidth - menuWidth);
                const y = Math.min(e.clientY, window.innerHeight - 40);
                setContextMenu({ lang, x, y });
              }}
              className={`video-overlay-btn ${activeLang === lang ? 'active' : ''}`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
          {activeLang && subtitles?.[activeLang] && translatableLangs.length > 0 && (
            <select
              value=""
              disabled={translating}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  handleStartTranslation(val);
                }
              }}
              className="video-overlay-select translate-select"
            >
              <option value="" disabled style={{ background: 'var(--select-option-bg)', color: 'var(--text-secondary)' }}>
                {translating ? 'Translating...' : 'Translate to...'}
              </option>
              {translatableLangs.map((lang) => (
                <option key={lang.code} value={lang.code} style={{ background: 'var(--select-option-bg)', color: 'var(--text-primary)' }}>
                  {lang.name}
                </option>
              ))}
            </select>
          )}
          {availableLangs.length > 1 && activeLang && (
            <>
              <div className="video-overlay-separator" />
              <span className="video-overlay-label">2nd Sub:</span>
              <select
                value={secondaryLang}
                disabled={loadingMergedSubs}
                onChange={(e) => setSecondaryLang(e.target.value)}
                className="video-overlay-select"
              >
                <option value="" style={{ background: 'var(--select-option-bg)', color: 'var(--text-secondary)' }}>
                  {loadingMergedSubs ? 'Merging...' : 'None'}
                </option>
                {availableLangs
                  .filter((lang) => lang !== activeLang)
                  .map((lang) => (
                    <option key={lang} value={lang} style={{ background: 'var(--select-option-bg)', color: 'var(--text-primary)' }}>
                      {lang.toUpperCase()}
                    </option>
                  ))}
              </select>
            </>
          )}
          {availableLangs.length > 0 && (
            <>
              <div className="video-overlay-separator" />
              <span className="video-overlay-label">Size:</span>
              <select
                value={subtitleSize}
                onChange={(e) => setSubtitleSize(e.target.value)}
                className="video-overlay-select"
              >
                <option value="50%" style={{ background: 'var(--select-option-bg)', color: 'var(--text-primary)' }}>50%</option>
                <option value="75%" style={{ background: 'var(--select-option-bg)', color: 'var(--text-primary)' }}>75%</option>
                <option value="100%" style={{ background: 'var(--select-option-bg)', color: 'var(--text-primary)' }}>100%</option>
                <option value="130%" style={{ background: 'var(--select-option-bg)', color: 'var(--text-primary)' }}>130%</option>
                <option value="160%" style={{ background: 'var(--select-option-bg)', color: 'var(--text-primary)' }}>160%</option>
              </select>
            </>
          )}
          {availableLangs.length === 0 && (
            <span className="video-overlay-label" style={{ color: 'var(--text-muted)' }}>None</span>
          )}
        </div>

        {/* Player Controls & Speed Panel (Right) */}
        <div className="video-overlay-right">
          {/* Toggle Sidebar/Menu Overlay */}
          <button
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? "Open Course Content (b)" : "Collapse Course Content (b)"}
            className={`video-overlay-btn ${!sidebarCollapsed ? 'active' : ''}`}
            style={{ borderRadius: '12px', padding: '4px 6px' }}
          >
            <Menu size={14} />
          </button>

          {/* Toggle Notes Overlay */}
          <button
            onClick={onToggleNotes}
            title={notesCollapsed ? "Open Notes Panel (n)" : "Collapse Notes Panel (n)"}
            className={`video-overlay-btn ${!notesCollapsed ? 'active' : ''}`}
            style={{ borderRadius: '12px', padding: '4px 6px' }}
          >
            <BookOpen size={14} />
          </button>

          {/* Theater Mode Toggle Overlay */}
          <button
            onClick={onToggleTheaterMode}
            title={theaterMode ? "Exit Theater Mode (t)" : "Theater Mode (t)"}
            className={`video-overlay-btn ${theaterMode ? 'active' : ''}`}
            style={{ borderRadius: '12px', padding: '4px 6px' }}
          >
            {theaterMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <div className="video-overlay-separator" />

          <span className="video-overlay-label">Autoplay:</span>
          <button
            onClick={onToggleAutoplay}
            className={`video-overlay-btn ${autoplayEnabled ? 'active' : ''}`}
            style={{ borderRadius: '12px' }}
          >
            {autoplayEnabled ? 'ON' : 'OFF'}
          </button>

          <div className="video-overlay-separator" />

          <span className="video-overlay-label">Speed:</span>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="video-overlay-select"
          >
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="1.75">1.75x</option>
            <option value="2">2x</option>
          </select>
        </div>
      </div>

      {/* Translation Error Toast */}
      {translationError && (
        <div className="video-translation-error">
          <span>{translationError}</span>
          <button
            onClick={() => setTranslationError(null)}
            className="video-translation-error-close"
          >
            ✕
          </button>
        </div>
      )}

      {/* Autoplay Countdown Overlay */}
      {showAutoplayOverlay && (
        <div className="autoplay-overlay">
          <div className="autoplay-card">
            <span className="autoplay-badge">Up Next</span>
            <h2 className="autoplay-title">{nextLessonTitle}</h2>

            {/* Smooth Shrinking Progress Bar */}
            <div className="autoplay-progress-bar">
              <div
                className="autoplay-progress-fill"
                style={{ width: `${(countdown / 5) * 100}%` }}
              />
            </div>

            <p className="autoplay-countdown-text">
              Starting in <strong>{countdown}</strong> seconds...
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <button onClick={handleCancelAutoplay} className="autoplay-btn-cancel">
                Cancel
              </button>
              <button onClick={handlePlayNow} className="autoplay-btn-play">
                Play Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context menu for re-translate */}
      {contextMenu && (() => {
        const langName = getLangName(contextMenu.lang);
        return (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="context-menu-item"
            disabled={translating}
            onClick={() => {
              setConfirmReTranslate({ lang: contextMenu.lang, langName });
              setContextMenu(null);
            }}
          >
            ↻ Re-translate to {langName}
          </button>
        </div>
        );
      })()}

      {/* Confirmation dialog for re-translate */}
      {confirmReTranslate && (
        <div
          className="confirm-overlay"
          onClick={() => setConfirmReTranslate(null)}
        >
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <p>
              This will overwrite the existing <strong>{confirmReTranslate.langName}</strong> translation using the currently active language as the source. Continue?
            </p>
            <div className="confirm-dialog-buttons">
              <button
                className="confirm-btn-cancel"
                onClick={() => setConfirmReTranslate(null)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn-confirm"
                disabled={translating}
                onClick={() => handleReTranslate(confirmReTranslate.lang)}
              >
                {translating ? 'Translating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcut toast */}
      <ShortcutToast message={toastMessage} id={toastId} />
    </div>
  );
}
