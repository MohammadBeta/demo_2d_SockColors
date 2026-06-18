import { useEffect, useRef, useState } from 'react';
import ShoeCanvas from './components/ShoeCanvas.jsx';
import ColorPicker from './components/ColorPicker.jsx';
import LogoSelector from './components/LogoSelector.jsx';
import ProductImagePicker from './components/ProductImagePicker.jsx';
import SaveDesign from './components/SaveDesign.jsx';

const logos = [
  { id: 'spark', name: 'Spark', src: '/assets/logo-spark.png' },
  { id: 'bolt', name: 'Bolt', src: '/assets/logo-bolt.png' },
  { id: 'wave', name: 'Wave', src: '/assets/logo-wave.png' }
];

export default function App() {
  const canvasRef = useRef(null);
  const uploadedUrlRef = useRef(null);
  const [shoeColor, setShoeColor] = useState('#dc2626');
  const [opacity, setOpacity] = useState(1);
  const [activeLogo, setActiveLogo] = useState(logos[0]);
  const [productSrc, setProductSrc] = useState('/assets/shoe.png');
  const [productName, setProductName] = useState('Sample sock image');

  useEffect(() => {
    return () => {
      if (uploadedUrlRef.current) {
        URL.revokeObjectURL(uploadedUrlRef.current);
      }
    };
  }, []);

  const addLogo = (logo, position) => {
    canvasRef.current?.addLogo(logo.src, position);
    setActiveLogo(logo);
  };

  const saveDesign = () => {
    const dataUrl = canvasRef.current?.exportPng();

    if (!dataUrl) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'sock-design.png';
    link.click();
  };

  const handleProductChange = (file) => {
    if (uploadedUrlRef.current) {
      URL.revokeObjectURL(uploadedUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(file);
    uploadedUrlRef.current = nextUrl;
    setProductSrc(nextUrl);
    setProductName(file.name);
  };

  const resetProductImage = () => {
    if (uploadedUrlRef.current) {
      URL.revokeObjectURL(uploadedUrlRef.current);
      uploadedUrlRef.current = null;
    }

    setProductSrc('/assets/shoe.png');
    setProductName('Sample sock image');
  };

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-5 lg:px-6">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {/* <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
              Canvas 2D Studio
            </p> */}
            {/* <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              Sock Customizer
            </h1> */}
          </div>
          <SaveDesign onSave={saveDesign} />
        </header>

        <section className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ShoeCanvas
            ref={canvasRef}
            productSrc={productSrc}
            color={shoeColor}
            opacity={opacity}
          />

          <aside className="flex flex-col gap-4">
            {/* <ProductImagePicker
              productName={productName}
              onProductChange={handleProductChange}
              onReset={resetProductImage}
            /> */}
            <ColorPicker
              color={shoeColor}
              opacity={opacity}
              onColorChange={setShoeColor}
              onOpacityChange={setOpacity}
            />
            {/* <LogoSelector logos={logos} activeLogo={activeLogo} onAddLogo={addLogo} /> */}
          </aside>
        </section>
      </div>
    </main>
  );
}
