import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
import {
  ActivationCode,
  CodeGenerateRequest,
  CodeGenerateResponse,
  CodeActivateRequest,
  CodeActivateResponse,
  CodeValidationResult,
  CodesListParams,
  CodeStats,
  CodeDetailsResponse
} from '../models/activation-code.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ActivationCodeService {
  private apiUrl = `${environment.apiUrl}/codes`;

  // Success state observable
  private activationSuccessSubject = new BehaviorSubject<CodeActivateResponse | null>(null);
  public onActivationSuccess = this.activationSuccessSubject.asObservable();

  constructor(private http: HttpClient) {}

  generateMultipleCodes(request: { lessonId: string; count: number }): Observable<ActivationCode[]> {
    return this.http.post<{ activationCodes: ActivationCode[] }>(`${this.apiUrl}/generate-multiple`, request)
      .pipe(
        map(response => response.activationCodes) // Extract the activationCodes array
      );
  }
  

  // ✅ FIXED: Updated validation based on your actual API codes
  validateCodeFormat(code: string): CodeValidationResult {
    console.log('🔍 Validating code format:', code);
    
    if (!code || typeof code !== 'string') {
      return {
        isValid: false,
        errors: ['يرجى إدخال رمز التفعيل']
      };
    }

    const trimmedCode = code.trim().toUpperCase();
    console.log('📝 Trimmed code:', trimmedCode);
    
    // ✅ FIXED: More lenient validation - just check basic structure
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Basic checks
    if (trimmedCode.length === 0) {
      errors.push('يرجى إدخال رمز التفعيل');
      return { isValid: false, errors, suggestions };
    }

    // Must start with LMS-
    if (!trimmedCode.startsWith('LMS-')) {
      errors.push('الرمز يجب أن يبدأ بـ LMS-');
    }

    // Check basic structure (has dashes in right places)
    const parts = trimmedCode.split('-');
    if (parts.length !== 3) {
      errors.push('تنسيق الرمز غير صحيح - يجب أن يحتوي على جزأين مفصولين بـ -');
      suggestions.push('الصيغة الصحيحة: LMS-XXXXXXXX-XXXXXXXX');
    } else {
      // Basic length checks - be more flexible
      if (parts[0] !== 'LMS') {
        errors.push('الجزء الأول يجب أن يكون LMS');
      }
      if (parts[1].length < 6 || parts[1].length > 10) {
        errors.push('الجزء الثاني يجب أن يكون بين 6-10 أحرف');
      }
      if (parts[2].length < 6 || parts[2].length > 10) {
        errors.push('الجزء الثالث يجب أن يكون بين 6-10 أحرف');
      }
    }

    const isValid = errors.length === 0;
    
    console.log('✅ Validation result:', {
      code: trimmedCode,
      isValid,
      errors,
      suggestions
    });

    return {
      isValid,
      errors,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  // ✅ FIXED: Better code formatting based on actual format
  formatCodeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove all non-alphanumeric characters and convert to uppercase
    let cleaned = input.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // If it doesn't start with LMS, add it
    if (cleaned.length > 0 && !cleaned.startsWith('LMS')) {
      cleaned = 'LMS' + cleaned;
    }

    // Format as LMS-XXXXXXXX-XXXXXXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 11) {
      return cleaned.substring(0, 3) + '-' + cleaned.substring(3);
    } else if (cleaned.length <= 19) {
      return cleaned.substring(0, 3) + '-' + cleaned.substring(3, 11) + '-' + cleaned.substring(11);
    } else {
      // Limit to 19 characters total (LMS + 8 + 8)
      return cleaned.substring(0, 3) + '-' + cleaned.substring(3, 11) + '-' + cleaned.substring(11, 19);
    }
  }

  // ✅ FIXED: Check if code exists and is valid (client-side pre-validation)
  async preValidateCode(code: string): Promise<{ exists: boolean; status?: string; message?: string }> {
    try {
      // This would be an API call to check if code exists without activating it
      // For now, we'll just do format validation
      const validation = this.validateCodeFormat(code);
      if (!validation.isValid) {
        return { exists: false, status: 'invalid', message: 'تنسيق الرمز غير صحيح' };
      }
      
      return { exists: true, status: 'unknown' }; // Would be determined by actual API call
    } catch (error) {
      return { exists: false, status: 'error', message: 'خطأ في التحقق من الرمز' };
    }
  }

  // API Methods
  generateCode(request: CodeGenerateRequest): Observable<CodeGenerateResponse> {
    return this.http.post<CodeGenerateResponse>(`${this.apiUrl}/generate`, request);
  }

  activateCode(request: CodeActivateRequest): Observable<CodeActivateResponse> {
    return this.http.post<CodeActivateResponse>(`${this.apiUrl}/activate`, request);
  }

  getCodes(params: CodesListParams): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}`, { params: params as any });
  }

  getStats(): Observable<CodeStats> {
    return this.http.get<CodeStats>(`${this.apiUrl}/stats/overview`);
  }

  getCodeDetails(codeId: string): Observable<CodeDetailsResponse> {
    return this.http.get<CodeDetailsResponse>(`${this.apiUrl}/${codeId}`);
  }

  updateCode(codeId: string, update: Partial<ActivationCode>): Observable<ActivationCode> {
    return this.http.patch<ActivationCode>(`${this.apiUrl}/${codeId}`, update);
  }

  deleteCode(codeId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${codeId}`);
  }

  // Status helpers
  getCodeStatusLabel(code: ActivationCode): { label: string; color: string } {
    const now = new Date();
    const expiryDate = new Date(code.expiresAt);
    const validFromDate = new Date(code.validFrom);

    if (!code.isActive) {
      return { label: 'معطل', color: 'secondary' };
    }

    if (now < validFromDate) {
      return { label: 'لم يحن وقته', color: 'warning' };
    }

    if (now > expiryDate) {
      return { label: 'منتهي الصلاحية', color: 'danger' };
    }

    if (code.currentUses >= code.maxUses) {
      return { label: 'مستنفد', color: 'danger' };
    }

    return { label: 'نشط', color: 'success' };
  }

  // Cross-component communication
  setActivationSuccess(response: CodeActivateResponse): void {
    this.activationSuccessSubject.next(response);
  }

  clearActivationSuccess(): void {
    this.activationSuccessSubject.next(null);
  }

  // ✅ NEW: Helper to validate specific codes from your list
  isKnownValidCode(code: string): boolean {
    const knownCodes = [
      'LMS-44622760-MFRLT2UP',
      'LMS-99CC6DD0-MFRKV2BS', 
      'LMS-7F9919A1-MFRK7P65',
      'LMS-DE84CD21-MFR3FH3D',
      'LMS-CE1EDFB2-MFKL5P7U'
    ];
    
    return knownCodes.includes(code.toUpperCase());
  }
}