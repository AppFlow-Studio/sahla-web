import Link from "next/link";
import Image from "next/image";
import type { MDXComponents } from "mdx/types";
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from "react";

function MdxLink({ href = "", children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}

function MdxImage({ src, alt, width, height, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  if (!src || typeof src !== "string") return null;
  // `width`/`height` are destructured away deliberately: next/image wants
  // numbers, and an MDX-authored `width="400"` string would fight the
  // intrinsic size set below. Everything else the author wrote is spread
  // FIRST so this component's sizing props always win over markdown
  // attributes rather than being silently overridden by them.
  return (
    <Image
      {...props}
      src={src}
      alt={alt ?? ""}
      width={1200}
      height={630}
      sizes="100vw"
      style={{ width: "100%", height: "auto" }}
    />
  );
}

export const mdxComponents: MDXComponents = {
  a: MdxLink,
  img: MdxImage,
};
