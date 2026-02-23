
"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Zap, Star, Sparkles, Crown, Check, X, Save, RefreshCw,
  Loader2, Info, ChevronDown, ChevronUp,
} from 'lucide-react';
import { db, doc, getDoc, setDoc } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { PlanId } from '@/types/user';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type FeatureKey =
  | 'resumeBuilds' | 'portfolios' | 'coverLetters' | 'aiRequests'
  | 'atsScans' | 'interviewPrep' | 'mentorChat' | 'aptitudeTests'
  | 'certificateAnalysis' | 'prioritySupport' | 'customDomain'
  | 'teamCollaboration' | 'apiAccess';

type FeatureValue = number | 'unlimited' | boolean;

interface PlanFeatures {
  resumeBuilds: number | 'unlimited';
  portfolios: number | 'unlimited';
  coverLetters: number | 'unlimited';
  aiRequests: number | 'unlimited';
  atsScans: number | 'unlimited';
  interviewPrep: boolean;
  mentorChat: boolean;
  aptitudeTests: boolean;
  certificateAnalysis: boolean;
  prioritySupport: boolean;
  customDomain: boolean;
  teamCollaboration: boolean;
  apiAccess: boolean;
}

interface PlanConfig {
  id: PlanId;
  name: string;
  price: number;
  annualPrice: number;
  description: string;
  features: PlanFeatures;
}

const DEFAULT_PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free', name: 'Free', price: 0, annualPrice: 0,
    description: 'Perfect for getting started with AI-powered career tools',
    features: {
      resumeBuilds: 2, portfolios: 1, coverLetters: 3, aiRequests: 10, atsScans: 3,
      interviewPrep: false, mentorChat: false, aptitudeTests: false,
      certificateAnalysis: false, prioritySupport: false, customDomain: false,
      teamCollaboration: false, apiAccess: false,
    },
  },
  medium: {
    id: 'medium', name: 'Medium', price: 9.99, annualPrice: 7.99,
    description: 'For professionals actively searching for their next opportunity',
    features: {
      resumeBuilds: 10, portfolios: 5, coverLetters: 20, aiRequests: 100, atsScans: 20,
      interviewPrep: true, mentorChat: false, aptitudeTests: true,
      certificateAnalysis: true, prioritySupport: false, customDomain: false,
      teamCollaboration: false, apiAccess: false,
    },
  },
  pro: {
    id: 'pro', name: 'Pro', price: 19.99, annualPrice: 15.99,
    description: 'For power users who want the full career acceleration experience',
    features: {
      resumeBuilds: 50, portfolios: 20, coverLetters: 'unlimited', aiRequests: 500, atsScans: 100,
      interviewPrep: true, mentorChat: true, aptitudeTests: true,
      certificateAnalysis: true, prioritySupport: true, customDomain: false,
      teamCollaboration: false, apiAccess: false,
    },
  },
  ultra_pro: {
    id: 'ultra_pro', name: 'Ultra Pro', price: 39.99, annualPrice: 31.99,
    description: 'The ultimate suite for teams and career coaches',
    features: {
      resumeBuilds: 'unlimited', portfolios: 'unlimited', coverLetters: 'unlimited',
      aiRequests: 'unlimited', atsScans: 'unlimited',
      interviewPrep: true, mentorChat: true, aptitudeTests: true,
      certificateAnalysis: true, prioritySupport: true, customDomain: true,
      teamCollaboration: true, apiAccess: true,
    },
  },
};

const PLAN_META: Record<PlanId, { icon: React.ReactNode; gradient: string; border: string; headerBg: string }> = {
  free: { icon: <Zap className="h-4 w-4" />, gradient: 'from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40', border: 'border-slate-200 dark:border-slate-700', headerBg: 'bg-slate-100 dark:bg-slate-800/60' },
  medium: { icon: <Star className="h-4 w-4" />, gradient: 'from-blue-50 to-blue-100/60 dark:from-blue-950/40 dark:to-blue-900/30', border: 'border-blue-200 dark:border-blue-800', headerBg: 'bg-blue-100 dark:bg-blue-900/40' },
  pro: { icon: <Sparkles className="h-4 w-4" />, gradient: 'from-violet-50 to-purple-100/60 dark:from-violet-950/50 dark:to-purple-900/40', border: 'border-violet-400 dark:border-violet-500', headerBg: 'bg-violet-100 dark:bg-violet-900/40' },
  ultra_pro: { icon: <Crown className="h-4 w-4" />, gradient: 'from-amber-50 to-yellow-100/60 dark:from-amber-950/40 dark:to-yellow-900/30', border: 'border-amber-400 dark:border-amber-500', headerBg: 'bg-amber-100 dark:bg-amber-900/40' },
};

