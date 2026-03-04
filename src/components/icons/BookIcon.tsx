import React from "react";

interface BookIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const BookIcon = ({ className, ...props }: BookIconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className={className} {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M96 0C43 0 0 43 0 96V416c0 53 43 96 96 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32V384c17.7 0 32-14.3 32-32V32c0-17.7-14.3-32-32-32H96zm288 64H96c-17.7 0-32 14.3-32 32v230.1c10.2-3.9 21.5-6.1 33.3-6.1H384V64zm0 320H96c-17.7 0-32 14.3-32 32s14.3 32 32 32H384V384zM128 152c0-13.3 10.7-24 24-24H320c13.3 0 24 10.7 24 24s-10.7 24-24 24H152c-13.3 0-24-10.7-24-24zm24 72H320c13.3 0 24 10.7 24 24s-10.7 24-24 24H152c-13.3 0-24-10.7-24-24s10.7-24 24-24z"
    />
  </svg>
);
