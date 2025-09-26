// ✅ COMPLETE UPDATE: lesson.service.ts - Fixed endpoints and improved error handling
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Lesson } from 'src/app/core/models/course-complete.model';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface CreateLessonDto {
  title: string;
  description: string;
  content?: string | null;
  unitId: string;
  order: number;
  duration?: number | null;
  lessonType: Lesson['lessonType'];
  difficulty: Lesson['difficulty'];
  isFree?: boolean;
  isActive?: boolean;
  status?: string;
  price?: number | null;
  currency?: string | null;
  academicYearId?: string | null;
  studentYearId?: string | null;
  thumbnail?: string | null;
  
  // Media
  videoUrl?: string | null;
  document?: string | null;
  pdfUrl?: string | null;
  pdfFileName?: string | null;
  pdfFileSize?: number | null;

  // Live fields (only when lessonType = 'live')
  zoomUrl?: string | null;
  zoomMeetingId?: string | null;
  zoomPasscode?: string | null;
  scheduledAt?: string | null;
}

export interface UpdateLessonDto extends Partial<CreateLessonDto> {}

// ✅ Backend response interfaces
interface CreateLessonResponse {
  message: string;
  lesson: any; // Raw lesson data
  optimizations?: any;
}

interface GetLessonResponse {
  lesson: any; // Raw lesson data
  videos: any[];
  quizzes: any[];
  assignments: any[];
}

// ✅ NEW: Lessons list response interface
interface GetLessonsResponse {
  lessons: any[];
  pagination?: {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
  };
}

@Injectable({ providedIn: 'root' })
export class LessonService {
  private baseUrl = `${environment.apiUrl}/content/lessons`;

  constructor(private http: HttpClient) {}

  // ✅ FIXED: Use correct endpoint with unitId query parameter
  getLessonsByUnit(unitId: string): Observable<Lesson[]> {
    console.log('🔍 Getting lessons for unit:', unitId);
    
    // ✅ Method 1: Try with unitId query parameter
    const params = new HttpParams().set('unitId', unitId);
    
    return this.http.get<GetLessonsResponse | Lesson[]>(this.baseUrl, { params }).pipe(
      map((response: GetLessonsResponse | Lesson[]) => {
        console.log(`🔍 Raw lessons response for unit ${unitId}:`, response);
        
        // Handle different response formats
        let rawLessons: any[] = [];
        
        if (Array.isArray(response)) {
          // Direct array response
          rawLessons = response;
        } else if (response && Array.isArray(response.lessons)) {
          // Wrapped response with lessons array
          rawLessons = response.lessons;
        } else {
          // Fallback - empty array
          rawLessons = [];
        }
        
        console.log(`✅ Found ${rawLessons.length} lessons for unit ${unitId}`);
        return rawLessons.map(lesson => this.normalizeLessonData(lesson));
      }),
      catchError((error) => {
        console.warn(`⚠️ Query parameter method failed for unit ${unitId}:`, error);
        // ✅ Fallback to client-side filtering
        return this.getLessonsByUnitClientSide(unitId);
      })
    );
  }

  // ✅ NEW: Get all lessons (for fallback filtering)
  getAllLessons(): Observable<Lesson[]> {
    return this.http.get<GetLessonsResponse | Lesson[]>(this.baseUrl).pipe(
      map((response: GetLessonsResponse | Lesson[]) => {
        console.log('🔍 All lessons response:', response);
        const rawLessons = Array.isArray(response) ? response : (response.lessons || []);
        return rawLessons.map(lesson => this.normalizeLessonData(lesson));
      }),
      catchError((error) => {
        console.error('❌ Failed to get all lessons:', error);
        return of([]); // Return empty array on error
      })
    );
  }

  // ✅ NEW: Client-side filter method as fallback
  getLessonsByUnitClientSide(unitId: string): Observable<Lesson[]> {
    console.log('🔄 Using client-side filtering for unit:', unitId);
    
    return this.getAllLessons().pipe(
      map((lessons: Lesson[]) => {
        const filtered = lessons.filter(lesson => lesson.unitId === unitId);
        console.log(`✅ Client-side filtered ${filtered.length} lessons for unit ${unitId}`);
        return filtered;
      })
    );
  }

  // ✅ Handle wrapped response from backend
  getLessonById(lessonId: string): Observable<Lesson> {
    return this.http.get<GetLessonResponse>(`${this.baseUrl}/${encodeURIComponent(lessonId)}`).pipe(
      map((response: GetLessonResponse) => {
        console.log(`✅ Lesson ${lessonId} response:`, response);
        return this.normalizeLessonData(response.lesson);
      })
    );
  }

