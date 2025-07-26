// src/components/SignUpStep3.tsx
import { callPublicSoapService } from '@/api/callSoapService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sendEmail } from '@/services/emailService';
import type { OptionalVerificationState, SignUpFormValues, SignUpStep3Props } from '@/types/signup';
import { generateOTP } from '@/utils/generateOTP';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Link } from 'react-router-dom';
import * as Yup from 'yup';
import { auth } from '../../../../firebase.config';
import { OptionalVerificationModal } from './OptionalVerificationModal';

const PUBLIC_SERVICE_URL = import.meta.env.VITE_SOAP_ENDPOINT;

export const SignUpStep3: React.FC<SignUpStep3Props> = ({
  initialValues,
  setFormValues,
  handleSignup,
  loading,
  isEmailPrimary,
  emailVerified,
  phoneVerified,
  onOptionalVerify,
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [optionalVerification, setOptionalVerification] = useState<OptionalVerificationState>({
    open: false,
    contact: '',
    isEmail: !isEmailPrimary,
    otp: '',
    otpSent: false,
    otpTimer: 0,
    loading: false,
    error: '',
    confirmationResult: null,
    storedOtp: '',
    verifiedEmail: '',
    verifiedPhone: '',
  });
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  const setupRecaptcha = (): RecaptchaVerifier => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container-optional', {
        size: 'invisible',
        callback: () => console.log('Recaptcha solved'),
      });
      recaptchaRef.current.render().catch(console.error);
    }
    return recaptchaRef.current;
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (optionalVerification.otpTimer > 0) {
      timer = setTimeout(
        () => setOptionalVerification((prev) => ({ ...prev, otpTimer: prev.otpTimer - 1 })),
        1000
      );
    }
    return () => clearTimeout(timer);
  }, [optionalVerification.otpTimer]);

  const handleOptionalVerification = async (contact: string, isEmail: boolean = !isEmailPrimary): Promise<void> => {
    setOptionalVerification((prev) => ({
      ...prev,
      contact,
      isEmail,
      loading: true,
      error: '',
      otpSent: false,
      otp: '',
    }));

    try {
      const methodName = isEmail ? 'Public_User_ValidateEmailAddress' : 'Public_User_ValidateMobileNo';
      const response = await callPublicSoapService<string>(
        PUBLIC_SERVICE_URL,
        methodName,
        isEmail ? { emailAddress: contact } : { mobileNo: contact }
      );

      if (response === 'Already Exists') {
        throw new Error(`This ${isEmail ? 'email' : 'phone'} is already registered`);
      }

      if (isEmail) {
        const otp = generateOTP(6);
        await sendEmail({
          toEmail: contact,
          subject: 'Your iStreams ERP Verification Code',
          body: `Your OTP is: ${otp}`,
          displayName: 'iStreams ERP',
        });

        setOptionalVerification((prev) => ({
          ...prev,
          storedOtp: otp,
          otpSent: true,
          otpTimer: 120,
          loading: false,
        }));
      } else {
        const appVerifier = setupRecaptcha();
        const confirmation = await signInWithPhoneNumber(auth, contact, appVerifier);
        setOptionalVerification((prev) => ({
          ...prev,
          confirmationResult: confirmation,
          otpSent: true,
          otpTimer: 120,
          loading: false,
        }));
      }
    } catch (error: any) {
      console.error('Optional verification error:', error);
      setOptionalVerification((prev) => ({
        ...prev,
        error: error.message || 'Verification failed. Try again.',
        loading: false,
      }));
    }
  };

  const verifyOptionalOtp = async (): Promise<void> => {
    setOptionalVerification((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const { isEmail, otp, storedOtp, confirmationResult } = optionalVerification;

      if (isEmail) {
        if (otp !== storedOtp) throw new Error('Invalid OTP');
        await onOptionalVerify(optionalVerification.contact, true);
      } else {
        if (!confirmationResult) throw new Error('No confirmation result available');
        await confirmationResult.confirm(otp);
        await onOptionalVerify(optionalVerification.contact, false);
      }
      closeModal();
    } catch (error: any) {
      setOptionalVerification((prev) => ({
        ...prev,
        error: 'Invalid verification code. Please try again.',
      }));
    } finally {
      setOptionalVerification((prev) => ({ ...prev, loading: false }));
    }
  };

  const closeModal = (): void => {
    setOptionalVerification((prev) => ({
      ...prev,
      open: false,
      otp: '',
      error: '',
    }));
  };

  const SignupSchema = Yup.object().shape({
    FULL_NAME: Yup.string().required('Full Name is required'),
    LOGIN_EMAIL_ADDRESS: Yup.string()
      .email('Invalid email')
      .test('verified-email', 'Email must be verified', function (value) {
        if (isEmailPrimary) return true;
        if (!value) return true;
        return emailVerified;
      }),
    LOGIN_MOBILE_NO: Yup.string()
      .test('verified-phone', 'Phone must be verified', function (value) {
        if (!isEmailPrimary) return true;
        if (!value) return true;
        return phoneVerified;
      }),
    userType: Yup.string().required('Account type is required'),
    COMPANY_NAME: Yup.string().when('userType', {
      is: 'business',
      then: (schema) => schema.required('Company name is required'),
    }),
    GST_VAT_NO: Yup.string().when('userType', {
      is: 'business',
      then: (schema) => schema.required('GST number is required'),
    }),
    FULL_ADDRESS: Yup.string().required('Address is required'),
    CITY: Yup.string().required('City is required'),
    STATE_NAME: Yup.string().required('State is required'),
    COUNTRY: Yup.string().required('Country is required'),
    PIN_CODE: Yup.string().required('Pin code is required'),
    LOGIN_PASSWORD: Yup.string().min(8, 'Minimum 8 characters').required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('LOGIN_PASSWORD')], 'Passwords must match')
      .required('Confirm your password'),
    acknowledged: Yup.boolean().oneOf([true], 'You must agree to terms'),
  });

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={SignupSchema}
      enableReinitialize
      onSubmit={(values: SignUpFormValues) => {
        setFormValues(values);
        handleSignup(values);
      }}
    >
      {({ values, handleChange, setFieldValue }) => (
        <Form className="space-y-6 overflow-y-auto p-1">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col">
              <Label htmlFor="FULL_NAME">Full Name</Label>
              <Input
                id="FULL_NAME"
                name="FULL_NAME"
                value={values.FULL_NAME}
                onChange={handleChange}
                className="mt-1"
              />
              <ErrorMessage name="FULL_NAME" component="div" className="mt-1 text-sm text-red-500" />
            </div>

            <div className="flex flex-col">
              <Label>{isEmailPrimary ? 'Email' : 'Phone'}</Label>
              {isEmailPrimary ? (
                <Input value={values.LOGIN_EMAIL_ADDRESS} disabled className="mt-1 bg-gray-100" />
              ) : (
                <PhoneInput
                  country="in"
                  value={values.LOGIN_MOBILE_NO}
                  disabled
                  inputStyle={{ width: '100%', backgroundColor: '#f3f4f6' }}
                  containerStyle={{ marginTop: '0.25rem' }}
                />
              )}
              <div className="mt-1 text-sm text-green-600">✓ Verified</div>
            </div>

            <div className="flex flex-col">
              <Label>{!isEmailPrimary ? 'Email' : 'Phone'}</Label>
              <div className="flex gap-2">
                {!isEmailPrimary ? (
                  <Input
                    name="LOGIN_EMAIL_ADDRESS"
                    value={values.LOGIN_EMAIL_ADDRESS}
                    onChange={handleChange}
                    className="flex-1"
                    disabled={emailVerified}
                  />
                ) : (
                  <PhoneInput
                    country="in"
                    value={values.LOGIN_MOBILE_NO?.replace(/^\+/, '')}
                    onChange={(phone: string) => setFieldValue('LOGIN_MOBILE_NO', `+${phone}`)}
                    inputProps={{
                      name: 'LOGIN_MOBILE_NO',
                      id: 'LOGIN_MOBILE_NO',
                      disabled: phoneVerified,
                    }}
                    inputStyle={{ width: '100%' }}
                    containerStyle={{ flex: 1 }}
                  />
                )}
                {values[!isEmailPrimary ? 'LOGIN_EMAIL_ADDRESS' : 'LOGIN_MOBILE_NO'] &&
                  !(isEmailPrimary ? phoneVerified : emailVerified) && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        const contact = values[!isEmailPrimary ? 'LOGIN_EMAIL_ADDRESS' : 'LOGIN_MOBILE_NO'];
                        const isEmail = !isEmailPrimary;

                        setOptionalVerification((prev) => ({
                          ...prev,
                          open: true,
                          contact,
                          isEmail,
                        }));

                        handleOptionalVerification(contact, isEmail);
                      }}
                      disabled={optionalVerification.loading}
                    >
                      Verify
                    </Button>
                  )}
              </div>
              {(isEmailPrimary ? phoneVerified : emailVerified) && (
                <div className="mt-1 text-sm text-green-600">✓ Verified</div>
              )}
              <ErrorMessage
                name={!isEmailPrimary ? 'LOGIN_EMAIL_ADDRESS' : 'LOGIN_MOBILE_NO'}
                component="div"
                className="mt-1 text-sm text-red-500"
              />
            </div>

            <div className="flex flex-col">
              <Label htmlFor="userType">Account Type</Label>
              <Select value={values.userType} onValueChange={(val: string) => setFieldValue('userType', val)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <ErrorMessage name="userType" component="div" className="mt-1 text-sm text-red-500" />
            </div>

            {values.userType === 'business' && (
              <>
                <div className="flex flex-col">
                  <Label htmlFor="COMPANY_NAME">Company Name</Label>
                  <Input
                    id="COMPANY_NAME"
                    name="COMPANY_NAME"
                    value={values.COMPANY_NAME}
                    onChange={handleChange}
                    className="mt-1"
                  />
                  <ErrorMessage name="COMPANY_NAME" component="div" className="mt-1 text-sm text-red-500" />
                </div>

                <div className="flex flex-col">
                  <Label htmlFor="GST_VAT_NO">GST / VAT Number</Label>
                  <Input
                    id="GST_VAT_NO"
                    name="GST_VAT_NO"
                    value={values.GST_VAT_NO}
                    onChange={handleChange}
                    className="mt-1"
                  />
                  <ErrorMessage name="GST_VAT_NO" component="div" className="mt-1 text-sm text-red-500" />
                </div>
              </>
            )}

            <div className="flex flex-col">
              <Label htmlFor="FULL_ADDRESS">Address</Label>
              <Input
                id="FULL_ADDRESS"
                name="FULL_ADDRESS"
                value={values.FULL_ADDRESS}
                onChange={handleChange}
                className="mt-1"
              />
              <ErrorMessage name="FULL_ADDRESS" component="div" className="mt-1 text-sm text-red-500" />
            </div>

            <div className="flex flex-col">
              <Label htmlFor="CITY">City</Label>
              <Input
                id="CITY"
                name="CITY"
                value={values.CITY}
                onChange={handleChange}
                className="mt-1"
              />
              <ErrorMessage name="CITY" component="div" className="mt-1 text-sm text-red-500" />
            </div>

            <div className="flex flex-col">
              <Label htmlFor="STATE_NAME">State</Label>
              <Input
                id="STATE_NAME"
                name="STATE_NAME"
                value={values.STATE_NAME}
                onChange={handleChange}
                className="mt-1"
              />
              <ErrorMessage name="STATE_NAME" component="div" className="mt-1 text-sm text-red-500" />
            </div>

            <div className="flex flex-col">
              <Label htmlFor="COUNTRY">Country</Label>
              <Input
                id="COUNTRY"
                name="COUNTRY"
                value={values.COUNTRY}
                onChange={handleChange}
                className="mt-1"
              />
              <ErrorMessage name="COUNTRY" component="div" className="mt-1 text-sm text-red-500" />
            </div>

            <div className="flex flex-col">
              <Label htmlFor="PIN_CODE">Pin Code</Label>
              <Input
                id="PIN_CODE"
                name="PIN_CODE"
                value={values.PIN_CODE}
                onChange={handleChange}
                className="mt-1"
              />
              <ErrorMessage name="PIN_CODE" component="div" className="mt-1 text-sm text-red-500" />
            </div>

            <div className="flex flex-col">
              <Label htmlFor="LOGIN_PASSWORD">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="LOGIN_PASSWORD"
                  name="LOGIN_PASSWORD"
                  type={showPassword ? 'text' : 'password'}
                  value={values.LOGIN_PASSWORD}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <ErrorMessage name="LOGIN_PASSWORD" component="div" className="mt-1 text-sm text-red-500" />
            </div>

            <div className="flex flex-col">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={values.confirmPassword}
                onChange={handleChange}
                className="mt-1"
              />
              <ErrorMessage name="confirmPassword" component="div" className="mt-1 text-sm text-red-500" />
            </div>

            <div className="flex items-start gap-2 pt-4">
              <Field type="checkbox" id="acknowledged" name="acknowledged" className="mt-1 h-4 w-4" />
              <label htmlFor="acknowledged" className="text-sm text-muted-foreground">
                I agree to the{' '}
                <Link to="#" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="#" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            <ErrorMessage name="acknowledged" component="div" className="text-sm text-red-500" />

            <OptionalVerificationModal
              contactInfo={optionalVerification.contact}
              isEmail={optionalVerification.isEmail}
              open={optionalVerification.open}
              onOpenChange={(open: boolean) => setOptionalVerification((prev) => ({ ...prev, open }))}
              otp={optionalVerification.otp}
              setOtp={(otp: string) => setOptionalVerification((prev) => ({ ...prev, otp }))}
              otpTimer={optionalVerification.otpTimer}
              onResend={() => handleOptionalVerification(optionalVerification.contact)}
              onVerify={verifyOptionalOtp}
              loading={optionalVerification.loading}
              error={optionalVerification.error}
            />

            <div id="recaptcha-container-optional" />

            <Button type="submit" disabled={loading} className="mt-4 w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};