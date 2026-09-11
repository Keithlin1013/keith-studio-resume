import {wallTransform} from './about-wall.js';
import './navigation.css';
export function createNavigation(frame,onSelect){
 const items=[['about','About Me'],['resume','Resume'],['projects','Projects'],['education','Education'],['contact','Contact']];
 const wall=document.createElement('nav');wall.className='wall-navigation';wall.setAttribute('aria-label','Studio navigation');
 const menu=document.createElement('nav');menu.className='desk-navigation';menu.setAttribute('aria-label','Desk navigation');menu.hidden=true;
 const toggle=document.createElement('button');toggle.className='navigation-toggle';toggle.textContent='Menu';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','desk-navigation-items');menu.append(toggle);
 const makeList=host=>{const list=document.createElement('div');for(const [id,name] of items){const b=document.createElement('button');b.textContent=name;b.dataset.section=id;b.onclick=()=>select(id);list.append(b);}host.append(list);return list;};
 // Only the wall carries a heading; the desk menu is already labelled by its own toggle.
 const wallList=makeList(wall);
 const wallToggle=document.createElement('button');wallToggle.className='wall-navigation-title';wallToggle.textContent='NAVIGATION';wallToggle.setAttribute('aria-controls','wall-navigation-options');wallList.prepend(wallToggle);
 const light=document.createElement('div');light.className='about-wall-light navigation-white-light';light.setAttribute('aria-hidden','true');light.innerHTML='<span></span>';wall.prepend(light);
 const options=document.createElement('div');options.className='wall-navigation-options';options.id='wall-navigation-options';const inner=document.createElement('div');inner.className='wall-navigation-inner';for(const b of wallList.querySelectorAll('[data-section]'))inner.append(b);options.append(inner);wallList.append(options);
 let expanded=false;
 const expand=value=>{expanded=value;wall.classList.toggle('expanded',value);wallToggle.setAttribute('aria-expanded',String(value));options.inert=!value;options.setAttribute('aria-hidden',String(!value));};expand(false);
 wallToggle.onclick=()=>expand(!expanded);wall.onkeydown=e=>{if(e.key==='Escape'){expand(false);wallToggle.focus();}};
 const list=makeList(menu);list.id='desk-navigation-items';list.hidden=true;
 toggle.onclick=()=>{list.hidden=!list.hidden;toggle.setAttribute('aria-expanded',String(!list.hidden));};
 let busy=false;
 const active=id=>{for(const b of [...wall.querySelectorAll('[data-section]'),...menu.querySelectorAll('[data-section]')]){if(b.dataset.section===id)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}};
 async function select(id){if(busy)return;busy=true;expand(false);list.hidden=true;toggle.setAttribute('aria-expanded','false');try{await onSelect(id);active(id);}finally{busy=false;}}
 menu.onkeydown=e=>{if(e.key==='Escape'){list.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();}};
 frame.append(wall);document.body.append(menu);active('about');
 const inverse=[[.8607445359,-.5090374947,.0000018552,2.1113591194],[.0910966247,.1540412456,.9838562608,-1.8592258692],[-.5008198619,-.8468486667,.178961724,-4.339618206]];
 const corners=[[2.325,1.8,2.4],[2.325,.65,2.4],[2.325,.65,1.05],[2.325,1.8,1.05]].map(p=>inverse.map(r=>r[0]*p[0]+r[1]*p[1]+r[2]*p[2]+r[3]));
 return {active,project(project){const matrix=wallTransform(corners.map(project),240,300);if(matrix)wall.style.transform=matrix;},setDesk(value){expand(false);wall.hidden=value;menu.hidden=!value;list.hidden=true;toggle.setAttribute('aria-expanded','false');}};
}
