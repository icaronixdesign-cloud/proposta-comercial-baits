// Runtime for the boneco GLB (three.js >= r160). Handles clip playback with smooth crossfades:
// loops (idle / walk / run) keep playing; one-shots (jump / thumbs_up) play once and blend back
// to the loop that was playing before.
//
//   import { loadBoneco } from './boneco-runtime.js';
//   const boneco = await loadBoneco('/media/boneco/boneco.glb');   // or boneco-mobile.glb
//   scene.add(boneco.root);
//   boneco.play('walk');                       // idle | walk | run | jump | thumbs_up
//   // every frame: boneco.update(dt)
//   // walk/run are in place: move boneco.root forward at boneco.speed (m/s) so the feet don't slide.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export const CLIPS = {
  idle: { loop: true, speed: 0 },
  walk: { loop: true, speed: 0.298 },     // stride 0.268 m per 0.9 s cycle
  run: { loop: true, speed: 0.746 },      // stride 0.447 m per 0.6 s cycle
  jump: { loop: false, events: { takeoff: 0.46, land: 1.04 } },
  thumbs_up: { loop: false },
};

export class Boneco {
  constructor(gltf) {
    this.root = gltf.scene;
    this.mixer = new THREE.AnimationMixer(this.root);
    this.actions = {};
    for (const clip of gltf.animations) {
      const a = this.mixer.clipAction(clip);
      const info = CLIPS[clip.name] || { loop: true };
      if (!info.loop) {
        a.setLoop(THREE.LoopOnce, 1);
        a.clampWhenFinished = true;
      }
      this.actions[clip.name] = a;
    }
    this.root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.frustumCulled = false;           // skinned: the bind-pose bounds don't follow the jump
      }
    });
    this.current = null;
    this.base = 'idle';
    this.mixer.addEventListener('finished', (e) => {
      const name = Object.keys(this.actions).find((k) => this.actions[k] === e.action);
      if (name && !CLIPS[name]?.loop && this.current === name) this.play(this.base, { fade: 0.35 });
    });
    this.play('idle', { fade: 0 });
  }

  /** Crossfade to a clip. Loops become the new base; one-shots return to the base when done. */
  play(name, { fade = 0.3 } = {}) {
    const next = this.actions[name];
    if (!next) throw new Error(`unknown clip ${name}`);
    const info = CLIPS[name] || { loop: true };
    if (info.loop) this.base = name;
    const prev = this.current ? this.actions[this.current] : null;
    if (prev === next && info.loop) return;
    next.reset();
    next.enabled = true;
    next.setEffectiveTimeScale(1);
    next.setEffectiveWeight(1);
    next.play();
    if (prev && fade > 0) prev.crossFadeTo(next, fade, false);
    else if (prev) prev.stop();
    this.current = name;
  }

  /** m/s to move the character for the current loop (0 when idle). */
  get speed() {
    return CLIPS[this.current]?.speed || 0;
  }

  update(dt) {
    this.mixer.update(dt);
  }
}

export async function loadBoneco(url, loader = new GLTFLoader()) {
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
  return new Boneco(gltf);
}
