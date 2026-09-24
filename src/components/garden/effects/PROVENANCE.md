# Garden effects provenance

Reduced production adaptations of React Bits PixelBlast, TextType, and BorderGlow, reviewed 2026-09-16:

- https://reactbits.dev/r/PixelBlast-JS-CSS
- https://reactbits.dev/r/TextType-JS-CSS
- https://reactbits.dev/r/BorderGlow-JS-CSS
- https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md

The adjacent MIT + Commons Clause notice is retained. The adaptations are part of this website, not a standalone component distribution.

`PixelBlast.shader.js` retains the upstream shape map and shaders. The local renderer caps device pixel ratio and frame rate, suspends while hidden/offscreen, disposes its WebGL resources, and falls back to a static CSS field. Compact and reduced-motion views do not import Three.js. Ripples and postprocessing are omitted.

`TextType.jsx` preserves the approved phrase order, 85ms typing, 45ms deletion, 6.5-second hold, complete first phrase, cancellable timer, and static paused/reduced-motion state. The original heading remains the accessible name.

`BorderGlow.jsx` retains the edge-proximity and pointer-angle calculation while limiting output to the accepted edge light. It has no resting sweep or fill and is disabled for compact, coarse-pointer, and reduced-motion views.

`mount-effects.jsx` owns one route-local React root and restores all temporary heading, card, observer, listener, and renderer state during ClientRouter teardown.
