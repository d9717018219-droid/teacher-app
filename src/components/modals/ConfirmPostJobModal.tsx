import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Hash, BookText, MapPin, Clock, ShieldCheck, 
  Edit3, Loader2, Sparkles 
} from 'lucide-react';
import { cn } from '../../utils';

interface ConfirmPostJobModalProps {
  show: boolean;
  onClose: () => void;
  onEdit: () => void;
  onConfirm: () => void;
  isUpdating: boolean;
  tutorId: string | null;
  userClasses: string[];
  userBoard: string;
  userSubjects: string[];
  userGender: string;
  userCity: string;
  userResidency: string;
  userLocalities: string[];
  userMode: string;
  userDuration: string;
  userDays: string;
  userTime: string;
  userFee: string;
}

export function ConfirmPostJobModal({
  show,
  onClose,
  onEdit,
  onConfirm,
  isUpdating,
  tutorId,
  userClasses,
  userBoard,
  userSubjects,
  userGender,
  userCity,
  userResidency,
  userLocalities,
  userMode,
  userDuration,
  userDays,
  userTime,
  userFee
}: ConfirmPostJobModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[25000] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Fixed Header */}
            <div className="p-6 pb-4 border-b border-slate-50 flex justify-between items-start shrink-0">
              <div className="space-y-1">
                <h3 className="text-xl font-[1000] text-slate-900 tracking-tight leading-none pt-1">Confirm & Post Job</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review your summary</p>
              </div>
              <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 active:scale-90 transition-all"><X size={18} /></button>
            </div>

            {/* Scrollable Summary Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {/* 1. Basic Info Section */}
              <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50 space-y-3">
                <div className="flex items-center gap-2 border-b border-indigo-100 pb-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-white"><Hash size={12} /></div>
                  <span className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">Basic Details</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Order ID</p>
                    <p className="text-[12px] font-black text-primary">#{tutorId || 'Pending'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      {userClasses.includes('Entrance Exam & Specialization') ? 'Category & Exam' : 'Class & Board'}
                    </p>
                    <p className="text-[12px] font-black text-slate-800">
                      {userClasses.includes('Entrance Exam & Specialization') 
                        ? `${userClasses[0]} (${userBoard})`
                        : `${userClasses.join(', ')} (${userBoard})`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Requirement Section */}
              <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50 space-y-3">
                <div className="flex items-center gap-2 border-b border-amber-100 pb-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-white"><BookText size={12} /></div>
                  <span className="text-[10px] font-black uppercase text-amber-900 tracking-widest">What You Need</span>
                </div>
                <div className="space-y-2">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Subjects Needed</p>
                    <p className="text-[11px] font-black text-slate-800 leading-tight">{userSubjects.join(', ') || 'All Subjects'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tutor Gender Preference</p>
                    <p className="text-[11px] font-black text-slate-800">{userGender}</p>
                  </div>
                </div>
              </div>

              {/* 3. Location Section */}
              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50 space-y-3">
                <div className="flex items-center gap-2 border-b border-emerald-100 pb-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white"><MapPin size={12} /></div>
                  <span className="text-[10px] font-black uppercase text-emerald-900 tracking-widest">Where You Need</span>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">City</p>
                      <p className="text-[11px] font-black text-slate-800">{userCity}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Society / Block</p>
                      <p className="text-[11px] font-black text-slate-800 leading-tight">{userResidency || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Locality</p>
                    <p className="text-[11px] font-black text-slate-800 leading-tight">{userLocalities.join(', ') || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* 4. Schedule & Fee Section */}
              <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100/50 space-y-3">
                <div className="flex items-center gap-2 border-b border-rose-100 pb-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-rose-500 flex items-center justify-center text-white"><Clock size={12} /></div>
                  <span className="text-[10px] font-black uppercase text-rose-900 tracking-widest">When & How Much</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mode</p>
                    <p className="text-[11px] font-black text-indigo-600">{userMode}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                    <p className="text-[11px] font-black text-slate-800">{userDuration || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Preferred Days</p>
                    <p className="text-[11px] font-black text-slate-800 leading-tight">{userDays || 'N/A'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Preferred Time</p>
                    <p className="text-[11px] font-black text-slate-800 leading-tight">{userTime || 'N/A'}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-rose-100 mt-2">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Final Budget / Fee</p>
                  <p className="text-[16px] font-black text-emerald-600">₹{userFee || 'TBD'}</p>
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="p-6 border-t border-slate-100 bg-white shrink-0 space-y-4">
              <div className="bg-indigo-50 rounded-2xl p-3 border border-indigo-100 flex items-start gap-3">
                <ShieldCheck className="text-indigo-500 shrink-0" size={16} />
                <p className="text-[9px] font-bold text-indigo-700 leading-tight">
                  Tutors will see these details, but your <span className="underline">Phone and Email will remain hidden</span> for your privacy.
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={onEdit}
                  className="flex-1 h-14 rounded-2xl border-2 border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 size={14} /> Edit Need
                </button>
                <button 
                  onClick={onConfirm}
                  disabled={isUpdating}
                  className="flex-[2] h-14 rounded-2xl bg-[#572149] text-white font-black text-[11px] uppercase tracking-[0.1em] shadow-xl shadow-[#572149]/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <>Confirm & Post <Sparkles size={16} /></>}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}