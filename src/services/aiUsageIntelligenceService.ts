import type { TelemetryRequest, User } from '../context/StateContext';

export type AIActivityType =
  | 'CODE_GENERATION'
  | 'CODE_COMPLETION'
  | 'DEBUGGING'
  | 'CODE_EXPLANATION'
  | 'REFACTORING'
  | 'TEST_GENERATION'
  | 'DOCUMENTATION'
  | 'CODE_REVIEW'
  | 'ARCHITECTURE'
  | 'GENERAL_ASSISTANCE'
  | 'UNKNOWN';

export interface DeveloperContext {
  developerId: string;
  developerName: string;
  developerEmail: string;
  team: string;
  orgId: string;
}

export interface DeveloperMetrics {
  developerIdentifier: string;
  team: string;
  orgId: string;
  totalRequests: number;
  totalTokens: number;
  activityCount: number;
  totalCost: number;
  activeDaysCount: number;
  mostUsedProvider: string;
  mostUsedModel: string;
}

export interface TeamMetrics {
  teamName: string;
  totalRequests: number;
  totalTokens: number;
  activityCount: number;
  activeDevelopersCount: number;
  totalTeamDevelopersCount: number;
  adoptionRate: number; // Percentage (0 - 100)
  totalCost: number;
  averageCostPerDeveloper: number;
}

export interface OrganizationMetrics {
  orgId: string;
  totalRequests: number;
  totalTokens: number;
  totalActivityCount: number;
  activeDevelopersCount: number;
  totalDevelopersCount: number;
  adoptionRate: number; // Percentage (0 - 100)
  totalCost: number;
  providerDistribution: Record<string, number>;
  modelDistribution: Record<string, number>;
}

