import { notFound } from "next/navigation";
import { documents } from "./source";
import Link from "next/link";
import { SVGAttributes } from "react";

function Logo(props: SVGAttributes<SVGSVGElement>): JSX.Element {
  return (
    <svg width="360" height="360" viewBox="0 0 360 360" {...props}>
      <path
        d="M340 180C340 268.366 268.366 340 180 340C91.6344 340 20 268.366 20 180C20 91.6344 91.6344 20 180 20C180 221 340 91.6344 340 180Z"
        fill="url(#paint0_radial_89_18)"
      />
      <defs>
        <radialGradient
          id="paint0_radial_89_18"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(20 35) rotate(45) scale(364)"
        >
          <stop offset="0.5" stopColor="#CC00FF" />
          <stop offset="1" stopColor="#B3FFF6" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export default function Page(): JSX.Element {
  const document = documents.find((d) => d.file === "content/index.mdx");

  if (!document) notFound();
  return (
    <main className="container p-6 mx-auto max-w-[800px]">
      <nav className="flex flex-row items-center text-sm mb-8 rounded-full border border-neutral-800 p-4 -mx-4 bg-gradient-to-t from-neutral-800">
        <Link href="/" className="inline-flex items-center font-medium">
          <Logo className="size-5 mr-2" />
          Fuma Content
        </Link>
        <a
          href="https://github.com/fuma-nama/fuma-content"
          rel="noreferrer noopener"
          className="transition-colors ml-auto hover:text-neutral-400"
          aria-label="Github"
        >
          <svg role="img" viewBox="0 0 24 24" className="size-5">
            <path
              fill="currentColor"
              d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
            />
          </svg>
        </a>
      </nav>
      <article className="prose max-w-none prose-sm prose-invert prose-pre:border prose-pre:border-neutral-800 prose-pre:bg-gradient-to-t prose-pre:from-neutral-900 prose-pre:to-neutral-950">
        <document.renderer />
      </article>
    </main>
  );
}
