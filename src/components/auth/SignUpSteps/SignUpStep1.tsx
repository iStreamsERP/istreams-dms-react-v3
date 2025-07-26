// src/components/SignUpStep1.tsx
import { callPublicSoapService } from '@/api/callSoapService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SignUpStep1Props } from '@/types/signup';
import { Loader2, Mail, Smartphone } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Link } from 'react-router-dom';

const PUBLIC_SERVICE_URL = import.meta.env.VITE_SOAP_ENDPOINT;

export const SignUpStep1: React.FC<SignUpStep1Props> = ({
  isEmail,
  setIsEmail,
  contactInfo,
  setContactInfo,
  loading,
  error,
  setError,
  handleSendOtp,
}) => {
  const handleSubmit = async (): Promise<void> => {
    setError('');

    if (!contactInfo.trim()) {
      setError('Please enter your email or phone number');
      return;
    }

    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactInfo.trim())) {
        setError('Please enter a valid email address');
        return;
      }
    }

    if (!isEmail && contactInfo.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    try {
      const methodName = isEmail ? 'Public_User_ValidateEmailAddress' : 'Public_User_ValidateMobileNo';
      const param = isEmail ? { emailAddress: contactInfo.trim() } : { mobileNo: contactInfo.trim() };

      const response = await callPublicSoapService<string>(PUBLIC_SERVICE_URL, methodName, param);

      console.log('Validation response:', response);

      if (response === 'Already Exists') {
        setError(`This ${isEmail ? 'email' : 'phone number'} is already registered.`);
      } else if (response === 'Not Exists') {
        console.log('Contact info available, proceeding with OTP');
        await handleSendOtp();
      } else {
        setError('Unable to validate contact information. Please try again.');
      }
    } catch (error: any) {
      console.error('Error validating contact info:', error);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <Label className="mb-2 block">How would you like to sign up?</Label>
        <div className="mb-4 flex gap-2">
          <Button
            variant={isEmail ? 'default' : 'outline'}
            className="flex-1 gap-2"
            onClick={() => {
              setIsEmail(true);
              setContactInfo('');
              setError('');
            }}
          >
            <Mail size={16} /> Email
          </Button>
          <Button
            variant={!isEmail ? 'default' : 'outline'}
            className="flex-1 gap-2"
            onClick={() => {
              setIsEmail(false);
              setContactInfo('');
              setError('');
            }}
          >
            <Smartphone size={16} /> Phone
          </Button>
        </div>
        {isEmail ? (
          <>
            <Label htmlFor="contact">Email Address</Label>
            <Input
              id="contact"
              placeholder="name@example.com"
              value={contactInfo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactInfo(e.target.value.trim())}
              type="email"
              required
              className="mt-1"
            />
          </>
        ) : (
          <>
            <Label htmlFor="phone">Phone Number</Label>
            <PhoneInput
              country="in"
              value={contactInfo.startsWith('+') ? contactInfo.slice(1) : contactInfo}
              onChange={(phone: string) => setContactInfo(`+${phone}`)}
              inputProps={{
                name: 'phone',
                required: true,
                autoFocus: true,
                id: 'phone',
              }}
              inputStyle={{ width: '100%', color: 'black' }}
            />
          </>
        )}
      </div>

      {error && <div className="rounded bg-red-100 p-2 text-sm text-red-700">{error}</div>}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={contactInfo.trim() === '' || loading}
        className="mt-2 w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending OTP...
          </>
        ) : (
          'Send Verification Code'
        )}
      </Button>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 hover:underline">
          Log in
        </Link>
      </p>

      <div id="recaptcha-container" />
    </div>
  );
};