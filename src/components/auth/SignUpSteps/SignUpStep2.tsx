// src/components/SignUpStep2.tsx
import { Button } from '@/components/ui/button';
import type { SignUpStep2Props } from '@/types/signup';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { OtpInput } from './OtpInput';

export const SignUpStep2: React.FC<SignUpStep2Props> = ({
  contactInfo,
  otp,
  setOtp,
  otpTimer,
  otpSent,
  loading,
  error,
  handleVerifyOtp,
  handleSendOtp,
  handleBack,
}) => (
  <div className="space-y-2">
    <div className="text-center">
      <p className="text-muted-foreground">Enter the 6-digit code sent to</p>
      <p className="text-sm font-medium">{contactInfo}</p>
    </div>

    <div className="space-y-4">
      <OtpInput value={otp} onChange={setOtp} disabled={loading} />

      <div className="flex w-full items-center justify-between gap-2">
        <Button variant="link" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Change
        </Button>

        {otpTimer > 0 ? (
          <p className="text-center text-sm text-muted-foreground">Resend code in {otpTimer} seconds</p>
        ) : (
          <Button variant="link" className="text-blue-600" onClick={handleSendOtp}>
            Resend Code
          </Button>
        )}
      </div>

      {otpSent && !otpTimer && (
        <div className="text-center text-sm text-green-600">OTP sent successfully!</div>
      )}
    </div>

    {error && <div className="rounded bg-red-100 p-2 text-sm text-red-700">{error}</div>}

    <Button
      type="button"
      onClick={handleVerifyOtp}
      disabled={loading || otp.length !== 6}
      className="mt-2 w-full"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Verifying...
        </>
      ) : (
        'Verify and Continue'
      )}
    </Button>
  </div>
);