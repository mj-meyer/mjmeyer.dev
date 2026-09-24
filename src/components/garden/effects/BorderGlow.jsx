// Reduced React Bits BorderGlow adapter. See LICENSE.md and PROVENANCE.md.
import { useEffect, useRef } from "react";

export default function BorderGlow({ target }) {
  const ref = useRef(null);
  useEffect(() => {
    const glow = ref.current;
    if (!glow || !target) return;
    function move(event) {
      if (event.pointerType === "touch") return;
      const rect = target.getBoundingClientRect();
      const cx = rect.width / 2,
        cy = rect.height / 2;
      const dx = event.clientX - rect.left - cx,
        dy = event.clientY - rect.top - cy;
      const kx = dx === 0 ? Infinity : cx / Math.abs(dx);
      const ky = dy === 0 ? Infinity : cy / Math.abs(dy);
      const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;
      glow.style.setProperty("--garden-edge", String(edge));
      glow.style.setProperty("--garden-angle", `${angle}deg`);
    }
    function leave() {
      glow.style.setProperty("--garden-edge", "0");
    }
    target.addEventListener("pointermove", move, { passive: true });
    target.addEventListener("pointerleave", leave);
    return () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerleave", leave);
    };
  }, [target]);
  return (
    <span className="garden-border-glow" ref={ref} aria-hidden="true">
      <span />
    </span>
  );
}