const NUMERIC_FEATURES: { key: keyof PlanFeatures; label: string; desc: string }[] = [
  { key: 'resumeBuilds', label: 'Resume Builds', desc: 'Number of resumes a user can create' },
  { key: 'portfolios', label: 'Portfolios', desc: 'Number of portfolio sites a user can create' },
  { key: 'coverLetters', label: 'Cover Letters', desc: 'Cover letters a user can generate' },
  { key: 'aiRequests', label: 'AI Requests / month', desc: 'Monthly AI generation calls' },
  { key: 'atsScans', label: 'ATS Scans', desc: 'Resume ATS compatibility scans' },
];

const BOOLEAN_FEATURES: { key: keyof PlanFeatures; label: string; desc: string }[] = [
  { key: 'interviewPrep', label: 'Interview Prep', desc: 'AI-powered interview preparation tool' },
  { key: 'mentorChat', label: 'Mentor Chat', desc: 'Live AI mentor chat (Mentra)' },
  { key: 'aptitudeTests', label: 'Aptitude Tests', desc: 'AI-generated aptitude test practice' },
  { key: 'certificateAnalysis', label: 'Certificate Analysis', desc: 'AI certificate skill analysis' },
  { key: 'prioritySupport', label: 'Priority Support', desc: 'Faster support response times' },
  { key: 'customDomain', label: 'Custom Domain', desc: 'Custom domain for portfolio' },
  { key: 'teamCollaboration', label: 'Team Collaboration', desc: 'Multi-seat team access' },
  { key: 'apiAccess', label: 'API Access', desc: 'Direct API integration access' },
];

// ---------------------------------------------------------------------------
// FeatureNumericInput
// ---------------------------------------------------------------------------

