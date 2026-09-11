function image(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;})}
export async function displays(studio){
 const [desktop,phone]=await Promise.all([image('/hero/desktop-source.webp'),image('/hero/phone-wallpaper.webp')]);
 const round=(c,x,y,w,h,r,fill)=>{c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()};
 function draw(){
  const now=new Date(),time=now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}).replace(/\s?[AP]M/,'');
  let c=studio.canvases.desktop.getContext('2d'),w=c.canvas.width,h=c.canvas.height;
  // Use the photographic region only; draw crisp interface elements at native resolution.
  c.drawImage(desktop,780,180,2200,924,0,0,w,h);
  const shade=c.createLinearGradient(0,0,0,h);shade.addColorStop(0,'#14243a33');shade.addColorStop(1,'#0b172622');c.fillStyle=shade;c.fillRect(0,0,w,h);
  c.fillStyle='#1623337a';c.fillRect(0,0,w,65);c.fillStyle='white';c.textAlign='left';c.font='500 28px -apple-system,sans-serif';c.fillText('Finder     File     Edit     View     Go     Window     Help',70,43);c.textAlign='right';c.fillText(now.toLocaleString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}),w-55,43);
  round(c,92,120,680,355,34,'#24324d88');c.fillStyle='#fff';c.textAlign='left';c.font='500 145px -apple-system,sans-serif';c.fillText(time,130,320);c.font='28px -apple-system,sans-serif';c.fillText(now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}),136,405);
  round(c,800,120,510,355,34,'#24324d88');c.fillStyle='#fff';c.font='600 29px -apple-system,sans-serif';c.fillText(now.toLocaleDateString('en-US',{month:'long'}).toUpperCase(),843,180);c.font='23px -apple-system,sans-serif';const days=['S','M','T','W','T','F','S'];days.forEach((d,i)=>c.fillText(d,848+i*62,228));const start=new Date(now.getFullYear(),now.getMonth(),1).getDay(),count=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();for(let d=1;d<=count;d++){const col=(d+start-1)%7,row=Math.floor((d+start-1)/7),x=856+col*62,y=273+row*39;if(d===now.getDate()){round(c,x-17,y-26,34,34,17,'#ffffff');c.fillStyle='#223047'}else c.fillStyle='white';c.textAlign='center';c.fillText(d,x,y)}
  const labels=['Finder','Safari','Mail','Photos','Notes','Music','Calendar','Code'];const colors=['#59bafa','#f2f6fb','#318cf1','#f3f3f3','#edcb54','#e45576','#f3f4f7','#267bba'];const dockW=1170,x0=(w-dockW)/2;round(c,x0,h-180,dockW,143,30,'#e5eaf064');
  labels.forEach((label,i)=>{const x=x0+27+i*142;round(c,x,h-165,112,112,24,colors[i]);c.fillStyle=i===1||i===3||i===6?'#344968':'white';c.textAlign='center';c.font='600 24px -apple-system,sans-serif';c.fillText(label,x+56,h-105);c.beginPath();c.arc(x+56,h-42,3,0,7);c.fill()});studio.refresh('desktop');
  c=studio.canvases.phone.getContext('2d');w=c.canvas.width;h=c.canvas.height;c.drawImage(phone,0,0,w,h);c.fillStyle='#222933';c.textAlign='center';c.font='28px -apple-system,sans-serif';c.fillText(now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}),w/2,220);c.font='500 115px -apple-system,sans-serif';c.fillText(time,w/2,350);round(c,w/2-90,30,180,45,24,'#050609');round(c,w/2-100,h-32,200,8,4,'#343c46');studio.refresh('phone');window.studioClock=now.toISOString();
 }
 draw();return setInterval(draw,1000);
}
