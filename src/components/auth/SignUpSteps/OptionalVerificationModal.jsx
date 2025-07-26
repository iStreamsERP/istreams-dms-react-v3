import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OtpInput } from "@/components/auth/SignUpSteps/OtpInput";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export const OptionalVerificationModal = ({
  contactInfo,
  isEmail,
  open,
  onOpenChange,
  otp,
  setOtp,
  otpTimer,
  onResend,
  onVerify,
  loading,
  error,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify {isEmail ? "Email" : "Phone"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter OTP sent to {contactInfo}
          </p>
          
          <OtpInput value={otp} onChange={setOtp} />
          
          <div className="flex justify-between items-center">
            {otpTimer > 0 ? (
              <span className="text-sm text-muted-foreground">
                Resend in {otpTimer}s
              </span>
            ) : (
              <Button variant="link" onClick={onResend} className="p-0">
                Resend OTP
              </Button>
            )}
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <Button 
            onClick={onVerify}
            disabled={loading || otp.length !== 6}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};