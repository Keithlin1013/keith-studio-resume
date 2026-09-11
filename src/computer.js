import './computer.css';
import {files,initial,reduce,appName} from './computer-state.js';
import {fitTransform} from './screen-rect.js';

// macOS-style file icons: filled and coloured the way a real desktop draws them.
// Each instance mints its own gradient ids so repeated icons stay valid markup.
let gradSeq=0;const gid=()=>'osg'+(++gradSeq);
const PAGE='M13 3H34L46 15V50a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z',FOLD='M34 3l12 12h-9a3 3 0 0 1-3-3V3z';
function docIcon(kind){
 const g=gid();
 return `<svg class="os-fileicon" viewBox="0 0 56 56" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#EDF0F5"/></linearGradient>${kind==='pdf'?`<linearGradient id="${g}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6257"/><stop offset="1" stop-color="#DD2F25"/></linearGradient>`:''}</defs><path d="${PAGE}" fill="url(#${g})" stroke="#00000026" stroke-width=".9"/><path d="${FOLD}" fill="#D5DBE4"/>${kind==='pdf'?`<rect x="13" y="33" width="27" height="13" rx="3.5" fill="url(#${g}b)"/><text x="26.5" y="42.4" font-size="8.6" font-weight="700" text-anchor="middle" fill="#fff" font-family="-apple-system,BlinkMacSystemFont,sans-serif">PDF</text>`:`<g stroke="#C3CAD4" stroke-width="2.6" stroke-linecap="round"><path d="M17 26h22"/><path d="M17 33h22"/><path d="M17 40h13"/></g>`}</svg>`;
}
function folderIcon(){
 const back=gid(),front=gid();
 return `<svg class="os-fileicon" viewBox="0 0 56 56" aria-hidden="true"><defs><linearGradient id="${back}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9DDF8"/><stop offset="1" stop-color="#84C7EE"/></linearGradient><linearGradient id="${front}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93D1F4"/><stop offset="1" stop-color="#53A7E1"/></linearGradient></defs><path d="M9.5 12h11a3.5 3.5 0 0 1 2.6 1.15l2.8 3.05A3.5 3.5 0 0 0 28.5 17.35h18A5.5 5.5 0 0 1 52 22.85V41.5A5.5 5.5 0 0 1 46.5 47h-37A5.5 5.5 0 0 1 4 41.5v-24A5.5 5.5 0 0 1 9.5 12z" fill="url(#${back})"/><path d="M8 20.5h40a4 4 0 0 1 4 4V41.5A5.5 5.5 0 0 1 46.5 47h-37A5.5 5.5 0 0 1 4 41.5V24.5a4 4 0 0 1 4-4z" fill="url(#${front})"/><path d="M8.5 21.2h39" fill="none" stroke="#ffffff8c" stroke-width="1.1" stroke-linecap="round"/></svg>`;
}
const leaveIcon='<svg class="os-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M9 3H4v10h5M7 8h8m-3-3 3 3-3 3"/></svg>';
// Traffic lights: the glyphs only show while the group is hovered or focused, as they do on macOS.
const lightGlyph={
 close:'<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.7 3.7l4.6 4.6M8.3 3.7L3.7 8.3"/></svg>',
 minimize:'<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.2 6h5.6"/></svg>',
 zoom:'<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.9 9.1V5.5l3.6 3.6zM9.1 2.9v3.6L5.5 2.9z"/></svg>'
};
const fileIcon={resume:()=>docIcon('pdf'),projects:folderIcon,about:()=>docIcon('txt')};
function el(tag,className,textContent){const e=document.createElement(tag);if(className)e.className=className;if(textContent!=null)e.textContent=textContent;return e;}

