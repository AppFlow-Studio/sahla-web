import { site, fullAddress } from "@/config/site";

export default function Contact() {
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    `${site.legalName} ${fullAddress}`
  )}&output=embed`;

  return (
    <section className="section section--green" id="contact">
      <div className="wrap">
        <div className="section-head section-head--contact">
          <span className="label label--on-dark">Visit Us</span>
          <h2 className="section-heading">{site.legalName}</h2>
        </div>
        <div className="contact__grid">
          <div className="contact__fields">
            <div className="contact__row">
              <div className="contact__block">
                <span className="contact__label">Address</span>
                <p className="contact__value">
                  {site.streetAddress}
                  <br />
                  {site.city}, {site.state} {site.postalCode}
                </p>
              </div>
              <div className="contact__block">
                <span className="contact__label">Phone</span>
                <p className="contact__value">
                  <a href={`tel:${site.phone}`}>{site.phoneDisplay}</a>
                </p>
              </div>
            </div>
            <div className="contact__row">
              <div className="contact__block">
                <span className="contact__label">Email</span>
                <p className="contact__value">
                  <a href={`mailto:${site.email}`}>{site.email}</a>
                </p>
              </div>
              <div className="contact__block">
                <span className="contact__label">Follow</span>
                <p className="contact__value">
                  <a href={site.facebookUrl} target="_blank" rel="noreferrer">
                    Facebook
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div className="map-frame">
            <iframe
              src={mapSrc}
              title={`Map of ${site.commonName}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
