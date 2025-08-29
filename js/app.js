import { animate, stagger } from '../node_modules/animejs/lib/anime.esm.js';
import { getNoteInfo, keyboardMap, pianoNotes } from './notesData.js';
import { audioEngine } from './audioEngine.js';
import './components/pkm_musical_staff.js';

const pianoContainer = document.getElementById('piano-container');
const musicalStaff = document.getElementById('musical-staff');

function createPianoKeys() {
  for (let i = 0; i < 88; i++) {
    const noteInfo = getNoteInfo(i);
    const key = document.createElement('div');
    key.className = `piano-key ${noteInfo.isBlack ? 'black' : 'white'}`;
    key.dataset.midi = noteInfo.midiNumber;
    key.dataset.note = noteInfo.fullName;
    key.dataset.keyIndex = i;
    
    const label = document.createElement('span');
    label.className = 'key-label';
    label.textContent = noteInfo.fullName;
    key.appendChild(label);
    
    // Mouse events - simplified for drag support
    key.addEventListener('mousedown', (e) => {
      e.preventDefault();
      // Initialize audio on first user interaction
      if (!audioEngine.initialized) {
        audioEngine.init();
      }
      isMouseDragging = true;
      currentMouseKey = key;
      activeMouse.set(key, noteInfo);
      playKey(key, noteInfo);
    });
    
    key.addEventListener('mouseenter', (e) => {
      if (isMouseDragging && currentMouseKey !== key) {
        // Release previous key
        if (currentMouseKey && activeMouse.has(currentMouseKey)) {
          const prevNoteInfo = activeMouse.get(currentMouseKey);
          releaseKey(currentMouseKey, prevNoteInfo);
          activeMouse.delete(currentMouseKey);
        }
        // Play new key
        currentMouseKey = key;
        activeMouse.set(key, noteInfo);
        playKey(key, noteInfo);
      }
    });
    
    // Touch events - removed individual handlers, will use global ones
    
    pianoContainer.appendChild(key);
  }
  
  // Global mouse up to catch releases outside of keys
  document.addEventListener('mouseup', () => {
    console.log('Global mouseup - releasing all mouse notes');
    isMouseDragging = false;
    
    // Release all active mouse notes
    const keysToRelease = Array.from(activeMouse.entries());
    activeMouse.clear();
    currentMouseKey = null;
    
    keysToRelease.forEach(([element, noteInfo]) => {
      console.log(`Releasing mouse note: ${noteInfo.fullName}`);
      releaseKey(element, noteInfo);
      element.classList.remove('active'); // Ensure visual state is cleared
    });
  });
  
  // Additional safety - release on mouse leave from piano container
  pianoContainer.addEventListener('mouseleave', () => {
    if (isMouseDragging && currentMouseKey) {
      console.log('Mouse left piano while dragging - releasing notes');
      isMouseDragging = false;
      
      const keysToRelease = Array.from(activeMouse.entries());
      activeMouse.clear();
      currentMouseKey = null;
      
      keysToRelease.forEach(([element, noteInfo]) => {
        releaseKey(element, noteInfo);
        element.classList.remove('active');
      });
    }
  });
}

// Helper function to get element at coordinates
function getKeyAtPoint(x, y) {
  const element = document.elementFromPoint(x, y);
  if (element && element.classList.contains('piano-key')) {
    return element;
  }
  // Check if we hit a child element of a piano key
  const parent = element?.closest('.piano-key');
  return parent || null;
}

// Global touch handlers for drag support
pianoContainer.addEventListener('touchstart', (e) => {
  e.preventDefault();
  
  // Initialize audio on first user interaction
  if (!audioEngine.initialized) {
    audioEngine.init();
  }
  
  for (let touch of e.changedTouches) {
    const key = getKeyAtPoint(touch.clientX, touch.clientY);
    if (key) {
      const keyIndex = parseInt(key.dataset.keyIndex);
      const noteInfo = getNoteInfo(keyIndex);
      
      activeTouches.set(touch.identifier, {
        currentKey: key,
        noteInfo: noteInfo
      });
      
      playKey(key, noteInfo);
    }
  }
}, { passive: false });

