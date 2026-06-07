import React from 'react';
import { Search, Filter, MapPin, BookOpen, User as LucideUser, X, Loader2, ArrowRight, Share2 } from 'lucide-react';
import { JobLead, UserGender } from '../types';
import { JobCard } from './JobCard';
import { cn, toTitleCase } from '../utils';

interface JobsViewProps {
  finalJobs: JobLead[];
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
  sortBy: 'newest' | 'fee_high';
  setSortBy: (sort: 'newest' | 'fee_high') => void;
  visibleJobsCount: number;
  setVisibleJobsCount: (count: (prev: number) => number) => void;
  setSelectedJob: (job: JobLead) => void;
  shortlistedIds: string[];
  toggleShortlist: (id: string, e: React.MouseEvent) => void;
  userFirstName?: string;
  userGender?: string;
}

export const JobsView: React.FC<JobsViewProps> = ({
  finalJobs,
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
  visibleJobsCount,
  setVisibleJobsCount,
  setSelectedJob,
  shortlistedIds,
  toggleShortlist,
  userFirstName,
  userGender
}) => {
  const totalPotentialEarnings = React.useMemo(() => {
    return finalJobs.reduce((sum, job) => {
      const feeStr = (job as any).Fee || (job as any).fee || (job as any).monthly_fee || '0';
      const fee = parseInt(feeStr.toString().replace(/[^0-9]/g, '')) || 0;
      return sum + fee;
    }, 0);
  }, [finalJobs]);

  return (
    <div className="px-5 pt-3 space-y-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[16px] font-[1000] text-slate-900 tracking-tighter leading-none">Jobs Portal</h2>
        <p className="text-slate-400 text-[9px] font-bold tracking-tight uppercase">Teaching Opportunities</p>
      </div>

      {/* Motivation Section */}
      {!loading && (
        <div 
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
          className="bg-gradient-to-r from-[#5ABFA2] to-[#4AA58B] rounded-[32px] p-5 shadow-xl shadow-[#5ABFA2]/20 relative overflow-hidden group border border-white/20"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-10 -mb-10 blur-2xl opacity-20" />
          
          <div className="relative z-10 space-y-3">
            <div className="space-y-1">
              <h3 className="text-white text-[19px] font-black tracking-tight leading-tight">
                {finalJobs.length > 0 ? (
                  <>Hey {userFirstName || 'Teacher'}, <span className="text-yellow-200">{finalJobs.length} Jobs</span> in {cityFilter && cityFilter !== 'all' ? toTitleCase(cityFilter) : 'your city'}! 🚀</>
                ) : (
                  <>No Jobs in {cityFilter && cityFilter !== 'all' ? toTitleCase(cityFilter) : 'your city'}? 🌟</>
                )}
              </h3>
              <p className="text-white/90 text-[11px] font-bold leading-relaxed max-w-[90%]">
                {finalJobs.length > 0 ? (
                  <>Book demo & start earning up to <span className="text-yellow-100 font-black">₹{totalPotentialEarnings.toLocaleString()}</span> monthly!</>
                ) : (
                  <>Share app with friends to get new home tutor requirements here!</>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-2 pt-1">
              <button 
                onClick={() => {
                  if (finalJobs.length > 0) {
                    const jobsList = document.getElementById('jobs-list-container');
                    if (jobsList) {
                      const yOffset = -80; 
                      const y = jobsList.getBoundingClientRect().top + window.pageYOffset + yOffset;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  } else {
                    if (navigator.share) {
                      navigator.share({
                        title: 'DoAble India - Home Tutors',
                        text: 'Looking for a Home Tutor? Post your requirement on DoAble India!',
                        url: window.location.origin
                      }).catch(() => {});
                    } else {
                      const shareText = encodeURIComponent('Looking for a Home Tutor? Post your requirement on DoAble India! ' + window.location.origin);
                      window.open(`https://wa.me/?text=${shareText}`, '_blank');
                    }
                  }
                }}
                className="bg-white text-[#4AA58B] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-2"
              >
                {finalJobs.length > 0 ? (
                  <>View Jobs <ArrowRight size={12} strokeWidth={3} /></>
                ) : (
                  <>Share App <Share2 size={12} strokeWidth={3} /></>
                )}
              </button>
              <div className="h-8 w-px bg-white/20 mx-1" />
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white/30 bg-indigo-400 flex items-center justify-center text-[8px] text-white font-black overflow-hidden">
                    <LucideUser size={10} />
                  </div>
                ))}
                <div className="w-6 h-6 rounded-full border-2 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-[7px] text-white font-black">
                  +50
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-2.5 sticky top-[64px] z-50 bg-white/70 backdrop-blur-md py-2 -mx-5 px-5 no-line sticky-fix border-b border-slate-100/50">
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
         <div className="text-[14px] font-black text-slate-900 tracking-tighter">{finalJobs.length} Jobs found</div>
         <div className="flex items-center gap-2">
           <span className="text-[11px] font-bold text-[#191445]">Sort by:</span>
           <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-transparent text-[8.5px] font-black text-[#191445] tracking-tight outline-none">
             <option value="newest">Newest First</option>
             <option value="fee_high">Highest Fee</option>
           </select>
         </div>
      </div>

      <div id="jobs-list-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
         {loading ? (
           <div className="col-span-full py-20 flex flex-col items-center gap-4">
             <Loader2 className="animate-spin text-primary" size={32} />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Leads...</span>
           </div>
         ) : finalJobs.length > 0 ? (
           <>
             {finalJobs.slice(0, visibleJobsCount).map((job) => (
               <JobCard 
                 key={job.id || job['Order ID']} 
                 job={job} 
                 onClick={setSelectedJob} 
                 isShortlisted={shortlistedIds.includes(job.id || job['Order ID'] || '')} 
                 onShortlistToggle={toggleShortlist} 
               />
             ))}
             {visibleJobsCount < finalJobs.length && (
               <div className="col-span-full py-10 flex justify-center">
                 <button onClick={() => setVisibleJobsCount(prev => prev + 10)} className="bg-primary text-white px-10 py-4 rounded-2xl font-[800] text-[12px] uppercase shadow-xl active:scale-95 transition-all">
                   Load More Jobs
                 </button>
               </div>
             )}
           </>
         ) : (
           <div className="col-span-full py-20 text-center space-y-4 bg-white/50 rounded-[40px] border border-slate-100">
             <div className="text-4xl">🔍</div>
             <div className="space-y-1">
               <h3 className="text-lg font-[900] text-slate-900 uppercase tracking-tighter">No jobs found</h3>
               <p className="text-xs text-slate-500 font-bold max-w-[200px] mx-auto">Try changing your location or filters to see more results.</p>
             </div>
             <button onClick={clearFilters} className="bg-gradient-to-r from-[#FF8C00] to-[#EC4899] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg">
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
