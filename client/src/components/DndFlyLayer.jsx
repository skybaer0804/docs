import { useEffect, useMemo, useState } from 'preact/hooks';
import './DndFlyLayer.scss';

export function DndFlyLayer({ fly }) {
  const [animate, setAnimate] = useState(false);

  const from = fly?.fromRect;
  const to = fly?.toRect;
  const label = fly?.label || '';

  const style = useMemo(() => {
    if (!from) return null;
    return {
      left: `${from.left}px`,
      top: `${from.top}px`,
      width: `${Math.max(1, from.width)}px`,
      height: `${Math.max(1, from.height)}px`,
    };
  }, [from]);

  const transform = useMemo(() => {
    if (!from || !to) return null;
    const dx = to.left - from.left;
    const dy = to.top - from.top;
    const sx = from.width ? to.width / from.width : 1;
    const sy = from.height ? to.height / from.height : 1;
    return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
  }, [from, to]);

  useEffect(() => {
    if (!fly) return;
    setAnimate(false);
    const t = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(t);
  }, [fly]);

  if (!fly || !from || !to || !style) return null;

  return (
    <div class="dnd-fly-layer" aria-hidden="true">
      <div
        class={`dnd-fly-layer__ghost ${animate ? 'dnd-fly-layer__ghost--animate' : ''}`}
        style={{
          ...style,
          transform: animate ? transform : 'translate(0px, 0px) scale(1, 1)',
        }}
      >
        <div class="dnd-fly-layer__content">{label}</div>
      </div>
    </div>
  );
}


