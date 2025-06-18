export default function Kbd({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={`pointer-events-none h-5 select-none items-center gap-1 rounded-sm border border-muted-foreground/50 bg-background px-1.5 font-mono text-xs font-medium opacity-100 sm:flex ${className}`}
    >
      {children}
    </kbd>
  );
}