pianoContainer.addEventListener('touchmove', (e) => {
  e.preventDefault();
  
  for (let touch of e.changedTouches) {
    const touchData = activeTouches.get(touch.identifier);
    if (!touchData) continue;
    
    const newKey = getKeyAtPoint(touch.clientX, touch.clientY);
    
    // If we moved to a different key
    if (newKey && newKey !== touchData.currentKey) {
      // Release the old key
      if (touchData.currentKey) {
        releaseKey(touchData.currentKey, touchData.noteInfo);
      }
      
      // Play the new key
      const keyIndex = parseInt(newKey.dataset.keyIndex);
      const noteInfo = getNoteInfo(keyIndex);
      
      playKey(newKey, noteInfo);
      
      // Update the touch data
      touchData.currentKey = newKey;
      touchData.noteInfo = noteInfo;
    } else if (!newKey && touchData.currentKey) {
      // If we moved off all keys, release the current one
      releaseKey(touchData.currentKey, touchData.noteInfo);
      touchData.currentKey = null;
      touchData.noteInfo = null;
    }
  }
}, { passive: false });

pianoContainer.addEventListener('touchend', (e) => {
  e.preventDefault();
  
  for (let touch of e.changedTouches) {
    const touchData = activeTouches.get(touch.identifier);
    if (touchData && touchData.currentKey) {
      releaseKey(touchData.currentKey, touchData.noteInfo);
    }
    activeTouches.delete(touch.identifier);
  }
}, { passive: false });

pianoContainer.addEventListener('touchcancel', (e) => {
  e.preventDefault();
  
  for (let touch of e.changedTouches) {
    const touchData = activeTouches.get(touch.identifier);
    if (touchData && touchData.currentKey) {
      releaseKey(touchData.currentKey, touchData.noteInfo);
    }
    activeTouches.delete(touch.identifier);
  }
}, { passive: false });

// Track active voices per key element to support overlapping notes
const elementToVoices = new Map();
const activeStaffNotes = new Set();

function playKey(keyElement, noteInfo) {
  const noteKey = noteInfo.fullName;
  
  keyElement.classList.add('active');
  
  animate(keyElement, {
    translateX: 2,
    duration: 50,
    easing: 'easeOutQuad'
  });
  
  // Initialize audio if needed and play note
  if (!audioEngine.initialized) {
    console.log('Initializing audio engine on play');
    audioEngine.init();
  }
  
  try {
    // Play note and get voice ID
    const voiceId = audioEngine.playNote(noteInfo);
    
    if (voiceId) {
      // Track voice ID for this element
      if (!elementToVoices.has(keyElement)) {
        elementToVoices.set(keyElement, []);
      }
      elementToVoices.get(keyElement).push(voiceId);
      
      console.log(`Playing: ${noteInfo.fullName} (Voice: ${voiceId}, Freq: ${noteInfo.frequency}Hz)`);
    }
  } catch (error) {
    console.error('Error playing note:', error);
  }
  
  // Update musical staff
  if (musicalStaff) {
    activeStaffNotes.add(noteInfo.fullName);
    updateStaffDisplay();
  }
}

function releaseKey(keyElement, noteInfo) {
  if (!noteInfo) return;
  
  keyElement.classList.remove('active');
  
  animate(keyElement, {
    translateX: 0,
    duration: 100,
    easing: 'easeOutQuad'
  });
  
  try {
    // Stop the note (will only stop the most recent voice for overlapping notes)
    audioEngine.stopNote(noteInfo);
    
    // Clean up voice tracking for this element
    if (elementToVoices.has(keyElement)) {
      elementToVoices.delete(keyElement);
    }
    
    console.log(`Released: ${noteInfo.fullName}`);
  } catch (error) {
    console.error('Error releasing note:', error);
    // Force cleanup on error
    audioEngine.forceStopNote(noteInfo);
  }
  
  // Update musical staff
  if (musicalStaff) {
    activeStaffNotes.delete(noteInfo.fullName);
    updateStaffDisplay();
  }
}

function updateStaffDisplay() {
  if (!musicalStaff) return;
  
  const notesArray = Array.from(activeStaffNotes);
  
  if (notesArray.length === 0) {
    musicalStaff.setAttribute('notes', '');
  } else {
    // Determine clef based on average octave
    const avgOctave = notesArray.reduce((sum, note) => {
      const octave = parseInt(note.match(/\d+/)?.[0] || '4');
      return sum + octave;
    }, 0) / notesArray.length;
    
    const clef = avgOctave >= 4 ? 'treble' : 'bass';
    musicalStaff.setAttribute('clef', clef);
    musicalStaff.setAttribute('notes', notesArray.join(','));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  createPianoKeys();
  
  animate('.piano-key', {
    opacity: [0, 1],
    translateX: [-20, 0],
    delay: stagger(10, { from: 'first' }),
    duration: 500,
    easing: 'easeOutQuad'
  });
});

