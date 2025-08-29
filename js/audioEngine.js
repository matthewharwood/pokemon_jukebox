class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.activeVoices = new Map(); // Changed to track voices with unique IDs
    this.noteToVoices = new Map(); // Map note names to array of voice IDs
    this.initialized = false;
    this.volumeLevel = 0.3;
    this.attack = 0.01;
    this.decay = 0.1;
    this.sustain = 0.3;
    this.release = 0.5;
    this.maxPolyphony = 64; // Increased for better polyphony
    this.voiceIdCounter = 0; // Unique ID for each voice
  }

  init() {
    if (this.initialized) return;
    
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.volumeLevel;
    this.masterGain.connect(this.audioContext.destination);
    
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -30;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    this.compressor.connect(this.masterGain);
    
    this.initialized = true;
  }

  createOscillator(frequency, type = 'sine') {
    if (!this.initialized) this.init();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.compressor);
    
    return { oscillator, gainNode, filter };
  }

  playNote(noteInfo, velocity = 0.7) {
    if (!this.initialized) this.init();
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    const noteKey = noteInfo.fullName;
    const voiceId = `voice_${this.voiceIdCounter++}_${noteKey}_${Date.now()}`;
    
    // Limit polyphony by removing oldest voice
    if (this.activeVoices.size >= this.maxPolyphony) {
      const oldestVoiceId = this.activeVoices.keys().next().value;
      console.log(`Max polyphony reached, removing oldest voice: ${oldestVoiceId}`);
      this.stopVoice(oldestVoiceId);
    }
    
    try {
      const frequency = noteInfo.frequency;
      const { oscillator, gainNode, filter } = this.createOscillator(frequency, 'sawtooth');
      
      const now = this.audioContext.currentTime;
      const attackEnd = now + this.attack;
      const decayEnd = attackEnd + this.decay;
      
      // Set up gain envelope with proper ramping
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(velocity * this.volumeLevel, attackEnd);
      gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, this.sustain * velocity * this.volumeLevel), decayEnd);
      
      // Add ended event listener to clean up
      oscillator.addEventListener('ended', () => {
        console.log(`Voice ${voiceId} ended`);
        this.cleanupVoice(voiceId, noteKey);
      });
      
      oscillator.start(now);
      
      // Store voice information
      this.activeVoices.set(voiceId, {
        oscillator,
        gainNode,
        filter,
        startTime: now,
        noteInfo,
        noteKey,
        voiceId,
        released: false
      });
      
      // Track which voices belong to which note
      if (!this.noteToVoices.has(noteKey)) {
        this.noteToVoices.set(noteKey, []);
      }
      this.noteToVoices.get(noteKey).push(voiceId);
      
      console.log(`Started voice ${voiceId} for note ${noteKey} at ${frequency}Hz`);
      return voiceId; // Return voice ID instead of oscillator
      
    } catch (error) {
      console.error(`Error playing note ${noteKey}:`, error);
      return null;
    }
  }
  
  cleanupVoice(voiceId, noteKey) {
    // Remove from active voices
    this.activeVoices.delete(voiceId);
    
    // Remove from note-to-voices mapping
    if (this.noteToVoices.has(noteKey)) {
      const voices = this.noteToVoices.get(noteKey);
      const index = voices.indexOf(voiceId);
      if (index > -1) {
        voices.splice(index, 1);
      }
      if (voices.length === 0) {
        this.noteToVoices.delete(noteKey);
      }
    }
  }
  
  stopVoice(voiceId, immediate = false) {
    const voice = this.activeVoices.get(voiceId);
    if (!voice || voice.released) return;
    
    voice.released = true;
    const { oscillator, gainNode } = voice;
    const now = this.audioContext.currentTime;
    const releaseTime = immediate ? 0.01 : this.release;
    
    try {
      gainNode.gain.cancelScheduledValues(now);
      const currentValue = gainNode.gain.value;
      gainNode.gain.setValueAtTime(Math.max(0.001, currentValue), now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);
      
      oscillator.stop(now + releaseTime + 0.01);
      
      // Cleanup after release
      setTimeout(() => {
        this.cleanupVoice(voiceId, voice.noteKey);
      }, (releaseTime * 1000) + 50);
      
    } catch (error) {
      console.warn(`Error stopping voice ${voiceId}:`, error);
      this.cleanupVoice(voiceId, voice.noteKey);
    }
  }

  stopNote(noteInfo) {
    const noteKey = noteInfo.fullName;
    const voices = this.noteToVoices.get(noteKey);
    
    if (!voices || voices.length === 0) {
      console.log(`No active voices for note ${noteKey}`);
      return;
    }
    
    // Only stop the most recent voice for this note (LIFO - Last In, First Out)
    // This allows overlapping notes to continue playing
    const mostRecentVoiceId = voices[voices.length - 1];
    console.log(`Stopping most recent voice ${mostRecentVoiceId} for note ${noteKey}`);
    this.stopVoice(mostRecentVoiceId);
  }
  
  stopAllVoicesForNote(noteInfo) {
    const noteKey = noteInfo.fullName;
    const voices = this.noteToVoices.get(noteKey);
    
    if (!voices) return;
    
    // Stop all voices for this note
    console.log(`Stopping all ${voices.length} voices for note ${noteKey}`);
    voices.forEach(voiceId => {
      this.stopVoice(voiceId, true); // Immediate stop
    });
  }
  
  forceStopNote(noteInfo) {
    // Force stop all voices for this note immediately
    this.stopAllVoicesForNote(noteInfo);
  }

  stopAllNotes() {
    // Stop all active voices
    console.log(`Stopping all ${this.activeVoices.size} active voices`);
    this.activeVoices.forEach((voice, voiceId) => {
      this.stopVoice(voiceId, true);
    });
    
    // Clear mappings
    this.noteToVoices.clear();
  }
  
  panic() {
    // Emergency stop - kills all sounds immediately
    if (!this.audioContext) return;
    
    console.log('PANIC! Force stopping all audio');
    
    // Force stop all voices immediately
    this.activeVoices.forEach((voice) => {
      try {
        const { oscillator, gainNode } = voice;
        gainNode.gain.cancelScheduledValues(0);
        gainNode.gain.value = 0;
        oscillator.stop(0);
      } catch (e) {
        // Ignore errors during panic
      }
    });
    
    // Clear all mappings
    this.activeVoices.clear();
    this.noteToVoices.clear();
    
    // Reset master gain
    if (this.masterGain) {
      this.masterGain.gain.value = this.volumeLevel;
    }
  }
  
  // Getter for compatibility with existing code
  get activeOscillators() {
    return this.activeVoices;
  }

  setVolume(level) {
    this.volumeLevel = Math.max(0, Math.min(1, level));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volumeLevel;
    }
  }

  setEnvelope(attack, decay, sustain, release) {
    this.attack = attack;
    this.decay = decay;
    this.sustain = sustain;
    this.release = release;
  }

  changeOscillatorType(type) {
    this.oscillatorType = type;
  }

  dispose() {
    this.stopAllNotes();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.initialized = false;
  }
}

export const audioEngine = new AudioEngine();

export default AudioEngine;