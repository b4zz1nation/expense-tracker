import { useCallback, useEffect, useState } from 'react';
import { getUserProfile, saveUserProfile, type UserProfile } from '../db/settingsRepo';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const refreshProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      setProfile(await getUserProfile());
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const updateProfile = useCallback(async (name: string, monthlyBudgetCents: number) => {
    const nextProfile = await saveUserProfile(name, monthlyBudgetCents);
    setProfile(nextProfile);
    return nextProfile;
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  return { profile, loadingProfile, refreshProfile, updateProfile };
}
