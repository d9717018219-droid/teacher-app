import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BadgeCheck, X, User as LucideUser, Clock, Calendar, 
  Navigation, Zap, FileText, ShieldCheck, ArrowRight, MapPin 
} from 'lucide-react';
import { DetailItem } from '../common/DetailItem';
import { JobLead } from '../../types';
import { getJobId, formatCurrency, cleanValue } from '../../utils';

interface JobDetailModalProps {
  job: JobLead | null;
  onClose: () => void;
  onApply: (job: JobLead) => void;
}

export function JobDetailModal({ job, onClose, onApply }: JobDetailModalProps) {
  return (
    <AnimatePresence>
      {job && (
        <div className="fixed inset-0 z-[18000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {(() => {
            if (job['Order ID'] === '7752' || (job as any).order_id === '7752' || (job as any).id === '7752') {
              console.log('🚨 [CRITICAL-DEBUG] Job #7752 Detail View Object:', JSON.stringify(job, null, 2));
            }
            return null;
          })()}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
             {/* Premium Header */}
             <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                <div className="relative z-10 space-y-0.5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Job Opportunity</h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                       <BadgeCheck size={10} strokeWidth={3} /> VERIFIED LEAD
                     </span>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{getJobId(job)}</span>
                  </div>
                </div>
                <button onClick={onClose} className="relative z-10 p-2.5 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-all active:scale-90">
                  <X size={18} strokeWidth={3} />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-12">
                {/* Primary Info Card */}
                <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                  <div className="relative z-10 space-y-4">
                    <div className="space-y-1">
                      <div className="bg-white/10 w-fit px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-primary-foreground border border-white/5">
                        {job.Class || job['Class / Board'] || (job as any).class_group || 'Premium Class'}
                      </div>
                      <h4 className="text-[16px] font-[1000] text-white leading-snug tracking-tight">
                        {job.subjects || job['Preferred Subject(s)'] || (job as any).subject || 'General Subjects'}
                      </h4>
                    </div>
                    <div className="flex justify-between items-start pt-3 gap-4">
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black tracking-tight uppercase">
                          <MapPin size={11} strokeWidth={3} /> {job.City || (job as any).city || 'India'}
                        </div>
                        <div className="text-slate-300 text-[11px] font-medium leading-relaxed">
                          {cleanValue(job.residency || (job as any).residency || '') ? `${job.residency || (job as any).residency}, ` : ''}{cleanValue(job.Locations || (job as any).locations || (job as any).location || (job as any).locality || 'All Areas')}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {(() => {
                          const rawFee = job.Fee || (job as any).fee || (job as any).budget || job['Fee/Month'] || (job as any).monthly_fee || (job as any).Fee_hour || '';
                          const isNumeric = /[0-9]/.test(rawFee.toString());
                          return (
                            <div className="flex flex-col items-end">
                              <div className="text-[22px] font-black text-emerald-400 leading-none">
                                {isNumeric ? `₹${formatCurrency(rawFee)}` : rawFee || '₹0'}
                              </div>
                              <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">Monthly Budget</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <DetailItem icon={<LucideUser size={12} className="text-indigo-500" />} label="Tutor Gender" value={job.Gender || (job as any).gender || (job as any).preferred_gender || 'Any Preference'} />
                  <DetailItem icon={<Clock size={12} className="text-rose-500" />} label="Preferred Time" value={job.time || (job as any).preferred_time || 'Flexible'} />
                  <DetailItem icon={<Calendar size={12} className="text-amber-500" />} label="Weekly Days" value={job.days || (job as any).weekly_days || (job as any).Days || 'N/A'} />
                  <DetailItem icon={<Navigation size={12} className="text-blue-500" />} label="Teaching Mode" value={job.mode || (job as any).Mode || 'Home Tuition'} />
                  <DetailItem icon={<Zap size={12} className="text-emerald-500" />} label="Avg. Duration" value={job.duration || (job as any).Duration || (job as any).avg_duration || '1.5 Hours'} />
                  <DetailItem icon={<BadgeCheck size={12} className="text-purple-500" />} label="Lead Status" value={job.status || (job as any).internal_remark || 'Active'} />
                </div>

                {/* Requirements Section */}
                <div className="bg-slate-50 rounded-[28px] p-5 border border-slate-100 space-y-2.5">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] flex items-center gap-2">
                    <FileText size={12} className="text-slate-400" /> Parent's Requirement
                  </div>
                  <p className="text-[13px] font-bold text-slate-600 leading-relaxed italic">
                    "{job.Notes || 'Looking for an experienced tutor who can help with core concepts and regular practice sessions.'}"
                  </p>
                </div>

                {/* Security Advice */}
                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 flex items-start gap-3">
                  <ShieldCheck size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10.5px] font-bold text-blue-800 leading-snug">
                    Your safety is our priority. DoAble India verifies every lead, but we recommend meeting in a safe environment for the first session.
                  </p>
                </div>
             </div>

             {/* Action Footer */}
             <div className="p-6 pt-2 border-t border-slate-50 bg-white shrink-0">
                <button 
                  onClick={() => onApply(job)}
                  className="w-full bg-[#191445] text-white h-16 rounded-[24px] font-black text-[13px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Apply for this Job <ArrowRight size={20} strokeWidth={3} />
                </button>
                <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-4">Mention Order ID: #{getJobId(job)}</p>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}