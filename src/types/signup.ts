// src/types/signup.ts
import { ConfirmationResult } from 'firebase/auth';

export interface SignUpFormValues {
  FULL_NAME: string;
  LOGIN_EMAIL_ADDRESS: string;
  LOGIN_MOBILE_NO: string;
  LOGIN_PASSWORD: string;
  COMPANY_NAME: string;
  GST_VAT_NO: string;
  FULL_ADDRESS: string;
  CITY: string;
  STATE_NAME: string;
  COUNTRY: string;
  PIN_CODE: string;
  GPS_LOCATION: string;
  GPS_LATITUDE: string;
  GPS_LONGITUDE: string;
  userType: 'individual' | 'business' | '';
  confirmPassword: string;
  acknowledged: boolean;
}

export interface OptionalVerificationState {
  open: boolean;
  contact: string;
  isEmail: boolean;
  otp: string;
  otpSent: boolean;
  otpTimer: number;
  loading: boolean;
  error: string;
  confirmationResult: ConfirmationResult | null;
  storedOtp: string;
  verifiedEmail: string;
  verifiedPhone: string;
}

export interface SignUpStep1Props {
  isEmail: boolean;
  setIsEmail: (value: boolean) => void;
  contactInfo: string;
  setContactInfo: (value: string) => void;
  loading: boolean;
  error: string;
  setError: (value: string) => void;
  handleSendOtp: () => Promise<void>;
}

export interface SignUpStep2Props {
  contactInfo: string;
  otp: string;
  setOtp: (value: string) => void;
  otpTimer: number;
  otpSent: boolean;
  loading: boolean;
  error: string;
  handleVerifyOtp: () => Promise<void>;
  handleSendOtp: () => Promise<void>;
  handleBack: () => void;
}

export interface SignUpStep3Props {
  initialValues: SignUpFormValues;
  setFormValues: (values: SignUpFormValues) => void;
  handleSignup: (values: SignUpFormValues) => Promise<void>;
  loading: boolean;
  isEmailPrimary: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  onOptionalVerify: (contact: string, isEmail: boolean) => Promise<boolean>;
}

export interface EmailData {
  toEmail: string;
  subject: string;
  body: string;
  displayName: string;
}