# Anime.js V3 to V4 Migration Guide

## 🚨 BREAKING CHANGES - Critical API Changes

### 1. **Module Import System**
**DON'T DO THIS (V3):**
```javascript
// CommonJS
const anime = require('animejs');

// Or ES6 default import
import anime from 'animejs';
```
**DO THIS (V4):**
```javascript
// V4 uses named exports, not default export
import { animate, stagger, Timeline, Draggable, ScrollObserver, utils, engine } from 'animejs';

// Or if using direct path to ESM file
import { animate, stagger } from '../node_modules/animejs/lib/anime.esm.js';

// Available named exports in V4:
// Animatable, Draggable, JSAnimation, Scope, ScrollObserver, Spring, 
// TextSplitter, Timeline, Timer, WAAPIAnimation, animate, createAnimatable, 
// createDraggable, createScope, createSpring, createTimeline, createTimer, 
// eases, engine, onScroll, scrollContainers, stagger, svg, text, utils, waapi
```

### 2. **Timer System**
**DON'T DO THIS (V3):**
```javascript
anime.tick(time);
```
**DO THIS (V4):**
```javascript
anime.engine.tick(time);
// Or use the new Timer class
const timer = new anime.Timer();
timer.tick(time);
```

### 3. **Animation Creation**
**DON'T DO THIS (V3):**
```javascript
anime({
  targets: '.element',
  translateX: 250
});
```
**DO THIS (V4):**
```javascript
anime.animate('.element', {
  translateX: 250
});
// Or use the Animation class
new anime.Animation('.element', {
  translateX: 250
});
```

### 4. **Timeline Creation**
**DON'T DO THIS (V3):**
```javascript
anime.timeline({
  loop: true
});
```
**DO THIS (V4):**
```javascript
new anime.Timeline({
  defaults: { loop: true }
});
```

### 5. **Utilities Access**
**DON'T DO THIS (V3):**
```javascript
anime.random(0, 100);
anime.get(element, 'translateX');
anime.set(element, { translateX: 100 });
```
**DO THIS (V4):**
```javascript
anime.utils.random(0, 100);
anime.utils.get(element, 'translateX');
anime.utils.set(element, { translateX: 100 });
```

### 6. **Remove Function**
**DON'T DO THIS (V3):**
```javascript
anime.remove(targets);
```
**DO THIS (V4):**
```javascript
// No direct equivalent - manage animations through instances
animation.pause();
animation.reset();
```

### 7. **Stagger Function**
**DON'T DO THIS (V3):**
```javascript
anime.stagger(100);
anime.stagger([0, 100]);
```
**DO THIS (V4):**
```javascript
anime.stagger(100);
// Or use the new Stagger class for complex patterns
new anime.Stagger(100, { from: 'center' });
```

### 8. **Text Animations**
**DON'T DO THIS (V3):**
```javascript
// Manual text splitting required
element.innerHTML = element.textContent.replace(/\S/g, '<span>$&</span>');
```
**DO THIS (V4):**
```javascript
// Use built-in Text class
const text = new anime.Text(element);
text.split({ by: 'chars' });
```

### 9. **Scroll-based Animations**
**DON'T DO THIS (V3):**
```javascript
// Manual scroll event handling
window.addEventListener('scroll', () => {
  const progress = window.scrollY / maxScroll;
  animation.seek(animation.duration * progress);
});
```
**DO THIS (V4):**
```javascript
// Use built-in ScrollObserver
new anime.ScrollObserver({
  targets: '.element',
  handleIntersection: (entry) => {
    // Animation logic
  }
});
```

### 10. **Draggable Elements**
**DON'T DO THIS (V3):**
```javascript
// Manual drag implementation required
```
**DO THIS (V4):**
```javascript
// Use built-in Draggable class
new anime.Draggable('.element', {
  onDrag: (x, y) => {
    // Handle drag
  }
});
```

### 11. **SVG Path Following**
**DON'T DO THIS (V3):**
```javascript
anime({
  targets: '.element',
  translateX: path('x'),
  translateY: path('y'),
  rotate: path('angle')
});
```
**DO THIS (V4):**
```javascript
anime.animate('.element', {
  motionPath: {
    path: svgPath,
    align: true,
    autoRotate: true
  }
});
```

## 📋 Quick Migration Checklist - From V3 → To V4

• `import anime from 'animejs'` → `import { animate, stagger, utils } from 'animejs'`
• `anime()` → `animate()` (using named import)
• `anime.timeline()` → `new Timeline()` (using named import)
• `anime.random()` → `utils.random()` (using named import)
• `anime.get()` → `utils.get()` (using named import)
• `anime.set()` → `utils.set()` (using named import)
• `anime.tick()` → `engine.tick()` or `timer.tick()` (using named imports)
• `anime.remove()` → Use animation instance methods `pause()` and `reset()`
• `anime.stagger()` → `stagger()` (using named import) or `new Stagger()` for advanced
• Manual text splitting → `new anime.Text(element).split()`
• Manual scroll handling → `new anime.ScrollObserver()`
• Manual drag implementation → `new anime.Draggable()`
• Path animations with functions → `motionPath` property
• `targets` in main function → First parameter in `anime.animate()`
• `loop` in timeline options → `defaults: { loop: true }`
• Direct property animation → Wrapped in animation properties object
• Global animation management → Instance-based animation control
• Manual SVG morphing → Built-in SVG utilities in `anime.svg`
• Manual keyframe calculations → Enhanced keyframe syntax
• `anime.running` array → Use animation instances and their state
• `anime.speed` → `engine.playbackRate` (using named import)
• Manual elastic/spring easing → Enhanced easing with `eases` named export

## 🎯 New Features in V4 (Not Available in V3)

• **Timer Class**: Dedicated timer management
• **Animation Class**: Object-oriented animation creation
• **Timeline Class**: Enhanced timeline control
• **Draggable Class**: Built-in drag functionality
• **ScrollObserver Class**: Native scroll-based animations
• **Text Class**: Advanced text splitting and animation
• **Scope Class**: Animation scoping and context management
• **Animatable Class**: Enhanced target management
• **Engine Module**: Core animation engine access
• **WAAPI Integration**: Web Animations API improvements
• **Enhanced Utils**: More utility functions
• **Motion Path**: Simplified path-following animations
• **Better TypeScript Support**: Improved type definitions
• **Performance Optimizations**: Better rendering pipeline

## ⚠️ Important Notes

1. **Backwards Compatibility**: V4 is NOT backwards compatible with V3
2. **Module System**: V4 uses ES modules with named exports instead of default export
3. **Import Changes**: The most common error when migrating is using `import anime from 'animejs'` - V4 requires named imports
4. **Class-Based API**: V4 favors object-oriented patterns
5. **Instance Control**: Animations are controlled through instances, not globally
6. **Namespace Changes**: Most utilities are now available as named exports
7. **Enhanced Features**: Many manual implementations from V3 now have dedicated classes in V4
8. **Performance**: V4 includes significant performance improvements through the new Engine module