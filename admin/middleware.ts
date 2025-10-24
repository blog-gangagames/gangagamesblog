import { NextRequest, NextResponse } from "next/server";

// Optional Basic Auth for Vercel Edge Middleware
// Set BASIC_AUTH_USER and BASIC_AUTH_PASS in the environment to enable.
// To disable, leave them undefined or set ADMIN_AUTH_DISABLED="true".
export const config = {
  matcher: "/((?!_next|favicon.ico|assets|images|css|js).*)",
};

export function middleware(req: NextRequest) {
  const disable = process.env.ADMIN_AUTH_DISABLED === "true";
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  if (disable || !user || !pass) {
    return NextResponse.next();
  }

  const header = req.headers.get("authorization") || "";
  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic realm=\"Admin\"" },
    });
  }

  const credentials = Buffer.from(encoded, "base64").toString();
  const [name, password] = credentials.split(":");
  if (name === user && password === pass) {
    return NextResponse.next();
  }

  return new NextResponse("Access denied", { status: 401 });
}