import React from 'react';

export function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col gap-1.5 shadow-sm h-full">
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}
        <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-[11px] font-[900] text-slate-800 tracking-tight leading-relaxed whitespace-normal break-words">{value}</span>
    </div>
  );
}