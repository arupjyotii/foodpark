import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

interface AuthState {
    user: Profile | null;
    loading: boolean;
    initialized: boolean;
    setUser: (user: Profile | null) => void;
    signOut: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
    user: null,
    loading: true,
    initialized: false,
    setUser: (user) => set({ user, loading: false }),
    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null });
    },
    initialize: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                set({ user: profile as Profile, loading: false, initialized: true });
            } else {
                set({ user: null, loading: false, initialized: true });
            }

            supabase.auth.onAuthStateChange(async (_event, session) => {
                if (session?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                    set({ user: profile as Profile, loading: false });
                } else {
                    set({ user: null, loading: false });
                }
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
            set({ loading: false, initialized: true });
        }
    },
}));
