"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, X, Zap, Star, Crown, Sparkles, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PLANS_LIST } from "@/lib/plans";
import type { Plan, PlanId } from "@/types/subscription";
import { auth } from "@/lib/firebase";
import { getIdToken } from "firebase/auth";

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const FEATURE_LABELS: Record<string, string> = {
  resumeBuilds: "Resume Builds",
  portfolios: "Portfolios",
  coverLetters: "Cover Letters",
  aiRequests: "AI Requests / month",
  atsScans: "ATS Scans",
  interviewPrep: "Interview Prep",
  mentorChat: "Mentor Chat",
  aptitudeTests: "Aptitude Tests",
  certificateAnalysis: "Certificate Analysis",
  prioritySupport: "Priority Support",
  customDomain: "Custom Domain",
  teamCollaboration: "Team Collaboration",
  apiAccess: "API Access",
  exportFormats: "Export Formats",
};

const FEATURE_ORDER = Object.keys(FEATURE_LABELS) as (keyof Plan["features"])[];

function formatFeatureValue(value: Plan["features"][keyof Plan["features"]]): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === "unlimited") return "Unlimited";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function featureIncluded(value: Plan["features"][keyof Plan["features"]]): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (value === "unlimited") return true;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

function annualSavings(plan: Plan): number {
  if (plan.price === 0) return 0;
  return Math.round((1 - plan.annualPrice / plan.price) * 100);
}

