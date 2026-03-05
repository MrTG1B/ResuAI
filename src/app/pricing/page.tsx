"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sparkles, AlertCircle, Loader2, ChevronDown, Users, TrendingUp, Award, Rocket, TreePine, ScrollText, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PLANS_LIST, applyPlanConfigOverrides, getRuntimePlansList, type PlanOverride } from "@/lib/plans";
import type { Plan, PlanId } from "@/types/subscription";
import { auth, db, doc, getDoc } from "@/lib/firebase";
import { getIdToken } from "firebase/auth";
import { useSubscription } from "@/hooks/use-subscription";
import { Pricing, type PricingPlan } from "@/components/ui/pricing";

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
  {
    q: "How does the tree-planting initiative work?",
    a: "When you subscribe to any paid plan, we partner with a verified reforestation organisation to plant a real tree in your name. You will receive a personalised tree-planting certificate via email within 7 days of your subscription being confirmed.",
  },
];

/** Map a Plan to the PricingPlan shape expected by the Pricing component. */
function mapPlanToPricingPlan(
  plan: Plan,
  isAnnual: boolean,
  currentPlanId: PlanId | null,
  loadingPlanId: PlanId | null,
  onSubscribe: (plan: Plan) => Promise<void>
): PricingPlan {
  const isCurrent = currentPlanId === plan.id;
  const isLoading = loadingPlanId === plan.id;
  const stripeConfigured =
    plan.id === "free" || !!(isAnnual ? plan.stripeAnnualPriceId : plan.stripePriceId);

  const features = FEATURE_ORDER
    .filter((key) => featureIncluded(plan.features[key]))
    .map((key) => {
      const raw = plan.features[key];
      const label = FEATURE_LABELS[key];
      if (typeof raw === "boolean") return label;
      return `${label} — ${formatFeatureValue(raw)}`;
    });

  let buttonText = "Subscribe";
  if (isCurrent) buttonText = "Current Plan";
  else if (plan.id === "free") buttonText = "Get Started";
  else if (!stripeConfigured) buttonText = "Coming Soon";
  else if (isLoading) buttonText = "Redirecting…";

  const onClick =
    isCurrent || !stripeConfigured
      ? undefined
      : plan.id === "free"
      ? undefined
      : () => { void onSubscribe(plan); };

  return {
    name: plan.name.toUpperCase(),
    price: String(plan.price),
    yearlyPrice: String(plan.annualPrice),
    period: "per month",
    features,
    description: plan.description,
    buttonText,
    href: plan.id === "free" ? "/dashboard" : "/pricing",
    isPopular: plan.id === "pro",
    onClick,
  };
}

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
// Inner page (needs useSearchParams)
// ---------------------------------------------------------------------------

function PricingInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plansList, setPlansList] = useState<Plan[]>(PLANS_LIST);

  const { planId: currentPlanId, isLoading: subLoading } = useSubscription();

  const cancelled = searchParams.get("canceled") === "true";

  // Load Firestore plan config overrides (prices + features)
  useEffect(() => {
    if (!db) return;
    getDoc(doc(db, 'config', 'plans'))
      .then((snap) => {
        if (snap.exists()) {
          applyPlanConfigOverrides(snap.data() as Partial<Record<PlanId, PlanOverride>>);
          setPlansList(getRuntimePlansList());
        }
      })
      .catch(() => {/* silently fall back to defaults */});
  }, []);

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
          <div className="text-center max-w-2xl mx-auto mb-10">
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

          {/* Social proof stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {[
              { icon: <Users className="w-5 h-5 text-violet-500" />, stat: "10,000+", label: "Active users" },
              { icon: <TrendingUp className="w-5 h-5 text-emerald-500" />, stat: "3×", label: "More interviews landed" },
              { icon: <Award className="w-5 h-5 text-amber-500" />, stat: "95%", label: "User satisfaction" },
              { icon: <Rocket className="w-5 h-5 text-blue-500" />, stat: "₹799/mo", label: "Starting price" },
            ].map(({ icon, stat, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl bg-muted/40 border border-border/60 text-center">
                <div className="p-2 rounded-lg bg-background border border-border/60 shadow-sm">{icon}</div>
                <span className="text-2xl font-extrabold text-foreground tracking-tight">{stat}</span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
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
        </div>

        {/* Pricing cards (21st.dev style) */}
        <div id="pricing-cards">
          <Pricing
            plans={plansList.map((plan) =>
              mapPlanToPricingPlan(
                plan,
                isAnnual,
                subLoading ? null : currentPlanId,
                loadingPlanId,
                handleSubscribe
              )
            )}
            onBillingToggle={setIsAnnual}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Green initiative banner */}
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 dark:border-emerald-800 p-6">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/60">
                <TreePine className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                  🌱 Every Pro Subscription Plants a Tree
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  When you subscribe to any paid plan, we plant a real tree in your name — helping restore our planet one career at a time.
                  You also receive a <strong>personalised tree-planting certificate</strong> delivered to your email as a token of your contribution.
                </p>
              </div>
              <div className="flex-shrink-0 flex flex-col items-center gap-2 text-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700">
                  <ScrollText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Certificate included</span>
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-500">Delivered via email</span>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-muted-foreground">
            {["🔒 Secure payments via Stripe", "↩ 7-day money-back guarantee", "🚫 No hidden fees", "🌱 Tree planted with every plan", "✏️ Cancel anytime"].map((item) => (
              <span key={item} className="flex items-center gap-1">{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Why upgrade section */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Why upgrade?</h2>
            <p className="text-muted-foreground">See how our paid plans accelerate your job search.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <TrendingUp className="w-6 h-6 text-violet-500" />,
                title: "Land interviews faster",
                desc: "Pro users report getting 3× more interview callbacks thanks to ATS-optimised resumes and personalised AI suggestions.",
                highlight: "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800",
              },
              {
                icon: <Sparkles className="w-6 h-6 text-amber-500" />,
                title: "Unlimited AI power",
                desc: "Stop rationing AI requests. Pro & Ultra Pro plans give you 500–unlimited requests so you can iterate freely.",
                highlight: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
              },
              {
                icon: <Award className="w-6 h-6 text-emerald-500" />,
                title: "Stand out with portfolio",
                desc: "Build up to 20 stunning portfolio sites. Share one link with recruiters and watch your response rate soar.",
                highlight: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
              },
              {
                icon: <Rocket className="w-6 h-6 text-blue-500" />,
                title: "Ace every interview",
                desc: "Unlock AI Interview Prep and Aptitude Tests — practice until you're confident, then walk in ready to impress.",
                highlight: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
              },
              {
                icon: <Users className="w-6 h-6 text-pink-500" />,
                title: "Your personal AI mentor",
                desc: "Mentra, our AI career mentor, is available 24/7 on Pro+ plans. Ask anything — resume tips, salary negotiation, career pivots.",
                highlight: "bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800",
              },
              {
                icon: <Check className="w-6 h-6 text-teal-500" />,
                title: "Risk-free guarantee",
                desc: "Not satisfied? We offer a 7-day money-back guarantee, no questions asked. Your career success is our priority.",
                highlight: "bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800",
              },
              {
                icon: <TreePine className="w-6 h-6 text-emerald-500" />,
                title: "Plant a tree, earn a certificate",
                desc: "Every paid plan subscription plants a real tree in your name. You'll receive a personalised certificate as proof of your positive impact on the planet.",
                highlight: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
              },
            ].map(({ icon, title, desc, highlight }) => (
              <div key={title} className={`rounded-xl border p-5 ${highlight}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-background rounded-lg border border-border/60 shadow-sm">{icon}</div>
                  <h3 className="font-semibold text-sm text-foreground">{title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="#pricing-cards" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-blue-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-violet-200/60 dark:shadow-violet-900/40">
              <Rocket className="w-4 h-4" /> Choose your plan &amp; upgrade now
            </a>
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
