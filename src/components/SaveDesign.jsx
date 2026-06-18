export default function SaveDesign({ onSave }) {
  return (
    <button
      className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
      type="button"
      onClick={onSave}
    >
      Save PNG
    </button>
  );
}
