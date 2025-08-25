import { useState, Suspense, useMemo, useRef, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import "./app.css"
import { Spinner } from "./components/spinner";

type StyleOption = "Editorial" | "Streetwear" | "Vintage";
const STYLES: StyleOption[] = ["Editorial", "Streetwear", "Vintage"];

const EmptyState: React.FC<{ title: string; subtitle?: string }>
  = ({ title, subtitle }) => (
    <div className="border border-dashed rounded-2xl p-10 text-center text-gray-600">
      <p className="text-lg font-medium mb-1">{title}</p>
      {subtitle && <p className="text-sm">{subtitle}</p>}
    </div>
  );


function App() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [style, setStyle] = useState<StyleOption>("Editorial");
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const onUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpe?g)$/.test(f.type)) {
      setErrorText("Please upload a PNG or JPG image.");
      return;
    }
    try {
      setErrorText(null);
      const dataUrl = await downscaleIfNeeded(f, 1920);
      setImageDataUrl(dataUrl);
      setStatus("Image ready");
    } catch (err: any) {
      setErrorText("Failed to process the image. " + (err?.message || ""));
    }
  };

  const statusRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (statusRef.current) statusRef.current.textContent = status;
  }, [status]);

  const Preview = useMemo(() => {
    return function Preview() {
      if (!imageDataUrl) return <EmptyState title="Upload an image" subtitle="PNG or JPG up to 10MB. Larger files will be downscaled." />;
      return (
        <div className="space-y-3">
          <img src={imageDataUrl} alt="Preview" className="w-full max-h-[280px] object-contain rounded-2xl border" />
          <div className="text-sm text-gray-700"><span className="font-medium">Prompt:</span> {prompt || "—"}</div>
          <div className="text-sm text-gray-700"><span className="font-medium">Style:</span> {style}</div>
        </div>
      );
    };
  }, [imageDataUrl, prompt, style]);


  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gray-50 text-gray-900">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold">Mini AI Studio</h1>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left section : upload / prompt input */}
          <section className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-4 border">
              <h2 className="font-semibold mb-3">Upload & Prompt</h2>

              <div className="space-y-3">
                <div>
                  <label htmlFor="file" className="block text-sm font-medium">Image <span className="text-red-500">*</span></label>
                  <input
                    id="file"
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={onUpload}
                    className="mt-1 w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border file:bg-gray-100 file:hover:bg-gray-200 file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-xl"
                  />
                </div>


                {/* Prompt */}
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium">Prompt <span className="text-red-500">*</span></label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    disabled={imageDataUrl ? false : true}
                    className="mt-1 w-full rounded-2xl border p-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    placeholder="Describe what you want..."
                  />
                </div>

                {/* Style  */}
                <div>
                  <label htmlFor="style" className="block text-sm font-medium">Style</label>
                  <select
                    id="style"
                    value={style}
                    onChange={(e) => setStyle(e.target.value as StyleOption)}
                    disabled={imageDataUrl ? false : true}
                    className="mt-1 w-full rounded-2xl border p-2 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                    aria-label="Select style"
                  >
                    {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Status */}
                <div className="min-h-[24px]" aria-live="polite" aria-atomic="true">
                  {isLoading && <Spinner label="Working..." />}
                  {errorText && <p className="text-sm text-red-600">{errorText}</p>}
                  <div ref={statusRef} className="sr-only" />
                </div>
              </div>
            </div>

          </section>

          {/*  Right section : Live Summary / Preview  */}
          <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-4 border">
            <h2 className="font-semibold mb-3">Live Summary</h2>
            <Preview />
          </section>
        </div>
      </main>
    </ErrorBoundary>
  )
}

async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function downscaleIfNeeded(file: File, maxDim = 1920): Promise<string> {
  const origDataUrl = await fileToDataURL(file);
  const needsBySize = file.size > 10 * 1024 ; // >10MB
  const img = await loadImage(origDataUrl);
  console.log("image h w ", img.width,img.height,file.size)
  const needsByDim = img.width > maxDim || img.height > maxDim;
  if (!needsBySize && !needsByDim) return origDataUrl;
  console.log("downscalling...")

  const scale = Math.min(maxDim / img.width, maxDim / img.height);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return origDataUrl;
  // Use better resampling
  (ctx as any).imageSmoothingEnabled = true;
  (ctx as any).imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  const outType = file.type === "image/png" && needsBySize ? "image/jpeg" : file.type;
  const dataUrl = canvas.toDataURL(outType, 0.9);
  return dataUrl;
}

export default App
