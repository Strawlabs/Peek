// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-peek-team, x-peek-workflow, x-peek-customer',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const PROVIDER_PRICING: Record<string, Record<string, { input: number; output: number }>> = {
  openai: {
    'gpt-4o': { input: 5.00, output: 15.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    'o1-preview': { input: 15.00, output: 60.00 }
  },
  anthropic: {
    'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
    'claude-3-haiku': { input: 0.25, output: 1.25 },
    'claude-3-opus': { input: 15.00, output: 75.00 }
  },
  gemini: {
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'gemini-1.5-pro': { input: 1.25, output: 5.00 }
  },
  local: {
    'llama-3-local': { input: 0.00, output: 0.00 },
    'mistral-nemo-local': { input: 0.00, output: 0.00 }
  }
};

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const virtualKey = authHeader.replace('Bearer ', '').trim();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Authenticate Virtual API Key or fallback to public demo key
    let team = req.headers.get('X-Peek-Team') || 'Engineering';
    let orgId = 'org-default';

    if (virtualKey && virtualKey.startsWith('pk_live_')) {
      const prefix = virtualKey.substring(0, 11);
      const keyHash = await sha256Hex(virtualKey);
      const { data: keyRow } = await supabaseAdmin
        .from('api_keys')
        .select('*')
        .eq('key_prefix', prefix)
        .eq('key_hash', keyHash)
        .eq('active', true)
        .maybeSingle();

      if (keyRow) {
        team = keyRow.team;
        orgId = keyRow.org_id;
      } else {
        return new Response(
          JSON.stringify({ error: { message: 'Invalid or revoked Peek virtual API key.', type: 'peek_authentication_error', code: 401 } }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const workflow = req.headers.get('X-Peek-Workflow') || 'API Gateway Proxy';
    const customer = req.headers.get('X-Peek-Customer') || 'Enterprise App';

    // 2. Parse OpenAI Chat Completion request body
    const body = (await req.json().catch(() => ({}))) as any;
    const model = body.model || 'gpt-4o';
    const messages = body.messages || [{ role: 'user', content: 'Hello Peek Gateway' }];
    
    // Extract full prompt text
    const promptText = messages.map((m: any) => typeof m.content === 'string' ? m.content : JSON.stringify(m.content)).join('\n');

    // 3. Fetch active governance policies for this organization
    const { data: dbPolicies } = await supabaseAdmin
      .from('policies')
      .select('*')
      .eq('org_id', orgId)
      .eq('active', true);

    let status = 'Optimal';
    let blockRequest = false;
    let blockReason = '';

    // Check PII Protection Policy
    const piiPolicy = dbPolicies?.find((p: any) => p.id === 'pol-pii' || p.type === 'data_leakage');
    if (piiPolicy) {
      const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(promptText);
      const hasCard = /\b(?:\d[ -]*?){13,16}\b/.test(promptText);
      const hasSSN = /\b\d{3}-\d{2}-\d{4}\b/.test(promptText);

      if (hasEmail || hasCard || hasSSN) {
        const piiKind = hasEmail ? 'Email' : hasCard ? 'Credit Card' : 'SSN';
        if (piiPolicy.action === 'block') {
          blockRequest = true;
          status = 'PII Leak Blocked';
          blockReason = `Gateway Blocked: ${piiKind} pattern detected in prompt payload.`;
        } else {
          status = 'PII Leak Flagged';
        }
      }
    }

    // Check Model Restriction Policy
    const modelPolicy = dbPolicies?.find((p: any) => p.id === 'pol-models' || p.type === 'model_restriction');
    if (!blockRequest && modelPolicy) {
      if (model === 'gpt-4o' && team === 'Marketing') {
        if (modelPolicy.action === 'block') {
          blockRequest = true;
          status = 'Policy Blocked';
          blockReason = `Gateway Blocked: Model 'gpt-4o' is restricted for '${team}' team.`;
        } else {
          status = 'Policy Flagged';
        }
      }
    }

    // Handle Policy Rejection Immediately
    if (blockRequest) {
      const endTime = performance.now();
      const latency = parseFloat(((endTime - startTime) / 1000).toFixed(2));

      // Log blocked attempt to DB
      await supabaseAdmin.from('requests').insert({
        id: 'req-' + Math.random().toString(36).substring(2, 11),
        org_id: orgId,
        provider: model.includes('claude') ? 'anthropic' : model.includes('gemini') ? 'gemini' : 'openai',
        model,
        tokens_in: Math.floor(promptText.length / 4),
        tokens_out: 0,
        cost: 0,
        latency,
        timestamp: Date.now(),
        team,
        project: 'Project-Sentinel',
        department: 'Operations',
        workflow,
        customer,
        prompt: promptText,
        response: `ERROR 403: ${blockReason}`,
        status
      });

      return new Response(
        JSON.stringify({
          error: {
            message: blockReason,
            type: 'peek_policy_violation',
            code: 403
          }
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Upstream Forwarding to Real Provider if API secret configured
    let responseText = '';
    let tokensIn = Math.floor(promptText.length / 4) + 12;
    let tokensOut = 150;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (openaiKey && !model.includes('claude') && !model.includes('gemini')) {
      try {
        const upstreamRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const upstreamData = (await upstreamRes.json()) as any;

        if (upstreamRes.ok) {
          responseText = upstreamData.choices?.[0]?.message?.content || '';
          tokensIn = upstreamData.usage?.prompt_tokens || tokensIn;
          tokensOut = upstreamData.usage?.completion_tokens || tokensOut;
        } else {
          responseText = `Upstream Error: ${upstreamData.error?.message || 'OpenAI API Error'}`;
        }
      } catch (err: any) {
        responseText = `Gateway Error forwarding to upstream: ${err.message}`;
      }
    } else {
      // High-fidelity fallback response when no upstream key is stored
      responseText = `Peek Gateway response: Evaluated and routed request for workflow '${workflow}' to ${model}. Handled ${tokensIn} prompt tokens safely.`;
    }

    const endTime = performance.now();
    const latency = parseFloat(((endTime - startTime) / 1000).toFixed(2));

    // 5. Calculate Cost & Update Budget
    const provId = model.includes('claude') ? 'anthropic' : model.includes('gemini') ? 'gemini' : model.includes('local') ? 'local' : 'openai';
    const rates = PROVIDER_PRICING[provId]?.[model] || { input: 1.0, output: 3.0 };
    let cost = parseFloat((((tokensIn * rates.input) + (tokensOut * rates.output)) / 1_000_000).toFixed(6));
    if (provId !== 'local' && cost < 0.002) {
      cost = 0.0025;
    }

    // Update Team Budget Spend in Supabase
    const { data: budgetRow } = await supabaseAdmin
      .from('budgets')
      .select('spent')
      .eq('team', team)
      .eq('org_id', orgId)
      .maybeSingle();

    if (budgetRow) {
      const newSpent = Number(budgetRow.spent) + cost;
      await supabaseAdmin.from('budgets').update({ spent: newSpent }).eq('team', team).eq('org_id', orgId);
    }

    // Insert Telemetry Log to Supabase
    const reqId = 'req-' + Math.random().toString(36).substring(2, 11);
    await supabaseAdmin.from('requests').insert({
      id: reqId,
      org_id: orgId,
      provider: provId,
      model,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost,
      latency,
      timestamp: Date.now(),
      team,
      project: 'Project-Sentinel',
      department: team === 'Engineering' || team === 'Research' ? 'R&D' : 'Operations',
      workflow,
      customer,
      prompt: promptText,
      response: responseText,
      status
    });

    // 6. Return OpenAI Standard Payload Format
    return new Response(
      JSON.stringify({
        id: `chatcmpl-${reqId}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: responseText
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: tokensIn,
          completion_tokens: tokensOut,
          total_tokens: tokensIn + tokensOut
        },
        peek_telemetry: {
          cost,
          latency,
          status,
          team
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: { message: err.message || 'Internal Gateway Error', type: 'peek_gateway_error' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
