import { AuthService } from './auth.service';

export interface AuthHandlerContext {
  email: string;
  password?: string;
  userType: 'teacher' | 'parent' | null;
  resetPin?: string;
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
}

export const AuthHandlers = {
  handleEmailProceed: async (ctx: AuthHandlerContext) => {
    const { email, userType, setIsAuthLoading, setAuthError, setEmailChecked, setEmailExist, setAuthMode, setAuthStep, setActiveToast, playTapSound } = ctx;
    
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const responseData = await AuthService.checkEmailExists(email, userType || 'teacher');

      if (responseData.status === 'success' && responseData.data) {
        const { exists, is_registered, user_type } = responseData.data;
        
        if (exists) {
          // User exists in system
          if (setEmailChecked) setEmailChecked(true);
          if (setEmailExist) setEmailExist(true);
          
          if (is_registered) {
            // Fully registered - Go to Sign In
            if (setAuthMode) setAuthMode('signin');
            if (setAuthStep) setAuthStep('auth');
          } else {
            // In CRM but no password - Inform and set context
            if (setAuthMode) setAuthMode('signin');
            if (setAuthStep) setAuthStep('auth');
            setAuthError('We found your profile! Please use "Forgot Password" below to set your login password for the first time.');
          }

          if (user_type && ctx.setUserType) {
            ctx.setUserType(user_type === 'parent' ? 'parent' : 'teacher');
          }
        } else {
          // Double check: if exists is explicitly false
          playTapSound();
          if (setAuthMode) setAuthMode('signup');
          if (setAuthStep) setAuthStep('selection');
          if (setEmailExist) setEmailExist(false);
          setActiveToast({ title: 'New to DoAble? ✨', body: 'Please select your role to create an account.' });
        }
      } else {
        // New user - Route to Selection
        playTapSound();
        if (setAuthMode) setAuthMode('signup');
        if (setAuthStep) setAuthStep('selection');
        if (setEmailExist) setEmailExist(false);
        setActiveToast({ title: 'New to DoAble? ✨', body: 'Please select your role to create an account.' });
      }
    } catch (err) {
      console.error('Email Check Error:', err);
      setAuthError('Unable to connect to server. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  },

  handleEmailSignIn: async (ctx: AuthHandlerContext) => {
    const { email, password, userType, setIsAuthLoading, setAuthError, onSuccess } = ctx;
    
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const data = await AuthService.signIn(email, password, userType || 'teacher');
      
      if (data.status === 'success') {
        onSuccess(data);
      } else {
        setAuthError(data.message || 'Invalid email or password.');
      }
    } catch (error: any) {
      console.error('Sign In Error:', error);
      setAuthError('Connection error. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  },

  handleEmailSignUp: async (ctx: AuthHandlerContext) => {
    const { email, password, userType, setIsAuthLoading, setAuthError, onSuccess, playTapSound, setAuthMode, setEmailChecked, setActiveToast } = ctx;
    
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password should be at least 6 characters.');
      return;
    }
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const checkData = await AuthService.checkEmailExists(email, userType || 'teacher');

      if (checkData.status === 'success' && checkData.data) {
        playTapSound();
        if (setAuthMode) setAuthMode('signin');
        if (setEmailChecked) setEmailChecked(true);
        setActiveToast({ title: 'Already Registered 👋', body: 'This email is already registered. Please sign in.' });
        setIsAuthLoading(false);
        return;
      }

      const data = await AuthService.signUp(email, password, userType || 'teacher');

      if (data.status === 'success') {
        onSuccess(data);
      } else {
        setAuthError(data.message || 'Failed to sign up.');
      }
    } catch (error: any) {
      console.error('Sign Up Error:', error);
      setAuthError('Connection error. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  },

  handleForgotPassword: async (ctx: AuthHandlerContext) => {
    const { email, setIsAuthLoading, setAuthError, setAuthMode } = ctx;
    
    if (!email) {
      setAuthError('Please enter your email address.');
      return;
    }
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const data = await AuthService.forgotPassword(email);
      if (data.status === 'success') {
        if (setAuthMode) setAuthMode('reset');
        setAuthError(null);
      } else {
        setAuthError(data.message || 'Failed to send reset PIN.');
      }
    } catch (error: any) {
      setAuthError('Connection error.');
    } finally {
      setIsAuthLoading(false);
    }
  },

  handleResetPassword: async (ctx: AuthHandlerContext) => {
    const { email, resetPin, newPassword, confirmPassword, setIsAuthLoading, setAuthError, setAuthMode, setEmailChecked, setAuthStep, setActiveToast, playTapSound } = ctx;
    
    if (!resetPin || !newPassword || !confirmPassword) {
      setAuthError('Please fill all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const data = await AuthService.resetPassword(email, resetPin, newPassword);

      if (data.status === 'success') {
        playTapSound();
        if (setAuthMode) setAuthMode('signin');
        if (setAuthStep) setAuthStep('auth');
        if (setEmailChecked) setEmailChecked(true);
        setActiveToast({ title: 'Password Reset! 🔐', body: 'You can now sign in with your new password.' });
      } else {
        setAuthError(data.message || 'Invalid PIN or error resetting password.');
      }
    } catch (error: any) {
      setAuthError('Connection error.');
    } finally {
      setIsAuthLoading(false);
    }
  }
};
