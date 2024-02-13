import type { SVGAttributes } from "react";

export function Logo(props: SVGAttributes<SVGSVGElement>): JSX.Element {
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
