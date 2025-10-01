import { Component, Input, OnInit, TemplateRef, ContentChild } from '@angular/core';

@Component({
  selector: 'app-card-carousel',
  templateUrl: './card-carousel.component.html',
  styleUrls: ['./card-carousel.component.scss']
})
export class CardCarouselComponent<item = any> implements OnInit {

  @Input() items: item[] = [];
  @Input() sectionTitle: string = '';
  @Input() sectionHint: string = '';
  @Input() viewAllText: string = '';
  @Input() viewAllLink: string = '';

  // ✅ NEW: State management inputs
  @Input() isLoading: boolean = false;
  @Input() error: string = '';
  @Input() loadingMessage: string = 'جاري التحميل...';
  @Input() emptyMessage: string = 'لا توجد عناصر للعرض';
  @Input() emptyIcon: string = 'pi-inbox';
  @Input() retryButtonText: string = 'إعادة المحاولة';

  @ContentChild('cardTemplate') cardTemplate!: TemplateRef<any>;

  // ✅ NEW: Output events for retry functionality
  @Input() onRetry: (() => void) | null = null;

  ngOnInit() {
    console.log('Items received by carousel:', this.items);
    console.log('Carousel state:', {
      isLoading: this.isLoading,
      error: this.error,
      hasItems: this.items?.length > 0
    });
  }

  // ✅ NEW: Handle retry action
  handleRetry(): void {
    if (this.onRetry) {
      this.onRetry();
    }
  }

  // ✅ NEW: Check if we should show the carousel
  get shouldShowCarousel(): boolean {
    return !this.isLoading && !this.error && this.items && this.items.length > 0;
  }

  // ✅ NEW: Check if we should show empty state
  get shouldShowEmpty(): boolean {
    return !this.isLoading && !this.error && (!this.items || this.items.length === 0);
  }
}