import "server-only";
import { getCurrentAuthenticatedUser } from "./authentication-service";
import { AuthenticatedUser } from "./types";
import { redirect, notFound } from "next/navigation";

/**
 * Ensures the request has a valid session with an ACTIVE user.
 * Redirects to /login if no valid session is found.
 */
export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Ensures the request has a valid session with an ACTIVE user and role ADMIN.
 * Redirects to /login if no valid session.
 * Throws a notFound() if the user is authenticated but not an ADMIN.
 * If mustChangePassword is true, redirects to /account/change-password.
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser();
  if (user.role !== "ADMIN") {
    notFound();
  }
  if (user.mustChangePassword) {
    redirect("/account/change-password");
  }
  return user;
}

/**
 * Ensures the request has a valid session with an ACTIVE user and role AUTHOR or ADMIN.
 * Redirects to /login if no valid session.
 * If mustChangePassword is true, redirects to /account/change-password.
 */
export async function requireAuthorOrAdmin(): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser();
  if (user.role !== "AUTHOR" && user.role !== "ADMIN") {
    notFound(); // Safety net in case more roles are added later
  }
  if (user.mustChangePassword) {
    redirect("/account/change-password");
  }
  return user;
}
