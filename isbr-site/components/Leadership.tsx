import { site } from "@/config/site";

export default function Leadership() {
  return (
    <section className="section leadership" id="leadership">
      <div className="wrap">
        <span className="label">Leadership</span>
        <h2 className="section-heading">Leadership</h2>
        <p className="leadership__name">{site.boardMemberName}</p>
        <p className="leadership__title">{site.boardMemberTitle}</p>
      </div>
    </section>
  );
}
