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
  return (
    <Image
      src={src as string}
      alt={alt ?? ""}
      width={1200}
      height={630}
      sizes="100vw"
      style={{ width: "100%", height: "auto" }}
      {...props}
    />
  );
}

export const mdxComponents: MDXComponents = {
  a: MdxLink,
  img: MdxImage,
};
