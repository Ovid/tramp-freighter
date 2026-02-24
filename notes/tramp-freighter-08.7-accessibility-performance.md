# Tramp Freighter Blues - Spec 08.7: Accessibility & Performance

**Foundation:** Spec 07 (Endgame)
**Status:** Ready for Development
**Dependencies:** Specs 01-07 must be complete

---

## Overview

Ensure the game is accessible to diverse players and performs well across browsers.

## Goals

- Color blindness support
- Text scaling options
- Full keyboard navigation
- Screen reader support
- Reduced motion option
- Performance targets met

## Out of Scope

- UI/UX feature additions (see 08.6)

---

## Visual Accessibility

### Color Blindness Support

- Alternative color schemes
- Pattern/texture overlays in addition to color
- High contrast mode

### Text Scaling

- Font size options (small, medium, large)
- Readable fonts (no overly stylized text)
- Sufficient contrast ratios

---

## Interaction Accessibility

### Keyboard Navigation

- Full keyboard support
- Tab navigation through UI
- Keyboard shortcuts documented

### Screen Reader Support

- ARIA labels on interactive elements
- Alt text for icons
- Semantic HTML structure

### Reduced Motion

- Option to disable animations
- Static alternatives to animated elements

---

## Performance Optimization

### Loading Optimization

**Asset Loading:**

- Lazy load event content
- Compress JSON data
- Minimize initial bundle size

**Rendering:**

- Optimize starmap rendering (LOD for distant stars)
- Reduce draw calls
- Efficient update loops

### Memory Management

**State Management:**

- Prune old event history
- Limit price snapshot retention
- Efficient save data structure

### Target Metrics

- Initial load: < 4 seconds
- Save/load: < 500ms
- UI response: < 100ms
- Memory footprint: < 100MB

---

## Implementation Notes

- Accessibility CSS goes in a dedicated `css/accessibility.css` or equivalent module
- Use `prefers-reduced-motion` media query as baseline, with in-game toggle override
- ARIA labels required per CLAUDE.md coding standards
- Performance profiling should use Chrome DevTools Lighthouse
- LOD for starmap: reduce geometry detail for stars outside camera focus

## Success Criteria

- [ ] High contrast mode toggle works
- [ ] Font size scales across 3 presets
- [ ] All interactive elements keyboard-accessible
- [ ] ARIA labels on all icon-only buttons
- [ ] Reduced motion option disables all animations
- [ ] Initial load under 4 seconds
- [ ] Save/load under 500ms
- [ ] No memory leaks after 30+ minutes of play
