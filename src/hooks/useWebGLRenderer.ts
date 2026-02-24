import { useEffect, useLayoutEffect } from 'react';
import {
  createEmptyTexture,
  loadTextureFromURL,
  MultiPassRenderer,
  updateVideoTexture,
} from "../utils/GLUtils"

import VertexShader from '../shaders/vertex.glsl?raw';
import FragmentBgShader from '../shaders/fragment-bg.glsl?raw';
import FragmentBgVblurShader from '../shaders/fragment-bg-vblur.glsl?raw';
import FragmentBgHblurShader from '../shaders/fragment-bg-hblur.glsl?raw';
import FragmentMainShader from '../shaders/fragment-main.glsl?raw';

import type { CanvasInfo } from './useCanvasInfo';
import type { BgTextureState } from './useBgTextureState';
import type { Controller } from '@react-spring/web';

interface UseWebGLRendererOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  getCanvasInfo: () => CanvasInfo;
  getControls: () => any;
  getBlurWeights: () => number[];
  getBgTexture: () => BgTextureState;
  setBgTexture: (update: Partial<BgTextureState>) => void;
  getMouseSpring: () => Controller<{ x: number; y: number }>;
  getMouseSpringSpeed: () => { x: number; y: number };
  getPointerPos: () => { x: number; y: number };
  setPointerPos: (pos: { x: number; y: number }) => void;
  getCanvasPos: () => { x: number; y: number };
  getBgVideoEls: () => Map<number, HTMLVideoElement>;
}

