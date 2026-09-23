import Image from "next/image";
import { site } from "@/config/site";

export default function Header() {
  return (
    <header className="site-header">
      <div className="wrap site-header__inner">
        <Image
          src="/logo.png"
          alt={`${site.shortName} logo`}
          className="site-header__logo"
          width={44}
          height={44}
          data-placeholder="true" // PLACEHOLDER
        />
        <span className="site-header__name">{site.commonName}</span>
      </div>
    </header>
  );
}
