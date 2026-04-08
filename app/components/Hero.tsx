export default function Hero() {
  return (
    <div className="relative z-10 flex flex-col items-center gap-5 px-4">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent-light px-4 py-1.5">
        <div className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="text-xs font-medium tracking-wide text-accent">
          Now in Beta
        </span>
      </div>
      <h1 className="font-[family-name:var(--font-display)] text-[clamp(4rem,12vw,10rem)] leading-none tracking-wide text-dark-green">
        SAHLA
      </h1>
      <p className="max-w-md text-center text-base font-light leading-relaxed text-tan-light/80 sm:text-lg">
        The all-in-one platform for community centers to build
        beautiful mobile apps — no code required.
      </p>
      <div className="mt-4 flex items-center gap-4">
        <a
          href="#showcase"
          className="rounded-full bg-dark-green px-7 py-3 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:shadow-lg hover:shadow-dark-green/20"
        >
          See It in Action
        </a>
        <a
          href="/login"
          className="rounded-full border border-dark-green/15 px-7 py-3 text-sm font-medium tracking-wide text-dark-green transition-all duration-300 hover:border-dark-green/30 hover:bg-dark-green/5"
        >
          Get Started
        </a>
      </div>
    </div>
  );
}
