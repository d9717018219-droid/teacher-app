import React from 'react';
import { 
  MapPin, 
  ChevronRight, 
  Briefcase, 
  BadgeCheck,
  Heart,
  BookOpen,
  FlaskConical,
  Globe,
  GraduationCap,
  Calculator,
  Zap,
  Dna,
  Languages,
  TrendingUp,
  Code,
  Trophy,
  Clock,
  User,
  ShieldCheck,
  Car,
  CalendarDays,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  Percent,
  Palette
} from 'lucide-react';
import { TutorProfile } from '../types';
import { cn, toTitleCase } from '../utils';

interface TutorCardProps {
  tutor: TutorProfile;
  onClick: (tutor: TutorProfile) => void;
  isShortlisted?: boolean;
  onShortlistToggle?: (id: string, e: React.MouseEvent) => void;
}

const getSubjectStyles = (subjects: string = '') => {
  const s = subjects.toLowerCase();
  
  if (s.includes('math')) return { bg: 'bg-[#6366F1]', icon: <Calculator size={16} />, gradient: 'from-[#6366F1] to-[#4F46E5]' };
  if (s.includes('physics')) return { bg: 'bg-[#F43F5E]', icon: <Zap size={16} />, gradient: 'from-[#F43F5E] to-[#E11D48]' };
  if (s.includes('chem')) return { bg: 'bg-[#14B8A6]', icon: <FlaskConical size={16} />, gradient: 'from-[#14B8A6] to-[#0D9488]' };
  if (s.includes('bio') || s.includes('science')) return { bg: 'bg-[#84CC16]', icon: <Dna size={16} />, gradient: 'from-[#84CC16] to-[#65A30D]' };
  if (s.includes('english')) return { bg: 'bg-[#8B5CF6]', icon: <Languages size={16} />, gradient: 'from-[#8B5CF6] to-[#7C3AED]' };
  if (s.includes('hindi')) return { bg: 'bg-[#F97316]', icon: <Languages size={16} />, gradient: 'from-[#F97316] to-[#EA580C]' };
  if (s.includes('history') || s.includes('geo') || s.includes('sst') || s.includes('social')) return { bg: 'bg-[#10B981]', icon: <Globe size={16} />, gradient: 'from-[#10B981] to-[#059669]' };
  if (s.includes('eco') || s.includes('stat')) return { bg: 'bg-[#A855F7]', icon: <TrendingUp size={16} />, gradient: 'from-[#A855F7] to-[#9333EA]' };
  if (s.includes('account') || s.includes('business')) return { bg: 'bg-[#06B6D4]', icon: <Briefcase size={16} />, gradient: 'from-[#06B6D4] to-[#0891B2]' };
  if (s.includes('comput') || s.includes('coding') || s.includes('it')) return { bg: 'bg-[#1E293B]', icon: <Code size={16} />, gradient: 'from-[#1E293B] to-[#0F172A]' };
  if (s.includes('music') || s.includes('art')) return { bg: 'bg-[#D946EF]', icon: <Palette size={16} />, gradient: 'from-[#D946EF] to-[#C026D3]' };
  if (s.includes('yoga') || s.includes('dance') || s.includes('sport')) return { bg: 'bg-[#F472B6]', icon: <Trophy size={16} />, gradient: 'from-[#F472B6] to-[#DB2777]' };
  
  return { bg: 'bg-[#3B82F6]', icon: <GraduationCap size={16} />, gradient: 'from-[#3B82F6] to-[#2563EB]' };
};

