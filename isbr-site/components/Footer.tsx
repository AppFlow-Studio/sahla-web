import { site, fullAddress } from "@/config/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="wrap">
        <p className="site-footer__legal">
          &copy; {year} {site.legalName} All rights reserved.
        </p>
        <p>
          {fullAddress} &middot; <a href={`tel:${site.phone}`}>{site.phoneDisplay}</a>{" "}
          &middot;{" "}
          <a href={site.facebookUrl} target="_blank" rel="noreferrer">
            Facebook
          </a>
        </p>
        <div className="site-footer__links">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>
        <p className="site-footer__credit">
          Website provided by{" "}
          <a href="https://sahla.co" target="_blank" rel="noreferrer">
            Sahla
          </a>
        </p>
      </div>
    </footer>
  );
}
