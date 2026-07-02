import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/StateContext';

interface Assessment {
  id: string;
  workflowName: string;
  score: number;
  resultType: 'Rule-Based' | 'Hybrid' | 'AI Recommended' | 'AI Essential';
  timestamp: number;
  potentialSavings: number;
  currentCost: number;
}

export const TokenBenefitScreen: React.FC = () => {
  const { outcomes, requests } = useAppState();
  const [activeTab, setActiveTab] = useState<'matrix' | 'advisor'>('matrix');

  // Wizard State
  const [wizardStep, setWizardStep] = useState<number>(0); // 0 = intro/history, 1-4 = steps
  const [workflowName, setWorkflowName] = useState<string>('');
  const [inputStructure, setInputStructure] = useState<number>(0); // 1, 2, 3
  const [logicComplexity, setLogicComplexity] = useState<number>(0); // 1, 2, 3
  const [errorTolerance, setErrorTolerance] = useState<number>(0); // 1, 2, 3
  const [taskType, setTaskType] = useState<number>(0); // 1, 2, 3
  const [currentCost, setCurrentCost] = useState<string>('500');

  // Saved Assessments
  const [assessments, setAssessments] = useState<Assessment[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('peek_necessity_assessments');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [
      {
        id: 'ast-1',
        workflowName: 'Campaign Gen',
        score: 6,
        resultType: 'Rule-Based',
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
        currentCost: 350,
        potentialSavings: 332.50
      },
      {
        id: 'ast-2',
        workflowName: 'CI/CD Review',
        score: 8,
        resultType: 'Hybrid',
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
        currentCost: 1200,
        potentialSavings: 840
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('peek_necessity_assessments', JSON.stringify(assessments));
  }, [assessments]);

  const totalVolume = outcomes.reduce((sum, o) => sum + o.volume, 0);
  const avgCostPerOutcome =
    outcomes.length > 0
      ? outcomes.reduce((sum, o) => sum + o.costPerOutcome, 0) / outcomes.length
      : 0;

  const roiColor = (score: string) => {
    if (score === 'High') return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/30';
    if (score === 'Medium') return 'text-amber-400 bg-amber-950/40 border-amber-800/30';
    return 'text-rose-400 bg-rose-950/40 border-rose-800/30';
  };

  const handleStartAssessment = (prefilledWorkflow?: string) => {
    setWorkflowName(prefilledWorkflow || '');
    setWizardStep(1);
    setInputStructure(0);
    setLogicComplexity(0);
    setErrorTolerance(0);
    setTaskType(0);
    setCurrentCost('500');
  };

  const calculateResult = () => {
    const score = inputStructure + logicComplexity + errorTolerance + taskType;
    let resultType: Assessment['resultType'] = 'AI Essential';
    let potentialSavings = 0;
    const costNum = parseFloat(currentCost) || 0;

    if (score <= 6) {
      resultType = 'Rule-Based';
      potentialSavings = costNum * 0.95;
    } else if (score <= 8) {
      resultType = 'Hybrid';
      potentialSavings = costNum * 0.70;
    } else if (score <= 10) {
      resultType = 'AI Recommended';
      potentialSavings = costNum * 0.40;
    } else {
      resultType = 'AI Essential';
      potentialSavings = costNum * 0.15;
    }

    return { score, resultType, potentialSavings, currentCost: costNum };
  };

  const handleFinishAssessment = () => {
    const { score, resultType, potentialSavings, currentCost: costNum } = calculateResult();
    const newAssessment: Assessment = {
      id: 'ast-' + Math.random().toString(36).substring(2, 9),
      workflowName: workflowName || 'Unnamed Workflow',
      score,
      resultType,
      timestamp: Date.now(),
      currentCost: costNum,
      potentialSavings
    };
    setAssessments(prev => [newAssessment, ...prev]);
    setWizardStep(5);
  };

  const handleDeleteAssessment = (id: string) => {
    setAssessments(prev => prev.filter(a => a.id !== id));
  };

  // Get result for step 5 display
  const result = calculateResult();

  return (
    <div className="space-y-6">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
            <span>Analytics</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Token Benefit Analysis™</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Token Benefit Analysis™</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Measure AI ROI by workflow — cost per business outcome, necessity scoring, and volume attribution.
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex bg-surface-container-high p-1 rounded-xl border border-outline-variant/30 self-stretch md:self-auto">
          <button
            onClick={() => { setActiveTab('matrix'); setWizardStep(0); }}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-label-md text-label-md transition-all ${
              activeTab === 'matrix' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">table_chart</span>
            ROI Matrix
          </button>
          <button
            onClick={() => setActiveTab('advisor')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-label-md text-label-md transition-all ${
              activeTab === 'advisor' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">psychology</span>
            Necessity Advisor
          </button>
        </div>
      </header>

      {activeTab === 'matrix' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-xl p-6">
              <span className="text-[10px] font-bold text-outline uppercase">Total Outcomes Processed</span>
              <p className="text-headline-lg font-bold text-on-surface mt-1">{totalVolume.toLocaleString()}</p>
            </div>
            <div className="glass-card rounded-xl p-6">
              <span className="text-[10px] font-bold text-outline uppercase">Avg Cost / Outcome</span>
              <p className="text-headline-lg font-bold text-primary mt-1">${avgCostPerOutcome.toFixed(2)}</p>
            </div>
            <div className="glass-card rounded-xl p-6">
              <span className="text-[10px] font-bold text-outline uppercase">Telemetry Requests</span>
              <p className="text-headline-lg font-bold text-on-surface mt-1">{requests.length.toLocaleString()}</p>
            </div>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-container flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Workflow Outcome Matrix</h3>
                <p className="text-xs text-on-surface-variant mt-1">Attributed necessity and ROI per active system pipeline.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md">
                  <tr>
                    <th className="px-6 py-4 font-medium border-b border-outline-variant">Workflow</th>
                    <th className="px-6 py-4 font-medium border-b border-outline-variant">Department</th>
                    <th className="px-6 py-4 font-medium border-b border-outline-variant">Metric</th>
                    <th className="px-6 py-4 font-medium border-b border-outline-variant text-right">Volume</th>
                    <th className="px-6 py-4 font-medium border-b border-outline-variant text-right">Cost/Outcome</th>
                    <th className="px-6 py-4 font-medium border-b border-outline-variant">ROI Score</th>
                    <th className="px-6 py-4 font-medium border-b border-outline-variant">AI Necessity</th>
                    <th className="px-6 py-4 font-medium border-b border-outline-variant text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-body-sm text-on-surface divide-y divide-outline-variant/30">
                  {outcomes.map((o) => (
                    <tr key={o.id} className="hover:bg-surface-variant/20 transition-all">
                      <td className="px-6 py-4 font-bold">{o.workflow}</td>
                      <td className="px-6 py-4">{o.department}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{o.metricName}</td>
                      <td className="px-6 py-4 text-right font-mono">{o.volume.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-mono text-primary">${o.costPerOutcome.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${roiColor(o.roiScore)}`}>
                          {o.roiScore}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant text-xs font-semibold">{o.necessity}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setActiveTab('advisor');
                            handleStartAssessment(o.workflow);
                          }}
                          className="flex items-center gap-1 mx-auto bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-3 py-1.5 rounded-lg text-xs font-label-md transition-all"
                        >
                          <span className="material-symbols-outlined text-[14px]">analytics</span>
                          Analyze
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Intro Screen / Past Assessments */}
          {wizardStep === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-card rounded-xl p-8 bg-gradient-to-br from-surface-container to-surface-container-low border border-outline-variant/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary text-4xl bg-primary/10 p-3 rounded-2xl">
                      psychology
                    </span>
                    <div className="space-y-2">
                      <h3 className="font-headline-md text-headline-md text-on-surface">AI Necessity Assessment Wizard</h3>
                      <p className="text-body-md text-on-surface-variant leading-relaxed">
                        LLMs are powerful but frequently overkill. Many classification, routing, and structuring tasks can be handled at <b>100x lower cost and 10x faster speed</b> using deterministic heuristics, rule engines, or lightweight edge models.
                      </p>
                      <p className="text-body-sm text-outline">
                        Evaluate any system workflow. We will compute a necessity index score, analyze error tolerances, estimate cost savings, and generate alternative code blueprints.
                      </p>
                      <div className="pt-4">
                        <button
                          onClick={() => handleStartAssessment()}
                          className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md text-label-md hover:opacity-90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]"
                        >
                          <span className="material-symbols-outlined">rocket_launch</span>
                          Start New Assessment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* History list */}
                <div className="glass-card rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-outline-variant bg-surface-container">
                    <h4 className="font-headline-sm text-headline-sm text-on-surface">Recent Assessments</h4>
                  </div>
                  {assessments.length === 0 ? (
                    <div className="p-8 text-center text-on-surface-variant text-body-sm">
                      No assessments run yet. Use the button above to begin.
                    </div>
                  ) : (
                    <div className="divide-y divide-outline-variant/30">
                      {assessments.map((a) => (
                        <div key={a.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-surface-variant/10 transition-colors">
                          <div className="space-y-1">
                            <h5 className="font-bold text-on-surface text-body-md">{a.workflowName}</h5>
                            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                              <span>Score: {a.score}/12</span>
                              <span>•</span>
                              <span>{new Date(a.timestamp).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between">
                            <div className="text-right">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                                a.resultType === 'Rule-Based'
                                  ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/30'
                                  : a.resultType === 'Hybrid'
                                  ? 'text-amber-400 bg-amber-950/40 border-amber-800/30'
                                  : a.resultType === 'AI Recommended'
                                  ? 'text-primary bg-primary/10 border-primary/20'
                                  : 'text-rose-400 bg-rose-950/40 border-rose-800/30'
                              }`}>
                                {a.resultType}
                              </span>
                              <p className="text-xs text-emerald-400 font-mono mt-1 font-semibold">Save ${a.potentialSavings.toFixed(0)}/mo</p>
                            </div>
                            <button
                              onClick={() => handleDeleteAssessment(a.id)}
                              className="text-on-surface-variant hover:text-rose-400 p-2 rounded-lg hover:bg-surface-variant/30 transition-all"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Guide */}
              <div className="space-y-6">
                <div className="glass-card rounded-xl p-6 space-y-4">
                  <h4 className="font-bold text-on-surface text-body-lg">How Scores Work</h4>
                  <div className="space-y-3 text-body-sm text-on-surface-variant">
                    <div className="flex gap-2">
                      <span className="text-emerald-400 font-bold">4 - 6</span>
                      <p><b>Rule-Based:</b> High savings. Replace LLM completely with structured code/heuristics.</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-amber-400 font-bold">7 - 8</span>
                      <p><b>Hybrid:</b> Filter logic with fast heuristics first, falling back to LLM when needed.</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-primary font-bold">9 - 10</span>
                      <p><b>AI Recommended:</b> Keep LLMs but shift to low-cost edge models (Gemini Flash).</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-rose-400 font-bold">11 - 12</span>
                      <p><b>AI Essential:</b> High reasoning tasks. Keep premium LLMs but optimize prompt cache.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Workflow details */}
          {wizardStep === 1 && (
            <div className="max-w-xl mx-auto glass-card rounded-xl p-8 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase">Step 1 of 4: Workflow Details</span>
                <span className="text-xs text-outline">1/4</span>
              </div>
              <div className="space-y-4">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Target Workflow</h3>
                <p className="text-body-sm text-on-surface-variant">Identify the pipeline we are auditing.</p>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase block">Workflow Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Support Ticket Classifier, Content Auto-Review"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary font-body-md"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase block">Current Monthly Cost ($)</label>
                  <input
                    type="number"
                    value={currentCost}
                    onChange={(e) => setCurrentCost(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-outline-variant/30">
                <button
                  onClick={() => setWizardStep(0)}
                  className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-label-md hover:bg-surface-variant transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setWizardStep(2)}
                  disabled={!workflowName.trim()}
                  className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-label-md hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Input Structure */}
          {wizardStep === 2 && (
            <div className="max-w-2xl mx-auto glass-card rounded-xl p-8 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase">Step 2 of 4: Input Structure</span>
                <span className="text-xs text-outline">2/4</span>
              </div>
              <div className="space-y-4">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">What format is the input data?</h3>
                <p className="text-body-sm text-on-surface-variant">Select the character of data flowing into the LLM.</p>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { val: 1, title: 'Highly Structured', desc: 'JSON objects, CSV, relational database rows, or rigid forms with fixed fields.' },
                    { val: 2, title: 'Semi-Structured / Predictable', desc: 'Short queries, product titles with standard components, or reports containing varying comments but fixed metrics.' },
                    { val: 3, title: 'Completely Unstructured', desc: 'Conversational chat logs, audio transcriptions, long-form creative documents, or variable-length user requests.' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setInputStructure(opt.val)}
                      className={`text-left p-5 rounded-xl border transition-all ${
                        inputStructure === opt.val
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                          : 'border-outline-variant hover:border-outline hover:bg-surface-variant/15'
                      }`}
                    >
                      <h4 className="font-bold text-body-lg text-on-surface flex items-center justify-between">
                        {opt.title}
                        {inputStructure === opt.val && (
                          <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                        )}
                      </h4>
                      <p className="text-body-sm text-on-surface-variant mt-1 leading-relaxed">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-outline-variant/30">
                <button
                  onClick={() => setWizardStep(1)}
                  className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-label-md hover:bg-surface-variant transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setWizardStep(3)}
                  disabled={!inputStructure}
                  className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-label-md hover:opacity-90 transition-all disabled:opacity-50"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Logic Complexity */}
          {wizardStep === 3 && (
            <div className="max-w-2xl mx-auto glass-card rounded-xl p-8 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase">Step 3 of 4: Processing Logic</span>
                <span className="text-xs text-outline">3/4</span>
              </div>
              <div className="space-y-4">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Can processing be defined by rules?</h3>
                <p className="text-body-sm text-on-surface-variant">Assess if the task requires true cognitive interpretation.</p>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { val: 1, title: 'Strict Heuristics / Formulas', desc: 'Can be written in code using regular expressions, string parsing, key-value mappings, math, or basic switch cases.' },
                    { val: 2, title: 'Fuzzy Match / Synonym Mappings', desc: 'Requires matching items using dictionaries, taxonomy trees, keyword indexes (Lucene/Elasticsearch), or fuzzy string distance.' },
                    { val: 3, title: 'Cognitive Reasoning / Deep Interpretation', desc: 'Requires parsing complex tone, summarizing arguments, multi-step logical deduction, or synthesizing new creative text.' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setLogicComplexity(opt.val)}
                      className={`text-left p-5 rounded-xl border transition-all ${
                        logicComplexity === opt.val
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                          : 'border-outline-variant hover:border-outline hover:bg-surface-variant/15'
                      }`}
                    >
                      <h4 className="font-bold text-body-lg text-on-surface flex items-center justify-between">
                        {opt.title}
                        {logicComplexity === opt.val && (
                          <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                        )}
                      </h4>
                      <p className="text-body-sm text-on-surface-variant mt-1 leading-relaxed">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-outline-variant/30">
                <button
                  onClick={() => setWizardStep(2)}
                  className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-label-md hover:bg-surface-variant transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setWizardStep(4)}
                  disabled={!logicComplexity}
                  className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-label-md hover:opacity-90 transition-all disabled:opacity-50"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Tolerance & Task Operations */}
          {wizardStep === 4 && (
            <div className="max-w-2xl mx-auto glass-card rounded-xl p-8 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase">Step 4 of 4: Tolerance & Operations</span>
                <span className="text-xs text-outline">4/4</span>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Error Tolerance & Operations</h3>
                  <p className="text-body-sm text-on-surface-variant">Specify accuracy requirements and the nature of the operation.</p>
                </div>

                {/* Sub-question A: Error Tolerance */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-outline uppercase block">What is the tolerance for errors/hallucinations?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { val: 1, title: 'Zero Tolerance', desc: 'Errors cause immediate failure, data loss, or compliance fines.' },
                      { val: 2, title: 'Guarded / Low', desc: 'Must be highly accurate, but validation filters or human verification is present.' },
                      { val: 3, title: 'High Tolerance', desc: 'Creative, drafts, or general brainstorming where mistakes matter less.' }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => setErrorTolerance(opt.val)}
                        className={`text-left p-4 rounded-lg border flex flex-col justify-between transition-all ${
                          errorTolerance === opt.val
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-outline-variant hover:bg-surface-variant/10'
                        }`}
                      >
                        <span className="font-bold text-xs text-on-surface block mb-1">{opt.title}</span>
                        <span className="text-[11px] text-on-surface-variant leading-normal">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-question B: Task Type */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-outline uppercase block">Which description fits the processing operation?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { val: 1, title: 'Utility/Data Conversion', desc: 'Format conversion, string splitting, math calculations, or static lookups.' },
                      { val: 2, title: 'Classification/Parsing', desc: 'Sentiment tag, email routing, summaries, or structured field extraction.' },
                      { val: 3, title: 'Generative/Reasoning', desc: 'Complex reasoning, multi-step agents, raw code generation, or copywriting.' }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => setTaskType(opt.val)}
                        className={`text-left p-4 rounded-lg border flex flex-col justify-between transition-all ${
                          taskType === opt.val
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-outline-variant hover:bg-surface-variant/10'
                        }`}
                      >
                        <span className="font-bold text-xs text-on-surface block mb-1">{opt.title}</span>
                        <span className="text-[11px] text-on-surface-variant leading-normal">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-outline-variant/30">
                <button
                  onClick={() => setWizardStep(3)}
                  className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-label-md hover:bg-surface-variant transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleFinishAssessment}
                  disabled={!errorTolerance || !taskType}
                  className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-label-md hover:opacity-90 transition-all shadow-md shadow-primary/10 disabled:opacity-50"
                >
                  Get Recommendation
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Recommendation display */}
          {wizardStep === 5 && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Top Summary Banner */}
              <div className="glass-card rounded-xl p-8 bg-gradient-to-br from-surface-container to-surface-container-low border border-outline-variant/30 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2 max-w-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary uppercase">Assessment Result for {workflowName}</span>
                    <span className="text-xs text-outline">•</span>
                    <span className="text-xs text-outline">Score: {result.score}/12</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    Recommendation: <span className={
                      result.resultType === 'Rule-Based'
                        ? 'text-emerald-400'
                        : result.resultType === 'Hybrid'
                        ? 'text-amber-400'
                        : result.resultType === 'AI Recommended'
                        ? 'text-primary'
                        : 'text-rose-400'
                    }>{result.resultType}</span>
                  </h3>
                  <p className="text-body-sm text-on-surface-variant leading-relaxed">
                    {result.resultType === 'Rule-Based' && 'This workflow is a prime candidate for immediate replacement. Deterministic heuristics will run at virtually $0.00 cost, near-zero latency, and 100% reliability.'}
                    {result.resultType === 'Hybrid' && 'A multi-tier architecture is ideal. Execute fast rule-based pre-checks and only invoke an LLM for complex exceptions, reducing spend by up to 75%.'}
                    {result.resultType === 'AI Recommended' && 'LLM logic is needed, but premium models are unnecessarily expensive. Shift your traffic from GPT-4o to ultra-cheap edge models like Gemini 1.5 Flash.'}
                    {result.resultType === 'AI Essential' && 'Cognitive reasoning demands are high. Maintain premium LLMs but optimize execution with aggressive prompt caching, system instruction pruning, and batch processing.'}
                  </p>
                </div>

                <div className="glass-card rounded-xl px-6 py-4 bg-emerald-950/20 border border-emerald-800/30 text-right shrink-0 self-stretch md:self-auto flex md:flex-col justify-between items-center md:items-end">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Potential Savings</span>
                    <p className="text-headline-lg font-bold text-emerald-400 font-mono mt-0.5">${result.potentialSavings.toFixed(2)}/mo</p>
                  </div>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-1">Based on current cost of ${result.currentCost}/mo</p>
                </div>
              </div>

              {/* Blueprint & Architecture Diagram */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Blueprint flowchart */}
                <div className="lg:col-span-2 glass-card rounded-xl p-6 space-y-4">
                  <h4 className="font-bold text-on-surface text-body-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">architecture</span>
                    Proposed Alternative Blueprint
                  </h4>

                  {/* Flowchart container */}
                  <div className="bg-surface-container rounded-xl p-6 flex flex-col items-center justify-center gap-4 border border-outline-variant/30 min-h-[220px]">
                    {result.resultType === 'Rule-Based' && (
                      <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                        <div className="bg-surface-container-high border border-outline-variant px-4 py-3 rounded-lg text-center shrink-0 w-32 shadow-sm">
                          <p className="text-xs font-bold text-on-surface">Incoming Data</p>
                          <p className="text-[10px] text-on-surface-variant font-mono">Structured JSON</p>
                        </div>
                        <span className="material-symbols-outlined text-outline rotate-90 sm:rotate-0">arrow_forward</span>
                        <div className="bg-emerald-950/40 border border-emerald-800/50 px-4 py-3 rounded-lg text-center shrink-0 w-44 shadow-sm relative group hover:border-emerald-600 transition-all">
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-400 text-emerald-950 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase scale-90">Regex & Code</span>
                          <p className="text-xs font-bold text-emerald-400 mt-0.5">Rule Engine</p>
                          <p className="text-[10px] text-on-surface-variant">Deterministic parsing</p>
                        </div>
                        <span className="material-symbols-outlined text-outline rotate-90 sm:rotate-0">arrow_forward</span>
                        <div className="bg-surface-container-high border border-outline-variant px-4 py-3 rounded-lg text-center shrink-0 w-32 shadow-sm">
                          <p className="text-xs font-bold text-on-surface">Output</p>
                          <p className="text-[10px] text-on-surface-variant font-mono">100% Reliable</p>
                        </div>
                      </div>
                    )}

                    {result.resultType === 'Hybrid' && (
                      <div className="flex flex-col items-center gap-3 w-full">
                        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center w-full">
                          <div className="bg-surface-container-high border border-outline-variant px-3 py-2 rounded-lg text-center w-28">
                            <p className="text-xs font-bold">Raw Input</p>
                          </div>
                          <span className="material-symbols-outlined text-outline rotate-90 sm:rotate-0">arrow_forward</span>
                          <div className="bg-amber-950/40 border border-amber-800/50 px-4 py-3 rounded-lg text-center w-40 relative">
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-[8px] px-1 rounded font-bold uppercase">Pre-check</span>
                            <p className="text-xs font-bold text-amber-400">Heuristics Engine</p>
                          </div>
                        </div>

                        <div className="flex flex-row justify-between w-full max-w-[340px] px-8 text-xs text-on-surface-variant font-semibold">
                          <div className="flex flex-col items-center">
                            <span className="text-emerald-400">Yes (75%)</span>
                            <span className="material-symbols-outlined text-emerald-400">south</span>
                            <div className="bg-emerald-950/30 border border-emerald-800/30 px-3 py-1.5 rounded mt-1 text-[10px] text-center w-24">
                              Direct Output
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-rose-400">No (25%)</span>
                            <span className="material-symbols-outlined text-rose-400">south</span>
                            <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded mt-1 text-[10px] text-center w-24">
                              Edge Model fallback
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {result.resultType === 'AI Recommended' && (
                      <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                        <div className="bg-surface-container-high border border-outline-variant px-4 py-3 rounded-lg text-center shrink-0 w-32 shadow-sm">
                          <p className="text-xs font-bold text-on-surface">GPT-4o Traffic</p>
                          <p className="text-[10px] text-rose-400 font-mono">High cost ($15/M)</p>
                        </div>
                        <span className="material-symbols-outlined text-outline rotate-90 sm:rotate-0">arrow_forward</span>
                        <div className="bg-primary/20 border border-primary/40 px-4 py-3 rounded-lg text-center shrink-0 w-44 shadow-sm relative">
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[9px] px-1.5 py-0.5 rounded font-bold uppercase scale-90">Active Gateway</span>
                          <p className="text-xs font-bold text-primary mt-0.5">Gemini 1.5 Flash</p>
                          <p className="text-[10px] text-emerald-400 font-mono">Save ~85% / token</p>
                        </div>
                        <span className="material-symbols-outlined text-outline rotate-90 sm:rotate-0">arrow_forward</span>
                        <div className="bg-surface-container-high border border-outline-variant px-4 py-3 rounded-lg text-center shrink-0 w-32 shadow-sm">
                          <p className="text-xs font-bold text-on-surface">JSON Output</p>
                          <p className="text-[10px] text-on-surface-variant font-mono">Validated Schema</p>
                        </div>
                      </div>
                    )}

                    {result.resultType === 'AI Essential' && (
                      <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                        <div className="bg-surface-container-high border border-outline-variant px-3 py-2 rounded-lg text-center shrink-0 w-28 shadow-sm">
                          <p className="text-xs font-bold text-on-surface">User Input</p>
                        </div>
                        <span className="material-symbols-outlined text-outline rotate-90 sm:rotate-0">arrow_forward</span>
                        <div className="bg-primary/10 border border-primary/20 px-3 py-2.5 rounded-lg text-center shrink-0 w-36 shadow-sm relative">
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[8px] px-1 rounded font-bold uppercase">Prompt Cache</span>
                          <p className="text-xs font-bold text-on-surface">Prefix Cache</p>
                          <p className="text-[9px] text-emerald-400 font-mono">50% off cache hit</p>
                        </div>
                        <span className="material-symbols-outlined text-outline rotate-90 sm:rotate-0">arrow_forward</span>
                        <div className="bg-rose-950/20 border border-rose-800/30 px-3 py-2.5 rounded-lg text-center shrink-0 w-36 shadow-sm">
                          <p className="text-xs font-bold text-rose-400">Premium LLM</p>
                          <p className="text-[9px] text-on-surface-variant">GPT-4o / Sonnet</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container/30 p-3 rounded-lg border border-outline-variant/20">
                    <b>Architectural Recommendation:</b>{' '}
                    {result.resultType === 'Rule-Based' && 'Write a regex extraction function. Use regular expression engines instead of calling the completion endpoint. For structured schema compliance, write a validator function using standard validator packages.'}
                    {result.resultType === 'Hybrid' && 'Build a pre-routing gateway middleware in your code. Check the input with simple rules (e.g. string matching or regex). If matches, return direct static payload. If complex, forward request to a small model.'}
                    {result.resultType === 'AI Recommended' && 'Change target model header in client requests or use the Peek Gateway policy engine to force-redirect traffic to gemini-1.5-flash.'}
                    {result.resultType === 'AI Essential' && 'Keep premium model routing, but structure prompts with a fixed header prefix to trigger downstream cache hits, saving input tokens.'}
                  </p>
                </div>

                {/* Recommendations Checklist */}
                <div className="glass-card rounded-xl p-6 space-y-4">
                  <h4 className="font-bold text-on-surface text-body-lg">Implementation Steps</h4>
                  <div className="space-y-3">
                    {[
                      result.resultType === 'Rule-Based' && [
                        { id: '1', label: 'Write local script using regex / JSON validator' },
                        { id: '2', label: 'Disable current API connections to GPT-4o for this workflow' },
                        { id: '3', label: 'Deploy local code and run tests' }
                      ],
                      result.resultType === 'Hybrid' && [
                        { id: '1', label: 'Implement pre-filter regex in your router' },
                        { id: '2', label: 'Set up edge-model fallback for failures' },
                        { id: '3', label: 'Configure latency telemetry checks' }
                      ],
                      result.resultType === 'AI Recommended' && [
                        { id: '1', label: 'Update model config value to "gemini-1.5-flash"' },
                        { id: '2', label: 'Review prompt instructions for Gemini format' },
                        { id: '3', label: 'Add schema validation guardrails to ensure output formatting' }
                      ],
                      result.resultType === 'AI Essential' && [
                        { id: '1', label: 'Arrange static system instructions at top of prompt' },
                        { id: '2', label: 'Enable prompt cache in gateway settings' },
                        { id: '3', label: 'Prune conversational history in multi-turn request templates' }
                      ]
                    ].filter(Boolean)[0]?.map((step: any) => (
                      <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 hover:bg-surface-variant/10 transition-colors">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-outline-variant bg-surface-container focus:ring-primary text-primary"
                        />
                        <span className="text-xs text-on-surface leading-snug">{step.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => {
                        // Simulate applying policy overrides
                        alert(`Gateway policy updated: ${workflowName} necessity level configured to "${result.resultType}".`);
                        setWizardStep(0);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-xl font-label-md text-label-md hover:opacity-90 shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      Deploy Policy Rule
                    </button>
                    <button
                      onClick={() => setWizardStep(0)}
                      className="w-full flex items-center justify-center gap-2 border border-outline-variant text-on-surface-variant py-2.5 rounded-xl font-label-md text-label-md hover:bg-surface-variant transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                      Close Assessment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
