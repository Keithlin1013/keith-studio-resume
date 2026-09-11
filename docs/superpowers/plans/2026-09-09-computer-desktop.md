# Computer Desktop (monitor = computer) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking the desk monitor scales a full-screen dark macOS-style desktop out of the screen, with three files (Resume.pdf, Projects, About Me.txt) that open as windows at real reading size; "Stand up" returns to the desk; the old centered Resume/Projects dialog is retired.

**Architecture:** A new self-contained DOM layer (`src/computer.js` + `src/computer.css`) driven by a pure reducer (`src/computer-state.js`) and pure geometry helpers (`src/screen-rect.js`). `src/main.js` gains a fifth clickable object (the monitor, synthesised from the screen mesh), routes the monitor click and the Resume/Projects menu items into the layer, and loses the `.navigation-details` dialog. No framework, no new assets except inline SVG icons.

**Tech Stack:** Vanilla ES modules, Vite 7 dev server (`http://localhost:4174`, started from the project root with `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4174`), Three.js scene already in place, `node:test` for unit tests (`node --test src/<file>.test.js`, Node 24).

**Spec:** `docs/superpowers/specs/2026-09-09-computer-desktop-design.md` (Chinese; the plan below encodes every requirement, but read it for intent).

## Global Constraints

- The project is **not a git repository**. There are no commit steps; every task ends with a verification run instead. Do not run `git init`.
- Work only in `/Users/keithlin/Project/resume web`. The dev server on port 4173 serves a stale copy elsewhere; use 4174.
- Code style: the codebase is dense vanilla JS (one statement per line is fine; no TypeScript, no bundler plugins, no new dependencies).
- Visible text inside the computer layer is never smaller than **11px**.
- Copy rules: no em dash (`—`) or en dash (`–`) in any copy you write; date ranges use a hyphen (`June 2023 - August 2023`). Resume text is copied verbatim from the spec §4 (it is the owner's resume); the phone number is **never** published.
- The Resume window shows the real PDF (`/Keith-Lin-Resume.pdf`, already in `public/`) in an `<iframe>` (Keith's decision). Where the browser cannot render PDFs inline (`navigator.pdfViewerEnabled === false`, or unknown on a coarse-pointer device) it shows an open/download panel instead. The toolbar always offers "Download PDF". Never re-typeset the resume as HTML.
- Do not use `public/hero-desk-front` or add any new image assets.
- Fonts: the site's system stack (`-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif`). Radii come from existing tokens in `src/style.css`: `--radius-card:20px; --radius-compact:14px; --radius-small:8px; --radius-pill:999px`.
- Narrow-viewport breakpoint is `700px` (matches `src/style.css`). Motion honours `prefers-reduced-motion: reduce`.
- The computer layer sits at `z-index:9` (above `.desk-navigation` 7, `.room-return` 6, `.glass-card` 5; below `#loading` 10).
- Icons are inline SVG, one consistent 1.5px stroke; no emoji.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/computer.css` (create) | All styling for the computer layer: wallpaper, menu bar, desktop files, Dock, windows, paper documents, narrow-viewport and reduced-motion rules. |
| `docs/superpowers/mockups/computer-desktop.html` (create) | Static mockup of the desktop with the Resume window open, using `computer.css`; for visual sign-off only, never shipped. |
| `src/screen-rect.js` (create) | Pure geometry: `fitTransform(box, viewportW, viewportH)` for the enter/exit animation; `subsample(positions, max)` to pick hit-region points from the screen mesh. |
| `src/screen-rect.test.js` (create) | `node:test` coverage for the above. |
| `src/computer-state.js` (create) | Pure reducer: file registry, `reduce(state, action)`, `appName(window)`. |
| `src/computer-state.test.js` (create) | `node:test` coverage for the reducer. |
| `src/computer.js` (create) | Builds the layer DOM once, animates enter/exit, focus trap and Escape, renders windows (Finder, Preview, TextEdit) from `content.js` data. Exports `createComputer(config, {onExit})`. |
| `src/content.js` (modify) | Resume and project data extended to the spec §4 shape. |
| `src/main.js` (modify) | Fifth object `computer`, `openComputer()`, `onExit` restore logic, menu deep links, removal of the old dialog and its renderers. |
| `src/style.css` (modify) | Bloom delay for the fifth hit-region polygon. |
| `src/navigation.css` (modify) | Delete `.navigation-details` and `.detail-*` rules. |

---

### Task 1: Stylesheet + static mockup for visual sign-off

**Files:**
- Create: `src/computer.css`
- Create: `docs/superpowers/mockups/computer-desktop.html`

**Interfaces:**
- Produces: the class vocabulary every later task renders into: `#computer`, `.os-wallpaper`, `.os-shade`, `.os-menubar`, `.os-app-name`, `.os-clock`, `.os-standup`, `.os-icon`, `.os-files`, `.os-file`, `.os-file-name`, `.os-dock`, `.os-dock-item`, `.os-tip`, `.os-window-host`, `.os-window`, `.is-open`, `.os-titlebar`, `.os-close`, `.os-back`, `.os-title`, `.os-toolbar`, `.os-action`, `.os-body`, `.os-paper`, `.os-entry-meta`, `.os-bullets`, `.os-doc-text`, `.os-doc-title`, `.os-doc-sub`, `.os-doc-lede`, `.os-list`, `.os-row`, `.os-row-name`, `.os-row-kind`, `.os-pdf`, `.os-pdf-fallback`.

- [x] **Step 1: Create `src/computer.css`**

```css
#computer{position:fixed;inset:0;z-index:9;background:#0b1524;color:#f5f6f9;transform-origin:0 0;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
#computer[hidden]{display:none}
.os-wallpaper{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center}
.os-shade{position:absolute;inset:0;background:linear-gradient(#14243a33,#0b172622);pointer-events:none}

/* Menu bar: app name, clock, and the only way out. Nothing decorative. */
.os-menubar{position:absolute;left:0;right:0;top:0;height:30px;display:flex;align-items:center;gap:14px;padding:0 12px 0 16px;background:#0d1a2acc;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-bottom:1px solid #ffffff14;font-size:13px}
.os-app-name{font-weight:600}
.os-clock{margin-left:auto;font-variant-numeric:tabular-nums;color:#dfe8f2}
.os-standup{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 10px 0 8px;border:1px solid #ffffff24;border-radius:var(--radius-pill);background:#ffffff0f;color:inherit;font:inherit;font-size:12px;cursor:pointer;transition:background .2s,border-color .2s}
.os-standup:hover,.os-standup:focus-visible{background:#ffffff1f;border-color:#ffffff40}
.os-standup .os-icon{width:14px;height:14px}

.os-icon{width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linejoin:round;stroke-linecap:round}
.os-icon text{fill:currentColor;stroke:none;font-family:inherit}

/* Desktop files: top-right column, the macOS habit. */
.os-files{position:absolute;top:52px;right:28px;display:flex;flex-direction:column;gap:6px}
.os-file{width:84px;padding:8px 4px 6px;border:0;border-radius:8px;background:none;color:inherit;font:inherit;font-size:12.5px;line-height:1.25;text-align:center;text-shadow:0 1px 2px #000a;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;transition:background .15s}
.os-file .os-icon{width:56px;height:56px;color:#dbe7f5}
.os-file:hover{background:#ffffff14}
.os-file-name{display:block;max-width:80px;overflow-wrap:anywhere}

/* Dock: three things that work. */
.os-dock{position:absolute;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;gap:10px;padding:8px;border-radius:var(--radius-pill);background:#101c2c99;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid #ffffff14}
.os-dock-item{position:relative;width:48px;height:48px;padding:8px;border:0;border-radius:12px;background:#ffffff10;color:#e6eef8;cursor:pointer;display:grid;place-items:center;text-decoration:none;transition:transform .16s cubic-bezier(.22,1,.36,1),background .16s}
.os-dock-item:hover,.os-dock-item:focus-visible{transform:scale(1.12);background:#ffffff1c}
.os-tip{position:absolute;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%) translateY(4px);padding:4px 9px;border-radius:6px;background:#0d1a2ae6;color:#f5f6f9;font-size:12px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .15s,transform .15s}
.os-dock-item:hover .os-tip,.os-dock-item:focus-visible .os-tip{opacity:1;transform:translateX(-50%)}

/* One window at a time, centred below the menu bar. */
.os-window-host{position:absolute;inset:30px 0 0;display:grid;place-items:center;pointer-events:none}
.os-window{pointer-events:auto;display:flex;flex-direction:column;width:min(760px,92vw);height:min(78vh,640px);border:1px solid #ffffff1f;border-radius:var(--radius-compact);background:#1a2636;box-shadow:0 24px 70px #00000080;overflow:hidden;opacity:0;transform:scale(.96);transition:opacity .16s,transform .16s}
.os-window.is-open{opacity:1;transform:none;transition:opacity .22s,transform .22s cubic-bezier(.22,1,.36,1)}
.os-titlebar{position:relative;display:flex;align-items:center;height:38px;padding:0 12px;background:#152030;border-bottom:1px solid #ffffff12;flex:none}
.os-close{width:12px;height:12px;padding:0;border:0;border-radius:50%;background:#ff5f57;box-shadow:inset 0 0 0 1px #0003;cursor:pointer;flex:none}
.os-close:focus-visible{outline:2px solid #e4efff;outline-offset:3px}
.os-back{margin-left:14px;padding:3px 8px 3px 6px;border:0;border-radius:6px;background:#ffffff10;color:#dfe8f2;font:inherit;font-size:12px;cursor:pointer}
.os-back:before{content:'‹';margin-right:4px}
.os-title{position:absolute;left:50%;transform:translateX(-50%);margin:0;max-width:60%;font-size:13px;font-weight:500;color:#dfe8f2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.os-toolbar{display:flex;justify-content:flex-end;padding:8px 12px;border-bottom:1px solid #ffffff12;background:#182434;flex:none}
.os-action{display:inline-block;padding:7px 12px;border:1px solid #c2d6e54d;border-radius:var(--radius-pill);background:#1a2d4266;color:#eef4ff;font-size:11.5px;letter-spacing:.02em;text-decoration:none;transition:background .2s,border-color .2s}
.os-action:hover,.os-action:focus-visible{background:#243a5299;border-color:#c2d6e580}
.os-body{flex:1;overflow:auto;padding:24px;scrollbar-width:thin;scrollbar-color:#c2d6e540 transparent}
.os-body:has(.os-list){padding:8px 0}

/* Resume: the real PDF fills the window body; a panel stands in where the browser cannot render PDFs inline. */
.os-body:has(.os-pdf){padding:0;display:flex}
.os-pdf{display:block;flex:1;min-height:0;width:100%;border:0;background:#1a2636}
.os-pdf-fallback{max-width:360px;margin:40px auto;padding:28px 24px;border-radius:var(--radius-compact);background:#152030;border:1px solid #ffffff14;text-align:center;color:#dfe8f2}
.os-pdf-fallback .os-icon{width:56px;height:56px;margin:0 auto 10px;color:#c9d8e8}
.os-pdf-fallback strong{display:block;font-size:14px;margin-bottom:4px}
.os-pdf-fallback p{margin:0 0 16px;font-size:12.5px;color:#9fb3c5}
.os-pdf-fallback .os-action{margin:0 4px}

/* Paper: Projects pages and About show a page on the grey canvas. */
.os-paper{max-width:640px;margin:0 auto;padding:36px;border-radius:4px;background:#f7f9fc;color:#1b2430;box-shadow:0 10px 30px #00000055;font-size:12.5px;line-height:1.6}
.os-paper .os-action{margin-top:14px;color:#1b2430;border-color:#1b243040;background:#1b243010}
.os-entry-meta{color:#5b6b7d;font-size:11.5px}
.os-bullets{margin:2px 0 6px;padding-left:18px}
.os-bullets li{margin:2px 0}
.os-doc-text{margin:0 0 8px}
.os-doc-title{margin:0 0 4px;font-size:20px;font-weight:600;letter-spacing:-.01em}
.os-doc-sub{margin:0 0 6px;font-size:13px;color:#3c4a5a}
.os-doc-lede{margin:0 0 14px;font-size:14px;line-height:1.55}

/* Finder rows. */
.os-list{display:flex;flex-direction:column}
.os-row{display:flex;align-items:center;gap:12px;height:44px;padding:0 12px;border:0;border-bottom:1px solid #ffffff0f;background:none;color:#e6eef8;font:inherit;text-align:left;cursor:pointer}
.os-row:hover,.os-row:focus-visible{background:#ffffff0d}
.os-row .os-icon{width:24px;height:24px;flex:none;color:#c9d8e8}
.os-row-name{font-size:13.5px}
.os-row-kind{margin-left:auto;font-size:11.5px;color:#8fa6b8}

@media(max-width:699px){
 .os-files{top:44px;right:0;left:0;flex-direction:row;flex-wrap:wrap;justify-content:center;gap:4px 8px;padding:0 10px}
 .os-file{width:88px}.os-file .os-icon{width:52px;height:52px}
}
/* Narrow or short viewports (phones, including landscape): windows fill the screen. */
@media(max-width:699px),(max-height:419px){
 .os-window{width:100%;height:100%;border-radius:0;border:0}
 .os-body{padding:16px;padding-bottom:calc(92px + env(safe-area-inset-bottom))}
 .os-paper{padding:22px}
}
@media(prefers-reduced-motion:reduce){
 .os-window,.os-dock-item,.os-tip,.os-standup,.os-file{transition:none}
 .os-window{opacity:1;transform:none}
}
```

- [x] **Step 2: Create the static mockup `docs/superpowers/mockups/computer-desktop.html`**

```html
<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mockup: computer desktop</title>
<link rel="stylesheet" href="/src/style.css"><link rel="stylesheet" href="/src/computer.css">
<style>body{background:#071525}</style></head><body>
<div id="computer" role="dialog" aria-label="Keith’s computer">
 <img class="os-wallpaper" src="/hero/desktop-source.png" alt=""><div class="os-shade"></div>
 <div class="os-menubar"><span class="os-app-name">Preview</span><span class="os-clock">Wed, Sep 9, 1:29 PM</span>
  <button class="os-standup"><svg class="os-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M9 3H4v10h5M7 8h8m-3-3 3 3-3 3"/></svg><span>Stand up</span></button></div>
 <div class="os-files">
  <button class="os-file"><svg class="os-icon" viewBox="0 0 56 56" aria-hidden="true"><path d="M16 6h18l12 12v32a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z"/><path d="M34 6v12h12"/><text x="28" y="41" font-size="11" font-weight="700" text-anchor="middle">PDF</text></svg><span class="os-file-name">Resume.pdf</span></button>
  <button class="os-file"><svg class="os-icon" viewBox="0 0 56 56" aria-hidden="true"><path d="M8 16a4 4 0 0 1 4-4h11l4 4h17a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z"/><path d="M8 24h40"/></svg><span class="os-file-name">Projects</span></button>
  <button class="os-file"><svg class="os-icon" viewBox="0 0 56 56" aria-hidden="true"><path d="M16 6h18l12 12v32a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z"/><path d="M34 6v12h12M20 30h16M20 37h16M20 44h10"/></svg><span class="os-file-name">About Me.txt</span></button>
 </div>
 <div class="os-window-host">
  <section class="os-window is-open" role="dialog" aria-label="Resume.pdf">
   <div class="os-titlebar"><button class="os-close" aria-label="Close Resume.pdf"></button><div class="os-title">Resume.pdf</div></div>
   <div class="os-toolbar"><a class="os-action" href="/Keith-Lin-Resume.pdf" download>Download PDF</a></div>
   <div class="os-body"><iframe class="os-pdf" src="/Keith-Lin-Resume.pdf#toolbar=0&navpanes=0&view=FitH" title="Resume.pdf"></iframe></div>
  </section>
 </div>
 <nav class="os-dock" aria-label="Dock">
  <button class="os-dock-item" aria-label="Finder"><svg class="os-icon" viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="8" width="36" height="32" rx="7"/><path d="M6 21h36M17 30h14"/></svg><span class="os-tip">Finder</span></button>
  <a class="os-dock-item" href="mailto:linzhanghong666@gmail.com" aria-label="Mail"><svg class="os-icon" viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="11" width="36" height="26" rx="6"/><path d="m6 16 18 12 18-12"/></svg><span class="os-tip">Mail</span></a>
  <a class="os-dock-item" href="https://www.linkedin.com/in/zhanghonglin" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><svg class="os-icon" viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="6" width="36" height="36" rx="9"/><text x="24" y="31" font-size="19" font-weight="700" text-anchor="middle">in</text></svg><span class="os-tip">LinkedIn</span></a>
 </nav>
</div>
</body></html>
```

- [x] **Step 3: Verify the mockup renders**

Start the dev server if it is not running (from the project root): `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4174`. Open `http://localhost:4174/docs/superpowers/mockups/computer-desktop.html` at 1440×860 and at 375×812.
Expected: dark desktop with the Golden Gate wallpaper; menu bar `Preview … Wed, Sep 9, 1:29 PM … Stand up`; three file icons top-right (a 3-column row at 375px); a centred window with a red close light, `Resume.pdf` title, `Download PDF` toolbar, the real PDF rendered inline in the window body; a three-item Dock at the bottom with tooltips on hover. No text smaller than 11px (check `getComputedStyle` on `.os-entry-meta`: `11.5px`).

- [x] **Step 4: Sign-off checkpoint**

Show the mockup to Keith (spec §9 step 1). Do not start Task 4 or later until the look is approved; Tasks 2 and 3 are pure logic and may proceed meanwhile.

---

### Task 2: `screen-rect.js` geometry helpers (TDD)

**Files:**
- Create: `src/screen-rect.js`
- Test: `src/screen-rect.test.js`

**Interfaces:**
- Produces: `fitTransform(box:{x,y,w,h}, viewportW:number, viewportH:number) → {scale:number, translateX:number, translateY:number}` (viewport-space box; pairs with `transform-origin:0 0`); `subsample(positions:number[] /* flat xyz */, max=64) → number[][] /* [[x,y,z],…] */` that always keeps the extreme points of `x`, `y`, `x+y`, `x-y` (the four corners of a screen facing the camera).

- [x] **Step 1: Write the failing tests `src/screen-rect.test.js`**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {fitTransform,subsample} from './screen-rect.js';

test('fitTransform scales the viewport to the anchor width and centres it on the anchor',()=>{
 const t=fitTransform({x:200,y:150,w:400,h:225},1600,900);
 assert.equal(t.scale,.25);
 assert.equal(t.translateX,200);   // 200 + 400/2 - .25*1600/2
 assert.equal(t.translateY,150);   // 150 + 225/2 - .25*900/2
});
test('fitTransform keeps the anchor centre fixed for a non-16:9 anchor',()=>{
 const t=fitTransform({x:100,y:100,w:800,h:200},1000,1000);
 assert.equal(t.scale,.8);
 assert.equal(t.translateX,100);   // 100 + 400 - 400
 assert.equal(t.translateY,-200);  // 100 + 100 - 400
});
test('subsample returns every point when there are few',()=>{
 assert.deepEqual(subsample([0,0,-1,1,0,-1,1,1,-1,0,1,-1]),[[0,0,-1],[1,0,-1],[1,1,-1],[0,1,-1]]);
});
test('subsample keeps the four corners of a large grid and stays under the cap',()=>{
 const flat=[];for(let y=0;y<20;y++)for(let x=0;x<40;x++)flat.push(x/39,y/19,-2);
 const pts=subsample(flat,64);
 assert.ok(pts.length<=64,'too many points: '+pts.length);
 for(const c of [[0,0],[1,0],[1,1],[0,1]])assert.ok(pts.some(p=>p[0]===c[0]&&p[1]===c[1]),'missing corner '+c);
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `node --test src/screen-rect.test.js`
Expected: fails with `Cannot find module './screen-rect.js'`.

- [x] **Step 3: Create `src/screen-rect.js`**

```js
// Geometry for the computer layer: how the full viewport maps onto the monitor, and which mesh points outline it.
export function fitTransform(box,viewportW,viewportH){
 const scale=box.w/viewportW;
 return {scale,translateX:box.x+box.w/2-scale*viewportW/2,translateY:box.y+box.h/2-scale*viewportH/2};
}

// Pick at most `max` points from a flat xyz array, always keeping the extremes that outline a camera-facing screen.
export function subsample(positions,max=64){
 const pts=[];for(let i=0;i+2<positions.length;i+=3)pts.push([positions[i],positions[i+1],positions[i+2]]);
 if(pts.length<=max)return pts;
 const keys=[p=>p[0],p=>-p[0],p=>p[1],p=>-p[1],p=>p[0]+p[1],p=>-p[0]-p[1],p=>p[0]-p[1],p=>p[1]-p[0]];
 const picked=new Set(keys.map(k=>pts.reduce((best,p,i)=>k(p)>k(pts[best])?i:best,0)));
 const stride=Math.ceil(pts.length/(max-picked.size));
 for(let i=0;i<pts.length&&picked.size<max;i+=stride)picked.add(i);
 return [...picked].sort((a,b)=>a-b).map(i=>pts[i]);
}
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `node --test src/screen-rect.test.js`
Expected: `# pass 4`, `# fail 0`.

---

### Task 3: `computer-state.js` reducer (TDD)

**Files:**
- Create: `src/computer-state.js`
- Test: `src/computer-state.test.js`

**Interfaces:**
- Produces: `files` (array of `{id, name, kind, app}`), `initial` (`{open:false, window:null}`), `reduce(state, action)` with actions `{type:'enter', file?}`, `{type:'open', file}` (`file` is a file id or `'root'`), `{type:'openProject', id}`, `{type:'back'}`, `{type:'closeWindow'}`, `{type:'escape'}`, `{type:'exit'}`; window shape `{app:'finder'|'preview'|'textedit', file:string, project?:string}`; `appName(window|null) → 'Finder'|'Preview'|'TextEdit'`.

- [x] **Step 1: Write the failing tests `src/computer-state.test.js`**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {files,initial,reduce,appName} from './computer-state.js';

test('the desktop lists three files with their apps',()=>{
 assert.deepEqual(files.map(f=>f.id),['resume','projects','about']);
 assert.deepEqual(files.map(f=>f.app),['preview','finder','textedit']);
});
test('enter without a file shows the desktop with no window',()=>{
 assert.deepEqual(reduce(initial,{type:'enter'}),{open:true,window:null});
});
test('enter with a file deep-links straight into its window',()=>{
 assert.deepEqual(reduce(initial,{type:'enter',file:'resume'}),{open:true,window:{app:'preview',file:'resume'}});
});
test('open replaces the current window; root opens Finder; unknown files are ignored',()=>{
 const s=reduce(reduce(initial,{type:'enter'}),{type:'open',file:'about'});
 assert.deepEqual(s.window,{app:'textedit',file:'about'});
 assert.deepEqual(reduce(s,{type:'open',file:'root'}).window,{app:'finder',file:'root'});
 assert.equal(reduce(s,{type:'open',file:'nope'}),s);
});
test('projects folder opens a project page and back returns to the folder',()=>{
 const folder=reduce(initial,{type:'enter',file:'projects'});
 const page=reduce(folder,{type:'openProject',id:'smart-finance-analyzer'});
 assert.deepEqual(page.window,{app:'preview',file:'projects',project:'smart-finance-analyzer'});
 assert.deepEqual(reduce(page,{type:'back'}).window,{app:'finder',file:'projects'});
 assert.equal(reduce(folder,{type:'back'}),folder);
});
test('escape closes a window first, then leaves the computer',()=>{
 const s=reduce(initial,{type:'enter',file:'about'});
 const closed=reduce(s,{type:'escape'});
 assert.deepEqual(closed,{open:true,window:null});
 assert.deepEqual(reduce(closed,{type:'escape'}),{open:false,window:null});
});
test('closeWindow keeps the desktop; exit leaves entirely',()=>{
 const s=reduce(initial,{type:'enter',file:'about'});
 assert.deepEqual(reduce(s,{type:'closeWindow'}),{open:true,window:null});
 assert.deepEqual(reduce(s,{type:'exit'}),{open:false,window:null});
});
test('appName follows the window',()=>{
 assert.equal(appName(null),'Finder');
 assert.equal(appName({app:'preview',file:'resume'}),'Preview');
 assert.equal(appName({app:'textedit',file:'about'}),'TextEdit');
 assert.equal(appName({app:'finder',file:'projects'}),'Finder');
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `node --test src/computer-state.test.js`
Expected: fails with `Cannot find module './computer-state.js'`.

- [x] **Step 3: Create `src/computer-state.js`**

```js
// Pure state for the computer layer. The DOM in computer.js only renders what this returns.
export const files=[
 {id:'resume',name:'Resume.pdf',kind:'PDF document',app:'preview'},
 {id:'projects',name:'Projects',kind:'Folder',app:'finder'},
 {id:'about',name:'About Me.txt',kind:'Plain text',app:'textedit'}
];
export const initial=Object.freeze({open:false,window:null});

function windowFor(file){
 if(file==='root')return {app:'finder',file:'root'};
 const f=files.find(x=>x.id===file);
 return f?{app:f.app,file:f.id}:null;
}

export function reduce(state,action){
 switch(action.type){
  case 'enter':return {open:true,window:windowFor(action.file)};
  case 'open':{const w=windowFor(action.file);return w?{...state,window:w}:state;}
  case 'openProject':return {...state,window:{app:'preview',file:'projects',project:action.id}};
  case 'back':return state.window?.project?{...state,window:{app:'finder',file:'projects'}}:state;
  case 'closeWindow':return {...state,window:null};
  case 'escape':return state.window?{...state,window:null}:{open:false,window:null};
  case 'exit':return {open:false,window:null};
  default:return state;
 }
}

export function appName(window){
 if(!window)return 'Finder';
 return window.app==='preview'?'Preview':window.app==='textedit'?'TextEdit':'Finder';
}
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `node --test src/computer-state.test.js`
Expected: `# pass 8`, `# fail 0`.

---

### Task 4: Computer layer shell + monitor hit target + enter/exit wiring

**Files:**
- Create: `src/computer.js`
- Modify: `src/main.js` (imports; `let` declarations; `names`; `act`; new `openComputer`; init: fifth object on both studios, `gate` assignment, `createComputer` call, `studioDebug`)
- Modify: `src/style.css` (fifth bloom delay)

**Interfaces:**
- Consumes: `fitTransform`, `subsample` (Task 2); `files`, `initial`, `reduce`, `appName` (Task 3); classes from Task 1.
- Produces: `createComputer(config, {onExit}) → {setAnchor(rect:{x,y,w,h}), enter(fileId?), exit(), active:boolean}` with viewport-space `rect`; in `main.js`: module-level `computer`, `gate`, and `openComputer(fileId?)`.

- [x] **Step 1: Create `src/computer.js` (shell only; `renderWindow` is filled in Task 5)**

```js
import './computer.css';
import {files,initial,reduce,appName} from './computer-state.js';
import {fitTransform} from './screen-rect.js';

const icons={
 pdf:'<svg class="os-icon" viewBox="0 0 56 56" aria-hidden="true"><path d="M16 6h18l12 12v32a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z"/><path d="M34 6v12h12"/><text x="28" y="41" font-size="11" font-weight="700" text-anchor="middle">PDF</text></svg>',
 folder:'<svg class="os-icon" viewBox="0 0 56 56" aria-hidden="true"><path d="M8 16a4 4 0 0 1 4-4h11l4 4h17a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z"/><path d="M8 24h40"/></svg>',
 txt:'<svg class="os-icon" viewBox="0 0 56 56" aria-hidden="true"><path d="M16 6h18l12 12v32a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z"/><path d="M34 6v12h12M20 30h16M20 37h16M20 44h10"/></svg>',
 finder:'<svg class="os-icon" viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="8" width="36" height="32" rx="7"/><path d="M6 21h36M17 30h14"/></svg>',
 mail:'<svg class="os-icon" viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="11" width="36" height="26" rx="6"/><path d="m6 16 18 12 18-12"/></svg>',
 linkedin:'<svg class="os-icon" viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="6" width="36" height="36" rx="9"/><text x="24" y="31" font-size="19" font-weight="700" text-anchor="middle">in</text></svg>',
 leave:'<svg class="os-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M9 3H4v10h5M7 8h8m-3-3 3 3-3 3"/></svg>'
};
const fileIcon={resume:icons.pdf,projects:icons.folder,about:icons.txt};
function el(tag,className,textContent){const e=document.createElement(tag);if(className)e.className=className;if(textContent!=null)e.textContent=textContent;return e;}

export function createComputer(config,{onExit}={}){
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches,narrow=()=>innerWidth<700||innerHeight<420;
 let state=initial,anchor=null,busy=false,opener=null,clock=null,wallpaperDrawn=false;

 const layer=el('div');layer.id='computer';layer.setAttribute('role','dialog');layer.setAttribute('aria-label','Keith’s computer');layer.hidden=true;
 // Menu bar and title bars are <div>s: style.css styles the site's <header> globally (fixed, offset, pointer-events:none).
 layer.innerHTML='<canvas class="os-wallpaper" width="2200" height="924" aria-hidden="true"></canvas><div class="os-shade"></div><div class="os-menubar"><span class="os-app-name">Finder</span><span class="os-clock"></span></div><div class="os-files"></div><div class="os-window-host"></div><nav class="os-dock" aria-label="Dock"></nav>';
 const wallpaper=layer.querySelector('.os-wallpaper'),menubar=layer.querySelector('.os-menubar'),appLabel=layer.querySelector('.os-app-name'),clockLabel=layer.querySelector('.os-clock'),filesHost=layer.querySelector('.os-files'),windowHost=layer.querySelector('.os-window-host'),dock=layer.querySelector('.os-dock');
 const standUp=el('button','os-standup');standUp.innerHTML=icons.leave+'<span>Stand up</span>';standUp.onclick=()=>exit();menubar.append(standUp);

 // Desktop files: only the ones that have content behind them.
 const available=files.filter(f=>f.id==='about'?!!config.about:f.id==='resume'?!!config.resume:(config.projects||[]).length>0);
 for(const f of available){const b=el('button','os-file');b.dataset.file=f.id;b.setAttribute('aria-label',f.name);b.innerHTML=fileIcon[f.id];b.append(el('span','os-file-name',f.name));b.onclick=()=>open(f.id,b);filesHost.append(b);}

 // Dock: Finder, Mail, LinkedIn. Items without a destination are not rendered.
 const finder=el('button','os-dock-item');finder.setAttribute('aria-label','Finder');finder.innerHTML=icons.finder;finder.append(el('span','os-tip','Finder'));finder.onclick=()=>open('root',finder);dock.append(finder);
 if(config.email){const a=el('a','os-dock-item');a.href='mailto:'+config.email;a.setAttribute('aria-label','Mail');a.innerHTML=icons.mail;a.append(el('span','os-tip','Mail'));dock.append(a);}
 if(config.resume?.linkedin){const a=el('a','os-dock-item');a.href=config.resume.linkedin;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label','LinkedIn');a.innerHTML=icons.linkedin;a.append(el('span','os-tip','LinkedIn'));dock.append(a);}
 document.body.append(layer);

 // Same source pixels as the monitor texture (displays.js crops 780,180 → 2200×924), so leaning in is continuous.
 function drawWallpaper(){if(wallpaperDrawn)return;wallpaperDrawn=true;const img=new Image();img.onload=()=>{const c=wallpaper.getContext('2d');c.drawImage(img,780,180,2200,924,0,0,2200,924);};img.onerror=()=>{wallpaperDrawn=false;};img.src='/hero/desktop-source.png';}
 function tick(){clockLabel.textContent=new Date().toLocaleString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});}
 function dispatch(action){state=reduce(state,action);render();}
 function open(file,by){opener=by||opener;dispatch({type:'open',file});windowHost.querySelector('.os-close')?.focus({preventScroll:true});}
 function render(){appLabel.textContent=appName(state.window);renderWindow(state.window);}
 function renderWindow(win){windowHost.replaceChildren();if(!win)return;}

 const focusables=()=>[...layer.querySelectorAll('button:not([disabled]),a[href]')].filter(e=>e.getClientRects().length>0);
 layer.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();if(busy)return;if(state.window){dispatch({type:'closeWindow'});(opener||standUp).focus({preventScroll:true});}else exit();return;}
  if(e.key!=='Tab')return;const list=focusables();if(!list.length)return;const i=list.indexOf(document.activeElement);
  if(e.shiftKey&&i<=0){e.preventDefault();list[list.length-1].focus();}
  else if(!e.shiftKey&&(i===-1||i===list.length-1)){e.preventDefault();list[0].focus();}
 });

 function fromTransform(){const a=anchor||{x:innerWidth*.4,y:innerHeight*.4,w:innerWidth*.2,h:innerHeight*.2};const t=fitTransform(a,innerWidth,innerHeight);return `translate(${t.translateX}px,${t.translateY}px) scale(${t.scale})`;}
 async function animateLayer(direction){
  const soft=reduced()||narrow(),entering=direction==='in';
  const frames=soft?[{opacity:entering?0:1},{opacity:entering?1:0}]
   :entering?[{transform:fromTransform(),opacity:0,offset:0},{opacity:1,offset:.32},{transform:'none',opacity:1,offset:1}]
   :[{transform:'none',opacity:1,offset:0},{opacity:1,offset:.6},{transform:fromTransform(),opacity:0,offset:1}];
  const anim=layer.animate(frames,{duration:soft?(reduced()?200:300):entering?800:650,easing:soft?'ease-out':'cubic-bezier(.22,1,.36,1)',fill:'both'});
  await anim.finished.catch(()=>{});anim.cancel();
 }
 async function enter(fileId){
  if(busy||state.open)return;busy=true;drawWallpaper();
  state=reduce(initial,{type:'enter',file:fileId});opener=fileId?layer.querySelector('[data-file="'+fileId+'"]'):null;render();tick();clock=setInterval(tick,30000);
  layer.hidden=false;
  await animateLayer('in');
  layer.setAttribute('aria-modal','true');busy=false;
  (state.window?layer.querySelector('.os-close'):layer.querySelector('.os-file')||standUp)?.focus({preventScroll:true});
 }
 async function exit(){
  if(busy||!state.open)return;busy=true;layer.removeAttribute('aria-modal');
  await animateLayer('out');
  layer.hidden=true;clearInterval(clock);clock=null;state=initial;render();busy=false;onExit?.();
 }
 return {setAnchor(rect){anchor=rect;},enter,exit,get active(){return state.open;}};
}
```

- [x] **Step 2: Wire `src/main.js`: imports and module state**

Edit 1. After the line `import {glowTargets} from './glow-state.js';` add:
```js
import {createComputer} from './computer.js';
import {subsample} from './screen-rect.js';
```

Edit 2. Replace the `let` line
```js
let studio,entrance,deskStudio,portal,aboutWall,navigation,atDesk=false,ready=false,lampOn=true,phoneOn=false,tracks=[],index=-1,request=0,lastProjection=0;
```
with
```js
let studio,entrance,deskStudio,portal,aboutWall,navigation,computer,gate=()=>{},atDesk=false,ready=false,lampOn=true,phoneOn=false,tracks=[],index=-1,request=0,lastProjection=0;
```

Edit 3. In the `names` object replace `lamp:'Toggle screen light'};` with `lamp:'Toggle screen light',computer:'Open the computer'};`

- [x] **Step 3: Wire `src/main.js`: `act` and `openComputer`**

Edit 4. Replace `function act(id){if(!ready||!atDesk)return;announce('');if(id==='lamp'){` with
```js
function act(id){if(!ready||!atDesk)return;announce('');if(id==='computer'){openComputer();return;}if(id==='lamp'){
```

Edit 5. Replace the line `for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>hideCard(b.dataset.close);` with
```js
// The monitor: close the cards, remember where the screen is on the page, hand the desk over to the computer layer.
function openComputer(fileId){if(!ready||!atDesk||computer.active)return;for(const key of Object.keys(cards))hideCard(key,false);const f=frame.getBoundingClientRect(),b=studio.data.objects.find(o=>o.id==='computer')?.box;if(b)computer.setAnchor({x:f.left+b.x,y:f.top+b.y,w:b.w,h:b.h});gate(false);$('#hint').classList.add('used');$('.room-return').hidden=true;$('.desk-navigation').hidden=true;status.textContent='Opening the computer';computer.enter(fileId);}
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>hideCard(b.dataset.close);
```

- [x] **Step 4: Wire `src/main.js`: init**

Edit 6. Replace
```js
studio=await createStudio(frame,projection);entrance=studio;aboutWall=createAboutWall(frame,config.about);for(const o of studio.data.objects){
```
with
```js
studio=await createStudio(frame,projection);entrance=studio;studio.data.objects.push({id:'computer',points:subsample(studio.data.screens.desktop.positions)});aboutWall=createAboutWall(frame,config.about);for(const o of studio.data.objects){
```

Edit 7. Inside that loop, replace `if(cards[o.id])b.setAttribute('aria-expanded','false');` with `if(cards[o.id])b.setAttribute('aria-expanded','false');if(o.id==='computer')b.setAttribute('aria-haspopup','dialog');`

Edit 8. Replace `const gate=value=>{atDesk=value;` with `gate=value=>{atDesk=value;` (assign the module-level `gate`; rest of the line unchanged).

Edit 9. Replace
```js
deskStudio=await createStudio(nearHost,projection,{folder:'hero-desk-wide',live:false});await displays(deskStudio);
```
with
```js
deskStudio=await createStudio(nearHost,projection,{folder:'hero-desk-wide',live:false});deskStudio.data.objects.push({id:'computer',points:subsample(deskStudio.data.screens.desktop.positions)});await displays(deskStudio);
```

Edit 10. After the line that ends with `$('#hint').textContent='Unable to load the desk. Please refresh to try again.'}` add a new line:
```js
computer=createComputer(config,{onExit(){gate(true);$('.room-return').hidden=false;$('.desk-navigation').hidden=false;$('#hint').textContent='Click objects on the desk to explore';$('#hint').classList.remove('used');status.textContent='';targets.get('computer')?.focus({preventScroll:true});}});
```

Edit 11. In `window.studioDebug=()=>({` add `computer:computer?.active,` right after `ready,`.

- [x] **Step 5: Bloom delay for the fifth polygon in `src/style.css`**

Replace `#hit-regions.awake polygon:nth-child(4){animation-delay:.54s}` with `#hit-regions.awake polygon:nth-child(4){animation-delay:.54s}#hit-regions.awake polygon:nth-child(5){animation-delay:.72s}`.

- [x] **Step 6: Verify in the browser**

Open `http://localhost:4174` at 1440×860. Check the console has no errors. Hover the room, click the ring "Enter desk", wait ~4s.
1. Run in the console: `[...document.querySelectorAll('.object-target')].map(b=>b.dataset.action)` → expected `['music','contact','education','lamp','computer']`; the monitor should show the same soft bloom as the other objects.
2. Click the monitor. Expected: the desktop scales up out of the screen (~0.8s), wallpaper is the monitor's Golden Gate image, menu bar reads `Finder`, clock shows the current time, three files top-right, Dock with Finder / Mail / LinkedIn. `document.querySelector('#computer').getAttribute('aria-modal')` → `'true'`; `.room-return` and `.desk-navigation` are hidden; focus is on `Resume.pdf`.
3. Press Tab repeatedly: focus cycles Stand up → files → (window, when one is open) → Dock and wraps; Shift+Tab wraps backwards.
4. Click `Resume.pdf`: the menu bar app name changes to `Preview` (no window yet; that is Task 5). Press Escape: app name returns to `Finder`, focus returns to `Resume.pdf`. Press Escape again: the layer scales back into the monitor; `Back to room`, `Menu` and the hint return; `window.studioDebug().computer` → `false`; focus is on the monitor hit target.
5. Click `Stand up` after re-entering: same exit.
6. Emulate `prefers-reduced-motion: reduce` (DevTools rendering panel) and re-enter: 200ms fade, no scaling.

Run `node --test src/*.test.js` → all pass.

---

### Task 5: Windows (Finder, Preview, TextEdit) + resume data

**Files:**
- Modify: `src/content.js` (add `resume.linkedin`; replace the `projects` block)
- Modify: `src/computer.js` (replace `renderWindow`; add renderers)

**Interfaces:**
- Consumes: `config.resume` (`file, linkedin`), `config.projects[]` (`id, title, subtitle, period, stack, url?, summary, points[]`), `config.about`, `config.email`.
- Produces: window DOM per spec §3; `open(file, by)`, `dispatch` unchanged from Task 4.

- [x] **Step 1: Add `resume.linkedin` and replace the `projects` block in `src/content.js`**

In the existing `resume: {` block, add one line right after `    file: '/Keith-Lin-Resume.pdf',`:
```js
    linkedin: 'https://www.linkedin.com/in/zhanghonglin',
```
(Leave `summary`, `experience` and `skills` in place for now: the old dialog still reads them until Task 6 deletes both.)

Replace everything from `  projects: [` through its closing `  ],` with:
```js
  projects: [
    {
      id: 'smart-finance-analyzer',
      title: 'Smart Finance Analyzer',
      subtitle: 'Full-Stack Data Application',
      period: 'April 2026',
      stack: 'Flask, Pandas, Render, Vercel',
      url: 'https://smart-finance-analyzer.vercel.app',
      summary: 'A full-stack finance app: cleans and categorizes transactions with Pandas, runs spending and trend analysis, and serves the results through a Flask REST API.',
      points: [
        'Processed and cleaned financial datasets using Pandas, handling missing values and categorizing transactions to ensure data integrity',
        'Built analytical pipelines for spending summaries, category breakdowns, and trend analysis, surfacing key patterns in user spending behavior',
        'Designed RESTful APIs with Flask to serve structured analytical outputs, ensuring efficient data processing and consistent response formats',
        'Deployed production application on Render (backend) and Vercel (frontend), resolving cross-environment dependency and build issues'
      ]
    },
    {
      id: 'pricing-strategy-analysis',
      title: 'Pricing Strategy & Profitability Analysis',
      subtitle: 'Excel + Python',
      period: 'May 2026',
      stack: 'Python, Excel',
      summary: '145K+ sales transactions, $52.9M revenue and $17.6M profit. KPI models by product and region showed margins falling from about 37% to about 10% at higher discount levels, informing pricing adjustments.',
      points: [
        'Analyzed 145K+ sales transactions to evaluate revenue ($52.9M) and profit ($17.6M), identifying margin performance differences across products and regions',
        'Built KPI models (revenue, profit, margin, discount) using Python (pandas) and Excel to structure data for analysis and decision-making',
        'Assessed discount impact on profitability using PivotTables, revealing margin decline from ~37% to ~10% at higher discount levels, informing pricing strategy adjustments'
      ]
    }
  ],
```

- [x] **Step 2: Check the data loads**

Run from the project root:
`node --input-type=module -e "import('./src/content.js').then(m=>console.log(m.content.resume.linkedin, m.content.projects.map(p=>p.points.length)))"`
Expected: `https://www.linkedin.com/in/zhanghonglin [ 4, 3 ]`.

- [x] **Step 3: Replace `renderWindow` in `src/computer.js`**

Replace the line
```js
 function renderWindow(win){windowHost.replaceChildren();if(!win)return;}
```
with
```js
 function projectById(id){return (config.projects||[]).find(p=>p.id===id);}
 function paper(){return el('article','os-paper');}
 function bullets(points=[]){const ul=el('ul','os-bullets');for(const t of points)ul.append(el('li',null,t));return ul;}
 function external(parent,label,url,className){const a=el('a',className,label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';parent.append(a);return a;}
 function renderFinder(where){
  const list=el('div','os-list');
  // Rows are replaced with the window, so they never become the focus-return target; the file or Dock item that opened Finder stays the opener.
  if(where==='root'){for(const f of available){const row=el('button','os-row');row.setAttribute('aria-label',f.name);row.innerHTML=fileIcon[f.id];row.append(el('span','os-row-name',f.name),el('span','os-row-kind',f.kind));row.onclick=()=>open(f.id);list.append(row);}}
  else{for(const p of config.projects||[]){const row=el('button','os-row');row.setAttribute('aria-label',p.title);row.innerHTML=icons.txt;row.append(el('span','os-row-name',p.title),el('span','os-row-kind',p.period));row.onclick=()=>{dispatch({type:'openProject',id:p.id});windowHost.querySelector('.os-close')?.focus({preventScroll:true});};list.append(row);}}
  return list;
 }
 // Keith's call: the Resume window shows the real PDF. Browsers that cannot render PDFs inline get an open/download panel.
 function canEmbedPdf(){const v=navigator.pdfViewerEnabled;return typeof v==='boolean'?v:!matchMedia('(pointer: coarse)').matches;}
 function renderResume(){
  const file=config.resume?.file,name=files.find(f=>f.id==='resume').name;
  if(file&&canEmbedPdf()){const frame=el('iframe','os-pdf');frame.src=file+'#toolbar=0&navpanes=0&view=FitH';frame.title=name;return frame;}
  const box=el('div','os-pdf-fallback');box.innerHTML=icons.pdf;box.append(el('strong',null,name),el('p',null,'This browser cannot show the PDF here.'));
  if(file){external(box,'Open PDF',file,'os-action');const d=el('a','os-action','Download PDF');d.href=file;d.setAttribute('download','');box.append(d);}
  return box;
 }
 function renderProject(id){
  const pr=projectById(id),p=paper();if(!pr)return p;
  p.append(el('h2','os-doc-title',pr.title));if(pr.subtitle)p.append(el('p','os-doc-sub',pr.subtitle));
  p.append(el('p','os-entry-meta',[pr.period,pr.stack].filter(Boolean).join(' · ')));
  if(pr.summary)p.append(el('p','os-doc-text',pr.summary));p.append(bullets(pr.points));
  if(pr.url)external(p,'Open the live app',pr.url,'os-action');
  return p;
 }
 function renderAbout(){const a=config.about||{},p=paper();p.append(el('h2','os-doc-title',a.lead||'About me'));if(a.hook)p.append(el('p','os-doc-lede',a.hook));for(const t of a.body||[])p.append(el('p','os-doc-text',t));return p;}
 function renderWindow(win){
  const current=windowHost.querySelector('.os-window');
  // Closing fades the window out over 160ms (CSS); opening another file replaces it at once.
  if(!win){if(current&&!reduced()){current.classList.remove('is-open');setTimeout(()=>{if(!state.window)windowHost.replaceChildren();},170);}else windowHost.replaceChildren();return;}
  windowHost.replaceChildren();
  const title=win.project?(projectById(win.project)?.title||'Project'):win.file==='root'?'Keith':files.find(f=>f.id===win.file)?.name||'';
  const w=el('section','os-window');w.setAttribute('role','dialog');w.setAttribute('aria-label',title);
  const bar=el('div','os-titlebar');const close=el('button','os-close');close.setAttribute('aria-label','Close '+title);close.onclick=()=>{dispatch({type:'closeWindow'});(opener||standUp).focus({preventScroll:true});};bar.append(close);
  if(win.project){const back=el('button','os-back','Projects');back.setAttribute('aria-label','Back to Projects');back.onclick=()=>{dispatch({type:'back'});windowHost.querySelector('.os-row')?.focus({preventScroll:true});};bar.append(back);}
  bar.append(el('div','os-title',title));w.append(bar);
  if(win.app==='preview'&&!win.project&&config.resume?.file){const t=el('div','os-toolbar');const a=el('a','os-action','Download PDF');a.href=config.resume.file;a.setAttribute('download','');t.append(a);w.append(t);}
  const body=el('div','os-body');
  if(win.app==='finder')body.append(renderFinder(win.file));
  else if(win.app==='textedit')body.append(renderAbout());
  else if(win.project)body.append(renderProject(win.project));
  else body.append(renderResume());
  w.append(body);windowHost.append(w);requestAnimationFrame(()=>w.classList.add('is-open'));
 }
```

- [x] **Step 4: Verify in the browser**

Reload `http://localhost:4174`, enter the desk, click the monitor.
1. Click `Resume.pdf`: a `Preview` window opens (menu bar says `Preview`), red light, title `Resume.pdf`, toolbar `Download PDF` whose `href` is `/Keith-Lin-Resume.pdf`, and the real PDF rendered inline filling the window body (`document.querySelector('.os-pdf').src` ends with `/Keith-Lin-Resume.pdf#toolbar=0&navpanes=0&view=FitH`; the PDF scrolls inside the iframe). Focus is on the red light. In a browser that reports `navigator.pdfViewerEnabled === false` the body shows the fallback panel with `Open PDF` and `Download PDF` instead.
2. Escape closes the window and returns focus to `Resume.pdf`.
3. Click `Projects`: a `Finder` window titled `Projects` lists two rows with periods. Click the first row: a `Preview` page titled `Smart Finance Analyzer` with subtitle, meta, summary, four bullets and `Open the live app` (opens `https://smart-finance-analyzer.vercel.app` in a new tab). Click `‹ Projects`: back to the folder, focus on the first row.
4. Click `About Me.txt`: `TextEdit` window with the lead, hook and two paragraphs.
5. Dock `Finder`: window titled `Keith` listing `Resume.pdf / PDF document`, `Projects / Folder`, `About Me.txt / Plain text`; clicking a row opens that file. `Mail` has `href="mailto:linzhanghong666@gmail.com"`; `LinkedIn` opens in a new tab.
6. Resize to 375×812 (device emulation) and repeat 1 and 3: windows fill the screen, the Dock stays reachable, paper text is still ≥11px.

---

### Task 6: Menu deep links + retire the old dialog

**Files:**
- Modify: `src/main.js` (navigation callback; delete `detail`/`closeDetail`; delete `link`, `renderResume`, `renderProjects`)
- Modify: `src/navigation.css` (delete `.navigation-details*` and `.detail-*` rules)
- Modify: `src/content.js` (delete the legacy `skills` array)

**Interfaces:**
- Consumes: `openComputer(fileId)` from Task 4 (`'resume'` and `'projects'` are valid file ids per Task 3).

- [x] **Step 1: Route the menu into the computer (`src/main.js`)**

Replace the whole `navigation=createNavigation(frame,async id=>{ … });` block
```js
navigation=createNavigation(frame,async id=>{
 closeDetail();for(const key of Object.keys(cards))hideCard(key,false);
 if(id==='about'){await portal.leave();aboutWall.open();return;}
 if(id==='education'||id==='contact'){await portal.enter();act(id);return;}
 const title=id==='resume'?'Resume':'Projects';detail.querySelector('h2').textContent=title;detail.setAttribute('aria-label',title);const body=detail.querySelector('.detail-body');body.replaceChildren();(id==='resume'?renderResume:renderProjects)(body);detail.scrollTop=0;detail.hidden=false;detail.querySelector('button').focus();
});
```
with
```js
navigation=createNavigation(frame,async id=>{
 for(const key of Object.keys(cards))hideCard(key,false);
 if(id==='about'){await portal.leave();aboutWall.open();return;}
 if(id==='education'||id==='contact'){await portal.enter();act(id);return;}
 await portal.enter();openComputer(id);
});
```

- [x] **Step 2: Delete the dialog element and its renderers (`src/main.js`)**

Delete these two lines entirely:
```js
const detail=document.createElement('section');detail.className='navigation-details';detail.hidden=true;detail.setAttribute('role','dialog');detail.setAttribute('aria-label','Section details');detail.innerHTML='<button class="dismiss" aria-label="Close section">×</button><h2></h2><div class="detail-body"></div>';document.body.append(detail);
const closeDetail=()=>{detail.hidden=true};detail.querySelector('button').onclick=closeDetail;document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDetail()});
```
Delete the `link`, `renderResume` and `renderProjects` function definitions (the block that starts with `function link(parent,label,url,className){` and ends with the closing `host.append(item);}}` of `renderProjects`). Keep `function text(parent,tag,value){…}`.

- [x] **Step 3: Delete the dialog styles (`src/navigation.css`)**

Delete the `.navigation-details{position:fixed;…}` rule, the line `.navigation-details[hidden]{display:none}.navigation-details h2{…}.navigation-details p{…}`, and every line starting with `.navigation-details .detail-`.

- [x] **Step 4: Trim the legacy resume fields (`src/content.js`)**

The old dialog was the only reader of `resume.summary`, `resume.experience` and `resume.skills`. Replace the whole `resume: { … },` block with:
```js
  resume: {
    file: '/Keith-Lin-Resume.pdf',
    linkedin: 'https://www.linkedin.com/in/zhanghonglin'
  },
```

- [x] **Step 5: Verify**

`grep -n "navigation-details\|renderResume\|renderProjects\|closeDetail\|detail-" src/main.js src/navigation.css` → no matches.
Reload `http://localhost:4174` (console clean). From the entrance: expand `NAVIGATION` → `Resume`: the room enters the desk, then the computer scales up with the `Resume.pdf` window already open. `Stand up`; `Menu` → `Projects`: the computer opens with the `Projects` folder. `Menu` → `Education` still opens the SBU card; `About Me` still returns to the room and expands the wall.
`node --test src/*.test.js` → all pass.

---

### Task 7: Acceptance pass

**Files:**
- Modify: whatever the checks below reveal (keep fixes narrow).

- [x] **Step 1: Desktop walkthrough (1440×860)**

Enter the desk, click the monitor, open each of the three files, use the Dock, `Stand up`, re-enter via `Menu › Resume`, `Escape` out. Confirm: no console errors; `document.fonts`-independent text sizes ≥11px in the layer (`[...document.querySelectorAll('#computer *')].map(e=>parseFloat(getComputedStyle(e).fontSize)).filter(v=>v&&v<11)` → `[]`); the desk's other objects still work after exit.

- [x] **Step 2: Keyboard-only walkthrough**

From the entrance with the mouse untouched: Tab to `Enter desk`, Enter; Tab to `Open the computer`, Enter; Tab through files, Enter on `Projects`, Enter on the first row, Tab to `‹ Projects`, Enter; Escape twice; confirm focus lands on the monitor target and the hint is visible again.

- [x] **Step 3: Mobile walkthrough (375×812, touch emulation)**

Enter the desk, tap the monitor (hit rect ≥44px), open `Resume.pdf` (desktop Chrome's device emulation still reports `pdfViewerEnabled === true`, so the PDF embeds; on a real iPhone the fallback panel is the expected result), then open `About Me.txt`, scroll the paper, tap the red light, tap `Stand up`. Confirm the Dock never covers the last line of a document (body padding) and windows fill the screen.

- [x] **Step 4: Reduced motion**

With `prefers-reduced-motion: reduce` emulated: enter (≈200ms fade), open a window (no scale animation), exit.

- [x] **Step 5: Static checks**

Run `node --test src/*.test.js` (all pass) and, from the project root, `"/Users/keithlin/.claude/plugins/cache/impeccable/impeccable/4.2.3/skills/impeccable/scripts/impeccable" detect --json index.html src`. Expected: only the pre-existing `broken-image` false positive for `#cover` (its `src` is set at runtime in `main.js`). Fix anything new the detector or the walkthroughs reveal, then re-run the affected check once.

- [x] **Step 6: Rebuild the deployable bundle**

Run `node node_modules/vite/bin/vite.js build` from the project root. Expected: `dist/` regenerated without errors (the site deploys from `dist/`).

---

## Amendment: post-implementation changes (2026-09-09, Keith)

The 7 tasks above shipped as written. Three follow-up changes landed after acceptance; the
task bodies above are left as the historical record, and **`src/computer.js` / `src/computer.css`
are now the source of truth** for the details they touch. The spec was updated in full.

1. **HD wallpaper.** The source `hero/desktop-source.png` is a 3024x1964 screenshot of a real
   macOS desktop with its own menu bar, widgets and dock baked in. Measured clean bounds:
   menu bar ends y~82, widgets end x~775 / y~795, dock starts y~1776. The full-screen layer now
   takes the largest clean rectangle, `drawImage(img, 790, 95, 2234, 1670, 0, 0, 2234, 1670)`
   on a 2234x1670 canvas (was 2200x924). Same photo and same left edge as the monitor texture,
   1.8x the pixels, so a 2x display upscales 1.29x instead of 1.86x.
   `displays.js` keeps its own 780,180,2200,924 crop for the monitor mesh; do not unify them.

2. **macOS-style file icons.** Line-art icons replaced with filled ones: white page plus a
   folded corner, a red PDF badge, grey rules for the text file, and a two-tone blue folder.
   `.os-icon` still means "line icon" (Stand up only); `.os-fileicon` is the filled family and
   carries its own paint. Gradient ids come from `gid()` so repeated icons stay valid markup.

3. **No Dock.** The bottom bar is gone entirely, and with it the Finder root window (its only
   entry point), `renderFinder`'s parameter, the `'root'` branch in `computer-state.js`, its
   assertion in `computer-state.test.js`, the `.os-dock` / `.os-dock-item` / `.os-tip` styles,
   the 92px mobile body padding that reserved dock clearance, and `content.js`'s
   `resume.linkedin`. Mail and LinkedIn are reachable from the phone's contact card, which is
   unchanged; `content.links` still holds the LinkedIn URL for it.

Verified after the amendment: 17/17 unit tests; 1440x860 and 375x812 walkthroughs (all three
windows, folder to project page and back, Stand up, focus return); no duplicate element ids in
the layer; console clean; `impeccable detect` reports only the pre-existing `#cover` false
positive; `dist/` rebuilt.

### Amendment 2 (2026-09-09, Keith): the Resume window embeds the live resume site

Keith's other personal site (a Next.js portfolio, dev server on `localhost:3000`) now fills the
Resume window instead of the PDF. Its "download PDF" link is `<a href="/resume.pdf" download>` and
that file is byte-identical (md5 `23f08eb8f79148fdede2563207c8d34d`) to `public/Keith-Lin-Resume.pdf`,
so nothing needed copying. The site is a single page with `#hero #about #projects #resume #education
#skills #contact` anchors and sends no `X-Frame-Options` / CSP, so it can be framed at `#resume`.

- `content.js` gains `resume.site`; `resume.file` stays as the fallback and the download.
- `renderResume()` is now three-tier: site, then embedded PDF, then the open/download panel.
  `renderPdf()` was split out of the old `renderResume()`; the CSS class `.os-pdf` was renamed
  `.os-embed` because it now carries either.
- **Do not use the iframe `load` event to detect an unreachable site.** Verified: with the site
  pointed at a dead port the iframe still fired `load` (the browser loads its own error page) and
  the window sat blank. Reachability is probed with `fetch(site,{mode:'no-cors',cache:'no-store'})`
  under a 5s `AbortController`; only on success is `src` attached. Re-verified after the change:
  dead port falls back to the PDF, live port embeds the site.
- Toolbar gained "Open in a new tab" alongside "Download PDF" (`.os-toolbar` gained `gap:8px`).

Open items for Keith, reported not decided: `localhost:3000` is unreachable for visitors, so the
deployed studio silently serves the PDF until `resume.site` becomes a public https URL; the embedded
site defaults to Chinese with no deep-linkable English route; it carries its own EN/theme toggles and
its own download button next to the window's; and the window is still titled `Resume.pdf` while
showing a web page.

### Amendment 3 (2026-09-09, Keith): working traffic lights, full screen and minimize

All three macOS lights are now real controls, and the window can fill the screen.

- **Full screen (green).** `.os-window.is-fullscreen` fills `.os-window-host`, i.e. everything under
  the menu bar, so "Stand up" never goes out of reach. Measured 760x640 -> 1440x830 at a 1440x860
  viewport. It is a mode for the whole visit: it survives close/open and resets only on enter/exit.
  No size transition, on purpose - tweening an iframe's width and height reflows the embedded page.
- **Minimize (yellow).** With no Dock, a minimized window belongs to its own desktop icon: the icon
  gets a 4px dot (real state, the Dock's running indicator), its label becomes
  "<name> (minimized, click to restore)", and clicking it restores. The window keeps `display:none`
  but **stays in the DOM**, so the embedded resume site does not reload. Verified: same iframe node
  before and after, and the focus trap drops to 4 visible controls while minimized.
- **Escape now unwinds one layer at a time** (full screen, then window, then computer), driven by the
  reducer's `escape` action rather than a second copy of the ladder in the key handler. Verified.
- **Rebuild discipline:** `render()` rebuilds the window only when its identity (`app|file|project`)
  changes; minimize/restore/full screen just toggle classes. This is what preserves the embed.
- The green light is `display:none` under the narrow/short media query, where windows already fill
  the screen - no control that does nothing.

State grew to `{open, window, minimized, fullscreen}`; `computer-state.test.js` went from 8 to 14
tests (17 -> 23 across the project), all written before the reducer and confirmed failing first.

### Amendment 4 (2026-09-09, Keith): windows open full screen by default

One line in the reducer: `enter` now sets `fullscreen:true`, so clicking any desktop file fills the
screen straight away and the green light is the way back to a 760x640 window. Everything else about
the mode is unchanged - it still belongs to the visit rather than to one window, so a window chosen
after switching to windowed stays windowed, and leaving and re-entering the computer starts full
screen again.

Verified at 1440x860: open -> 1440x830 with `is-fullscreen` and the zoom light labelled "Exit full
screen"; green -> 760x640; the next file opened stays windowed; Stand up and re-enter -> full screen
again. `computer-state.test.js` 14 -> 15 tests (24 across the project), written first and confirmed
failing (8 of them) before the reducer changed.

Accepted trade-off: a full-screen window covers the desktop icons, so switching files needs close,
minimize, or the green light first. That is how a real full-screen app behaves.
