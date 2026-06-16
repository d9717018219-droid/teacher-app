import { AuthService } from './auth.service';

export interface AuthHandlerContext {
  email: string;
  phone?: string;
  countryCode?: string;
  password?: string;
  userType: 'teacher' | 'parent' | null;
  resetPin?: string;
  generatedOtp?: string;
  setGeneratedOtp?: (otp: string) => void;
  newPassword?: string;
  confirmPassword?: string;
  setIsAuthLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
  setEmailChecked?: (checked: boolean) => void;
  setEmailExist?: (exists: boolean) => void;
  setAuthMode?: (mode: any) => void;
  setAuthStep?: (step: any) => void;
  setUserType?: (type: any) => void;
  onSuccess: (data: any) => void;
  setActiveToast: (toast: { title: string; body: string }) => void;
  playTapSound: () => void;
  setPhone?: (phone: string) => void;
  setUserName?: (name: string) => void;
  userCity?: string;
  setUserCity?: (city: string) => void;
  userEmail?: string;
  setUserEmail?: (email: string) => void;
  isEmailExist?: boolean;
}

export const AuthHandlers = {
  handleEmailProceed: async (ctx: AuthHandlerContext) => {
    const { email, countryCode, userType, setIsAuthLoading, setAuthError, setEmailChecked, setEmailExist, setAuthMode, setAuthStep, setActiveToast, playTapSound, setPhone, setUserName, setGeneratedOtp } = ctx;
    
    // Check if input is a phone number
    const isPhone = /^\d{10}$/.test(email.replace(/\D/g, ''));
    
    if (isPhone) {
      const cleanPhone = email.replace(/\D/g, '');
      const fullPhone = `${countryCode || '+91'}${cleanPhone}`;
      if (setPhone) setPhone(cleanPhone);
      
      setIsAuthLoading(true);
      setAuthError(null);
      
      try {
        console.log(`[Phone-Auth] STRICT VALIDATION for Teacher App: ${fullPhone}`);
        
        // 1. Check if they exist in PARENT DB first (to block them)
        const parentCheck = await AuthService.checkPhoneExists(fullPhone, 'parent');
        console.log(`[Phone-Auth] Parent DB Check:`, parentCheck);
        
        if (parentCheck.status === 'success' && parentCheck.data?.exists) {
          // BLOQUED: This is a Parent trying to use the Teacher app
          setAuthError('This number is registered in our Parents database. Please use the "DoAble India for Parents" app or contact support.');
          setIsAuthLoading(false);
          return;
        }

        // 2. Check if they exist in TEACHER DB
        const teacherCheck = await AuthService.checkPhoneExists(fullPhone, 'teacher');
        console.log(`[Phone-Auth] Teacher DB Check:`, teacherCheck);
        
        if (teacherCheck.status === 'success') {
          if (teacherCheck.data?.exists) {
            console.log(`[Phone-Auth] Teacher Profile found. Marking as signin.`);
            if (setEmailChecked) setEmailChecked(true);
            if (setEmailExist) setEmailExist(true);
            if (setAuthMode) setAuthMode('signin');
            
            if (setUserName && teacherCheck.data.name) {
              setUserName(teacherCheck.data.name);
            }
          } else {
            console.log(`[Phone-Auth] New Teacher user. Marking as signup.`);
            if (setAuthMode) setAuthMode('signup');
            if (setEmailExist) setEmailExist(false);
          }
          
          // Force userType to teacher for this app context
          if (ctx.setUserType) ctx.setUserType('teacher');

          // 3. Send OTP only after validation passes
          const otp = Math.floor(1000 + Math.random() * 9000).toString();
          const res = await AuthService.sendWhatsAppOTP(fullPhone, otp);
          
          if (res.result || res.status === 'success') {
            if (setGeneratedOtp) setGeneratedOtp(otp);
            if (setAuthStep) setAuthStep('otp');
            setActiveToast({ title: 'OTP Sent! 📱', body: 'Check your WhatsApp for the login code.' });
          } else {
            setAuthError(res.message || 'Failed to send WhatsApp OTP.');
          }
        } else {
          setAuthError(teacherCheck.message || 'Database check failed. Please try again.');
        }
      } catch (err) {
        console.error('[Phone-Auth] Error:', err);
        setAuthError('Connection error while validating account.');
      } finally {
        setIsAuthLoading(false);
      }
      return;
    }

    if (!email) {
      setAuthError('Please enter your WhatsApp number.');
      return;
    }
    setAuthError('Please enter a valid 10-digit phone number.');
  },

  handleVerifyOTP: async (ctx: AuthHandlerContext) => {
    const { phone, resetPin, generatedOtp, userType, setIsAuthLoading, setAuthError, setAuthStep, onSuccess, setActiveToast, playTapSound, isEmailExist } = ctx;
    
    if (!resetPin || resetPin.length < 4) {
      setAuthError('Please enter the 4-digit code.');
      return;
    }

    setIsAuthLoading(true);
    
    setTimeout(async () => {
      if (resetPin === generatedOtp) {
        playTapSound();
        
        if (isEmailExist) {
          const mockResponse = {
            status: 'success',
            user: {
              email: `${phone}@whatsapp.com`,
              phone: phone,
              userType: userType || 'teacher'
            }
          };
          onSuccess(mockResponse);
          setActiveToast({ title: 'Verified! 🎉', body: 'Login successful via WhatsApp.' });
        } else {
          // Bypass selection step and force teacher role
          if (ctx.setUserType) ctx.setUserType('teacher');
          if (setAuthStep) setAuthStep('auth');
          setActiveToast({ title: 'Phone Verified! ✅', body: 'Please complete your profile to continue.' });
        }
      } else {
        setAuthError('Invalid OTP code. Please check your WhatsApp.');
      }
      setIsAuthLoading(false);
    }, 1000);
  },

  handleRegistration: async (ctx: AuthHandlerContext) => {
    const { phone, countryCode, userType, userCity, userEmail, setIsAuthLoading, setAuthError, onSuccess, setActiveToast, playTapSound, userName: fullName } = ctx;

    if (!fullName || fullName.length < 3) {
      setAuthError('Please enter your full name.');
      return;
    }

    if (!userEmail || !/^\S+@\S+\.\S+$/.test(userEmail)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (!userCity) {
      setAuthError('Please select your city.');
      return;
    }

    setIsAuthLoading(true);

    try {
      const fullPhone = `${countryCode || '+91'}${phone}`;
      
      // 1. Update Profile in DB
      const profileData = {
        email: userEmail,
        userPhone: phone,
        userName: fullName,
        userFirstName: fullName.split(' ')[0],
        userLastName: fullName.split(' ').slice(1).join(' '),
        userCity: userCity,
        userGender: 'Male', // Default or could be asked
        userQualifications: [],
        userExperience: 'Fresher',
        userClasses: [],
        userSubjects: [],
        userLocalities: [],
        userResidency: '',
        userAddress: '',
        userMode: 'Online',
        userFee: '',
        userAadhar: '',
        aboutMe: 'New Teacher registered via App.',
        tutorId: 'NEW'
      };

      const response = await AuthService.updateProfile(profileData, 'teacher');
      console.log('[Registration] Profile Sync Response:', response);

      // 2. Complete Login
      const mockResponse = {
        status: 'success',
        user: {
          email: userEmail,
          phone: phone,
          name: fullName,
          userType: 'teacher',
          city: userCity
        }
      };
      
      onSuccess(mockResponse);
      setActiveToast({ title: 'Welcome! 🎊', body: 'Your profile has been created successfully.' });
    } catch (err) {
      setAuthError('Failed to save profile. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  }
};
