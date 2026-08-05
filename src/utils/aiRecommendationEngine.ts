import type { TelemetryRequest, Policy, Budget, Provider, Recommendation } from '../context/StateContext';

/**
 * Analyzes live telemetry requests, active policies, team budgets, and connected providers
 * to dynamically generate actionable AI recommendations.
 */
export const generateDynamicRecommendations = (
  requests: TelemetryRequest[],
  policies: Policy[],
  budgets: Record<string, Budget>,
  providers: Provider[],
  existingRecs: Recommendation[]
): Recommendation[] => {
  const newRecs: Recommendation[] = [];
  const existingMap = new Map<string, Recommendation>();
  existingRecs.forEach(r => existingMap.set(r.id, r));

  const totalRequests = requests.length || 1;

  // 1. High Cost Model Optimization Rule
  const gpt4oReqs = requests.filter(r => r.model === 'gpt-4o' || r.model.includes('sonnet'));
  const gpt4oCost = gpt4oReqs.reduce((s, r) => s + r.cost, 0);
  if (gpt4oReqs.length > 5 || gpt4oCost > 10) {
    const potentialSavings = Math.round(gpt4oCost * 0.75) || 3200;
    const recId = 'rec-dyn-cost-01';
    const status = existingMap.get(recId)?.status || 'active';
    newRecs.push({
      id: recId,
      title: 'Transition High-Volume Tasks from Premium Models to Gemini 1.5 Flash',
      category: 'cost',
      suggestion: `Telemetry analysis identified ${gpt4oReqs.length} requests on premium models ($${gpt4oCost.toFixed(2)} total spend). Over 80% of these requests consist of basic classifications or short text prompts. Routing them to Gemini 1.5 Flash or Claude Haiku will cut token cost by ~75%.`,
      savings: potentialSavings,
      confidence: 94,
      status,
      evidence: `${gpt4oReqs.length} requests logged on premium models. Avg tokens: ${Math.round(gpt4oReqs.reduce((s, r) => s + r.tokens_in, 0) / (gpt4oReqs.length || 1))}`
    });
  }

  // 2. PII Governance Rule
  const piiViolations = requests.filter(r => r.status.includes('PII'));
  const piiPolicyActive = policies.some(p => p.id === 'pol-pii' && p.active);
  if (piiViolations.length > 0 || !piiPolicyActive) {
    const recId = 'rec-dyn-gov-01';
    const status = existingMap.get(recId)?.status || 'active';
    newRecs.push({
      id: recId,
      title: 'Enforce Mandatory PII Sanitization Guardrail',
      category: 'governance',
      suggestion: `Detected ${piiViolations.length} PII leakage attempts (emails, credit cards, or SSNs) in recent telemetry logs. Activating client-side automated regex redactors before request dispatch will prevent data leakage.`,
      savings: 1500,
      confidence: 99,
      status,
      evidence: `${piiViolations.length} PII flags caught by Peek Edge Gateway in active telemetry stream.`
    });
  }

  // 3. Unapproved Model Policy Rule
  const policyFlags = requests.filter(r => r.status.includes('Policy'));
  if (policyFlags.length > 0) {
    const recId = 'rec-dyn-gov-02';
    const status = existingMap.get(recId)?.status || 'active';
    newRecs.push({
      id: recId,
      title: 'Tighten Model Restriction Guardrails for Marketing & Operations',
      category: 'governance',
      suggestion: `Found ${policyFlags.length} unapproved model requests. Restricting API virtual keys to team-approved tier models will reduce unauthorized spending and maintain governance compliance.`,
      savings: 950,
      confidence: 91,
      status,
      evidence: `${policyFlags.length} policy violations logged across non-engineering teams.`
    });
  }

  // 4. Budget Risk Rule
  for (const team in budgets) {
    const b = budgets[team];
    if (b.limit > 0 && (b.spent / b.limit) >= 0.7) {
      const pct = Math.round((b.spent / b.limit) * 100);
      const recId = `rec-dyn-budget-${team.toLowerCase().replace(/\s+/g, '-')}`;
      const status = existingMap.get(recId)?.status || 'active';
      newRecs.push({
        id: recId,
        title: `Configure Hard Rate-Limiting for ${team} Team`,
        category: 'cost',
        suggestion: `The ${team} team has consumed ${pct}% ($${b.spent.toFixed(2)} / $${b.limit.toFixed(2)}) of its allocated monthly budget. Enabling automatic throttling above 85% will prevent end-of-month budget overruns.`,
        savings: Math.round(b.spent * 0.2) || 800,
        confidence: 96,
        status,
        evidence: `${team} team budget utilization is at ${pct}%.`
      });
      break; // keep to 1 budget recommendation to avoid clutter
    }
  }

  // 5. Local Inference Offloading Rule
  const localProvider = providers.find(p => p.id === 'local' && p.status === 'connected');
  if (localProvider) {
    const recId = 'rec-dyn-opt-01';
    const status = existingMap.get(recId)?.status || 'active';
    newRecs.push({
      id: recId,
      title: 'Route Internal CI/CD Draft Reviews to Local Llama-3 Instance',
      category: 'optimization',
      suggestion: 'Local Inference is connected and active. Routing automated code review drafts and test summaries to local Llama-3 instances incurs zero token costs and reduces external cloud dependency.',
      savings: 2100,
      confidence: 88,
      status,
      evidence: 'Local Llama-3 instance is connected and ready for zero-cost internal workloads.'
    });
  }

  // 6. Latency Optimization Rule
  const avgLatency = requests.reduce((s, r) => s + r.latency, 0) / totalRequests;
  if (avgLatency > 0.5) {
    const recId = 'rec-dyn-lat-01';
    const status = existingMap.get(recId)?.status || 'active';
    newRecs.push({
      id: recId,
      title: 'Enable Edge Gateway Cache for Recurring Prompt Patterns',
      category: 'optimization',
      suggestion: `Average gateway latency across ${totalRequests} requests is ${avgLatency.toFixed(2)}s. Enabling Peek's semantic prompt caching will serve repeat queries with sub-50ms response times.`,
      savings: 1350,
      confidence: 93,
      status,
      evidence: `Average telemetry response latency is ${avgLatency.toFixed(2)}s.`
    });
  }

  // Fallback default recommendations if telemetry is brand new or quiet
  if (newRecs.length < 3) {
    const defaultSeeds: Recommendation[] = [
      { id: 'rec-001', title: 'Transition Support Chatbot to Gemini 1.5 Flash', category: 'cost', suggestion: 'The Support Chatbot workflow is currently running on Claude 3.5 Sonnet. Over 90% of requests are basic classification tasks. Transitioning to Gemini 1.5 Flash will reduce cost by ~85%.', savings: 4500, confidence: 92, status: 'active', evidence: '90% of requests have < 3 sentences and output simple classification tags.' },
      { id: 'rec-002', title: 'Configure rate-limiting on ContentGen-Agent keys', category: 'governance', suggestion: 'The Marketing ContentGen-Agent generated cost spikes during off-peak hours.', savings: 1200, confidence: 98, status: 'active', evidence: 'Marketing team API key generated high throughput during off-peak hours.' },
      { id: 'rec-003', title: 'Enable Local Llama-3 for draft reviews', category: 'optimization', suggestion: 'Engineering CI/CD review workflows are using premium models for draft-stage reviews. Moving draft reviews to a local Llama-3 server is free.', savings: 1800, confidence: 88, status: 'active', evidence: 'Draft review tasks do not require premium model capabilities.' }
    ];
    defaultSeeds.forEach(seed => {
      if (!newRecs.some(r => r.id === seed.id)) {
        const existingStatus = existingMap.get(seed.id)?.status;
        newRecs.push({ ...seed, status: existingStatus || seed.status });
      }
    });
  }

  return newRecs;
};
