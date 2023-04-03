// icon:arrows-alt | Ant Design Icons https://ant.design/components/icon/ | Ant Design
import * as React from "react";

function IconArrowsAlt(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
    viewBox="0 0 64 64"
    fill="currentColor"
    height="1em"
    width="1em"
    {...props}
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeMiterlimit={10}
      strokeWidth={2}
      d="M0 40h64M0 32h64M0 24h64"
    />
    </svg>
  );
}

export default IconArrowsAlt;
