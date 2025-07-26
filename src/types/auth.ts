export interface UserData {
  serviceUrl: string;
  clientURL: string;
  companyCode: string;
  branchCode: string;
  userEmail: string;
  userName: string;
  userEmployeeNo: string;
  userAvatar: string;
  companyName: string;
  companyAddress: string;
  companyLogo: string;
  companyCurrName: string;
  companyCurrDecimals: number;
  companyCurrSymbol: string | null;
  companyCurrIsIndianStandard: boolean;
  isAdmin: boolean;
  permissions: Record<string, string>;
  docCategories: string[];
}

export interface AuthContextType {
  userData: UserData;
  loading: boolean;
  login: (
    loginCredential: string | Partial<UserData>,
    rememberMe: boolean
  ) => Promise<void>;
  logout: () => void;
  refreshPermissions: () => Promise<void>;
  isAuthenticated: boolean;
}

export interface PermissionMap {
  [key: string]: {
    service: string;
    params: (
      userName: string,
      isAdmin: boolean
    ) => {
      UserName: string;
      FormName: string;
      FormDescription: string;
      UserType: string;
    };
  };
}

export interface LoginUserData {
  user: {
    name: string;
    employeeNo: string;
    employeeImage: string | null;
    isAdmin: boolean;
  };
  company: {
    name: string;
    logo: string;
    code: string;
  };
  branch: {
    code: string;
    info: Record<string, any> | null;
  };
  currency: {
    info: Record<string, any> | null;
  };
  clientURL: string;
}

export interface EmployeeDetails {
  EMP_NO: string;
  USER_NAME: string;
}

export interface BranchInfo {
  ADDRESS_POSTAL: string;
  CURRENCY_NAME: string;
  [key: string]: any;
}

export interface CurrencyInfo {
  NO_OF_DECIMALS: number;
  CURRENCY_CODE: string;
  IS_INDIANCURRENCY_FORMAT: boolean;
  [key: string]: any;
}

export interface AuthLayoutProps {
  children: React.ReactNode;
  animationData: any;
  logoLight: string;
  logoDark: string;
  title: string;
  subtitle: string;
}
