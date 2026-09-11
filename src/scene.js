import * as T from 'three';
import {createLivingObjects} from './living-objects.js';
export async function createStudio(host,onFrame,{folder='hero-living',live=true}={}){
 const data=await fetch('/'+folder+'/scene.json').then(r=>{if(!r.ok)throw Error('Scene unavailable');return r.json()});
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;host.prepend(renderer.domElement);renderer.domElement.id=folder+'-canvas';renderer.domElement.className='studio-canvas';
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(2*Math.atan(data.ty)*180/Math.PI,data.width/data.height,.01,50);camera.zoom=live?1.025:1;camera.updateProjectionMatrix();camera.updateMatrixWorld();
 const loader=new T.TextureLoader();const [on,off]=await Promise.all(['lamp-on','lamp-off'].map(n=>loader.loadAsync('/'+folder+'/'+n+'.webp')));for(const t of [on,off]){t.colorSpace=T.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();}
 const {nx,ny,values}=data.depth,p=[],uv=[],idx=[];
 for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){const z=values[y*(nx+1)+x];p.push((2*x/nx-1)*data.tx*z,(1-2*y/ny)*data.ty*z,-z);uv.push(x/nx,1-y/ny);if(x<nx&&y<ny){const a=y*(nx+1)+x,b=a+1,c=a+nx+1,d=c+1;idx.push(a,c,b,b,c,d)}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);
 const glowMask=await loader.loadAsync('/'+(live?'hero-entrance':folder)+'/interaction-masks.png');glowMask.colorSpace=T.SRGBColorSpace;glowMask.anisotropy=renderer.capabilities.getMaxAnisotropy();
 const glowTarget={education:0,music:0};
 const uniforms={mapOn:{value:on},mapOff:{value:off},light:{value:1},glowMask:{value:glowMask},glow:{value:new T.Vector2()},texel:{value:new T.Vector2(1/data.width,1/data.height)}};
 const material=new T.ShaderMaterial({uniforms,side:T.DoubleSide,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
  uniform sampler2D mapOn,mapOff,glowMask;
  uniform float light;
  uniform vec2 glow,texel;
  varying vec2 vUv;
  void main(){
   vec3 base=mix(texture2D(mapOff,vUv),texture2D(mapOn,vUv),light).rgb;
   if(max(glow.x,glow.y)>.001){
    // R = SBU, G = Marshall. Both were rendered through the approved Blender camera.
    vec2 mask=texture2D(glowMask,vUv).rg;
    vec2 halo=mask*.2;
    for(int i=0;i<8;i++){
     float angle=float(i)*.785398163;
     vec2 offset=vec2(cos(angle),sin(angle))*texel;
     halo+=texture2D(glowMask,vUv+offset*4.).rg*.06;
     halo+=texture2D(glowMask,vUv+offset*9.).rg*.04;
    }
    vec3 white=vec3(.57,.56,.53),warm=vec3(1.0,.78,.48);
    base=mix(base,white+base*.2,mask.r*glow.x*.82);
    base=mix(base,warm,mask.g*glow.y);
    base+=white*halo.r*glow.x*.08+warm*halo.g*glow.y*.65;
   }
   gl_FragColor=vec4(base,1.);
   #include <colorspace_fragment>
  }`});scene.add(new T.Mesh(g,material));
 const canvases={},textures={},meshes={};
 for(const [id,m] of Object.entries(data.screens)){
  const c=document.createElement('canvas');c.width=id==='desktop'?4096:768;c.height=id==='desktop'?1720:1660;canvases[id]=c;
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=renderer.capabilities.getMaxAnisotropy();textures[id]=tex;
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(m.positions.map(v=>v*.9994),3));geo.setAttribute('uv',new T.Float32BufferAttribute(m.uv,2));
  const mesh=new T.Mesh(geo,new T.MeshBasicMaterial({map:tex,side:T.DoubleSide,transparent:true}));mesh.visible=id==='desktop';scene.add(mesh);meshes[id]=mesh;
 }
 const living=live?await createLivingObjects(scene,renderer):{update(){},debug(){return {}},dispose(){}};
 let width=1,height=1,targetX=0,targetY=0,lightTarget=1,phoneTarget=0,phoneAlpha=0,last=0,raf,active=true;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function project(v){const p=new T.Vector3(...v).project(camera);return [(p.x+1)*width/2,(1-p.y)*height/2]}
 function resize(w,h){width=w;height=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 function pointer(x,y,type="mouse"){if(type==="touch"||reduced.matches)return;targetX=-Math.max(-1,Math.min(1,x))*(live?.045:.012);targetY=-Math.max(-1,Math.min(1,y))*(live?.022:.006);}
 function reset(){targetX=targetY=0;}
 reduced.addEventListener("change",reset);
 function render(ms){raf=requestAnimationFrame(render);if(document.hidden||!active)return;const dt=Math.min(.05,(ms-last)/1000||.016);last=ms;const ease=1-Math.exp(-dt*5);camera.position.x+=(targetX-camera.position.x)*ease;camera.position.y+=(targetY-camera.position.y)*ease;camera.lookAt(camera.position.x,camera.position.y,-5.4);camera.updateMatrixWorld();uniforms.light.value+=(lightTarget-uniforms.light.value)*Math.min(1,dt*9);phoneAlpha+=(phoneTarget-phoneAlpha)*Math.min(1,dt*8);meshes.phone.visible=phoneAlpha>.002;meshes.phone.material.opacity=phoneAlpha;const fade=reduced.matches?1:1-Math.exp(-dt*8);uniforms.glow.value.x+=(glowTarget.education-uniforms.glow.value.x)*fade;uniforms.glow.value.y+=(glowTarget.music-uniforms.glow.value.y)*fade;living.update(dt,reduced.matches,uniforms.light.value);renderer.render(scene,camera);onFrame?.(project,data);}
 raf=requestAnimationFrame(render);
 return {setActive:value=>active=value,settle:value=>living.settle?.(value),data,canvases,project,resize,pointer,reset,refresh:id=>textures[id].needsUpdate=true,setLamp:on=>lightTarget=on?1:0,setPhone:on=>phoneTarget=on?1:0,setGlow:values=>Object.assign(glowTarget,values),debug:()=>({camera:[camera.position.x,camera.position.y],phoneAlpha,light:uniforms.light.value,glow:{education:uniforms.glow.value.x,music:uniforms.glow.value.y},glowTarget:{...glowTarget},living:living.debug()}),dispose(){cancelAnimationFrame(raf);living.dispose();glowMask.dispose();renderer.dispose();}};
}
