interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function Logo({ size = 'md', showTagline = false }: LogoProps) {
  const sizeClass =
    size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-2xl';
  return (
    <div className="inline-flex flex-col items-center text-center">
      <div className={`font-display font-semibold tracking-tight text-forest-700 ${sizeClass}`}>
        sakevo
        <span className="text-forest-400 font-normal">.app</span>
      </div>
      {showTagline && (
        <div className="mx-auto mt-1 text-[11px] uppercase tracking-[0.18em] text-forest-500">
          Upcycle · Restore · Transform
        </div>
      )}
    </div>
  );
}
