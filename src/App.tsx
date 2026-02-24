import {
  useRef,
  useMemo,
  type CSSProperties,
} from 'react';
import styles from './App.module.scss';
import { ResizableWindow } from './components/ResizableWindow';
import type { ResizeWindowCtrlRefType } from './components/ResizableWindow/ResizableWindow';
import { PresetControls } from './components/PresetControls/PresetControls';
import { BgSelect } from './components/BgSelect/BgSelect';
import type { BgTextureType } from './components/BgSelect/BgSelect';

import { useCanvasInfo } from './hooks';
import { useMouseSpring } from './hooks';
import { useBgTextureState } from './hooks';
import { useWebGLRenderer } from './hooks';
import { useLevaControls } from './components/Controls/Controls';
import { computeGaussianKernelByRadius } from './utils';

import XIcon from '@mui/icons-material/X';
import GitHubIcon from '@mui/icons-material/GitHub';
import clsx from 'clsx';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)!;
  const canvasWindowCtrlRef = useRef<ResizeWindowCtrlRefType | null>(null);
  const canvasPosRef = useRef({ x: 0, y: 0 });
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const bgVideoElsRef = useRef<Map<number, HTMLVideoElement>>(new Map());

  const { canvasInfo, setCanvasInfo, centerizeCanvasWindow } = useCanvasInfo(canvasWindowCtrlRef);
  const { spring: mouseSpring, speedRef: mouseSpringSpeedRef } = useMouseSpring();
  const bgTextureRef = useBgTextureState();
  const canvasInfoRef = useRef(canvasInfo);
  canvasInfoRef.current = canvasInfo;

  const { controls, lang, langName, levaGlobal, controlsAPI } = useLevaControls({
    containerRender: {
      bgType: ({ value, setValue }) => (
        <BgSelect
          value={value}
          setValue={setValue}
          onTextureChange={(url, type) => {
            bgTextureRef.current.url = url;
            bgTextureRef.current.type = type as BgTextureType;
            if (!url) bgTextureRef.current.ready = false;
          }}
          onVideoElMount={(v, el) => {
            if (el) bgVideoElsRef.current.set(v, el);
            else bgVideoElsRef.current.delete(v);
          }}
        />
      ),
    },
  });

  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  const blurWeightsRef = useRef<number[]>([]);
  useMemo(() => {
    blurWeightsRef.current = computeGaussianKernelByRadius(controls.blurRadius);
  }, [controls.blurRadius]);

  useWebGLRenderer({
    canvasRef,
    getCanvasInfo: () => canvasInfoRef.current,
    getControls: () => controlsRef.current,
    getBlurWeights: () => blurWeightsRef.current,
    getBgTexture: () => bgTextureRef.current,
    setBgTexture: (update) => Object.assign(bgTextureRef.current, update),
    getMouseSpring: () => mouseSpring,
    getMouseSpringSpeed: () => mouseSpringSpeedRef.current,
    getPointerPos: () => pointerPosRef.current,
    setPointerPos: (pos) => { pointerPosRef.current = pos; },
    getCanvasPos: () => canvasPosRef.current,
    getBgVideoEls: () => bgVideoElsRef.current,
  });

  return (
    <>
      {levaGlobal}

      <PresetControls controls={controls} controlsAPI={controlsAPI} lang={lang} />

      <ResizableWindow
        disableMove
        size={canvasInfo}
        onResize={(size) => {
          setCanvasInfo({ ...size, dpr: window.devicePixelRatio });
          centerizeCanvasWindow();
        }}
        onMove={(pos) => { canvasPosRef.current = pos; }}
        ctrlRef={(ref) => { canvasWindowCtrlRef.current = ref; }}
      >
        <div className={clsx(styles.canvasContainer)}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            style={{ ['--dpr']: canvasInfo.dpr } as CSSProperties}
          />
        </div>
      </ResizableWindow>
    </>
  );
}

export default App;
