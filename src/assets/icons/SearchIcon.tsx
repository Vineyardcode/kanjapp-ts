import * as React from "react";

function IconSearchLoading(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" height="1em" width="1em" {...props}>
      <path
        fill="currentColor"
        d="M8.55 10.55a1 1 0 11-2 0 1 1 0 012 0zM10.55 11.55a1 1 0 100-2 1 1 0 000 2zM13.55 11.55a1 1 0 100-2 1 1 0 000 2z"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M16.207 4.893a8.001 8.001 0 01.662 10.565c.016.013.03.027.045.042l4.243 4.243a1 1 0 01-1.414 1.414L15.5 16.914a.933.933 0 01-.042-.045A8.001 8.001 0 014.893 4.893a8 8 0 0111.314 0zm-9.9 9.9a6 6 0 108.486-8.485 6 6 0 00-8.485 8.485z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default IconSearchLoading;