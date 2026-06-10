import React, { useState } from 'react';
import { Settings, X, LucideUser, Phone, GraduationCap, FileText, ShieldCheck, MapPin, BookOpen, Edit3, Sparkles, Clock, Camera, Trash2, Loader2, LogOut, Check, Mail } from 'lucide-react';
import { ProfileState } from '../../hooks/useProfileState';
import { UserType, TutorProfile } from '../../types';
import { cn } from '../../utils';
import {
  CITIES_LIST,
  CLASSES_LIST,
  SPECIALIZED_SUB_CATEGORIES,
  SPECIALIZED_SUBJECTS,
  CLASS_SUBJECTS_DATA,
  CLASS_GROUP_MAPPING,
  CITY_TO_LOCATIONS_DATA,
  TUTOR_QUALIFICATIONS_LIST,
  TUTOR_EXPERIENCE_LIST,
  TUTOR_FEE_LIST,
  TIME_LIST
} from '../../utils/constants';

interface ProfileSetupWizardProps {
  show: boolean;
  onClose: () => void;
  profile: ProfileState & { email: string };
  updateField: (field: keyof ProfileState, value: any) => void;
  onUpdate: () => Promise<void>;
  onDelete: () => Promise<void>;
  onLogout: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
  playTapSound: () => void;
  tutors: TutorProfile[];
}

