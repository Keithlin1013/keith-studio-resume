import test from 'node:test';
import assert from 'node:assert/strict';
import {chairAngle,leafBend} from './living-objects.js';
test('chair completes a 270-degree return sweep in 80 seconds',()=>{
 const deg=t=>chairAngle(t)*180/Math.PI;
 assert.equal(deg(0),0);
 assert.ok(Math.abs(deg(20)-135)<1e-6);
 assert.ok(Math.abs(deg(60)+135)<1e-6);
 assert.ok(Math.abs(deg(80))<1e-6);
 for(let t=0;t<=160;t+=.1)assert.ok(Math.abs(deg(t))<=135.000001);
 assert.ok(Math.abs(deg(20.01)-deg(19.99))<1e-5);
});
test('leaf motions start at the original shape and remain subtle and staggered',()=>{
 for(let i=0;i<39;i++){
  assert.equal(leafBend(0,i),0);
  for(let t=0;t<=80;t+=.5)assert.ok(Math.abs(leafBend(t,i))<=1);
 }
 assert.notEqual(leafBend(2,0),leafBend(2,1));
});
