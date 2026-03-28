"use client";

export default function ScrollCTA() {
  const handleClick = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-2 border-0 bg-transparent"
    >
      <span className="text-sm text-[#c4a87a]/50">Scroll to explore</span>
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#4a8c65]/30 transition-colors hover:border-[#4a8c65]/60">
        <svg
          className="h-4 w-4 text-[#4a8c65]/70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          style={{ animation: "bounce-down 2s ease-in-out infinite" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </button>
  );
}
