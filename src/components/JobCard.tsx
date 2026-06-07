import React, { useRef } from 'react';
import { 
  MapPin, 
  ChevronRight, 
  Heart, 
  Clock,
  Briefcase,
  BookOpen,
  FlaskConical,
  Globe,
  Monitor,
  Music,
  Palette,
  Trophy,
  GraduationCap,
  Calculator,
  Zap,
  Dna,
  Languages,
  TrendingUp,
  FileText,
  Code,
  Sparkles,
  Baby,
  User
} from 'lucide-react';
import { JobLead } from '../types';
import { cn, formatCurrency, formatPostedDate, toTitleCase, cleanValue } from '../utils';

interface JobCardProps {
  job: JobLead;
  onClick: (job: JobLead) => void;
  isShortlisted?: boolean;
  onShortlistToggle?: (id: string, e: React.MouseEvent) => void;
}

const getSubjectStyles = (subject: string = '', classStr: string = '') => {
  const s = subject.toLowerCase();
  const c = classStr.toLowerCase();
  
  if (s.includes('math')) return { bg: 'bg-blue-600', icon: <Calculator size={24} /> };
  if (s.includes('physics')) return { bg: 'bg-red-500', icon: <Zap size={24} /> };
  if (s.includes('chem')) return { bg: 'bg-teal-500', icon: <FlaskConical size={24} /> };
  if (s.includes('bio') || s.includes('science')) return { bg: 'bg-lime-600', icon: <Dna size={24} /> };
  if (s.includes('english')) return { bg: 'bg-indigo-600', icon: <Languages size={24} /> };
  if (s.includes('hindi')) return { bg: 'bg-orange-600', icon: <Languages size={24} /> };
  if (s.includes('history') || s.includes('geo') || s.includes('sst') || s.includes('social')) return { bg: 'bg-emerald-600', icon: <Globe size={24} /> };
  if (s.includes('eco') || s.includes('stat')) return { bg: 'bg-violet-600', icon: <TrendingUp size={24} /> };
  if (s.includes('account') || s.includes('business')) return { bg: 'bg-cyan-600', icon: <Briefcase size={24} /> };
  if (s.includes('comput') || s.includes('coding') || s.includes('it') || s.includes('python') || s.includes('java')) return { bg: 'bg-slate-800', icon: <Code size={24} /> };
  if (s.includes('music') || s.includes('guitar') || s.includes('piano')) return { bg: 'bg-fuchsia-500', icon: <Music size={24} /> };
  if (s.includes('art') || s.includes('paint') || s.includes('draw')) return { bg: 'bg-amber-400', icon: <Palette size={24} /> };
  if (s.includes('sport') || s.includes('chess') || s.includes('yoga') || s.includes('dance')) return { bg: 'bg-pink-500', icon: <Trophy size={24} /> };
  
  // Class based defaults
  if (c.includes('nursery') || c.includes('lkg') || c.includes('ukg') || c.includes('kg')) return { bg: 'bg-rose-400', icon: <Baby size={24} /> };
  if (c.includes('1') || c.includes('2') || c.includes('3') || c.includes('4') || c.includes('5')) return { bg: 'bg-sky-500', icon: <BookOpen size={24} /> };
  if (c.includes('all') || s.includes('all')) return { bg: 'bg-primary', icon: <Sparkles size={24} /> };
  
  return { bg: 'bg-primary', icon: <GraduationCap size={24} /> };
};

export const JobCard: React.FC<JobCardProps> = React.memo(({ 
  job, 
  onClick, 
  isShortlisted, 
  onShortlistToggle 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const getValue = (keys: string[], fallback: string = '–') => {
    if (!job) return fallback;
    for (const key of keys) {
      const val = (job as any)[key];
      if (val !== undefined && val !== null && val !== '') return val;
    }
    return fallback;
  };

  const subjects = cleanValue(getValue(['subjects', 'Subjects', 'Preferred Subject(s)'], 'General')).trim();
  const classBoard = cleanValue(getValue(['Class / Board', 'classBoard', 'Class'], ((job.Class || '') + (job.Board ? ' (' + job.Board + ')' : '')) || 'General'));
  const { bg, icon } = getSubjectStyles(subjects, classBoard);
  
  const jobId = getValue(['Order ID', 'order_id', 'id', 'ID'], 'N/A').toString();
  const locationRaw = getValue(['Locations', 'locations', 'City', 'city'], 'India');
  const locality = locationRaw.toString().split(/[;,]/).map(l => l.trim().split('-')[0].trim())[0];
  const city = getValue(['City', 'city'], 'India').toString();
  const location = `${locality} - ${city}`;
  
  const postedDate = formatPostedDate(getValue(['Updated Time', 'Record Added', 'updated_at', 'record_added'], ''));
  const isNew = true; 
  const requiredGender = getValue(['Gender', 'gender', 'requiredGender'], 'Any').toString();
  const fee = getValue(['Fee', 'fee', 'monthly_fee'], '0').toString();

  const rawName = getValue(['Name', 'name', 'fullName'], subjects + ' Teacher').toString();
  const name = rawName.replace(/\s*[Jj]i\s*$/, '').replace(/\s*[Jj]i\s+/g, ' ');

  return (
    <div 
      ref={cardRef}
      onClick={() => onClick(job)}
      className="bg-white rounded-[20px] p-3 shadow-sm border border-slate-100 flex flex-col gap-2.5 active:scale-[0.98] transition-all cursor-pointer relative group overflow-hidden"
    >
      <div className="flex items-start gap-2.5">
        {/* Left Icon Box - Smaller */}
        <div className={cn("w-[54px] h-[54px] rounded-[16px] flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm text-white", bg)}>
          {icon}
        </div>

        {/* Middle Content */}
        <div className="flex-1 space-y-0.5 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[#10B981] text-[10.5px] font-bold tracking-tight">Order ID: {jobId}</span>
            {isNew && (
              <span className="bg-[#DCFCE7] text-[#166534] px-2 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider">NEW</span>
            )}
          </div>
          
          <h4 className="text-[16px] font-[800] text-[#0F172A] leading-tight tracking-tight truncate">
            {classBoard}
          </h4>
          <p className="text-[#64748B] text-[12px] font-[600] line-clamp-2 text-indigo-600 leading-tight">{toTitleCase(subjects)}</p>
          
          <div className="flex items-center gap-1 text-[#64748B] text-[12px] font-[500] pt-0.5">
            <MapPin size={11} className="text-slate-400" />
            <span className="truncate">{location}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-slate-50">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-500 text-[8px] font-black uppercase tracking-tight flex items-center gap-1">
              <User size={8} /> {requiredGender} Required
            </span>
          </div>
          <div className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">
            <span className="text-[10px] font-black tracking-tighter whitespace-nowrap">
              ₹{formatCurrency(fee)}/month
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => onClick(job)}
             className="flex-1 bg-slate-100 text-[#191445] h-8 rounded-lg font-[900] text-[10px] uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5"
           >
             View Details
             <ChevronRight size={12} strokeWidth={3} className="text-[#191445] opacity-50" />
           </button>
           <button 
             onClick={(e) => { e.stopPropagation(); onShortlistToggle?.(jobId, e); }}
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

JobCard.displayName = 'JobCard';