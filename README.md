# Studio

An interactive 3D resume. You arrive in a rendered room, walk up to the desk, and
everything on it is the navigation: the speaker opens a music player, the phone wakes
for contact details, the monitor opens a full desktop with the resume and project
write-ups on it.

Built with vanilla ES modules, Vite and Three.js. No framework.

## How the room works

The room is not a real-time 3D scene, and it is not a flat screenshot either. It is a
**2.5D depth reconstruction**, which keeps Blender Cycles material quality while still
letting the camera move.

1. **Blender renders the room twice** per viewpoint at 3600×2104 — once with the desk
   lamp on, once off — plus a mask image whose red channel marks the SBU monument and
   whose green channel marks the speaker.
2. **A depth grid is ray-cast from the same camera**: 261 × 153 = 39,933 samples, each
   recording how far the first surface is along that pixel's ray. It ships as
   `scene.json`.
3. **Three.js displaces a plane by that grid**, so every vertex sits at the depth
   Blender measured. The render is the texture. Moving the camera a few centimetres
   produces real parallax instead of a flat pan.
4. **A ShaderMaterial cross-fades the two renders** for the lamp switch, and adds a
   blurred bloom from the mask when an object lights up.

The trade-off is deliberate: this holds up for small camera movement, not for orbiting
or walking through the room.

There are two viewpoints — `hero-living` (the entrance) and `hero-desk-wide` (at the
desk) — with a portal transition between them.

## The other pieces

**Clickable objects.** Each interactive object's 3D bounding points are projected to
screen space every frame, wrapped in a convex hull, and applied to a button as a CSS
`clip-path` polygon. The hit area is the object's actual silhouette, not a rectangle.
On touch devices it falls back to a 44px minimum rectangle.

**Panels on the wall.** The About and Navigation panels are ordinary HTML, projected
onto their wall quad with a homography solved per frame and applied as a `matrix3d`
transform. They stay glued to the wall as the camera moves.

**Live screens.** The monitor and phone are the original curved Blender geometry with
canvas textures drawn on them, so the clock and calendar show the visitor's own device
time rather than a baked-in screenshot.

**The computer.** Clicking the monitor opens a full-screen desktop layer with working
traffic-light controls. Its state is a pure reducer in `computer-state.js`, which is
what the unit tests exercise.

**The chair** is a separate GLB with runtime animation, composited over the still
render, because a moving object cannot be baked into a static background.

## Running it

```bash
npm install
npm run dev
```

Opens on http://127.0.0.1:4174 (`--strictPort`, so a port clash fails loudly instead of
silently serving something else).

```bash
npm run build        # -> dist/
node --test src/*.test.js
```

24 unit tests cover the pure logic: glow state, chair and leaf motion, the computer
reducer, and screen-rect fitting.

## Layout

```
src/
  main.js            entry: wiring, hit regions, cards, the entrance/desk transition
  scene.js           depth-mesh reconstruction, the cross-fade shader, live screens
  computer.js        the full-screen desktop layer
  computer-state.js  pure reducer for that layer  (tested)
  about-wall.js      homography that projects HTML onto the wall quad
  navigation.js      wall and desk navigation
  living-objects.js  the animated chair GLB          (tested)
  glow-state.js      which object is lit, and why    (tested)
  screen-rect.js     fitting the desktop to the monitor (tested)
  displays.js        canvas textures for the monitor and phone
  content.js         all owner-supplied content
public/
  hero-living/       entrance: two WebP renders, depth grid, chair GLB
  hero-desk-wide/    desk viewpoint: same set
  hero-entrance/     the interaction mask
```

## Editing the content

Everything a visitor reads lives in `src/content.js` — name, contact, about copy,
projects, and the playlist. Nothing is generated or inferred from elsewhere.

Project thumbnails are 16:10 WebP files in `public/projects/`.

## A note on asset size

The renders are photographic, so they ship as WebP rather than PNG: 32.7 MB of source
PNGs compress to 2.2 MB with no visible difference. The interaction masks stay PNG,
because the shader reads their red and green channels exactly and lossy compression
would bleed one into the other.

A first visit downloads about 9 MB, most of it the two viewpoints' renders and the
chair GLB.