function FeatureNumericInput({
  value,
  onChange,
  disabled,
}: {
  value: number | 'unlimited';
  onChange: (v: number | 'unlimited') => void;
  disabled?: boolean;
}) {
  const isUnlimited = value === 'unlimited';
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(isUnlimited ? 0 : 'unlimited')}
        className={`text-xs px-1.5 py-0.5 rounded border font-medium transition-colors ${
          isUnlimited
            ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-700'
            : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
        }`}
      >
        ∞
      </button>
      {!isUnlimited && (
        <Input
          type="number"
          min={0}
          value={value as number}
          disabled={disabled}
          onChange={e => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
          className="h-7 w-20 text-xs text-center"
        />
      )}
      {isUnlimited && (
        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Unlimited</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlanCard
// ---------------------------------------------------------------------------

function PlanCard({
  plan,
  onChange,
  onSave,
  isSaving,
  isDirty,
}: {
  plan: PlanConfig;
  onChange: (key: keyof PlanFeatures, value: FeatureValue) => void;
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
}) {
  const meta = PLAN_META[plan.id];
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className={`border-2 ${meta.border} bg-gradient-to-b ${meta.gradient} transition-all duration-300`}>
      {/* Plan header */}
      <CardHeader className={`pb-2 rounded-t-xl ${meta.headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-background/70 rounded-lg">{meta.icon}</div>
            <div>
              <CardTitle className="text-sm font-bold">{plan.name}</CardTitle>
              <CardDescription className="text-xs">
                {plan.price === 0 ? 'Free forever' : `$${plan.price}/mo · $${plan.annualPrice}/mo annual`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isDirty && (
              <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600 dark:text-amber-400 py-0">
                Unsaved
              </Badge>
            )}
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="p-1 rounded hover:bg-background/50 transition-colors"
            >
              {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-4 space-y-4">
          {/* Numeric limits */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Limits</p>
            <div className="space-y-2">
              {NUMERIC_FEATURES.map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{desc}</p>
                  </div>
                  <FeatureNumericInput
                    value={plan.features[key] as number | 'unlimited'}
                    onChange={v => onChange(key, v)}
                    disabled={isSaving}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Boolean features / tools */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tools & Features</p>
            <div className="grid grid-cols-1 gap-1.5">
              {BOOLEAN_FEATURES.map(({ key, label, desc }) => {
                const enabled = plan.features[key] as boolean;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isSaving}
                    onClick={() => onChange(key, !enabled)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all duration-150 ${
                      enabled
                        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700'
                        : 'bg-background/50 border-border/60 hover:bg-muted/40'
                    }`}
                  >
                    <div className={`shrink-0 h-4 w-4 rounded flex items-center justify-center ${enabled ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-muted border border-border'}`}>
                      {enabled ? <Check className="h-2.5 w-2.5 text-white" /> : <X className="h-2.5 w-2.5 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-medium ${enabled ? 'text-emerald-800 dark:text-emerald-300' : 'text-muted-foreground'}`}>{label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save button */}
          <Button
            className="w-full gap-2"
            size="sm"
            onClick={onSave}
            disabled={isSaving || !isDirty}
            variant={isDirty ? 'default' : 'outline'}
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isSaving ? 'Saving…' : isDirty ? 'Save Changes' : 'Saved'}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Record<PlanId, PlanConfig>>({ ...DEFAULT_PLANS });
  const [savedPlans, setSavedPlans] = useState<Record<PlanId, PlanConfig>>({ ...DEFAULT_PLANS });
  const [isLoading, setIsLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState<PlanId | null>(null);

  // Load plan config from Firestore (falls back to defaults)
  const loadPlanConfig = useCallback(async () => {
    if (!db) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const snap = await getDoc(doc(db, 'config', 'plans'));
      if (snap.exists()) {
        const data = snap.data();
        const merged = { ...DEFAULT_PLANS };
        (Object.keys(DEFAULT_PLANS) as PlanId[]).forEach(id => {
          if (data[id]) {
            merged[id] = { ...DEFAULT_PLANS[id], features: { ...DEFAULT_PLANS[id].features, ...data[id] } };
          }
        });
        setPlans(merged);
        setSavedPlans(merged);
      }
    } catch {
      // Silently fall back to defaults
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadPlanConfig(); }, [loadPlanConfig]);

  const handleChange = (planId: PlanId, key: keyof PlanFeatures, value: FeatureValue) => {
    setPlans(prev => ({
      ...prev,
      [planId]: { ...prev[planId], features: { ...prev[planId].features, [key]: value } },
    }));
  };

  const handleSave = async (planId: PlanId) => {
    if (!db) {
      toast({ title: "Error", description: "Firestore not initialized.", variant: "destructive" });
      return;
    }
    setSavingPlan(planId);
    try {
      const planFeatures = plans[planId].features;
      await setDoc(doc(db, 'config', 'plans'), { [planId]: planFeatures }, { merge: true });
      setSavedPlans(prev => ({ ...prev, [planId]: plans[planId] }));
      toast({ title: "Plan Saved", description: `${plans[planId].name} plan configuration saved successfully.` });
    } catch {
      toast({ title: "Error", description: "Failed to save plan.", variant: "destructive" });
    } finally {
      setSavingPlan(null);
    }
  };

  const isPlanDirty = (planId: PlanId) => {
    return JSON.stringify(plans[planId].features) !== JSON.stringify(savedPlans[planId].features);
  };

  const dirtyCount = (Object.keys(plans) as PlanId[]).filter(isPlanDirty).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Plans & Features</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Control which tools and limits belong to each subscription plan.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadPlanConfig} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Reload
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 text-blue-800 dark:text-blue-300">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed">
          Changes are saved to Firestore at <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded">config/plans</code> and
          take effect immediately for new feature checks in the main app when it reads from Firestore overrides.
          Toggle features per plan by clicking them, adjust numeric limits inline, then click <strong>Save Changes</strong>.
        </p>
      </div>

      {dirtyCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 text-amber-800 dark:text-amber-300">
          <Info className="h-4 w-4 shrink-0" />
          <p className="text-xs font-medium">
            You have unsaved changes in {dirtyCount} plan{dirtyCount > 1 ? 's' : ''}. Click <strong>Save Changes</strong> inside each plan card.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {(Object.keys(plans) as PlanId[]).map(planId => (
            <PlanCard
              key={planId}
              plan={plans[planId]}
              onChange={(key, value) => handleChange(planId, key, value)}
              onSave={() => handleSave(planId)}
              isSaving={savingPlan === planId}
              isDirty={isPlanDirty(planId)}
            />
          ))}
        </div>
      )}

      {/* Feature reference table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Feature Comparison Matrix</CardTitle>
          <CardDescription className="text-xs">Current active configuration across all plans</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Feature / Tool</th>
                {(Object.keys(plans) as PlanId[]).map(id => (
                  <th key={id} className="text-center px-3 py-2.5 text-xs font-semibold">{plans[id].name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NUMERIC_FEATURES.map(({ key, label }) => (
                <tr key={key} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2 text-xs font-medium">{label}</td>
                  {(Object.keys(plans) as PlanId[]).map(id => {
                    const val = plans[id].features[key];
                    return (
                      <td key={id} className="text-center px-3 py-2 text-xs tabular-nums font-semibold">
                        {val === 'unlimited' ? <span className="text-emerald-600 dark:text-emerald-400">∞</span> : val}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {BOOLEAN_FEATURES.map(({ key, label }) => (
                <tr key={key} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2 text-xs font-medium">{label}</td>
                  {(Object.keys(plans) as PlanId[]).map(id => {
                    const enabled = plans[id].features[key] as boolean;
                    return (
                      <td key={id} className="text-center px-3 py-2">
                        {enabled
                          ? <Check className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                          : <X className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