  // ✅ Handle wrapped response from backend
  createLesson(payload: CreateLessonDto): Observable<Lesson> {
    // ✅ Clean payload - remove null/undefined zoomUrl if not live lesson
    const cleanPayload = { ...payload };
    if (payload.lessonType !== 'live') {
      delete cleanPayload.zoomUrl;
      delete cleanPayload.zoomMeetingId;
      delete cleanPayload.zoomPasscode;
      delete cleanPayload.scheduledAt;
    }
    
    console.log('🚀 Creating lesson:', cleanPayload);
    
    return this.http.post<CreateLessonResponse>(this.baseUrl, cleanPayload).pipe(
      map((response: CreateLessonResponse) => {
        console.log('✅ Lesson created:', response);
        return this.normalizeLessonData(response.lesson);
      })
    );
  }

  updateLesson(lessonId: string, payload: UpdateLessonDto): Observable<Lesson> {
    const cleanPayload = { ...payload };
    if (payload.lessonType !== 'live') {
      delete cleanPayload.zoomUrl;
      delete cleanPayload.zoomMeetingId;
      delete cleanPayload.zoomPasscode;
      delete cleanPayload.scheduledAt;
    }
    
    console.log('🔄 Updating lesson:', lessonId, cleanPayload);
    
    return this.http.put<CreateLessonResponse>(`${this.baseUrl}/${encodeURIComponent(lessonId)}`, cleanPayload).pipe(
      map((response: CreateLessonResponse) => {
        console.log('✅ Lesson updated:', response);
        return this.normalizeLessonData(response.lesson || response);
      })
    );
  }

  deleteLesson(lessonId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${encodeURIComponent(lessonId)}`);
  }

  // ✅ NEW: Get lessons with advanced filtering options
  getLessonsWithFilters(filters: {
    unitId?: string;
    subjectId?: string;
    lessonType?: string;
    difficulty?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<{lessons: Lesson[], pagination?: any}> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });
    
    return this.http.get<GetLessonsResponse>(this.baseUrl, { params }).pipe(
      map((response: GetLessonsResponse) => {
        const lessons = (response.lessons || []).map(lesson => this.normalizeLessonData(lesson));
        return {
          lessons,
          pagination: response.pagination
        };
      })
    );
  }

  // ✅ IMPROVED: Normalize lesson data from backend with better null handling
  private normalizeLessonData(rawLesson: any): Lesson {
    if (!rawLesson) {
      throw new Error('Invalid lesson data received from backend');
    }

    console.log('🔄 Normalizing lesson:', rawLesson.id, rawLesson.title);

    return {
      id: rawLesson.id,
      title: rawLesson.title || '',
      description: rawLesson.description || '',
      content: rawLesson.content || null,
      unitId: rawLesson.unitId,
      order: rawLesson.order || 1,
      duration: rawLesson.duration || 0,
      difficulty: rawLesson.difficulty || 'beginner',
      lessonType: rawLesson.lessonType || 'video',
      
      // Academic info
      academicYearId: rawLesson.academicYearId || null,
      studentYearId: rawLesson.studentYearId || null,
      
      // Media
      thumbnail: rawLesson.thumbnail || null,
      videoUrl: rawLesson.videoUrl || null,
      document: rawLesson.document || null,
      pdfUrl: rawLesson.pdfUrl || null,
      pdfFileName: rawLesson.pdfFileName || null,
      pdfFileSize: rawLesson.pdfFileSize || null,
      
      // ✅ For UI compatibility - create arrays from single URLs
      videos: rawLesson.videoUrl ? [rawLesson.videoUrl] : [],
      documents: rawLesson.document ? [rawLesson.document] : [],
      
      // Pricing
      price: rawLesson.price || 0,
      currency: rawLesson.currency || 'EGP',
      isFree: rawLesson.isFree || false,
      
      // ✅ IMPROVED: Live session - Better null handling
      zoomUrl: this.cleanZoomField(rawLesson.zoomUrl),
      zoomMeetingId: this.cleanZoomField(rawLesson.zoomMeetingId),
      zoomPasscode: this.cleanZoomField(rawLesson.zoomPasscode),
      scheduledAt: this.cleanScheduledAt(rawLesson.scheduledAt),
      
      // Status
      status: rawLesson.status || 'published',
      isActive: rawLesson.isActive ?? true,
      
      // Timestamps
      createdAt: rawLesson.createdAt,
      updatedAt: rawLesson.updatedAt,
      
      // Access info (from getLessonById)
      hasAccess: rawLesson.hasAccess,
      accessReason: rawLesson.accessReason
    };
  }

  // ✅ NEW: Helper methods for cleaning zoom fields
  private cleanZoomField(value: any): string | null {
    if (!value || value === 'null' || value === 'http://null.com') {
      return null;
    }
    return String(value);
  }

  private cleanScheduledAt(value: any): string | null {
    if (!value || value === '2000-01-01T00:00:00.000Z' || value === '00') {
      return null;
    }
    return String(value);
  }
}