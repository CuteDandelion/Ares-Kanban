/**
 * Phase 2: Supabase Authentication Store (Zustand)
 *
 * Real Supabase Auth integration with publishable key support.
 * Replaces the mock auth store for production use.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, User as SupabaseUser } from '@/lib/supabase';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
  
  // Session management
  initializeAuth: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Initialize auth state from Supabase session
      initializeAuth: async () => {
        set({ isLoading: true });
        
        try {
          // Get current session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }

          if (session?.user) {
            // Fetch user profile from our users table
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (userError) {
              console.error('Error fetching user profile:', userError);
              // If user doesn't exist in our table, create them
              if (userError.code === 'PGRST116') {
                const newUser: User = {
                  id: session.user.id,
                  email: session.user.email!,
                  name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
                  avatar_url: session.user.user_metadata?.avatar_url || null,
                  role: 'member',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  last_seen_at: new Date().toISOString(),
                };

                const { error: insertError } = await supabase
                  .from('users')
                  .insert(newUser);

                if (insertError) {
                  console.error('Error creating user profile:', insertError);
                } else {
                  set({
                    user: newUser,
                    isAuthenticated: true,
                    isLoading: false,
                  });
                  return;
                }
              }
            }

            if (userData) {
              // Update last_seen_at
              await supabase
                .from('users')
                .update({ last_seen_at: new Date().toISOString() })
                .eq('id', userData.id);

              set({
                user: userData as User,
                isAuthenticated: true,
                isLoading: false,
              });
            }
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize auth',
          });
        }
      },

      // Login with email/password
      login: async (credentials: { email: string; password: string }) => {
        set({ isLoading: true, error: null });

        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (authError) {
            throw authError;
          }

          if (authData.user) {
            // Fetch user profile
            const { data: profileData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', authData.user.id)
              .single();

            if (userError || !profileData) {
              // Profile doesn't exist - create it
              console.warn('User profile not found during login, creating...');
              
              const newUser: User = {
                id: authData.user.id,
                email: authData.user.email!,
                name: authData.user.user_metadata?.name || authData.user.email!.split('@')[0],
                avatar_url: authData.user.user_metadata?.avatar_url || null,
                role: 'member',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString(),
              };

              const { error: insertError } = await supabase
                .from('users')
                .insert(newUser);

              if (insertError) {
                console.error('Failed to create user profile during login:', insertError);
                throw new Error('Login successful but failed to create user profile. Please try again.');
              }

              set({
                user: newUser,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              // Profile exists - update last_seen_at
              await supabase
                .from('users')
                .update({ last_seen_at: new Date().toISOString() })
                .eq('id', profileData.id);

              set({
                user: { ...profileData, last_seen_at: new Date().toISOString() } as User,
                isAuthenticated: true,
                isLoading: false,
              });
            }
          }
        } catch (error) {
          console.error('Login error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      // Register new user
      register: async (userData: { name: string; email: string; password: string }) => {
        set({ isLoading: true, error: null });

        try {
          // Create auth user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
              data: {
                name: userData.name,
              },
            },
          });

          if (authError) {
            throw authError;
          }

          if (authData.user) {
            // Check if email confirmation is required
            const emailConfirmationRequired = !authData.session;
            
            if (emailConfirmationRequired) {
              // Email confirmation required - user created but not logged in yet
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
              // Return a specific error to inform user about email confirmation
              throw new Error('Registration successful! Please check your email to confirm your account before logging in.');
            }

            // Session exists - user is logged in immediately
            // The trigger should have created the user profile, but let's verify
            const { data: profileData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', authData.user.id)
              .single();

            if (userError) {
              // Profile doesn't exist yet, create it manually
              console.warn('User profile not found after registration, creating manually...');
              
              const newUser: User = {
                id: authData.user.id,
                email: authData.user.email!,
                name: userData.name,
                avatar_url: null,
                role: 'member',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString(),
              };

              const { error: insertError } = await supabase
                .from('users')
                .insert(newUser);

              if (insertError) {
                console.error('Failed to create user profile:', insertError);
                // Don't throw here - auth succeeded even if profile creation failed
                // We can retry profile creation later
              }

              set({
                user: newUser,
                isAuthenticated: true,
                isLoading: false,
              });
            } else if (profileData) {
              // Profile exists - update last_seen_at
              await supabase
                .from('users')
                .update({ last_seen_at: new Date().toISOString() })
                .eq('id', profileData.id);

              set({
                user: { ...profileData, last_seen_at: new Date().toISOString() } as User,
                isAuthenticated: true,
                isLoading: false,
              });
            }
          }
        } catch (error) {
          console.error('Registration error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          });
          throw error;
        }
      },

      // Logout user
      logout: async () => {
        set({ isLoading: true });

        try {
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            throw error;
          }

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Logout error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Logout failed',
          });
        }
      },

      // Set user manually (for testing or external auth)
      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: user !== null,
          error: null,
        });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Update user profile
      updateProfile: async (updates: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });

        try {
          const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

          if (error) {
            throw error;
          }

          if (data) {
            set({
              user: data as User,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Profile update error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update profile',
          });
        }
      },
    }),
    {
      name: 'ares-auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Export a helper to initialize auth on app load
export const initializeAuth = async () => {
  await useAuthStore.getState().initializeAuth();
};
