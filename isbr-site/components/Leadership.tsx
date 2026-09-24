import { site } from "@/config/site";

export default function Leadership() {
  return (
    <section className="section leadership" id="leadership">
      <div className="wrap">
        <div className="section-head--split">
          <div>
            <span className="label">Leadership</span>
            <h2 className="section-heading">Serving the community.</h2>
          </div>
          <div className="leadership__card">
            <span className="leadership__avatar" aria-hidden="true">
              Portrait
            </span>
            <div>
              <p className="leadership__name">{site.boardMemberName}</p>
              <p className="leadership__title">{site.boardMemberTitle}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
