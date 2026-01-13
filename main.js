import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { ARButton } from 'https://unpkg.com/three@0.160.0/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer, controller;
let reticle, model, hitTestSource=null, hitTestRequested=false, placed=false;

init(); animate();

function init(){
scene=new THREE.Scene();
camera=new THREE.PerspectiveCamera();

renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.xr.enabled=true;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff,0x444444,1.3));

reticle=new THREE.Mesh(
 new THREE.RingGeometry(0.08,0.12,32).rotateX(-Math.PI/2),
 new THREE.MeshBasicMaterial({color:0x00ff00})
);
reticle.matrixAutoUpdate=false;
reticle.visible=false;
scene.add(reticle);

new GLTFLoader().load("spongebob.glb",g=>{
 model=g.scene;
 model.visible=false;
 model.scale.set(0.6,0.6,0.6);
 scene.add(model);
});

document.body.appendChild(ARButton.createButton(renderer,{requiredFeatures:["hit-test"]}));

controller=renderer.xr.getController(0);
controller.addEventListener("select",()=>{
 if(reticle.visible&&model){
  model.visible=true;
  model.position.setFromMatrixPosition(reticle.matrix);
  model.quaternion.setFromRotationMatrix(reticle.matrix);
  reticle.visible=false;
  placed=true;
 }
});
scene.add(controller);
}

function animate(){renderer.setAnimationLoop(render);}

function render(_,frame){
if(frame){
 const ref=renderer.xr.getReferenceSpace();
 const ses=renderer.xr.getSession();

 if(!hitTestRequested){
  ses.requestReferenceSpace("viewer").then(sp=>{
   ses.requestHitTestSource({space:sp}).then(src=>hitTestSource=src);
  });
  hitTestRequested=true;
 }

 if(hitTestSource&&!placed){
  const hits=frame.getHitTestResults(hitTestSource);
  if(hits.length){
   const pose=hits[0].getPose(ref);
   reticle.visible=true;
   reticle.matrix.fromArray(pose.transform.matrix);
  }
 }
}
renderer.render(scene,camera);
}
