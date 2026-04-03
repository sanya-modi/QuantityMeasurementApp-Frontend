type BalanceLogoProps = {
  className?: string;
};

export function BalanceLogo({ className = "" }: BalanceLogoProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="256"
        cy="256"
        r="230"
        stroke="#FFFFFF"
        strokeWidth="12"
        fill="#FFFFFF"
        fillOpacity="0.1"
        strokeDasharray="25 15"
      />

      <g transform="translate(181 181)">
        <circle cx="75" cy="75" r="75" fill="#3B82F6" />
        <path
          d="M45 60H105L95 50M105 60L95 70"
          stroke="#FFFFFF"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M105 90H45L55 80M45 90L55 100"
          stroke="#FFFFFF"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      <g transform="translate(70 70)">
        <rect x="25" y="10" width="20" height="70" rx="10" stroke="#EF4444" strokeWidth="6" fill="#FFFFFF" />
        <circle cx="35" cy="85" r="20" stroke="#EF4444" strokeWidth="6" fill="#FFFFFF" />
        <rect x="30" y="20" width="10" height="50" rx="5" fill="#EF4444" />
        <circle cx="35" cy="85" r="10" fill="#EF4444" />
      </g>

      <g transform="translate(370 70)">
        <rect x="10" y="30" width="100" height="30" rx="5" stroke="#F59E0B" strokeWidth="6" fill="#FFFFFF" />
        <line x1="30" y1="30" x2="30" y2="45" stroke="#F59E0B" strokeWidth="4" />
        <line x1="50" y1="30" x2="50" y2="45" stroke="#F59E0B" strokeWidth="4" />
        <line x1="70" y1="30" x2="70" y2="45" stroke="#F59E0B" strokeWidth="4" />
        <line x1="90" y1="30" x2="90" y2="45" stroke="#F59E0B" strokeWidth="4" />
      </g>

      <g transform="translate(70 370)">
        <path
          d="M20 10H80L70 90H30Z"
          stroke="#10B981"
          strokeWidth="6"
          fill="#FFFFFF"
          strokeLinejoin="round"
        />
        <line x1="25" y1="30" x2="50" y2="30" stroke="#10B981" strokeWidth="4" />
        <line x1="28" y1="50" x2="50" y2="50" stroke="#10B981" strokeWidth="4" />
        <line x1="31" y1="70" x2="50" y2="70" stroke="#10B981" strokeWidth="4" />
        <path d="M31 70H69L67 90H33Z" fill="#10B981" fillOpacity="0.5" />
      </g>

      <g transform="translate(370 370)">
        <path
          d="M10 90H100L80 10H30Z"
          stroke="#8B5CF6"
          strokeWidth="6"
          fill="#FFFFFF"
          strokeLinejoin="round"
        />
        <text
          x="55"
          y="65"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fontSize="36"
          fill="#8B5CF6"
          textAnchor="middle"
        >
          kg
        </text>
      </g>

      <g stroke="#FFFFFF" strokeWidth="4" strokeDasharray="10 5">
        <line x1="140" y1="140" x2="190" y2="190" />
        <line x1="372" y1="140" x2="322" y2="190" />
        <line x1="140" y1="372" x2="190" y2="322" />
        <line x1="372" y1="372" x2="322" y2="322" />
      </g>
    </svg>
  );
}
