import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { cn } from '../../utils';

export interface SelectionConfig {
  type?: string | null;
  title: string;
  options: string[];
  selected: string[];
  isMulti: boolean;
}

interface SelectionDrawerProps {
  config: SelectionConfig | null;
  onClose: () => void;
  onSelect: (opt: string) => void;
}

export function SelectionDrawer({ config, onClose, onSelect }: SelectionDrawerProps) {
  return (
    <AnimatePresence>
      {config && (
        <div className="fixed inset-0 z-[16000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
               <div className="space-y-0.5">
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">{config.title}</h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                   {config.isMulti ? 'Multi-select enabled' : 'Choose one option'}
                 </p>
               </div>
               <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm transition-all">
                 <X size={16} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {config.options.map(opt => {
                const active = config.selected.includes(opt);
                return (
                  <button 
                    key={opt}
                    onClick={() => onSelect(opt)}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all active:scale-[0.98]",
                      active ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-slate-50 bg-white text-slate-600 hover:border-slate-100"
                    )}
                  >
                    <span className="text-[13px] font-bold tracking-tight">{opt}</span>
                    <div className={cn(
                      "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                      active ? "bg-primary border-primary" : "border-slate-200"
                    )}>
                      {active && <Check size={14} strokeWidth={4} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {config.isMulti && (
              <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                <button 
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                >
                  Done ({config.selected.length} Selected)
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}