export function createComputer(config,{onExit}={}){
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches,narrow=()=>innerWidth<700||innerHeight<420;
 let state=initial,anchor=null,busy=false,opener=null,clock=null,wallpaperDrawn=false;

 const layer=el('div');layer.id='computer';layer.setAttribute('role','dialog');layer.setAttribute('aria-label','Keith’s computer');layer.hidden=true;
 // Menu bar and title bars are <div>s: style.css styles the site's <header> globally (fixed, offset, pointer-events:none).
 layer.innerHTML='<canvas class="os-wallpaper" width="2234" height="1670" aria-hidden="true"></canvas><div class="os-shade"></div><div class="os-menubar"><span class="os-app-name">Finder</span><span class="os-clock"></span></div><div class="os-files"></div><div class="os-window-host"></div>';
 const wallpaper=layer.querySelector('.os-wallpaper'),menubar=layer.querySelector('.os-menubar'),appLabel=layer.querySelector('.os-app-name'),clockLabel=layer.querySelector('.os-clock'),filesHost=layer.querySelector('.os-files'),windowHost=layer.querySelector('.os-window-host');
 const standUp=el('button','os-standup');standUp.innerHTML=leaveIcon+'<span>Stand up</span>';standUp.onclick=()=>exit();menubar.append(standUp);

 // Desktop files: only the ones that have content behind them.
 const available=files.filter(f=>f.id==='about'?!!config.about:f.id==='resume'?!!config.resume:(config.projects||[]).length>0);
 for(const f of available){const b=el('button','os-file');b.dataset.file=f.id;b.setAttribute('aria-label',f.name);b.innerHTML=fileIcon[f.id]();b.append(el('span','os-file-name',f.name));b.onclick=()=>open(f.id,b);filesHost.append(b);}
 document.body.append(layer);

 // The largest clean region of the source screenshot: right of its widgets, below its menu bar, above its dock.
 // Same photograph and same left edge as the monitor texture, so leaning in is continuous.
 function drawWallpaper(){if(wallpaperDrawn)return;wallpaperDrawn=true;const img=new Image();img.onload=()=>{const c=wallpaper.getContext('2d');c.drawImage(img,790,95,2234,1670,0,0,2234,1670);};img.onerror=()=>{wallpaperDrawn=false;};img.src='/hero/desktop-source.webp';}
 function tick(){clockLabel.textContent=new Date().toLocaleString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});}
 function dispatch(action){state=reduce(state,action);render();}
 function open(file,by){
  opener=by||opener;
  // Clicking the icon of a minimized window restores it instead of opening a fresh one, so its page keeps its state.
  if(state.minimized&&state.window?.file===file&&!state.window.project)dispatch({type:'restore'});
  else dispatch({type:'open',file});
  windowHost.querySelector('.os-close')?.focus({preventScroll:true});
 }
 // The window is rebuilt only when its identity changes; minimize, restore and full screen just retag it,
 // which is what keeps an embedded page from reloading.
 const windowId=w=>w?`${w.app}|${w.file}|${w.project||''}`:null;
 let builtId=null;
 function render(){
  appLabel.textContent=appName(state.window);
  const id=windowId(state.window);
  if(id!==builtId){builtId=id;renderWindow(state.window);}
  const w=windowHost.querySelector('.os-window');
  if(w){
   w.classList.toggle('is-minimized',state.minimized);
   w.classList.toggle('is-fullscreen',state.fullscreen);
   const title=w.getAttribute('aria-label')||'';
   w.querySelector('.os-zoom')?.setAttribute('aria-label',(state.fullscreen?'Exit full screen: ':'Full screen: ')+title);
  }
  for(const b of filesHost.children){
   const name=files.find(f=>f.id===b.dataset.file)?.name||'';
   const minimized=state.minimized&&state.window?.file===b.dataset.file;
   b.classList.toggle('is-minimized',minimized);
   b.setAttribute('aria-label',minimized?name+' (minimized, click to restore)':name);
  }
 }
 function projectById(id){return (config.projects||[]).find(p=>p.id===id);}
 // Every document window is a light sheet with its content laid straight on it.
 function sheetDoc(){const sheet=el('div','os-sheet'),doc=el('article','os-doc');sheet.append(doc);return {sheet,doc};}
 function bullets(points=[]){const ul=el('ul','os-bullets');for(const t of points)ul.append(el('li',null,t));return ul;}
 function external(parent,label,url,className){const a=el('a',className,label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';parent.append(a);return a;}
 function pills(stack){const ul=el('ul','os-pills');for(const t of (stack||'').split(',').map(s=>s.trim()).filter(Boolean))ul.append(el('li',null,t));return ul;}
 // Projects read as cards, the way they do on the personal site: title, one paragraph, the stack as pills.
 // Cards are replaced by the page they open, so they never become the focus-return target; the desktop
 // file that opened the folder stays the opener.
 const ctaArrow='<svg class="os-cta-arrow" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6h7M6.6 3l3 3-3 3"/></svg>';
 function renderFinder(){
  const sheet=el('div','os-sheet'),head=el('div','os-sheet-head'),grid=el('div','os-cards');
  head.append(el('h2',null,'Projects'));
  if(config.projectsIntro)head.append(el('p',null,config.projectsIntro));
  for(const p of config.projects||[]){
   const card=el('article','os-card'+(p.image?'':' is-plain'));
   const openPage=()=>{dispatch({type:'openProject',id:p.id});windowHost.querySelector('.os-close')?.focus({preventScroll:true});};
   // A thumbnail that fails to load takes its column with it rather than leaving an empty grey box.
   if(p.image){const img=el('img','os-card-thumb');img.src=p.image;img.alt='';img.loading='lazy';img.onerror=()=>{img.remove();card.classList.add('is-plain');};card.append(img);}
   const body=el('div','os-card-body'),top=el('div','os-card-head');
   top.append(el('h3',null,p.title));
   if(p.period)top.append(el('span','os-card-date',p.period));
   body.append(top);
   if(p.summary)body.append(el('p',null,p.summary));
   if(p.stack)body.append(pills(p.stack));
   const cta=el('button','os-card-cta');cta.innerHTML='<span>View Project</span>'+ctaArrow;
   cta.setAttribute('aria-label','View project: '+p.title);
   cta.onclick=e=>{e.stopPropagation();openPage();};
   body.append(cta);card.append(body);
   // The whole card is a click target; the button carries it for the keyboard.
   card.onclick=openPage;
   grid.append(card);
  }
  sheet.append(head,grid);return sheet;
 }
 // Keith's call: the Resume window shows the real thing. First choice is the live resume page; the PDF is the
 // fallback, and browsers that cannot render PDFs inline get an open/download panel instead.
 function canEmbedPdf(){const v=navigator.pdfViewerEnabled;return typeof v==='boolean'?v:!matchMedia('(pointer: coarse)').matches;}
 function renderPdf(){
  const file=config.resume?.file,name=files.find(f=>f.id==='resume').name;
  if(file&&canEmbedPdf()){const frame=el('iframe','os-embed');frame.src=file+'#toolbar=0&navpanes=0&view=FitH';frame.title=name;return frame;}
  const box=el('div','os-pdf-fallback');box.innerHTML=docIcon('pdf');box.append(el('strong',null,name),el('p',null,'This browser cannot show the PDF here.'));
  if(file){external(box,'Open PDF',file,'os-action');const d=el('a','os-action','Download PDF');d.href=file;d.setAttribute('download','');box.append(d);}
  return box;
 }
 function renderResume(){
  const site=config.resume?.site;
  if(!site)return renderPdf();
  const frame=el('iframe','os-embed');frame.title='Resume';frame.referrerPolicy='no-referrer';
  // The iframe's load event is no signal here: an unreachable site still fires it, because the browser loads its
  // own error page. Probe reachability first and only then attach the src; a dev server that is down, a URL that
  // was never deployed, and http content blocked inside an https page all land in catch and fall back to the PDF.
  const stop=new AbortController(),timer=setTimeout(()=>stop.abort(),5000);
  fetch(site,{mode:'no-cors',cache:'no-store',signal:stop.signal})
   .then(()=>{if(frame.isConnected)frame.src=site;})
   .catch(()=>{if(frame.isConnected)frame.replaceWith(renderPdf());})
   .finally(()=>clearTimeout(timer));
  return frame;
 }
 // A project page sits on the same light sheet as the card list it came from, not on the dark canvas.
 function renderProject(id){
  const {sheet,doc:p}=sheetDoc(),pr=projectById(id);
  if(!pr)return sheet;
  if(pr.image){const img=el('img','os-doc-hero');img.src=pr.image;img.alt='';img.onerror=()=>img.remove();p.append(img);}
  p.append(el('h2','os-doc-title',pr.title));if(pr.subtitle)p.append(el('p','os-doc-sub',pr.subtitle));
  if(pr.period)p.append(el('p','os-entry-meta',pr.period));
  if(pr.stack)p.append(pills(pr.stack));
  if(pr.summary)p.append(el('p','os-doc-text',pr.summary));p.append(bullets(pr.points));
  if(pr.url)external(p,'Open the live app',pr.url,'os-action');
  return sheet;
 }
 function renderAbout(){const a=config.about||{},{sheet,doc:p}=sheetDoc();p.append(el('h2','os-doc-title',a.lead||'About me'));if(a.hook)p.append(el('p','os-doc-lede',a.hook));for(const t of a.body||[])p.append(el('p','os-doc-text',t));return sheet;}
 function renderWindow(win){
  const current=windowHost.querySelector('.os-window');
  // Closing fades the window out over 160ms (CSS); opening another file replaces it at once.
  if(!win){if(current&&!reduced()){current.classList.remove('is-open');setTimeout(()=>{if(!state.window)windowHost.replaceChildren();},170);}else windowHost.replaceChildren();return;}
  windowHost.replaceChildren();
  const title=win.project?(projectById(win.project)?.title||'Project'):files.find(f=>f.id===win.file)?.name||'';
  const w=el('section','os-window');w.setAttribute('role','dialog');w.setAttribute('aria-label',title);
  const bar=el('div','os-titlebar'),lights=el('div','os-lights');
  const light=(cls,label,glyph,onclick)=>{const b=el('button','os-light '+cls);b.setAttribute('aria-label',label);b.innerHTML=glyph;b.onclick=onclick;lights.append(b);return b;};
  light('os-close','Close '+title,lightGlyph.close,()=>{dispatch({type:'closeWindow'});(opener||standUp).focus({preventScroll:true});});
  light('os-minimize','Minimize '+title,lightGlyph.minimize,()=>{dispatch({type:'minimize'});(opener||standUp).focus({preventScroll:true});});
  light('os-zoom','Full screen: '+title,lightGlyph.zoom,()=>dispatch({type:'fullscreen'}));
  bar.append(lights);
  if(win.project){const back=el('button','os-back','Projects');back.setAttribute('aria-label','Back to Projects');back.onclick=()=>{dispatch({type:'back'});windowHost.querySelector('.os-card-title')?.focus({preventScroll:true});};bar.append(back);}
  bar.append(el('div','os-title',title));w.append(bar);
  if(win.app==='preview'&&!win.project&&(config.resume?.site||config.resume?.file)){
   const t=el('div','os-toolbar');
   if(config.resume.site)external(t,'Open in a new tab',config.resume.site,'os-action');
   if(config.resume.file){const a=el('a','os-action','Download PDF');a.href=config.resume.file;a.setAttribute('download','');t.append(a);}
   w.append(t);
  }
  const body=el('div','os-body');
  if(win.app==='finder')body.append(renderFinder());
  else if(win.app==='textedit')body.append(renderAbout());
  else if(win.project)body.append(renderProject(win.project));
  else body.append(renderResume());
  w.append(body);windowHost.append(w);requestAnimationFrame(()=>w.classList.add('is-open'));
 }

 const focusables=()=>[...layer.querySelectorAll('button:not([disabled]),a[href]')].filter(e=>e.getClientRects().length>0);
 layer.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
   e.preventDefault();if(busy)return;
   const had=state.window&&!state.minimized,next=reduce(state,{type:'escape'});
   if(!next.open){exit();return;}
   state=next;render();
   if(had&&!next.window)(opener||standUp).focus({preventScroll:true});
   return;
  }
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
