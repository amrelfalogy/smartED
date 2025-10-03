import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
  AfterViewInit
} from '@angular/core';
import { YoutubePlayerService } from 'src/app/core/services/youtube-player.service';
import { VideoIdExtractorService } from 'src/app/core/services/video-id-extractor.service';
import { PageSecurityService } from 'src/app/core/services/page-security.service';
import { Subscription } from 'rxjs';

export interface SecurePlayerEvent {
  type: 'ready' | 'play' | 'pause' | 'ended' | 'buffering' | 'quality' | 'error';
  timestamp: Date;
  payload?: any;
}

type OverlayMode = 'none' | 'header' | 'full';

@Component({
  selector: 'app-youtube-secure-player',
  templateUrl: './youtube-secure-player.component.html',
  styleUrls: ['./youtube-secure-player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class YoutubeSecurePlayerComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() videoUrl = '';
  @Input() title = '';
  @Input() autoplay = false;
  @Input() enableSecurity = true;
  @Input() overlayMode: OverlayMode = 'header'; // 'header' requested
  @Input() aspectRatio: string = '16/9';         // CSS aspect-ratio
  @Input() heightFallback = 500;                // Fallback if browser doesn’t support aspect-ratio

  @Output() playerEvent = new EventEmitter<SecurePlayerEvent>();
  @Output() securityViolation = new EventEmitter<string>();

  @ViewChild('wrapper', { static: true }) wrapperRef!: ElementRef<HTMLDivElement>;
  @ViewChild('playerHost', { static: true }) playerHostRef!: ElementRef<HTMLDivElement>;

  // State
  player: any;
  videoId = '';
  loading = true;
  error = '';
  ready = false;
  isPlaying = false;
  duration = 0;
  currentTime = 0;
  bufferedPercent = 0;
  availableQualities: string[] = [];
  currentQuality = 'auto';
  volume = 60;
  muted = false;

  // UI
  showControls = true;
  hover = false;
  qualityMenu = false;

  isFullscreen = false;

  private updateTimer?: number;
  private intersectionObs?: IntersectionObserver;
  private subscriptions: Subscription[] = [];
  private playerElementId = `yt-secure-${Math.random().toString(36).slice(2, 11)}`;

  constructor(
    private yt: YoutubePlayerService,
    private videoIdExtractor: VideoIdExtractorService,
    private pageSecurity: PageSecurityService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.extractVideo();
    if (this.enableSecurity) {
      this.pageSecurity.enableSecurity(); // Page-level
    }
  }

  ngAfterViewInit(): void {
    // Ensure host element has an ID for YouTube API
    this.playerHostRef.nativeElement.id = this.playerElementId;
    this.applyDimensions();

    if (this.videoId) {
      this.instantiatePlayer();
    } else {
      this.fail('رابط فيديو غير صالح');
    }

    this.setupIntersectionObserver();

    this.setupFullscreenListeners();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // ✅ Setup fullscreen event listeners
  private setupFullscreenListeners(): void {
    const updateFullscreenState = () => {
      this.zone.run(() => {
        this.isFullscreen = !!document.fullscreenElement;
        this.cdr.markForCheck();
      });
    };

    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    document.addEventListener('mozfullscreenchange', updateFullscreenState);
    document.addEventListener('msfullscreenchange', updateFullscreenState);

    // Store references for cleanup
    this.subscriptions.push({
      unsubscribe: () => {
        document.removeEventListener('fullscreenchange', updateFullscreenState);
        document.removeEventListener('webkitfullscreenchange', updateFullscreenState);
        document.removeEventListener('mozfullscreenchange', updateFullscreenState);
        document.removeEventListener('msfullscreenchange', updateFullscreenState);
      }
    } as Subscription);
  }

  toggleFullscreen(): void {
    const el = this.wrapperRef.nativeElement;
    if (this.isFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  }

  private extractVideo(): void {
    const res = this.videoIdExtractor.extractVideoId(this.videoUrl);
    if (res.isValid && res.videoId) {
      this.videoId = res.videoId;
    }
  }

  private applyDimensions(): void {
    const host = this.wrapperRef.nativeElement;
    // Use aspect-ratio if supported; fallback to fixed height
    host.style.setProperty('--secure-aspect-ratio', this.aspectRatio);
    host.style.minHeight = `${this.heightFallback}px`;
  }

  private async instantiatePlayer(): Promise<void> {
    try {
      this.loading = true;
      this.error = '';
      this.cdr.markForCheck();

      this.player = await this.yt.createPlayer(
        this.playerHostRef.nativeElement,
        {
          videoId: this.videoId,
          autoplay: this.autoplay,
          controls: false,
          modestBranding: true,
          loop: false,
          mute: false,
          rel: 0
        },
        {
          onReady: (e) => this.onReady(e),
          onStateChange: (e) => this.onStateChange(e),
          onPlaybackQualityChange: (e) => this.onQualityChange(e),
          onError: (e) => this.onError(e)
        }
      );
    } catch (err: any) {
      this.fail('تعذر إنشاء المشغل');
      console.error('Player instantiation error', err);
    }
  }

  private onReady(e: any): void {
    this.zone.run(() => {
      this.ready = true;
      this.loading = false;
      this.duration = this.player.getDuration?.() || 0;
      this.availableQualities = this.player.getAvailableQualityLevels?.() || [];
      this.currentQuality = this.player.getPlaybackQuality?.() || 'auto';
      this.player.setVolume?.(this.volume);
      this.startTick();
      this.emit('ready', { duration: this.duration, qualities: this.availableQualities });
      this.cdr.markForCheck();
    });
  }

  private onStateChange(e: any): void {
    const state = e.data;
    this.zone.run(() => {
      switch (state) {
        case YoutubePlayerService.PlayerState.PLAYING:
          this.isPlaying = true;
          this.emit('play');
          break;
        case YoutubePlayerService.PlayerState.PAUSED:
          this.isPlaying = false;
          this.emit('pause');
          break;
        case YoutubePlayerService.PlayerState.ENDED:
          this.isPlaying = false;
          this.emit('ended');
          break;
        case YoutubePlayerService.PlayerState.BUFFERING:
          this.emit('buffering');
          break;
      }
      this.cdr.markForCheck();
    });
  }

  private onQualityChange(e: any): void {
    this.zone.run(() => {
      this.currentQuality = e.data;
      this.emit('quality', { quality: this.currentQuality });
      this.cdr.markForCheck();
    });
  }

  private onError(e: any): void {
    console.error('YT error event', e);
    this.zone.run(() => {
      this.fail(this.translateError(e?.data));
      this.emit('error', { code: e?.data });
    });
  }

  private translateError(code: number): string {
    switch (code) {
      case 2: return 'معرف الفيديو غير صالح';
      case 5: return 'مشغل HTML5 غير مدعوم';
      case 100: return 'الفيديو غير موجود أو خاص';
      case 101:
      case 150: return 'الفيديو لا يسمح بالتضمين';
      default: return 'خطأ غير معروف';
    }
  }

  private fail(msg: string): void {
    this.error = msg;
    this.loading = false;
    this.ready = false;
    this.isPlaying = false;
    this.cdr.markForCheck();
  }

  private emit(type: SecurePlayerEvent['type'], payload?: any): void {
    this.playerEvent.emit({ type, payload, timestamp: new Date() });
  }

  // ---- Controls ----
  playPause(): void {
    if (!this.ready) return;
    this.isPlaying ? this.player.pauseVideo() : this.player.playVideo();
  }

  setVol(v: number): void {
    this.volume = Math.max(0, Math.min(100, v));
    this.player.setVolume?.(this.volume);
    this.muted = this.volume === 0;
    this.cdr.markForCheck();
  }

  toggleMute(): void {
    if (!this.ready) return;
    if (this.muted) {
      this.setVol(50);
    } else {
      this.setVol(0);
    }
  }

  seek(ev: MouseEvent): void {
    if (!this.ready || !this.duration) return;
    const bar = ev.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const ratio = (ev.clientX - rect.left) / rect.width;
    const target = ratio * this.duration;
    this.player.seekTo?.(target, true);
  }

  toggleQualityMenu(): void {
    if (!this.availableQualities.length) return;
    this.qualityMenu = !this.qualityMenu;
  }

  chooseQuality(q: string): void {
    this.player.setPlaybackQuality?.(q);
    this.currentQuality = q;
    this.qualityMenu = false;
    this.emit('quality', { quality: q });
  }

  // toggleFullscreen(): void {
  //   const el = this.wrapperRef.nativeElement;
  //   if (document.fullscreenElement) {
  //     document.exitFullscreen().catch(() => {});
  //   } else {
  //     el.requestFullscreen?.().catch(() => {});
  //   }
  // }

  // ---- Periodic updating ----
  private startTick(): void {
    this.stopTick();
    this.updateTimer = window.setInterval(() => {
      if (!this.player || !this.ready) return;
      try {
        this.currentTime = this.player.getCurrentTime?.() || 0;
        const frac = this.player.getVideoLoadedFraction?.() || 0;
        this.bufferedPercent = frac * 100;
        this.cdr.markForCheck();
      } catch {}
    }, 1000);
  }

  private stopTick(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }
  }

  // ---- Visibility auto-pause (optional) ----
  private setupIntersectionObserver(): void {
    this.intersectionObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting && this.isPlaying) {
          this.player.pauseVideo?.();
        }
      });
    }, { threshold: 0.15 });
    this.intersectionObs.observe(this.wrapperRef.nativeElement);
  }

  // ---- Cleanup ----
  private cleanup(): void {
    this.stopTick();
    this.intersectionObs?.disconnect();
    this.yt.destroyPlayer(this.playerElementId);
    this.subscriptions.forEach(s => s.unsubscribe());
    if (this.enableSecurity) {
      this.pageSecurity.disableSecurity();
    }
  }

  // ---- Derived UI helpers ----
  get progressPercent(): number {
    if (!this.duration) return 0;
    return (this.currentTime / this.duration) * 100;
  }

  formatTime(sec: number): string {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  get volumeIcon(): string {
    if (this.muted || this.volume === 0) return 'pi-volume-off';
    if (this.volume < 50) return 'pi-volume-down';
    return 'pi-volume-up';
  }

  get overlayHeader(): boolean {
    return this.overlayMode === 'header';
  }

  get overlayFull(): boolean {
    return this.overlayMode === 'full';
  }

  retry(): void {
    this.error = '';
    this.instantiatePlayer();
  }
}