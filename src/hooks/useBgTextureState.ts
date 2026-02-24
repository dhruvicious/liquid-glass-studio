import { useRef } from 'react';

export type BgTextureType = 'image' | 'video' | null;

export interface BgTextureState {
  url: string | null;
  texture: WebGLTexture | null;
  ratio: number;
  type: BgTextureType;
  ready: boolean;
}


export function useBgTextureState() {
  return useRef<BgTextureState>({
    url: null,
    texture: null,
    ratio: 1,
    type: null,
    ready: false,
  });
}
