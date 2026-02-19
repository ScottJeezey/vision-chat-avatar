import type { UserProfile } from '../types';

const STORAGE_KEY = 'verifeye_user_profiles';
const COLLECTION_ID_KEY = 'verifeye_collection_id';

/**
 * Get or create collection ID for this browser
 * (Each browser session gets its own face recognition collection)
 */
export function getCollectionId(): string {
  let collectionId = localStorage.getItem(COLLECTION_ID_KEY);
  if (!collectionId) {
    // Generate unique collection ID for this browser
    collectionId = `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(COLLECTION_ID_KEY, collectionId);
  }
  return collectionId;
}

/**
 * Get all stored user profiles
 * Now maps faceId (from Face Recognition API) to user name
 */
export function getUserProfiles(): UserProfile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading user profiles:', error);
    return [];
  }
}

/**
 * Save a new user profile or update existing one
 */
export function saveUserProfile(profile: UserProfile): void {
  try {
    const profiles = getUserProfiles();
    const existingIndex = profiles.findIndex(p => p.id === profile.id);

    if (existingIndex >= 0) {
      profiles[existingIndex] = profile;
    } else {
      profiles.push(profile);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
}

/**
 * Update user's name by faceId
 */
export function updateUserName(faceId: string, name: string): void {
  try {
    const profiles = getUserProfiles();
    const profile = profiles.find(p => p.id === faceId);

    if (profile) {
      profile.name = name;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    }
  } catch (error) {
    console.error('Error updating user name:', error);
  }
}

/**
 * Get a specific user profile by faceId
 */
export function getUserProfile(faceId: string): UserProfile | null {
  const profiles = getUserProfiles();
  return profiles.find(p => p.id === faceId) || null;
}

/**
 * Get user profile by name
 */
export function getUserByName(name: string): UserProfile | null {
  const profiles = getUserProfiles();
  return profiles.find(p => p.name.toLowerCase() === name.toLowerCase()) || null;
}

/**
 * Delete a specific user profile by faceId
 */
export function deleteUserProfile(faceId: string): boolean {
  try {
    const profiles = getUserProfiles();
    const filteredProfiles = profiles.filter(p => p.id !== faceId);

    if (filteredProfiles.length === profiles.length) {
      // Profile not found
      return false;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredProfiles));
    console.log('🗑️ Deleted profile:', faceId);
    return true;
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return false;
  }
}

/**
 * Clear all user profiles (for testing/reset)
 */
export function clearUserProfiles(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COLLECTION_ID_KEY);
  } catch (error) {
    console.error('Error clearing user profiles:', error);
  }
}
