import type { JSX } from "react";
import type { IconProps } from "./types";

export const SendMessageIcon = ({
  title,
  ...props
}: IconProps): JSX.Element => {
  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      strokeWidth="1.5"
      {...props}
    >
      {title && <title>{title}</title>}
      <g>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13.75 2.75H4.25C3.145 2.75 2.25 3.645 2.25 4.75V16.25L6 13.25H10C10 12.0074 11.0074 11 12.25 11H12.5138C12.4409 10.344 12.656 9.66204 13.159 9.15901C13.86 8.45801 14.9085 8.31626 15.75 8.73375V4.75C15.75 3.645 14.855 2.75 13.75 2.75Z"
          fillOpacity="0.3"
          stroke="currentColor"
          strokeOpacity="0.3"
        />
        <path
          d="M14.75 10.75L17.25 13.25L14.75 15.75"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M15.75 8.464V4.75C15.75 3.646 14.855 2.75 13.75 2.75H4.25C3.145 2.75 2.25 3.646 2.25 4.75V16.25L6 13.25H9.75"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M17.25 13.25H12.25"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
};
