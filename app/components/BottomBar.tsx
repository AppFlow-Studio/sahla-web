export default function BottomBar() {
  return (
    <div className="relative z-20 flex items-center justify-between border-t border-dark-green/8 px-8 py-4">
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-dark-green">
          <span className="text-sm font-bold text-white">S</span>
        </div>
        <span className="text-sm font-medium tracking-wide text-dark-green/70">
          Sahla
        </span>
      </div>
      <span className="text-xs text-tan-light/40">
        Community Center App Creation Studio
      </span>
    </div>
  );
}
