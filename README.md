# TERRANOVA® — We shape tomorrow's skylines

Hubtown-inspired (Awwwards SOTD, Unseen Studio) fully-3D one-pager for a
fictional real-estate developer. The camera **flies through a procedural
city that builds itself** as you scroll.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

## The experience

1. **Intro loader** — serif percentage counter 0→100%, "Ready to explore",
   veil zooms away (Hubtown's signature opening)
2. **City flythrough** — 420 instanced buildings rise from the ground as
   the camera approaches them; warm rooftop beacons pop when a tower completes
3. **Mouse-reveal** — a brass light follows the cursor, exploring the dark city
4. **Zoom transitions** — subtle dolly-zoom settle on each section (fov easing)
5. **Territory** — Hubtown's map nav reimagined: glowing 3D survey pins with
   pulsing ground rings + district labels (hover to ignite)
6. **Developments** — photo billboards (curated Unsplash architecture) that
   lift and tilt towards the cursor
7. **Legacy** — the flagship Monolith tower completes and is crowned with light
8. **Finale** — a sun rises over the skyline on the last section

## Art direction (from the Hubtown reference)

- Background `#020A19` (near-black navy), ivory text `#f2efe9`,
  single brass accent `#c8a96a`
- Display type: **Instrument Serif** (regular + italic), body **Space Grotesk**
- Bloom + film grain + vignette, stars, fog
- Custom cursor, ghost section numbers, outline marquee, scroll-hint

## Stack

Vite · React 19 · TypeScript · three.js · @react-three/fiber · drei ·
postprocessing · maath

All content is fictional (TERRANOVA, Lisbon) — structure and motion language
inspired by hubtown.co.in; no assets copied.
