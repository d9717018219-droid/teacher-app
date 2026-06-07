import React from 'react';
import { X } from 'lucide-react';

interface FormModalProps {
  show: boolean;
  onClose: () => void;
  formType: 'teacher' | 'parent' | 'requirement';
}

export function FormModal({ show, onClose, formType }: FormModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/60" />
      <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-black uppercase">
            {formType === 'teacher' ? 'Tutor Registration' : 'Requirement Details'}
          </h3>
          <button onClick={onClose} className="p-3 bg-white rounded-2xl text-slate-400 shadow-sm">
            <X size={20} strokeWidth={3} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <iframe 
            className="w-full h-full min-h-[600px] border-none" 
            src={formType === 'teacher' 
              ? 'https://forms.doableindia.com/info2701/form/UpdateForm/formperma/5q6-EFWKiWGtqhyYNfjqMGyCYXXst3OOPqOmQCD7yT8?zf_enablecamera=true' 
              : 'https://forms.doableindia.com/info2701/form/ShareRequirement/formperma/Y-6ujBL2ntI_ufnw8JPcHpyFOAGHButgY6SigoCfs6o'
            } 
            allow={formType === 'teacher' ? "camera;" : "geolocation;"}
            allowFullScreen={formType !== 'teacher'}
          />
        </div>
      </div>
    </div>
  );
}