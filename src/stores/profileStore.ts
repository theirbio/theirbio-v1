import { create } from 'zustand';
import { toast } from 'sonner';
import type { Profile } from '@shared/types';
import { api } from '@/lib/api-client';
interface ProfileState {
  profiles: Profile[];
  loading: boolean;
  error: string | null;
  fetched: boolean;
  fetchProfiles: () => Promise<void>;
  invalidateProfiles: () => void;
}
export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  loading: false,
  error: null,
  fetched: false,
  fetchProfiles: async () => {
    // Avoid re-fetching if data is already loaded and not invalidated
    if (get().fetched && get().profiles.length > 0) {
      return;
    }
    set({ loading: true, error: null });
    try {
      const data = await api<Profile[]>('/api/users');
      set({ profiles: data, loading: false, fetched: true });
    } catch (error: any) {
      const errorMessage = error.message || "Could not load profiles. Please try again later.";
      console.error("Failed to fetch profiles:", error);
      toast.error(errorMessage);
      set({ error: errorMessage, loading: false, fetched: false });
    }
  },
  invalidateProfiles: () => {
    // Reset the state to force a re-fetch on next visit to homepage
    set({ fetched: false, profiles: [] });
  },
}));