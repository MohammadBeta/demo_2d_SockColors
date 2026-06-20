import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { fabric } from 'fabric';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 560;
const PRODUCT_MAX_WIDTH = 804;
const PRODUCT_MAX_HEIGHT = 464;
const MAX_PROCESS_DIMENSION = 1800;

function clamp(value, min = 0, max = 255) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '');
  const value = Number.parseInt(cleanHex, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function loadBrowserImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    if (!src.startsWith('blob:') && !src.startsWith('data:')) {
      image.crossOrigin = 'anonymous';
    }

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load image: ${src}`));
    image.src = src;
  });
}

function removeLightEdgeBackground(data, width, height) {
  const cornerSamples = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1]
  ];
  let sampleCount = 0;
  let backgroundR = 0;
  let backgroundG = 0;
  let backgroundB = 0;

  cornerSamples.forEach(([x, y]) => {
    const offset = (y * width + x) * 4;

    if (data[offset + 3] < 240) return;

    backgroundR += data[offset];
    backgroundG += data[offset + 1];
    backgroundB += data[offset + 2];
    sampleCount += 1;
  });

  if (sampleCount === 0) return;

  backgroundR /= sampleCount;
  backgroundG /= sampleCount;
  backgroundB /= sampleCount;

  const backgroundLuminance = backgroundR * 0.299 + backgroundG * 0.587 + backgroundB * 0.114;

  if (backgroundLuminance < 210) return;

  const totalPixels = width * height;
  const visited = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let readIndex = 0;
  let writeIndex = 0;
  const toleranceSquared = 72 * 72;

  const isBackgroundLike = (pixelIndex) => {
    const offset = pixelIndex * 4;
    const deltaR = data[offset] - backgroundR;
    const deltaG = data[offset + 1] - backgroundG;
    const deltaB = data[offset + 2] - backgroundB;

    return data[offset + 3] > 0 && deltaR * deltaR + deltaG * deltaG + deltaB * deltaB < toleranceSquared;
  };

  const pushPixel = (pixelIndex) => {
    if (visited[pixelIndex] || !isBackgroundLike(pixelIndex)) return;

    visited[pixelIndex] = 1;
    queue[writeIndex] = pixelIndex;
    writeIndex += 1;
  };

  for (let x = 0; x < width; x += 1) {
    pushPixel(x);
    pushPixel((height - 1) * width + x);
  }

  for (let y = 0; y < height; y += 1) {
    pushPixel(y * width);
    pushPixel(y * width + width - 1);
  }

  while (readIndex < writeIndex) {
    const pixelIndex = queue[readIndex];
    readIndex += 1;

    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    data[pixelIndex * 4 + 3] = 0;

    if (x > 0) pushPixel(pixelIndex - 1);
    if (x < width - 1) pushPixel(pixelIndex + 1);
    if (y > 0) pushPixel(pixelIndex - width);
    if (y < height - 1) pushPixel(pixelIndex + width);
  }
}

async function createRecoloredProductDataUrl(src, color, strength) {
  const image = await loadBrowserImage(src);
  const processScale = Math.min(
    1,
    MAX_PROCESS_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight)
  );
  const width = Math.max(1, Math.round(image.naturalWidth * processScale));
  const height = Math.max(1, Math.round(image.naturalHeight * processScale));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const histogram = new Array(256).fill(0);
  let visiblePixels = 0;

  removeLightEdgeBackground(data, width, height);

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];

    if (alpha < 8) continue;

    const luminance = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    histogram[luminance] += 1;
    visiblePixels += 1;
  }

  const lowerTarget = visiblePixels * 0.02;
  const upperTarget = visiblePixels * 0.98;
  let running = 0;
  let low = 0;
  let high = 255;

  for (let i = 0; i < histogram.length; i += 1) {
    running += histogram[i];
    if (running >= lowerTarget) {
      low = i;
      break;
    }
  }

  running = 0;
  for (let i = 0; i < histogram.length; i += 1) {
    running += histogram[i];
    if (running >= upperTarget) {
      high = i;
      break;
    }
  }

  const range = Math.max(1, high - low);
  const target = hexToRgb(color);
  const colorStrength = clamp(strength, 0, 1);

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];

    if (alpha < 8) continue;

    const originalR = data[i];
    const originalG = data[i + 1];
    const originalB = data[i + 2];
    const luminance = originalR * 0.299 + originalG * 0.587 + originalB * 0.114;
    const normalized =
      high - low < 8 ? luminance / 255 : clamp((luminance - low) / range, 0, 1);
    const shade = 0.72 + normalized * 0.46;
    const tintedR = clamp(target.r * shade);
    const tintedG = clamp(target.g * shade);
    const tintedB = clamp(target.b * shade);

    data[i] = Math.round(originalR * (1 - colorStrength) + tintedR * colorStrength);
    data[i + 1] = Math.round(originalG * (1 - colorStrength) + tintedG * colorStrength);
    data[i + 2] = Math.round(originalB * (1 - colorStrength) + tintedB * colorStrength);
  }

  context.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/png');
}

function createRecoloredLogoDataUrl(src, color) {
  return createRecoloredProductDataUrl(src, color, 1);
}

function loadFabricImage(src) {
  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(
      src,
      (image) => {
        if (image) {
          resolve(image);
        } else {
          reject(new Error(`Unable to load image: ${src}`));
        }
      },
      { crossOrigin: 'anonymous' }
    );
  });
}

function resolveLogoSource(src, logoColor) {
  return logoColor ? createRecoloredLogoDataUrl(src, logoColor) : Promise.resolve(src);
}

function preserveImageScale(image, renderedWidth, renderedHeight, nextWidth, nextHeight) {
  image.set({
    scaleX: renderedWidth / nextWidth,
    scaleY: renderedHeight / nextHeight
  });
}

function isLogoObject(object) {
  return Boolean(object && object.isLogo);
}

function isTextEditingElement(element) {
  if (!element) return false;

  const tagName = element.tagName;
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    element.isContentEditable
  );
}

const ShoeCanvas = forwardRef(function ShoeCanvas({ productSrc, color, opacity }, ref) {
  const canvasElementRef = useRef(null);
  const canvasRef = useRef(null);
  const productImageRef = useRef(null);
  const productSrcRef = useRef(productSrc);
  const colorRef = useRef(color);
  const opacityRef = useRef(opacity);
  const tintRequestRef = useRef(0);
  const logoTintRequestRef = useRef(0);
  const loadRequestRef = useRef(0);

  const updateColorOverlay = useCallback(async (nextColor, nextOpacity) => {
    const product = productImageRef.current;
    const canvas = canvasRef.current;
    const source = productSrcRef.current;

    if (!product || !canvas || !source) return;

    const requestId = ++tintRequestRef.current;
    const tintedSrc = await createRecoloredProductDataUrl(source, nextColor, nextOpacity);

    if (requestId !== tintRequestRef.current || productImageRef.current !== product) return;

    product.setSrc(tintedSrc, () => {
      if (productImageRef.current !== product) return;

      product.moveTo(0);
      canvas.requestRenderAll();
    });
  }, []);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasElementRef.current, {
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true
    });

    canvas.setDimensions({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerColor = '#0f766e';
    fabric.Object.prototype.cornerStrokeColor = '#ffffff';
    fabric.Object.prototype.borderColor = '#0f766e';
    canvasRef.current = canvas;

    return () => {
      canvas.dispose();
      canvasRef.current = null;
      productImageRef.current = null;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const requestId = ++loadRequestRef.current;
      productImageRef.current = null;
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      productSrcRef.current = productSrc;

      try {
        const tintedSrc = await createRecoloredProductDataUrl(
          productSrc,
          colorRef.current,
          opacityRef.current
        );
        const product = await loadFabricImage(tintedSrc);

        if (!isMounted || requestId !== loadRequestRef.current) return;

        const scale = Math.min(
          PRODUCT_MAX_WIDTH / product.width,
          PRODUCT_MAX_HEIGHT / product.height
        );
        const left = (CANVAS_WIDTH - product.width * scale) / 2;
        const top = (CANVAS_HEIGHT - product.height * scale) / 2 + 24;

        product.set({
          left,
          top,
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
          objectCaching: false
        });

        productImageRef.current = product;
        canvas.add(product);
        canvas.requestRenderAll();
      } catch (error) {
        console.error(error);
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productSrc]);

  useEffect(() => {
    colorRef.current = color;
    opacityRef.current = opacity;
    updateColorOverlay(color, opacity);
  }, [color, opacity, updateColorOverlay]);

  const addLogoObject = async (src, position, logoColor = null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tintedSrc = await resolveLogoSource(src, logoColor);
    const logo = await loadFabricImage(tintedSrc);
    const targetWidth = 128;
    const scale = targetWidth / logo.width;

    logo.set({
      left: position?.x ?? CANVAS_WIDTH / 2 - 40,
      top: position?.y ?? CANVAS_HEIGHT / 2 - 40,
      scaleX: scale,
      scaleY: scale,
      angle: position ? 0 : -8,
      cornerStyle: 'circle',
      padding: 8,
      objectCaching: false,
      originalSrc: src,
      logoColor,
      isLogo: true
    });

    canvas.add(logo);
    canvas.setActiveObject(logo);
    canvas.requestRenderAll();
  };

  const removeSelectedLogos = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const selectedObjects = canvas.getActiveObjects();
    const removableObjects = selectedObjects.filter(isLogoObject);

    if (removableObjects.length === 0) return;

    removableObjects.forEach((object) => canvas.remove(object));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, []);

  const resetLogos = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const logoObjects = canvas.getObjects().filter(isLogoObject);

    if (logoObjects.length === 0) return;

    logoObjects.forEach((object) => canvas.remove(object));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, []);

  const updateActiveLogoColor = useCallback((newColor) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!isLogoObject(activeObject) || !(activeObject instanceof fabric.Image)) return;

    const originalSrc = activeObject.originalSrc;
    if (!originalSrc) return;

    const renderedWidth = activeObject.getScaledWidth();
    const renderedHeight = activeObject.getScaledHeight();
    const requestId = ++logoTintRequestRef.current;
    resolveLogoSource(originalSrc, newColor)
      .then((tintedSrc) => {
        if (requestId !== logoTintRequestRef.current || canvas.getActiveObject() !== activeObject) return;

        const nextImage = new Image();
        nextImage.onload = () => {
          if (requestId !== logoTintRequestRef.current || canvas.getActiveObject() !== activeObject) return;

          activeObject.setSrc(tintedSrc, () => {
            if (requestId !== logoTintRequestRef.current || canvas.getActiveObject() !== activeObject) return;

            preserveImageScale(
              activeObject,
              renderedWidth,
              renderedHeight,
              nextImage.naturalWidth,
              nextImage.naturalHeight
            );
            activeObject.set('logoColor', newColor ?? null);
            canvas.requestRenderAll();
          });
        };
        nextImage.onerror = () => {
          console.error(new Error(`Unable to load image: ${tintedSrc}`));
        };
        nextImage.src = tintedSrc;
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useImperativeHandle(ref, () => ({
    addLogo(src, position, logoColor) {
      addLogoObject(src, position, logoColor);
    },
    updateLogoColor(newColor) {
      updateActiveLogoColor(newColor);
    },
    removeSelectedLogo() {
      removeSelectedLogos();
    },
    resetLogos() {
      resetLogos();
    },
    exportPng() {
      const canvas = canvasRef.current;

      if (!canvas) return null;
      canvas.discardActiveObject();
      canvas.requestRenderAll();

      return canvas.toDataURL({
        format: 'png',
        multiplier: 2,
        enableRetinaScaling: true
      });
    }
  }));

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      if (isTextEditingElement(document.activeElement)) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const activeObject = canvas.getActiveObject();
      const activeObjects = canvas.getActiveObjects();
      const hasLogoSelection =
        isLogoObject(activeObject) || activeObjects.some((object) => isLogoObject(object));

      if (!hasLogoSelection) return;

      event.preventDefault();
      removeSelectedLogos();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [removeSelectedLogos]);

  const handleDrop = (event) => {
    event.preventDefault();
    const canvas = canvasRef.current;

    if (!canvas) return;

    const rawLogo = event.dataTransfer.getData('application/json');
    if (!rawLogo) return;

    const logo = JSON.parse(rawLogo);
    const bounds = canvas.upperCanvasEl.getBoundingClientRect();
    const position = {
      x: ((event.clientX - bounds.left) / bounds.width) * CANVAS_WIDTH,
      y: ((event.clientY - bounds.top) / bounds.height) * CANVAS_HEIGHT
    };

    addLogoObject(logo.src, position, logo.color ?? null);
  };

  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-soft">
      <div
        className="relative w-full overflow-auto rounded-md bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%),linear-gradient(-45deg,#f8fafc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f8fafc_75%),linear-gradient(-45deg,transparent_75%,#f8fafc_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0]"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <canvas ref={canvasElementRef} />
      </div>
    </section>
  );
});

export default ShoeCanvas;
