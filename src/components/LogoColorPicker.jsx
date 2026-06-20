const colorPresets = ['#000000', '#dc2626', '#2563eb', '#16a34a', '#f59e0b', '#111827', '#f8fafc'];

export default function LogoColorPicker({ logoColor, onLogoColorChange }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div>
        <h2 className="text-base font-semibold text-slate-950">Logo Color</h2>
        <p className="mt-1 text-sm text-slate-500">Choose a color from the palette</p>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-2">
        {colorPresets.map((preset) => (
          <button
            key={preset}
            aria-label={`Use ${preset}`}
            className={`h-9 rounded-md border transition-all ${
              preset.toLowerCase() === logoColor.toLowerCase()
                ? 'border-slate-950 ring-2 ring-slate-950/10'
                : 'border-slate-200 hover:border-slate-300'
            }`}
            style={{ backgroundColor: preset }}
            type="button"
            onClick={() => onLogoColorChange(preset)}
          />
        ))}
      </div>

      <div className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
        Select a logo and apply color from the palette above.
      </div>
    </section>
  );
}
