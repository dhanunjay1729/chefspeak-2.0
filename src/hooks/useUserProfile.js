// this code defines a custom React hook to fetch and manage user profile data
// in simple words, it retrieves user information from a backend service and provides
// default values for various profile attributes if they are not set.

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../services/userService';

// Remove the old LANGUAGE_MAP - we'll use the raw code directly
export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const profileData = await getUserProfile(user.uid);
        setProfile(profileData || {});
      } catch (error) {
        console.error('Failed to load user profile:', error);
        setProfile({});
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.uid]);

  // Computed values with defaults
  const displayName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Chef';
  
  // ✅ FIX: Return the language code directly, no mapping
  const preferredLanguage = profile?.preferredLanguage || 'indian_english';
  
  const dietType = profile?.diet || 'nonveg';
  const allergies = profile?.allergies || [];
  const dislikes = profile?.dislikes || [];
  const skillLevel = profile?.skill || 'beginner';

  return {
    profile,
    loading,
    displayName,
    preferredLanguage, // Now returns "indian_english" instead of "English"
    dietType,
    allergies,
    dislikes,
    skillLevel,
    refresh: async () => {
      await loadProfile();
    }
  };
}