const calculatePricing = (experience: string, classGroup: string[]) => {
  let baseFee = 4000;
  let sessions = 20;

  const exp = (experience || '').toLowerCase();
  
  if (exp.includes('1 to 3') || exp.includes('1-3')) baseFee = 5000;
  else if (exp.includes('3 to 5') || exp.includes('3-5')) baseFee = 6000;
  else if (exp.includes('5 to 10') || exp.includes('5-10') || exp.includes('10+') || exp.includes('above')) baseFee = 7000;
  else baseFee = 4000;

  const classes = (classGroup || []).join(', ').toLowerCase();
  
  if (classes.includes('xi to xii') || classes.includes('11') || classes.includes('12')) {
    baseFee += 1000;
    sessions = 12;
  } else if (classes.includes('ix to x') || classes.includes('9') || classes.includes('10')) {
    sessions = 12;
  } else if (classes.includes('vi to viii') || classes.includes('6') || classes.includes('7') || classes.includes('8')) {
    baseFee += 1000;
    sessions = 20;
  } else {
    sessions = 20;
  }

  const mrp = Math.ceil((baseFee * 1.45) / 500) * 500 - 1; 
  const discount = Math.round(((mrp - baseFee) / mrp) * 100);

  return { fee: baseFee, sessions, mrp, discount };
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
  const exp = tutor.experience || '1 to 3 Years';
  const qualArr = tutor.qualification || [];
  const qual = qualArr.length > 0 ? qualArr[0] : 'Graduate';
  const subjectsArr = tutor.subjects || [];
  const subjectsStr = subjectsArr.join(', ') || 'General';
  const gender = tutor.gender || 'Any';
  const age = tutor.age || '25+';
  const schoolTeacher = tutor.school_teacher === 'Yes';
  const haveVehicle = tutor.have_vehicle === 'Yes';
  const verified = tutor.verified === 'Yes';
  const classGroupArr = tutor.class_group || [];
  const classGroupStr = classGroupArr.join(', ') || 'N/A';
  
  const { icon, bg } = getSubjectStyles(subjectsStr);
  const { fee, sessions, mrp, discount } = calculatePricing(exp, classGroupArr);

  return (
    <div 
      onClick={() => onClick(tutor)}
      className="group relative bg-white rounded-xl p-3 flex flex-col gap-2.5 active:scale-[0.99] transition-all cursor-pointer border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400/30 mb-1.5"
    >
      {/* LinkedIn Style Header */}
      <div className="flex items-start gap-2.5">
        <div className="relative">
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-sm", bg)}>
            {React.cloneElement(icon as React.ReactElement, { size: 20 })}
          </div>
          {verified && (
            <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-0.5 border-2 border-white">
              <BadgeCheck size={10} className="text-white fill-blue-600" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h4 className="text-[14px] font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors leading-tight">
              {toTitleCase(name)}
            </h4>
            <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 shrink-0">
              <MapPin size={8} className="text-blue-600" />
              <span className="text-[8px] font-bold uppercase tracking-tight">{city}</span>
            </div>
          </div>
          <p className="text-[10px] text-blue-600 font-bold leading-none mb-1">#{tutorId}</p>
          
          <div className="flex items-center gap-1.5 flex-wrap text-[9px] text-slate-500 font-medium">
             <span className="flex items-center gap-1"><User size={9} /> {gender}</span>
             <span className="text-slate-300">•</span>
             <span>{age} Yrs</span>
             <span className="text-slate-300">•</span>
             <span className="flex items-center gap-1 font-bold text-slate-700">{exp} Exp</span>
          </div>
        </div>
      </div>

      {/* Professional Detail Rows */}
      <div className="flex flex-col gap-2 py-0.5">
         {/* Row 1: Qualification & Class Group */}
         <div className="flex flex-wrap gap-1.5">
            <div className="flex items-center gap-1.5 bg-white text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/30">
               <GraduationCap size={11} className="text-blue-500" />
               <span className="text-[10px] font-bold tracking-tight">{qual}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50/30">
               <BookOpen size={11} className="text-indigo-500" />
               <span className="text-[10px] font-bold tracking-tight">{classGroupStr}</span>
            </div>
         </div>

         {/* Row 2: Teacher & Vehicle Status */}
         <div className="flex flex-wrap gap-1.5">
            <div className={cn(
               "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-sm transition-all",
               schoolTeacher 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-slate-50 text-slate-400 border-slate-100"
            )}>
               <ShieldCheck size={11} className={schoolTeacher ? "text-emerald-500" : "text-slate-300"} />
               <span className="text-[9px] font-black uppercase tracking-tight">School Teacher: {schoolTeacher ? 'Yes' : 'No'}</span>
            </div>
            <div className={cn(
               "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-sm transition-all",
               haveVehicle 
                ? "bg-blue-50 text-blue-700 border-blue-200" 
                : "bg-slate-50 text-slate-400 border-slate-100"
            )}>
               <Car size={11} className={haveVehicle ? "text-blue-500" : "text-slate-300"} />
               <span className="text-[9px] font-black uppercase tracking-tight">Own Vehicle: {haveVehicle ? 'Yes' : 'No'}</span>
            </div>
         </div>
      </div>

      {/* LinkedIn Style Subjects */}
      <div className="text-[9px] text-slate-600 line-clamp-1 border-t border-slate-50 pt-1.5 flex items-center gap-1.5">
         <div className="w-1 h-1 bg-blue-400 rounded-full" />
         <span className="font-bold text-slate-500 uppercase text-[8px] tracking-wider">Expertise:</span>
         <span className="font-medium text-slate-700">{subjectsStr}</span>
      </div>

      {/* Pricing & CTA Row */}
      <div className="flex items-center justify-between mt-0.5 pt-2 border-t border-slate-100">
         <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
               <span className="text-[17px] font-extrabold text-slate-900 leading-none">₹{fee.toLocaleString()}</span>
               <span className="text-[10px] text-slate-400 line-through font-medium">₹{mrp.toLocaleString()}</span>
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">/mo</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className="text-[9px] font-black text-green-600 flex items-center gap-0.5">
                  {discount}% OFF
               </span>
               <span className="text-[8px] font-bold text-slate-400">• {sessions} SESS</span>
            </div>
         </div>

         <div className="flex items-center gap-1.5">
            <button 
              onClick={(e) => { e.stopPropagation(); onShortlistToggle?.(tutorId, e); }}
              className={cn(
                "p-1.5 rounded-lg border transition-all active:scale-90",
                isShortlisted ? "bg-red-50 border-red-100 text-red-500" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
              )}
            >
              <Heart size={14} fill={isShortlisted ? "currentColor" : "none"} />
            </button>
            <button className="bg-[#0A66C2] hover:bg-[#004182] text-white px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors shadow-sm active:scale-95 flex items-center gap-1.5">
               View <ArrowUpRight size={12} />
            </button>
         </div>
      </div>
    </div>
  );
});

TutorCard.displayName = 'TutorCard';