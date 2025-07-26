import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const OtpInput = ({ value, onChange, disabled = false }) => (
  <div className="flex justify-center">
    <InputOTP
      maxLength={6}
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      <InputOTPGroup className="gap-2">
        {[...Array(6)].map((_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            className="h-14 w-12 text-xl font-semibold"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  </div>
);