interface ColorSwatchesProps {
  colors: string[];
  size?: 'sm' | 'md';
  showHex?: boolean;
}

export function ColorSwatches({ colors, size = 'md', showHex = true }: ColorSwatchesProps) {
  const swatchSize = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const validColors = colors.filter((c) => /^#[0-9a-fA-F]{3,8}$/.test(c));

  if (!validColors.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {validColors.map((hex, i) => (
        <div
          key={`${hex}-${i}`}
          className="flex items-center gap-1.5 rounded-full border border-cream-200 bg-white pl-1 pr-3 py-1"
          title={hex}
        >
          <span
            className={`${swatchSize} rounded-full border border-black/5 shadow-inner`}
            style={{ backgroundColor: hex }}
            aria-label={`Color ${hex}`}
          />
          {showHex && (
            <span className="font-mono text-[11px] uppercase text-forest-600">{hex}</span>
          )}
        </div>
      ))}
    </div>
  );
}
