import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { loadBoneco } from "../lib/boneco-runtime.js";

export async function initCharacter(host: HTMLElement) {
  const canvas = host.querySelector<HTMLCanvasElement>("[data-canvas]")!;
  const stage = host.querySelector<HTMLElement>("[data-stage]")!;
  const status = host.querySelector<HTMLElement>("[data-status]")!;
  const fallback = host.querySelector<HTMLImageElement>("[data-fallback]")!;
  const buttons = Array.from(host.querySelectorAll<HTMLButtonElement>("[data-action]"));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let renderer: THREE.WebGLRenderer | undefined;
  let cleanup = () => {};
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableDamping = false;
    controls.enableZoom = true;
    // Keep wheel scrolling with the page while preserving OrbitControls' pinch zoom.
    canvas.addEventListener("wheel", (event) => event.stopImmediatePropagation(), { capture: true, passive: true });
    controls.minPolarAngle = Math.PI * 0.25;
    controls.maxPolarAngle = Math.PI * 0.58;
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    scene.add(new THREE.HemisphereLight(0xfff5ee, 0x817aec, 2.5));
    const key = new THREE.DirectionalLight(0xffffff, 3.5);
    key.position.set(3, 5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xfca8db, 1.5);
    fill.position.set(-3, 2, -3);
    scene.add(fill);

    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const boneco = await loadBoneco(`${host.dataset.base}/models/boneco/${mobile ? "boneco-mobile" : "boneco"}.glb`);
    const box = new THREE.Box3().setFromObject(boneco.root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    boneco.root.position.set(-center.x, -box.min.y, -center.z);
    scene.add(boneco.root);
    const height = size.y;
    const target = new THREE.Vector3(0, height * 0.52, 0);
    let distance = height * 2.8;
    const reset = () => {
      controls.target.copy(target);
      camera.position.set(0, target.y + height * 0.06, distance);
      camera.lookAt(target);
      controls.update();
    };
    const resize = () => {
      const { width, height: stageHeight } = stage.getBoundingClientRect();
      camera.aspect = width / stageHeight;
      camera.updateProjectionMatrix();
      renderer!.setSize(width, stageHeight, false);
      // Leave headroom for the jump and the label, including on narrow screens.
      distance = height * Math.max(2.5, 1.9 / camera.aspect);
      controls.minDistance = distance * 0.65;
      controls.maxDistance = distance * 1.6;
      reset();
    };
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(82,23,23,0.28)");
    gradient.addColorStop(1, "rgba(82,23,23,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(height, height), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.005;
    scene.add(shadow);

    let visible = false;
    let frame = 0;
    let previous = 0;
    let oneShot = false;
    const render = (now: number) => {
      frame = 0;
      if (!visible || document.hidden) return;
      const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;
      if (!reduce.matches || oneShot) boneco.update(dt);
      if (oneShot && boneco.current === "idle") oneShot = false;
      renderer!.render(scene, camera);
      if (!reduce.matches || oneShot) frame = requestAnimationFrame(render);
    };
    const wake = () => {
      if (!frame) { previous = 0; frame = requestAnimationFrame(render); }
    };
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
      else { cancelAnimationFrame(frame); frame = 0; previous = 0; }
    });
    visibility.observe(stage);
    const resizeObserver = new ResizeObserver(() => { resize(); wake(); });
    resizeObserver.observe(stage);
    controls.addEventListener("change", wake);
    const onVisibility = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", wake);
    const zoom = (factor: number) => {
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(offset);
      controls.update();
      wake();
    };
    canvas.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "Home"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") reset();
      else if (["+", "=", "-"].includes(event.key)) zoom(event.key === "-" ? 1.1 : 0.9);
      else {
        const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
        if (event.key === "ArrowLeft") spherical.theta -= 0.15;
        if (event.key === "ArrowRight") spherical.theta += 0.15;
        if (event.key === "ArrowUp") spherical.phi -= 0.1;
        if (event.key === "ArrowDown") spherical.phi += 0.1;
        spherical.phi = THREE.MathUtils.clamp(spherical.phi, controls.minPolarAngle, controls.maxPolarAngle);
        camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
        controls.update();
      }
      wake();
    });
    buttons.forEach((button) => {
      button.disabled = false;
      button.addEventListener("click", () => {
        if (button.dataset.action === "reset") { reset(); boneco.play("idle"); oneShot = false; }
        else { boneco.play(button.dataset.action!); oneShot = true; }
        wake();
      });
    });
    cleanup = () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      resizeObserver.disconnect();
      controls.dispose();
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", wake);
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          Object.values(material).forEach((value) => { if (value instanceof THREE.Texture) value.dispose(); });
          material.dispose();
        });
      });
      renderer?.dispose();
    };
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      cleanup();
      canvas.hidden = true;
      fallback.hidden = false;
      status.hidden = false;
      status.textContent = "O 3D foi pausado. Recarregue para tentar novamente.";
      buttons.forEach((button) => { button.disabled = true; });
    }, { once: true });
    window.addEventListener("pagehide", (event) => { if (!event.persisted) cleanup(); }, { once: true });
    canvas.hidden = false;
    fallback.hidden = true;
    status.hidden = true;
    resize();
    wake();
  } catch (error) {
    cleanup();
    renderer?.dispose();
    canvas.hidden = true;
    fallback.hidden = false;
    status.hidden = false;
    status.textContent = "O 3D não está disponível neste navegador. Meu retrato fica por aqui.";
    console.warn("Não foi possível carregar o personagem 3D.", error);
  }
}
