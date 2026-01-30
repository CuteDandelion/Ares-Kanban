/**
 * Phase 2: Supabase Auth Store Tests
 *
 * Unit tests for the Supabase authentication store.
 * Tests mock Supabase client to avoid actual API calls.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthStore } from '@/stores/authStore';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));

import { supabase } from '@/lib/supabase';

describe('Auth Store (Supabase)', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have initial state with null user', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Login Function', () => {
    it('should set user and isAuthenticated to true on successful login', async () => {
      const mockAuthUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      const mockUserProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: null,
        role: 'member',
        created_at: '2026-01-28T00:00:00.000Z',
        updated_at: '2026-01-28T00:00:00.000Z',
        last_seen_at: '2026-01-28T00:00:00.000Z',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      } as any);

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockUserProfile,
            error: null,
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: mockSelect,
            update: mockUpdate,
            insert: jest.fn(),
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password123' });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle login error', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      } as any);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.login({ email: 'test@example.com', password: 'wrong' });
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });

  describe('Register Function', () => {
    it('should create new user and set as authenticated when session is present', async () => {
      const mockAuthUser = {
        id: 'new-user-id',
        email: 'new@example.com',
        user_metadata: { name: 'New User' },
      };

      const mockUserProfile = {
        id: 'new-user-id',
        email: 'new@example.com',
        name: 'New User',
        avatar_url: null,
        role: 'member',
        created_at: '2026-01-28T00:00:00.000Z',
        updated_at: '2026-01-28T00:00:00.000Z',
        last_seen_at: '2026-01-28T00:00:00.000Z',
      };

      // Session present = no email confirmation required
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser, session: { access_token: 'test-token' } },
        error: null,
      } as any);

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockUserProfile,
            error: null,
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: mockSelect,
            update: mockUpdate,
            insert: jest.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123',
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('new@example.com');
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: {
            name: 'New User',
          },
        },
      });
    });

    it('should handle email confirmation required (no session)', async () => {
      const mockAuthUser = {
        id: 'new-user-id',
        email: 'new@example.com',
      };

      // No session = email confirmation required
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser, session: null },
        error: null,
      } as any);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.register({
            name: 'New User',
            email: 'new@example.com',
            password: 'password123',
          });
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toContain('check your email');
    });
  });

  describe('Logout Function', () => {
    it('should clear user and set isAuthenticated to false', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null } as any);

      const { result } = renderHook(() => useAuthStore());

      // Set initial authenticated state
      act(() => {
        result.current.setUser({
          id: 'test-id',
          email: 'test@example.com',
          name: 'Test User',
          avatar_url: null,
          role: 'member',
          created_at: '2026-01-28T00:00:00.000Z',
          updated_at: '2026-01-28T00:00:00.000Z',
          last_seen_at: '2026-01-28T00:00:00.000Z',
        });
      });

      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('SetUser Function', () => {
    it('should set user and update isAuthenticated', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: 'test-id',
        email: 'test@test.com',
        name: 'Test User',
        avatar_url: null,
        role: 'member' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      };

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should clear error when clearError is called', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({
          id: 'test-id',
          email: 'test@example.com',
          name: 'Test User',
          avatar_url: null,
          role: 'member',
          created_at: '2026-01-28T00:00:00.000Z',
          updated_at: '2026-01-28T00:00:00.000Z',
          last_seen_at: '2026-01-28T00:00:00.000Z',
        });
      });

      // Force an error by simulating a failed update
      result.current.error = 'Test error';

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
