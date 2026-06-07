import React from 'react';
import { cn } from '../../utils';

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeColor: string;
  activeBg: string;
  inactiveColor: string;
  inactiveBg: string;
  badge?: number;
}

export function NavButton({ active, onClick, icon, label, activeColor, activeBg, inactiveColor, inactiveBg, badge }: NavButtonProps) {
  return (
    <button onClick={onClick} className={cn("flex-1 flex flex-col items-center gap-1 py-1.5 rounded-full transition-all duration-300 active:scale-95 mx-0.5 relative", active ? activeBg + " " + activeColor + " shadow-lg scale-105" : inactiveBg + " " + inactiveColor + " opacity-60")}>
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-2 w-3.5 h-3.5 bg-orange-500 text-white text-[7px] font-black flex items-center justify-center rounded-full border border-white shadow-sm animate-pulse">
          {badge}
        </span>
      )}
      <span className="text-[7px] font-[1000] tracking-tight">{label}</span>
    </button>
  );
}