// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Declare Deno globals for standard TypeScript compilers
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

interface InviteRequest {
  email: string;
  name: string;
  role: string;
  redirectTo?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

Deno.serve(async (req: Request) => {
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, name, role, redirectTo } = (await req.json()) as InviteRequest;

    if (!email || !name || !role) {
      return new Response(
        JSON.stringify({ error: 'email, name, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Admin client — uses service role key (safe here, server-side only)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Send invitation email via Supabase Auth Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { name, role },
        redirectTo: redirectTo || `${Deno.env.get('SITE_URL') ?? 'http://localhost:5173'}/`,
      }
    );

    if (authError) {
      console.error('[invite-user] Auth error:', authError.message);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also upsert into the public users table (the app's user list)
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .upsert(
        { id: authData.user.id, name, email, role, status: 'Pending' },
        { onConflict: 'id' }
      );

    if (dbError) {
      console.warn('[invite-user] DB upsert warning:', dbError.message);
      // Non-fatal: the auth invite was still sent
    }

    return new Response(
      JSON.stringify({ success: true, userId: authData.user.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    const errorStack = err instanceof Error ? err.stack : '';
    console.error('[invite-user] Unexpected error:', errorMsg, errorStack);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMsg, stack: errorStack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

