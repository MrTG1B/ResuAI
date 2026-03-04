
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import {
  ArrowRight, Bot, PenSquare, Eye, Star, FileText,
  LayoutTemplate, SearchCheck, NotebookPen, Users, Zap, ShieldCheck,
  CheckCircle2, BrainCircuit, Rocket, Target, Medal,
  TrendingUp, MessageSquare, Globe, TreePine, ScrollText,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { BrandLoader } from '@/components/brand-loader';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { ScrollyTellingProcess } from '@/components/scrollytelling-process';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';

/* ── Count-Up Hook ─────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1800, active = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration, active]);
  return value;
}

/* ── Animated Stat ─────────────────────────────────────────────────────── */
function AnimatedStat({
  target,
  suffix,
  active,
}: {
  target: number;
  suffix: string;
  active: boolean;
}) {
  const val = useCountUp(target, 1800, active);
  return (
    <span>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [statsActive, setStatsActive] = useState(false);
  const [statsEl, setStatsEl] = useState<HTMLDivElement | null>(null);
  const statsRef = useCallback((node: HTMLDivElement | null) => setStatsEl(node), []);

  /* ── Scroll-reveal refs ─────────────────────────────────────────────── */
  const howRevealRef = useScrollReveal();
  const toolsRevealRef = useScrollReveal();
  const whyRevealRef = useScrollReveal();
  const testiRevealRef = useScrollReveal();
  const faqRevealRef = useScrollReveal();
  const ctaRevealRef = useScrollReveal();

  /* ── Auth redirect ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.push('/dashboard');
      else setIsLoading(false);
    });
    return () => unsub();
  }, [router]);

  /* ── Stats IntersectionObserver ─────────────────────────────────────── */
  useEffect(() => {
    if (!statsEl) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsActive(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(statsEl);
    return () => obs.disconnect();
  }, [statsEl]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <BrandLoader size="lg" />
        <p className="mt-4 text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-clip">
      <Header />
      <main>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <HeroGeometric
          badge="AI-Powered Career Platform"
          title1="Your Career"
          title2="Elevated by AI"
          description="Create standout resumes & portfolios with intelligent, personalised AI tools."
        >
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <div className="relative group animated-border-glow">
              <Button
                asChild
                size="lg"
                className="font-bold relative bg-white hover:bg-white/90 text-gray-900 transition-all duration-300 transform group-hover:scale-105 group-hover:-translate-y-1 text-xl px-10 py-6"
              >
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" strokeWidth={2.5} />
                </Link>
              </Button>
            </div>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-white/20 text-white/80 hover:border-white/40 hover:bg-white/5 transition-all duration-300 hover:-translate-y-1"
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          {/* Eco announcement strip */}
          <div className="mt-8 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 text-emerald-400 text-sm font-medium mx-auto">
            <TreePine className="h-4 w-4 shrink-0" />
            <span>Every Pro plan plants a real tree in your name — and you get a <strong>personalised certificate</strong></span>
            <Link href="/pricing" className="underline underline-offset-2 hover:text-emerald-300 whitespace-nowrap">
              Learn more →
            </Link>
          </div>

          {/* Floating social-proof pills */}
          <div className="mt-10 flex flex-wrap justify-center gap-3 opacity-80">
            {[
              { icon: Users, text: '10,000+ Professionals' },
              { icon: FileText, text: '50,000+ Resumes Created' },
              { icon: Star, text: '4.9 / 5 Rating' },
            ].map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-sm text-white/50 backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5 text-indigo-400" />
                {text}
              </span>
            ))}
          </div>
        </HeroGeometric>

        {/* ── TICKER / MARQUEE ──────────────────────────────────────────── */}
        <div className="border-y border-border/60 bg-card/30 py-4 overflow-hidden">
          <div className="flex animate-ticker whitespace-nowrap select-none">
            {[...Array(2)].map((_, pass) => (
              <div key={pass} className="flex items-center gap-10 px-5 shrink-0">
                {[
                  'AI Resume Editor',
                  'ATS Score Checker',
                  'Portfolio Generator',
                  'Cover Letter Writer',
                  'Interview Prep',
                  'Career Coach AI',
                  'Aptitude Tests',
                  'Job Match Analyser',
                  'Resume Parser',
                  '🌱 Tree Planted with Every Pro Plan',
                ].map((item) => (
                  <span
                    key={`${pass}-${item}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── GREEN INITIATIVE ─────────────────────────────────────────── */}
        <section className="py-14 lg:py-20 bg-background border-y border-border/50" aria-label="Green Initiative - Tree Planting">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 dark:border-emerald-800 p-8 md:p-10 text-center">
              <div className="flex justify-center mb-5">
                <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700">
                  <TreePine className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <span className="inline-block text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold mb-3">
                Green Initiative
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-heading text-emerald-900 dark:text-emerald-100 mb-4">
                We Plant a Tree for Every Pro Subscription
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                At ResuAI, we believe your career growth should also contribute to the planet&apos;s growth.
                When you subscribe to any paid plan, we plant a real tree in your name through our verified reforestation partners.
                You&apos;ll also receive a <strong className="text-emerald-700 dark:text-emerald-400">personalised tree-planting certificate</strong> delivered to your email — a meaningful reminder that your success is making a difference.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700">
                  <TreePine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">1 subscription = 1 tree planted</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700">
                  <ScrollText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Personalised certificate included</span>
                </div>
              </div>
              <div className="mt-8">
                <Link href="/pricing">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md shadow-emerald-200 dark:shadow-emerald-900/40">
                    Subscribe &amp; Make an Impact <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS (Scrollytelling) ─────────────────────────────── */}
        <ScrollyTellingProcess />

        {/* ── AI TOOLKIT ────────────────────────────────────────────────── */}
        <section
          className="py-14 lg:py-20 bg-background"
          ref={toolsRevealRef}
        >
          <div className="container mx-auto px-4">
            <div className="reveal text-center mb-10">
              <span className="inline-block text-xs uppercase tracking-widest text-primary font-semibold mb-3">
                Tools
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight font-heading bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Your AI-Powered Career Toolkit
              </h2>
              <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
                Everything you need to analyse, edit, and showcase your professional story.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: FileText,
                  colorHex: 'hsl(var(--primary))',
                  title: 'AI Resume Editor',
                  desc: 'Upload your existing resume and let our AI refine content, fix typos, and redesign the layout with professional templates.',
                  delay: '0ms',
                },
                {
                  icon: NotebookPen,
                  colorHex: '#F71B3D',
                  title: 'Cover Letter Generator',
                  desc: 'Create a tailored cover letter for any job description in seconds, using your profile data to highlight your strengths.',
                  delay: '120ms',
                },
                {
                  icon: SearchCheck,
                  colorHex: '#45B8AC',
                  title: 'ATS Resume Checker',
                  desc: 'Get instant feedback. Our AI scores your resume against a job description and provides actionable recommendations.',
                  delay: '240ms',
                },
                {
                  icon: LayoutTemplate,
                  colorHex: 'hsl(var(--primary))',
                  title: 'Portfolio Generator',
                  desc: 'Transform your resume into a stunning portfolio website in seconds. Choose from beautiful themes and share your unique link.',
                  delay: '360ms',
                },
              ].map(({ icon: Icon, colorHex, title, desc, delay }) => (
                <div key={title} className="reveal group" style={{ transitionDelay: delay }}>
                  <Card className="p-6 rounded-xl border bg-card/60 backdrop-blur-sm shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col h-full text-center relative overflow-hidden">
                    {/* Per-card glow on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl"
                      style={{ background: `radial-gradient(circle at 50% 0%, ${colorHex}22, transparent 65%)` }}
                    />
                    <div className="flex-shrink-0 flex justify-center mb-5">
                      <div
                        className="p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${colorHex}1A` }}
                      >
                        <Icon className="h-10 w-10" style={{ color: colorHex }} />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 font-heading">{title}</h3>
                    <p className="text-muted-foreground text-sm flex-grow">{desc}</p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY RESUAI ────────────────────────────────────────────────── */}
        <section
          className="parallax-bg py-14 lg:py-20"
          ref={whyRevealRef}
        >
          <div className="container mx-auto px-4">
            <div className="reveal text-center mb-10">
              <span className="inline-block text-xs uppercase tracking-widest text-primary font-semibold mb-3">
                Advantages
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight font-heading bg-gradient-to-r from-primary/90 to-primary/70 bg-clip-text text-transparent">
                Why Professionals Choose ResuAI
              </h2>
              <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
                We combine powerful AI with a seamless experience so you can focus on landing the job.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: BrainCircuit, colorHex: 'hsl(var(--primary))', title: 'Gemini AI Engine', desc: 'Powered by Google Gemini — the most advanced AI to generate, analyse, and refine your career documents.', delay: '0ms' },
                { icon: Rocket, colorHex: '#45B8AC', title: 'Ready in 2 Minutes', desc: 'From raw experience to a polished, ATS-optimised resume or live portfolio in under two minutes.', delay: '120ms' },
                { icon: Target, colorHex: '#F71B3D', title: 'ATS Optimised', desc: 'Every document is crafted to pass automated screening systems used by top recruiters worldwide.', delay: '240ms' },
                { icon: Medal, colorHex: 'hsl(var(--primary))', title: 'Pro Templates', desc: 'Curated, recruiter-approved templates that look stunning across all screen sizes and print layouts.', delay: '360ms' },
                { icon: ShieldCheck, colorHex: '#45B8AC', title: '100% Data Privacy', desc: 'Your data lives in Firebase under strict security rules. Only you can access your documents.', delay: '480ms' },
                { icon: TrendingUp, colorHex: '#F71B3D', title: 'Career Growth Tools', desc: 'Go beyond resumes — interview prep, aptitude tests, cover letters, and an AI career coach in one place.', delay: '600ms' },
              ].map(({ icon: Icon, colorHex, title, desc, delay }) => (
                <div key={title} className="reveal group" style={{ transitionDelay: delay }}>
                  <div className="glass-card rounded-xl p-6 h-full transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.12)]">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex-shrink-0 p-3 rounded-xl"
                        style={{ backgroundColor: `${colorHex}1A` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: colorHex }} />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1 font-heading">{title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ─────────────────────────────────────────────────────── */}
        <section className="py-12 lg:py-16 bg-background border-y border-border/50">
          <div className="container mx-auto px-4" ref={statsRef}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
              {[
                { icon: Users, colorHex: 'hsl(var(--primary))', target: 10000, suffix: '+', label: 'Professionals Helped' },
                { icon: FileText, colorHex: 'hsl(var(--primary))', target: 50000, suffix: '+', label: 'Resumes Created' },
                { icon: Zap, colorHex: '#45B8AC', target: 2, suffix: ' min', label: 'Avg Build Time' },
                { icon: ShieldCheck, colorHex: '#F71B3D', target: 100, suffix: '%', label: 'Data Privacy' },
              ].map(({ icon: Icon, colorHex, target, suffix, label }) => (
                <div key={label} className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: `${colorHex}1A` }}>
                    <Icon className="h-6 w-6" style={{ color: colorHex }} />
                  </div>
                  <p className="text-4xl font-bold font-heading text-foreground">
                    <AnimatedStat target={target} suffix={suffix} active={statsActive} />
                  </p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
        <section
          className="py-14 lg:py-20 bg-background"
          ref={testiRevealRef}
        >
          <div className="container mx-auto px-4">
            <div className="reveal text-center mb-10">
              <span className="inline-block text-xs uppercase tracking-widest text-primary font-semibold mb-3">
                Reviews
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight font-heading bg-gradient-to-r from-primary/90 to-primary/70 bg-clip-text text-transparent">
                Why Professionals Love ResuAI
              </h2>
              <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
                Don&apos;t just take our word for it. Here&apos;s what our users are saying.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { quote: '"I created a portfolio in under 5 minutes that looked better than what I spent weeks building myself. Truly magical!"', name: 'Sarah L.', role: 'UX Designer', initials: 'SL', color: '#45B8AC', delay: '0ms' },
                { quote: '"The ATS checker gave me the exact feedback I needed to land three interviews. It\'s like having a personal career coach."', name: 'Michael B.', role: 'Software Engineer', initials: 'MB', color: 'hsl(var(--primary))', delay: '160ms' },
                { quote: '"As a recent graduate, this tool was a lifesaver. It helped me craft a resume that got noticed and felt truly professional."', name: 'Jessica R.', role: 'Marketing Graduate', initials: 'JR', color: '#F71B3D', delay: '320ms' },
              ].map(({ quote, name, role, initials, color, delay }) => (
                <div key={name} className="reveal" style={{ transitionDelay: delay }}>
                  <Card className="p-8 glass-card rounded-xl flex flex-col h-full shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group">
                    <div className="flex gap-1 mb-5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-8 flex-grow italic leading-relaxed">{quote}</p>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                        style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
                      >
                        {initials}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{name}</p>
                        <p className="text-xs text-muted-foreground">{role}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MORE TOOLS ────────────────────────────────────────────────── */}
        <section className="py-12 lg:py-16 bg-card/30 border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-heading text-foreground">
                Even More Career Tools
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
                Beyond resumes — a full suite to accelerate your job search.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: MessageSquare, colorHex: '#45B8AC', title: 'Mentra AI Coach', desc: 'A conversational AI career coach that helps you navigate your next move.' },
                { icon: Globe, colorHex: 'hsl(var(--primary))', title: 'Live Portfolio', desc: 'Publish a beautiful personal website with a shareable public link in one click.' },
                { icon: BrainCircuit, colorHex: '#F71B3D', title: 'Interview Prep', desc: 'Practice tough interview questions with AI-powered feedback and guidance.' },
                { icon: Target, colorHex: '#45B8AC', title: 'Job Match Analyser', desc: 'Paste a job description and instantly see how well your profile matches.' },
              ].map(({ icon: Icon, colorHex, title, desc }) => (
                <div
                  key={title}
                  className="flex flex-col items-center text-center gap-3 p-6 rounded-xl glass-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 group"
                >
                  <div
                    className="p-3 rounded-xl transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${colorHex}1A` }}
                  >
                    <Icon className="h-7 w-7" style={{ color: colorHex }} />
                  </div>
                  <h3 className="font-semibold font-heading text-sm">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING TEASER ───────────────────────────────────────────── */}
        <section className="py-14 lg:py-20 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-block text-xs uppercase tracking-widest text-primary font-semibold mb-3">Pricing</span>
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Start free and scale as your career grows. No hidden fees, no surprises.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
              {[
                { name: 'Free', price: '$0', color: 'border-slate-200 bg-card' },
                { name: 'Medium', price: '$9.99', color: 'border-blue-200 bg-card' },
                { name: 'Pro', price: '$19.99', color: 'border-violet-300 bg-violet-50/50 dark:bg-violet-950/20 ring-2 ring-violet-400' },
                { name: 'Ultra Pro', price: '$39.99', color: 'border-amber-200 bg-card' },
              ].map(({ name, price, color }) => (
                <div key={name} className={`rounded-xl border p-4 ${color}`}>
                  <div className="font-semibold text-sm mb-1">{name}</div>
                  <div className="text-2xl font-bold">{price}</div>
                  <div className="text-xs text-muted-foreground">/month</div>
                </div>
              ))}
            </div>
            <Link href="/pricing">
              <Button size="lg" className="gap-2">
                See Full Pricing <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section
          className="py-14 lg:py-20 bg-background"
          ref={faqRevealRef}
        >
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="reveal text-center mb-10">
              <span className="inline-block text-xs uppercase tracking-widest text-primary font-semibold mb-3">
                FAQs
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight font-heading bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-muted-foreground mt-3">
                Got questions? We have answers. Visit our{' '}
                <Link href="/faq" className="text-primary hover:underline">
                  full FAQ page
                </Link>{' '}
                for more.
              </p>
            </div>

            <div className="reveal" style={{ transitionDelay: '100ms' }}>
              <Accordion type="single" collapsible className="space-y-4">
                {[
                  { q: 'Is ResuAI free to use?', a: 'Yes! ResuAI offers a free tier with access to all core AI features — resume editor, ATS checker, portfolio generator, and cover letter writer.' },
                  { q: 'How does the ATS resume checker work?', a: 'Our AI analyses your resume against a specific job description, assigns a compatibility score, and provides actionable recommendations to improve your chances of passing automated screening systems.' },
                  { q: 'Is my resume data secure?', a: 'Absolutely. Your data is stored in Google Firebase with strict security rules — only you can access your documents. All connections are encrypted via HTTPS/TLS.' },
                  { q: 'Can I create multiple resumes?', a: 'Yes. You can create and manage multiple resume versions, tailoring each one for different roles or industries from a single account.' },
                  { q: 'What AI powers ResuAI?', a: "ResuAI uses Google's Gemini AI models via the Genkit framework for all intelligent features including content generation, analysis, and career coaching." },
                ].map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`home-faq-${i}`}
                    className="border border-border/60 rounded-xl px-6 bg-card/50 backdrop-blur-sm"
                  >
                    <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary hover:no-underline py-5">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="reveal text-center mt-8" style={{ transitionDelay: '200ms' }}>
              <Button variant="outline" asChild>
                <Link href="/faq">
                  View All FAQs <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
        <section
          className="relative py-16 lg:py-24 overflow-hidden"
          ref={ctaRevealRef}
        >
          <div className="absolute inset-0 bg-background" />
          <div className="absolute inset-0 dot-grid opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[900px] max-h-[900px] rounded-full bg-primary/[0.07] blur-[140px] animate-pulse-glow" />

          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
              <CheckCircle2 className="h-4 w-4" />
              Free to Start — No Credit Card Required
            </div>
            <h2
              className="reveal text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6 font-heading bg-gradient-to-r from-[#FFA62E] via-[#F71B3D] to-[#45B8AC] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient"
              style={{ transitionDelay: '100ms' }}
            >
              Ready to Build<br />Your Future?
            </h2>
            <p
              className="reveal max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10"
              style={{ transitionDelay: '200ms' }}
            >
              Join thousands of professionals taking their careers to the next level. Get started today and see the difference AI can make.
            </p>
            <div
              className="reveal flex flex-col sm:flex-row justify-center gap-4"
              style={{ transitionDelay: '300ms' }}
            >
              <div className="relative group animated-border-glow">
                <Button
                  asChild
                  size="lg"
                  className="font-bold relative bg-background hover:bg-background text-foreground transition-all duration-300 transform group-hover:scale-105 group-hover:-translate-y-1 text-xl px-10 py-6"
                >
                  <Link href="/signup">
                    Get Started for Free
                    <ArrowRight className="ml-2 h-5 w-5" strokeWidth={2.5} />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
