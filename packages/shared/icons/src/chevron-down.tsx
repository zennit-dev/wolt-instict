import type { JSX } from "react";
import type { IconProps } from "./types";

export const ChevronDownIcon = ({
  title,
  ...props
}: IconProps): JSX.Element => {
  return (
    <svg height="12" width="12" viewBox="0 0 12 12" strokeWidth="0" {...props}>
      {title && <title>{title}</title>}
      <g>
        <path d="m6,9.25c-.192,0-.384-.073-.53-.22L1.22,4.78c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.72,3.72,3.72-3.72c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-4.25,4.25c-.146.146-.338.22-.53.22Z" />
      </g>
    </svg>
  );
};