const PLAN_META: Record<PlanId, { icon: React.ReactNode; gradient: string; border: string; badge: string; badgeClass: string }> = {
  free: {
    icon: <Zap className="w-5 h-5" />,
    gradient: "from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40",
    border: "border-slate-200 dark:border-slate-700",
    badge: "Free",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  medium: {
    icon: <Star className="w-5 h-5" />,
    gradient: "from-blue-50 to-blue-100/60 dark:from-blue-950/40 dark:to-blue-900/30",
    border: "border-blue-200 dark:border-blue-800",
    badge: "Medium",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
  },
  pro: {
    icon: <Sparkles className="w-5 h-5" />,
    gradient: "from-violet-50 to-purple-100/60 dark:from-violet-950/50 dark:to-purple-900/40",
    border: "border-violet-400 dark:border-violet-500",
    badge: "Most Popular",
    badgeClass: "bg-violet-600 text-white dark:bg-violet-500",
  },
  ultra_pro: {
    icon: <Crown className="w-5 h-5" />,
    gradient: "from-amber-50 to-yellow-100/60 dark:from-amber-950/40 dark:to-yellow-900/30",
    border: "border-amber-400 dark:border-amber-500",
    badge: "Ultra Pro",
    badgeClass: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white",
  },
};

const FAQS = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades apply at the end of your current billing period.",
  },
  {
    q: "What happens to my data if I downgrade?",
    a: "Your data is never deleted. If you exceed the limits of your new plan, existing content stays safe but you won't be able to create new items until you're within limits again.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "We offer a generous Free plan so you can explore ResuAI's core features before committing. Paid plans are billed immediately but come with a 7-day money-back guarantee.",
  },
  {
    q: "How does annual billing work?",
    a: "Annual billing charges you once per year at a discounted monthly equivalent. You save up to 20% compared to month-to-month pricing.",
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CancelledBanner() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300 mb-8">
      <AlertCircle className="w-5 h-5 shrink-0" />
      <p className="text-sm font-medium">
        Your checkout was cancelled. No charge was made. Feel free to choose a plan whenever you&apos;re ready.
      </p>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium text-foreground">{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border">
          <p className="pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlanCard
// ---------------------------------------------------------------------------

interface PlanCardProps {
  plan: Plan;
  isAnnual: boolean;
  currentPlanId: PlanId | null;
  onSubscribe: (plan: Plan) => Promise<void>;
  loadingPlanId: PlanId | null;
}

function PlanCard({ plan, isAnnual, currentPlanId, onSubscribe, loadingPlanId }: PlanCardProps) {
  const meta = PLAN_META[plan.id];
  const isPopular = plan.id === "pro";
  const isUltraPro = plan.id === "ultra_pro";
  const isCurrent = currentPlanId === plan.id;
  const price = isAnnual ? plan.annualPrice : plan.price;
  const savings = annualSavings(plan);
  const isLoading = loadingPlanId === plan.id;

  const stripeConfigured = (() => {
    if (plan.id === "free") return true;
    if (plan.id === "medium")
      return !!(isAnnual ? process.env.NEXT_PUBLIC_STRIPE_MEDIUM_ANNUAL_PRICE_ID : process.env.NEXT_PUBLIC_STRIPE_MEDIUM_PRICE_ID);
    if (plan.id === "pro")
      return !!(isAnnual ? process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID);
    if (plan.id === "ultra_pro")
      return !!(isAnnual
        ? process.env.NEXT_PUBLIC_STRIPE_ULTRA_PRO_ANNUAL_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_ULTRA_PRO_PRICE_ID);
    return false;
  })();

  return (
    <div
      className={`
        relative flex flex-col rounded-2xl border-2 bg-gradient-to-b p-6 transition-all duration-300
        hover:shadow-xl hover:-translate-y-1
        ${meta.gradient} ${meta.border}
        ${isPopular ? "shadow-lg shadow-violet-200/60 dark:shadow-violet-900/40 ring-2 ring-violet-400/50 dark:ring-violet-500/40" : ""}
        ${isUltraPro ? "shadow-lg shadow-amber-200/60 dark:shadow-amber-900/40" : ""}
      `}
    >
      {/* Popular badge pinned to top */}
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-violet-600 text-white shadow-md">
            <Sparkles className="w-3 h-3" /> Most Popular
          </span>
        </div>
      )}

      {/* Plan header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-sm font-semibold ${meta.badgeClass}`}>
            {meta.icon}
            {plan.name}
          </div>
          {isUltraPro && (
            <span className="text-xs font-medium bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
              ✦ Premium
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{plan.description}</p>
      </div>

      {/* Pricing */}
      <div className="mb-6">
        {price === 0 ? (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-foreground">Free</span>
            <span className="text-sm text-muted-foreground">forever</span>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-muted-foreground">$</span>
              <span className="text-4xl font-extrabold text-foreground">{price.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            {isAnnual && savings > 0 && (
              <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                ✓ Save {savings}% with annual billing
              </p>
            )}
            {!isAnnual && (
              <p className="mt-1 text-xs text-muted-foreground">
                or ${plan.annualPrice.toFixed(2)}/mo billed annually
              </p>
            )}
          </>
        )}
      </div>

      {/* CTA button */}
      <div className="mb-6">
        {isCurrent ? (
          <Button variant="outline" className="w-full" disabled>
            Current Plan
          </Button>
        ) : plan.id === "free" ? (
          <Button variant="outline" className="w-full" asChild>
            <a href="/dashboard">Get Started</a>
          </Button>
        ) : !stripeConfigured ? (
          <Button className="w-full" disabled variant="outline">
            Coming Soon
          </Button>
        ) : (
          <Button
            className={`w-full font-semibold ${
              isPopular
                ? "bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200 dark:shadow-violet-900/40"
                : isUltraPro
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-md shadow-amber-200 dark:shadow-amber-900/40"
                : ""
            }`}
            onClick={() => onSubscribe(plan)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirecting…
              </>
            ) : (
              "Subscribe"
            )}
          </Button>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-border mb-5" />

      {/* Features list */}
      <ul className="space-y-2.5 flex-1">
        {FEATURE_ORDER.map((key) => {
          const raw = plan.features[key];
          const included = featureIncluded(raw);
          const label = FEATURE_LABELS[key];
          const value = typeof raw !== "boolean" ? formatFeatureValue(raw) : null;

          return (
            <li key={key} className={`flex items-start gap-2.5 text-sm ${included ? "text-foreground" : "text-muted-foreground/50"}`}>
              {included ? (
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
              ) : (
                <X className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/40" />
              )}
              <span>
                {label}
                {value && included && typeof plan.features[key] !== "boolean" && (
                  <span className="ml-1 font-semibold text-foreground/80">
                    {Array.isArray(raw) ? `(${value})` : `— ${value}`}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner page (needs useSearchParams)
// ---------------------------------------------------------------------------

function PricingInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentPlanId] = useState<PlanId | null>(null);
  const [loadingPlanId, setLoadingPlanId] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancelled = searchParams.get("canceled") === "true";

  async function handleSubscribe(plan: Plan) {
    setError(null);

    const user = auth?.currentUser;
    if (!user) {
      router.push(`/sign-in?redirect=/pricing`);
      return;
    }

    setLoadingPlanId(plan.id);
    try {
      const token = await getIdToken(user);
      const priceId = isAnnual ? plan.stripeAnnualPriceId : plan.stripePriceId;

      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceId,
          planId: plan.id,
          isAnnual,
          userId: user.uid,
          email: user.email,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create checkout session");
      }

      const { url } = await res.json();
      if (url) {
        router.push(url);
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoadingPlanId(null);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="relative overflow-hidden pt-20 pb-16">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-violet-100/60 to-transparent dark:from-violet-950/30 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="mb-4 px-3 py-1 text-xs font-medium border-violet-300 text-violet-700 dark:border-violet-700 dark:text-violet-400">
              Simple, transparent pricing
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
              Invest in your{" "}
              <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">
                career
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Pick the plan that fits your goals. Upgrade or cancel any time.
            </p>
          </div>

          {/* Cancelled banner */}
          {cancelled && <CancelledBanner />}

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive mb-8">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <Label htmlFor="billing-toggle" className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-violet-600"
            />
            <Label htmlFor="billing-toggle" className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              Annual
            </Label>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
              Save up to 20%
            </span>
          </div>

          {/* Plan cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
            {PLANS_LIST.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isAnnual={isAnnual}
                currentPlanId={currentPlanId}
                onSubscribe={handleSubscribe}
                loadingPlanId={loadingPlanId}
              />
            ))}
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-muted-foreground">
            {["🔒 Secure payments via Stripe", "↩ 7-day money-back guarantee", "🚫 No hidden fees", "✏️ Cancel anytime"].map((item) => (
              <span key={item} className="flex items-center gap-1">{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Frequently asked questions</h2>
            <p className="text-muted-foreground">Everything you need to know about billing and plans.</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
          <p className="text-center mt-8 text-sm text-muted-foreground">
            Still have questions?{" "}
            <a href="/contact" className="font-medium text-violet-600 hover:underline dark:text-violet-400">
              Contact support →
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Page export (Suspense boundary for useSearchParams)
// ---------------------------------------------------------------------------

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>}>
      <PricingInner />
    </Suspense>
  );
}
