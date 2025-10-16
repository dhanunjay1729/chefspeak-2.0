import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../services/userService';

const LANGUAGE_MAP = {
  'en': 'English',
  'hi': 'Hindi', 
  'te': 'Telugu',
  'ta': 'Tamil'
};

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
  const preferredLanguage = LANGUAGE_MAP[profile?.preferredLanguage] || 'English';
  const dietType = profile?.diet || 'nonveg'; // Changed default to 'nonveg'
  const allergies = profile?.allergies || [];
  const dislikes = profile?.dislikes || [];
  const skillLevel = profile?.skill || 'beginner';

  // Re-fetch profile function
  const refreshProfile = async () => {
    if (!user?.uid) return;
    try {
      const profileData = await getUserProfile(user.uid);
      setProfile(profileData || {});
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setProfile({});
    }
  };

  return {
    profile,
    loading,
    displayName,
    preferredLanguage,
    dietType,
    allergies,
    dislikes,
    skillLevel,
    refresh: refreshProfile
  };
}