import { useState, useCallback } from 'react';
import { UserType } from '../types';

export interface ProfileState {
  userCity: string;
  userName: string | null;
  userFirstName: string;
  userLastName: string;
  userCountryCode: string;
  tutorId: string | null;
  userGender: string | null;
  userType: UserType | null;
  userClasses: string[];
  userSubjects: string[];
  userLocalities: string[];
  userPhone: string;
  userDob: string;
  userAge: string;
  userQualifications: string[];
  userExperience: string;
  isSchoolTeacher: string;
  hasVehicle: string;
  aboutMe: string;
  profilePhoto: string | null;
  userBoard: string;
  userMode: string;
  userCommunication: string;
  userAddress: string;
  userDays: string;
  userTime: string;
  userDuration: string;
  userFee: string;
  userResidency: string;
  userAadhar: string;
  userSelfie: string | null;
}

export function useProfileState() {
  const [profile, setProfile] = useState<ProfileState>(() => {
    const getSavedJson = (key: string) => {
      try {
        const saved = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(saved) ? saved.filter(i => i && i.trim() !== '') : [];
      } catch {
        return [];
      }
    };

    const userName = localStorage.getItem('userName');
    const userFirstName = localStorage.getItem('userFirstName') || (userName ? userName.split(/\s+/)[0] || '' : '');
    const userLastName = localStorage.getItem('userLastName') || (userName ? userName.split(/\s+/).slice(1).join(' ') || '' : '');

    return {
      userCity: localStorage.getItem('userCity') || 'all',
      userName: userName,
      userFirstName: userFirstName,
      userLastName: userLastName,
      userCountryCode: localStorage.getItem('userCountryCode') || '+91',
      tutorId: localStorage.getItem('tutorId'),
      userGender: localStorage.getItem('userGender') || 'All',
      userType: localStorage.getItem('userType') as UserType,
      userClasses: getSavedJson('userClasses'),
      userSubjects: getSavedJson('userSubjects'),
      userLocalities: getSavedJson('userLocalities'),
      userPhone: localStorage.getItem('userPhone') || '',
      userDob: localStorage.getItem('userDob') || '',
      userAge: localStorage.getItem('userAge') || '',
      userQualifications: getSavedJson('userQualifications'),
      userExperience: localStorage.getItem('userExperience') || '',
      isSchoolTeacher: localStorage.getItem('isSchoolTeacher') || 'No',
      hasVehicle: localStorage.getItem('hasVehicle') || 'No',
      aboutMe: localStorage.getItem('aboutMe') || '',
      profilePhoto: localStorage.getItem('userPhoto'),
      userBoard: localStorage.getItem('userBoard') || 'CBSE',
      userMode: localStorage.getItem('userMode') || 'Home Tuition',
      userCommunication: localStorage.getItem('userCommunication') || '',
      userAddress: localStorage.getItem('userAddress') || '',
      userDays: localStorage.getItem('userDays') || '',
      userTime: localStorage.getItem('userTime') || '',
      userDuration: localStorage.getItem('userDuration') || '1 Hour',
      userFee: localStorage.getItem('userFee') || '',
      userResidency: localStorage.getItem('userResidency') || '',
      userAadhar: localStorage.getItem('userAadhar') || '',
      userSelfie: localStorage.getItem('userSelfie'),
    };
  });

  const updateField = useCallback((field: keyof ProfileState, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  }, []);

  return { profile, setProfile, updateField };
}
