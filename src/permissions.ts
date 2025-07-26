import type { PermissionMap } from "@/types/auth";

export const PERMISSION_MAP: PermissionMap = {
  DASHBOARD_FULL_VIEW: {
    service: "DMS_CheckRights_ForTheUser",
    params: (userName: string, isAdmin: boolean) => ({
      UserName: userName,
      FormName: "DMS-DASHBOARDADMIN",
      FormDescription: "Dashboard Full View",
      UserType: isAdmin ? "ADMINISTRATOR" : "USER",
    }),
  },
  VIEW_ALL_DOCS: {
    service: "DMS_CheckRights_ForTheUser",
    params: (userName: string, isAdmin: boolean) => ({
      UserName: userName,
      FormName: "DMS-DOCUMENTLISTVIEWALL",
      FormDescription: "View Rights For All Documents",
      UserType: isAdmin ? "ADMINISTRATOR" : "USER",
    }),
  },
  EDIT_ALL_DOCS: {
    service: "DMS_CheckRights_ForTheUser",
    params: (userName: string, isAdmin: boolean) => ({
      UserName: userName,
      FormName: "DMS-DOCUMENTLISTEDITALL",
      FormDescription: "Edit Rights For All Documents",
      UserType: isAdmin ? "ADMINISTRATOR" : "USER",
    }),
  },
  VIEW_TEAMS_FULL: {
    service: "DMS_CheckRights_ForTheUser",
    params: (userName: string, isAdmin: boolean) => ({
      UserName: userName,
      FormName: "DMS-TEAMSFULLVIEW",
      FormDescription: "View Rights For Entire Team",
      UserType: isAdmin ? "ADMINISTRATOR" : "USER",
    }),
  },
  CATEGORY_MASTER_VIEW: {
    service: "DMS_CheckRights_ForTheUser",
    params: (userName: string, isAdmin: boolean) => ({
      UserName: userName,
      FormName: "DMS-CATEGORYMASTER",
      FormDescription: "View category master",
      UserType: isAdmin ? "ADMINISTRATOR" : "USER",
    }),
  },
};

export const PERMISSION_KEYS: string[] = Object.keys(PERMISSION_MAP);
