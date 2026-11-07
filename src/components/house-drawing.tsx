/** Decorative line drawing of a house elevation. It draws itself once on page load. */
export function HouseDrawing({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 230"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path className="trace" d="M20 190H340" />
      <path className="trace" d="M70 190V100H290V190" />
      <path className="trace" d="M52 102L180 38L308 102" />
      <path className="trace" d="M165 190V138H195V190" />
      <path className="trace" d="M92 122H140V158H92Z M116 122V158 M92 140H140" />
      <path className="trace" d="M220 122H268V158H220Z M244 122V158 M220 140H268" />
      <path d="M70 208H290 M70 201V215 M290 201V215" strokeDasharray="3 4" opacity=".7" />
    </svg>
  );
}
