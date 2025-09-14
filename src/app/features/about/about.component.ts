import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  stats = [
    { icon: 'pi-users', label: 'طلاب مسجلون', value: 1050, hint: '+ طالب' },
    { icon: 'pi-microphone', label: 'حصص مباشرة', value: 36, hint: '+ حصة' },
    { icon: 'pi-video', label: 'دروس مسجلة', value: 999, hint: '+ درس' },
    { icon: 'pi-user', label: 'معلمون نشطون', value: 30, hint: '+ معلم' }
  ];

  values = [
    { icon: 'pi-shield', title: 'الثقة والجودة', desc: 'محتوى تعليمي عالي الجودة بمعايير واضحة ومراجعات مستمرة.' },
    { icon: 'pi-compass', title: 'المرونة', desc: 'خطط دفع مرنة ودروس مسجلة ومباشرة لتناسب وقتك.' },
    { icon: 'pi-heart', title: 'الدعم الإنساني', desc: 'فريق دعم متجاوب لمساعدتك خطوة بخطوة.' },
    { icon: 'pi-globe', title: 'الوصول للجميع', desc: 'التعلّم متاح من أي مكان وبأداء ممتاز عبر الأجهزة.' }
  ];

  steps = [
    { icon: 'pi-user-plus', title: 'إنشاء حساب', desc: 'سجّل مجانًا وفعّل بريدك الإلكتروني لبدء رحلتك التعليمية.' },
    { icon: 'pi-book', title: 'اختيار المواد', desc: 'تصفّح المواد بحسب المرحلة والسنة الدراسية.' },
    { icon: 'pi-credit-card', title: 'اختيار الخطة', desc: 'ادفع شهريًا، فصليًا، أو لكل درس حسب احتياجك.' },
    { icon: 'pi-play-circle', title: 'ابدأ التعلّم', desc: 'تابع الحصص المباشرة أو الدروس المسجلة وراقب تقدّمك.' }
  ];
}