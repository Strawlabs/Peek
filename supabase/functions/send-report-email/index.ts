// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface ReportEmailRequest {
  to: string;
  reportTitle: string;
  reportId: string;
  format: 'PDF' | 'CSV';
  frequency: string;
  timezone: string;
  scheduledTime: string;
  // Summary metrics to embed in the email body
  metrics: {
    totalCost: number;
    totalRequests: number;
    violations: number;
    activePolicies: number;
    avgLatency: number;
  };
  siteUrl?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as ReportEmailRequest;
    const {
      to, reportTitle, reportId, format, frequency,
      timezone, scheduledTime, metrics, siteUrl,
    } = body;

    if (!to || !reportTitle) {
      return new Response(
        JSON.stringify({ error: 'to and reportTitle are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY secret is not configured in Supabase Edge Function secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const appUrl = siteUrl || Deno.env.get('SITE_URL') || 'http://localhost:5173';
    const generatedAt = new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' });

    // ─── Icon map per report type ────────────────────────────────────────────
    const iconMap: Record<string, string> = {
      exec:     '📊',
      spend:    '💳',
      gov:      '🛡️',
      forecast: '📈',
    };
    const icon = iconMap[reportId] || '📄';

    // ─── Metric color helper ─────────────────────────────────────────────────
    const violationColor = metrics.violations > 10 ? '#ef4444' : metrics.violations > 0 ? '#f59e0b' : '#10b981';

    // ─── HTML Email Template ─────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${reportTitle} — Peek AI</title>
</head>
<body style="margin:0;padding:0;background:#0f0f12;font-family:'Inter',system-ui,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f12;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e1b4b 0%,#1a1535 100%);border-radius:16px 16px 0 0;padding:32px 36px 28px;border:1px solid #2d2a5e;border-bottom:none;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:22px;font-weight:900;letter-spacing:-0.05em;color:#a78bfa;">PEEK.AI</div>
                    <div style="font-size:11px;color:#6366f1;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-top:2px;">AI Governance Platform</div>
                  </td>
                  <td align="right">
                    <div style="background:#6366f1;color:#fff;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">${format} Report</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title Block -->
          <tr>
            <td style="background:#16162a;padding:28px 36px 24px;border-left:1px solid #2d2a5e;border-right:1px solid #2d2a5e;">
              <div style="font-size:28px;margin-bottom:6px;">${icon}</div>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f1f5f9;line-height:1.3;">${reportTitle}</h1>
              <p style="margin:0;font-size:13px;color:#94a3b8;">
                Scheduled ${frequency} delivery &bull; ${scheduledTime} (${timezone})
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#64748b;">Generated: ${generatedAt} UTC</p>
            </td>
          </tr>

          <!-- Metrics Grid -->
          <tr>
            <td style="background:#16162a;padding:0 36px 28px;border-left:1px solid #2d2a5e;border-right:1px solid #2d2a5e;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6366f1;margin-bottom:14px;">30-Day Snapshot</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="25%" style="padding-right:8px;">
                    <div style="background:#1e1b4b;border:1px solid #2d2a5e;border-radius:10px;padding:14px 12px;text-align:center;">
                      <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:0.08em;">Total Spend</div>
                      <div style="font-size:18px;font-weight:800;color:#a78bfa;margin-top:6px;">$${metrics.totalCost.toFixed(2)}</div>
                    </div>
                  </td>
                  <td width="25%" style="padding-right:8px;">
                    <div style="background:#1e1b4b;border:1px solid #2d2a5e;border-radius:10px;padding:14px 12px;text-align:center;">
                      <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:0.08em;">Requests</div>
                      <div style="font-size:18px;font-weight:800;color:#e2e8f0;margin-top:6px;">${metrics.totalRequests.toLocaleString()}</div>
                    </div>
                  </td>
                  <td width="25%" style="padding-right:8px;">
                    <div style="background:#1e1b4b;border:1px solid #2d2a5e;border-radius:10px;padding:14px 12px;text-align:center;">
                      <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:0.08em;">Violations</div>
                      <div style="font-size:18px;font-weight:800;color:${violationColor};margin-top:6px;">${metrics.violations}</div>
                    </div>
                  </td>
                  <td width="25%">
                    <div style="background:#1e1b4b;border:1px solid #2d2a5e;border-radius:10px;padding:14px 12px;text-align:center;">
                      <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:0.08em;">Avg Latency</div>
                      <div style="font-size:18px;font-weight:800;color:#10b981;margin-top:6px;">${metrics.avgLatency.toFixed(2)}s</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Policy Status Row -->
          <tr>
            <td style="background:#16162a;padding:0 36px 28px;border-left:1px solid #2d2a5e;border-right:1px solid #2d2a5e;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;padding:14px 16px;">
                <tr>
                  <td>
                    <span style="font-size:11px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:0.08em;">🛡️ Active Governance Policies</span>
                  </td>
                  <td align="right">
                    <span style="font-size:20px;font-weight:800;color:#f1f5f9;">${metrics.activePolicies}</span>
                    <span style="font-size:11px;color:#64748b;margin-left:4px;">rules enforced</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="background:#16162a;padding:0 36px 32px;border-left:1px solid #2d2a5e;border-right:1px solid #2d2a5e;text-align:center;">
              <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;letter-spacing:0.02em;">
                Open Full Dashboard →
              </a>
              <p style="margin:14px 0 0;font-size:11px;color:#64748b;">
                View detailed analytics, download ${format} files, and manage governance policies.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0d0d16;border:1px solid #2d2a5e;border-top:none;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#475569;line-height:1.6;">
                This is an automated delivery from <strong style="color:#6366f1;">Peek AI Governance Platform</strong>.<br/>
                Scheduled: <strong>${frequency}</strong> at <strong>${scheduledTime}</strong> (<strong>${timezone}</strong>).<br/>
                To unsubscribe or modify delivery settings, visit the <a href="${appUrl}" style="color:#6366f1;text-decoration:none;">Reports Center</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // ─── Send via Resend ─────────────────────────────────────────────────────
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Peek AI Reports <onboarding@resend.dev>',
        to: [to],
        subject: `[Peek] ${icon} ${reportTitle} — ${frequency} Delivery`,
        html,
      }),
    });

    const resendData = await resendRes.json() as { id?: string; name?: string; message?: string };

    if (!resendRes.ok) {
      console.error('[send-report-email] Resend error:', resendData);
      return new Response(
        JSON.stringify({ error: resendData.message || resendData.name || 'Resend API error', details: resendData }),
        { status: resendRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-report-email] ✅ Sent to ${to} — Resend ID: ${resendData.id}`);
    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[send-report-email] Unexpected error:', msg);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
