'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useKanbanStore } from '@/stores/kanbanStore';
import { AresLogo } from '@/components/branding/AresLogo';
import { AresCard, AresCardContent } from '@/components/ui/ares-card';
import { AresButton } from '@/components/ui/ares-button';
import { LogOut, Plus, LayoutGrid, Clock, Shield } from 'lucide-react';

export default function BoardsPage() {
  const router = useRouter();
  const { logout, isAuthenticated, user } = useAuthStore();
  const { boards, createBoard, loadBoards } = useKanbanStore();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadBoards();
    }
  }, [isAuthenticated, loadBoards]);

  const handleAddBoard = async () => {
    const name = prompt('Enter board name:');
    if (name && name.trim()) {
      await createBoard({ name: name.trim() });
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-ares-dark-950">
      {/* Header */}
      <header className="bg-ares-dark-900/95 backdrop-blur border-b border-ares-dark-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AresLogo size="sm" showText={false} />
              <div>
                <h1 className="text-xl font-bold text-white">
                  Command Center
                </h1>
                <p className="text-xs text-ares-dark-400">
                  Welcome back, {user?.name || 'Commander'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <AresButton 
                variant="secondary" 
                onClick={handleAddBoard}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                New Board
              </AresButton>
              
              <AresButton 
                variant="ghost" 
                onClick={handleLogout}
                leftIcon={<LogOut className="h-4 w-4" />}
              >
                Logout
              </AresButton>
            </div>
          </div>
        </div>
      </header>

      {/* Boards Grid */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Title */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <LayoutGrid className="h-5 w-5 text-ares-red-500" />
              <h2 className="text-lg font-semibold text-white">Your Boards</h2>
            </div>
            <p className="text-sm text-ares-dark-400 mt-1">
              Manage your AI agent workflows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <Link key={board.id} href={`/boards/${board.id}`}>
                <AresCard 
                  className="hover:border-ares-red-600/50 hover:shadow-glow-red-sm cursor-pointer h-full group transition-all duration-300"
                  variant="elevated"
                >
                  <AresCardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white group-hover:text-ares-red-400 transition-colors">
                        {board.name}
                      </h3>
                      {board.is_public ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-ares-cyan/20 text-ares-cyan border border-ares-cyan/30">
                          Public
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-ares-dark-750 text-ares-dark-400">
                          <Shield className="h-3 w-3 inline mr-1" />
                          Private
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-ares-dark-400">
                      <div className="flex items-center gap-1">
                        <LayoutGrid className="h-3 w-3" />
                        <span>Kanban Board</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Updated {new Date(board.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </AresCardContent>
                </AresCard>
              </Link>
            ))}

            {/* Add New Board Card */}
            <button 
              onClick={handleAddBoard}
              className="group"
            >
              <AresCard 
                className="h-full border-dashed border-2 border-ares-dark-600 hover:border-ares-red-600/50 hover:bg-ares-red-600/5 cursor-pointer transition-all duration-300"
                variant="outlined"
                hover={false}
              >
                <AresCardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[140px]">
                  <div className="w-12 h-12 rounded-xl bg-ares-dark-750 flex items-center justify-center mb-3 group-hover:bg-ares-red-600/20 transition-colors">
                    <Plus className="h-6 w-6 text-ares-dark-400 group-hover:text-ares-red-500 transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-ares-dark-300 group-hover:text-white transition-colors">
                    Create New Board
                  </span>
                </AresCardContent>
              </AresCard>
            </button>
          </div>

          {boards.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-ares-dark-800 flex items-center justify-center mx-auto mb-6">
                <LayoutGrid className="h-10 w-10 text-ares-dark-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No boards yet</h3>
              <p className="text-ares-dark-400 mb-6">Create your first board to start orchestrating AI agents</p>
              <AresButton onClick={handleAddBoard} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Board
              </AresButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
