import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CodeDetailsResponse, CodeUsageHistory } from 'src/app/core/models/activation-code.model';
import { ActivationCodeService } from 'src/app/core/services/activation-code.service';
import { LessonService } from 'src/app/core/services/lesson.service';

@Component({
  selector: 'app-code-details-modal',
  templateUrl: './code-details-modal.component.html',
  styleUrls: ['./code-details-modal.component.scss']
})
export class CodeDetailsModalComponent implements OnInit {
  @Input() isVisible = false;
  @Input() codeDetails: CodeDetailsResponse | null = null;
  @Output() close = new EventEmitter<void>();

  // ✅ SIMPLIFIED: Only lesson name
  lessonName: string = '';
  isLoadingLessonName = false;

  constructor(
    private activationService: ActivationCodeService,
    private lessonService: LessonService
  ) {}

  ngOnInit(): void {
    if (this.codeDetails?.code.lessonId) {
      this.loadLessonName();
    }
  }

  // ✅ SIMPLIFIED: Load only lesson name
  private async loadLessonName(): Promise<void> {
    if (!this.codeDetails?.code.lessonId) return;

    this.isLoadingLessonName = true;

    try {
      const lessonResponse = await this.lessonService.getLessonById(this.codeDetails.code.lessonId).toPromise();
      const lesson = lessonResponse;
      this.lessonName = lesson?.title || 'غير متاح';
    } catch (error) {
      console.error('Failed to load lesson name:', error);
      this.lessonName = 'غير متاح';
    } finally {
      this.isLoadingLessonName = false;
    }
  }

  onClose(): void {
    this.close.emit();
  }

  copyCodeToClipboard(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      // Success feedback could be added here
    });
  }

  getCodeStatus() {
    if (!this.codeDetails?.code) return { label: 'غير محدد', color: 'secondary' };
    return this.activationService.getCodeStatusLabel(this.codeDetails.code);
  }

  getUsagePercentage(): number {
    if (!this.codeDetails?.code) return 0;
    const code = this.codeDetails.code;
    return code.maxUses > 0 ? (code.currentUses / code.maxUses) * 100 : 0;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getContentTypeLabel(type: string): string {
    switch (type) {
      case 'lesson': return 'درس';
      case 'subject': return 'مادة';
      case 'unit': return 'وحدة';
      default: return type;
    }
  }

  trackByUsageId(index: number, usage: CodeUsageHistory): string {
    return usage.id;
  }
}