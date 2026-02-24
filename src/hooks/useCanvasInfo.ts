import { useState, useLayoutEffect, useCallback } from 'react';
import type { ResizeWindowCtrlRefType } from '../components/ResizableWindow/ResizableWindow';

export interface CanvasInfo {
  width: number;
  height: number;
  dpr: number;
}

function getInitialSize() {
  return Math.max(Math.min(window.innerWidth, window.innerHeight) - 150, 600);
}

export function useCanvasInfo(canvasWindowCtrlRef: React.MutableRefObject<ResizeWindowCtrlRefType | null>) {
  const [canvasInfo, setCanvasInfo] = useState<CanvasInfo>({
    width: getInitialSize(),
    height: getInitialSize(),
    dpr: window.devicePixelRatio,
  });

  const centerizeCanvasWindow = useCallback(() => {
    const ctrl = canvasWindowCtrlRef.current;
    if (!ctrl) return;
    const size = ctrl.getSize();
    ctrl.setMoveOffset({
      x: window.innerWidth / 2 - size.width / 2,
      y: window.innerHeight / 2 - size.height / 2,
    });
  }, [canvasWindowCtrlRef]);

  useLayoutEffect(() => {
    const onResize = () => {
      centerizeCanvasWindow();
      setCanvasInfo((v) => ({ ...v, dpr: window.devicePixelRatio }));
    };
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, [centerizeCanvasWindow]);

  return { canvasInfo, setCanvasInfo, centerizeCanvasWindow };
}
