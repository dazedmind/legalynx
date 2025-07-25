// src/app/frontend/types/profile.ts
import { mainApi } from "../lib/api";
import { AxiosError } from "axios";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  profile_picture?: string;
  job_title?: string;
  created_at: string;
  last_login_at?: string | null;
  
  // Subscription information (from subscription table)
  subscription?: {
    plan_type: 'BASIC' | 'STANDARD' | 'PREMIUM';
    is_active: boolean;
    tokens_used: number;
    token_limit: number;
    days_remaining: number;
    billing_date: string;
    auto_renew: boolean;
    price?: number;
    currency: string;
    created_at: string;
  } | null;
  
}

export interface UpdateProfileRequest {
  name?: string;
  jobTitle?: string; // Will be converted to job_title in API
  profilePicture?: string; // Will be converted to profile_picture in API
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: Partial<UserProfile>;
}

// Profile service with proper error handling
export const profileService = {
  // Get user profile
  async getProfile(): Promise<UserProfile> {
    try {
      console.log('🔍 ProfileService: Fetching profile...');
      const response = await mainApi.get<UserProfile>('/backend/api/profile');
      console.log('✅ ProfileService: Success:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ ProfileService: Error:', error);
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
  }
};