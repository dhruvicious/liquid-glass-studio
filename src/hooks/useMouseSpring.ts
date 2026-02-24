import { useRef } from 'react';
import { Controller } from '@react-spring/web';

export interface MouseSpringSpeed {
  x: number;
  y: number;
}

export interface MouseSpringState {
  spring: Controller<{ x: number; y: number }>;
  speed: MouseSpringSpeed;
  pointerPos: { x: number; y: number };
  lastValue: { x: number; y: number };
  lastTime: number | null;
}

export function useMouseSpring() {
  const speedRef = useRef<MouseSpringSpeed>({ x: 0, y: 0 });
  const lastValueRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef<number | null>(null);

  const spring = useRef(
    new Controller<{ x: number; y: number }>({
      x: 0,
      y: 0,
      onChange: (c) => {
        if (!lastTimeRef.current) {
          lastTimeRef.current = Date.now();
          lastValueRef.current = c.value;
          return;
        }
        const now = Date.now();
        const dt = now - lastTimeRef.current;
        const dx = { x: c.value.x - lastValueRef.current.x, y: c.value.y - lastValueRef.current.y };
        const speed = { x: dx.x / dt, y: dx.y / dt };

        if (Math.abs(speed.x) > 1e10 || Math.abs(speed.y) > 1e10) {
          speed.x = 0;
          speed.y = 0;
        }

        speedRef.current = speed;
        lastValueRef.current = c.value;
        lastTimeRef.current = now;
      },
    }),
  ).current;

  return { spring, speedRef };
}
