export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 10" className={`arrow h-2.5 w-6 ${className}`} fill="none" aria-hidden>
      <path d="M0 5h22M18 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
