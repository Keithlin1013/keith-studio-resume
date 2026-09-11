import test from 'node:test';
import assert from 'node:assert/strict';
import {files,initial,reduce,appName} from './computer-state.js';

const closed={open:false,window:null,minimized:false,fullscreen:false};
// A visit starts full screen: opening a file fills the screen unless the visitor asks for a window.
const desktop={open:true,window:null,minimized:false,fullscreen:true};
const resumeWin={app:'preview',file:'resume'};

test('the desktop lists three files with their apps',()=>{
 assert.deepEqual(files.map(f=>f.id),['resume','projects','about']);
 assert.deepEqual(files.map(f=>f.app),['preview','finder','textedit']);
});
test('enter without a file shows the desktop with no window',()=>{
 assert.deepEqual(reduce(initial,{type:'enter'}),desktop);
});
test('enter with a file deep-links straight into its window',()=>{
 assert.deepEqual(reduce(initial,{type:'enter',file:'resume'}),{...desktop,window:resumeWin});
});
test('open replaces the current window; unknown files are ignored',()=>{
 const s=reduce(reduce(initial,{type:'enter'}),{type:'open',file:'about'});
 assert.deepEqual(s.window,{app:'textedit',file:'about'});
 assert.deepEqual(reduce(s,{type:'open',file:'projects'}).window,{app:'finder',file:'projects'});
 assert.equal(reduce(s,{type:'open',file:'nope'}),s);
});
test('projects folder opens a project page and back returns to the folder',()=>{
 const folder=reduce(initial,{type:'enter',file:'projects'});
 const page=reduce(folder,{type:'openProject',id:'smart-finance-analyzer'});
 assert.deepEqual(page.window,{app:'preview',file:'projects',project:'smart-finance-analyzer'});
 assert.deepEqual(reduce(page,{type:'back'}).window,{app:'finder',file:'projects'});
 assert.equal(reduce(folder,{type:'back'}),folder);
});
test('closeWindow keeps the desktop; exit leaves entirely',()=>{
 const s=reduce(initial,{type:'enter',file:'about'});
 assert.deepEqual(reduce(s,{type:'closeWindow'}),desktop);
 assert.deepEqual(reduce(s,{type:'exit'}),closed);
});
test('appName follows the window',()=>{
 assert.equal(appName(null),'Finder');
 assert.equal(appName({app:'preview',file:'resume'}),'Preview');
 assert.equal(appName({app:'textedit',file:'about'}),'TextEdit');
 assert.equal(appName({app:'finder',file:'projects'}),'Finder');
});

test('minimize keeps the window so restoring it does not rebuild anything',()=>{
 const open=reduce(initial,{type:'enter',file:'resume'});
 const min=reduce(open,{type:'minimize'});
 assert.deepEqual(min,{...desktop,window:resumeWin,minimized:true});
 assert.deepEqual(reduce(min,{type:'restore'}),open);
});
test('minimize needs a window, and neither action repeats itself',()=>{
 assert.equal(reduce(desktop,{type:'minimize'}),desktop);
 const min=reduce(reduce(initial,{type:'enter',file:'resume'}),{type:'minimize'});
 assert.equal(reduce(min,{type:'minimize'}),min);
 assert.equal(reduce(desktop,{type:'restore'}),desktop);
});
test('opening or closing anything clears the minimized flag',()=>{
 const min=reduce(reduce(initial,{type:'enter',file:'resume'}),{type:'minimize'});
 assert.equal(reduce(min,{type:'open',file:'about'}).minimized,false);
 assert.equal(reduce(min,{type:'closeWindow'}).minimized,false);
});
test('a window opens full screen, and the green light toggles it back and forth',()=>{
 const open=reduce(initial,{type:'enter',file:'resume'});
 assert.equal(open.fullscreen,true);
 const windowed=reduce(open,{type:'fullscreen'});
 assert.equal(windowed.fullscreen,false);
 assert.equal(reduce(windowed,{type:'fullscreen'}).fullscreen,true);
 assert.equal(reduce(desktop,{type:'fullscreen'}),desktop,'needs a window to zoom');
});
test('the chosen mode outlives one window, and a fresh visit starts full screen again',()=>{
 const windowed=reduce(reduce(initial,{type:'enter',file:'resume'}),{type:'fullscreen'});
 assert.equal(reduce(reduce(windowed,{type:'closeWindow'}),{type:'open',file:'about'}).fullscreen,false);
 assert.equal(reduce(reduce(windowed,{type:'exit'}),{type:'enter',file:'about'}).fullscreen,true);
});
test('escape unwinds one layer at a time: full screen, then the window, then the computer',()=>{
 const full=reduce(initial,{type:'enter',file:'resume'});
 assert.equal(full.fullscreen,true);
 const windowed=reduce(full,{type:'escape'});
 assert.deepEqual(windowed,{...desktop,window:resumeWin,fullscreen:false});
 const noWindow=reduce(windowed,{type:'escape'});
 assert.deepEqual(noWindow,{...desktop,fullscreen:false});
 assert.deepEqual(reduce(noWindow,{type:'escape'}),closed);
});
test('escape leaves the computer when the only window is minimized',()=>{
 const min=reduce(reduce(initial,{type:'enter',file:'resume'}),{type:'minimize'});
 assert.deepEqual(reduce(min,{type:'escape'}),closed);
});
test('entering resets the view flags left over from a previous visit',()=>{
 const messy={open:false,window:null,minimized:true,fullscreen:false};
 assert.deepEqual(reduce(messy,{type:'enter'}),desktop);
});