export function useWebGLRenderer({
  canvasRef,
  getCanvasInfo,
  getControls,
  getBlurWeights,
  getBgTexture,
  setBgTexture,
  getMouseSpring,
  getMouseSpringSpeed,
  getPointerPos,
  setPointerPos,
  getCanvasPos,
  getBgVideoEls,
}: UseWebGLRendererOptions) {
  // Sync canvas size to canvasInfo
  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    const { width, height, dpr } = getCanvasInfo();
    canvasRef.current.width = width * dpr;
    canvasRef.current.height = height * dpr;
  });

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvasEl = canvasRef.current;

    // Pointer tracking
    const onPointerMove = (e: PointerEvent) => {
      const { width, height, dpr } = getCanvasInfo();
      const canvasPos = getCanvasPos();
      setPointerPos({
        x: (e.clientX - canvasPos.x) * dpr,
        y: (height - (e.clientY - canvasPos.y)) * dpr,
      });
      getMouseSpring().start(getPointerPos());
    };
    canvasEl.addEventListener('pointermove', onPointerMove);

    const gl = canvasEl.getContext('webgl2');
    if (!gl) return;

    const renderer = new MultiPassRenderer(canvasEl, [
      { name: 'bgPass', shader: { vertex: VertexShader, fragment: FragmentBgShader } },
      {
        name: 'vBlurPass',
        shader: { vertex: VertexShader, fragment: FragmentBgVblurShader },
        inputs: { u_prevPassTexture: 'bgPass' },
      },
      {
        name: 'hBlurPass',
        shader: { vertex: VertexShader, fragment: FragmentBgHblurShader },
        inputs: { u_prevPassTexture: 'vBlurPass' },
      },
      {
        name: 'mainPass',
        shader: { vertex: VertexShader, fragment: FragmentMainShader },
        inputs: { u_blurredBg: 'hBlurPass', u_bg: 'bgPass' },
        outputToScreen: true,
      },
    ]);

    const lastState = {
      canvasInfo: null as CanvasInfo | null,
      bgUrl: null as string | null,
      bgType: null as BgTextureState['type'],
      controls: null as any,
    };

    let raf: number;
    const render = () => {
      raf = requestAnimationFrame(render);

      const canvasInfo = getCanvasInfo();
      const bg = getBgTexture();
      const controls = getControls();

      // Resize
      if (
        !lastState.canvasInfo ||
        lastState.canvasInfo.width !== canvasInfo.width ||
        lastState.canvasInfo.height !== canvasInfo.height ||
        lastState.canvasInfo.dpr !== canvasInfo.dpr
      ) {
        const w = Math.round(canvasInfo.width * canvasInfo.dpr);
        const h = Math.round(canvasInfo.height * canvasInfo.dpr);
        gl.viewport(0, 0, w, h);
        renderer.resize(w, h);
        renderer.setUniform('u_resolution', [w, h]);
      }

      // Texture URL changed
      if (bg.url !== lastState.bgUrl) {
        // Pause previous video if needed
        if (lastState.bgType === 'video' && lastState.controls?.bgType !== undefined) {
          getBgVideoEls().get(lastState.controls.bgType)?.pause();
        }

        if (!bg.url) {
          if (bg.texture) {
            gl.deleteTexture(bg.texture);
            setBgTexture({ texture: null, type: null });
          }
        } else if (bg.type === 'image') {
          const rafId = requestAnimationFrame(() => setBgTexture({ ready: false }));
          loadTextureFromURL(gl, bg.url).then(({ texture, ratio }) => {
            if (getBgTexture().url === bg.url) {
              cancelAnimationFrame(rafId);
              setBgTexture({ texture, ratio, ready: true });
            }
          });
        } else if (bg.type === 'video') {
          setBgTexture({ ready: false, texture: createEmptyTexture(gl) });
          getBgVideoEls().get(controls.bgType)?.play();
        }
      }

      lastState.canvasInfo = canvasInfo;
      lastState.bgUrl = bg.url;
      lastState.bgType = bg.type;
      lastState.controls = controls;

      // Update video texture each frame
      if (bg.type === 'video') {
        const videoEl = getBgVideoEls().get(controls.bgType);
        if (bg.texture && videoEl) {
          const info = updateVideoTexture(gl, bg.texture, videoEl);
          if (info) setBgTexture({ ratio: info.ratio, ready: true });
        }
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const mouseSpring = getMouseSpring().get();
      const mouseSpringSpeed = getMouseSpringSpeed();
      const pointerPos = getPointerPos();
      const blurWeights = getBlurWeights();
      const currentBg = getBgTexture();

      const shapeSizeSpring = {
        x: controls.shapeWidth + (Math.abs(mouseSpringSpeed.x) * controls.shapeWidth * controls.springSizeFactor) / 100,
        y: controls.shapeHeight + (Math.abs(mouseSpringSpeed.y) * controls.shapeHeight * controls.springSizeFactor) / 100,
      };

      renderer.setUniforms({
        u_resolution: [canvasInfo.width * canvasInfo.dpr, canvasInfo.height * canvasInfo.dpr],
        u_dpr: canvasInfo.dpr,
        u_blurWeights: blurWeights,
        u_blurRadius: controls.blurRadius,
        u_mouse: [pointerPos.x, pointerPos.y],
        u_mouseSpring: [mouseSpring.x, mouseSpring.y],
        u_shapeWidth: shapeSizeSpring.x,
        u_shapeHeight: shapeSizeSpring.y,
        u_shapeRadius: ((Math.min(shapeSizeSpring.x, shapeSizeSpring.y) / 2) * controls.shapeRadius) / 100,
        u_shapeRoundness: controls.shapeRoundness,
        u_mergeRate: controls.mergeRate,
        u_glareAngle: (controls.glareAngle * Math.PI) / 180,
        u_showShape1: controls.showShape1 ? 1 : 0,
      });

      renderer.render({
        bgPass: {
          u_bgType: controls.bgType,
          u_bgTexture: (currentBg.url && currentBg.texture) ?? undefined,
          u_bgTextureRatio: currentBg.url && currentBg.texture ? currentBg.ratio : undefined,
          u_bgTextureReady: currentBg.ready ? 1 : 0,
          u_shadowExpand: controls.shadowExpand,
          u_shadowFactor: controls.shadowFactor / 100,
          u_shadowPosition: [-controls.shadowPosition.x, -controls.shadowPosition.y],
        },
        mainPass: {
          u_tint: [controls.tint.r / 255, controls.tint.g / 255, controls.tint.b / 255, controls.tint.a],
          u_refThickness: controls.refThickness,
          u_refFactor: controls.refFactor,
          u_refDispersion: controls.refDispersion,
          u_refFresnelRange: controls.refFresnelRange,
          u_refFresnelHardness: controls.refFresnelHardness / 100,
          u_refFresnelFactor: controls.refFresnelFactor / 100,
          u_glareRange: controls.glareRange,
          u_glareHardness: controls.glareHardness / 100,
          u_glareConvergence: controls.glareConvergence / 100,
          u_glareOppositeFactor: controls.glareOppositeFactor / 100,
          u_glareFactor: controls.glareFactor / 100,
          u_blurEdge: controls.blurEdge ? 1 : 0,
          STEP: controls.step,
        },
      });
    };

    raf = requestAnimationFrame(render);
    return () => {
      canvasEl.removeEventListener('pointermove', onPointerMove);
      cancelAnimationFrame(raf);
    };
  }, []);
}
