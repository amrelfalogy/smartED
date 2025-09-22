// ✅ UPDATED: user.model.ts - Add new profile fields
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'admin' | 'teacher' | 'support';
  phone?: string | null;
  avatar?: string | null;
  profilePicture?: string | null; // ✅ NEW - Primary profile image
  googleId?: string | null;
  authProvider?: string;
  googleProfile?: any;
  isActive: boolean;
  lastLogin?: string | null;
  emailVerified: boolean;
  bio?: string | null;
  bioLong?: string | null; // ✅ NEW - Extended bio
  address?: string | null;
  dateOfBirth?: string | null;
  socialLinks?: any; // ✅ NEW
  skills?: string[]; // ✅ NEW
  education?: any[]; // ✅ NEW
  experience?: any[]; // ✅ NEW
  preferences?: any; // ✅ NEW
  academicYearId?: string | null;
  studentYearId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ✅ NEW: Enhanced profile response structure
export interface ProfileResponse {
  success: boolean;
  data: {
    user: User;
    mediaFiles: MediaFile[];
  };
}

// ✅ NEW: Media file interface
export interface MediaFile {
  id: string;
  userId: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileType: string;
  uploadedAt: string;
  isActive: boolean;
  metadata: {
    relativePath: string;
    url: string;
  };
}

// ✅ NEW: Profile picture upload response
export interface ProfilePictureUploadResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    fileName: string;
    fileSize: number;
    mediaRecord: MediaFile;
  };
}

export interface UserProfile extends User {
  // Additional profile-specific fields if needed
  coursesEnrolled?: number;
  coursesCompleted?: number;
  totalLearningHours?: number;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher' | 'support';
  phone?: string;
  bio?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  bioLong?: string;
  address?: string;
  dateOfBirth?: string;
  socialLinks?: any;
  skills?: string[];
  education?: any[];
  experience?: any[];
  preferences?: any;
  isActive?: boolean;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    current: number;
    total: number;
    totalItems: number;
  };
}

export interface UserStatsResponse {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalSupport: number;
  activeUsers: number;
  inactiveUsers: number;
  recentRegistrations: number;
  verifiedUsers: number;
  unverifiedUsers: number;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  sortBy?: 'createdAt' | 'lastLogin' | 'firstName' | 'email';
  sortOrder?: 'asc' | 'desc';
}

// Utility Types
export type UserRole = User['role'];
export type UserWithoutDates = Omit<User, 'createdAt' | 'updatedAt' | 'lastLogin'>;
export type PublicUserInfo = Pick<User, 'id' | 'firstName' | 'lastName' | 'profilePicture' | 'avatar' | 'role' | 'bio'>;