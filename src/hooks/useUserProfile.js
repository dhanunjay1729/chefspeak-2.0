// this code defines a custom React hook to fetch and manage user profile data
// in simple words, it retrieves user information from a backend service and provides
// default values for various profile attributes if they are not set.

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../services/userService';
import { DEFAULT_LANGUAGE, getLanguage } from '../../shared/languages';

const EMPTY_PREFERENCES = [];

// Remove the old LANGUAGE_MAP - we'll use the raw code directly
export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ FIX: loadProfile is now outside useEffect so refresh() can call it
  const loadProfile = useCallback(async () => {
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
  }, [user?.uid]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Computed values with defaults
  const displayName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Chef';
  
  // ✅ FIX: Return the language code directly, no mapping
  const preferredLanguage = getLanguage(profile?.preferredLanguage)?.code || DEFAULT_LANGUAGE;
  
  const dietType = profile?.diet || 'nonveg';
  const allergies = profile?.allergies || EMPTY_PREFERENCES;
  const dislikes = profile?.dislikes || EMPTY_PREFERENCES;
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
    refresh: loadProfile, // ✅ FIX: Now correctly references the function
  };
}
