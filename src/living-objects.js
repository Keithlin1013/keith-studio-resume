import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

export function chairAngle(seconds){return Math.sin(seconds*Math.PI*2/80)*Math.PI*.75;}
export function leafBend(seconds,index){return .5*(Math.sin(seconds*Math.PI*2/(6+index%7*.7)+index*1.71)-Math.sin(index*1.71));}

export async function createLivingObjects(scene,renderer){
 const [gltf,meta]=await Promise.all([
  new GLTFLoader().loadAsync('/hero-living/living-objects.glb'),
  fetch('/hero-living/motion.json').then(r=>{if(!r.ok)throw Error('Motion scene unavailable');return r.json()})
 ]);
 // The background and live screens use Blender camera coordinates. Convert the
 // glTF Y-up scene back to Blender Z-up before applying the very same camera.
 const world=new T.Group();world.matrixAutoUpdate=false;
 world.matrix.set(...meta.cameraInverse.flat());scene.add(world);
 const model=new T.Group();model.rotation.x=Math.PI/2;model.add(gltf.scene);world.add(model);
 const swivel=gltf.scene.getObjectByName('ChairSwivel');
 if(!swivel)throw Error('Chair swivel pivot missing');
 const rest=swivel.quaternion.clone(),rotation=new T.Quaternion(),up=new T.Vector3(0,1,0);
 const leaves=[],styled=new Set();
 gltf.scene.traverse(o=>{
  if(!o.isMesh)return;
  o.castShadow=true;o.receiveShadow=true;
  const materials=Array.isArray(o.material)?o.material:[o.material];
  for(const material of materials){
   if(styled.has(material))continue;
   styled.add(material);material.envMapIntensity=.12;material.side=T.DoubleSide;
   if(material.name.startsWith('C300')){material.color.multiplyScalar(.22);material.envMapIntensity=.06;}
  }
  if(typeof o.userData.leaf_index==='number'){
   const positions=o.geometry.attributes.position;
   const base=positions.array.slice();let maxDistance=0;
   for(let j=0;j<base.length;j+=3)maxDistance=Math.max(maxDistance,Math.hypot(base[j],base[j+1],base[j+2]));
   const weights=new Float32Array(positions.count);
   for(let j=0;j<positions.count;j++)weights[j]=(Math.hypot(base[j*3],base[j*3+1],base[j*3+2])/maxDistance)**2;
   leaves.push({mesh:o,positions,base,weights,index:o.userData.leaf_index});
  }
 });
 const room=new RoomEnvironment();const pmrem=new T.PMREMGenerator(renderer);
 const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
 const fill=new T.HemisphereLight(0xc2dafa,0x111923,.32);fill.position.set(0,0,5);world.add(fill);
 const windowLight=new T.DirectionalLight(0xc8e4ff,.8);windowLight.position.set(3,2.8,3.3);
 windowLight.target.position.set(...meta.chairCenter);windowLight.target.position.z+=.8;
 windowLight.castShadow=true;windowLight.shadow.mapSize.set(1024,1024);
 Object.assign(windowLight.shadow.camera,{left:-1.6,right:1.6,top:1.6,bottom:-1.6,near:.1,far:10});
 windowLight.shadow.bias=-.0002;windowLight.shadow.normalBias=.003;world.add(windowLight,windowLight.target);
 const blue=new T.PointLight(0x009cff,1.2,7,2);blue.position.set(-.2,4.6,1.0);world.add(blue);
 const lamp=new T.PointLight(0xd6eaff,.3,4,2);lamp.position.set(-.1,4.2,1.9);world.add(lamp);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const floor=new T.Mesh(new T.PlaneGeometry(2.7,2.7),new T.ShadowMaterial({opacity:.19,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
 floor.position.set(meta.chairCenter[0],meta.chairCenter[1],meta.floorZ+.003);floor.receiveShadow=true;world.add(floor);
 const chairMaterials=[...styled].filter(material=>material.name.startsWith('C300'));
 let time=0,angle=0,settled=false,chairAlpha=1;
 function update(dt,reduced,light){
  if(!reduced)time+=dt;
  const t=reduced?0:time;const target=settled?0:chairAngle(t);angle+=(target-angle)*(reduced?1:1-Math.exp(-dt*4));
  chairAlpha+=((settled?0:1)-chairAlpha)*(reduced?1:1-Math.exp(-dt*7));
  swivel.visible=chairAlpha>.005;
  for(const material of chairMaterials){
   const transparent=chairAlpha<.995;
   if(material.transparent!==transparent){material.transparent=transparent;material.needsUpdate=true;}
   material.opacity=chairAlpha;material.depthWrite=!transparent;
  }
  floor.material.opacity=.19*chairAlpha;
  swivel.quaternion.copy(rest).multiply(rotation.setFromAxisAngle(up,angle));
  for(const leaf of leaves){
   const bend=leafBend(t,leaf.index),a=leaf.positions.array;
   for(let j=0;j<leaf.positions.count;j++){
    a[j*3]=leaf.base[j*3]+.012*leaf.weights[j]*bend;
    a[j*3+2]=leaf.base[j*3+2]-.007*leaf.weights[j]*bend;
   }
   leaf.positions.needsUpdate=true;
  }
  lamp.intensity=light*.3;
 }
 return {update,settle(value){settled=value},debug:()=>({seconds:time,chairDegrees:angle*180/Math.PI,leafCount:leaves.length,range:270,baseFixed:true}),dispose(){world.removeFromParent();environment.dispose();gltf.scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});floor.geometry.dispose();floor.material.dispose();}};
}
