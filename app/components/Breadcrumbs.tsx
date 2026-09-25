import Link from "next/link";

export function Breadcrumbs({
  items,
}: {
  items: Array<{ name: string; url?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-dark-green/55">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.name}-${i}`} className="flex items-center gap-1.5">
              {item.url && !isLast ? (
                <Link href={item.url} className="hover:text-dark-green hover:underline">
                  {item.name}
                </Link>
              ) : (
                <span className={isLast ? "text-dark-green/80" : undefined}>{item.name}</span>
              )}
              {!isLast && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
