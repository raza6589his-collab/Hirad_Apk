import React from 'react';
import { motion } from 'framer-motion';

interface AvatarProps {
  firstName: string;
  lastName: string;
  photo?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  layoutId?: string;
  className?: string;
  onClick?: () => void;
  status?: 'paid' | 'unpaid';
  showStatusBadge?: boolean;
}

const PALETTE = [
  'bg-gradient-to-br from-blue-600 to-indigo-700',
  'bg-gradient-to-br from-emerald-600 to-teal-700',
  'bg-gradient-to-br from-amber-600 to-orange-700',
  'bg-gradient-to-br from-rose-600 to-red-700',
  'bg-gradient-to-br from-violet-600 to-purple-700',
  'bg-gradient-to-br from-cyan-600 to-blue-600',
  'bg-gradient-to-br from-fuchsia-600 to-pink-700',
  'bg-gradient-to-br from-slate-700 to-zinc-800',
];

export function getInitials(firstName: string, lastName: string): string {
  const f = firstName.trim().charAt(0) || '';
  const l = lastName.trim().charAt(0) || '';
  return `${f} ${l}`.trim() || '؟';
}

export function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % PALETTE.length;
}

export const Avatar: React.FC<AvatarProps> = ({
  firstName,
  lastName,
  photo,
  size = 'md',
  layoutId,
  className = '',
  onClick,
  status,
  showStatusBadge = false,
}) => {
  const initials = getInitials(firstName, lastName);
  const colorClass = PALETTE[getColorIndex(`${firstName} ${lastName}`)];

  const sizeClasses = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl font-black shadow-xl ring-4 ring-brand-500/20',
  };

  const badgeSizeClasses = {
    sm: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5 ring-1.5',
    md: 'w-3.5 h-3.5 bottom-0 right-0 ring-2',
    lg: 'w-4 h-4 bottom-0.5 right-0.5 ring-2',
    xl: 'w-5 h-5 bottom-1 right-1 ring-2.5',
  };

  const content = (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${className}`}
    >
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center shadow-sm`}
      >
        {photo ? (
          <img
            src={photo}
            alt={`${firstName} ${lastName}`}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <div
            className={`w-full h-full ${colorClass} text-white flex items-center justify-center font-bold tracking-wide`}
          >
            <span>{initials}</span>
          </div>
        )}
      </div>

      {/* Small corner status badge (never obscuring the avatar itself) */}
      {showStatusBadge && status && (
        <span
          className={`absolute rounded-full ring-white dark:ring-darkCard shadow-sm ${
            badgeSizeClasses[size]
          } ${status === 'paid' ? 'bg-emerald-500' : 'bg-rose-500'}`}
        />
      )}
    </div>
  );

  if (layoutId) {
    return (
      <motion.div layoutId={layoutId} className="shrink-0 inline-flex">
        {content}
      </motion.div>
    );
  }

  return content;
};
