'use client';

import { useState } from 'react';
import { Card as CardType, CardPriority } from '@/types';
import { AresCard, AresCardContent } from '@/components/ui/ares-card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Edit2, Trash2, MoreHorizontal, Calendar, Tag, Clock, AlertCircle, User } from 'lucide-react';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks/useClickOutside';

interface CardProps {
  card: CardType;
  onEdit: (card: CardType) => void;
  onDelete: (cardId: string) => void;
  onMove: (cardId: string) => void;
}

const priorityConfig: Record<CardPriority, { 
  bg: string; 
  text: string; 
  border: string; 
  label: string;
  glowColor: string;
  icon: React.ReactNode;
}> = {
  critical: {
    bg: 'bg-red-950/50',
    text: 'text-red-200',
    border: 'border-red-600',
    label: 'Critical',
    glowColor: 'shadow-[0_0_15px_rgba(220,38,38,0.5)] border-red-500/50',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  high: {
    bg: 'bg-orange-950/50',
    text: 'text-orange-200',
    border: 'border-orange-600',
    label: 'High',
    glowColor: 'shadow-[0_0_10px_rgba(234,88,12,0.4)] border-orange-500/50',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  medium: {
    bg: 'bg-yellow-950/50',
    text: 'text-yellow-200',
    border: 'border-yellow-600',
    label: 'Medium',
    glowColor: '',
    icon: null,
  },
  low: {
    bg: 'bg-green-950/50',
    text: 'text-green-200',
    border: 'border-green-600',
    label: 'Low',
    glowColor: '',
    icon: null,
  },
  none: {
    bg: 'bg-ares-dark-750',
    text: 'text-ares-dark-400',
    border: 'border-ares-dark-600',
    label: 'None',
    glowColor: '',
    icon: null,
  },
};

// Format relative time (e.g., "2 days ago", "Today")
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    }
    return `${diffInHours}h ago`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else if (diffInDays < 30) {
    return `${Math.floor(diffInDays / 7)}w ago`;
  } else {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}

export function Card({ card, onEdit, onDelete }: CardProps) {
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useClickOutside<HTMLDivElement>(() => setShowActions(false), showActions);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleEdit = () => {
    onEdit(card);
    setShowActions(false);
  };

  const handleDelete = () => {
    onDelete(card.id);
    setShowActions(false);
  };

  const priority = priorityConfig[card.priority];
  const shouldGlow = card.priority === 'critical' || card.priority === 'high';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-move group relative',
        isDragging && 'opacity-50 rotate-2 scale-105'
      )}
      {...attributes}
      {...listeners}
    >
      {/* Glowing border effect for high priority */}
      {shouldGlow && (
        <div className={cn(
          "absolute -inset-[1px] rounded-xl blur-sm transition-opacity duration-300",
          card.priority === 'critical' ? 'bg-red-500/40 animate-pulse' : 'bg-orange-500/30'
        )} />
      )}
      
      <AresCard className={cn(
        "hover:border-ares-red-600/30 transition-all duration-200 relative",
        shouldGlow && priority.glowColor,
        shouldGlow && "border-2"
      )}>
        {/* Priority indicator strip on left */}
        <div className={cn(
          "absolute left-0 top-4 bottom-4 w-1 rounded-full",
          card.priority === 'critical' && "bg-red-500 shadow-[0_0_8px_rgba(220,38,38,0.8)]",
          card.priority === 'high' && "bg-orange-500 shadow-[0_0_6px_rgba(234,88,12,0.6)]",
          card.priority === 'medium' && "bg-yellow-500",
          card.priority === 'low' && "bg-green-500",
          card.priority === 'none' && "bg-ares-dark-600"
        )} />
        
        <AresCardContent className="p-4 pl-5">
          {/* Header: Title + Actions */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-medium text-sm text-white line-clamp-2 flex-1 pr-3">
              {card.title}
            </h3>
            
            <div className="relative" ref={actionsRef}>
              <button
                className="p-1.5 rounded-lg hover:bg-ares-dark-750 text-ares-dark-400 hover:text-white transition-colors"
                onClick={() => setShowActions(!showActions)}
                aria-label="Card actions"
                aria-expanded={showActions}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              
              {showActions && (
                <div 
                  className="absolute right-0 top-8 z-20 flex flex-col gap-1 bg-ares-dark-850 border border-ares-dark-700 rounded-lg shadow-xl p-1 min-w-[120px]"
                  role="menu"
                >
                  <button
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-ares-dark-750 rounded-md transition-colors"
                    onClick={handleEdit}
                    role="menuitem"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ares-red-400 hover:bg-ares-red-900/30 rounded-md transition-colors"
                    onClick={handleDelete}
                    role="menuitem"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {card.description && (
            <p className="text-xs text-ares-dark-400 mb-3 line-clamp-2">
              {card.description}
            </p>
          )}

          {/* Tags */}
          {card.tags && card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-ares-dark-750 text-ares-dark-300 border border-ares-dark-600 flex items-center gap-1"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer: Priority, Date Created, Assignee & Due Date */}
          <div className="flex flex-col gap-2 pt-2 border-t border-ares-dark-700/50">
            {/* Top row: Priority and Date Created */}
            <div className="flex items-center justify-between">
              {/* Priority Badge with Icon */}
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full border flex items-center gap-1.5 font-medium',
                priority.bg,
                priority.text,
                priority.border
              )}>
                {priority.icon}
                {priority.label}
              </span>
              
              {/* Date Created */}
              <span className="text-xs text-ares-dark-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(card.created_at)}
              </span>
            </div>
            
            {/* Bottom row: Assignee & Due Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {card.assignee_id ? (
                  <Avatar className="h-6 w-6 ring-2 ring-ares-dark-700">
                    <AvatarFallback className="text-xs bg-ares-cyan/20 text-ares-cyan">
                      {card.assignee_id.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <span className="text-xs text-ares-dark-500 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Unassigned
                  </span>
                )}
              </div>
              
              {card.due_date && (
                <span className={cn(
                  "text-xs flex items-center gap-1 px-2 py-0.5 rounded-full",
                  new Date(card.due_date) < new Date() 
                    ? "text-red-300 bg-red-950/50 border border-red-800" 
                    : "text-ares-dark-400"
                )}>
                  <Calendar className="h-3 w-3" />
                  {new Date(card.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </AresCardContent>
      </AresCard>
    </div>
  );
}
