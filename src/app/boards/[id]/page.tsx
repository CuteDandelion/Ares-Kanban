'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { Board } from '@/components/kanban/Board';
import { ArrowLeft, LogOut } from 'lucide-react';

interface BoardPageProps {
  params: {
    id: string;
  };
}

export default function BoardPage({ params }: BoardPageProps) {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return null; // Will be handled by redirect
  }

  return (
    <div>
      {/* Top Navigation Bar - ARES Dark Theme */}
      <div className="bg-ares-dark-900/95 backdrop-blur border-b border-ares-dark-700 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/boards')}
            className="text-ares-dark-300 hover:text-white hover:bg-ares-dark-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Boards
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-ares-dark-300 hover:text-white hover:bg-ares-dark-800"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Board Component */}
      <Board boardId={params.id} />
    </div>
  );
}
