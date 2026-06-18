export default function ProductImagePicker({ productName, onProductChange, onReset }) {
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;
    onProductChange(file);
    event.target.value = '';
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div>
        <h2 className="text-base font-semibold text-slate-950">Sock Image</h2>
        <p className="mt-1 text-sm text-slate-500">PNG, JPG, WebP, any color and size</p>
      </div>

      <label
        className="mt-4 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-sm text-slate-600 transition hover:border-teal-700 hover:bg-teal-50"
        htmlFor="product-image"
      >
        <span className="font-medium text-slate-800">Choose image</span>
        <span className="mt-1 max-w-full truncate">{productName}</span>
      </label>
      <input
        id="product-image"
        accept="image/*"
        className="hidden"
        type="file"
        onChange={handleFileChange}
      />

      <button
        className="mt-3 h-10 w-full rounded-md border border-slate-200 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-800"
        type="button"
        onClick={onReset}
      >
        Reset Sample
      </button>
    </section>
  );
}
