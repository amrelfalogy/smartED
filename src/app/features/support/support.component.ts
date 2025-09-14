import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
// If you keep environment files, uncomment the next line and set supportWhatsAppNumber there
// import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class SupportComponent {
  // Prefer from environment; fallback here
  // whatsappNumber must be in E.164 without '+', e.g., 201234567890
  // whatsappNumber = environment.supportWhatsAppNumber;
  whatsappNumber = '201016852128';

  isOpening = false;
  copyDone = false;

  categories = [
    { value: 'payments', label: 'مشاكل المدفوعات' },
    { value: 'account', label: 'الحساب وتسجيل الدخول' },
    { value: 'technical', label: 'مشكلة تقنية' },
    { value: 'courses', label: 'المواد/الدروس' },
    { value: 'other', label: 'أخرى' }
  ];

  quickTopics: Array<{ icon: string; title: string; category: string; subject: string; message: string }> = [
    {
      icon: 'pi-credit-card',
      title: 'استفسار عن دفعة',
      category: 'payments',
      subject: 'مشكلة في تأكيد الدفعة',
      message: 'واجهت مشكلة في تأكيد الدفعة. رقم العملية (إن وجد): _____. طريقة الدفع: _____. الرجاء المساعدة.'
    },
    {
      icon: 'pi-key',
      title: 'تسجيل الدخول',
      category: 'account',
      subject: 'لا أستطيع تسجيل الدخول',
      message: 'أواجه مشكلة في تسجيل الدخول إلى حسابي. البريد: _____. الرجاء إرشادي للحل.'
    },
    {
      icon: 'pi-cog',
      title: 'عطل تقني',
      category: 'technical',
      subject: 'مشكلة تقنية أثناء مشاهدة الدروس',
      message: 'ظهرت مشكلة تقنية أثناء مشاهدة الدروس (نوع الجهاز/المتصفح: _____). الرجاء المساعدة.'
    },
    {
      icon: 'pi-book',
      title: 'استفسار عن مادة',
      category: 'courses',
      subject: 'استفسار بخصوص مادة/درس',
      message: 'أرغب بالاستفسار عن مادة/درس: _____. المرحلة/الصف: _____. طريقة الاشتراك: شهري/فصلي/درس.'
    }
  ];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    category: ['payments', [Validators.required]],
    orderId: [''],
    subject: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    consent: [true, [Validators.requiredTrue]]
  });

  constructor(private fb: FormBuilder) {}

  applyQuickTopic(topic: { category: string; subject: string; message: string }) {
    this.form.patchValue({
      category: topic.category,
      subject: topic.subject,
      message: topic.message
    });
    this.copyDone = false;
  }

  get composedMessage(): string {
    const v = this.form.value;
    const parts = [
      'مرحباً فريق الدعم، أحتاج مساعدة.',
      `الاسم: ${v.name || ''}`,
      v.phone ? `الهاتف/واتساب: ${v.phone}` : '',
      `الفئة: ${this.categories.find(c => c.value === v.category)?.label || ''}`,
      v.orderId ? `رقم الطلب/الدفع: ${v.orderId}` : '',
      `الموضوع: ${v.subject || ''}`,
      `التفاصيل: ${v.message || ''}`
    ].filter(Boolean);
    return parts.join('\n');
  }

  get whatsappHref(): string {
    const text = encodeURIComponent(this.composedMessage);
    return `https://wa.me/${this.whatsappNumber}?text=${text}`;
  }

  openWhatsApp(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.copyDone = false;
    this.isOpening = true;

    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent || '');
    const text = encodeURIComponent(this.composedMessage);

    const mobileScheme = `whatsapp://send?phone=${this.whatsappNumber}&text=${text}`;
    const webUrl = `https://wa.me/${this.whatsappNumber}?text=${text}`;

    // Try mobile scheme first if mobile, else go to web
    const targetUrl = isMobile ? mobileScheme : webUrl;
    window.open(targetUrl, '_blank', 'noopener');

    setTimeout(() => (this.isOpening = false), 600);
  }

  async copyMessage(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.composedMessage);
      this.copyDone = true;
      setTimeout(() => (this.copyDone = false), 2000);
    } catch {
      this.copyDone = false;
    }
  }
}