import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export function SuccessPop({ show, onComplete }: { show: boolean, onComplete: () => void }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[30000] flex justify-center pointer-events-none w-full max-w-[400px] px-4">
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.9 }}
            className="bg-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-emerald-100 pointer-events-auto w-full"
          >
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Check size={20} strokeWidth={4} />
            </div>
            <div className="pr-2">
              <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-tighter">Success ✅</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Changes saved successfully</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}