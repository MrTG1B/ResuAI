"use client";

import { useRef } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";
import { Bot, PenSquare, Eye, FileText } from "lucide-react";

// Step content
const STEPS = [
  {
    step: "1",
    title: "Provide Your Info",
    desc: "Upload your existing resume. Our AI analyses your information to create a structured, polished draft instantly.",
  },
  {
    step: "2",
    title: "Customise & Refine",
    desc: "Edit any section with AI suggestions, apply professional templates, and tailor the design to match your style.",
  },
  {
    step: "3",
    title: "Publish & Share",
    desc: "Download a recruiter-ready resume or share your portfolio via a unique public link and land your dream job.",
  },
];

// Helper component for each text block so hooks are called statically
function StepText({
  step,
  index,
  scrollYProgress,
}: {
  step: (typeof STEPS)[0];
  index: number;
  scrollYProgress: MotionValue<number>;
}) {
  const start = index * 0.33;
  const end = (index + 1) * 0.33;
  const mid = start + 0.165;

  const opacity = useTransform(
    scrollYProgress,
    [Math.max(0, start - 0.05), start, mid, end, Math.min(1, end + 0.05)],
    [0, 1, 1, 1, 0]
  );

  const y = useTransform(
    scrollYProgress,
    [Math.max(0, start - 0.05), start, mid, end, Math.min(1, end + 0.05)],
    [40, 0, 0, 0, -40]
  );

  const pointerEvents = useTransform(opacity, (val) =>
    val > 0.5 ? "auto" : "none"
  );

  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center"
      style={{ opacity, y, pointerEvents }}
    >
      <div className="relative z-10">
        <span className="inline-block text-xs uppercase tracking-widest text-primary font-semibold mb-3">
          Step {step.step}
        </span>
        <h3 className="text-3xl md:text-5xl font-bold tracking-tight font-heading mb-4 text-foreground">
          {step.title}
        </h3>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          {step.desc}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Visual sub-components (hooks extracted from JSX) ────────────────────────

function Visual1({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0.0, 0.25, 0.33], [1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0.0, 0.33], [1, 0.9]);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-card to-card/50"
      style={{ opacity, scale, zIndex: 3 }}
    >
      <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-inner">
        <Bot className="w-12 h-12 text-primary" />
      </div>
      <div className="w-48 h-3 bg-muted rounded-full mb-4 animate-[pulse_2s_ease-in-out_infinite]" />
      <div className="w-3/4 h-2 bg-muted/60 rounded-full mb-3" />
      <div className="w-full h-2 bg-muted/60 rounded-full mb-3" />
      <div className="w-5/6 h-2 bg-muted/60 rounded-full" />
    </motion.div>
  );
}

function Visual2({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(
    scrollYProgress,
    [0.25, 0.33, 0.58, 0.66],
    [0, 1, 1, 0]
  );
  const scale = useTransform(
    scrollYProgress,
    [0.25, 0.33, 0.66],
    [0.85, 1, 0.9]
  );

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center p-6 bg-gradient-to-tl from-card to-card/50"
      style={{ opacity, scale, zIndex: 2 }}
    >
      <div className="w-full h-full bg-background rounded-2xl border border-primary/30 p-5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-5 right-5 z-20">
          <PenSquare className="w-6 h-6 text-primary animate-bounce opacity-80" />
        </div>
        <div className="flex gap-4 mb-6 border-b border-border pb-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-3 pt-2">
            <div className="w-2/3 h-4 bg-primary/40 rounded" />
            <div className="w-1/2 h-3 bg-muted rounded" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-primary/20" />
            <div className="flex-1 h-3 bg-muted/70 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-primary/20" />
            <div className="flex-1 h-3 bg-muted/70 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-primary/20" />
            <div className="w-4/5 h-3 bg-muted/70 rounded" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Visual3({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0.58, 0.66, 1.0], [0, 1, 1]);
  const scale = useTransform(scrollYProgress, [0.58, 0.66, 1.0], [0.9, 1, 1]);
  const cardY = useTransform(scrollYProgress, [0.66, 1], [30, -10]);
  const cardRotate = useTransform(scrollYProgress, [0.66, 1], [-2, 0]);
  const card2Y = useTransform(scrollYProgress, [0.66, 1], [50, -25]);
  const card2Rotate = useTransform(scrollYProgress, [0.66, 1], [3, 0]);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-tr from-card to-card/50"
      style={{ opacity, scale, zIndex: 1 }}
    >
      <div className="relative w-full h-full">
        <motion.div
          className="absolute top-[15%] left-[5%] w-[85%] h-[60%] bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/40 backdrop-blur-md shadow-[0_0_40px_hsl(var(--primary)/0.25)] p-5 flex flex-col pointer-events-none"
          style={{ y: cardY, rotate: cardRotate }}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-[10px] font-bold uppercase tracking-widest border border-green-500/30">
              Live Portfolio
            </div>
          </div>
          <div className="w-1/2 h-4 bg-muted/80 rounded mb-2" />
          <div className="w-1/3 h-2 bg-muted/50 rounded" />
          <div className="mt-auto flex gap-2">
            <div className="w-full h-12 bg-background/50 rounded-lg border border-border/50" />
            <div className="w-full h-12 bg-background/50 rounded-lg border border-border/50" />
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-[5%] right-[-5%] w-[60%] h-[40%] bg-card rounded-xl border border-border shadow-2xl p-4 flex flex-col justify-center pointer-events-none"
          style={{ y: card2Y, rotate: card2Rotate }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="w-full h-3 bg-muted mb-2 rounded-sm" />
          <div className="w-5/6 h-3 bg-muted mb-2 rounded-sm" />
          <div className="w-4/6 h-3 bg-muted rounded-sm" />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Background Parallax ──────────────────────────────────────────────────────

function BgParallax({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  return (
    <div className="absolute inset-0 max-w-7xl mx-auto pointer-events-none z-0">
      <motion.div
        className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full bg-primary/5 blur-[120px]"
        style={{ y }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ScrollyTellingProcess() {
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section ref={containerRef} className="relative h-[300vh] bg-background">
      <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
        {/* Background Parallax Element */}
        <BgParallax scrollYProgress={scrollYProgress} />

        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10 w-full h-full">
          {/* LEFT: Text Content */}
          <div className="relative h-[50vh] flex items-center">
            {STEPS.map((step, index) => (
              <StepText
                key={step.step}
                step={step}
                index={index}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>

          {/* RIGHT: Dynamic Visuals Container */}
          <div className="relative h-[60vh] md:h-[70vh] w-full flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl border border-primary/20 bg-card/40 backdrop-blur-xl shadow-2xl flex items-center justify-center overflow-hidden">
              <Visual1 scrollYProgress={scrollYProgress} />
              <Visual2 scrollYProgress={scrollYProgress} />
              <Visual3 scrollYProgress={scrollYProgress} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
