/**
 * Pick a readable foreground (light or dark) for text/icons placed on top of an
 * arbitrary background color. Uses WCAG relative luminance so a mosque can set
 * any brand color and its sidebar text stays legible.
 *
 * Returns `light` for dark backgrounds and `dark` for light backgrounds.
 * Unparseable input falls back to `light` (assumes a dark surface).
 */
export function readableForeground(
  color: string,
  { dark = "#0A261E", light = "#fffbf2" }: { dark?: string; light?: string } = {}
): string {
  const hex = color.trim().replace(/^#/, "");
  let r: number, g: number, b: number;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    return light;
  }
  if ([r, g, b].some((n) => Number.isNaN(n))) return light;

  const [rl, gl, bl] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
  return luminance > 0.5 ? dark : light;
}
