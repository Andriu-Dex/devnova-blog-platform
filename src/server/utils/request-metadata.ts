import { headers } from "next/headers";

export async function getRequestMetadata() {
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || null;
  const userAgent = headersList.get("user-agent") || null;

  return { ipAddress, userAgent };
}
