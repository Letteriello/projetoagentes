import { ProfileFormData } from '@/lib/zod-schemas';

const USER_PROFILE_STORAGE_KEY = 'userProfileData';

export const useUserProfile = () => {
  const saveProfile = (data: ProfileFormData): void => {
    try {
      const jsonData = JSON.stringify(data);
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, jsonData);
    } catch (error) {
      console.error('Error saving profile data to localStorage:', error);
      // Optionally, you could throw the error or notify the user
    }
  };

  const loadProfile = (): ProfileFormData | null => {
    try {
      const jsonData = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (jsonData) {
        return JSON.parse(jsonData) as ProfileFormData;
      }
      return null;
    } catch (error) {
      console.error('Error loading profile data from localStorage:', error);
      // Optionally, handle corrupted data, e.g., by removing the item
      // localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
      return null;
    }
  };

  return { saveProfile, loadProfile };
};
