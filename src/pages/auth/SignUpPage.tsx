// src/pages/SignUpPage.tsx
import { callSoapService } from "@/api/callSoapService";
import { SignUpStep1, SignUpStep2, SignUpStep3 } from "@/components";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/layouts";
import animationData from "@/lotties/crm-animation-lotties.json";
import { sendEmail } from "@/services/emailService";
import type { AuthContextType } from "@/types/auth";
import type {
  EmailData,
  SignUpFormValues
} from "@/types/signup";
import { generateOTP } from "@/utils/generateOTP";
import type {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase.config";
import { logoDark, logoLight } from "@/assets";

const PUBLIC_SERVICE_URL = import.meta.env.VITE_SOAP_ENDPOINT;

export const SignUpPage: React.FC = () => {
  const [formValues, setFormValues] = useState<SignUpFormValues>({
    FULL_NAME: "",
    LOGIN_EMAIL_ADDRESS: "",
    LOGIN_MOBILE_NO: "",
    LOGIN_PASSWORD: "",
    COMPANY_NAME: "",
    GST_VAT_NO: "",
    FULL_ADDRESS: "",
    CITY: "",
    STATE_NAME: "",
    COUNTRY: "",
    PIN_CODE: "",
    GPS_LOCATION: "",
    GPS_LATITUDE: "",
    GPS_LONGITUDE: "",
    userType: "",
    confirmPassword: "",
    acknowledged: false,
  });

  const [step, setStep] = useState<number>(1);
  const [contactInfo, setContactInfo] = useState<string>("");
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [phoneVerified, setPhoneVerified] = useState<boolean>(false);
  const [isEmail, setIsEmail] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [otpTimer, setOtpTimer] = useState<number>(0);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpForEmail, setOtpForEmail] = useState<string>("");
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth() as AuthContextType;
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  const setupRecaptcha = (): RecaptchaVerifier => {
    if (!auth) throw new Error("🔥 auth is undefined!");
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          siteKey: "6LcUGW4rAAAAAB35Or18Oizvq3zL48MrZtoUgtpE",
          callback: () => {
            console.log("✅ Captcha solved!");
          },
        }
      );
      recaptchaRef.current.render().catch(console.error);
    }
    return recaptchaRef.current;
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (otpTimer > 0) {
      timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpTimer]);

  const handleSendOtp = async (): Promise<void> => {
    setError("");
    if (isEmail) {
      if (!contactInfo.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        setError("Please enter a valid email address");
        return;
      }

      try {
        setLoading(true);
        const generatedOtp = generateOTP(6);
        setOtpForEmail(generatedOtp);

        const emailData: EmailData = {
          toEmail: contactInfo,
          subject: "Your iStreams ERP Verification Code",
          body: `Your verification code is: ${generatedOtp}`,
          displayName: "iStreams ERP",
        };

        await sendEmail(emailData);
        setOtpSent(true);
        setOtpTimer(120);
        setStep(2);
      } catch (err: any) {
        console.error("Email OTP error:", err);
        setError("Failed to send OTP. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }

      const appVerifier = setupRecaptcha();
      try {
        const confirmation = await signInWithPhoneNumber(
          auth,
          contactInfo,
          appVerifier
        );
        setConfirmationResult(confirmation);
        setOtpSent(true);
        setOtpTimer(120);
        setStep(2);
        alert("✅ OTP sent!");
      } catch (err: any) {
        console.error("Error sending OTP:", err);
        if (err.code === "auth/too-many-requests") {
          setError(
            "Too many SMS requests. Please wait a while before retrying."
          );
        } else {
          setError("Could not send OTP. Please try again.");
        }
      }
    }
  };

  const handleVerifyOtp = async (): Promise<void> => {
    setError("");
    if (isEmail) {
      if (!otp) {
        setError("Please enter the OTP");
        return;
      }
      if (otp === otpForEmail) {
        setFormValues((prev) => ({
          ...prev,
          LOGIN_EMAIL_ADDRESS: contactInfo,
        }));
        setEmailVerified(true);
        setStep(3);
      } else {
        setError("Invalid OTP. Please check and try again.");
      }
    } else {
      if (!confirmationResult) {
        setError("Please request an OTP first.");
        return;
      }
      if (otp.length === 0) {
        alert("Enter the OTP you received.");
        return;
      }

      try {
        const result = await confirmationResult.confirm(otp);
        setFormValues((prev) => ({
          ...prev,
          LOGIN_MOBILE_NO: contactInfo,
        }));
        setPhoneVerified(true);
        setStep(3);
        console.log("User signed in:", result.user);
      } catch (err: any) {
        console.error("Invalid OTP:", err);
        setError("Invalid OTP, please try again.");
      }
    }
  };

  const handleBack = (): void => {
    setStep(step - 1);
    setError("");
    setOtp("");
    setOtpForEmail("");
  };

  const handleOptionalVerify = async (
    contact: string,
    isEmail: boolean
  ): Promise<boolean> => {
    try {
      if (isEmail) {
        setEmailVerified(true);
        setFormValues((prev) => ({ ...prev, LOGIN_EMAIL_ADDRESS: contact }));
      } else {
        setPhoneVerified(true);
        setFormValues((prev) => ({ ...prev, LOGIN_MOBILE_NO: contact }));
      }
      return true; // Indicate success
    } catch (error: any) {
      console.error("Optional verify failed:", error);
      return false;
    }
  };

  const handleSignup = useCallback(
    async (values: SignUpFormValues): Promise<void> => {
      setLoading(true);
      setError("");

      try {
        if (!values || Object.values(values).some((v) => v === undefined)) {
          throw new Error("Form data is incomplete");
        }

        const dbResponse = await callSoapService<string>(
          PUBLIC_SERVICE_URL,
          "ConnectToPublicDB",
          {}
        );
        console.log("DB Connection:", dbResponse);

        const payload: SignUpFormValues = { ...values };

        console.log("Final Payload:", payload);

        const response = await callSoapService<string>(
          PUBLIC_SERVICE_URL,
          "Public_User_CreateProfile",
          payload
        );

        if (typeof response === "string" && response.includes("SUCCESS")) {
          const loginCredential = isEmail
            ? values.LOGIN_EMAIL_ADDRESS
            : values.LOGIN_MOBILE_NO;

          await login(loginCredential, values.LOGIN_PASSWORD);
          navigate("/login");
        } else {
          throw new Error(response || "Profile creation failed");
        }
      } catch (err: any) {
        console.error("Signup Error:", err);
        setError(err.message || "Signup failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [isEmail, login, navigate]
  );

  const stepTitles: Record<number, string> = {
    1: "Create Your Account",
    2: "Verify Your Identity",
    3: "Complete Your Profile",
  };

  const stepSubtitles: Record<number, string> = {
    1: "Join our platform in just a few steps",
    2: "Enter the code we sent to your contact",
    3: "Finalize your account details",
  };

  return (
    <>
      <div id="recaptcha-container" />
      <AuthLayout
        animationData={animationData}
        logoLight={logoLight}
        logoDark={logoDark}
        title={stepTitles[step]}
        subtitle={stepSubtitles[step]}
      >
        <Card className="border-0 shadow-none">
          <CardContent>
            {step === 1 && (
              <SignUpStep1
                isEmail={isEmail}
                setIsEmail={setIsEmail}
                contactInfo={contactInfo}
                setContactInfo={setContactInfo}
                loading={loading}
                error={error}
                setError={setError}
                handleSendOtp={handleSendOtp}
              />
            )}

            {step === 2 && (
              <SignUpStep2
                contactInfo={contactInfo}
                otp={otp}
                setOtp={setOtp}
                otpTimer={otpTimer}
                otpSent={otpSent}
                loading={loading}
                error={error}
                handleVerifyOtp={handleVerifyOtp}
                handleSendOtp={handleSendOtp}
                handleBack={handleBack}
              />
            )}

            {step === 3 && (
              <SignUpStep3
                initialValues={formValues}
                setFormValues={setFormValues}
                handleSignup={handleSignup}
                loading={loading}
                isEmailPrimary={isEmail}
                emailVerified={emailVerified}
                phoneVerified={phoneVerified}
                onOptionalVerify={handleOptionalVerify}
              />
            )}
          </CardContent>
        </Card>
      </AuthLayout>
    </>
  );
};
