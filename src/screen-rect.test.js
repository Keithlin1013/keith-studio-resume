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
