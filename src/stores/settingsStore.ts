/**
 * Settings Store
 * Manages Claude API key and Docker configuration
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export interface SettingsState {
  // Claude API Configuration
  claudeApiKey: string | null;
  claudeModel: string;
  claudeEnabled: boolean;
  
  // Docker Configuration
  dockerEnabled: boolean;
  dockerSocketPath: string;
  
  // UI State
  isSettingsOpen: boolean;
  claudeConnectionStatus: 'unknown' | 'connected' | 'error' | 'testing';
  
  // Actions
  setClaudeApiKey: (key: string | null) => void;
  setClaudeModel: (model: string) => void;
  setClaudeEnabled: (enabled: boolean) => void;
  setDockerEnabled: (enabled: boolean) => void;
  setDockerSocketPath: (path: string) => void;
  openSettings: () => void;
  closeSettings: () => void;
  setClaudeConnectionStatus: (status: SettingsState['claudeConnectionStatus']) => void;
  testClaudeConnection: () => Promise<{ success: boolean; error?: string }>;
  loadSettingsFromSupabase: () => Promise<void>;
  saveSettingsToSupabase: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      claudeApiKey: null,
      claudeModel: 'claude-3-5-sonnet-20241022',
      claudeEnabled: false,
      dockerEnabled: true,
      dockerSocketPath: '/var/run/docker.sock',
      isSettingsOpen: false,
      claudeConnectionStatus: 'unknown',

      // Actions
      setClaudeApiKey: (key) => set({ claudeApiKey: key, claudeEnabled: !!key }),
      setClaudeModel: (model) => set({ claudeModel: model }),
      setClaudeEnabled: (enabled) => set({ claudeEnabled: enabled }),
      setDockerEnabled: (enabled) => set({ dockerEnabled: enabled }),
      setDockerSocketPath: (path) => set({ dockerSocketPath: path }),
      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
      setClaudeConnectionStatus: (status) => set({ claudeConnectionStatus: status }),

      testClaudeConnection: async () => {
        const { claudeApiKey } = get();
        if (!claudeApiKey) {
          return { success: false, error: 'API key not configured' };
        }

        set({ claudeConnectionStatus: 'testing' });

        try {
          // Use the proxy API route to avoid CORS issues
          const response = await fetch('/api/claude', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              apiKey: claudeApiKey,
              model: get().claudeModel,
              max_tokens: 10,
              messages: [{ role: 'user', content: 'Hi' }],
            }),
          });

          if (response.ok) {
            set({ claudeConnectionStatus: 'connected' });
            return { success: true };
          } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || errorData.details?.error?.message || 'Connection failed';
            set({ claudeConnectionStatus: 'error' });
            return { success: false, error: errorMessage };
          }
        } catch (error) {
          set({ claudeConnectionStatus: 'error' });
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Connection failed - CORS issue or network error' 
          };
        }
      },

      loadSettingsFromSupabase: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error('Error loading settings:', error);
            return;
          }

          if (data) {
            set({
              claudeApiKey: data.claude_api_key,
              claudeModel: data.claude_model || 'claude-3-5-sonnet-20241022',
              claudeEnabled: !!data.claude_api_key,
              dockerEnabled: data.docker_enabled ?? true,
              dockerSocketPath: data.docker_socket_path || '/var/run/docker.sock',
            });
          }
        } catch (error) {
          console.error('Error loading settings:', error);
        }
      },

      saveSettingsToSupabase: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const state = get();
          const { error } = await supabase
            .from('user_settings')
            .upsert({
              user_id: user.id,
              claude_api_key: state.claudeApiKey,
              claude_model: state.claudeModel,
              docker_enabled: state.dockerEnabled,
              docker_socket_path: state.dockerSocketPath,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });

          if (error) {
            console.error('Error saving settings:', error);
          }
        } catch (error) {
          console.error('Error saving settings:', error);
        }
      },
    }),
    {
      name: 'ares-settings',
      partialize: (state) => ({
        claudeModel: state.claudeModel,
        dockerEnabled: state.dockerEnabled,
        dockerSocketPath: state.dockerSocketPath,
        // Note: claudeApiKey is NOT persisted to localStorage for security
        // It's stored in Supabase only
      }),
    }
  )
);

export default useSettingsStore;
