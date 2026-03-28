export default function BottomBar() {
  return (
    <div className="relative z-20 flex items-center justify-between border-t border-[#4a8c65]/10 px-8 py-4">
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#1a3a2a]">
          <span className="text-sm font-bold text-[#d9c4a0]">S</span>
        </div>
        <span className="text-sm font-medium tracking-wide text-[#d9c4a0]/70">
          Sahla
        </span>
      </div>
      <span className="text-xs text-[#c4a87a]/30">
        Community Center App Creation Studio
      </span>
    </div>
  );
}
