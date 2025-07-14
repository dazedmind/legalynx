// src/app/frontend/types/profile.ts
import { mainApi } from "../lib/api";
import { AxiosError } from "axios";

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    email_verified: boolean;
    status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
    is_paid_user: boolean;
    profile_picture?: string;
    job_title?: string;
    created_at: string;
    last_login_at?: string;
    
    stats: {
      document_count: number;
      chat_session_count: number;
      total_messages: number;
      storage_used: number;
    };
    
    recentActivity: {
      documents: Array<{
        id: string;
        name: string;
        uploaded_at: string;
        size: number;
        pages?: number;
      }>;
      chat_sessions: Array<{
        id: string;
        title?: string;
        document_name: string;
        message_count: number;
        last_activity: string;
        is_saved: boolean;
      }>;
    };
  }
  
  export interface UpdateProfileRequest {
    name?: string;
    job_title?: string;
    profile_picture?: string;
    current_password?: string;
    new_password?: string;
  }
  
  export interface UpdateProfileResponse {
    message: string;
    user: Partial<UserProfile>;
  }
  
  // Add to src/app/frontend/lib/api.ts
  
  // Profile API functions
  export const profileService = {
    // Get user profile
    async getProfile(): Promise<UserProfile> {
      try {
        const response = await mainApi.get<UserProfile>('/backend/api/profile');
        return response.data;
      } catch (error) {
        throw new Error('Failed to fetch profile');
      }
    },
  
    // Update user profile
    async updateProfile(updates: UpdateProfileRequest): Promise<UpdateProfileResponse> {
      try {
        const response = await mainApi.patch<UpdateProfileResponse>('/backend/api/profile', updates);
        return response.data;
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 400) {
          throw new Error(error.response.data.error || 'Invalid profile data');
        }
        throw new Error('Failed to update profile');
      }
    },
  
    // Delete user account
    async deleteAccount(): Promise<{ message: string }> {
      try {
        const response = await mainApi.delete<{ message: string }>('/backend/api/profile?confirm=true');
        return response.data;
      } catch (error) {
        throw new Error('Failed to delete account');
      }
    },
  
    // Upload profile picture (if you have file upload endpoint)
    async uploadProfilePicture(file: File): Promise<{ url: string }> {
      try {
        const formData = new FormData();
        formData.append('profilePicture', file);
        
        const response = await mainApi.post<{ url: string }>('/backend/api/profile/upload-picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } catch (error) {
        throw new Error('Failed to upload profile picture');
      }
    }
  };
  
  // Usage example in a React component:
  /*
  import { profileService } from '@/app/frontend/lib/api';
  import { UserProfile } from '@/app/frontend/types/profile';
  
  const ProfileComponent = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const loadProfile = async () => {
        try {
          const userProfile = await profileService.getProfile();
          setProfile(userProfile);
        } catch (error) {
          console.error('Failed to load profile:', error);
        } finally {
          setLoading(false);
        }
      };
  
      loadProfile();
    }, []);
  
    const handleUpdateProfile = async (updates: UpdateProfileRequest) => {
      try {
        const result = await profileService.updateProfile(updates);
        setProfile(prev => ({ ...prev, ...result.user }));
        toast.success('Profile updated successfully');
      } catch (error) {
        toast.error(error.message);
      }
    };
  
    // Component JSX...
  };
  */