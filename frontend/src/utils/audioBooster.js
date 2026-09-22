/**
 * audioBooster.js
 * Web Audio API booster with soft limiting to amplify video audio up to 400%
 * without harsh digital clipping or distortion.
 */

class AudioBoosterManager {
  constructor() {
    this.ctx = null;
    this.gainNode = null;
    this.compressorNode = null;
    this.sourceMap = new WeakMap();
    this.currentElement = null;
    this.boost = 1;
  }

  _initContext() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    // Gain node for volume amplification
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.boost, this.ctx.currentTime);

    // DynamicsCompressorNode acts as a transparent brickwall limiter to prevent speaker crackling
    this.compressorNode = this.ctx.createDynamicsCompressor();
    this.compressorNode.threshold.setValueAtTime(-3, this.ctx.currentTime); // -3 dB
    this.compressorNode.knee.setValueAtTime(6, this.ctx.currentTime);
    this.compressorNode.ratio.setValueAtTime(12, this.ctx.currentTime);
    this.compressorNode.attack.setValueAtTime(0.003, this.ctx.currentTime); // 3ms fast attack
    this.compressorNode.release.setValueAtTime(0.15, this.ctx.currentTime); // 150ms release

    // Route: Gain -> Limiter -> Destination
    this.gainNode.connect(this.compressorNode);
    this.compressorNode.connect(this.ctx.destination);
  }

  attach(videoEl) {
    if (!videoEl || typeof window === 'undefined') return;
    try {
      this._initContext();
      if (!this.ctx) return;

      if (this.currentElement === videoEl) {
        return;
      }

      // Detach previous element connection if any
      if (this.currentElement && this.sourceMap.has(this.currentElement)) {
        try {
          this.sourceMap.get(this.currentElement).disconnect();
        } catch {
          // Ignore disconnect error
        }
      }

      this.currentElement = videoEl;

      let sourceNode = this.sourceMap.get(videoEl);
      if (!sourceNode) {
        sourceNode = this.ctx.createMediaElementSource(videoEl);
        this.sourceMap.set(videoEl, sourceNode);
      }

      sourceNode.connect(this.gainNode);
    } catch (err) {
      console.warn('AudioBooster: Failed to attach video element:', err);
    }
  }

  setBoost(multiplier) {
    this.boost = multiplier;
    if (!this.ctx || !this.gainNode) return;
    try {
      this.gainNode.gain.setValueAtTime(multiplier, this.ctx.currentTime);
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (err) {
      console.warn('AudioBooster: Failed to set boost:', err);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  detach() {
    if (this.currentElement && this.sourceMap.has(this.currentElement)) {
      try {
        this.sourceMap.get(this.currentElement).disconnect();
      } catch {
        // Ignore disconnect error
      }
    }
    this.currentElement = null;
  }
}

export const audioBooster = new AudioBoosterManager();