let activeKeys = new Map(); // Use Map to store note info with key
let activeMouse = new Map(); // Track mouse-pressed keys
let activeTouches = new Map(); // Track active touches by identifier
let isMouseDragging = false; // Track if we're currently dragging with mouse
let currentMouseKey = null; // Track current key under mouse during drag

document.addEventListener('keydown', (e) => {
  if (e.repeat) return; // Ignore key repeat events
  
  // Initialize audio on first user interaction
  if (!audioEngine.initialized) {
    audioEngine.init();
  }
  
  const key = e.key.toLowerCase();
  if (keyboardMap.hasOwnProperty(key) && !activeKeys.has(key)) {
    const keyIndex = keyboardMap[key];
    const pianoKey = pianoContainer.children[keyIndex];
    if (pianoKey) {
      const noteInfo = getNoteInfo(keyIndex);
      activeKeys.set(key, noteInfo);
      playKey(pianoKey, noteInfo);
    }
  }
});

document.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  const noteInfo = activeKeys.get(key);
  
  if (noteInfo) {
    activeKeys.delete(key);
    const keyIndex = keyboardMap[key];
    const pianoKey = pianoContainer.children[keyIndex];
    if (pianoKey) {
      releaseKey(pianoKey, noteInfo);
    }
  }
});

// Handle window blur to release all keys
window.addEventListener('blur', () => {
  // Release all keyboard keys
  activeKeys.forEach((noteInfo, key) => {
    const keyIndex = keyboardMap[key];
    const pianoKey = pianoContainer.children[keyIndex];
    if (pianoKey) {
      releaseKey(pianoKey, noteInfo);
    }
  });
  activeKeys.clear();
  
  // Release all mouse keys
  isMouseDragging = false;
  currentMouseKey = null;
  activeMouse.forEach((noteInfo, element) => {
    releaseKey(element, noteInfo);
  });
  activeMouse.clear();
  
  // Release all touches
  activeTouches.forEach((touchData) => {
    if (touchData.currentKey) {
      releaseKey(touchData.currentKey, touchData.noteInfo);
    }
  });
  activeTouches.clear();
});

// Escape key for panic stop
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    console.log('PANIC! Stopping all audio');
    audioEngine.panic();
    activeKeys.clear();
    activeMouse.clear();
    activeTouches.clear();
    elementToVoices.clear();
    isMouseDragging = false;
    currentMouseKey = null;
    
    // Remove active class from all keys
    document.querySelectorAll('.piano-key.active').forEach(key => {
      key.classList.remove('active');
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  audioEngine.init();
  
  // Panic button click handler
  const panicBtn = document.getElementById('panic-btn');
  if (panicBtn) {
    panicBtn.addEventListener('click', () => {
      audioEngine.panic();
      activeKeys.clear();
      activeMouse.clear();
      document.querySelectorAll('.piano-key.active').forEach(key => {
        key.classList.remove('active');
      });
    });
  }
  
  // Periodic cleanup (every 15 seconds)
  setInterval(() => {
    // Clean up any orphaned voices that have been playing for too long
    const now = audioEngine.audioContext?.currentTime || 0;
    let cleanedCount = 0;
    
    audioEngine.activeVoices.forEach((voice, voiceId) => {
      if (voice.startTime && (now - voice.startTime) > 10 && !voice.released) {
        console.warn(`Cleaning up stuck voice: ${voiceId} (playing for ${now - voice.startTime}s)`);
        audioEngine.stopVoice(voiceId, true);
        cleanedCount++;
      }
    });
    
    // Clean up element-to-voice mappings
    elementToVoices.forEach((voices, element) => {
      const activeVoices = voices.filter(voiceId => audioEngine.activeVoices.has(voiceId));
      if (activeVoices.length !== voices.length) {
        if (activeVoices.length === 0) {
          elementToVoices.delete(element);
          element.classList.remove('active');
        } else {
          elementToVoices.set(element, activeVoices);
        }
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} stuck voices`);
    }
  }, 15000);
  
  // Prevent default touch behaviors
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });
  
  document.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });
  
  // Prevent context menu on right click
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
  
  // Prevent zooming with keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
      e.preventDefault();
    }
  });
  
  // Prevent mouse wheel zoom
  document.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Page visibility change handler
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Release all keys when page becomes hidden
      activeKeys.forEach((noteInfo, key) => {
        const keyIndex = keyboardMap[key];
        const pianoKey = pianoContainer.children[keyIndex];
        if (pianoKey) {
          releaseKey(pianoKey, noteInfo);
        }
      });
      activeKeys.clear();
      
      activeMouse.forEach((noteInfo, element) => {
        releaseKey(element, noteInfo);
      });
      activeMouse.clear();
    }
  });
});