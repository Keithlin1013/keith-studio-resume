import test from 'node:test';
import assert from 'node:assert/strict';
import {glowTargets} from './glow-state.js';

const state={educationOpen:false,musicOpen:false,paused:true,ended:false,error:null};
test('SBU follows its information card independently of music',()=>{
 assert.deepEqual(glowTargets({...state,educationOpen:true}),{education:1,music:0});
 assert.deepEqual(glowTargets({...state,educationOpen:true,paused:false}),{education:1,music:1});
 assert.deepEqual(glowTargets({...state,paused:false}),{education:0,music:1});
});
test('speaker remains lit for playback after closing the card, then extinguishes on pause',()=>{
 assert.equal(glowTargets({...state,musicOpen:true}).music,.35);
 assert.equal(glowTargets({...state,musicOpen:true,paused:false}).music,1);
 assert.equal(glowTargets({...state,musicOpen:false,paused:false}).music,1);
 assert.equal(glowTargets(state).music,0);
});
test('ended or failed audio cannot leave the logo in its playing state',()=>{
 assert.equal(glowTargets({...state,paused:false,ended:true}).music,0);
 assert.equal(glowTargets({...state,paused:false,error:{code:3}}).music,0);
 assert.equal(glowTargets({...state,musicOpen:true,paused:false,error:{code:3}}).music,.35);
});
