import React, { useEffect, useState } from 'react';

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

export default function VideoPlayer({ videoPath, subtitles = {}, initialTime, onTimeUpdate, playerRef, onSubtitlesUpdated }) {
  const [speed, setSpeed] = useState(1);
  const [activeLang, setActiveLang] = useState('');
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);
  const [subtitleSize, setSubtitleSize] = useState(() => {
    return localStorage.getItem('udemy-player-subtitle-size') || '100%';
  });

  useEffect(() => {
    localStorage.setItem('udemy-player-subtitle-size', subtitleSize);
  }, [subtitleSize]);

  // Sync active language when subtitles list or video path changes
  useEffect(() => {
    const keys = Object.keys(subtitles || {});
    if (keys.length > 0) {
      if (activeLang && keys.includes(activeLang)) {
        // Keep active language if still available
      } else if (keys.includes('en')) {
        setActiveLang('en');
      } else {
        setActiveLang(keys[0]);
      }
    } else {
      setActiveLang('');
    }
    setTranslationError(null);
  }, [videoPath, subtitles]);

  const handleStartTranslation = async (targetLangCode) => {
    const englishPath = subtitles?.en;
    if (!englishPath) return;

    setTranslating(true);
    setTranslationError(null);

    try {
      const response = await fetch('/api/translate-subtitle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtitlePath: englishPath, targetLang: targetLangCode })
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
      return 'http://localhost:3003';
    }
    return window.location.origin;
  };

  const backendOrigin = getBackendOrigin();
  const videoSrc = `${backendOrigin}/api/stream?path=${encodeURIComponent(videoPath)}`;
  const subtitlePath = subtitles?.[activeLang];
  const subtitleSrc = subtitlePath ? `${backendOrigin}/api/subtitle?path=${encodeURIComponent(subtitlePath)}` : null;

  const hasSeekedRef = React.useRef(false);

  // Reset the seek flag when the video file changes
  useEffect(() => {
    hasSeekedRef.current = false;
  }, [videoPath]);

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

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    // If video is already loaded or metadata is cached
    if (video.readyState >= 1 && !hasSeekedRef.current && initialTime && initialTime > 0) {
      hasSeekedRef.current = true;
      video.currentTime = initialTime;
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoPath, initialTime]);

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (playerRef.current) {
      playerRef.current.playbackRate = newSpeed;
    }
  };

  // Keyboard controls for standard hotkeys
  const handleKeyDown = (e) => {
    const video = playerRef.current;
    if (!video) return;

    // Block keyboard control when typing notes
    if (
      document.activeElement.tagName === 'INPUT' || 
      document.activeElement.tagName === 'TEXTAREA' ||
      document.activeElement.isContentEditable
    ) {
      return;
    }

    switch (e.key) {
      case ' ':
        e.preventDefault();
        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 5);
        break;
      case 'ArrowRight':
        e.preventDefault();
        video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
        break;
      case 'ArrowUp':
        e.preventDefault();
        video.volume = Math.min(1, video.volume + 0.1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        video.volume = Math.max(0, video.volume - 0.1);
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          video.requestFullscreen().catch(() => {});
        }
        break;
      default:
        break;
    }
  };

  const availableLangs = Object.keys(subtitles || {});
  const translatableLangs = CURATED_LANGUAGES.filter(lang => !availableLangs.includes(lang.code));

  return (
    <div 
      className="video-container" 
      onKeyDown={handleKeyDown} 
      tabIndex={0} // Focusable for capturing hotkeys
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
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
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
        {subtitles?.en && translatableLangs.length > 0 && (
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
              background: 'rgba(99, 102, 241, 0.15)',
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
            <option value="" disabled style={{ background: '#0f172a', color: 'var(--text-secondary)' }}>
              {translating ? 'Translating...' : 'Translate to...'}
            </option>
            {translatableLangs.map((lang) => (
              <option key={lang.code} value={lang.code} style={{ background: '#0f172a', color: 'var(--text-primary)' }}>
                {lang.name}
              </option>
            ))}
          </select>
        )}
        {availableLangs.length > 0 && (
          <>
            <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.15)', margin: '0 4px' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0 4px' }}>Size:</span>
            <select
              value={subtitleSize}
              onChange={(e) => setSubtitleSize(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                padding: '2px 8px',
                borderRadius: '12px',
                transition: 'var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
            >
              <option value="50%" style={{ background: '#0f172a', color: 'var(--text-primary)' }}>50%</option>
              <option value="75%" style={{ background: '#0f172a', color: 'var(--text-primary)' }}>75%</option>
              <option value="100%" style={{ background: '#0f172a', color: 'var(--text-primary)' }}>100%</option>
              <option value="130%" style={{ background: '#0f172a', color: 'var(--text-primary)' }}>130%</option>
              <option value="160%" style={{ background: '#0f172a', color: 'var(--text-primary)' }}>160%</option>
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

      {/* Playback speed selector Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '4px 8px',
          display: 'flex',
          gap: '4px',
          zIndex: 5
        }}
      >
        {[1, 1.25, 1.5, 1.75, 2].map((s) => (
          <button
            key={s}
            onClick={() => handleSpeedChange(s)}
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
  );
}
