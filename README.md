# MADEBY SHASWAT — creative portfolio

An immersive, scroll-driven 3D portfolio built with **React + Vite + Three.js (React Three Fiber) + Drei + GSAP ScrollTrigger + Tailwind CSS v4**.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/index.html (single self-contained file)
npm run preview    # serve the production build locally
```

Requires Node 18+.

---

## Where to put your real assets

Everything is auto-detected — drop files in, no code changes.

| What | Where | Notes |
| --- | --- | --- |
| **Logo** | `src/assets/logo.png` (or `.jpg` `.webp` `.svg`) | Used for the intro loader. The nav uses a vector mark + “madeby **Shaswat**” wordmark (`src/components/Logo.tsx`). Until you add a file, a vector rebuild of the ribbon-S mark is shown. A black-background logo is blended with `mix-blend-screen` so it sits seamlessly on the dark page. |
| **Project thumbnails / videos** | `src/assets/work/<slug>.<ext>` | `.mp4` `.webm` (autoplay, muted, loop) or `.jpg` `.png` `.webp` `.avif` `.gif`. |
| Optional video poster | `src/assets/work/<slug>-poster.jpg` | |

Project slugs:

- `human-reimagined` — Human, reimagined. (AI UGC)
- `built-for-the-future` — Built for the future. (Hypermotion)
- `rhythm-and-form` — Rhythm & form. (Motion Design)
- `beyond-the-screen` — Beyond the screen. (Web Design)

Example: save a 4:5 video as `src/assets/work/built-for-the-future.mp4` and that card switches from the procedural concept visual to your video, and its “Concept” badge becomes “Project”. Aim for 4:5 (e.g. 1080×1350) and keep videos small — the build inlines assets into one HTML file.

To change titles, categories or add/remove projects, edit `src/data/content.ts` (`PROJECTS`). All other copy (hero words, story stages, services, contact) lives there too.

> The four cards currently show **procedural concept visuals** (pure CSS/SVG) and are labelled “Concept projects & visual studies — not client work”. Once you add real media and want to remove that line, edit `src/components/Work.tsx`.

---

## How the scroll-driven 3D system works

```
src/lib/scroll.ts        ← the shared scroll store `sc` + global ScrollTriggers
src/components/Story.tsx ← the pinned 4-stage section (CSS sticky + ScrollTrigger)
src/scene/Scene.tsx      ← fixed full-screen R3F <Canvas> (bloom, WebGL fallback, pausing)
src/scene/Experience.tsx ← the 3D object, rings, lights, camera — reads `sc` every frame
src/scene/geometry.ts    ← sphere→tower morph geometry + procedural surface texture
src/components/CssOrb.tsx← CSS fallback when WebGL is unavailable
```

1. **One persistent canvas.** `Scene.tsx` renders a single `position: fixed` WebGL canvas behind the page. The same object lives through the hero *and* the story, so there are no cuts — it simply travels. Once the story has scrolled away, the canvas is hidden and its render loop is stopped (`frameloop="never"`) so the rest of the page costs no GPU time.
2. **Pinned story = CSS sticky.** `#story` is ~400–430vh tall with a `sticky` 100svh child. Sticky is far more reliable on touch devices than JS pinning (no pin-spacers, no jumpy address-bar resizes).
3. **Scroll → store, not state.** `Story.tsx` creates a ScrollTrigger over the section and writes `progress` (0→1) into the mutable `sc.story`. `scroll.ts` also writes `sc.hero` (hero leaving), `sc.out` (story leaving), `sc.vel` (scroll velocity) and pointer position. **Nothing re-renders React during scroll.**
4. **Store → 3D every frame.** In `Experience.tsx`, `useFrame` damps those values and converts story progress into a continuous stage position `f` (0→4). Each animated property is a list of four keyframes — one per stage — blended by `kf(values, f)`:
   - camera dolly (`zoom`), orbit (`az`, `el`) and screen placement (`setViewOffset`, so the object slides across the screen without moving in world space)
   - object scale, spin speed (also kicked by scroll velocity), surface bump relief, lime wireframe overlay
   - the three orbital rings: tilt (`rx`, `rz`), scale and height
   - rim / lime light intensities and key-light position
   - **morph**: the sphere geometry carries a morph target (a ribbed, tapered, twisting monolith). Its influence goes 0→1 between stages 3 and 4 — a real vertex morph, not a swap.
5. **Text.** `Story.tsx` updates headline words (masked slide-ups with stagger), labels and the progress indicator directly on DOM nodes from the same ScrollTrigger callback — also without React renders. The four stages are always in the DOM, so screen readers can read all of them.

Tuning: change the numbers in the `K` and `RINGS` tables at the top of `src/scene/Experience.tsx`. Story length is the `h-[400vh] md:h-[430vh]` class in `Story.tsx`.

### Mobile
- Portrait layouts push the object into the top half and the copy sits at the bottom (`fyMob` keyframes and the text container in `Story.tsx`).
- Mobile gets lower geometry density, fewer particles, capped pixel ratio and **no bloom**.
- The progress indicator turns into a horizontal bar under the nav.

### Accessibility & fallbacks
- **Reduced motion:** no loader, no typing loop, no marquee/tween animation, hero object stays still, and the story becomes four static stacked panels (no pinning).
- **No WebGL / canvas error:** a CSS-only orb (`CssOrb.tsx`) is used, driven by the `--story` / `--hero` CSS variables.
- Semantic landmarks, skip link, keyboard-operable menu (Esc to close), focus-visible styles, `aria-current` states, labelled stage buttons you can tab to and activate.
- The loader plays once per session.

---

## Project structure

```
src/
  App.tsx                 page composition + loader flow
  index.css               design tokens, buttons, keyframes, project-visual CSS
  data/content.ts         ALL copy, nav, projects, services
  lib/                    scroll store, asset auto-detection, hooks
  scene/                  Three.js / R3F code
  components/             Nav, Hero, Story, Marquee, Work, Services, About, Contact, Footer, Loader…
```

## Fonts
Manrope and JetBrains Mono load from Google Fonts in `index.html` (with system fallbacks). Self-host them if you need fully offline use.

## Notes
- Lighting uses procedural Lightformers (no downloaded HDR), so the 3D scene needs no network assets.
- Contact details are real links: `mailto:shaswatgupta538@gmail.com`, `tel:+919212885329`.
- No testimonials, client logos or statistics are used anywhere.
