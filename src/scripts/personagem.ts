import * as THREE from "three";
import { loadBoneco } from "../lib/boneco-runtime.js";

/** A small, decorative walk along the upper edge of the footer. */
export async function initCharacter(host: HTMLElement) {
  const canvas = host.querySelector<HTMLCanvasElement>("canvas")!;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let renderer: THREE.WebGLRenderer | undefined;
  let dispose = () => {};
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera();
    scene.add(new THREE.HemisphereLight(0xfff8f3, 0x817aec, 2.3));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(3, 5, 5);
    scene.add(light);
    // At this small display size the lighter mesh is sufficient on every screen.
    const boneco = await loadBoneco(`${host.dataset.base}/models/boneco/boneco-mobile.glb`);
    const box = new THREE.Box3().setFromObject(boneco.root);
    const height = box.getSize(new THREE.Vector3()).y;
    const center = box.getCenter(new THREE.Vector3());
    boneco.root.position.set(-center.x, -box.min.y, -center.z);
    const actor = new THREE.Group();
    actor.add(boneco.root);
    scene.add(actor);
    actor.rotation.y = Math.PI / 2;
    let width = height * 3;
    let end = width * 0.22;
    let entered = false;
    let arrived = false;
    let visible = false;
    let disposed = false;
    let frame = 0;
    let previous = 0;
    const settle = () => {
      entered = arrived = true;
      actor.position.x = end;
      if (reduce.matches) actor.rotation.y = 0.95;
      boneco.play("idle", { fade: 0.35 });
      boneco.update(0);
    };
    const resize = () => {
      const bounds = host.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      width = height * 1.06 * bounds.width / bounds.height;
      end = width * 0.22;
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height * 1.06;
      camera.bottom = 0;
      camera.near = 0.01;
      camera.far = height * 10;
      camera.position.set(0, 0, height * 4);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      renderer!.setSize(bounds.width, bounds.height, false);
      if (!entered) actor.position.x = -width / 2 - height * 0.22;
      else if (arrived) actor.position.x = end;
    };
    const render = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || disposed) return;
      const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;
      if (!reduce.matches) {
        if (!arrived) {
          actor.position.x = Math.min(end, actor.position.x + boneco.speed * dt);
          if (actor.position.x >= end) settle();
        } else actor.rotation.y = THREE.MathUtils.damp(actor.rotation.y, 0.95, 3, dt);
        boneco.update(dt);
      }
      renderer!.render(scene, camera);
      if (!reduce.matches) frame = requestAnimationFrame(render);
    };
    const wake = () => {
      if (!disposed && visible && !document.hidden && !frame) {
        previous = 0;
        frame = requestAnimationFrame(render);
      }
    };
    const pause = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.6;
      if (!visible) { pause(); return; }
      if (!entered) {
        entered = true;
        if (reduce.matches) settle();
        else boneco.play("walk", { fade: 0 });
      }
      wake();
    }, { threshold: [0, 0.6] });
    const resizing = new ResizeObserver(() => { resize(); wake(); });
    const onVisibility = () => { if (document.hidden) pause(); else wake(); };
    const onMotion = () => { if (reduce.matches) settle(); wake(); };
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", onMotion);
    resize();
    if (reduce.matches) settle();
    observer.observe(host);
    resizing.observe(host);
    dispose = () => {
      if (disposed) return;
      disposed = true;
      pause();
      observer.disconnect();
      resizing.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", onMotion);
      boneco.mixer.stopAllAction();
      boneco.mixer.uncacheRoot(boneco.root);
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          Object.values(material).forEach((value) => { if (value instanceof THREE.Texture) value.dispose(); });
          material.dispose();
        });
        if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose();
      });
      renderer?.dispose();
    };
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      host.classList.remove("is-ready");
      dispose();
    }, { once: true });
    window.addEventListener("pagehide", (event) => { if (!event.persisted) dispose(); }, { once: true });
    host.classList.add("is-ready");
  } catch (error) {
    dispose();
    renderer?.dispose();
    host.classList.remove("is-ready");
    console.warn("O personagem decorativo não está disponível.", error);
  }
}
