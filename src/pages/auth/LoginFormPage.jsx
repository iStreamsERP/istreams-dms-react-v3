import { useAuth } from "@/contexts/AuthContext";
import animationData from "@/lotties/crm-animation-lotties.json";
import { callSoapService } from "@/api/callSoapService";
import { Eye, EyeOff, Loader2, MailOpen } from "lucide-react";
import { useCallback, useState } from "react";
import Lottie from "react-lottie";
import { Link, useNavigate } from "react-router-dom";
import { getNameFromEmail } from "@/utils/emailHelpers";
import { Button, Checkbox, Input } from "@/components/ui";
import { logoDark, logoLight } from "@/assets";
import { AuthLayout } from "@/layouts";

// Use the proxy path for the public service.
const PUBLIC_SERVICE_URL = import.meta.env.VITE_SOAP_ENDPOINT;
const DEFAULT_AVATAR_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbBa24AAg4zVSuUsL4hJnMC9s3DguLgeQmZA&s";

export const LoginFormPage = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const stepTitles = {
    1: "Create Your Account",
    2: "Verify Your Identity",
    3: "Complete Your Profile",
  };

  const stepSubtitles = {
    1: "Join our platform in just a few steps",
    2: "Enter the code we sent to your contact",
    3: "Finalize your account details",
  };

  // Memoized login handler to prevent re-creation on each render.
  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      if (!email) {
        setError("Username is required!");
        setLoading(false);
        return;
      } else if (!password) {
        setError("Password is required!");
        setLoading(false);
        return;
      }

      const userData = {
        user: {
          name: getNameFromEmail(email),
          employeeNo: "",
          employeeImage: null,
          isAdmin: false,
        },
        company: {
          name: "",
          logo: "",
          code: "",
        },
        branch: {
          code: "",
          info: null,
        },
        currency: {
          info: null,
        },
        clientURL: "",
      };

      const doConnectionPayload = {
        LoginUserName: email,
      };

      localStorage.setItem(
        "doConnectionPayload",
        JSON.stringify(doConnectionPayload)
      );

      try {
        const publicDoConnectionResponse = await callSoapService(
          PUBLIC_SERVICE_URL,
          "doConnection",
          doConnectionPayload
        );

        if (publicDoConnectionResponse === "SUCCESS") {
          userData.clientURL = await callSoapService(
            PUBLIC_SERVICE_URL,
            "GetServiceURL",
            doConnectionPayload
          );

          const clientDoConnectionResponse = await callSoapService(
            userData.clientURL,
            "doConnection",
            doConnectionPayload
          );

          if (clientDoConnectionResponse === "SUCCESS") {
            const authenticationPayload = {
              username: userData.user.name,
              password: password,
            };

            const authenticationResponse = await callSoapService(
              userData.clientURL,
              "verifyauthentication",
              authenticationPayload
            );

            if (authenticationResponse === "Authetication passed") {
              const clientEmpDetailsPayload = {
                userfirstname: userData.user.name,
              };

              const clientEmpDetails = await callSoapService(
                userData.clientURL,
                "getemployeename_and_id",
                clientEmpDetailsPayload
              );

              userData.user.employeeNo = clientEmpDetails[0]?.EMP_NO;

              if (userData.user.employeeNo) {
                const getEmployeeImagePayload = {
                  EmpNo: userData.user.employeeNo,
                };

                const employeeImageResponse = await callSoapService(
                  userData.clientURL,
                  "getpic_bytearray",
                  getEmployeeImagePayload
                );

                userData.user.employeeImage = employeeImageResponse
                  ? `data:image/jpeg;base64,${employeeImageResponse}`
                  : DEFAULT_AVATAR_URL;
              }

              userData.company.code = await callSoapService(
                userData.clientURL,
                "General_Get_DefaultCompanyCode",
                ""
              );

              if (userData.company.code) {
                const branchCodePayload = {
                  CompanyCode: userData.company.code,
                };

                userData.branch.code = await callSoapService(
                  userData.clientURL,
                  "General_Get_DefaultBranchCode",
                  branchCodePayload
                );

                const companyNamePayload = {
                  CompanyCode: userData.company.code,
                  BranchCode: userData.branch.code,
                };

                userData.company.name = await callSoapService(
                  userData.clientURL,
                  "General_Get_DefaultCompanyName",
                  companyNamePayload
                );

                const companyLogoPayload = {
                  CompanyCode: userData.company.code,
                  BranchCode: userData.branch.code,
                };

                userData.company.logo = await callSoapService(
                  userData.clientURL,
                  "General_Get_CompanyLogo",
                  companyLogoPayload
                );

                const branchDetailsPayload = {
                  SQLQuery: `SELECT * FROM BRANCH_MASTER WHERE COMPANY_CODE = ${userData.company.code} AND DEFAULT_STATUS = 'T'`,
                };

                const branchInfo = await callSoapService(
                  userData.clientURL,
                  "DataModel_GetDataFrom_Query",
                  branchDetailsPayload
                );

                userData.branch.info = branchInfo[0];

                if (userData.branch.info?.CURRENCY_NAME) {
                  const currencyDetailsPayload = {
                    SQLQuery: `SELECT * FROM COUNTRY_MASTER WHERE CURRENCY_NAME = '${userData.branch.info.CURRENCY_NAME}'`,
                  };

                  const currencyInfo = await callSoapService(
                    userData.clientURL,
                    "DataModel_GetDataFrom_Query",
                    currencyDetailsPayload
                  );
                  userData.currency.info = currencyInfo[0];
                }
              }

              const isAdminPayload = {
                UserName: clientEmpDetails[0]?.USER_NAME,
              };

              const isAdminResponse = await callSoapService(
                userData.clientURL,
                "DMS_Is_Admin_User",
                isAdminPayload
              );

              userData.user.isAdmin = isAdminResponse === "Yes";

              const payload = {
                companyCode: userData.company.code,
                branchCode: userData.branch.code,
                userEmail: email,
                userName: clientEmpDetails[0]?.USER_NAME,
                userEmployeeNo: clientEmpDetails[0]?.EMP_NO,
                userAvatar: userData.user.employeeImage,
                clientURL: userData.clientURL,
                companyName: userData.company.name,
                companyAddress: userData.branch.info?.ADDRESS_POSTAL,
                companyLogo: userData.company.logo,
                companyCurrName: userData.branch.info?.CURRENCY_NAME,
                companyCurrDecimals: userData.currency.info?.NO_OF_DECIMALS,
                companyCurrSymbol: userData.currency.info?.CURRENCY_CODE,
                companyCurrIsIndianStandard:
                  userData.currency.info?.IS_INDIANCURRENCY_FORMAT,
                isAdmin: userData.user.isAdmin,
              };

              login(payload, rememberMe);

              navigate("/");
            } else {
              setError(authenticationResponse);
            }
          } else {
            setError(clientDoConnectionResponse);
          }
        } else {
          setError(publicDoConnectionResponse);
        }
      } catch (err) {
        console.error("Login error:", err);
        setError("Login failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [email, password, rememberMe, navigate, login]
  );

  return (
    <AuthLayout
      animationData={animationData}
      logoLight={logoLight}
      logoDark={logoDark}
      title="Login!"
      subtitle="Enter your credentials to access your account"
    >
      <div className="mx-auto flex w-full flex-col justify-center gap-y-6 sm:w-[350px]">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Input
                name="email"
                id="email"
                placeholder="username@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <div className="relative flex gap-2">
                <Input
                  name="password"
                  id="password"
                  placeholder="*******"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 transform cursor-pointer"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked)}
              />
              <label
                htmlFor="remember-me"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                to="/forgot-password"
                className="text-sm font-medium leading-none hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded bg-red-500 p-2 text-white">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Please wait
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          <p className="text-center text-xs text-gray-400">
            Don't have an account?
            <Link to="/signup" className="text-blue-500 hover:underline">
              {" "}
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};
