import React, { useEffect, useState, useRef } from 'react';
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

export default function VideoPlayer({
  videoPath,
  subtitles = {},
  initialTime,
  onTimeUpdate,
  playerRef,
  onSubtitlesUpdated,
  activeLang,
  setActiveLang,
  speed,
  onSpeedChange,
  toastMessage,
  toastId,
  autoplayEnabled = false,
  onToggleAutoplay,
  hasNextLesson = false,
  nextLessonTitle = '',
  onPlayNextLesson
}) {
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);
  const [subtitleSize, setSubtitleSize] = useState(() => {
    return localStorage.getItem('udemy-player-subtitle-size') || '100%';
  });
  const [countdown, setCountdown] = useState(5);
  const [showAutoplayOverlay, setShowAutoplayOverlay] = useState(false);

  useEffect(() => {
    localStorage.setItem('udemy-player-subtitle-size', subtitleSize);
  }, [subtitleSize]);

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

  const backendOrigin = getBackendOrigin();
  const videoSrc = `${backendOrigin}/api/stream?path=${encodeURIComponent(videoPath)}`;
  const subtitlePath = subtitles?.[activeLang];
  const subtitleSrc = subtitlePath ? `${backendOrigin}/api/subtitle?path=${encodeURIComponent(subtitlePath)}` : null;

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
      if (!hasSeekedRef.current && initialTime && initialTime > 0) {
        hasSeekedRef.current = true;
        video.currentTime = initialTime;
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

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    // If video is already loaded or metadata is cached
    if (video.readyState >= 1 && !hasSeekedRef.current && initialTime && initialTime > 0) {
      hasSeekedRef.current = true;
      video.currentTime = initialTime;
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoPath, initialTime, autoplayEnabled, hasNextLesson]);

  const availableLangs = Object.keys(subtitles || {});
  const translatableLangs = CURATED_LANGUAGES.filter(lang => !availableLangs.includes(lang.code));

  return (
    <div 
      className="video-container" 
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
            key={activeLang}
            kind="subtitles"
            src={subtitleSrc}
            srcLang={activeLang}
            label={getLangName(activeLang)}
            default
          />
        )}
      </video>

      {/* Subtitles & Translation Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          background: 'var(--overlay-chip-bg)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--overlay-chip-border)',
          borderRadius: '20px',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 5
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0 4px' }}>Subtitles:</span>
        {availableLangs.map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveLang(lang)}
            style={{
              background: activeLang === lang ? 'var(--primary)' : 'transparent',
              color: activeLang === lang ? 'white' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '16px',
              padding: '4px 8px',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
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
            style={{
              background: 'var(--overlay-chip-bg)',
              color: 'var(--primary)',
              border: '1px dashed var(--primary)',
              borderRadius: '16px',
              padding: '3px 8px',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
              outline: 'none'
            }}
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
        {availableLangs.length > 0 && (
          <>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 4px' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0 4px' }}>Size:</span>
            <select
              value={subtitleSize}
              onChange={(e) => setSubtitleSize(e.target.value)}
              style={{
                background: 'var(--overlay-chip-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--overlay-chip-border)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                padding: '2px 8px',
                borderRadius: '12px',
                transition: 'var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--text-muted)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--overlay-chip-border)'}
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
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0 4px' }}>None</span>
        )}
      </div>

      {translationError && (
        <div style={{
          position: 'absolute',
          top: '52px',
          left: '16px',
          background: '#7f1d1d',
          border: '1px solid #f87171',
          color: '#fca5a5',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '0.75rem',
          maxWidth: '320px',
          zIndex: 6,
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <span>{translationError}</span>
          <button 
            onClick={() => setTranslationError(null)}
            style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Right Controls Overlay Container */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          gap: '8px',
          zIndex: 5
        }}
      >
        {/* Autoplay Toggle Overlay */}
        <div
          style={{
            background: 'var(--overlay-chip-bg)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--overlay-chip-border)',
            borderRadius: '20px',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0 4px' }}>Autoplay:</span>
          <button
            onClick={onToggleAutoplay}
            style={{
              background: autoplayEnabled ? 'var(--primary)' : 'transparent',
              color: autoplayEnabled ? 'white' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '16px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            {autoplayEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Playback speed selector Overlay */}
        <div
          style={{
            background: 'var(--overlay-chip-bg)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--overlay-chip-border)',
            borderRadius: '20px',
            padding: '4px 8px',
            display: 'flex',
            gap: '4px'
          }}
        >
          {[1, 1.25, 1.5, 1.75, 2].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              style={{
                background: speed === s ? 'var(--primary)' : 'transparent',
                color: speed === s ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '16px',
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Autoplay Countdown Overlay */}
      {showAutoplayOverlay && (
        <div
          className="autoplay-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            color: 'white',
            textAlign: 'center',
            padding: '24px',
            animation: 'fade-in 0.3s ease'
          }}
        >
          <div style={{ maxWidth: '480px', width: '100%' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Up Next
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '8px', marginBottom: '24px', color: '#ffffff', lineHeight: 1.3 }}>
              {nextLessonTitle}
            </h2>
            
            {/* Smooth Shrinking Progress Bar */}
            <div style={{
              width: '100%',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              marginBottom: '20px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: 'var(--primary)',
                width: `${(countdown / 5) * 100}%`,
                transition: 'width 1s linear',
                borderRadius: '2px'
              }} />
            </div>
            
            <p style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '32px' }}>
              Starting in <strong style={{ color: 'white', fontSize: '1.15rem' }}>{countdown}</strong> seconds...
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <button
                onClick={handleCancelAutoplay}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  padding: '10px 24px',
                  borderRadius: '24px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handlePlayNow}
                style={{
                  background: 'var(--primary)',
                  border: 'none',
                  color: 'white',
                  padding: '10px 24px',
                  borderRadius: '24px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--primary-hover)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Play Now
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
