import { createBrowserClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

export const createClient = () => {
  // Return a fresh client for SSR to avoid state leaks between requests
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          path: '/bookclub',
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
        path: '/bookclub',
      }
    }
  );
  
  return client;
};
