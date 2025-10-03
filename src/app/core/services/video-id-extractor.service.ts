import { Injectable } from '@angular/core';

export interface VideoIdResult {
  videoId: string | null;
  platform: 'youtube' | 'vimeo' | 'unknown';
  isValid: boolean;
  originalUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class VideoIdExtractorService {

  constructor() {}

  extractVideoId(url: string): VideoIdResult {
    const result: VideoIdResult = {
      videoId: null,
      platform: 'unknown',
      isValid: false,
      originalUrl: url
    };

    if (!url || typeof url !== 'string') {
      return result;
    }

    // Clean the URL
    const cleanUrl = url.trim();
    
    // YouTube patterns
    const youtubePatterns = [
      // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      // Embed URL: https://www.youtube.com/embed/VIDEO_ID
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      // Old format: https://www.youtube.com/v/VIDEO_ID
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      // Mobile: https://m.youtube.com/watch?v=VIDEO_ID
      /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      // Short URL: https://youtu.be/VIDEO_ID
      /youtu\.be\/([a-zA-Z0-9_-]{11})/
    ];

    // Check if it's a YouTube URL
    for (const pattern of youtubePatterns) {
      const match = cleanUrl.match(pattern);
      if (match && match[1]) {
        result.videoId = match[1];
        result.platform = 'youtube';
        result.isValid = this.isValidYouTubeVideoId(match[1]);
        break;
      }
    }

    console.log('🔍 Video ID extraction:', {
      originalUrl: url,
      extractedId: result.videoId,
      platform: result.platform,
      isValid: result.isValid
    });

    return result;
  }

  buildSecureEmbedUrl(videoId: string, options?: {
    autoplay?: boolean;
    controls?: boolean;
    showInfo?: boolean;
    modestBranding?: boolean;
    relatedVideos?: boolean;
    keyboardDisabled?: boolean;
  }): string {
    if (!videoId || !this.isValidYouTubeVideoId(videoId)) {
      throw new Error('Invalid YouTube video ID');
    }

    const defaultOptions = {
      autoplay: false,
      controls: true,
      showInfo: false,
      modestBranding: true,
      relatedVideos: false,
      keyboardDisabled: true
    };

    const finalOptions = { ...defaultOptions, ...options };

    const params = new URLSearchParams({
      // Security and branding
      rel: '0',
      showinfo: '0',
      modestbranding:'0',
      
      // Controls
      controls: finalOptions.controls ? '1' : '0',
      disablekb: finalOptions.keyboardDisabled ? '1' : '0',
      
      // Playback
      autoplay: finalOptions.autoplay ? '1' : '0',
      
      
      fs: '1', // Allow fullscreen
      cc_load_policy: '0', // Don't force captions
      iv_load_policy: '3', // Hide annotations
      loop: '0', // Don't loop
      enablejsapi: '1', // Enable JS API for additional control

      // ✅ NEW: Enhanced security parameters
      origin: window.location.origin, // Restrict to our domain
      playsinline: '1', // Force inline playback on mobile
      widget_referrer: window.location.origin // Set referrer
    });

    const embedUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    
    console.log('🔗 Built secure embed URL:', {
      videoId,
      options: finalOptions,
      embedUrl
    });

    return embedUrl;
  }

  /**
   * Validate YouTube video ID format
   */
  private isValidYouTubeVideoId(videoId: string): boolean {
    if (!videoId || typeof videoId !== 'string') {
      return false;
    }

    // YouTube video IDs are exactly 11 characters long
    // and contain only alphanumeric characters, underscores, and hyphens
    const youtubeIdPattern = /^[a-zA-Z0-9_-]{11}$/;
    return youtubeIdPattern.test(videoId);
  }

  /**
   * Check if URL is a YouTube URL (any format)
   */
  isYouTubeUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const youtubeHosts = [
      'youtube.com',
      'www.youtube.com',
      'm.youtube.com',
      'youtu.be'
    ];

    try {
      const urlObj = new URL(url);
      return youtubeHosts.includes(urlObj.hostname.toLowerCase());
    } catch {
      return false;
    }
  }

  /**
   * Get YouTube thumbnail URL
   */
  getThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'): string {
    if (!this.isValidYouTubeVideoId(videoId)) {
      throw new Error('Invalid YouTube video ID');
    }

    const qualityMap = {
      default: 'default.jpg',
      medium: 'mqdefault.jpg',
      high: 'hqdefault.jpg',
      standard: 'sddefault.jpg',
      maxres: 'maxresdefault.jpg'
    };

    return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`;
  }

  /**
   * Extract multiple video IDs from text containing multiple URLs
   */
  extractMultipleVideoIds(text: string): VideoIdResult[] {
    if (!text || typeof text !== 'string') {
      return [];
    }

    // Find all URLs in the text
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlPattern) || [];

    return urls
      .map(url => this.extractVideoId(url))
      .filter(result => result.isValid);
  }
}