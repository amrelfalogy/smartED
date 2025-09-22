import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { User, ProfileResponse } from 'src/app/core/models/user.model';
import { UserService } from 'src/app/core/services/user.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-user-profile-modal',
  templateUrl: './user-profile-modal.component.html',
  styleUrls: ['./user-profile-modal.component.scss']
})
export class UserProfileModalComponent implements OnInit, OnDestroy {
  @Input() user: User | null = null;
  @Input() isVisible = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() userUpdated = new EventEmitter<User>();
  @Output() userDeleted = new EventEmitter<string>();

  private destroy$ = new Subject<void>();
  
  // Form
  userForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  
  // Profile picture
  profilePictureError = '';
  
  // Confirmation
  showDeleteConfirmation = false;
  deleteConfirmationText = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.user) {
      this.loadUserData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^(\+)?[0-9\s\-\(\)]+$/)]],
      bio: ['', [Validators.maxLength(500)]],
      bioLong: ['', [Validators.maxLength(2000)]],
      address: ['', [Validators.maxLength(200)]],
      dateOfBirth: [''],
      isActive: [true]
    });
  }

  private loadUserData(): void {
    if (!this.user) return;

    this.userForm.patchValue({
      firstName: this.user.firstName || '',
      lastName: this.user.lastName || '',
      email: this.user.email || '',
      phone: this.user.phone || '',
      bio: this.user.bio || '',
      bioLong: this.user.bioLong || '',
      address: this.user.address || '',
      dateOfBirth: this.user.dateOfBirth ? this.formatDateForInput(this.user.dateOfBirth) : '',
      isActive: this.user.isActive
    });

    this.userForm.get('email')?.disable();
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.loadUserData();
    }
  }

  // ✅ FIXED: Proper typing for the update call
  saveUser(): void {
    if (!this.user || this.userForm.invalid || this.isSaving) return;

    this.isSaving = true;
    
    const formData = this.userForm.getRawValue();
    
    if (formData.dateOfBirth) {
      formData.dateOfBirth = new Date(formData.dateOfBirth).toISOString().split('T')[0];
    }

    // ✅ FIX: Create properly typed observable
    let updateCall: Observable<any>;
    
    if (this.isCurrentUser()) {
      updateCall = this.userService.updateCurrentUserProfile(formData);
    } else {
      updateCall = this.userService.updateUserById(this.user.id, formData);
    }

    updateCall
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ProfileResponse | User) => {
          console.log('User updated successfully:', response);
          
          // ✅ Handle both response formats properly
          let updatedUser: User;
          if ('data' in response && response.data) {
            // ProfileResponse format
            updatedUser = response.data.user;
          } else {
            // Direct User format
            updatedUser = response as User;
          }
          
          this.user = updatedUser;
          this.loadUserData();
          
          this.isSaving = false;
          this.isEditMode = false;
          this.userUpdated.emit(updatedUser);
        },
        error: (error: any) => {
          console.error('Failed to update user:', error);
          this.isSaving = false;
        }
      });
  }

  toggleUserStatus(): void {
    if (!this.user || this.isLoading) return;

    this.isLoading = true;
    
    this.userService.toggleUserStatus(this.user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser: User) => {
          console.log('User status toggled:', updatedUser);
          this.user = updatedUser;
          this.loadUserData();
          this.isLoading = false;
          this.userUpdated.emit(updatedUser);
        },
        error: (error: any) => {
          console.error('Failed to toggle user status:', error);
          this.isLoading = false;
        }
      });
  }

  // ✅ Profile picture event handlers
  onProfilePictureUpdated(imageUrl: string): void {
    if (this.user) {
      this.user.profilePicture = imageUrl;
      this.userUpdated.emit(this.user);
    }
    this.profilePictureError = '';
  }

  onProfilePictureDeleted(): void {
    if (this.user) {
      this.user.profilePicture = null;
      this.userUpdated.emit(this.user);
    }
    this.profilePictureError = '';
  }

  onProfilePictureError(error: string): void {
    this.profilePictureError = error;
  }

  showDeleteDialog(): void {
    this.showDeleteConfirmation = true;
    this.deleteConfirmationText = '';
  }

  hideDeleteDialog(): void {
    this.showDeleteConfirmation = false;
    this.deleteConfirmationText = '';
  }

  confirmDelete(): void {
    if (!this.user || this.deleteConfirmationText !== 'DELETE' || this.isDeleting) return;

    this.isDeleting = true;
    
    this.userService.deleteUser(this.user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('User deleted successfully');
          this.isDeleting = false;
          this.hideDeleteDialog();
          this.userDeleted.emit(this.user!.id);
        },
        error: (error: any) => {
          console.error('Failed to delete user:', error);
          this.isDeleting = false;
        }
      });
  }

  closeModal(): void {
    if (this.isSaving || this.isDeleting) return;
    this.close.emit();
  }

  // Helper methods
  isCurrentUser(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return !!(currentUser && this.user && currentUser.id === this.user.id);
  }

  getUserDisplayName(): string {
    if (!this.user) return '';
    return `${this.user.firstName} ${this.user.lastName}`.trim() || this.user.email;
  }

  getProfileImageUrl(): string {
    return this.userService.getProfileImageUrl(this.user || {} as User);
  }

  getRoleBadgeClass(): string {
    if (!this.user) return 'bg-secondary';
    
    switch (this.user.role) {
      case 'admin': return 'bg-danger';
      case 'teacher': return 'bg-success';
      case 'support': return 'bg-info';
      case 'student': return 'bg-primary';
      default: return 'bg-secondary';
    }
  }

  getRoleDisplayName(): string {
    if (!this.user) return '';
    
    switch (this.user.role) {
      case 'admin': return 'مدير النظام';
      case 'teacher': return 'معلم';
      case 'support': return 'دعم فني';
      case 'student': return 'طالب';
      default: return this.user.role;
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private formatDateForInput(dateString: string): string {
    return new Date(dateString).toISOString().split('T')[0];
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    
    if (errors['required']) return `${this.getFieldDisplayName(fieldName)} مطلوب`;
    if (errors['email']) return 'صيغة البريد الإلكتروني غير صحيحة';
    if (errors['minlength']) return `${this.getFieldDisplayName(fieldName)} قصير جداً`;
    if (errors['maxlength']) return `${this.getFieldDisplayName(fieldName)} طويل جداً`;
    if (errors['pattern']) return `صيغة ${this.getFieldDisplayName(fieldName)} غير صحيحة`;

    return 'خطأ في الحقل';
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      firstName: 'الاسم الأول',
      lastName: 'اسم العائلة',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      bio: 'نبذة شخصية',
      bioLong: 'السيرة الذاتية',
      address: 'العنوان',
      dateOfBirth: 'تاريخ الميلاد'
    };
    return fieldNames[fieldName] || fieldName;
  }
}