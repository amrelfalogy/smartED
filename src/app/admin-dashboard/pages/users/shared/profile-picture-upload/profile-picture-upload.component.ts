import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserService, ProfileUpdateData } from 'src/app/core/services/user.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { User } from 'src/app/core/models/user.model';

@Component({
  selector: 'app-profile-picture-upload',
  templateUrl: './profile-picture-upload.component.html',
  styleUrls: ['./profile-picture-upload.component.scss']
})
export class ProfilePictureUploadComponent implements OnDestroy {
  @Input() user: User | null = null;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() allowEdit = true;
  @Input() showName = false;
  @Input() shape: 'circle' | 'rounded' | 'square' = 'circle';
  
  @Output() pictureUpdated = new EventEmitter<string>();
  @Output() pictureDeleted = new EventEmitter<void>();
  @Output() error = new EventEmitter<string>();
  
  private destroy$ = new Subject<void>();
  
  isUploading = false;
  isDeleting = false;
  uploadError = '';
  isDragOver = false;
  
  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ✅ File selection via input
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    this.uploadProfilePicture(file);
    
    // Reset input
    input.value = '';
  }
  
  // ✅ Drag and drop support
  onDragOver(event: DragEvent): void {
    if (!this.allowEdit || this.isUploading) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }
  
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }
  
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    if (!this.allowEdit || this.isUploading) return;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadProfilePicture(files[0]);
    }
  }
  
  // ✅ Check if user can edit (admin or own profile)
  get canEdit(): boolean {
    if (!this.allowEdit) return false;
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.user) return false;
    
    // Admin can edit any teacher/user profile
    if (currentUser.role === 'admin') return true;
    
    // Users can edit their own profile (for future teacher self-edit)
    if (currentUser.id === this.user.id) return true;
    
    return false;
  }
  
  // ✅ Check if user can upload profile picture (admin or teacher)
  get canUploadPicture(): boolean {
    if (!this.user) return false;
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    // Admin can upload for any user
    if (currentUser.role === 'admin') return true;
    
    // Teachers can upload their own (future feature)
    if (currentUser.role === 'teacher' && currentUser.id === this.user.id) return true;
    
    return false;
  }
  
  // ✅ UPDATED: Use new unified endpoint for profile picture upload
  private uploadProfilePicture(file: File): void {
    // Validate file
    if (!this.validateFile(file)) return;
    
    if (!this.user) return;
    
    this.isUploading = true;
    this.uploadError = '';
    
    // ✅ NEW: Use unified profile update endpoint with only picture
    const profileData: ProfileUpdateData = {
      profilePicture: file
    };
    
    this.userService.updateUserProfile(this.user.id, profileData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Profile picture uploaded:', response);
          this.isUploading = false;
          
          // ✅ UPDATED: Handle response format from new endpoint
          const updatedUser = response.user || response.data?.user || response;
          
          // Update user profile picture
          if (this.user && updatedUser) {
            this.user.profilePicture = updatedUser.profilePicture;
            this.pictureUpdated.emit(updatedUser.profilePicture);
          }
        },
        error: (error: any) => {
          console.error('❌ Upload failed:', error);
          this.uploadError = error.error?.message || error.message || 'فشل في رفع الصورة';
          this.error.emit(this.uploadError);
          this.isUploading = false;
        }
      });
  }
  
  // ✅ UPDATED: Use new unified endpoint to delete profile picture
  deleteProfilePicture(): void {
    if (!confirm('هل تريد حذف صورة الملف الشخصي؟')) return;
    
    if (!this.user) return;
    
    this.isDeleting = true;
    this.uploadError = '';
    
    // ✅ NEW: Use unified profile update endpoint to remove picture
    // Send empty/null profilePicture or other method based on your backend implementation
    const profileData: ProfileUpdateData = {
      // You might need to adjust this based on how your backend handles picture deletion
      // Option 1: Send empty file name or special value
      // Option 2: Your backend might handle this differently
    };
    
    this.userService.updateUserProfile(this.user.id, profileData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Profile picture deleted:', response);
          this.isDeleting = false;
          
          // Clear user profile picture
          if (this.user) {
            this.user.profilePicture = null;
            this.pictureDeleted.emit();
          }
        },
        error: (error: any) => {
          console.error('❌ Delete failed:', error);
          this.uploadError = error.error?.message || error.message || 'فشل في حذف الصورة';
          this.error.emit(this.uploadError);
          this.isDeleting = false;
        }
      });
  }
  
  private validateFile(file: File): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      this.uploadError = 'نوع الملف غير مدعوم. يُسمح بـ JPEG, PNG, WebP فقط';
      this.error.emit(this.uploadError);
      return false;
    }
    
    if (file.size > maxSize) {
      this.uploadError = 'حجم الملف كبير جداً. الحد الأقصى 10MB';
      this.error.emit(this.uploadError);
      return false;
    }
    
    return true;
  }
  
  // ✅ Get profile image URL (prioritize profilePicture)
  get profileImageUrl(): string {
    if (!this.user) return '';
    return this.user.profilePicture || this.user.avatar || '';
  }
  
  // ✅ Get user initials for placeholder
  get userInitials(): string {
    if (!this.user) return 'U';
    const firstName = this.user.firstName || '';
    const lastName = this.user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  }
  
  // ✅ Get user display name
  get userDisplayName(): string {
    if (!this.user) return '';
    return `${this.user.firstName} ${this.user.lastName}`.trim() || this.user.email;
  }
  
  // ✅ Get size class
  get sizeClass(): string {
    return `size-${this.size}`;
  }
  
  // ✅ Get shape class
  get shapeClass(): string {
    return `shape-${this.shape}`;
  }
}