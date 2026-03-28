import { ReactNode } from "react";

export default function IPhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-[280px] select-none">
      {/* Outer bezel */}
      <div
        className="relative overflow-hidden rounded-[3rem] border-[3px] border-[#1a2e22] bg-[#060d09]"
        style={{
          aspectRatio: "9 / 19.5",
          boxShadow:
            "0 0 0 1px rgba(74,140,101,0.15), 0 20px 60px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,0,0,0.3)",
        }}
      >
        {/* Dynamic Island */}
        <div className="absolute top-3 left-1/2 z-20 h-[28px] w-[100px] -translate-x-1/2 rounded-full bg-black" />

        {/* Screen content */}
        <div className="absolute inset-[3px] overflow-hidden rounded-[2.7rem] bg-[#0a1410]">
          {children}
        </div>

        {/* Screen glass reflection */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[2.7rem]"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, transparent 50%)",
          }}
        />
      </div>
    </div>
  );
}
