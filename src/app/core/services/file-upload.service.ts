// ✅ CLEANED UP: file-upload.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, filter, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface FileUploadResponse {
  url: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  duration?: number; // For videos
}

export interface FileUploadProgress {
  progress: number;
  loaded: number;
  total: number;
}

export interface UploadValidation {
  isValid: boolean;
  error?: string;
  maxSize?: number;
  allowedTypes?: string[];
}

@Injectable({ providedIn: 'root' })
export class FileUploadService {
  private baseUrl = `${environment.apiUrl}/uploads`;

  // ✅ File type configurations
  private readonly FILE_CONFIGS = {
    image: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fieldName: 'image'
    },
    video: {
      maxSize: 2000 * 1024 * 1024, // 2000MB
      allowedTypes: ['video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/mkv'],
      fieldName: 'video'
    },
    document: {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      fieldName: 'document'
    },
    receipt: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      fieldName: 'image' // Receipts use same endpoint as images
    }
  };

  constructor(private http: HttpClient) {}

  // ✅ Main upload methods
  uploadImage(file: File): Observable<FileUploadResponse | FileUploadProgress> {
    return this.uploadFile(file, 'image');
  }

  uploadVideo(file: File): Observable<FileUploadResponse | FileUploadProgress> {
    return this.uploadFile(file, 'video');
  }

  uploadDocument(file: File): Observable<FileUploadResponse | FileUploadProgress> {
    return this.uploadFile(file, 'document');
  }

  uploadReceipt(file: File): Observable<FileUploadResponse | FileUploadProgress> {
    return this.uploadFile(file, 'receipt');
  }

  // ✅ File validation
  validateFile(file: File, type: keyof typeof this.FILE_CONFIGS): UploadValidation {
    const config = this.FILE_CONFIGS[type];
    
    if (!config) {
      return { isValid: false, error: 'نوع الملف غير مدعوم' };
    }

    // Check file size
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      return { 
        isValid: false, 
        error: `حجم الملف كبير جداً. الحد الأقصى ${maxSizeMB} ميجابايت`,
        maxSize: config.maxSize
      };
    }

    // Check file type
    if (!config.allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: `نوع الملف غير مدعوم. الأنواع المسموحة: ${this.getReadableFileTypes(config.allowedTypes)}`,
        allowedTypes: config.allowedTypes
      };
    }

    return { isValid: true };
  }

  // ✅ Get readable file types for error messages
  private getReadableFileTypes(mimeTypes: string[]): string {
    const typeMap: { [key: string]: string } = {
      'image/jpeg': 'JPEG',
      'image/png': 'PNG', 
      'image/gif': 'GIF',
      'image/webp': 'WebP',
      'video/mp4': 'MP4',
      'video/webm': 'WebM',
      'video/avi': 'AVI',
      'video/mov': 'MOV',
      'video/mkv': 'MKV',
      'application/pdf': 'PDF',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'text/plain': 'TXT'
    };

    return mimeTypes.map(type => typeMap[type] || type).join(', ');
  }

  // ✅ Delete file
  deleteFile(fileUrl: string): Observable<void> {
    return this.http.request<void>('DELETE', `${this.baseUrl}`, { 
      body: { fileUrl } 
    }).pipe(
      catchError(error => {
        console.error('❌ Delete file error:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ Get upload statistics
  getUploadStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stats`).pipe(
      catchError(error => {
        console.error('❌ Get upload stats error:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ Get file info (useful for validation before upload)
  getFileInfo(file: File): { 
    name: string; 
    size: string; 
    type: string; 
    lastModified: Date;
  } {
    return {
      name: file.name,
      size: this.formatFileSize(file.size),
      type: file.type,
      lastModified: new Date(file.lastModified)
    };
  }

  // ✅ Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 بايت';
    
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ✅ Core upload method
 private uploadFile(
  file: File,
  type: keyof typeof this.FILE_CONFIGS
): Observable<FileUploadResponse | FileUploadProgress> {
  
  const validation = this.validateFile(file, type);
  if (!validation.isValid) {
    return throwError(() => new Error(validation.error));
  }

  const config = this.FILE_CONFIGS[type];
  const formData = new FormData();
  
  // ✅ Use correct field name for your backend
  formData.append(config.fieldName, file);
  
  // ✅ Your backend might expect these fields
  formData.append('originalName', file.name);
  formData.append('fileSize', file.size.toString());
  formData.append('fileType', file.type);
  
  // ✅ Use your exact backend endpoints
  const url = `${this.baseUrl}/${type}`; // This maps to /uploads/video, /uploads/document etc
  
  console.log(`🚀 Uploading ${type}:`, {
    url,
    fieldName: config.fieldName,
    fileName: file.name,
    fileSize: this.formatFileSize(file.size),
    fileType: file.type
  });
  
  const req = new HttpRequest('POST', url, formData, { 
    reportProgress: true 
  });
  
  return this.http.request(req).pipe(
    map((event: HttpEvent<any>) => {
      switch (event.type) {
        case HttpEventType.UploadProgress:
          if (event.total) {
            const progress = Math.round((100 * event.loaded) / event.total);
            return { 
              progress, 
              loaded: event.loaded, 
              total: event.total 
            } as FileUploadProgress;
          }
          return { 
            progress: 0, 
            loaded: event.loaded, 
            total: event.total ?? 0 
          } as FileUploadProgress;

        case HttpEventType.Response:
          console.log(`✅ ${type} upload response:`, event.body);
          
          // ✅ Handle your backend response format
          const body = event.body;
          
          if (body?.url) {
            return { 
              url: body.url,
              fileName: body.fileName || body.originalName || file.name,
              fileSize: body.fileSize || file.size,
              fileType: body.fileType || file.type,
              duration: body.duration // For videos
            } as FileUploadResponse;
          } else if (body?.fileUrl) {
            return { 
              url: body.fileUrl,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type
            } as FileUploadResponse;
          } else if (body?.path) {
            return { 
              url: body.path,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type
            } as FileUploadResponse;
          } else if (typeof body === 'string') {
            return { 
              url: body,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type
            } as FileUploadResponse;
          } else {
            throw new Error('صيغة استجابة رفع الملف غير صحيحة');
          }

        default:
          return undefined;
      }
    }),
    filter((result): result is FileUploadResponse | FileUploadProgress => result !== undefined),
    catchError(error => {
      console.error(`❌ ${type} upload error:`, error);
      
      let errorMessage = 'حدث خطأ أثناء رفع الملف';
      
      if (error.status === 413) {
        errorMessage = 'حجم الملف كبير جداً';
      } else if (error.status === 415) {
        errorMessage = 'نوع الملف غير مدعوم';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'بيانات الملف غير صحيحة';
      } else if (error.status === 500) {
        errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً';
      } else if (error.status === 0) {
        errorMessage = 'فشل في الاتصال بالخادم';
      }
      
      return throwError(() => new Error(errorMessage));
    })
  );
}

  // ✅ Utility method to check if file is image
  isImageFile(file: File): boolean {
    return this.FILE_CONFIGS.image.allowedTypes.includes(file.type);
  }

  // ✅ Utility method to check if file is video
  isVideoFile(file: File): boolean {
    return this.FILE_CONFIGS.video.allowedTypes.includes(file.type);
  }

  // ✅ Utility method to check if file is document
  isDocumentFile(file: File): boolean {
    return this.FILE_CONFIGS.document.allowedTypes.includes(file.type);
  }

  // ✅ Get max file size for type
  getMaxFileSize(type: keyof typeof this.FILE_CONFIGS): number {
    return this.FILE_CONFIGS[type]?.maxSize || 0;
  }

  // ✅ Get allowed file types for type
  getAllowedFileTypes(type: keyof typeof this.FILE_CONFIGS): string[] {
    return this.FILE_CONFIGS[type]?.allowedTypes || [];
  }
}