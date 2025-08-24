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
  private baseUrl = '/api/uploads';

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

  /* Shared file upload logic for all types.*/
  private uploadFile(
    file: File,
    type: 'image' | 'video' | 'document' | 'receipt'
  ): Observable<FileUploadResponse | FileUploadProgress> {
    const formData = new FormData();
    formData.append('image', file);

    const url = `${this.baseUrl}/${type}`;
    const req = new HttpRequest('POST', url, formData, { reportProgress: true });
    return this.http.request(req).pipe(
      map((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress = Math.round((100 * event.loaded) / event.total);
              return { progress, loaded: event.loaded, total: event.total } as FileUploadProgress;
            }
            return { progress: 0, loaded: event.loaded, total: event.total ?? 0 } as FileUploadProgress;
          case HttpEventType.Response:
            return event.body as FileUploadResponse;
          default:
            return undefined;
        }
      }),
      filter((result): result is FileUploadResponse | FileUploadProgress => result !== undefined)
    );
  }
}