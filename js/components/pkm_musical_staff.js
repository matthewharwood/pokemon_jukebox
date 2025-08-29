class PkmMusicalStaff extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.notePositions = this.calculateNotePositions();
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

    static get observedAttributes() {
        return ['notes', 'clef'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    calculateNotePositions() {
        // Staff line positions (from top to bottom)
        // Each line/space is 10px apart
        const positions = {
            treble: {
                // Lines: F5, D5, B4, G4, E4
                'C6': -25,  // Two ledger lines above
                'B5': -20,  // One ledger line above
                'A5': -15,  // Space above staff
                'G5': -10,  // Space
                'F5': -5,   // Top line
                'E5': 0,    // Space
                'D5': 5,    // Line
                'C5': 10,   // Space
                'B4': 15,   // Line
                'A4': 20,   // Space
                'G4': 25,   // Line
                'F4': 30,   // Space
                'E4': 35,   // Bottom line
                'D4': 40,   // Space below staff
                'C4': 45,   // One ledger line below (Middle C)
                'B3': 50,   // Space below ledger
                'A3': 55    // Two ledger lines below
            },
            bass: {
                // Lines: A3, F3, D3, B2, G2
                'E5': -25,  // Two ledger lines above
                'D5': -20,  // One ledger line above
                'C5': -15,  // Space above staff
                'B4': -10,  // Space
                'A4': -5,   // Top line
                'G4': 0,    // Space
                'F4': 5,    // Line
                'E4': 10,   // Space
                'D4': 15,   // Line
                'C4': 20,   // Space (Middle C)
                'B3': 25,   // Line
                'A3': 30,   // Space
                'G3': 35,   // Bottom line
                'F3': 40,   // Space below staff
                'E3': 45,   // One ledger line below
                'D3': 50,   // Space below ledger
                'C3': 55    // Two ledger lines below
            }
        };
        return positions;
    }

    drawClef(svg, clef) {
        const clefText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        
        if (clef === 'treble') {
            // Use Unicode treble clef symbol
            clefText.textContent = '𝄞';
            clefText.setAttribute('x', '60');
            clefText.setAttribute('y', '120');
            clefText.setAttribute('font-size', '80');
        } else {
            // Use Unicode bass clef symbol
            clefText.textContent = '𝄢';
            clefText.setAttribute('x', '60');
            clefText.setAttribute('y', '110');
            clefText.setAttribute('font-size', '70');
        }
        
        clefText.setAttribute('font-family', 'serif');
        clefText.setAttribute('fill', '#000');
        svg.appendChild(clefText);
    }

    drawStaffLines(svg) {
        for (let i = 0; i < 5; i++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const y = 70 + (i * 30); // Increased spacing between lines
            line.setAttribute('x1', 50);
            line.setAttribute('y1', y);
            line.setAttribute('x2', 550); // Reduced width
            line.setAttribute('y2', y);
            line.setAttribute('stroke', '#333');
            line.setAttribute('stroke-width', 3); // Thicker lines
            svg.appendChild(line);
        }
    }

    drawNote(svg, note, position, clef) {
        const noteGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const x = 180 + (position * 90); // Adjusted spacing for narrower staff
        const y = 70 + (this.notePositions[clef][note] * 3); // Scale up more for increased line spacing

        // Draw ledger lines if needed
        if (clef === 'treble') {
            if (note === 'C4') {
                // Middle C ledger line
                const ledger = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                ledger.setAttribute('x1', x - 20);
                ledger.setAttribute('y1', y);
                ledger.setAttribute('x2', x + 20);
                ledger.setAttribute('y2', y);
                ledger.setAttribute('stroke', '#000');
                ledger.setAttribute('stroke-width', 2);
                noteGroup.appendChild(ledger);
            } else if (['B5', 'C6'].includes(note)) {
                // High ledger lines
                const ledgerY = note === 'B5' ? 70 + (this.notePositions[clef]['B5'] * 3) : 70 + (this.notePositions[clef]['C6'] * 3);
                const ledger = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                ledger.setAttribute('x1', x - 20);
                ledger.setAttribute('y1', ledgerY);
                ledger.setAttribute('x2', x + 20);
                ledger.setAttribute('y2', ledgerY);
                ledger.setAttribute('stroke', '#000');
                ledger.setAttribute('stroke-width', 2);
                noteGroup.appendChild(ledger);
            }
        } else if (clef === 'bass') {
            if (note === 'C4') {
                // Middle C ledger line for bass clef
                const ledger = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                ledger.setAttribute('x1', x - 20);
                ledger.setAttribute('y1', y);
                ledger.setAttribute('x2', x + 20);
                ledger.setAttribute('y2', y);
                ledger.setAttribute('stroke', '#000');
                ledger.setAttribute('stroke-width', 2);
                noteGroup.appendChild(ledger);
            }
        }

        // Get the note letter (without octave) for Pokemon mapping
        const noteLetter = note.charAt(0).toUpperCase();
        const pokemonImage = this.pokemonMap[noteLetter];
        
        if (pokemonImage) {
            // Draw Pokemon as note head
            const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
            const noteHead = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            noteHead.setAttribute('href', `${baseUrl}img/${pokemonImage}`);
            noteHead.setAttribute('x', x - 40); // Center the larger image
            noteHead.setAttribute('y', y - 40); // Center the larger image
            noteHead.setAttribute('width', '80'); // Much bigger Pokemon images
            noteHead.setAttribute('height', '80'); // Much bigger Pokemon images
            noteHead.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            
            // No background circle - Pokemon images stand alone
            noteGroup.appendChild(noteHead);
            
            // Add note letter label below the Pokemon
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', x);
            label.setAttribute('y', y + 45);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-family', 'Arial, sans-serif');
            label.setAttribute('font-size', '18');
            label.setAttribute('font-weight', 'bold');
            label.setAttribute('fill', '#333');
            label.textContent = noteLetter;
            noteGroup.appendChild(label);
            
        } else {
            // Fallback to regular note if no Pokemon mapping
            const noteHead = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            noteHead.setAttribute('cx', x);
            noteHead.setAttribute('cy', y);
            noteHead.setAttribute('rx', 6);
            noteHead.setAttribute('ry', 4.5);
            noteHead.setAttribute('fill', '#000');
            noteHead.setAttribute('transform', `rotate(-20 ${x} ${y})`);
            noteGroup.appendChild(noteHead);
        }

        // Draw stem (for both Pokemon and regular notes)
        const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const stemDirection = y < 130 ? 1 : -1; // Stem up if note is below middle line (adjusted for new spacing)
        const stemOffset = pokemonImage ? 12 : 5; // Adjust stem position for Pokemon images
        stem.setAttribute('x1', x + (stemDirection === 1 ? stemOffset : -stemOffset));
        stem.setAttribute('y1', y);
        stem.setAttribute('x2', x + (stemDirection === 1 ? stemOffset : -stemOffset));
        stem.setAttribute('y2', y + (stemDirection * 45)); // Longer stems for increased spacing
        stem.setAttribute('stroke', '#000');
        stem.setAttribute('stroke-width', 2); // Thicker stems
        noteGroup.appendChild(stem);

        svg.appendChild(noteGroup);
    }

    render() {
        const notes = this.getAttribute('notes') || '';
        const clef = this.getAttribute('clef') || 'treble';
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    overflow: auto;
                }
                .staff-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 40px;
                    box-sizing: border-box;
                }
                svg {
                    display: block;
                    width: 100%;
                    height: 350px;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 20px;
                    padding: 20px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    box-sizing: border-box;
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .pokemon-note {
                    animation: bounce 2s ease-in-out infinite;
                }
            </style>
            <div class="staff-container">
                <svg viewBox="0 0 600 250" xmlns="http://www.w3.org/2000/svg">
                </svg>
            </div>
        `;

        const svg = this.shadowRoot.querySelector('svg');
        
        // Draw staff lines
        this.drawStaffLines(svg);
        
        // Draw clef
        this.drawClef(svg, clef);
        
        // Draw notes
        if (notes) {
            const noteArray = notes.split(',').map(n => n.trim());
            noteArray.forEach((note, index) => {
                if (this.notePositions[clef][note] !== undefined) {
                    this.drawNote(svg, note, index, clef);
                }
            });
        }
    }
}

customElements.define('pkm-musical-staff', PkmMusicalStaff);

export default PkmMusicalStaff;