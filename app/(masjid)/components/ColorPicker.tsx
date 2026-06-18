"use client";

import { HexColorPicker, HexColorInput } from "react-colorful";

type Props = {
  /** Current hex color, e.g. "#0A261E". */
  value: string;
  /** Fires with a "#"-prefixed hex whenever the color changes. */
  onChange: (color: string) => void;
  /** Shown in the hex input before a value exists. */
  placeholder?: string;
};

/**
 * Always-visible visual color picker: a saturation/value square + hue slider
 * with a hex field beneath it. Wraps react-colorful (already a project
 * dependency) so onboarding admins can drag to a color instead of guessing
 * hex codes. Edits apply live (the phone preview updates as you drag).
 *
 * Emits "#RRGGBB" to match the format stored on `mosques.brand_color` /
 * `accent_color` — no alpha channel, since those colors are used solid (and
 * string-concatenated for tints elsewhere).
 */
export default function ColorPicker({ value, onChange, placeholder }: Props) {
  return (
    <div className="w-[200px] shrink-0">
      <HexColorPicker
        color={value}
        onChange={onChange}
        style={{ width: "100%", height: 160 }}
      />
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] font-mono text-stone-400">
          #
        </span>
        <HexColorInput
          color={value}
          onChange={onChange}
          prefixed={false}
          placeholder={placeholder?.replace(/^#/, "")}
          className="w-full rounded-lg border border-stone-200 bg-white py-1.5 pl-5 pr-2.5 text-[12px] font-mono uppercase text-stone-700 outline-none focus:border-stone-400"
        />
      </div>
    </div>
  );
}
