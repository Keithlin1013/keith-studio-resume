import './style.css';
import './portal.css';
import './music-compact.css';
import {createStudio} from './scene.js';
import {createAboutWall} from './about-wall.js';
import {createPortal} from './portal.js';
import {createNavigation} from './navigation.js';
import {displays} from './displays.js';
import {readTrack} from './music.js';
import {content as config} from './content.js';
import {glowTargets} from './glow-state.js';
import {createComputer} from './computer.js';
import {subsample} from './screen-rect.js';
const $=s=>document.querySelector(s),frame=$('#frame'),viewport=$('#viewport'),audio=$('#audio'),status=$('#status'),coarse=matchMedia('(pointer: coarse)');
let studio,entrance,deskStudio,portal,aboutWall,navigation,computer,gate=()=>{},atDesk=false,ready=false,lampOn=true,phoneOn=false,tracks=[],index=-1,request=0,lastProjection=0;
const targets=new Map(),polygons=new Map(),cards={music:$('#music-card'),contact:$('#contact-card'),education:$('#education-card')};
const names={music:'Open music player',contact:'Wake phone and view contact details',education:'View education details',lamp:'Toggle screen light',computer:'Open the computer'};
function announce(text){status.textContent=text;$('#hint').classList.add('used')}
function syncGlow(){studio?.setGlow(glowTargets({educationOpen:!cards.education.hidden,musicOpen:!cards.music.hidden,paused:audio.paused,ended:audio.ended,error:audio.error}));}
function hideCard(id,focus=true){cards[id].hidden=true;targets.get(id)?.setAttribute('aria-expanded','false');syncGlow();if(focus)targets.get(id)?.focus({preventScroll:true})}
function showCard(id){if(id==='education'||id==='contact')navigation?.active(id);for(const key of Object.keys(cards))if(key!==id)hideCard(key,false);cards[id].hidden=false;targets.get(id)?.setAttribute('aria-expanded','true');syncGlow();positionCards();cards[id].querySelector('.dismiss').focus({preventScroll:true})}
function act(id){if(!ready||!atDesk)return;announce('');if(id==='computer'){openComputer();return;}if(id==='lamp'){lampOn=!lampOn;studio.setLamp(lampOn);targets.get(id).setAttribute('aria-pressed',String(lampOn));announce(lampOn?'Screen light on':'Screen light off');return;}if(id==='contact'){phoneOn=true;studio.setPhone(true);targets.get(id).setAttribute('aria-label','Open contact details');}cards[id].hidden?showCard(id):hideCard(id);}
// The monitor: close the cards, remember where the screen is on the page, hand the desk over to the computer layer.
function openComputer(fileId){if(!ready||!atDesk||computer.active)return;for(const key of Object.keys(cards))hideCard(key,false);const f=frame.getBoundingClientRect(),b=studio.data.objects.find(o=>o.id==='computer')?.box;if(b)computer.setAnchor({x:f.left+b.x,y:f.top+b.y,w:b.w,h:b.h});gate(false);$('#hint').classList.add('used');$('.room-return').hidden=true;$('.desk-navigation').hidden=true;status.textContent='Opening the computer';computer.enter(fileId);}
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>hideCard(b.dataset.close);
$('#sleep-phone').onclick=()=>{phoneOn=false;studio.setPhone(false);hideCard('contact');targets.get('contact').setAttribute('aria-label',names.contact)};
document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const id of Object.keys(cards))if(!cards[id].hidden)hideCard(id)});
function text(parent,tag,value){const e=document.createElement(tag);e.textContent=value;parent.append(e);return e;}
const contact=$('#contact-content');if(config.name)text(contact,'p',config.name).className='contact-line';if(config.location)text(contact,'p',config.location).className='contact-meta';if(config.email){const a=text(contact,'a',config.email);a.href='mailto:'+config.email}else text(contact,'p','Contact details are coming soon.');for(const link of config.links||[]){const a=text(contact,'a',link.label);a.href=link.url;a.target='_blank';a.rel='noopener noreferrer'}
for(const degree of [].concat(config.major||'Major details are coming soon.'))text($('#education-content'),'p',degree).className='degree';text($('#education-content'),'p',config.majorDescription||'Coursework and campus experience will appear here.');
function hull(points){points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);const lower=[],upper=[];for(const p of points){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p)}for(const p of [...points].reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p)}return lower.slice(0,-1).concat(upper.slice(0,-1))}
function projection(project,data){if(data===entrance?.data){portal?.project(project);aboutWall?.project(project);navigation?.project(project);}if(data!==studio?.data)return;if(performance.now()-lastProjection<30)return;lastProjection=performance.now();for(const o of data.objects){const points=hull(o.points.map(project)),poly=polygons.get(o.id);if(!poly)continue;poly.setAttribute('points',points.map(p=>p.join(',')).join(' '));const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y,b=targets.get(o.id);o.box={x,y,w,h};
 // A finger gets a rectangle no smaller than 44px; a mouse keeps the object's own silhouette.
 if(coarse.matches){const tw=Math.max(w,44),th=Math.max(h,44);Object.assign(b.style,{left:(x+w/2-tw/2)+'px',top:(y+h/2-th/2)+'px',width:tw+'px',height:th+'px',clipPath:'none'});}
 else Object.assign(b.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px',clipPath:`polygon(${points.map(p=>`${(p[0]-x)/w*100}% ${(p[1]-y)/h*100}%`).join(',')})`});
 }positionCards()}
function positionCards(){if(!studio)return;const r=frame.getBoundingClientRect();for(const [id,card] of Object.entries(cards)){if(card.hidden)continue;const o=studio.data.objects.find(o=>o.id===id),b=o.box;if(!b)continue;let width=id==='music'?Math.max(235,Math.min(360,b.w)):236;width=Math.min(width,innerWidth-28);card.style.width=width+'px';const h=card.offsetHeight;let x=r.left+b.x,y=r.top+b.y-h-12;if(id==='contact'){x=r.left+b.x+b.w+16;y=r.top+b.y-25}if(id==='education'){x=r.left+b.x+b.w/2-width/2;}if(innerWidth<700){x=(innerWidth-width)/2;y=Math.min(innerHeight-h-22,Math.max(65,y));}card.style.left=Math.max(14,Math.min(innerWidth-width-14,x))+'px';card.style.top=Math.max(64,Math.min(innerHeight-h-20,y))+'px';}}
function resize(){if(!studio)return;const mobile=innerWidth<700;const aspect=studio.data.width/studio.data.height;const w=Math.min(innerWidth,innerHeight*aspect);const h=w/aspect;frame.style.width=w+'px';frame.style.height=h+'px';frame.style.left=mobile?'0px':(innerWidth-w)/2+'px';frame.style.top=Math.max(0,(innerHeight-h)/2)+'px';studio.resize(w,h);if(entrance&&entrance!==studio)entrance.resize(w,h);if(deskStudio&&deskStudio!==studio)deskStudio.resize(w,h);$('#hit-regions').setAttribute('viewBox',`0 0 ${w} ${h}`);if(mobile)viewport.scrollLeft=(w-innerWidth)/2;positionCards();}
window.addEventListener('pointermove',e=>{studio?.pointer(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2,e.pointerType)});document.documentElement.addEventListener('pointerleave',()=>studio?.reset());window.addEventListener('blur',()=>studio?.reset());viewport.addEventListener('scroll',positionCards);window.addEventListener('resize',resize);
function updateTrack(){const t=tracks[index];if(!t)return;$('#track-title').textContent=t.title;$('#track-artist').textContent=t.artist||'Studio soundtrack';$('#cover').hidden=!t.cover;$('#cover-placeholder').hidden=!!t.cover;if(t.cover)$('#cover').src=t.cover;$('#choose-cover').hidden=false;$('#play').disabled=false;$('#previous').disabled=$('#next').disabled=tracks.length<2;$('#music-message').textContent='';$('#seek').value=0;}
// The bundled track needs no picking, so a failure must never tell the visitor to choose another file.
// A rejected play() is usually either an interrupted load (refetch and retry) or the browser's media
// policy in an embedded view (pressing play again works).
const isPicked=()=>!!tracks[index]?.url?.startsWith('blob:');
async function play(){
 if(index<0)return;const token=++request;let failure=null;
 try{await audio.play();if(token!==request)return;$('#music-message').textContent='';}
 catch(e){failure=e;}
 if(failure&&failure.name!=='AbortError'&&token===request&&audio.readyState<2){
  try{audio.load();await audio.play();failure=null;$('#music-message').textContent='';}catch(e){failure=e;}
 }
 if(failure&&failure.name!=='AbortError'&&token===request)
  $('#music-message').textContent=failure.name==='NotAllowedError'?'Your browser blocked playback. Press play again.'
   :isPicked()?'Unable to play this file. Try another one.':'Playback did not start. Press play again.';
 syncPlay();
}
function syncPlay(){const playing=!audio.paused&&!audio.ended&&!audio.error;$('#play').setAttribute('aria-label',playing?'Pause':'Play');$('#play').innerHTML=playing?'<svg viewBox="0 0 24 24"><path d="M7 4h3v16H7zM14 4h3v16h-3z"/></svg>':'<svg viewBox="0 0 24 24"><path d="m8 4 12 8-12 8z"/></svg>';targets.get('music')?.classList.toggle('playing',playing);syncGlow()}
function select(n,autoplay=true){if(!tracks.length)return;request++;audio.pause();index=(n+tracks.length)%tracks.length;audio.src=tracks[index].url;updateTrack();if(autoplay)play();else syncPlay();}
$('#play').onclick=()=>{if(audio.paused)play();else{request++;audio.pause();syncPlay()}};$('#previous').onclick=()=>select(index-1);$('#next').onclick=()=>select(index+1);audio.onended=()=>{if(tracks.length>1)select(index+1);else syncPlay()};audio.onplay=audio.onpause=syncPlay;audio.onerror=()=>{$('#music-message').textContent=isPicked()?'Unable to load this file. Try another one.':'Unable to load the track.';syncPlay()};
$('#choose-tracks').onclick=()=>$('#audio-file').click();$('#audio-file').onchange=async e=>{const files=[...e.target.files];if(!files.length)return;$('#music-message').textContent='Loading music…';request++;audio.pause();for(const t of tracks)for(const u of [t.url,t.cover])if(u?.startsWith('blob:'))URL.revokeObjectURL(u);tracks=await Promise.all(files.map(readTrack));select(0);e.target.value='';};
$('#choose-cover').onclick=()=>$('#cover-file').click();$('#cover-file').onchange=e=>{const f=e.target.files[0];if(!f||index<0)return;const t=tracks[index];if(t.cover?.startsWith('blob:'))URL.revokeObjectURL(t.cover);t.cover=URL.createObjectURL(f);updateTrack();};audio.volume=.35;$('#volume').oninput=e=>audio.volume=Number(e.target.value);
const fmt=n=>Number.isFinite(n)?`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`:'0:00';audio.ontimeupdate=audio.onloadedmetadata=()=>{const valid=Number.isFinite(audio.duration)&&audio.duration>0;$('#seek').disabled=!valid;$('#seek').value=valid?audio.currentTime/audio.duration*1000:0;$('#elapsed').textContent=fmt(audio.currentTime);$('#duration').textContent=fmt(audio.duration)};$('#seek').oninput=e=>{if(Number.isFinite(audio.duration))audio.currentTime=Number(e.target.value)/1000*audio.duration};
async function init(){try{studio=await createStudio(frame,projection);entrance=studio;studio.data.objects.push({id:'computer',points:subsample(studio.data.screens.desktop.positions)});aboutWall=createAboutWall(frame,config.about);for(const o of studio.data.objects){const p=document.createElementNS('http://www.w3.org/2000/svg','polygon');p.dataset.object=o.id;$('#hit-regions').append(p);polygons.set(o.id,p);const b=document.createElement('button');b.className='object-target';b.dataset.action=o.id;b.setAttribute('aria-label',names[o.id]);if(cards[o.id])b.setAttribute('aria-expanded','false');if(o.id==='computer')b.setAttribute('aria-haspopup','dialog');if(o.id==='lamp')b.setAttribute('aria-pressed','true');b.disabled=true;b.onclick=()=>act(o.id);b.onpointerenter=b.onfocus=()=>p.classList.add('hover');b.onpointerleave=b.onblur=()=>p.classList.remove('hover');$('#targets').append(b);targets.set(o.id,b);}resize();await displays(studio);tracks=config.playlist||[];if(!tracks.length&&config.musicUrl)tracks=[{title:config.musicTitle||'Studio soundtrack',url:config.musicUrl}];if(tracks.length)select(0,false);ready=true;$('#loading').hidden=true;
const nearHost=document.createElement('div');nearHost.className='desk-view';frame.prepend(nearHost);
gate=value=>{atDesk=value;for(const b of targets.values())b.disabled=!value;const regions=$('#hit-regions');regions.style.visibility=value?'visible':'hidden';regions.classList.toggle('awake',value)};
gate(false);$('#hint').textContent='Click the ring to enter the desk';
portal=createPortal(frame,{
 async enter(){
  aboutWall.setVisible(false);navigation?.setDesk(true);
  deskStudio.setActive(true);entrance.reset();entrance.settle(true);nearHost.classList.add('visible');
  studio=deskStudio;resize();studio.setLamp(lampOn);studio.setPhone(phoneOn);syncGlow();
  await new Promise(r=>setTimeout(r,matchMedia('(prefers-reduced-motion: reduce)').matches?0:1400));
  entrance.setActive(false);gate(true);$('#hint').textContent='Click objects on the desk to explore';$('#hint').classList.remove('used');
 },
 async leave(){
  aboutWall.setVisible(true);navigation?.setDesk(false);
  entrance.setActive(true);entrance.settle(false);gate(false);for(const id of Object.keys(cards))hideCard(id,false);
  nearHost.classList.remove('visible');studio=entrance;resize();studio.setLamp(lampOn);studio.setPhone(phoneOn);syncGlow();
  $('#hint').textContent='Click the ring to enter the desk';$('#hint').classList.remove('used');
  await new Promise(r=>setTimeout(r,matchMedia('(prefers-reduced-motion: reduce)').matches?0:1000));deskStudio.setActive(false);
 }
});
try{deskStudio=await createStudio(nearHost,projection,{folder:'hero-desk-wide',live:false});deskStudio.data.objects.push({id:'computer',points:subsample(deskStudio.data.screens.desktop.positions)});await displays(deskStudio);deskStudio.resize(frame.offsetWidth,frame.offsetHeight);deskStudio.setActive(false);portal.ready()}catch(error){console.error(error);$('#hint').textContent='Unable to load the desk. Please refresh to try again.'}
computer=createComputer(config,{onExit(){gate(true);$('.room-return').hidden=false;$('.desk-navigation').hidden=false;$('#hint').textContent='Click objects on the desk to explore';$('#hint').classList.remove('used');status.textContent='';targets.get('computer')?.focus({preventScroll:true});}});
navigation=createNavigation(frame,async id=>{
 for(const key of Object.keys(cards))hideCard(key,false);
 if(id==='about'){await portal.leave();aboutWall.open();return;}
 if(id==='education'||id==='contact'){await portal.enter();act(id);return;}
 await portal.enter();openComputer(id);
});
aboutWall.onOpen=()=>navigation.active('about');
window.studioReady=true;window.studioDebug=()=>({ready,computer:computer?.active,lampOn,phoneOn,trackCount:tracks.length,trackIndex:index,playing:!audio.paused,motion:studio.debug(),cards:Object.fromEntries(Object.entries(cards).map(([k,v])=>[k,!v.hidden])),presentation:'Depth-reconstructed Blender render with live display meshes'});}catch(e){console.error(e);$('#loading').textContent='Unable to load Studio. Please refresh or use a browser that supports WebGL.';}}
init();
