import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { VideoIdExtractorService, VideoIdResult } from 'src/app/core/services/video-id-extractor.service';
import { PageSecurityService } from 'src/app/core/services/page-security.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from 'src/app/core/services/auth.service';

export interface VideoPlayerConfig {
  autoplay?: boolean;
  controls?: boolean;
  showInfo?: boolean;
  modestBranding?: boolean;
  relatedVideos?: boolean;
  keyboardDisabled?: boolean;
}

export interface VideoPlayerEvent {
  type: 'play' | 'pause' | 'ended' | 'error' | 'loaded';
  timestamp: Date;
  data?: any;
}

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() videoUrl: string = '';
  @Input() title: string = '';
  @Input() config: VideoPlayerConfig = {};
  @Input() enableSecurity: boolean = true;
  @Input() width: string = '100%';
  @Input() height: string = '480px';

  @Output() videoEvent = new EventEmitter<VideoPlayerEvent>();
  @Output() securityViolation = new EventEmitter<string>();

  @ViewChild('videoContainer', { static: true }) videoContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('videoIframe', { static: false }) videoIframe!: ElementRef<HTMLIFrameElement>;

  // Component state
  isLoading = true;
  hasError = false;
  errorMessage = '';
  videoData: VideoIdResult | null = null;
  embedUrl: SafeResourceUrl | null = null;

  // ✅ NEW: User security properties
  currentUserName: string = '';
  userEmail: string = '';
  securityWatermark: string = '';

  // Default config
  private defaultConfig: VideoPlayerConfig = {
    autoplay: false,
    controls: true,
    showInfo: false,
    modestBranding: true,
    relatedVideos: false,
    keyboardDisabled: true
  };

  constructor(
    private videoIdExtractor: VideoIdExtractorService,
    private pageSecurity: PageSecurityService,
    private sanitizer: DomSanitizer,
    private authService: AuthService 

  ) {}

  ngOnInit(): void {
    this.setupUserSecurity();

    if (this.enableSecurity) {
      this.pageSecurity.enableSecurity();
    }

    if (this.videoUrl) {
      this.loadVideo();
    }
  }

  // ✅ NEW: Setup user security information
  private setupUserSecurity(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser) {
      // Build display name
      const firstName = currentUser.firstName || '';
      const lastName = currentUser.lastName || '';
      this.currentUserName = `${firstName} ${lastName}`.trim();
      
      // Fallback to email if no name available
      if (!this.currentUserName) {
        this.currentUserName = currentUser.email || 'مستخدم';
      }
      
      this.userEmail = currentUser.email || '';
      
      // Create security watermark text
      this.securityWatermark = this.currentUserName;
      
      console.log('🔒 Security watermark set for user:', this.currentUserName);
    } else {
      // Fallback for unauthenticated users
      this.currentUserName = 'ضيف';
      this.securityWatermark = 'ضيف - عرض تجريبي';
    }
  }

  ngAfterViewInit(): void {
    if (this.enableSecurity && this.videoContainer) {
      this.pageSecurity.protectElement(this.videoContainer.nativeElement);
      
      this.addWatermarkRotation();
      this.addKeyboardProtection();
      
      setTimeout(() => {
        this.addAdvancedSecurityBlocking();
      }, 2000);
    }
  }

  ngOnDestroy(): void {
    if (this.enableSecurity) {
      this.pageSecurity.disableSecurity();
      
      if (this.videoContainer) {
        this.pageSecurity.unprotectElement(this.videoContainer.nativeElement);
      }
    }
  }

  // ✅ NEW: Rotate watermarks periodically
  private addWatermarkRotation(): void {
    setInterval(() => {
      const watermarks = document.querySelectorAll('.floating-watermark');
      watermarks.forEach((watermark, index) => {
        const rotation = Math.random() * 30 - 15; // Random rotation between -15 and 15 degrees
        (watermark as HTMLElement).style.transform = `rotate(${rotation}deg)`;
      });
    }, 5000); // Change every 5 seconds
  }

  // Enhanced keyboard protection
  private addKeyboardProtection(): void {
    const container = this.videoContainer.nativeElement;
    
    container.addEventListener('keydown', (e) => {
      // Prevent common screenshot/recording shortcuts
      const blockedKeys = [
        'PrintScreen', 'F12', 'F11', // Screenshots, dev tools
        'Alt+Tab', 'Alt+F4',         // Window switching
        'Ctrl+Shift+I', 'Ctrl+U'     // Developer tools, view source
      ];
      
      const keyCombo = 
        (e.ctrlKey ? 'Ctrl+' : '') +
        (e.altKey ? 'Alt+' : '') +
        (e.shiftKey ? 'Shift+' : '') +
        e.key;
      
      if (blockedKeys.includes(keyCombo) || blockedKeys.includes(e.key)) {
        e.preventDefault();
        this.securityViolation.emit(`Blocked keyboard shortcut: ${keyCombo}`);
      }
    });
  }

  private addAdvancedSecurityBlocking(): void {
    const iframe = this.videoIframe?.nativeElement;
    if (iframe) {
      // Listen for iframe content load to add additional blocking
      iframe.addEventListener('load', () => {
        console.log('🔒 Applying advanced security measures');
        
        // Add additional CSS to block specific YouTube elements
        const style = document.createElement('style');
        style.innerHTML = `
          .video-iframe-container::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            pointer-events: auto;
            z-index: 8;
          }
        `;
        document.head.appendChild(style);
      });
    }
  }

  private loadVideo(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    console.log('🎬 Loading video:', this.videoUrl);

    try {
      // Extract video ID from URL
      this.videoData = this.videoIdExtractor.extractVideoId(this.videoUrl);

      if (!this.videoData.isValid || !this.videoData.videoId) {
        throw new Error('Invalid or unsupported video URL');
      }

      // Build secure embed URL
      const finalConfig = { ...this.defaultConfig, ...this.config };
      const embedUrlString = this.videoIdExtractor.buildSecureEmbedUrl(this.videoData.videoId, finalConfig);
      
      // Sanitize URL for security
      this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrlString);

      console.log('✅ Video loaded successfully:', {
        originalUrl: this.videoUrl,
        videoId: this.videoData.videoId,
        platform: this.videoData.platform,
        embedUrl: embedUrlString
      });

      this.isLoading = false;

      // Emit loaded event
      this.emitVideoEvent('loaded', {
        videoId: this.videoData.videoId,
        platform: this.videoData.platform
      });

    } catch (error: any) {
      console.error('❌ Failed to load video:', error);
      this.hasError = true;
      this.errorMessage = error.message || 'فشل في تحميل الفيديو';
      this.isLoading = false;

      this.emitVideoEvent('error', {
        error: error.message,
        originalUrl: this.videoUrl
      });
    }
  }

  /**
   * Handle iframe load event
   */
  onIframeLoad(): void {
    console.log('📺 Video iframe loaded');
    this.isLoading = false;
  }

  /**
   * Handle iframe error
   */
  onIframeError(): void {
    console.error('❌ Video iframe failed to load');
    this.hasError = true;
    this.errorMessage = 'فشل في تحميل مشغل الفيديو';
    this.isLoading = false;

    this.emitVideoEvent('error', {
      error: 'Iframe load failed'
    });
  }

  /**
   * Retry loading video
   */
  retryLoad(): void {
    if (this.videoUrl) {
      this.loadVideo();
    }
  }

  /**
   * Emit video event
   */
  private emitVideoEvent(type: VideoPlayerEvent['type'], data?: any): void {
    const event: VideoPlayerEvent = {
      type,
      timestamp: new Date(),
      data
    };

    this.videoEvent.emit(event);
  }

  /**
   * Get video thumbnail URL
   */
  getThumbnailUrl(): string {
    if (this.videoData?.videoId) {
      return this.videoIdExtractor.getThumbnailUrl(this.videoData.videoId, 'high');
    }
    return '';
  }

  /**
   * Check if video is YouTube
   */
  get isYouTube(): boolean {
    return this.videoData?.platform === 'youtube';
  }

  /**
   * Get video ID
   */
  get videoId(): string | null {
    return this.videoData?.videoId || null;
  }

  /**
   * Update video URL
   */
  updateVideoUrl(newUrl: string): void {
    this.videoUrl = newUrl;
    this.loadVideo();
  }

  /**
   * Update player config
   */
  updateConfig(newConfig: VideoPlayerConfig): void {
    this.config = { ...this.config, ...newConfig };
    if (this.videoUrl) {
      this.loadVideo();
    }
  }
}