import { Capacitor } from '@capacitor/core';
import { apiClient } from './api.client';

export const AuthService = {
  checkEmailExists: async (email: string, userType: string) => {
    return apiClient({
      url: 'https://doableindia.com/app-sys/app_auth.php',
      method: 'POST',
      data: { action: 'get', email, userType }
    });
  },

  signIn: async (email: string, password: string, userType: string) => {
    return apiClient({
      url: 'https://doableindia.com/app-sys/app_auth.php',
      method: 'POST',
      data: { action: 'signin', email, password, userType }
    });
  },

  signUp: async (email: string, password: string, userType: string) => {
    return apiClient({
      url: 'https://doableindia.com/app-sys/app_auth.php',
      method: 'POST',
      data: { action: 'signup', email, password, userType }
    });
  },

  forgotPassword: async (email: string) => {
    return apiClient({
      url: 'https://doableindia.com/app-sys/app_auth.php',
      method: 'POST',
      data: { action: 'forgot_password', email }
    });
  },

  resetPassword: async (email: string, pin: string, password: string) => {
    return apiClient({
      url: 'https://doableindia.com/app-sys/app_auth.php',
      method: 'POST',
      data: { action: 'reset_password', email, pin, password }
    });
  },

  deleteProfile: async (email: string, tutorId: string | null) => {
    const payload: any = { action: 'delete', email };
    if (tutorId) payload.tutor_id = tutorId;

    return apiClient({
      url: 'https://doableindia.com/app-sys/api_copy.php',
      method: 'POST',
      data: payload
    });
  },

  updateProfile: async (profile: any, userType: 'teacher' | 'parent', tutors: any[] = []) => {
    const isNative = Capacitor.isNativePlatform();
    
    if (userType === 'teacher') {
      const profileData: any = {
        action: 'upsert',
        tutor_id: profile.tutorId,
        first_name: profile.userFirstName,
        last_name: profile.userLastName,
        name: `${profile.userFirstName} ${profile.userLastName}`.trim() || profile.userName || 'Tutor',
        email: profile.email,
        phone: profile.userPhone,
        gender: profile.userGender,
        age: profile.userAge,
        dob: profile.userDob,
        qualification: profile.userQualifications.join(', '),
        experience: profile.userExperience,
        school_teacher: profile.isSchoolTeacher === 'Yes' ? 'Yes' : 'No',
        days: profile.userDays,
        time: profile.userTime,
        class_group: profile.userClasses.join(', '),
        subjects: profile.userSubjects.join(', '),
        city: profile.userCity,
        location: profile.userLocalities.join(', '),
        residency: profile.userResidency,
        Residency: profile.userResidency,
        block: profile.userResidency,
        society: profile.userResidency,
        have_vehicle: profile.hasVehicle === 'Yes' ? 'Yes' : 'No',
        communication: profile.userCommunication,
        mode: profile.userMode,
        fee: profile.userFee,
        aadhar: profile.userAadhar,
        Aadhar: profile.userAadhar,
        address: profile.userAddress,
        Address: profile.userAddress,
        about: profile.aboutMe,
        photo: profile.profilePhoto || '',
        selfie: profile.userSelfie || '',
        active_tuitions: tutors.find(t => t.email?.toLowerCase().trim() === profile.email?.toLowerCase().trim())?.active_tuitions || 0,
        monthly_earnings: tutors.find(t => t.email?.toLowerCase().trim() === profile.email?.toLowerCase().trim())?.monthly_earnings || 0,
        status: localStorage.getItem('tutorStatus') || 'Active',
        verified: localStorage.getItem('isVerified') || 'No',
        created_time: new Date().toISOString().split('T')[0]
      };

      return apiClient({
        url: 'https://doableindia.com/app-sys/api_copy.php',
        method: 'POST',
        data: profileData,
        isUrlEncoded: !isNative // Match App.tsx: native uses JSON, web uses URLEncoded
      });
    } else {
      const fullPhone = (profile.userCountryCode + profile.userPhone).replace(/\s+/g, '');
      const parentData: any = {
        action: 'upsert',
        order_id: profile.tutorId,
        Order_ID: profile.tutorId,
        'Order ID': profile.tutorId,
        email: profile.email,
        Email: profile.email,
        phone: fullPhone,
        Phone: fullPhone,
        name: `${profile.userFirstName} ${profile.userLastName}`.trim() || profile.userName,
        Name: `${profile.userFirstName} ${profile.userLastName}`.trim() || profile.userName,
        First_Name: profile.userFirstName,
        Last_Name: profile.userLastName,
        'First Name': profile.userFirstName,
        'Last Name': profile.userLastName,
        class_group: profile.userClasses[0] || '', 
        classes: [profile.userClasses[1] || profile.userClasses[0]].filter(c => c),
        Class: profile.userClasses[1] || profile.userClasses[0] || '',
        'Class / Board': profile.userClasses.includes('Entrance Exam & Specialization') 
          ? profile.userBoard 
          : `${profile.userClasses[1] || profile.userClasses[0] || ''} (${profile.userBoard})`,
        subjects: profile.userSubjects,
        Subjects: profile.userSubjects,
        'Subject(s)': profile.userSubjects.join(', '),
        city: profile.userCity,
        City: profile.userCity,
        locality: profile.userLocalities,
        Locality: profile.userLocalities,
        location: profile.userLocalities.map(loc => `${loc}-${profile.userCity}`).join(', '),
        Location: profile.userLocalities.map(loc => `${loc}-${profile.userCity}`).join(', '),
        residency: profile.userResidency,
        Residency: profile.userResidency,
        block: profile.userResidency,
        Block: profile.userResidency,
        society: profile.userResidency,
        Society: profile.userResidency,
        gender: profile.userGender,
        Gender: profile.userGender,
        'Tutor Gender Preference': profile.userGender,
        address: profile.userAddress,
        Address: profile.userAddress,
        board: profile.userBoard,
        Board: profile.userBoard,
        mode: profile.userMode,
        Mode: profile.userMode,
        days: profile.userDays.split(', ').filter(d => d),
        time: profile.userTime.split(', ').filter(t => t),
        duration: profile.userDuration,
        Duration: profile.userDuration,
        fee: profile.userFee,
        Fee: profile.userFee,
        notes: profile.aboutMe,
        Notes: profile.aboutMe,
        created_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };

      return apiClient({
        url: 'https://doableindia.com/app-sys/api_copy.php',
        method: 'POST',
        data: parentData,
        isUrlEncoded: !isNative // Match App.tsx: native uses JSON, web uses URLEncoded
      });
    }
  }
};