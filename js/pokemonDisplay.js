import { animate } from '../node_modules/animejs/lib/anime.esm.js';
import './components/pkm_musical_staff.js';

class PokemonDisplay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentPokemon = null;
    this.activeNotes = new Set(); // Track currently playing notes
    this.lastSingleNote = null; // Track the last single note played
    this.chordTimeout = null; // Timeout to detect chord vs single notes
    this.pokemonMap = {
      'A': 'abomasnow.png',
      'B': 'bronzong.png',
      'C': 'carnivine.png',
      'D': 'dusknoir.png',
      'E': 'electivire.png',
      'F': 'froslass.png',
      'G': 'giratina.png'
    };
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: fixed;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 500px;
          z-index: 100;
        }

        .display-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .pokemon-container {
          width: 400px;
          height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%);
          border-radius: 50%;
          padding: 20px;
        }

        pkm-musical-staff {
          width: 100%;
          max-width: 500px;
        }

        .pokemon-image {
          max-width: 100%;
          max-height: 80%;
          object-fit: contain;
          filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.3s ease;
        }

        .pokemon-image.active {
          opacity: 1;
          transform: scale(1);
        }

        .pokemon-name {
          margin-top: 20px;
          color: #fff;
          font-family: monospace;
          font-size: 24px;
          text-transform: capitalize;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.3s ease 0.1s;
        }

        .pokemon-name.active {
          opacity: 1;
          transform: translateY(0);
        }

        .note-indicator {
          position: absolute;
          top: 20px;
          color: #fff;
          font-family: monospace;
          font-size: 18px;
          background: rgba(0, 0, 0, 0.5);
          padding: 10px 20px;
          border-radius: 20px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .note-indicator.active {
          opacity: 1;
        }

        @keyframes pulse {
          0% {
            filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 40px rgba(255, 255, 255, 0.6));
          }
          100% {
            filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
          }
        }

        .pokemon-image.active {
          animation: pulse 2s infinite;
        }
      </style>
      <div class="display-wrapper">
        <pkm-musical-staff id="musical-staff"></pkm-musical-staff>
        <div class="pokemon-container">
          <div class="note-indicator" id="note-indicator"></div>
          <img class="pokemon-image" id="pokemon-image" alt="Pokemon">
          <div class="pokemon-name" id="pokemon-name"></div>
        </div>
      </div>
    `;
  }

  showPokemon(noteName, noteFullName, isPressed = true) {
    const noteBase = noteName[0].toUpperCase();
    const pokemonFile = this.pokemonMap[noteBase];
    
    if (!pokemonFile) {
      return;
    }

    const img = this.shadowRoot.getElementById('pokemon-image');
    const nameEl = this.shadowRoot.getElementById('pokemon-name');
    const noteEl = this.shadowRoot.getElementById('note-indicator');
    const musicalStaff = this.shadowRoot.getElementById('musical-staff');
    
    const pokemonName = pokemonFile.replace('.png', '');
    
    if (isPressed) {
      // Add note to active notes
      this.activeNotes.add(noteFullName);
      
      // Clear chord detection timeout
      if (this.chordTimeout) {
        clearTimeout(this.chordTimeout);
      }
      
      // Set timeout to update staff after a brief moment
      this.chordTimeout = setTimeout(() => {
        this.updateStaff();
      }, 50); // 50ms window to detect chords
      
    } else {
      // Remove note from active notes when released
      this.activeNotes.delete(noteFullName);
      
      // Update staff immediately on release
      this.updateStaff();
    }
    
    // Update Pokemon display
    if (this.currentPokemon !== pokemonName && isPressed) {
      this.currentPokemon = pokemonName;
      
      img.classList.remove('active');
      nameEl.classList.remove('active');
      noteEl.classList.remove('active');
      
      setTimeout(() => {
        img.src = `img/${pokemonFile}`;
        img.alt = pokemonName;
        nameEl.textContent = pokemonName;
        noteEl.textContent = `Note: ${noteFullName}`;
        
        img.classList.add('active');
        nameEl.classList.add('active');
        noteEl.classList.add('active');
      }, 100);
    } else if (isPressed) {
      noteEl.textContent = `Note: ${noteFullName}`;
      this.animatePulse();
    }
  }
  
  updateStaff() {
    const musicalStaff = this.shadowRoot.getElementById('musical-staff');
    
    if (this.activeNotes.size === 0) {
      // No notes playing, clear the staff
      musicalStaff.setAttribute('notes', '');
      this.lastSingleNote = null;
    } else if (this.activeNotes.size === 1) {
      // Single note - replace whatever was there
      const singleNote = Array.from(this.activeNotes)[0];
      this.lastSingleNote = singleNote;
      
      // Determine clef based on note octave
      const octave = parseInt(singleNote.match(/\d+/)?.[0] || '4');
      const clef = octave >= 4 ? 'treble' : 'bass';
      
      musicalStaff.setAttribute('clef', clef);
      musicalStaff.setAttribute('notes', singleNote);
    } else {
      // Multiple notes (chord) - show all active notes
      const notesArray = Array.from(this.activeNotes);
      
      // Determine clef based on average octave
      const avgOctave = notesArray.reduce((sum, note) => {
        return sum + parseInt(note.match(/\d+/)?.[0] || '4');
      }, 0) / notesArray.length;
      const clef = avgOctave >= 4 ? 'treble' : 'bass';
      
      musicalStaff.setAttribute('clef', clef);
      musicalStaff.setAttribute('notes', notesArray.join(','));
    }
  }
  
  releaseNote(noteFullName) {
    this.activeNotes.delete(noteFullName);
    this.updateStaff();
  }

  hidePokemon() {
    const img = this.shadowRoot.getElementById('pokemon-image');
    const nameEl = this.shadowRoot.getElementById('pokemon-name');
    const noteEl = this.shadowRoot.getElementById('note-indicator');
    const musicalStaff = this.shadowRoot.getElementById('musical-staff');
    
    img.classList.remove('active');
    nameEl.classList.remove('active');
    noteEl.classList.remove('active');
    
    setTimeout(() => {
      this.currentPokemon = null;
      this.activeNotes.clear();
      this.lastSingleNote = null;
      img.src = '';
      nameEl.textContent = '';
      noteEl.textContent = '';
      musicalStaff.setAttribute('notes', '');
    }, 300);
  }

  animatePulse() {
    const container = this.shadowRoot.querySelector('.pokemon-container');
    
    animate(container, {
      scale: [1, 1.05, 1],
      duration: 300,
      easing: 'easeInOutQuad'
    });
  }
}

customElements.define('pokemon-display', PokemonDisplay);

export default PokemonDisplay;