import { createAdminClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email } = await request.json();

  // 1. Check if Dev Mode is enabled globally
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
    return NextResponse.json({ error: "Dev Mode is disabled" }, { status: 403 });
  }

  // 2. Strict Production Guard (Hard Block)
  // We check for common production environment flags and hostnames
  const isProduction = 
    process.env.NODE_ENV === 'production' || 
    process.env.VERCEL_ENV === 'production' ||
    process.env.DEPLOYMENT_ENV === 'production' ||
    process.env.IS_EC2 === 'true';

  if (isProduction) {
    console.warn(`Blocked Dev Login attempt in production environment for ${email}`);
    return NextResponse.json({ error: "Forbidden: Dev Mode not allowed in production" }, { status: 403 });
  }

  // 3. Production Data Lock (Safety Guard)
  // Ensure we are NOT pointing at the production database while using dev-login bypass.
  // Prod Ref: bzgbskmghquhoxlbfcev
  const isProdDatabase = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('bzgbskmghquhoxlbfcev');
  if (isProdDatabase) {
    console.error(`CRITICAL: Dev Login attempted while pointing at PRODUCTION database (${email}). ACCESS BLOCKED.`);
    return NextResponse.json({ 
        error: "FORBIDDEN: You are currently connected to the PRODUCTION database. Instant Login is disabled to protect real user data. Please switch your .env to the Staging project." 
    }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();
    
    // 3. Generate a direct magic link for the email
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${new URL(request.url).origin}/bookclub`
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 4. Return the OTP directly to the client instead of redirecting which 
    // breaks PKCE flows in App Router @supabase/ssr environments.
    console.log("Dev Login OTP generated:", data.properties?.email_otp);
    return NextResponse.json({ 
        properties: data.properties,
        email_otp: data.properties?.email_otp
    });
  } catch (err) {
    console.error("Dev Login error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
