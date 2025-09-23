import { cn } from "@/lib/utils";

interface BrandLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BrandLoader({ className, size = 'md' }: BrandLoaderProps) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={cn(
        "relative rounded-full animate-brand-spin",
        "bg-[conic-gradient(from_90deg_at_50%_50%,#F71B3D_-15.94deg,hsl(var(--primary))_43.12deg,#45B8AC_158.37deg,#F71B3D_210.94deg,hsl(var(--primary))_298.12deg,#45B8AC_344.37deg)]",
        sizeClasses[size],
        className
      )}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-8px)] h-[calc(100%-8px)] bg-background rounded-full"></div>
    </div>
  );
}
