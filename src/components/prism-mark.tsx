import type { SVGProps } from "react";

/** The Prismy mark: a prism splitting one beam into three bars. */
export function PrismMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden {...props}>
      <path
        d="M32 12 L52 46 L12 46 Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M6 32 H24"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M40 30 L58 22"
        stroke="var(--chart-1)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M41 35 L58 33"
        stroke="var(--chart-3)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M40 40 L58 44"
        stroke="var(--chart-2)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
