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
