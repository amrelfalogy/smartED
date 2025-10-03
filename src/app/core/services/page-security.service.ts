import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SecurityEvent {
  type: 'right-click' | 'keyboard-shortcut' | 'dev-tools' | 'text-selection' | 'copy-attempt';
  timestamp: Date;
  details?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PageSecurityService {
  private isSecurityEnabled = false;
  private securityEvents$ = new BehaviorSubject<SecurityEvent[]>([]);
  private listeners: Array<() => void> = [];
  private devToolsDetectionInterval?: number;

  // Blocked keyboard shortcuts
  private blockedShortcuts = [
    { key: 'F12' }, // Dev tools
    { key: 'I', ctrl: true, shift: true }, // Dev tools
    { key: 'J', ctrl: true, shift: true }, // Console
    { key: 'C', ctrl: true, shift: true }, // Dev tools
    { key: 'U', ctrl: true }, // View source
    { key: 'S', ctrl: true }, // Save page
    { key: 'A', ctrl: true }, // Select all
    { key: 'P', ctrl: true }, // Print
    { key: 'F', ctrl: true }, // Find
    { key: 'R', ctrl: true }, // Refresh (in some contexts)
  ];

  constructor() {}

  /**
   * Enable security restrictions on the page
   */
  enableSecurity(): void {
    if (this.isSecurityEnabled) {
      return;
    }

    console.log('🔒 Enabling page security restrictions');
    
    this.isSecurityEnabled = true;
    this.addEventListeners();
    this.startDevToolsDetection();
    this.disableTextSelection();
    this.disableImageDragging();
  }

  /**
   * Disable security restrictions
   */
  disableSecurity(): void {
    if (!this.isSecurityEnabled) {
      return;
    }

    console.log('🔓 Disabling page security restrictions');
    
    this.isSecurityEnabled = false;
    this.removeEventListeners();
    this.stopDevToolsDetection();
    this.enableTextSelection();
    this.enableImageDragging();
  }

  /**
   * Add event listeners for security
   */
  private addEventListeners(): void {
    // Disable right-click context menu
    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
      this.logSecurityEvent({
        type: 'right-click',
        timestamp: new Date(),
        details: 'Right-click attempted'
      });
      return false;
    };

    // Disable keyboard shortcuts
    const disableKeyboardShortcuts = (e: KeyboardEvent) => {
      const isBlocked = this.blockedShortcuts.some(shortcut => {
        const keyMatch = e.key === shortcut.key;
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        
        return keyMatch && ctrlMatch && shiftMatch;
      });

      if (isBlocked) {
        e.preventDefault();
        e.stopPropagation();
        this.logSecurityEvent({
          type: 'keyboard-shortcut',
          timestamp: new Date(),
          details: `Blocked shortcut: ${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`
        });
        return false;
      }
      return true;
    };

    // Disable text selection
    const disableSelection = (e: Event) => {
      e.preventDefault();
      this.logSecurityEvent({
        type: 'text-selection',
        timestamp: new Date(),
        details: 'Text selection attempted'
      });
      return false;
    };

    // Disable copy attempts
    const disableCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      this.logSecurityEvent({
        type: 'copy-attempt',
        timestamp: new Date(),
        details: 'Copy operation attempted'
      });
      return false;
    };

    // Add listeners
    document.addEventListener('contextmenu', disableRightClick);
    document.addEventListener('keydown', disableKeyboardShortcuts);
    document.addEventListener('selectstart', disableSelection);
    document.addEventListener('copy', disableCopy);
    document.addEventListener('cut', disableCopy);

    // Store for cleanup
    this.listeners = [
      () => document.removeEventListener('contextmenu', disableRightClick),
      () => document.removeEventListener('keydown', disableKeyboardShortcuts),
      () => document.removeEventListener('selectstart', disableSelection),
      () => document.removeEventListener('copy', disableCopy),
      () => document.removeEventListener('cut', disableCopy),
    ];
  }

  /**
   * Remove all event listeners
   */
  private removeEventListeners(): void {
    this.listeners.forEach(removeListener => removeListener());
    this.listeners = [];
  }

  /**
   * Start developer tools detection
   */
  private startDevToolsDetection(): void {
    let devtools = {
      open: false,
      orientation: null as string | null
    };

    const threshold = 160;

    const detect = () => {
      if (window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          this.logSecurityEvent({
            type: 'dev-tools',
            timestamp: new Date(),
            details: 'Developer tools opened'
          });
          this.onDevToolsOpened();
        }
      } else {
        devtools.open = false;
      }
    };

    // Check every 500ms
    this.devToolsDetectionInterval = window.setInterval(detect, 500);
  }

  /**
   * Stop developer tools detection
   */
  private stopDevToolsDetection(): void {
    if (this.devToolsDetectionInterval) {
      clearInterval(this.devToolsDetectionInterval);
      this.devToolsDetectionInterval = undefined;
    }
  }

  /**
   * Handle developer tools opened
   */
  private onDevToolsOpened(): void {
    console.warn('🚨 Developer tools detected! Video access may be restricted.');
    
    // You can add additional actions here:
    // - Show warning modal
    // - Pause video
    // - Log to analytics
    // - Notify server
  }

  /**
   * Disable text selection on the page
   */
  private disableTextSelection(): void {
    const style = document.createElement('style');
    style.id = 'security-no-select';
    style.innerHTML = `
      .security-protected,
      .security-protected * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Enable text selection
   */
  private enableTextSelection(): void {
    const style = document.getElementById('security-no-select');
    if (style) {
      style.remove();
    }
  }

  /**
   * Disable image dragging
   */
  private disableImageDragging(): void {
    const style = document.createElement('style');
    style.id = 'security-no-drag';
    style.innerHTML = `
      .security-protected img,
      .security-protected video,
      .security-protected iframe {
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Enable image dragging
   */
  private enableImageDragging(): void {
    const style = document.getElementById('security-no-drag');
    if (style) {
      style.remove();
    }
  }

  /**
   * Log security event
   */
  private logSecurityEvent(event: SecurityEvent): void {
    const currentEvents = this.securityEvents$.value;
    this.securityEvents$.next([...currentEvents, event]);
    
    console.warn('🔒 Security Event:', event);
  }

  /**
   * Get security events observable
   */
  getSecurityEvents() {
    return this.securityEvents$.asObservable();
  }

  /**
   * Check if security is enabled
   */
  isEnabled(): boolean {
    return this.isSecurityEnabled;
  }

  /**
   * Apply security class to element
   */
  protectElement(element: HTMLElement): void {
    element.classList.add('security-protected');
  }

  /**
   * Remove security class from element
   */
  unprotectElement(element: HTMLElement): void {
    element.classList.remove('security-protected');
  }
}