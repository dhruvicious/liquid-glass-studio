import { useRef, useState } from 'react';
import clsx from 'clsx';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import { capitalize } from '../../utils';
import styles from '../../App.module.scss'; // create or co-locate styles

import bgGrid from '@/assets/bg-grid.png';
import bgBars from '@/assets/bg-bars.png';
import bgHalf from '@/assets/bg-half.png';
import bgTimcook from '@/assets/bg-timcook.png';
import bgUI from '@/assets/bg-ui.svg';
import bgTahoeLightImg from '@/assets/bg-tahoe-light.webp';
import bgText from '@/assets/bg-text.jpg';
import bgBuildings from '@/assets/bg-buildings.png';
import bgVideoFish from '@/assets/bg-video-fish.mp4';
import bgVideo2 from '@/assets/bg-video-2.mp4';
import bgVideo3 from '@/assets/bg-video-3.mp4';

export type BgTextureType = 'image' | 'video' | null;

export interface BgSelectProps {
  value: number;
  setValue: (v: number) => void;
  onTextureChange: (url: string | null, type: BgTextureType) => void;
  onVideoElMount: (v: number, el: HTMLVideoElement | null) => void;
}

const BG_OPTIONS = [
  { v: 11, media: '', loadTexture: true, type: 'custom' as const },
  { v: 0, media: bgGrid, loadTexture: false, type: 'image' as const },
  { v: 1, media: bgBars, loadTexture: false, type: 'image' as const },
  { v: 2, media: bgHalf, loadTexture: false, type: 'image' as const },
  { v: 3, media: bgTahoeLightImg, loadTexture: true, type: 'image' as const },
  { v: 4, media: bgBuildings, loadTexture: true, type: 'image' as const },
  { v: 5, media: bgText, loadTexture: true, type: 'image' as const },
  { v: 6, media: bgTimcook, loadTexture: true, type: 'image' as const },
  { v: 7, media: bgUI, loadTexture: true, type: 'image' as const },
  { v: 8, media: bgVideoFish, loadTexture: true, type: 'video' as const },
  { v: 9, media: bgVideo2, loadTexture: true, type: 'video' as const },
  { v: 10, media: bgVideo3, loadTexture: true, type: 'video' as const },
] as const;



export function BgSelect({ value, setValue, onTextureChange, onVideoElMount }: BgSelectProps) {
  const [customFileType, setCustomFileType] = useState<BgTextureType>(null);
  const [customFileUrl, setCustomFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.bgSelect}>
      {BG_OPTIONS.map(({ v, media, loadTexture, type }) => {
        const mediaType = type === 'custom' ? customFileType : (type ?? 'image');
        const mediaUrl = type === 'custom' ? customFileUrl : media;

        const handleClick = () => {
          if (type === 'custom') {
            if (!mediaUrl || value === v) {
              fileInputRef.current?.click();
            }
          }
          setValue(v);
          if (loadTexture && mediaUrl) {
            onTextureChange(mediaUrl, mediaType as BgTextureType);
          } else {
            onTextureChange(null, null);
          }
        };

        return (
          <div
            key={v}
            className={clsx(
              styles.bgSelectItem,
              styles[`bgSelectItemType${capitalize(type ?? 'image')}`],
              { [styles.bgSelectItemActive]: value === v },
            )}
            onClick={handleClick}
          >
            {mediaUrl &&
              (mediaType === 'video' ? (
                <video
                  playsInline
                  muted
                  loop
                  className={styles.bgSelectItemVideo}
                  ref={(ref) => onVideoElMount(v, ref)}
                >
                  <source src={mediaUrl} />
                </video>
              ) : mediaType === 'image' ? (
                <img src={mediaUrl} className={styles.bgSelectItemImg} />
              ) : null)}

            {type === 'custom' && (
              <>
                <input
                  type="file"
                  accept="image/*,video/*"
                  ref={fileInputRef}
                  multiple={false}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (customFileUrl) URL.revokeObjectURL(customFileUrl);
                    const newUrl = URL.createObjectURL(file);
                    const fileType: BgTextureType = file.type.startsWith('image/') ? 'image' : 'video';
                    setCustomFileUrl(newUrl);
                    setCustomFileType(fileType);
                    setValue(v);
                    onTextureChange(newUrl, fileType);
                  }}
                />
                <FileUploadOutlinedIcon />
              </>
            )}

            <div
              className={clsx(
                styles.bgSelectItemOverlay,
                styles[`bgSelectItemOverlay${capitalize(type ?? 'image')}`],
              )}
            >
              {mediaType === 'video' && (
                <PlayCircleOutlinedIcon
                  className={styles.bgSelectItemVideoIcon}
                  style={{ opacity: value !== v ? 1 : 0 }}
                />
              )}
              {type === 'custom' && (
                <div className={styles.bgSelectItemCustomIcon}>
                  <FileUploadOutlinedIcon />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
