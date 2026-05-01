// Sahla Email Template
// Matches the app's design: dark green, sand, gold, clean sans-serif
// Mobile-hardened + Gmail dark mode resistant

const LOGO_URL = "https://www.sahla.co/sahla-logo.png";

// Exact colors from globals.css
const c = {
  green: "#0A261E",
  sand: "#fffbf2",
  sandMuted: "rgba(255, 251, 242, 0.55)",
  white: "#ffffff",
  gold: "#B8922A",
  accent: "#1a6b42",
  subtle: "rgba(10, 38, 30, 0.55)",
  faint: "rgba(10, 38, 30, 0.3)",
  edge: "rgba(10, 38, 30, 0.08)",
};

const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif";

export function sahlaEmailHtml({
  body,
  preheader,
}: {
  body: string;
  preheader?: string;
}) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>Sahla</title>
  <!--[if mso]>
  <style>table,td,p,a,span{font-family:'Segoe UI',Helvetica,Arial,sans-serif!important;}</style>
  <![endif]-->
  <style>
    :root { color-scheme: light only; }
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    /* Prevent Gmail dark mode color inversion */
    [data-ogsc] body, [data-ogsc] table, [data-ogsc] td { background-color: ${c.sand} !important; }
    [data-ogsc] .dark-bg { background-color: ${c.sand} !important; }
    u + .body { background-color: ${c.sand} !important; }
    @media (prefers-color-scheme: dark) {
      .dark-bg { background-color: ${c.sand} !important; }
      body { background-color: ${c.sand} !important; }
    }
    @media only screen and (max-width: 620px) {
      .email-card { width: 100% !important; border-radius: 0 !important; }
      .email-body { padding-left: 24px !important; padding-right: 24px !important; }
      .email-footer { padding-left: 24px !important; padding-right: 24px !important; }
    }
  </style>
</head>
<body class="body" style="margin:0;padding:0;background-color:${c.sand};">
  ${preheader ? `<div style="display:none;font-size:1px;color:${c.sand};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}${"&zwnj;&nbsp;".repeat(30)}</div>` : ""}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="dark-bg" bgcolor="${c.sand}" style="background-color:${c.sand};min-width:100%;">
  <tr>
  <td align="center" valign="top" bgcolor="${c.sand}" style="background-color:${c.sand};">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;" align="center">

    <!-- Logo -->
    <tr>
      <td align="center" style="padding:48px 16px 28px;">
        <img src="${LOGO_URL}" alt="Sahla" width="120" height="120" style="display:block;width:120px;height:auto;border:0;outline:none;" />
      </td>
    </tr>

    <!-- Card -->
    <tr>
      <td align="center" style="padding:0 12px;">
        <!--[if mso]>
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" align="center" style="width:560px;"><tr><td style="background-color:${c.white};padding:0;">
        <![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-card" bgcolor="${c.white}" style="max-width:560px;width:100%;background-color:${c.white};border-radius:16px;overflow:hidden;">

          <!-- Body -->
          <tr>
            <td class="email-body" style="padding:40px 36px 0;font-family:${sans};font-size:15px;line-height:1.7;color:${c.green};">
              ${body}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td class="email-body" style="padding:36px 36px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:1px;font-size:1px;line-height:1px;background-color:${c.edge};">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tagline + Signature -->
          <tr>
            <td align="center" class="email-body" style="padding:28px 36px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;line-height:1.55;color:${c.subtle};padding-bottom:20px;">
                    <em style="font-style:italic;color:${c.green};">Sahla</em> means <em style="font-style:italic;color:${c.green};">&ldquo;easy&rdquo;</em> in Arabic. That&rsquo;s the whole point.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family:'Brush Script MT','Segoe Script','Apple Chancery',cursive;font-size:28px;line-height:1.3;color:${c.green};padding-bottom:6px;">The Sahla Team</td>
                </tr>
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        <td width="120" height="1" bgcolor="${c.gold}" style="width:120px;height:1px;font-size:1px;line-height:1px;background-color:${c.gold};">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:12px;font-family:${sans};font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:${c.faint};">New York &middot; 2026</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td align="center" class="email-footer" style="padding:24px 16px 48px;font-family:${sans};font-size:11px;color:${c.subtle};">
        <a href="https://www.sahla.co" style="color:${c.green};text-decoration:none;">sahla.co</a>
        &nbsp;&nbsp;&middot;&nbsp;&nbsp;
        <a href="mailto:info@sahla.co" style="color:${c.green};text-decoration:none;">info@sahla.co</a>
      </td>
    </tr>
  </table>

  </td>
  </tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
