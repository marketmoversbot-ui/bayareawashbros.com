// Brand mark — water droplet on sky-blue circle.
// Matches the PWA admin icon so brand identity is consistent across
// the public site and the admin app. Renders as inline SVG so it
// scales crisply and doesn't depend on any image asset.
type Props = {
  size?: number;
};
export default function BrandMark({ size = 40 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Bay Area Wash Bros logo"
      style={{ display: "block" }}
    >
      <circle cx="50" cy="50" r="48" fill="#0EA5E9" />
      {/* Water droplet: rounded teardrop, yellow to pop on white header */}
      <path
        d="M50 18 L66 56 A18 18 0 1 1 34 56 Z"
        fill="#FACC15"
      />
    </svg>
  );
}
