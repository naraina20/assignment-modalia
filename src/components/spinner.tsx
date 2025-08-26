

export const Spinner: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex items-center gap-2" data-testid="spinner" role="status" aria-live="polite" aria-busy="true">
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" fill="none" stroke="currentColor"></circle>
      <path d="M4 12a8 8 0 018-8" strokeWidth="4" strokeLinecap="round" className="opacity-75" fill="none" stroke="currentColor"></path>
    </svg>
    {label && <span className="text-sm">{label}</span>}
  </div>
);