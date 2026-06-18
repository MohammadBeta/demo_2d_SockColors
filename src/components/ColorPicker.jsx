const presets = ['#dc2626', '#2563eb', '#16a34a', '#f59e0b', '#111827', '#f8fafc'];

export default function ColorPicker({ color, opacity, onColorChange, onOpacityChange }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        {/* <div>
          <h2 className="text-base font-semibold text-slate-950">Sock Color</h2>
          <p className="mt-1 text-sm text-slate-500">Works on dark and light images</p>
        </div> */}
        {/* <input
          className="h-10 w-12 cursor-pointer rounded border border-slate-200 bg-white p-1"
          type="color"
          value={color}
          onChange={(event) => onColorChange(event.target.value)}
        /> */}
      </div>

      <div className="mt-4 grid grid-cols-6 gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            aria-label={`Use ${preset}`}
            className={`h-9 rounded-md border ${
              preset.toLowerCase() === color.toLowerCase()
                ? 'border-slate-950 ring-2 ring-slate-950/10'
                : 'border-slate-200'
            }`}
            style={{ backgroundColor: preset }}
            type="button"
            onClick={() => onColorChange(preset)}
          />
        ))}
      </div>

      <label className="mt-5 block text-sm font-medium text-slate-700" htmlFor="opacity">
        Color strength: {Math.round(opacity * 100)}%
      </label>
      <input
        id="opacity"
        className="mt-2 w-full accent-teal-700"
        max="1"
        min="0"
        step="0.05"
        type="range"
        value={opacity}
        onChange={(event) => onOpacityChange(Number(event.target.value))}
      />
    </section>
  );
}
