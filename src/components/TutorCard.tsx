import React from 'react';
import { 
  MapPin, 
  ChevronRight, 
  Briefcase, 
  Star,
  CheckCircle2,
  BadgeCheck,
  Heart,
  BookOpen,
  FlaskConical,
  Globe,
  Monitor,
  Palette,
  GraduationCap,
  Calculator,
  Zap,
  Dna,
  Languages,
  TrendingUp,
  Code,
  Trophy,
  Sparkles,
  Clock,
  User
} from 'lucide-react';
import { TutorProfile } from '../types';
import { cn, toTitleCase, formatPostedDate, cleanValue } from '../utils';

interface TutorCardProps {
  tutor: TutorProfile;
  onClick: (tutor: TutorProfile) => void;
  isShortlisted?: boolean;
  onShortlistToggle?: (id: string, e: React.MouseEvent) => void;
}

const getSubjectStyles = (subjects: string = '') => {
  const s = subjects.toLowerCase();
  
  if (s.includes('math')) return { bg: 'bg-blue-600', icon: <Calculator size={24} /> };
  if (s.includes('physics')) return { bg: 'bg-red-500', icon: <Zap size={24} /> };
  if (s.includes('chem')) return { bg: 'bg-teal-500', icon: <FlaskConical size={24} /> };
  if (s.includes('bio') || s.includes('science')) return { bg: 'bg-lime-600', icon: <Dna size={24} /> };
  if (s.includes('english')) return { bg: 'bg-indigo-600', icon: <Languages size={24} /> };
  if (s.includes('hindi')) return { bg: 'bg-orange-600', icon: <Languages size={24} /> };
  if (s.includes('history') || s.includes('geo') || s.includes('sst') || s.includes('social')) return { bg: 'bg-emerald-600', icon: <Globe size={24} /> };
  if (s.includes('eco') || s.includes('stat')) return { bg: 'bg-violet-600', icon: <TrendingUp size={24} /> };
  if (s.includes('account') || s.includes('business')) return { bg: 'bg-cyan-600', icon: <Briefcase size={24} /> };
  if (s.includes('comput') || s.includes('coding') || s.includes('it')) return { bg: 'bg-slate-800', icon: <Code size={24} /> };
  if (s.includes('music') || s.includes('art')) return { bg: 'bg-purple-500', icon: <Palette size={24} /> };
  if (s.includes('yoga') || s.includes('dance') || s.includes('sport')) return { bg: 'bg-pink-500', icon: <Trophy size={24} /> };
  if (s.includes('all')) return { bg: 'bg-primary', icon: <Sparkles size={24} /> };
  
  return { bg: 'bg-primary', icon: <GraduationCap size={24} /> };
};