export const ProfileSetupWizard: React.FC<ProfileSetupWizardProps> = ({
  show,
  onClose,
  profile,
  updateField,
  onUpdate,
  onDelete,
  onLogout,
  isUpdating,
  isDeleting,
  playTapSound,
  tutors
}) => {
  const {
    userFirstName, userLastName, userCountryCode, userPhone, userGender,
    userType, userDob, userAge, userAadhar, userAddress, userClasses,
    userSubjects, userBoard, aboutMe, userCommunication, userMode,
    userCity, userLocalities, userResidency, userDays, userTime,
    userDuration, userQualifications, userExperience, userFee,
    hasVehicle, userSelfie, profilePhoto, userName, tutorId, email, userEmail
  } = profile;

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image is too large. Please select an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateField('userSelfie', base64String);
        localStorage.setItem('userSelfie', base64String);
        
        updateField('profilePhoto', base64String);
        localStorage.setItem('userPhoto', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div className="relative bg-white w-full max-w-[420px] rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[90vh] border border-white/20">
         
         <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white pt-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Settings size={20} />
              </div>
              <div>
                <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-900 leading-none">
                  Complete Your Profile
                </h3>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                  Update all your details in one place
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all"><X size={16} /></button>
         </div>

         <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
            <div className="space-y-10 pb-10">
              {/* ─── SECTION 1: IDENTITY ─── */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-primary">
                  <LucideUser size={16} />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Identity & Basics</h4>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">First Name</label>
                      <input type="text" value={userFirstName} onChange={(e) => { const val = e.target.value; updateField('userFirstName', val); localStorage.setItem('userFirstName', val); const full = `${val} ${userLastName}`.trim(); updateField('userName', full); localStorage.setItem('userName', full); }} placeholder="Rahul" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Last Name</label>
                      <input type="text" value={userLastName} onChange={(e) => { const val = e.target.value; updateField('userLastName', val); localStorage.setItem('userLastName', val); const full = `${userFirstName} ${val}`.trim(); updateField('userName', full); localStorage.setItem('userName', full); }} placeholder="Sharma" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">WhatsApp Number</label>
                    <div className="flex gap-2">
                      <div className="w-24 relative">
                        <select value={userCountryCode} onChange={(e) => { updateField('userCountryCode', e.target.value); localStorage.setItem('userCountryCode', e.target.value); }} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-3 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all appearance-none">
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+971">🇦🇪 +971</option>
                          <option value="+61">🇦🇺 +61</option>
                          <option value="+1">🇨🇦 +1</option>
                          <option value="+65">🇸🇬 +65</option>
                        </select>
                      </div>
                      <div className="flex-1 relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input type="tel" value={userPhone || ''} onChange={(e) => { updateField('userPhone', e.target.value); localStorage.setItem('userPhone', e.target.value); }} placeholder="9971XXXXXX" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input type="email" value={userEmail || ''} onChange={(e) => { updateField('userEmail', e.target.value); localStorage.setItem('userEmail', e.target.value); }} placeholder="rahul@example.com" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">{userType === 'parent' ? 'Tutor Gender Preference' : 'Gender'}</label>
                    <div className="flex flex-wrap gap-2">
                      {(userType === 'teacher' ? ['Male', 'Female', 'Transgender'] : ['Male', 'Female', 'Any']).map(g => (
                        <button key={g} onClick={() => { playTapSound(); updateField('userGender', g); localStorage.setItem('userGender', g); }} className={cn("flex-1 px-4 py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all", userGender === g ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white")}>{g}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── SECTION 2: PERSONAL (TUTOR) or ACADEMICS (PARENT) ─── */}
              {userType === 'teacher' ? (
                <div className="space-y-6 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-primary">
                    <FileText size={16} />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Personal Details</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Date of Birth</label>
                        <input type="date" value={userDob} onChange={(e) => { updateField('userDob', e.target.value); localStorage.setItem('userDob', e.target.value); }} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Age</label>
                        <div className="w-full bg-slate-100 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-bold text-slate-500">{userAge ? `${userAge} Years` : 'Select DOB'}</div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Aadhar Number</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input type="text" maxLength={12} value={userAadhar} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); updateField('userAadhar', val); localStorage.setItem('userAadhar', val); }} placeholder="12-digit Aadhar Number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Full Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-4 text-slate-300" size={16} />
                        <textarea value={userAddress} onChange={(e) => { updateField('userAddress', e.target.value); localStorage.setItem('userAddress', e.target.value); }} placeholder="House No, Street, Landmark..." rows={3} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all resize-none" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-primary">
                    <BookOpen size={16} />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Academic Requirements</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Class Group</label>
                      <div className="grid grid-cols-2 gap-2">
                        {CLASSES_LIST.map(c => {
                          const isGroupActive = userClasses.includes(c) || (CLASS_GROUP_MAPPING[c] || []).some(sub => userClasses.includes(sub));
                          return (
                            <button key={c} onClick={() => { playTapSound(); updateField('userClasses', [c]); localStorage.setItem('userClasses', JSON.stringify([c])); updateField('userSubjects', []); }} className={cn("p-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-tighter text-center transition-all", isGroupActive ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white")}>{c}</button>
                          );
                        })}
                      </div>
                    </div>
                    {(() => {
                      const currentGroup = CLASSES_LIST.find(g => userClasses.includes(g) || (CLASS_GROUP_MAPPING[g] || []).some(s => userClasses.includes(s)));
                      if (!currentGroup) return null;
                      return (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Specific Class</label>
                          <div className="flex flex-wrap gap-2">
                            {(CLASS_GROUP_MAPPING[currentGroup] || []).map(sub => (
                              <button 
                                key={sub} 
                                onClick={() => { 
                                  playTapSound(); 
                                  const next = userClasses.includes(sub) 
                                    ? userClasses.filter(c => c !== sub) 
                                    : [...userClasses.filter(c => CLASSES_LIST.includes(c)), sub]; 
                                  updateField('userClasses', next); 
                                  localStorage.setItem('userClasses', JSON.stringify(next)); 
                                }} 
                                className={cn("px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-tighter transition-all", userClasses.includes(sub) ? "border-primary bg-primary text-white" : "border-slate-100 text-slate-400 bg-white")}
                              >
                                {sub}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">
                        {userClasses.includes('Entrance Exam & Specialization') ? 'Exam / Category' : 'Board'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(userClasses.includes('Entrance Exam & Specialization') 
                          ? (SPECIALIZED_SUB_CATEGORIES['Entrance Exam & Specialization'] || [])
                          : ['CBSE', 'ICSE', 'State Board', 'IB/IGCSE']
                        ).map(b => (
                          <button key={b} onClick={() => { playTapSound(); updateField('userBoard', b); localStorage.setItem('userBoard', b); updateField('userSubjects', []); }} className={cn("p-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-tighter text-center transition-all", userBoard === b ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white")}>{b}</button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Subjects Needed</label>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          if (userClasses.includes('Entrance Exam & Specialization')) {
                            const subjects = SPECIALIZED_SUBJECTS[userBoard];
                            if (!subjects) return [];
                            
                            if (Array.isArray(subjects)) {
                              return subjects.map(s => (
                                <button key={s} onClick={() => { playTapSound(); const next = userSubjects.includes(s) ? userSubjects.filter(v => v !== s) : [...userSubjects, s]; updateField('userSubjects', next); localStorage.setItem('userSubjects', JSON.stringify(next)); }} className={cn("px-4 py-2 rounded-full border-2 font-black text-[9px] uppercase tracking-widest transition-all whitespace-normal text-left", userSubjects.includes(s) ? "border-primary bg-primary text-white shadow-lg shadow-primary/20" : "border-slate-100 text-slate-400 bg-white")}>{s}</button>
                              ));
                            } else {
                              // Grouped Subjects (Languages)
                              return Object.entries(subjects).map(([group, subjs]: [string, any]) => (
                                <div key={group} className="w-full space-y-2 mt-2">
                                  <div className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest border-l-2 border-primary/30 pl-2">{group}</div>
                                  <div className="flex flex-wrap gap-2">
                                    {subjs.map((s: string) => (
                                      <button key={s} onClick={() => { playTapSound(); const next = userSubjects.includes(s) ? userSubjects.filter(v => v !== s) : [...userSubjects, s]; updateField('userSubjects', next); localStorage.setItem('userSubjects', JSON.stringify(next)); }} className={cn("px-4 py-2 rounded-full border-2 font-black text-[9px] uppercase tracking-widest transition-all whitespace-normal text-left", userSubjects.includes(s) ? "border-primary bg-primary text-white shadow-lg shadow-primary/20" : "border-slate-100 text-slate-400 bg-white")}>{s}</button>
                                    ))}
                                  </div>
                                </div>
                              ));
                            }
                          }
                          const groupName = userClasses[0];
                          return (groupName ? CLASS_SUBJECTS_DATA[groupName] || [] : []).map(s => (
                            <button key={s} onClick={() => { playTapSound(); const next = userSubjects.includes(s) ? userSubjects.filter(v => v !== s) : [...userSubjects, s]; updateField('userSubjects', next); localStorage.setItem('userSubjects', JSON.stringify(next)); }} className={cn("px-4 py-2 rounded-full border-2 font-black text-[9px] uppercase tracking-widest transition-all whitespace-normal text-left", userSubjects.includes(s) ? "border-primary bg-primary text-white shadow-lg shadow-primary/20" : "border-slate-100 text-slate-400 bg-white")}>{s}</button>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── SECTION 3: BIO & COMM (TUTOR) or LOCATION (PARENT) ─── */}
              {userType === 'teacher' ? (
                <div className="space-y-6 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-primary">
                    <Edit3 size={16} />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Bio & Communication</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">About Me (Catchy Bio)</label>
                      <div className="relative">
                        <Edit3 className="absolute left-4 top-4 text-slate-300" size={16} />
                        <textarea value={aboutMe} onChange={(e) => { updateField('aboutMe', e.target.value); localStorage.setItem('aboutMe', e.target.value); }} placeholder="Write a short, catchy bio. Mention teaching style & why parents should hire you." rows={4} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-[12px] font-bold text-slate-700 outline-none focus:border-primary transition-all resize-none" />
                        <div className="flex items-center gap-1.5 mt-2 ml-1 text-primary">
                          <Sparkles size={12} />
                          <span className="text-[9px] font-black uppercase tracking-tight">Pro-Tip: Use AI like ChatGPT or Gemini.</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Communication Proficiency</label>
                      <div className="space-y-2">
                        {[
                          { label: 'Beginner', desc: 'Hindi/Regional preferred', value: 'Beginner: Understands English prefers teaching in Hindi/Regional Language' },
                          { label: 'Intermediate', desc: 'Speaks/Explains in English', value: 'Intermediate: Speaks comfortably explains concepts in English.' },
                          { label: 'Fluent', desc: 'Strictly English sessions', value: 'Fluent: Teaches the entire session strictly in English.' }
                        ].map(item => (
                          <button key={item.label} onClick={() => { playTapSound(); updateField('userCommunication', item.value); localStorage.setItem('userCommunication', item.value); }} className={cn("w-full p-4 rounded-2xl border-2 text-left transition-all", userCommunication === item.value ? "border-primary bg-primary/5 shadow-md" : "border-slate-100 bg-white")}>
                            <span className={cn("text-[11px] font-black uppercase tracking-wider block", userCommunication === item.value ? "text-primary" : "text-slate-700")}>{item.label}</span>
                            <p className="text-[9px] font-bold text-slate-400 leading-tight">{item.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-primary">
                    <MapPin size={16} />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Location & Mode</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Mode of Learning</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["At Student's Place", "At Tutor's Place", 'Online', 'At Institute'].map(m => (
                          <button key={m} onClick={() => { playTapSound(); updateField('userMode', m); localStorage.setItem('userMode', m); }} className={cn("py-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1", userMode === m ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white")}>
                            <span>{m.includes('Student') ? '🏠' : m.includes('Tutor') ? '👨‍🏫' : m === 'Online' ? '💻' : '🏢'}</span>
                            <span className="text-center px-1">{m}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    {userMode !== 'Online' && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">City</label>
                          <select value={userCity} onChange={(e) => { updateField('userCity', e.target.value); localStorage.setItem('userCity', e.target.value); updateField('userLocalities', []); }} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all appearance-none">{CITIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Locality</label>
                          <select value={userLocalities[0] || ''} onChange={(e) => { updateField('userLocalities', [e.target.value]); localStorage.setItem('userLocalities', JSON.stringify([e.target.value])); }} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all appearance-none"><option value="">Select Locality</option>{(CITY_TO_LOCATIONS_DATA[userCity] || []).map(l => <option key={l} value={l}>{l}</option>)}</select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Society / Block</label>
                          <div className="relative"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} /><input type="text" value={userResidency || ''} onChange={(e) => { updateField('userResidency', e.target.value); localStorage.setItem('userResidency', e.target.value); }} placeholder="e.g. DLF Phase 3" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" /></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── SECTION 4: ACADEMICS (TUTOR) or SCHEDULE (PARENT) ─── */}
              {userType === 'teacher' ? (
                <div className="space-y-6 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-primary">
                    <BookOpen size={16} />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Academic Expertise</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Teaching Classes</label>
                      <div className="grid grid-cols-2 gap-2">
                        {CLASSES_LIST.map(c => {
                          const isGroupActive = userClasses.includes(c) || (CLASS_GROUP_MAPPING[c] || []).some(sub => userClasses.includes(sub));
                          return (
                            <button key={c} onClick={() => { playTapSound(); updateField('userClasses', [c]); localStorage.setItem('userClasses', JSON.stringify([c])); updateField('userSubjects', []); }} className={cn("p-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-tighter text-center transition-all", isGroupActive ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white")}>{c}</button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">
                        {userClasses.includes('Entrance Exam & Specialization') ? 'Exam / Category' : 'Board'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(userClasses.includes('Entrance Exam & Specialization') 
                          ? (SPECIALIZED_SUB_CATEGORIES['Entrance Exam & Specialization'] || [])
                          : ['CBSE', 'ICSE', 'State Board', 'IB/IGCSE']
                        ).map(b => (
                          <button key={b} onClick={() => { playTapSound(); updateField('userBoard', b); localStorage.setItem('userBoard', b); updateField('userSubjects', []); }} className={cn("p-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-tighter text-center transition-all", userBoard === b ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white")}>{b}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Subjects Teaching</label>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          if (userClasses.includes('Entrance Exam & Specialization')) {
                            const subjects = SPECIALIZED_SUBJECTS[userBoard];
                            if (!subjects) return [];
                            
                            if (Array.isArray(subjects)) {
                              return subjects.map(s => (
                                <button key={s} onClick={() => { playTapSound(); const next = userSubjects.includes(s) ? userSubjects.filter(v => v !== s) : [...userSubjects, s]; updateField('userSubjects', next); localStorage.setItem('userSubjects', JSON.stringify(next)); }} className={cn("px-4 py-2 rounded-full border-2 font-black text-[9px] uppercase tracking-widest transition-all whitespace-normal text-left", userSubjects.includes(s) ? "border-primary bg-primary text-white shadow-lg shadow-primary/20" : "border-slate-100 text-slate-400 bg-white")}>{s}</button>
                              ));
                            } else {
                              // Grouped Subjects (Languages)
                              return Object.entries(subjects).map(([group, subjs]: [string, any]) => (
                                <div key={group} className="w-full space-y-2 mt-2">
                                  <div className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest border-l-2 border-primary/30 pl-2">{group}</div>
                                  <div className="flex flex-wrap gap-2">
                                    {subjs.map((s: string) => (
                                      <button key={s} onClick={() => { playTapSound(); const next = userSubjects.includes(s) ? userSubjects.filter(v => v !== s) : [...userSubjects, s]; updateField('userSubjects', next); localStorage.setItem('userSubjects', JSON.stringify(next)); }} className={cn("px-4 py-2 rounded-full border-2 font-black text-[9px] uppercase tracking-widest transition-all whitespace-normal text-left", userSubjects.includes(s) ? "border-primary bg-primary text-white shadow-lg shadow-primary/20" : "border-slate-100 text-slate-400 bg-white")}>{s}</button>
                                    ))}
                                  </div>
                                </div>
                              ));
                            }
                          }

                          const allSubjects: string[] = [];
                          userClasses.forEach(c => {
                            (CLASS_SUBJECTS_DATA[c] || []).forEach(s => { if (!allSubjects.includes(s)) allSubjects.push(s); });
                          });
                          return (allSubjects.length > 0 ? allSubjects : (userClasses[0] ? CLASS_SUBJECTS_DATA[userClasses[0]] || [] : [])).map(s => (
                            <button key={s} onClick={() => { playTapSound(); const next = userSubjects.includes(s) ? userSubjects.filter(v => v !== s) : [...userSubjects, s]; updateField('userSubjects', next); localStorage.setItem('userSubjects', JSON.stringify(next)); }} className={cn("px-4 py-2 rounded-full border-2 font-black text-[9px] uppercase tracking-widest transition-all whitespace-normal text-left", userSubjects.includes(s) ? "border-primary bg-primary text-white shadow-lg shadow-primary/20" : "border-slate-100 text-slate-400 bg-white")}>{s}</button>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock size={16} />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Schedule & Duration</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Preferred Days</label>
                      <div className="flex flex-wrap gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                          <button key={day} onClick={() => { playTapSound(); const currentDays = userDays ? userDays.split(', ') : []; const next = currentDays.includes(day) ? currentDays.filter(v => v !== day) : [...currentDays, day]; updateField('userDays', next.join(', ')); localStorage.setItem('userDays', next.join(', ')); }} className={cn("px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-tight transition-all", (userDays ? userDays.split(', ') : []).includes(day) ? "border-primary bg-primary text-white" : "border-slate-100 text-slate-400 bg-white")}>{day}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Preferred Time</label>
                      <div className="grid grid-cols-3 gap-2 max-h-[180px] overflow-y-auto p-1 custom-scrollbar">
                        {TIME_LIST.map(time => (
                          <button key={time} onClick={() => { playTapSound(); const currentTimes = userTime ? userTime.split(', ') : []; const next = currentTimes.includes(time) ? currentTimes.filter(v => v !== time) : [...currentTimes, time]; updateField('userTime', next.join(', ')); localStorage.setItem('userTime', next.join(', ')); }} className={cn("py-2 px-1 rounded-lg border font-bold text-[9px] text-center transition-all", (userTime ? userTime.split(', ') : []).includes(time) ? "border-primary bg-primary/10 text-primary" : "border-slate-100 text-slate-400 bg-white")}>{time}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Session Duration</label>
                      <select value={userDuration} onChange={(e) => { updateField('userDuration', e.target.value); localStorage.setItem('userDuration', e.target.value); }} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all appearance-none"><option value="1 Hour">1 Hour</option><option value="1.5 Hours">1.5 Hours</option><option value="2 Hours">2 Hours</option><option value="2.5 Hours">2.5 Hours</option></select>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── SECTION 5: PROFESSIONAL (TUTOR) ─── */}
              {userType === 'teacher' && (
                <div className="space-y-6 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-primary">
                    <GraduationCap size={16} />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Professional Details</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Qualifications</label>
                      <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-100 custom-scrollbar">
                        {TUTOR_QUALIFICATIONS_LIST.map(q => (
                          <button key={q} onClick={() => { playTapSound(); const next = userQualifications.includes(q) ? userQualifications.filter(v => v !== q) : [...userQualifications, q]; updateField('userQualifications', next); localStorage.setItem('userQualifications', JSON.stringify(next)); }} className={cn("px-3 py-2 rounded-xl border-2 font-bold text-[9px] uppercase transition-all", userQualifications.includes(q) ? "border-primary bg-primary text-white" : "border-slate-100 text-slate-400 bg-white")}>{q}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Teaching Experience</label>
                      <div className="grid grid-cols-1 gap-2">
                        {TUTOR_EXPERIENCE_LIST.map(exp => (
                          <button key={exp} onClick={() => { playTapSound(); updateField('userExperience', exp); localStorage.setItem('userExperience', exp); }} className={cn("w-full py-3 px-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest text-left transition-all", userExperience === exp ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white")}>{exp}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── SECTION 6: LOCATION & LOGISTICS (TUTOR) ─── */}
              {userType === 'teacher' && (
                <div className="space-y-6 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-primary">
                    <MapPin size={16} />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Location & Logistics</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Mode of Teaching</label>
                      <div className="flex gap-2">
                        {['Home Tuition', 'Online Class'].map(m => (
                          <button key={m} onClick={() => { playTapSound(); updateField('userMode', m); localStorage.setItem('userMode', m); }} className={cn("flex-1 py-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-1", userMode === m ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white")}><span>{m === 'Home Tuition' ? '🏠' : '💻'}</span><span>{m}</span></button>
                        ))}
                      </div>
                    </div>
                    {userMode !== 'Online Class' && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">City</label>
                          <select value={userCity} onChange={(e) => { updateField('userCity', e.target.value); localStorage.setItem('userCity', e.target.value); updateField('userLocalities', []); }} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all appearance-none">{CITIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Localities (Select Multiple)</label>
                          <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-100 custom-scrollbar">{(CITY_TO_LOCATIONS_DATA[userCity] || []).map(l => (
                            <button key={l} onClick={() => { playTapSound(); const next = userLocalities.includes(l) ? userLocalities.filter(v => v !== l) : [...userLocalities, l]; updateField('userLocalities', next); localStorage.setItem('userLocalities', JSON.stringify(next)); }} className={cn("px-3 py-2 rounded-xl border-2 font-bold text-[10px] uppercase transition-all", userLocalities.includes(l) ? "border-primary bg-primary text-white" : "border-slate-100 text-slate-400 bg-white")}>{l}</button>
                          ))}</div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Own Vehicle?</label>
                          <div className="flex gap-2">
                            {['Yes', 'No'].map(v => (
                              <button key={v} onClick={() => { playTapSound(); updateField('hasVehicle', v); localStorage.setItem('hasVehicle', v); }} className={cn("flex-1 py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all", hasVehicle === v ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white")}>{v}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── SECTION 7: SCHEDULE & FEE (TUTOR) ─── */}
              {userType === 'teacher' && (
                <div className="space-y-6 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock size={16} />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Schedule & Fee</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Preferred Days</label>
                      <div className="flex flex-wrap gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                          <button key={day} onClick={() => { playTapSound(); const currentDays = userDays ? userDays.split(', ') : []; const next = currentDays.includes(day) ? currentDays.filter(v => v !== day) : [...currentDays, day]; updateField('userDays', next.join(', ')); localStorage.setItem('userDays', next.join(', ')); }} className={cn("px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-tight transition-all", (userDays ? userDays.split(', ') : []).includes(day) ? "border-primary bg-primary text-white" : "border-slate-100 text-slate-400 bg-white")}>{day}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Preferred Time</label>
                      <div className="grid grid-cols-3 gap-2 max-h-[180px] overflow-y-auto p-1 custom-scrollbar">
                        {TIME_LIST.map(time => (
                          <button key={time} onClick={() => { playTapSound(); const currentTimes = userTime ? userTime.split(', ') : []; const next = currentTimes.includes(time) ? currentTimes.filter(v => v !== time) : [...currentTimes, time]; updateField('userTime', next.join(', ')); localStorage.setItem('userTime', next.join(', ')); }} className={cn("py-2 px-1 rounded-lg border font-bold text-[9px] text-center transition-all", (userTime ? userTime.split(', ') : []).includes(time) ? "border-primary bg-primary/10 text-primary" : "border-slate-100 text-slate-400 bg-white")}>{time}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Fee Charges (Per Hour)</label>
                      <div className="grid grid-cols-1 gap-2">
                        {TUTOR_FEE_LIST.map(f => (
                          <button key={f} onClick={() => { playTapSound(); updateField('userFee', f); localStorage.setItem('userFee', f); }} className={cn("w-full py-3 px-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest text-left transition-all", userFee === f ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white")}>{f}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── SECTION 8: SELFIE (TUTOR) ─── */}
              {userType === 'teacher' && (
                <div className="space-y-6 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-primary">
                    <Camera size={16} />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Profile Pic</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 gap-4">
                       {userSelfie ? (
                         <div className="relative group">
                           <img src={userSelfie} alt="Profile" className="w-48 h-48 rounded-[32px] object-cover border-4 border-white shadow-2xl" />
                           <button 
                             onClick={() => { updateField('userSelfie', null); localStorage.removeItem('userSelfie'); }}
                             className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90"
                           >
                             <X size={16} strokeWidth={3} />
                           </button>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center gap-4 py-4">
                            <div className="w-20 h-20 bg-primary/10 rounded-[24px] flex items-center justify-center text-primary">
                              <Camera size={40} />
                            </div>
                            <label className="bg-[#191445] text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all cursor-pointer">
                               Capture / Upload
                               <input type="file" accept="image/*" className="hidden" onChange={handleSelfieChange} />
                            </label>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Max Size: 5MB • Any Format</p>
                         </div>
                       )}
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex items-start gap-4">
                       <ShieldCheck size={20} className="text-amber-500 shrink-0 mt-0.5" />
                       <p className="text-[10px] font-bold text-amber-800 leading-snug">
                         Please upload a <span className="font-black">Professional Passport Photo</span>. Do not upload side faces, cropped photos, or casual selfies. A clear front-facing photo helps in getting more leads.
                       </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── SECTION 9: ACCOUNT SETTINGS ─── */}
              <div className="space-y-6 pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2 text-primary">
                  <Settings size={16} />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Account & Settings</h4>
                </div>
                <div className="space-y-6">
                  {userType === 'parent' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Student/Need Details</label>
                      <textarea value={aboutMe} onChange={(e) => { updateField('aboutMe', e.target.value); localStorage.setItem('aboutMe', e.target.value); }} placeholder="Tell us more about the requirement..." rows={3} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all resize-none" />
                    </div>
                  )}
                  <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
                    <div className="relative">{profilePhoto ? <img src={profilePhoto} alt="User" className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover" /> : <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-white shadow-md"><LucideUser size={24} /></div>}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-black text-slate-900 truncate">{userName || (userType === 'teacher' ? 'Tutor' : 'Parent')}</div>
                      <div className="text-[10px] font-bold text-slate-400 truncate">{userCountryCode} {userPhone}</div>
                      <div className="text-[9px] font-black text-primary uppercase tracking-widest mt-0.5">{userType === 'parent' ? 'Order ID' : 'Tutor ID'}: #{tutorId || 'Pending'}</div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100/50 space-y-3">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><ShieldCheck size={12} className="text-rose-500" /> Danger Zone</p>
                    <button onClick={onDelete} disabled={isDeleting} className="w-full bg-rose-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-rose-200">
                      {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16} /> Delete My Profile</>}
                    </button>
                    <button onClick={onLogout} className="w-full bg-slate-100 text-slate-500 p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 border border-slate-200">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
         </div>

         <div className="p-6 border-t border-slate-50 bg-white flex items-center gap-3 shrink-0">
            <button 
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border border-slate-200"
            >
              Close
            </button>
            <button 
              onClick={onUpdate}
              disabled={isUpdating}
              className="flex-[2] h-14 rounded-2xl bg-sky-50 text-sky-600 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border-2 border-sky-100 shadow-sm"
            >
              {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <>Save Details <Check size={16} strokeWidth={3} /></>}
            </button>
         </div>
      </div>
    </div>
  );
};
