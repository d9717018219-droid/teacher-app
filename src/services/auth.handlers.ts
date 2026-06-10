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
  isEmailExist?: boolean;
}

export const AuthHandlers = {
  handleEmailProceed: async (ctx: AuthHandlerContext) => {
    const { email, countryCode, userType, setIsAuthLoading, setAuthError, setEmailChecked, setEmailExist, setAuthMode, setAuthStep, setActiveToast, playTapSound, setPhone, setUserName, setGeneratedOtp } = ctx;
    
    // Check if input is a phone number (now also considering country code from ctx)
    const isPhone = /^\d{7,15}$/.test(email.replace(/\D/g, ''));
    
    if (isPhone) {
      const cleanPhone = email.replace(/\D/g, '');
      const fullPhone = `${countryCode || '+91'}${cleanPhone}`;
      if (setPhone) setPhone(cleanPhone);
      
      setIsAuthLoading(true);
      setAuthError(null);
      
      try {
        console.log(`[Phone-Auth] Checking if phone exists in DB: ${fullPhone}`);
        // 1. Check if Phone Exists in DB
        const responseData = await AuthService.checkPhoneExists(fullPhone, userType || 'teacher');
        console.log(`[Phone-Auth] DB Response:`, responseData);
        
        if (responseData.status === 'success') {
          if (responseData.data?.exists) {
            console.log(`[Phone-Auth] Profile found in DB:`, responseData.data);
            // EXISTING PHONE USER
            if (setEmailChecked) setEmailChecked(true);
            if (setEmailExist) setEmailExist(true);
            if (setAuthMode) setAuthMode('signin');
            
            // Set user name if available
            if (setUserName && responseData.data.name) {
              setUserName(responseData.data.name);
            }
            
            // PRIORITY: If CRM says parent, they are a parent.
            if (ctx.setUserType && responseData.data.user_type) {
              const detectedType = responseData.data.user_type === 'parent' ? 'parent' : 'teacher';
              ctx.setUserType(detectedType);
              console.log(`[Phone-Auth] Setting UserType to: ${detectedType}`);
            }
          } else {
            console.log(`[Phone-Auth] New user (or not found). Marking as signup.`);
            // NEW PHONE USER
            if (setAuthMode) setAuthMode('signup');
            if (setEmailExist) setEmailExist(false);
          }
        } else {
          console.error(`[Phone-Auth] DB Error:`, responseData.message);
          setAuthError(responseData.message || 'Database check failed. Please try again.');
          setIsAuthLoading(false);
          return;
        }

        console.log(`[Phone-Auth] Sending WhatsApp OTP to: ${fullPhone}`);
        // 2. Send OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const res = await AuthService.sendWhatsAppOTP(fullPhone, otp);
        
        if (res.result || res.status === 'success') {
          if (setGeneratedOtp) setGeneratedOtp(otp);
          if (setAuthStep) setAuthStep('otp');
          setActiveToast({ title: 'OTP Sent! 📱', body: 'Check your WhatsApp for the login code.' });
        } else {
          setAuthError(res.message || 'Failed to send WhatsApp OTP. Please try Email.');
        }
      } catch (err) {
        setAuthError('Connection error while sending OTP.');
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
    
    // Simulate verification
    setTimeout(async () => {
      if (resetPin === generatedOtp) {
        playTapSound();
        
        if (isEmailExist) {
          // EXISTING USER -> Login immediately
          const mockResponse = {
            status: 'success',
            user: {
              email: `${phone}@whatsapp.com`, // Use phone as email identifier
              phone: phone,
              userType: userType || 'teacher'
            }
          };
          onSuccess(mockResponse);
          setActiveToast({ title: 'Verified! 🎉', body: 'Login successful via WhatsApp.' });
        } else {
          // NEW USER -> Must select role
          if (setAuthStep) setAuthStep('selection');
          setActiveToast({ title: 'Phone Verified! ✅', body: 'Please select your role to continue.' });
        }
      } else {
        setAuthError('Invalid OTP code. Please check your WhatsApp.');
      }
      setIsAuthLoading(false);
    }, 1000);
  }
};
