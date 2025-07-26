// src/layouts/AuthLayout.tsx
import Lottie from "react-lottie";
import type { AuthLayoutProps } from "@/types/auth";

export const AuthLayout = ({
  children,
  animationData,
  logoLight,
  logoDark,
  title,
  subtitle,
}: AuthLayoutProps) => (
  <div className="grid h-screen grid-cols-1 lg:grid-cols-2">
    <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-50 to-indigo-100 p-10 dark:from-slate-900 dark:to-slate-800 lg:flex">
      <div className="flex h-20 gap-x-3">
        <img
          src={logoLight}
          alt="iStreams ERP Solutions | CRM"
          className="max-h-full object-contain dark:hidden"
        />
        <img
          src={logoDark}
          alt="iStreams ERP Solutions | CRM"
          className="hidden max-h-full object-contain dark:block"
        />
      </div>

      <div className="flex justify-center">
        <div className="max-w-sm">
          <Lottie
            options={{
              loop: true,
              autoplay: true,
              animationData: animationData,
              rendererSettings: {
                preserveAspectRatio: "xMidYMid slice",
              },
            }}
          />
        </div>
      </div>

      <div className="text-center">
        <blockquote className="space-y-2">
          <p className="text-lg font-medium">
            “Transform your business operations with our intuitive CRM platform
            designed for efficiency and growth.”
          </p>
          <footer className="text-sm text-gray-600 dark:text-gray-300">
            - iStreams ERP Solutions
          </footer>
        </blockquote>
      </div>
    </div>

    <div className="flex flex-col justify-center overflow-y-auto bg-white px-4 dark:bg-slate-950 lg:p-8">
      <div className="mx-auto w-full max-w-md overflow-y-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {children}

        <div className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} iStreams ERP Solutions. All rights
          reserved.
        </div>
      </div>
    </div>
  </div>
);
