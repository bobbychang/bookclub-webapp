import { createBrowserClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';
import { APP_BASE_PATH } from '@/lib/routes';

let client: SupabaseClient | undefined;
const cookiePath = APP_BASE_PATH || '/';

export const createClient = () => {
  // Return a fresh client for SSR to avoid state leaks between requests
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          path: cookiePath,
        }
      }
    );
  }

  // Use singleton for browser to share session state
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        path: cookiePath,
      }
    }
  );
  
  return client;
};
