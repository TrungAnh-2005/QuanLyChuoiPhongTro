// Lucian UX/UI Prompt #080 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#080
import { useEffect, useRef } from 'react';
import './data-loading.css';

const orbits = [
  { radius: 105, tilt: -18, period: 5.5, color: 'var(--ux-accent-2)', size: 12 },
  { radius: 75, tilt: 24, period: 3.6, color: 'var(--ux-accent)', size: 10 },
  { radius: 50, tilt: -58, period: 2.2, color: 'var(--ux-mint)', size: 9 },
];
const planets = orbits.flatMap((orbit, index) => [0, Math.PI].map((phase, pair) => ({
  ...orbit, phase: phase + index, size: orbit.size - pair * 4, opacity: pair ? 0.7 : 1,
})));

export default function DataLoading() {
  const planetRefs = useRef([]);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let elapsed = 0;
    let lastFrame = performance.now();

    const orbit = now => {
      if (!motion.matches) elapsed += (now - lastFrame) / 1000;
      lastFrame = now;
      planets.forEach((planet, index) => {
        const angle = planet.phase + elapsed * Math.PI * 2 / planet.period;
        const tilt = planet.tilt * Math.PI / 180;
        const x = Math.cos(angle) * planet.radius;
        const y = Math.sin(angle) * planet.radius * 0.38;
        const node = planetRefs.current[index];
        if (!node) return;
        node.style.transform = `translate(${(115 + x * Math.cos(tilt) - y * Math.sin(tilt)).toFixed(1)}px,${(100 + x * Math.sin(tilt) + y * Math.cos(tilt)).toFixed(1)}px)`;
        node.style.zIndex = Math.sin(angle) < 0 ? 0 : 2;
      });
      if (!motion.matches) frame = requestAnimationFrame(orbit);
    };
    const updateMotion = () => {
      cancelAnimationFrame(frame);
      lastFrame = performance.now();
      orbit(lastFrame);
    };
    updateMotion();
    motion.addEventListener('change', updateMotion);
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener('change', updateMotion);
    };
  }, []);

  return (
    <div className="data-loading-slot">
      <section className="ux u080" role="status" aria-live="polite" aria-atomic="true">
        <div className="u080-sys" aria-hidden="true">
          {orbits.map(orbit => (
            <div key={orbit.radius} className="u080-o" style={{ '--d': `${orbit.radius * 2}px`, '--t': `${orbit.tilt}deg` }} />
          ))}
          {planets.map((planet, index) => (
            <i key={index} ref={node => { planetRefs.current[index] = node; }} className="u080-p"
              style={{ '--c': planet.color, '--s': `${planet.size}px`, opacity: planet.opacity }} />
          ))}
          <span className="u080-core" />
        </div>
        <div className="u080-msg">
          <div className="u080-t"><b>Đang tải dữ liệu…</b></div>
          <p className="u080-sub">Đang kết nối và đồng bộ dữ liệu.</p>
        </div>
        <p className="u080-note">Vui lòng chờ trong giây lát.</p>
      </section>
    </div>
  );
}
