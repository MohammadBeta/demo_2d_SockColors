export default function LogoSelector({ logos, activeLogo, logoColor, onAddLogo, onLogoSelect }) {
  const handleDragStart = (event, logo) => {
    const logoData = { ...logo, color: logoColor };
    event.dataTransfer.setData('application/json', JSON.stringify(logoData));
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Logos</h2>
          <p className="mt-1 text-sm text-slate-500">Drag onto the sock or click to add</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {logos.map((logo) => (
          <button
            key={logo.id}
            className={`group flex aspect-square items-center justify-center rounded-lg border bg-slate-50 p-3 transition hover:border-teal-700 hover:bg-teal-50 ${
              activeLogo?.id === logo.id ? 'border-teal-700' : 'border-slate-200'
            }`}
            draggable
            type="button"
            onClick={() => {
              onLogoSelect(logo);
              onAddLogo(logo);
            }}
            onDragStart={(event) => handleDragStart(event, logo)}
          >
            <img
              alt={logo.name}
              className="h-full w-full object-contain transition group-hover:scale-105"
              draggable="false"
              src={logo.src}
            />
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
        Use the Fabric.js handles on the canvas to move, scale, and rotate logo objects.
      </div>
    </section>
  );
}
