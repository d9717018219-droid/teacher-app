import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BadgeCheck, X, User as LucideUser, Check, TrendingUp, 
  GraduationCap, MapPin, BookOpen, Navigation, Calendar, 
  Clock, Smartphone, FileText, ArrowRight 
} from 'lucide-react';
import { DetailItem } from '../common/DetailItem';
import { TutorProfile } from '../../types';
import { toTitleCase, getTutorId, formatCurrency, openWhatsApp } from '../../utils';

interface TutorDetailModalProps {
  tutor: TutorProfile | null;
  onClose: () => void;
  playTapSound: () => void;
}

export function TutorDetailModal({ tutor, onClose, playTapSound }: TutorDetailModalProps) {
  return (
    <AnimatePresence>
      {tutor && (
        <div className="fixed inset-0 z-[18000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
             <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Tutor Profile</h3>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5"><BadgeCheck size={10} /> {tutor.verified === 'Yes' ? 'Verified Expert' : 'Awaiting Verification'}</p>
                </div>
                <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm transition-all">
                  <X size={16} />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {tutor.photo ? (
                      <img src={tutor.photo} alt={tutor.name} className="w-20 h-20 rounded-[28px] object-cover border-4 border-white shadow-xl" />
                    ) : (
                      <div className="w-20 h-20 rounded-[28px] bg-indigo-50 flex items-center justify-center text-indigo-500 border-4 border-white shadow-xl">
                        <LucideUser size={32} />
                      </div>
                    )}
                    {tutor.verified === 'Yes' && (
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white">
                        <Check size={10} strokeWidth={4} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[20px] font-[1000] text-slate-900 tracking-tight leading-tight">{toTitleCase(tutor.name)}</h4>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{getTutorId(tutor)}</span>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{tutor.experience} Experience</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                         <span className="flex items-center gap-1"><LucideUser size={10} className="text-slate-400" /> {tutor.gender || 'Any'}</span>
                         <span className="w-1 h-1 bg-slate-300 rounded-full" />
                         <span className="flex items-center gap-1"><TrendingUp size={10} className="text-slate-400" /> {tutor.age ? `${tutor.age} Yrs` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                     <DetailItem icon={<GraduationCap size={12} />} label="Qualification" value={tutor.qualification.join(', ') || 'Graduate'} />
                  </div>
                  <DetailItem icon={<MapPin size={12} />} label="City" value={tutor.city} />
                  <div className="col-span-2">
                     <DetailItem icon={<BookOpen size={12} />} label="Classes" value={tutor.class_group.join(', ') || 'All Classes'} />
                  </div>
                  <DetailItem 
                    icon={<TrendingUp size={12} />} 
                    label="Expectation" 
                    value={( /[0-9]/.test((tutor.fee || '').toString()) ? `₹${formatCurrency(tutor.fee || '0')}` : (tutor.fee || '₹0') ) + '/hr'} 
                  />
                  <DetailItem icon={<Navigation size={12} />} label="Teaching Mode" value={tutor.mode || 'Home Tuition'} />
                  <DetailItem icon={<Calendar size={12} />} label="Available Days" value={tutor.days || 'All Days'} />
                  <DetailItem icon={<Clock size={12} />} label="Preferred Time" value={tutor.time || 'Flexible'} />
                  <DetailItem icon={<Smartphone size={12} />} label="Own Vehicle" value={tutor.have_vehicle || 'No'} />
                  <div className="col-span-2">
                     <DetailItem icon={<MapPin size={12} />} label="Preferred Locations" value={tutor.location.join(', ') || 'All Areas'} />
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Expertise Subjects</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {tutor.subjects.slice(0, 6).map(s => (
                      <span key={s} className="bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-slate-100">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-[28px] p-5 border border-slate-100 space-y-2">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5"><FileText size={10} /> About Tutor</h5>
                  <p className="text-[13px] font-[600] text-slate-700 leading-relaxed whitespace-normal break-words">
                    {(() => {
                      const aboutText = tutor.about || `Passionate educator with ${tutor.experience} of teaching experience in ${tutor.city}.`;
                      const lastDot = aboutText.lastIndexOf('.');
                      return lastDot !== -1 ? aboutText.substring(0, lastDot + 1) : aboutText;
                    })()}
                  </p>
                </div>
             </div>

             <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                <button 
                  onClick={() => { playTapSound(); openWhatsApp(`Hi, I am interested in hiring Tutor ID: #${getTutorId(tutor)} (${tutor.name}). Please share more details.`); }}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Hire this Tutor <ArrowRight size={18} strokeWidth={3} />
                </button>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}