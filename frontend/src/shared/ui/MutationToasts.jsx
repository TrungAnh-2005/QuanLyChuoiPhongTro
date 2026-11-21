// Lucian UX/UI Prompt #070 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#070
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './mutation-toasts.css';

function Toast({ notification, index, expanded, paused, onDismiss, onHeight, offset }) {
  const { id, state, message } = notification;
  const ref = useRef(null);
  const drag = useRef(null);
  const [entering, setEntering] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [direction, setDirection] = useState(0);
  const remaining = useRef(4500);
  const closeTimer = useRef(null);
  const dismiss = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    closeTimer.current = setTimeout(() => onDismiss(id), 450);
  }, [id, leaving, onDismiss]);
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntering(false));
    return () => cancelAnimationFrame(frame);
  }, []);
  useLayoutEffect(() => {
    const measure = () => onHeight(id, ref.current?.offsetHeight || 68);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [id, onHeight]);
  useEffect(() => {
    if (state !== 'success' || paused || index > 0 || leaving) return;
    let last = performance.now();
    let frame;
    const tick = now => {
      const elapsed = now - last;
      last = now;
      remaining.current = Math.max(0, remaining.current - elapsed);
      ref.current?.style.setProperty('--left', remaining.current / 4500);
      if (remaining.current === 0) { dismiss(); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state, paused, index, leaving, dismiss]);
  const endDrag = () => {
    if (!drag.current) return;
    const dx = drag.current.dx;
    drag.current = null;
    ref.current.classList.remove('drag');
    if (Math.abs(dx) > 90) { setDirection(dx > 0 ? 1 : -1); dismiss(); }
    else { ref.current.style.setProperty('--dx', '0px'); ref.current.style.removeProperty('--drag-opacity'); }
  };
  const back = !expanded && index > 0;
  const title = state === 'pending' ? 'Đang xử lý' : state === 'success' ? 'Thành công' : 'Không thành công';
  return <div ref={ref} data-state={state} role={state === 'error' ? 'alert' : 'status'} aria-busy={state === 'pending'}
    inert={back || undefined}
    className={`u070-t${entering ? ' enter' : ''}${leaving ? ' leave' : ''}${direction ? ' side' : ''}${back ? ' back' : ''}`}
    style={{ '--c': state === 'success' ? 'var(--ux-mint)' : state === 'error' ? 'var(--ux-danger)' : 'var(--ux-accent)', '--y': `${expanded ? -offset : -index * 14}px`, '--s': expanded ? 1 : Math.max(.7, 1 - index * .06), '--o': expanded || index < 3 ? 1 : 0, '--dir': direction || 1, zIndex: 50 - index }}
    onPointerDown={event => {
      if (event.target.closest('button') || state === 'pending') return;
      drag.current = { start: event.clientX, dx: 0 };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add('drag');
    }}
    onPointerMove={event => {
      if (!drag.current) return;
      const dx = event.clientX - drag.current.start;
      drag.current.dx = dx;
      event.currentTarget.style.setProperty('--dx', `${dx}px`);
      event.currentTarget.style.setProperty('--drag-opacity', Math.max(.2, 1 - Math.abs(dx) / 260));
    }} onPointerUp={endDrag} onPointerCancel={endDrag}>
    <span className="u070-ic" aria-hidden="true">
      {state === 'pending' ? <i /> : <svg viewBox="0 0 18 18"><path d={state === 'success' ? 'M4 9.4l3.2 3.2L14 5.6' : 'M5 5l8 8M13 5l-8 8'} /></svg>}
    </span>
    <span className="u070-tx"><b>{title}</b><small>{message}</small></span>
    {state !== 'pending' && <button type="button" className="u070-x" aria-label="Đóng thông báo" onClick={dismiss}><svg viewBox="0 0 14 14"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" /></svg></button>}
    {state === 'success' && <span className="u070-bar" aria-hidden="true" />}
  </div>;
}

export default function MutationToasts({ notifications, onDismiss }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [heights, setHeights] = useState({});
  const onHeight = React.useCallback((id, height) => setHeights(current => current[id] === height ? current : { ...current, [id]: height }), []);
  const expanded = hovered || focused;
  return <div className="ux u070" onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className="u070-zone" role="region" aria-label="Trạng thái yêu cầu">
      {notifications.map((notification, index) => {
        const top = notifications.slice(0, index).reduce((total, row) => total + (heights[row.id] || 68) + 8, 0);
        return <Toast key={notification.id} notification={notification} index={index} expanded={expanded} paused={expanded} offset={top} onHeight={onHeight} onDismiss={onDismiss} />;
      })}
    </div>
  </div>;
}
