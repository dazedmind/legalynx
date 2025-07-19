// src/app/frontend/types/profile.ts (simplified)
import { mainApi } from "../lib/api";

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    email_verified: boolean;
    status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
    subscription_status: 'BASIC' | 'STANDARD' | 'PREMIUM';
    profile_picture?: string;
    job_title?: string;
    created_at: string;
    last_login_at?: string;
  }
  
  // Simplified profile service
  export const profileService = {
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
  
    async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
      try {
        const response = await mainApi.patch<UserProfile>('/backend/api/profile', updates);
        return response.data;
      } catch (error) {
        throw new Error('Failed to update profile');
      }
    }
  };