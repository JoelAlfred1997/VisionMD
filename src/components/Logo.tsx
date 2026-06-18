/** Compact VisionMD logo: a document sheet with an eye — "view markdown". */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      role="img"
    >
      {/* document sheet */}
      <rect
        x="5"
        y="3"
        width="22"
        height="26"
        rx="4"
        fill="var(--accent)"
        opacity="0.12"
      />
      <rect
        x="5"
        y="3"
        width="22"
        height="26"
        rx="4"
        stroke="var(--accent)"
        strokeWidth="1.6"
      />
      {/* eye */}
      <path
        d="M9.5 16c2-3.2 4.4-4.8 6.5-4.8s4.5 1.6 6.5 4.8c-2 3.2-4.4 4.8-6.5 4.8S11.5 19.2 9.5 16Z"
        stroke="var(--accent)"
        strokeWidth="1.6"
        fill="none"
      />
      <circle cx="16" cy="16" r="2.1" fill="var(--accent)" />
    </svg>
  );
}
