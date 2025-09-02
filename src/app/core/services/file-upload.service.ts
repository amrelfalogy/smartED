import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';

export interface FileUploadResponse {
  url: string;
  fileName?: string;
  fileSize?: number;
}

export interface FileUploadProgress {
  progress: number;
  loaded: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class FileUploadService {
  private baseUrl = '/api/uploads'; // ✅ Changed from '/api/api/uploads' to '/api/uploads'

  constructor(private http: HttpClient) {}

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

  deleteFile(fileUrl: string): Observable<void> {
    return this.http.request<void>('DELETE', `${this.baseUrl}`, { body: { fileUrl } });
  }

  getUploadStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stats`);
  }

 // ...existing code...

private uploadFile(
  file: File,
  type: 'image' | 'video' | 'document' | 'receipt'
): Observable<FileUploadResponse | FileUploadProgress> {
  const formData = new FormData();
  
  // ✅ Try different field names based on endpoint type
  if (type === 'image') {
    formData.append('image', file); // Backend might expect 'image' for /uploads/image
  } else if (type === 'video') {
    formData.append('video', file); // Backend might expect 'video' for /uploads/video
  } else if (type === 'document') {
    formData.append('document', file); // Backend might expect 'document' for /uploads/document
  } else {
    formData.append('file', file); // Fallback to 'file'
  }
  
  const url = `${this.baseUrl}/${type}`;
  console.log('🚀 FileUploadService - Making request to:', url);
  console.log('📁 File details:', {
    name: file.name,
    size: file.size,
    type: file.type,
    formDataKey: type === 'image' ? 'image' : type === 'video' ? 'video' : type === 'document' ? 'document' : 'file'
  });
  
  const req = new HttpRequest('POST', url, formData, { 
    reportProgress: true
  });
  
  return this.http.request(req).pipe(
    map((event: HttpEvent<any>) => {
      console.log('📥 HTTP Event received:', event.type, event);
      
      switch (event.type) {
        case HttpEventType.Sent:
          console.log('📡 Request sent');
          return undefined;
        case HttpEventType.UploadProgress:
          if (event.total) {
            const progress = Math.round((100 * event.loaded) / event.total);
            console.log(`📊 Upload progress: ${progress}% (${event.loaded}/${event.total})`);
            return { progress, loaded: event.loaded, total: event.total } as FileUploadProgress;
          }
          return { progress: 0, loaded: event.loaded, total: event.total ?? 0 } as FileUploadProgress;
        case HttpEventType.Response:
          console.log('✅ Response received:', event.body);
          return event.body as FileUploadResponse;
        default:
          console.log('ℹ️ Other event type:', event.type);
          return undefined;
      }
    }),
    filter((result): result is FileUploadResponse | FileUploadProgress => result !== undefined)
  );
}

// ...existing code...
}