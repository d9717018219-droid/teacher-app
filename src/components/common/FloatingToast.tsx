import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../utils';

export function FloatingToast({ toast, onClear }: { toast: { title: string, body: string } | null, onClear: () => void }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(onClear, 2000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClear]);

  return (
    <AnimatePresence>
      {toast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[25000] flex justify-center pointer-events-none w-full max-w-[400px] px-4">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center gap-4 w-full pointer-events-auto border border-white/10"
          >
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
              toast.title.toLowerCase().includes('failed') || toast.title.toLowerCase().includes('error') ? "bg-rose-500/20 text-rose-500" : "bg-emerald-500/20 text-emerald-500"
            )}>
              {toast.title.toLowerCase().includes('failed') || toast.title.toLowerCase().includes('error') ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <h4 className="text-[11px] font-black uppercase tracking-widest leading-none">{toast.title}</h4>
              <p className="text-[10px] font-bold text-slate-400 truncate mt-1.5">{toast.body}</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}