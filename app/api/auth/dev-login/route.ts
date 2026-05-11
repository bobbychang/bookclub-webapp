import { createAdminClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email } = await request.json();

  // 1. Check if Dev Mode is enabled globally
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
    return NextResponse.json({ error: "Dev Mode is disabled" }, { status: 403 });
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
