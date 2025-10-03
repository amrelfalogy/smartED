import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayerConfig {
  videoId: string;
  width?: string | number;
  height?: string | number;
  autoplay?: boolean;
  loop?: boolean;
  mute?: boolean;
  modestBranding?: boolean;
  controls?: boolean;          // If you ever want to allow native controls again
  rel?: 0 | 1;
  playsInline?: boolean;
}

export interface YouTubePlayerEventPayload {
  type: 'ready' | 'stateChange' | 'qualityChange' | 'error' | 'rateChange';
  data?: any;
  raw?: any;
}

@Injectable({ providedIn: 'root' })
export class YoutubePlayerService {

  private apiReady$ = new BehaviorSubject<boolean>(false);
  private apiLoading = false;
  private players = new Map<string, any>();

  constructor(private zone: NgZone) {
    this.init();
  }

  private init(): void {
    if (this.apiLoading || this.apiReady$.value) return;
    this.apiLoading = true;

    if (window.YT?.Player) {
      this.apiReady$.next(true);
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      this.zone.run(() => {
        this.apiReady$.next(true);
      });
    };

    const existing = document.querySelector<HTMLScriptElement>('script[data-yt-api]');
    if (!existing) {
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      s.defer = true;
      s.setAttribute('data-yt-api', 'true');
      document.head.appendChild(s);
    }
  }

  async waitUntilReady(): Promise<void> {
    if (this.apiReady$.value) return;
    await firstValueFrom(this.apiReady$);
  }

  async createPlayer(
    element: HTMLElement,
    config: YouTubePlayerConfig,
    handlers: {
      onReady?: (e: any) => void;
      onStateChange?: (e: any) => void;
      onPlaybackQualityChange?: (e: any) => void;
      onPlaybackRateChange?: (e: any) => void;
      onError?: (e: any) => void;
    }
  ): Promise<any> {
    await this.waitUntilReady();

    return new Promise((resolve, reject) => {
      try {
        const player = new window.YT.Player(element, {
          width: config.width ?? '100%',
            height: config.height ?? '100%',
          videoId: config.videoId,
          playerVars: {
            controls: config.controls ? 1 : 0,
            rel: config.rel ?? 0,
            modestbranding: config.modestBranding === false ? 0 : 1,
            autoplay: config.autoplay ? 1 : 0,
            loop: config.loop ? 1 : 0,
            mute: config.mute ? 1 : 0,
            playsinline: config.playsInline === false ? 0 : 1,
            disablekb: 1,
            iv_load_policy: 3,
            cc_load_policy: 0,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (e: any) => {
              handlers.onReady?.(e);
              resolve(player);
            },
            onStateChange: (e: any) => handlers.onStateChange?.(e),
            onPlaybackQualityChange: (e: any) => handlers.onPlaybackQualityChange?.(e),
            onPlaybackRateChange: (e: any) => handlers.onPlaybackRateChange?.(e),
            onError: (e: any) => {
              handlers.onError?.(e);
              reject(e);
            }
          }
        });

        this.players.set(element.id, player);
      } catch (err) {
        reject(err);
      }
    });
  }

  destroyPlayer(elementId: string): void {
    const p = this.players.get(elementId);
    if (p && p.destroy) {
      p.destroy();
    }
    this.players.delete(elementId);
  }

  getPlayer(elementId: string): any {
    return this.players.get(elementId);
  }

  static PlayerState = {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5
  };
}