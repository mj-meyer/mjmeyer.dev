// Reduced React Bits PixelBlast adapter. Shader retained verbatim in the
// adjacent module. See LICENSE.md and PROVENANCE.md.
import { useEffect, useRef } from "react";
import {
  WebGLRenderer,
  Vector2,
  Color,
  Scene,
  OrthographicCamera,
  ShaderMaterial,
  PlaneGeometry,
  Mesh,
  GLSL3,
} from "three";
import { SHAPE_MAP, VERTEX_SRC, FRAGMENT_SRC } from "./PixelBlast.shader.js";

export default function PixelBlast({
  color,
  paused = false,
  pixelSize = 3,
  patternScale = 3,
  patternDensity = 0.55,
  speed = 0.08,
  maxFps = 20,
}) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer;
    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
    } catch {
      host.dataset.renderer = "static";
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1));
    renderer.setClearAlpha(0);
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    host.append(canvas);
    host.dataset.renderer = "webgl";
    const uniforms = {
      uResolution: { value: new Vector2() },
      uTime: { value: 100 },
      uColor: { value: new Color(color) },
      uPixelSize: { value: pixelSize },
      uScale: { value: patternScale },
      uDensity: { value: patternDensity },
      uPixelJitter: { value: 0.15 },
      uShapeType: { value: SHAPE_MAP.square },
      uEnableRipples: { value: 0 },
      uRippleSpeed: { value: 0 },
      uRippleThickness: { value: 0.1 },
      uRippleIntensity: { value: 0 },
      uClickPos: {
        value: Array.from({ length: 10 }, () => new Vector2(-1, -1)),
      },
      uClickTimes: { value: new Float32Array(10) },
      uEdgeFade: { value: 0.08 },
    };
    const material = new ShaderMaterial({
      vertexShader: VERTEX_SRC,
      fragmentShader: FRAGMENT_SRC,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      glslVersion: GLSL3,
    });
    const geometry = new PlaneGeometry(2, 2);
    const scene = new Scene();
    scene.add(new Mesh(geometry, material));
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    let raf = 0,
      timer = 0,
      disposed = false,
      visible = true,
      lost = false,
      elapsed = 0,
      lastTime = performance.now();
    function cancel() {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    }
    function render(now) {
      if (disposed || lost || document.hidden || !visible) return;
      if (!paused) elapsed += Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      uniforms.uTime.value = 100 + elapsed * speed;
      renderer.render(scene, camera);
      if (!paused)
        timer = window.setTimeout(() => {
          raf = requestAnimationFrame(render);
        }, 1000 / maxFps);
    }
    function wake() {
      cancel();
      lastTime = performance.now();
      if (!disposed && !lost && !document.hidden && visible)
        raf = requestAnimationFrame(render);
    }
    function resize() {
      if (disposed || lost) return;
      renderer.setSize(host.clientWidth || 1, host.clientHeight || 1, false);
      uniforms.uResolution.value.set(canvas.width, canvas.height);
      wake();
    }
    function contextLost(event) {
      event.preventDefault();
      lost = true;
      cancel();
      canvas.hidden = true;
      host.dataset.renderer = "static";
    }
    canvas.addEventListener("webglcontextlost", contextLost);
    document.addEventListener("visibilitychange", wake);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    intersection.observe(host);
    resize();
    return () => {
      disposed = true;
      cancel();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", wake);
      canvas.removeEventListener("webglcontextlost", contextLost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [color, paused, pixelSize, patternScale, patternDensity, speed, maxFps]);
  return (
    <div ref={hostRef} className="garden-pixel-renderer" aria-hidden="true" />
  );
}
