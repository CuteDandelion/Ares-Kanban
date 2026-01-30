'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { AresLogo } from '@/components/branding/AresLogo';
import { AresCard, AresCardContent, AresCardHeader, AresCardTitle, AresCardDescription } from '@/components/ui/ares-card';
import { AresButton } from '@/components/ui/ares-button';
import { AresInput } from '@/components/ui/ares-input';
import { Loader2, Shield, Sparkles, Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading, isAuthenticated } = useAuthStore();

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/boards');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login({ email, password });
      router.push('/boards');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-ares-dark-950 relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 ares-gradient-hero pointer-events-none" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(220, 38, 38, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(220, 38, 38, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Section */}
        <div className="flex justify-center mb-8">
          <AresLogo size="lg" animate />
        </div>

        <AresCard variant="elevated" className="w-full">
          <AresCardHeader className="text-center pb-2">
            <AresCardTitle className="text-2xl">Welcome Back, Commander</AresCardTitle>
            <AresCardDescription>
              Sign in to orchestrate your AI agents
            </AresCardDescription>
          </AresCardHeader>

          <AresCardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <AresInput
                label="Email"
                type="email"
                placeholder="commander@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />

              <AresInput
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />

              {error && (
                <div className="p-3 text-sm text-ares-red-200 bg-ares-red-900/30 rounded-lg border border-ares-red-800">
                  {error}
                </div>
              )}

              <AresButton
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </AresButton>
            </form>

            <div className="text-center text-sm">
              <span className="text-ares-dark-400">Don&apos;t have an account? </span>
              <Link
                href="/register"
                className="font-medium text-ares-red-500 hover:text-ares-red-400 transition-colors"
              >
                Join the ranks
              </Link>
            </div>

            {/* Feature Highlights */}
            <div className="pt-4 border-t border-ares-dark-700">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-lg bg-ares-red-600/20 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-ares-red-500" />
                  </div>
                  <span className="text-xs text-ares-dark-400">AI Agents</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-lg bg-ares-cyan/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-ares-cyan" />
                  </div>
                  <span className="text-xs text-ares-dark-400">Real-time</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-lg bg-ares-red-600/20 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-ares-red-500" />
                  </div>
                  <span className="text-xs text-ares-dark-400">Secure</span>
                </div>
              </div>
            </div>

            {/* Test Mode Info */}
            <div className="p-3 text-xs text-ares-dark-500 bg-ares-dark-900/50 rounded-lg border border-ares-dark-700">
              <p className="font-medium mb-1 text-ares-dark-400">Test Mode:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use any email ending with @example.com</li>
                <li>Password can be any value</li>
              </ul>
            </div>
          </AresCardContent>
        </AresCard>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-ares-dark-500">
          ARES Kanban — Command Center for AI-Human Collaboration
        </p>
      </div>
    </div>
  );
}
