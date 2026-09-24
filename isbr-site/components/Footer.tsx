import { site } from "@/config/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="wrap site-footer__bar">
        <p className="site-footer__legal">
          &copy; {year} {site.legalName} All rights reserved.
        </p>
        <div className="site-footer__right">
          <div className="site-footer__links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Use</a>
          </div>
          <p className="site-footer__credit">
            Website provided by{" "}
            <a href="https://sahla.co" target="_blank" rel="noreferrer">
              Sahla
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
