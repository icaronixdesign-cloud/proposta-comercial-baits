import * as THREE from "three";
import { loadBoneco } from "../lib/boneco-runtime.js";

/** An editorial companion to the portfolio: walks in once, then watches the projects. */
export async function initCharacter(host: HTMLElement) {
  const canvas = host.querySelector<HTMLCanvasElement>("[data-canvas]")!;
  const gallery = host.closest("#autor")!.querySelector<HTMLElement>(".obras")!;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let renderer: THREE.WebGLRenderer | undefined;
  let cleanup = () => {};
  const showFallback = () => {
    host.classList.remove("is-ready");
    canvas.hidden = true;
  };

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
    scene.add(new THREE.HemisphereLight(0xfff8f3, 0x817aec, 2.3));
    const key = new THREE.DirectionalLight(0xffffff, 3);
    key.position.set(3, 5, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xfca8db, 1.2);
    fill.position.set(-3, 2, -2);
    scene.add(fill);

    const mobile = window.matchMedia("(max-width: 900px)").matches;
    const boneco = await loadBoneco(`${host.dataset.base}/models/boneco/${mobile ? "boneco-mobile" : "boneco"}.glb`);
    const box = new THREE.Box3().setFromObject(boneco.root);
    const height = box.getSize(new THREE.Vector3()).y;
    const center = box.getCenter(new THREE.Vector3());
    boneco.root.position.set(-center.x, -box.min.y, -center.z);
    const actor = new THREE.Group();
    actor.add(boneco.root);
    scene.add(actor);
    const head = boneco.root.getObjectByName("head");
    const animatedHead = head?.quaternion.clone();
    const headOffset = new THREE.Quaternion();
    const headEuler = new THREE.Euler(0, 0, 0, "YXZ");
    const idleAngle = 0.72;
    const startX = -height * 0.65;
    let entered = false;
    let arrived = false;
    let visible = false;
    let disposed = false;
    let frame = 0;
    let previous = 0;
    let turn = Math.PI / 2;
    let yaw = 0.3;
    const restPitch = mobile ? 0.02 : 0.14;
    let pitch = restPitch;
    let targetYaw = yaw;
    let targetPitch = pitch;
    actor.position.x = startX;
    actor.rotation.y = turn;

    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 64;
    const ctx = shadowCanvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(82,23,23,0.18)");
    gradient.addColorStop(1, "rgba(82,23,23,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(height * 0.7, height * 0.7),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.004;
    scene.add(shadow);

    const settle = () => {
      entered = arrived = true;
      actor.position.x = 0;
      actor.rotation.y = turn = idleAngle;
      boneco.play("idle", { fade: 0 });
      boneco.update(0);
      if (head && animatedHead) animatedHead.copy(head.quaternion);
    };
    const resize = () => {
      const { width, height: viewportHeight } = host.getBoundingClientRect();
      if (!width || !viewportHeight) return;
      camera.aspect = width / viewportHeight;
      camera.updateProjectionMatrix();
      renderer!.setSize(width, viewportHeight, false);
      // Fit the whole silhouette even beside the mobile carousel; keep its feet grounded.
      const distance = height * Math.max(2.35, 0.9 / camera.aspect);
      camera.position.set(0, height * 0.55, distance);
      camera.lookAt(0, height * 0.51, 0);
    };
    const render = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || disposed) return;
      const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;
      // Restore the animated pose before adding the small editorial gaze offset.
      if (head && animatedHead) head.quaternion.copy(animatedHead);
      if (!reduce.matches) {
        if (!arrived) {
          actor.position.x = Math.min(0, actor.position.x + boneco.speed * dt);
          if (actor.position.x >= 0) { arrived = true; boneco.play("idle", { fade: 0.35 }); }
        }
        boneco.update(dt);
        turn = THREE.MathUtils.damp(turn, arrived ? idleAngle : Math.PI / 2, 4, dt);
        yaw = THREE.MathUtils.damp(yaw, arrived ? targetYaw : 0, 5, dt);
        pitch = THREE.MathUtils.damp(pitch, arrived ? targetPitch : 0, 5, dt);
      }
      actor.rotation.y = turn;
      if (head && animatedHead) {
        animatedHead.copy(head.quaternion);
        headOffset.setFromEuler(headEuler.set(pitch, yaw, 0));
        head.quaternion.multiply(headOffset);
      }
      shadow.position.x = actor.position.x;
      renderer!.render(scene, camera);
      if (!reduce.matches) frame = requestAnimationFrame(render);
    };
    const wake = () => {
      if (visible && !document.hidden && !disposed && !frame) {
        previous = 0;
        frame = requestAnimationFrame(render);
      }
    };
    const pause = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; };
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.12;
      if (!visible) { pause(); return; }
      if (!entered) {
        entered = true;
        if (reduce.matches) settle();
        else boneco.play("walk", { fade: 0 });
      }
      wake();
    }, { threshold: [0, 0.12] });
    const resizeObserver = new ResizeObserver(() => { resize(); wake(); });
    const onVisibility = () => { if (document.hidden) pause(); else wake(); };
    const onMotion = () => {
      if (head && animatedHead) head.quaternion.copy(animatedHead);
      if (reduce.matches) settle();
      wake();
    };
    // The portfolio remains the interaction: pointer and keyboard focus gently guide the gaze.
    const lookAtProject = (element: Element, x?: number, y?: number) => {
      if (reduce.matches) return;
      const bounds = gallery.getBoundingClientRect();
      const item = element.closest(".obras__item")?.getBoundingClientRect();
      if (!item) return;
      const px = x ?? item.left + item.width / 2;
      const py = y ?? item.top + item.height / 2;
      targetYaw = 0.18 + THREE.MathUtils.clamp((px - bounds.left) / bounds.width, 0, 1) * 0.25;
      targetPitch = restPitch + THREE.MathUtils.clamp((py - bounds.top) / bounds.height - 0.5, -0.5, 0.5) * 0.18;
    };
    const onPointer = (event: PointerEvent) => { if (event.target instanceof Element) lookAtProject(event.target, event.clientX, event.clientY); };
    const onFocus = (event: FocusEvent) => { if (event.target instanceof Element) lookAtProject(event.target); };
    const resetGaze = () => { targetYaw = 0.3; targetPitch = restPitch; };
    const onBlur = (event: FocusEvent) => { if (!(event.relatedTarget instanceof Node) || !gallery.contains(event.relatedTarget)) resetGaze(); };
    gallery.addEventListener("pointermove", onPointer, { passive: true });
    gallery.addEventListener("pointerleave", resetGaze);
    gallery.addEventListener("focusin", onFocus);
    gallery.addEventListener("focusout", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", onMotion);
    resizeObserver.observe(host);
    visibility.observe(host);

    cleanup = () => {
      if (disposed) return;
      disposed = true;
      pause();
      visibility.disconnect();
      resizeObserver.disconnect();
      gallery.removeEventListener("pointermove", onPointer);
      gallery.removeEventListener("pointerleave", resetGaze);
      gallery.removeEventListener("focusin", onFocus);
      gallery.removeEventListener("focusout", onBlur);
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
      cleanup();
      showFallback();
    }, { once: true });
    window.addEventListener("pagehide", (event) => { if (!event.persisted) cleanup(); }, { once: true });
    if (reduce.matches) settle();
    canvas.hidden = false;
    host.classList.add("is-ready");
    resize();
  } catch (error) {
    cleanup();
    renderer?.dispose();
    showFallback();
    console.warn("O retrato será mantido no lugar do personagem 3D.", error);
  }
}
