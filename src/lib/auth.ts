// lib/auth.ts
import Cookies from 'js-cookie';
import jwt from 'jsonwebtoken';

export interface User {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
  status: string;
  subscription_status: string;
  profile_picture?: string;
  job_title?: string;
}

export const AUTH_COOKIE_NAME = 'legalynx_token';
export const USER_COOKIE_NAME = 'legalynx_user';

// Cookie options
const cookieOptions = {
  expires: 7, // 7 days
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict' as const,
  path: '/'
};

export const authUtils = {
  // Set authentication cookies
  setAuth: (token: string, user: User) => {
    Cookies.set(AUTH_COOKIE_NAME, token, cookieOptions);
    Cookies.set(USER_COOKIE_NAME, JSON.stringify(user), cookieOptions);
  },

  // Get authentication token
  getToken: (): string | null => {
    return Cookies.get(AUTH_COOKIE_NAME) || null;
  },

  // Get user data
  getUser: (): User | null => {
    const userCookie = Cookies.get(USER_COOKIE_NAME);
    if (!userCookie) return null;
    
    try {
      return JSON.parse(userCookie);
    } catch {
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = authUtils.getToken();
    if (!token) return false;
    
    try {
      // Verify token is not expired
      type DecodedToken = { exp: number; [key: string]: unknown };
      const decoded = jwt.decode(token) as DecodedToken | null;
      if (!decoded || !decoded.exp) return false;
      
      return decoded.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  },

  // Check if user is paid
  isPaidUser: (): boolean => {
    const user = authUtils.getUser();
    return user?.subscription_status === 'PREMIUM' || false;
  },

  // Clear authentication
  logout: () => {
    Cookies.remove(AUTH_COOKIE_NAME, { path: '/' });
    Cookies.remove(USER_COOKIE_NAME, { path: '/' });
    
  },

  // Update user data
  updateUser: (userData: Partial<User>) => {
    const currentUser = authUtils.getUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      Cookies.set(USER_COOKIE_NAME, JSON.stringify(updatedUser), cookieOptions);
    }
  }
};