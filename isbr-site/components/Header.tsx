import { site } from "@/config/site";

export default function Header() {
  return (
    <header className="site-header">
      <div className="wrap site-header__inner">
        <div className="site-header__brand">
          <span className="site-header__logo" aria-hidden="true">
            {site.shortName}
          </span>
          <div>
            <p className="site-header__title">{site.commonName}</p>
            <p className="site-header__subtitle">
              {site.city} &middot; Est. {site.foundedYear}
            </p>
          </div>
        </div>
        <div className="site-header__contact">
          <span>
            {site.streetAddress}, {site.city}
          </span>
          <a href={`tel:${site.phone}`}>{site.phoneDisplay}</a>
        </div>
      </div>
    </header>
  );
}
