// Base API response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: any;
}
// Social media links for a user profile
export interface SocialLinks {
  twitter?: string;
  github?: string;
  website?: string;
  linkedin?: string;
}
// A validated work experience entry, sealed by a company
export interface Experience {
  role: string;
  period: string;
  description?: string;
  sealedByOrgId: string; // username of the sealing company
  sealedByOrgName: string;
  sealedByOrgAvatarUrl?: string;
  sealedAt: string; // ISO date string
}
// Publicly visible profile information
export interface Profile {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  links?: SocialLinks;
  accountType: 'person' | 'company';
  experiences?: Experience[];
}
// Full user data, including private information
export interface User extends Profile {
  id: string; // a uuid
  passwordHash: string; // For backend use
}