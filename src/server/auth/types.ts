import "server-only";

export type RoleCode = "ADMIN" | "AUTHOR";
export type StatusCode = "ACTIVE" | "BLOCKED";

export interface AuthenticatedUser {
  id: string;
  username: string;
  displayName: string;
  role: RoleCode;
  status: StatusCode;
  mustChangePassword: boolean;
}

export interface SessionResult {
  ok: boolean;
  sessionToken?: string;
  expiresAt?: Date;
  user?: AuthenticatedUser;
  code?: "INVALID_CREDENTIALS" | "USER_BLOCKED" | "INTERNAL_ERROR";
}

export interface AuthMetadata {
  ipAddress?: string | null;
  userAgent?: string | null;
}
