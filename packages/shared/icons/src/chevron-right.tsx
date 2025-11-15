import type { JSX } from "react";
import type { IconProps } from "./types";

export const ChevronRightIcon = ({
  title,
  ...props
}: IconProps): JSX.Element => {
  return (
    <svg
      height="18"
      strokeWidth="1.5"
      viewBox="0 0 18 18"
      width="18"
      {...props}
    >
      {title && <title>{title}</title>}
      <g>
        <path d="M13.28 8.46999L7.03 2.21999C6.737 1.92699 6.262 1.92699 5.969 2.21999C5.676 2.51299 5.676 2.98803 5.969 3.28103L11.689 9.001L5.969 14.721C5.676 15.014 5.676 15.489 5.969 15.782C6.115 15.928 6.307 16.002 6.499 16.002C6.691 16.002 6.883 15.929 7.029 15.782L13.279 9.53201C13.572 9.23901 13.572 8.76403 13.279 8.47103L13.28 8.46999Z" />
      </g>
    </svg>
  );
};
