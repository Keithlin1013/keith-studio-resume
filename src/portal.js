export function createPortal(frame,{enter,leave}){
 const button=document.createElement('button');button.className='portal-entry';button.setAttribute('aria-label','Enter desk');
 button.innerHTML='<span class="portal-ring"></span><span class="portal-core"></span><span class="portal-caption">Enter desk</span>';
 button.disabled=true;frame.append(button);
 const back=document.createElement('button');back.className='room-return';back.textContent='← Back to room';back.hidden=true;document.body.append(back);
 let busy=false,desk=false;
 const pause=ms=>new Promise(r=>setTimeout(r,ms));
 button.onclick=async()=>{
  if(busy||desk)return;busy=true;button.disabled=true;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  button.classList.add('activated');
  await pause(reduced?0:650);
  await enter();
  button.classList.add('departed');
  await pause(reduced?0:1400);
  button.hidden=true;back.hidden=false;desk=true;busy=false;back.focus({preventScroll:true});
 };
 back.onclick=async()=>{
  if(busy)return;busy=true;back.disabled=true;
  await leave();desk=false;button.classList.remove('activated','departed');button.hidden=false;button.disabled=false;back.hidden=true;back.disabled=false;busy=false;button.focus({preventScroll:true});
 };
 return {async enter(){if(!desk&&!busy&&!button.disabled)await button.onclick();},async leave(){if(desk&&!busy)await back.onclick();},ready(){button.disabled=false},project(project){
  // A separate upright entrance floats above the seat, following camera parallax.
  const matrix=[[.8607445359,-.5090374947,.0000018552,2.1113591194],[.0910966247,.1540412456,.9838562608,-1.8592258692],[-.5008198619,-.8468486667,.178961724,-4.339618206]];
  const cv=p=>matrix.map(row=>row[0]*p[0]+row[1]*p[1]+row[2]*p[2]+row[3]);
  const center=project(cv([0,2.12,.97])),edge=project(cv([.43,2.12,.97]));
  const diameter=Math.max(100,Math.hypot(edge[0]-center[0],edge[1]-center[1])*2)*.5;
  Object.assign(button.style,{left:center[0]+'px',top:center[1]+'px',width:diameter+'px',height:diameter+'px'});
 }};
}
