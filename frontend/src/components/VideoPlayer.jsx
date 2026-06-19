import React, { useEffect, useState } from 'react';

export default function VideoPlayer({ videoPath, subtitlePath, initialTime, onTimeUpdate, playerRef }) {
  const [speed, setSpeed] = useState(1);
  const videoSrc = `http://localhost:3001/api/stream?path=${encodeURIComponent(videoPath)}`;
  const subtitleSrc = subtitlePath ? `http://localhost:3001/api/subtitle?path=${encodeURIComponent(subtitlePath)}` : null;

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

  return (
    <div 
      className="video-container" 
      onKeyDown={handleKeyDown} 
      tabIndex={0} // Focusable for capturing hotkeys
      style={{ outline: 'none', width: '100%', height: '100%' }}
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
            kind="subtitles"
            src={subtitleSrc}
            srcLang="en"
            label="English"
            default
          />
        )}
      </video>

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
