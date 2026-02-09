'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, MessagesSquare } from 'lucide-react';

export interface SortableCardAction {
  icon: typeof MessagesSquare | typeof Pencil | typeof Trash2;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface SortableCardProps {
  id: string;
  children: ReactNode;
  animationDelay?: number;
  actions?: SortableCardAction[];
  readOnly?: boolean;
  className?: string;
  onClick?: () => void;
}

export function SortableCard({
  id,
  children,
  animationDelay = 0,
  actions = [],
  readOnly = false,
  className = '',
  onClick,
}: SortableCardProps) {
  const [hasAnimated, setHasAnimated] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: readOnly });

  // Mark animation as complete after it finishes
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, animationDelay + 600); // animation delay + animation duration
    return () => clearTimeout(timer);
  }, [animationDelay]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(hasAnimated ? {} : { animation: `fade-in-up 0.6s ease-out ${animationDelay}ms backwards` }),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg p-2 group bg-gray-100 transition-all duration-500 ${
        isDragging ? 'opacity-60 shadow-lg z-50' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {!readOnly && (
          <button
            className="shrink-0 p-0.5 -ml-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity touch-none self-center"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}

        <div className="flex-1 flex items-center gap-2 min-w-0">{children}</div>

        {/* Action icons - visible on hover, hidden in readOnly mode */}
        {!readOnly && actions.length > 0 && (
          <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                className={`p-1.5 rounded-md transition-colors ${
                  action.variant === 'danger'
                    ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                }`}
                title={action.label}
              >
                <action.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
