"use client";
import { useId, type ComponentProps } from "react";

export function Logo(props: ComponentProps<"svg">) {
  const id = useId();
  return (
    <svg viewBox="0 0 360 360" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="180.5" cy="180.5" r="141.5" fill={`url(#${id}_linear_604_85)`} />
      <path
        d="M347.698 136.733C51.6985 -131.267 276.064 296.733 187.699 296.733C99.333 296.733 111.199 129.366 111.199 41C98.1985 121.5 -48.1663 319.5 40.1992 319.5C150.699 319.5 134.699 21 347.698 136.733Z"
        fill={`url(#${id}_radial_604_85)`}
      />
      <defs>
        <linearGradient
          id={`${id}_linear_604_85`}
          x1="180.5"
          y1="39"
          x2="180.5"
          y2="322"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#A79EFF" />
          <stop offset="1" stopColor="#4434DA" />
        </linearGradient>
        <radialGradient
          id={`${id}_radial_604_85`}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(27.6988 -8.15656) rotate(45.4948) scale(363.938 363.938)"
        >
          <stop offset="0.513102" stopColor="white" />
          <stop offset="1" stopColor="#6AFFED" />
        </radialGradient>
      </defs>
    </svg>
  );
}
