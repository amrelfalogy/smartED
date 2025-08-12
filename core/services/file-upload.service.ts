import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private baseUrl = '/api/files';

  constructor(private http: HttpClient) {}

  /**
   * Upload an image file
   */
  uploadImage(file: File): Observable<FileUploadResponse | FileUploadProgress> {
    return this.uploadFile(file, 'image');
  }

  /**
   * Upload a video file
   */
  uploadVideo(file: File): Observable<FileUploadResponse | FileUploadProgress> {
    return this.uploadFile(file, 'video');
  }

  /**
   * Upload a document file
   */
  uploadDocument(file: File): Observable<FileUploadResponse | FileUploadProgress> {
    return this.uploadFile(file, 'document');
  }

  /**
   * Delete a file by URL
   */
  deleteFile(fileUrl: string): Observable<void> {
    const url = `${this.baseUrl}/delete`;
    return this.http.post<void>(url, { fileUrl });
  }

  /**
   * Generic file upload method with progress tracking
   */
  private uploadFile(file: File, type: string): Observable<FileUploadResponse | FileUploadProgress> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const req = new HttpRequest('POST', `${this.baseUrl}/upload`, formData, {
      reportProgress: true
    });

    return this.http.request(req).pipe(
      map(event => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress = Math.round(100 * event.loaded / event.total);
              return {
                progress,
                loaded: event.loaded,
                total: event.total
              } as FileUploadProgress;
            }
            break;
          case HttpEventType.Response:
            return event.body as FileUploadResponse;
        }
        throw new Error('Unexpected event type');
      })
    );
  }
}
