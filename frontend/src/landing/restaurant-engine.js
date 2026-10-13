import * as THREE from 'three';

// Original, procedural architectural model. No downloaded meshes or textures.
export function createRestaurant(canvas, { hero = false, onFailure = () => {} } = {}) {
  const context = canvas.getContext('webgl2', { antialias: true, alpha: true, powerPreference: 'low-power' });
  if (!context) throw new Error('WebGL2 unavailable; use the vector floor plan.');
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
  const world = new THREE.Group(); scene.add(world);
  const geometries = new Set(), materials = new Set();
  const geometry = shape => { geometries.add(shape); return shape; };
  const box = geometry(new THREE.BoxGeometry(1, 1, 1));
  const cylinder = geometry(new THREE.CylinderGeometry(1, 1, 1, 20));
  const sphere = geometry(new THREE.IcosahedronGeometry(1, 1));
  const mat = (color, options = {}) => { const material = new THREE.MeshStandardMaterial({ color, roughness: .7, ...options }); materials.add(material); return material; };
  const palette = {
    base: mat('#18181b'), floor: mat('#887257'), wood: mat('#574336'), walnut: mat('#352923'),
    brass: mat('#c9a227', { metalness: .7, roughness: .28 }), stone: mat('#d5caba'),
    wall: mat('#3b3935'), chair: mat('#3d4e45'), steel: mat('#8e9393', { metalness: .75, roughness: .32 }),
    black: mat('#18181b'), leaves: mat('#3f5c42'), ivory: mat('#faf9f6'),
    gold: mat('#c9a227', { emissive: '#c9a227', emissiveIntensity: .5 }),
    emerald: mat('#10b981', { emissive: '#10b981', emissiveIntensity: .4 }),
    amber: mat('#d09a45', { emissive: '#b7791f', emissiveIntensity: .2 }),
    screen: mat('#1a2924', { emissive: '#37654d', emissiveIntensity: .3 }),
  };
  function mesh(shape, material, size, position, parent = world, shadow = true) {
    const item = new THREE.Mesh(shape, material);
    item.scale.set(...size); item.position.set(...position); item.castShadow = shadow; item.receiveShadow = true; parent.add(item); return item;
  }
  const block = (material, size, position, parent) => mesh(box, material, size, position, parent);
  const round = (material, size, position, parent) => mesh(cylinder, material, size, position, parent);
  block(palette.base, [11.2,.38,8.4], [0,-.25,0]);
  block(palette.brass, [11.25,.035,8.45], [0,-.05,0]);
  block(palette.floor, [10.9,.08,8.1], [0,.02,0]);
  // Repeated floor inlays share one geometry/material and a single draw call.
  const inlays = new THREE.InstancedMesh(box, palette.walnut, 25); const transform = new THREE.Object3D();
  for (let i=0;i<25;i++) { transform.position.set(-5.2+i*.43,.065,0); transform.scale.set(.012,.006,8); transform.updateMatrix(); inlays.setMatrixAt(i,transform.matrix); }
  world.add(inlays);
  block(palette.wall,[11,1.7,.16],[0,.85,-4]);
  block(palette.wall,[.16,1.25,8],[-5.4,.625,0]);
  block(palette.brass,[11,.025,.03],[0,1.7,-3.9]);
  // Vertical walnut panelling on the back wall.
  const slats = new THREE.InstancedMesh(box,palette.walnut,36);
  for(let i=0;i<36;i++){transform.position.set(-5.15+i*.294,.9,-3.88);transform.scale.set(.07,1.6,.045);transform.updateMatrix();slats.setMatrixAt(i,transform.matrix);} world.add(slats);
  const guest=new THREE.Group();world.add(guest);
  round(palette.black,[.105,.5,.105],[0,.42,0],guest);
  mesh(sphere,palette.stone,[.115,.13,.115],[0,.79,0],guest);
  guest.position.set(-1,0,3.4);
  const waiter=new THREE.Group();world.add(waiter);
  round(palette.ivory,[.1,.5,.1],[0,.42,0],waiter);
  mesh(sphere,palette.stone,[.11,.13,.11],[0,.79,0],waiter);
  block(palette.black,[.18,.035,.24],[.15,.55,.1],waiter);
  waiter.position.set(3.5,0,2.05);
  const areas = {};
  for (const name of ['arrival','floor','order','kitchen','takeaway','billing','inventory','analytics','connected']) { areas[name]=new THREE.Group();world.add(areas[name]); }
  // A reception desk, with fluted frontage and a stone cap.
  block(palette.walnut,[1.2,.9,1.65],[-4.35,.5,2.3],areas.arrival);
  block(palette.stone,[1.32,.12,1.77],[-4.35,1,2.3],areas.arrival);
  block(palette.brass,[1.2,.08,1.65],[-4.35,.12,2.3],areas.arrival);
  block(palette.black,[.35,.28,.06],[-4.35,1.19,2.25],areas.arrival);
  const entrance = block(palette.gold,[2.3,.025,.17],[-1,.1,3.75],areas.arrival);
  // Eight dining settings with plates, chairs and brass pedestal bases.
  const tableIndicators=[];
  for(let i=0;i<8;i++) {
    const x=-2.25+(i%4)*1.7, z=-.25+Math.floor(i/4)*2.3;
    round(palette.brass,[.3,.055,.3],[x,.12,z],areas.floor);
    round(palette.black,[.07,.67,.07],[x,.46,z],areas.floor);
    round(palette.stone,[.59,.09,.59],[x,.84,z],areas.floor);
    for(const side of [-1,1]) {
      block(palette.chair,[.5,.1,.42],[x,.48,z+side*.87],areas.floor);
      block(palette.chair,[.5,.52,.08],[x,.73,z+side*1.05],areas.floor);
      for(const leg of [-1,1])block(palette.brass,[.035,.42,.035],[x+leg*.19,.24,z+side*.85],areas.floor);
      round(palette.ivory,[.14,.02,.14],[x,.895,z+side*.29],areas.floor);
    }
    const light=round(i===2?palette.amber:palette.emerald,[.09,.02,.09],[x,.91,z],areas.floor);
    tableIndicators.push(light);
  }
  // Kitchen pass, two stations, ovens, cooking rings and production display.
  block(palette.steel,[4.2,.87,.9],[.3,.49,-2.8],areas.kitchen);
  block(palette.stone,[4.3,.12,1],[.3,.98,-2.8],areas.kitchen);
  for(let i=0;i<4;i++)round(palette.black,[.18,.025,.18],[-1.15+i*.6,1.06,-2.8],areas.kitchen);
  block(palette.black,[1.2,.62,.045],[.2,1.52,-3.6],areas.kitchen);
  block(palette.screen,[1.08,.48,.02],[.2,1.52,-3.56],areas.kitchen);
  block(palette.steel,[.7,.85,.8],[2.6,.47,-2.8],areas.kitchen);
  for(let i=0;i<3;i++)round(palette.ivory,[.09,.24,.09],[2.4+i*.2,1.02,-2.8],areas.kitchen);
  // Pickup shelf and a package that moves to the counter as scroll advances.
  block(palette.walnut,[1.35,.9,1.05],[4.2,.5,-2.5],areas.takeaway);
  block(palette.stone,[1.45,.1,1.15],[4.2,1,-2.5],areas.takeaway);
  const parcel=block(palette.stone,[.45,.4,.38],[4.2,1.25,-2.5],areas.takeaway);
  block(palette.brass,[.1,.42,.39],[0,0,0],parcel);
  // Billing counter and POS terminal.
  block(palette.walnut,[1,.9,1.5],[4.55,.5,.4],areas.billing);
  block(palette.stone,[1.1,.1,1.6],[4.55,1,.4],areas.billing);
  block(palette.black,[.45,.35,.1],[4.5,1.25,.4],areas.billing);
  block(palette.screen,[.38,.27,.02],[4.5,1.25,.46],areas.billing);
  // Pantry racks, ingredient containers and purchase stock.
  for(let y=.35;y<1.6;y+=.5){block(palette.walnut,[1.55,.06,.7],[-4.4,y,-2.6],areas.inventory);for(let i=0;i<4;i++)round(i%2?palette.stone:palette.ivory,[.12,.25,.12],[-4.95+i*.35,y+.16,-2.6],areas.inventory);}
  for(const x of [-5.12,-3.65])block(palette.brass,[.045,1.8,.045],[x,.9,-2.6],areas.inventory);
  // Architectural pendants, warm light, planters at the entrance.
  for(const x of [-2.3,1.1]) {
    round(palette.brass,[.25,.08,.25],[x,2.65,.55]);
    round(palette.ivory,[.17,.035,.17],[x,2.60,.55]);
    round(palette.black,[.015,.6,.015],[x,2.98,.55]);
  }
  for(const [x,z] of [[-4.4,-.25],[4.5,3.2]]){
    round(palette.stone,[.28,.45,.28],[x,.27,z]);
    for(let i=0;i<5;i++){const angle=i*1.25;mesh(sphere,palette.leaves,[.25,.55,.23],[x+Math.cos(angle)*.15,.94,z+Math.sin(angle)*.15]);}
  }
  const ambient=new THREE.HemisphereLight('#faf0df','#36312b',2.3);scene.add(ambient);
  const key=new THREE.DirectionalLight('#ffe2b5',4.5);key.position.set(-3,10,5);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-9;key.shadow.camera.right=9;key.shadow.camera.top=8;key.shadow.camera.bottom=-8;key.shadow.normalBias=.04;scene.add(key);
  const fill=new THREE.DirectionalLight('#ffffff',1.4);fill.position.set(5,4,-3);scene.add(fill);
  const ground=mesh(geometry(new THREE.PlaneGeometry(100,100)),new THREE.ShadowMaterial({opacity:.28}),[1,1,1],[0,-.46,0],scene,false);materials.add(ground.material);ground.rotation.x=-Math.PI/2;
  // Gold signal is scrubbed from Table 08 towards production, never autoplayed.
  const path=new THREE.CatmullRomCurve3([new THREE.Vector3(2.85,1.15,2.05),new THREE.Vector3(2.85,1.7,.4),new THREE.Vector3(1.5,1.65,-1.5),new THREE.Vector3(.2,1.5,-2.7)]);
  const connection=new THREE.Mesh(geometry(new THREE.TubeGeometry(path,32,.025,6,false)),palette.gold);materials.add(connection.material);world.add(connection);
  const signal=mesh(sphere,palette.gold,[.1,.1,.1],[0,0,0]);
  const analytics=new THREE.Group();world.add(analytics);
  const bars=[.8,1.4,1.1,1.9,1.6,2.3];
  bars.forEach((h,i)=>{block(i===5?palette.emerald:palette.brass,[.45,h,.45],[-1.8+i*.75,h/2+.1,0],analytics);});
  // One discreet floor outline identifies the area currently being discussed.
  const outline=new THREE.Group(); world.add(outline);
  for(const side of [-1,1]){block(palette.gold,[1,.018,.006],[0,.1,side*.5],outline);block(palette.gold,[.006,.018,1],[side*.5,.1,0],outline);}
  const footprints=[[-4.35,2.3,1.5,1.95],[.3,.8,7.2,4.9],[2.85,2.05,1.5,1.95],[.6,-2.8,5.3,1.5],[2.6,-2.8,1.3,1.3],[4.2,-2.5,1.65,1.45],[4.55,.4,1.4,1.9],[-4.4,-2.6,1.8,1.1],[0,0,8,5],[0,0,10.7,7.8]];
  // Consolidate repeated furniture per room into instanced draw calls.
  const moving=new Set([entrance,parcel,signal,...tableIndicators]);
  for(const parent of [world,...Object.values(areas)]){
    const batches=new Map();
    for(const child of [...parent.children]){
      if(!child.isMesh||child.isInstancedMesh||child.children.length||moving.has(child))continue;
      const key=child.geometry.uuid+child.material.uuid;
      if(!batches.has(key))batches.set(key,[]);batches.get(key).push(child);
    }
    for(const items of batches.values()){
      if(items.length<2)continue;
      const batch=new THREE.InstancedMesh(items[0].geometry,items[0].material,items.length);
      items.forEach((item,index)=>{item.updateMatrix();batch.setMatrixAt(index,item.matrix);parent.remove(item);});
      batch.castShadow=true;batch.receiveShadow=true;parent.add(batch);
    }
  }
  const targets=[[-1,0,1.4],[0,0,.5],[1,.3,1],[.5,.4,-1.7],[2.6,.4,-2.4],[3.6,.3,-1.4],[3.6,.3,.6],[-3.6,.4,-2],[0,.3,0],[0,0,0]];
  const positions=[[10,10,13],[.5,16,7],[9,9,12],[8,8,11],[8,7,10],[10,8,10],[11,8,11],[6,10,12],[11,12,15],[11,11,16]];
  let desired=0,current=0,visible=true,dead=false,frame=0,first=true,qualitySamples=0,slowFrames=0;
  const look=new THREE.Vector3(),cam=new THREE.Vector3(),nextLook=new THREE.Vector3(),nextCam=new THREE.Vector3();
  function draw(){
    frame=0;if(dead||!visible||document.hidden)return;
    const start=performance.now();current=first?desired:THREE.MathUtils.lerp(current,desired,.16);first=false;
    const i=Math.min(9,Math.floor(current)),fraction=Math.min(1,current-i),next=Math.min(9,i+1),blend=THREE.MathUtils.smoothstep(fraction,.4,1);
    cam.fromArray(positions[i]).lerp(nextCam.fromArray(positions[next]),blend);
    look.fromArray(targets[i]).lerp(nextLook.fromArray(targets[next]),blend);
    if(hero){cam.set(12-current*.65,10-current*.2,15-current*.45);look.set(0,0,0);world.rotation.y=-.15+current*.025;}else world.rotation.y=0;
    if(!hero)cam.sub(look).multiplyScalar(1.22).add(look);
    camera.position.copy(cam);camera.lookAt(look);
    guest.visible=hero||i<2;guest.position.set(-1+Math.min(current,1)*3.2,0,3.4-Math.min(current,1)*1.4);
    waiter.visible=hero||i===2||i===3;
    entrance.material.emissiveIntensity=i===0?.8:.15;
    tableIndicators[7].material=current>=1?palette.gold:palette.emerald;
    connection.visible=!hero&&i===2;signal.visible=connection.visible;if(signal.visible)signal.position.copy(path.getPoint(Math.min(1,fraction*1.5)));
    parcel.position.x=4.2-(i===5?(1-fraction)*1.4:0);
    const [ox,oz,ow,od]=footprints[i];outline.position.set(ox,0,oz);outline.scale.set(ow,1,od);outline.visible=!hero;
    analytics.visible=!hero&&i>=8;analytics.scale.y=i>=8?.1+Math.min(1,(current-8)*1.8):.1;
    areas.floor.visible=hero||i<8;
    renderer.render(scene,camera);
    qualitySamples++;if(performance.now()-start>28)slowFrames++;
    if(qualitySamples===20&&slowFrames>8){renderer.setPixelRatio(1);renderer.shadowMap.enabled=false;resize();}
    if(Math.abs(desired-current)>.002)frame=requestAnimationFrame(draw);
  }
  function invalidate(){if(!frame&&!dead&&visible&&!document.hidden)frame=requestAnimationFrame(draw);}
  function resize(){const {width,height}=canvas.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();invalidate();}
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else invalidate();};document.addEventListener('visibilitychange',visibility);
  const contextLost=event=>{event.preventDefault();onFailure();};canvas.addEventListener('webglcontextlost',contextLost);
  resize();
  return {
    seek(value){desired=Math.max(0,Math.min(9,value));invalidate();},
    setVisible(value){visible=value;if(value)invalidate();else{cancelAnimationFrame(frame);frame=0;}},
    dispose(){dead=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',contextLost);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());world.traverse(object=>{if(object.isInstancedMesh)object.dispose();});renderer.dispose();},
  };
}