export class AIUsageIntelligenceService {
  /**
   * PHASE 3 — Developer -> Team -> Organization Mapping
   * Resolves developer identity, email, assigned team, and organization ID.
   */
  static resolveDeveloperContext(
    developerIdentifier: string,
    usersList: User[],
    defaultTeam: string = 'Engineering',
    defaultOrgId: string = 'org-default'
  ): DeveloperContext {
    const cleanId = developerIdentifier.trim().toLowerCase();
    
    // Find in users table by email or name
    const foundUser = usersList.find(
      u => u.email.toLowerCase() === cleanId ||
           u.name.toLowerCase() === cleanId ||
           cleanId.includes(u.email.toLowerCase())
    );

    if (foundUser) {
      return {
        developerId: foundUser.id,
        developerName: foundUser.name,
        developerEmail: foundUser.email,
        team: defaultTeam,
        orgId: foundUser.org_id || defaultOrgId
      };
    }

    // Extract email from "Name (email)" pattern if present
    const emailMatch = developerIdentifier.match(/\(([^)]+)\)/);
    const email = emailMatch ? emailMatch[1] : developerIdentifier;
    const name = developerIdentifier.replace(/\([^)]+\)/, '').trim() || email;

    return {
      developerId: 'dev-' + Math.abs(this.hashCode(email)).toString(36),
      developerName: name,
      developerEmail: email,
      team: defaultTeam,
      orgId: defaultOrgId
    };
  }

  /**
   * PHASE 5 — AI Activity Classification
   * Classifies prompt text intent into standardized AIActivityType.
   * If unclassified, defaults to UNKNOWN.
   */
  static classifyActivityType(promptText?: string, explicitActivity?: string): AIActivityType {
    if (explicitActivity && explicitActivity !== 'UNKNOWN') {
      return explicitActivity as AIActivityType;
    }
    if (!promptText) return 'UNKNOWN';

    const p = promptText.toLowerCase();
    if (p.includes('refactor') || p.includes('rewrite') || p.includes('clean up')) return 'REFACTORING';
    if (p.includes('test') || p.includes('pytest') || p.includes('unit test') || p.includes('spec')) return 'TEST_GENERATION';
    if (p.includes('debug') || p.includes('fix bug') || p.includes('error') || p.includes('exception')) return 'DEBUGGING';
    if (p.includes('explain') || p.includes('how does') || p.includes('what does')) return 'CODE_EXPLANATION';
    if (p.includes('doc') || p.includes('readme') || p.includes('comment')) return 'DOCUMENTATION';
    if (p.includes('review') || p.includes('pr') || p.includes('code review')) return 'CODE_REVIEW';
    if (p.includes('arch') || p.includes('schema') || p.includes('design system')) return 'ARCHITECTURE';
    if (p.includes('complete') || p.includes('autocomplete')) return 'CODE_COMPLETION';
    if (p.includes('write') || p.includes('generate') || p.includes('create function') || p.includes('build')) return 'CODE_GENERATION';
    if (p.includes('help') || p.includes('assist')) return 'GENERAL_ASSISTANCE';

    return 'UNKNOWN';
  }

  /**
   * PHASE 7 & 8 — Developer Metrics Calculation
   */
  static calculateDeveloperMetrics(
    requests: TelemetryRequest[],
    developerIdentifier: string,
    timeRangeMs: number = Infinity
  ): DeveloperMetrics {
    const now = Date.now();
    const devRequests = requests.filter(
      r => r.customer.toLowerCase().includes(developerIdentifier.toLowerCase()) &&
           (timeRangeMs === Infinity || (now - r.timestamp) <= timeRangeMs)
    );

    const totalRequests = devRequests.length;
    const totalTokens = devRequests.reduce((sum, r) => sum + r.tokens_in + r.tokens_out, 0);
    const totalCost = devRequests.reduce((sum, r) => sum + (r.actual_cost ?? r.cost), 0);

    const daysSet = new Set<string>();
    const providerMap = new Map<string, number>();
    const modelMap = new Map<string, number>();

    devRequests.forEach(r => {
      const dateKey = new Date(r.timestamp).toISOString().split('T')[0];
      daysSet.add(dateKey);
      providerMap.set(r.provider, (providerMap.get(r.provider) || 0) + 1);
      modelMap.set(r.model, (modelMap.get(r.model) || 0) + 1);
    });

    let mostUsedProvider = 'gemini';
    let maxProvCount = 0;
    providerMap.forEach((cnt, p) => {
      if (cnt > maxProvCount) { maxProvCount = cnt; mostUsedProvider = p; }
    });

    let mostUsedModel = 'gemini-1.5-flash';
    let maxModelCount = 0;
    modelMap.forEach((cnt, m) => {
      if (cnt > maxModelCount) { maxModelCount = cnt; mostUsedModel = m; }
    });

    const team = devRequests[0]?.team || 'Engineering';

    return {
      developerIdentifier,
      team,
      orgId: 'org-default',
      totalRequests,
      totalTokens,
      activityCount: totalRequests,
      totalCost: parseFloat(totalCost.toFixed(6)),
      activeDaysCount: daysSet.size,
      mostUsedProvider,
      mostUsedModel
    };
  }

  /**
   * PHASE 7 & 8 — Team Metrics & AI Adoption Rate Calculation
   */
  static calculateTeamMetrics(
    requests: TelemetryRequest[],
    teamName: string,
    totalTeamDevelopersCount: number = 10,
    timeRangeMs: number = Infinity
  ): TeamMetrics {
    const now = Date.now();
    const teamRequests = requests.filter(
      r => r.team.toLowerCase() === teamName.toLowerCase() &&
           (timeRangeMs === Infinity || (now - r.timestamp) <= timeRangeMs)
    );

    const totalRequests = teamRequests.length;
    const totalTokens = teamRequests.reduce((sum, r) => sum + r.tokens_in + r.tokens_out, 0);
    const totalCost = teamRequests.reduce((sum, r) => sum + (r.actual_cost ?? r.cost), 0);

    // Active developers = unique developers with >0 recorded usage in time period
    const activeDevsSet = new Set<string>();
    teamRequests.forEach(r => activeDevsSet.add(r.customer));
    const activeDevelopersCount = activeDevsSet.size;

    const denominator = Math.max(totalTeamDevelopersCount, activeDevelopersCount, 1);
    const adoptionRate = parseFloat(((activeDevelopersCount / denominator) * 100).toFixed(1));
    const averageCostPerDeveloper = activeDevelopersCount > 0 ? parseFloat((totalCost / activeDevelopersCount).toFixed(4)) : 0;

    return {
      teamName,
      totalRequests,
      totalTokens,
      activityCount: totalRequests,
      activeDevelopersCount,
      totalTeamDevelopersCount: denominator,
      adoptionRate,
      totalCost: parseFloat(totalCost.toFixed(6)),
      averageCostPerDeveloper
    };
  }

  /**
   * PHASE 7 & 8 — Organization Metrics Calculation & Provider Distribution
   */
  static calculateOrgMetrics(
    requests: TelemetryRequest[],
    totalOrgDevelopersCount: number = 25,
    timeRangeMs: number = Infinity
  ): OrganizationMetrics {
    const now = Date.now();
    const orgRequests = requests.filter(
      r => timeRangeMs === Infinity || (now - r.timestamp) <= timeRangeMs
    );

    const totalRequests = orgRequests.length;
    const totalTokens = orgRequests.reduce((sum, r) => sum + r.tokens_in + r.tokens_out, 0);
    const totalCost = orgRequests.reduce((sum, r) => sum + (r.actual_cost ?? r.cost), 0);

    const activeDevsSet = new Set<string>();
    const providerDist: Record<string, number> = {};
    const modelDist: Record<string, number> = {};

    orgRequests.forEach(r => {
      activeDevsSet.add(r.customer);
      providerDist[r.provider] = (providerDist[r.provider] || 0) + 1;
      modelDist[r.model] = (modelDist[r.model] || 0) + 1;
    });

    const activeDevelopersCount = activeDevsSet.size;
    const denominator = Math.max(totalOrgDevelopersCount, activeDevelopersCount, 1);
    const adoptionRate = parseFloat(((activeDevelopersCount / denominator) * 100).toFixed(1));

    return {
      orgId: 'org-default',
      totalRequests,
      totalTokens,
      totalActivityCount: totalRequests,
      activeDevelopersCount,
      totalDevelopersCount: denominator,
      adoptionRate,
      totalCost: parseFloat(totalCost.toFixed(6)),
      providerDistribution: providerDist,
      modelDistribution: modelDist
    };
  }

  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}
