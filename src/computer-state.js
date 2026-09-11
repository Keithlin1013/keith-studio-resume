// Pure state for the computer layer. The DOM in computer.js only renders what this returns.
export const files=[
 {id:'resume',name:'Resume',kind:'Resume',app:'preview'},
 {id:'projects',name:'Projects',kind:'Folder',app:'finder'},
 {id:'about',name:'About Me.txt',kind:'Plain text',app:'textedit'}
];
// `minimized` keeps the window in state (and in the DOM) so restoring it does not reload an embedded page.
// `fullscreen` is a view mode for the whole visit, not a property of one window: every visit starts full
// screen, the green light toggles it, the choice survives close/open, and only re-entering resets it.
export const initial=Object.freeze({open:false,window:null,minimized:false,fullscreen:false});
const closed={open:false,window:null,minimized:false,fullscreen:false};

function windowFor(file){
 const f=files.find(x=>x.id===file);
 return f?{app:f.app,file:f.id}:null;
}

export function reduce(state,action){
 switch(action.type){
  case 'enter':return {open:true,window:windowFor(action.file),minimized:false,fullscreen:true};
  case 'open':{const w=windowFor(action.file);return w?{...state,window:w,minimized:false}:state;}
  case 'openProject':return {...state,window:{app:'preview',file:'projects',project:action.id},minimized:false};
  case 'back':return state.window?.project?{...state,window:{app:'finder',file:'projects'},minimized:false}:state;
  case 'minimize':return state.window&&!state.minimized?{...state,minimized:true}:state;
  case 'restore':return state.minimized?{...state,minimized:false}:state;
  case 'fullscreen':return state.window?{...state,fullscreen:!state.fullscreen}:state;
  case 'closeWindow':return {...state,window:null,minimized:false};
  // Escape unwinds one layer at a time; a minimized window is not on screen, so it is not a layer to unwind.
  case 'escape':
   if(state.window&&!state.minimized)return state.fullscreen?{...state,fullscreen:false}:{...state,window:null,minimized:false};
   return closed;
  case 'exit':return closed;
  default:return state;
 }
}

export function appName(window){
 if(!window)return 'Finder';
 return window.app==='preview'?'Preview':window.app==='textedit'?'TextEdit':'Finder';
}
