export interface DocumentUserRights {
  REF_SEQ_NO: number;
  PERMISSION_USER_NAME: string;
  PERMISSION_RIGHTS: "READ" | "WRITE" | "DELETE" | "ALL";
  PERMISSION_VALID_TILL: Date;
  USER_NAME: string;
  ENT_DATE: Date;
}
