export function PatterHeaderH1({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={className}
      style={{
        fontFamily: "Montserrat, serif",
        fontSize: 40,
        lineHeight: 48,
        letterSpacing: "normal",
        fontWeight: 600,
        height: 48,
      }}
    >
      {title || "PatterHeaderH1"}
    </div>
  );
}
