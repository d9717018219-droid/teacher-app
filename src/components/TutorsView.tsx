import React from 'react';
import { Search, Filter, MapPin, BookOpen, User as LucideUser, X, Loader2 } from 'lucide-react';
import { TutorProfile, UserGender } from '../types';
import { TutorCard } from './TutorCard';
import { cn, toTitleCase } from '../utils';

interface TutorsViewProps {
  finalTutors: TutorProfile[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setShowAdvancedFilterDrawer: (show: boolean) => void;
  cityFilter: string;
  filterLocalities: string[];
  filterClasses: string[];
  filterGender: UserGender;
  clearFilters: () => void;
  setShowQuickPicker: (type: 'city' | 'locality' | 'class' | 'gender' | null) => void;
  sortBy: 'newest' | 'fee_high' | 'fee_low' | 'verified';
  setSortBy: (sort: 'newest' | 'fee_high' | 'fee_low' | 'verified') => void;
  visibleTutorsCount: number;
  setVisibleTutorsCount: (count: (prev: number) => number) => void;
  setSelectedTutor: (tutor: TutorProfile) => void;
  shortlistedIds: string[];
  toggleShortlist: (id: string, e: React.MouseEvent) => void;
}

export const TutorsView: React.FC<TutorsViewProps> = ({
  finalTutors,
  loading,
  searchQuery,
  setSearchQuery,
  setShowAdvancedFilterDrawer,
  cityFilter,
  filterLocalities,
  filterClasses,
  filterGender,
  clearFilters,
  setShowQuickPicker,
  sortBy,
  setSortBy,
  visibleTutorsCount,
  setVisibleTutorsCount,
  setSelectedTutor,
  shortlistedIds,
  toggleShortlist
}) => {
  return (
    <div className="px-5 pt-3 space-y-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[16px] font-[1000] text-slate-900 tracking-tighter leading-none">Experts Hub</h2>
        <p className="text-slate-400 text-[9px] font-bold tracking-tight uppercase">Premium Educators</p>
      </div>

      <div className="flex flex-col gap-2.5 sticky top-[64px] z-50 bg-[#F8FAFC]/95 backdrop-blur-md py-2 -mx-5 px-5 no-line sticky-fix border-b border-slate-100/50">
         <div className="flex items-center gap-2">
            <div className="flex-1 relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#191445] transition-colors" size={11} />
              <input 
                type="text" 
                placeholder="Search Name or Tutor ID..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-xl h-9 pl-8 pr-6 text-[7px] placeholder:text-[7px] font-bold focus:outline-none focus:border-primary transition-all shadow-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                  <X size={11} />
                </button>
              )}
            </div>
         </div>
         <div className="flex items-center gap-2 w-full">
            <div className="flex-1 flex items-center gap-1.5 px-0.5 overflow-x-auto no-scrollbar pb-1">
              {(cityFilter !== 'all' || filterLocalities.length > 0 || filterClasses.length > 0 || filterGender !== 'All') && (
                <FilterChip icon={<X size={9} />} label="Clear" onClick={clearFilters} isClear />
              )}
              <FilterChip icon={<MapPin size={9} />} label={toTitleCase(cityFilter === 'all' ? 'City' : cityFilter)} active={cityFilter !== 'all'} onClick={() => setShowQuickPicker('city')} />
              <FilterChip icon={<MapPin size={9} />} label={filterLocalities.length > 0 ? `${filterLocalities.length} Locs` : 'Area'} active={filterLocalities.length > 0} onClick={() => setShowQuickPicker('locality')} />
              <FilterChip icon={<BookOpen size={9} />} label={filterClasses.length > 0 ? `${filterClasses.length} Cls` : 'Class'} active={filterClasses.length > 0} onClick={() => setShowQuickPicker('class')} />
              <FilterChip icon={<LucideUser size={9} />} label={filterGender !== 'All' ? filterGender : 'Gender'} active={filterGender !== 'All'} onClick={() => setShowQuickPicker('gender')} />
              <div className="min-w-[10px] h-1" />
            </div>
            <button 
              onClick={() => setShowAdvancedFilterDrawer(true)} 
              className="h-8 w-8 shrink-0 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-[#191445] transition-all active:scale-95 shadow-sm mb-1"
            >
              <Filter size={13} strokeWidth={2.5} />
            </button>
         </div>
      </div>

      <div className="flex justify-between items-center px-1">
         <div className="text-[13px] tracking-tight">
           <span className="font-black text-primary">{finalTutors.length}</span> 
           <span className="font-bold text-slate-400 text-[11px] ml-1.5">Tutors found</span>
         </div>
         <div className="flex items-center gap-2">
           <span className="text-[10px] font-black text-[#191445] tracking-tight">Sort:</span>
           <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-transparent text-[8.5px] font-black text-[#191445] tracking-tight outline-none cursor-pointer">
             <option value="newest">Newest First</option>
             <option value="fee_high">Salary: High to Low</option>
             <option value="fee_low">Salary: Low to High</option>
             <option value="verified">Verified Experts</option>
           </select>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
         {loading ? (
           <div className="col-span-full py-20 flex flex-col items-center gap-4">
             <Loader2 className="animate-spin text-primary" size={32} />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Experts...</span>
           </div>
         ) : finalTutors.length > 0 ? (
           <>
             {finalTutors.slice(0, visibleTutorsCount).map((tutor) => (
               <TutorCard 
                 key={tutor.id || tutor.tutor_id} 
                 tutor={tutor} 
                 onClick={setSelectedTutor} 
                 isShortlisted={shortlistedIds.includes(tutor.id || tutor.tutor_id || '')} 
                 onShortlistToggle={toggleShortlist} 
               />
             ))}
             {visibleTutorsCount < finalTutors.length && (
               <div className="col-span-full py-10 flex justify-center">
                 <button onClick={() => setVisibleTutorsCount(prev => prev + 10)} className="bg-primary text-white px-10 py-4 rounded-2xl font-[800] text-[12px] uppercase shadow-xl active:scale-95 transition-all">
                   Load More Tutors
                 </button>
               </div>
             )}
           </>
         ) : (
           <div className="col-span-full py-20 text-center space-y-4 bg-white/50 rounded-[40px] border border-slate-100">
             <div className="text-4xl">🔍</div>
             <div className="space-y-1">
               <h3 className="text-lg font-[900] text-slate-900 uppercase tracking-tighter">No experts found</h3>
               <p className="text-xs text-slate-500 font-bold max-w-[200px] mx-auto">Try changing your location or filters to see more results.</p>
             </div>
             <button onClick={clearFilters} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
               Reset All
             </button>
           </div>
         )}
      </div>
    </div>
  );
};

function FilterChip({ icon, label, active, onClick, isClear }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void; isClear?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black transition-all whitespace-nowrap active:scale-95 shadow-sm border uppercase tracking-tighter",
        isClear 
          ? "bg-[#7A2153] text-white border-[#7A2153]" 
          : active 
            ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-blue-400 shadow-blue-100" 
            : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
      )}
    >
      <span className={cn("shrink-0", active || isClear ? "text-white" : "text-slate-400")}>{icon}</span>
      {label}
    </button>
  );
}