export const TutorCard: React.FC<TutorCardProps> = React.memo(({ 
  tutor, 
  onClick, 
  isShortlisted, 
  onShortlistToggle 
}) => {
  if (!tutor) return null;

  const tutorId = tutor.tutor_id || 'N/A';
  const name = tutor.name || 'Premium Tutor';
  const city = tutor.city || 'India';
  const locationArr = tutor.location || [];
  const area = locationArr.length > 0 ? locationArr[0] : '';
  const location = area ? `${area} - ${city}` : city;
  const exp = tutor.experience || '1-3 Years';
  const qualArr = tutor.qualification || [];
  const qual = qualArr.length > 0 ? qualArr[0] : 'Graduate';
  const subjectsArr = tutor.subjects || [];
  const subjectsStr = subjectsArr.join(', ') || 'General';
  const gender = tutor.gender || '';
  const classGroupArr = tutor.class_group || [];
  const classGroupStr = classGroupArr.join(', ') || '';
  const verified = tutor.verified === 'Yes';
  
  const { bg, icon } = getSubjectStyles(subjectsStr);

  return (
    <div 
      onClick={() => onClick(tutor)}
      className="bg-white rounded-[20px] p-3 shadow-sm border border-slate-100 flex flex-col gap-2.5 active:scale-[0.98] transition-all cursor-pointer relative group overflow-hidden mb-2"
    >
      <div className="flex items-start gap-2.5">
        {/* Left Icon Box - Smaller */}
        <div className={cn("w-[54px] h-[54px] rounded-[16px] flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm text-white", bg)}>
          {icon}
        </div>

        {/* Middle Content */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-primary text-[10.5px] font-[900] tracking-tight">Tutor ID: {tutorId}</span>
              {verified && (
                <div className="flex items-center gap-1 ml-2">
                   <div className="flex items-center gap-1 bg-[#404E78] text-white px-1.5 py-0.5 rounded-lg shadow-lg shadow-[#404E78]/10 border border-white/10">
                      <BadgeCheck size={11} className="fill-white text-[#404E78]" />
                      <span className="text-[8.5px] font-[1000] uppercase tracking-widest leading-none">Verified</span>
                   </div>
                </div>
              )}
            </div>
            <span className="text-[#94A3B8] text-[9.5px] font-bold uppercase tracking-widest">{location}</span>
          </div>
          
          <h4 className="text-[16px] font-[800] text-[#0F172A] leading-tight tracking-tight truncate">
            {toTitleCase(name)}
          </h4>
          <p className="text-[#64748B] text-[12px] font-[500] truncate">{qual}</p>
          
          <div className="flex items-center gap-1.5 pt-1.5 overflow-x-auto no-scrollbar">
            {gender && (
              <span className={cn(
                "text-[9px] font-[900] px-2 py-0.5 rounded-md border flex items-center gap-1 tracking-tight text-slate-950 whitespace-nowrap",
                gender.toLowerCase().includes('female') 
                  ? "bg-rose-50 border-rose-100/50" 
                  : gender.toLowerCase().includes('male')
                    ? "bg-blue-50 border-blue-100/50"
                    : "bg-slate-50 border-slate-100/50"
              )}>
                <User size={9} strokeWidth={3} className="text-slate-400" /> {gender}
              </span>
            )}
            {classGroupStr && (
              <span className={cn(
                "text-[9px] font-[900] px-2 py-0.5 rounded-md border flex items-center gap-1 tracking-tight text-slate-950 whitespace-nowrap",
                (() => {
                  const g = classGroupStr.toLowerCase();
                  if (g.includes('11') || g.includes('12') || g.includes('higher') || g.includes('senior')) return "bg-violet-50 border-violet-100/50";
                  if (g.includes('9') || g.includes('10') || g.includes('secondary')) return "bg-amber-50 border-amber-100/50";
                  if (g.includes('6') || g.includes('7') || g.includes('8') || g.includes('middle')) return "bg-emerald-50 border-emerald-100/50";
                  if (g.includes('1') || g.includes('2') || g.includes('3') || g.includes('4') || g.includes('5') || g.includes('primary')) return "bg-indigo-50 border-indigo-100/50";
                  return "bg-slate-50 border-slate-100/50";
                })()
              )}>
                <BookOpen size={9} strokeWidth={3} className="text-slate-400" /> {classGroupStr}
              </span>
            )}
          </div>
        </div>

        {/* Compact Right Side (Removed redundant icons, moved to bottom) */}
      </div>

      <div className="flex flex-col gap-2 pt-2 mt-1 border-t border-slate-50">
        <div className="flex justify-between items-center opacity-70">
          <div className="flex items-center gap-1">
            <CheckCircle2 size={9} className="text-primary" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tight">School Exp.: {tutor.school_teacher || 'No'}</span>
          </div>
          <span className="text-[#94A3B8] text-[8px] font-black uppercase tracking-tight">Own Vehicle: {tutor.have_vehicle || 'No'}</span>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => onClick(tutor)}
             className="flex-1 bg-slate-100 text-slate-900 h-8 rounded-lg font-[900] text-[10px] uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5"
           >
             View Profile
             <ChevronRight size={12} strokeWidth={3} className="text-slate-400" />
           </button>
           <button 
             onClick={(e) => { e.stopPropagation(); onShortlistToggle?.(tutorId, e); }}
             className={cn(
               "w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 border",
               isShortlisted ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-white border-slate-100 text-slate-300"
             )}
           >
             <Heart size={14} fill={isShortlisted ? "currentColor" : "none"} />
           </button>
        </div>
      </div>
    </div>
  );
});

TutorCard.displayName = 'TutorCard';