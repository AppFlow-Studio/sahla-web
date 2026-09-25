/**
 * Brand System v1.1 "section label": SF Pro, all caps, thin Mihrab Green
 * line underneath. Internal building block for the MDX content components —
 * not registered in mdxComponents.tsx itself.
 */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex flex-col items-start gap-2">
      <span className="text-[11px] font-semibold tracking-[0.28em] text-ink uppercase">
        {children}
      </span>
      <span className="h-px w-8 bg-ink" />
    </span>
  );
}
