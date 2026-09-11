import './about-wall.css';

// Map a rectangular HTML panel onto the four projected corners of the wall.
export function wallTransform(points,width=300,height=470){
 const source=[[0,0],[width,0],[width,height],[0,height]],rows=[];
 source.forEach(([x,y],i)=>{const [u,v]=points[i];rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);});
 for(let i=0;i<8;i++){
  let pivot=i;for(let j=i+1;j<8;j++)if(Math.abs(rows[j][i])>Math.abs(rows[pivot][i]))pivot=j;
  [rows[i],rows[pivot]]=[rows[pivot],rows[i]];
  const scale=rows[i][i];if(Math.abs(scale)<1e-10)return null;
  for(let k=i;k<9;k++)rows[i][k]/=scale;
  for(let j=0;j<8;j++)if(j!==i){const f=rows[j][i];for(let k=i;k<9;k++)rows[j][k]-=f*rows[i][k];}
 }
 const [a,b,c,d,e,f,g,h]=rows.map(row=>row[8]);
 return `matrix3d(${a},${d},0,${g},${b},${e},0,${h},0,0,1,0,${c},${f},0,1)`;
}

export function createAboutWall(frame,config){
 const panel=document.createElement('section');panel.className='about-wall';panel.setAttribute('aria-label','About me');
 panel.innerHTML='<div class="about-wall-light" aria-hidden="true"><span></span></div><h2><button aria-expanded="false" aria-controls="about-wall-content">ABOUT ME</button></h2><div id="about-wall-content" class="about-wall-content" inert aria-hidden="true"><div class="about-wall-inner"><p class="about-wall-lead"></p><div class="about-wall-rule"></div><p class="about-wall-hook"></p><p class="about-wall-bio"></p><ol></ol></div></div>';
 panel.querySelector('.about-wall-lead').textContent=config?.lead||'';
 const hook=panel.querySelector('.about-wall-hook');hook.textContent=config?.hook||'';hook.hidden=!config?.hook;
 const body=config?.body||[];
 const bio=panel.querySelector('.about-wall-bio');bio.textContent=body.length?body.join('\n\n'):'Personal introduction coming soon.';
 const list=panel.querySelector('ol');for(const interest of config?.interests||[]){const item=document.createElement('li');item.textContent=interest;list.append(item);}list.hidden=!list.children.length;
 const button=panel.querySelector('button'),content=panel.querySelector('.about-wall-content');let open=false;
 const api={onOpen:null};
 function toggle(value){open=value;panel.classList.toggle('expanded',open);button.setAttribute('aria-expanded',String(open));content.inert=!open;content.setAttribute('aria-hidden',String(!open));}
 button.onclick=()=>{if(!open)api.onOpen?.();toggle(!open);};
 panel.onkeydown=event=>{if(event.key==='Escape'&&open){toggle(false);button.focus();}};
 frame.append(panel);
 const inverse=[[.8607445359,-.5090374947,.0000018552,2.1113591194],[.0910966247,.1540412456,.9838562608,-1.8592258692],[-.5008198619,-.8468486667,.178961724,-4.339618206]];
 // The plaque runs from the lamp line down to just above the LED strip; 300×523 keeps the same on-wall text size as the old 300×470.
 const corners=[[-3.85,4.915,2.48],[-2.45,4.915,2.48],[-2.45,4.915,.22],[-3.85,4.915,.22]].map(p=>inverse.map(r=>r[0]*p[0]+r[1]*p[1]+r[2]*p[2]+r[3]));
 return Object.assign(api,{
  open(){toggle(true);button.focus({preventScroll:true});},
  project(project){const matrix=wallTransform(corners.map(project),300,523);if(matrix)panel.style.transform=matrix;},
  setVisible(value){panel.classList.toggle('away',!value);panel.inert=!value;if(!value)toggle(false);}
 });
}
