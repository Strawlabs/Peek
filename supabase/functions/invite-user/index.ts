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

    // Resolve redirect URL — prefer explicit param, then SITE_URL env, then localhost fallback
    const siteUrl =
      Deno.env.get('SITE_URL') ||
      Deno.env.get('PUBLIC_SITE_URL') ||
      'http://localhost:5173';
    const finalRedirectTo = redirectTo || `${siteUrl}/`;

    // 1. Check if user already exists in Auth
    let existingUserId: string | null = null;
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = listData?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let hashedToken: string | null = null;
    let linkType = 'invite';
    let authUserId: string | null = null;

    if (existingUser) {
      existingUserId = existingUser.id;
      authUserId = existingUser.id;
      linkType = 'recovery';

      console.log(`[invite-user] ${email} already in Auth — triggering reset password email and generating recovery link`);

      // Trigger standard email via Supabase's SMTP
      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: finalRedirectTo,
      });
      if (resetError) {
        console.warn('[invite-user] resetPasswordForEmail warning:', resetError.message);
      }
    } else {
      // Brand new user — send invitation email
      console.log(`[invite-user] ${email} is a new user — sending invite email`);
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        { data: { name, role }, redirectTo: finalRedirectTo }
      );

      if (authError) {
        console.error('[invite-user] Auth error:', authError.message);
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      authUserId = authData.user.id;
    }

    // 2. Upsert into public.users
    const userId = authUserId ?? existingUserId ?? crypto.randomUUID();
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .upsert(
        { id: userId, name, email, role, status: 'Pending' },
        { onConflict: 'email' }
      );

    if (dbError) {
      console.warn('[invite-user] DB upsert warning:', dbError.message);
    }

    return new Response(
      JSON.stringify({ success: true, userId, hashedToken, linkType }),
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
