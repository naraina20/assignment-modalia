import { useState, Suspense, useMemo, useRef, useEffect, useCallback } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import "./app.css"
import { Spinner } from "./components/spinner";
import downscaleIfNeeded from "./utils/rescaleImage";
import { EmptyState } from "./components/EmptyState";

type StyleOption = "Editorial" | "Streetwear" | "Vintage";
const STYLES: StyleOption[] = ["Editorial", "Streetwear", "Vintage"];

interface Generation {
  id: string;
  imageUrl: string; // URL to generated (mock) image; here we'll reuse the input preview or synthesize
  prompt: string;
  style: StyleOption;
  createdAt: string; // ISO string
}

const HistoryPanel: React.FC<{ items: Generation[]; onSelect: (g: Generation) => void; onClear: () => void }>
  = ({ items, onSelect, onClear }) => {
    if (!items.length) {
      return <EmptyState title="No history yet" subtitle="Your last 5 generations will appear here." />;
    }
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">History</h3>
          <button onClick={onClear} className="text-sm underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg px-2 py-1" aria-label="Clear history" style={{ cursor: 'pointer' }} data-testid="clear-btn">Clear</button>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="history-item">
          {items.map((g) => (
            <li key={g.id} >
              <button
                onClick={() => onSelect(g)}
                className="w-full text-left bg-white border rounded-2xl p-3 hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ cursor: "pointer" }} aria-label={`Restore generation from ${new Date(g.createdAt).toLocaleString()}`}
              >
                <div className="flex gap-3">
                  <img src={g.imageUrl} alt="Generated thumbnail" className="w-16 h-16 object-cover rounded-xl" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{g.prompt}</p>
                    <p className="text-xs text-gray-500">{g.style} · {new Date(g.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };


function App() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [style, setStyle] = useState<StyleOption>("Editorial");
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<Generation[]>(() => loadHistory());
  const [errorText, setErrorText] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

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

  const canGenerate = !!imageDataUrl && prompt.trim().length > 0 && !isLoading;

  const startGenerate = useCallback(async () => {
    if (!imageDataUrl) return;
    setIsLoading(true);
    setStatus("Generating...");
    setErrorText(null);
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const gen = await generateWithRetries({ imageDataUrl, prompt: prompt.trim(), style, signal: ac.signal });
      // Save to history (most recent first, unique by id)
      const next = [gen, ...history].slice(0, 5);
      setHistory(next);
      saveHistory(next);
      setStatus("Done");
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setStatus("Aborted");
      } else {
        setErrorText(err?.message || "Unknown error");
        setStatus("Failed");
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [imageDataUrl, prompt, style, history]);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const restore = (g: Generation) => {
    setImageDataUrl(g.imageUrl);
    setPrompt(g.prompt);
    setStyle(g.style);
    setStatus("Restored from history");
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  // Accessibility: announce status updates
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
          <div data-testid="prompt" className="text-sm text-gray-700"><span className="font-medium">Prompt:</span> {prompt || "—"}</div>
          <div data-testid="style" className="text-sm text-gray-700"><span className="font-medium">Style:</span> {style}</div>
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
                  <label htmlFor="prompt" className="block text-sm font-medium">Prompt <span className="text-red-500">* (First select image)</span></label>
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

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    data-testid="generate-btn"
                    onClick={startGenerate}
                    disabled={!canGenerate}
                    className="px-4 py-2 rounded-2xl bg-black text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ cursor: "pointer" }}
                    aria-disabled={!canGenerate}
                    aria-label="Generate"
                  >
                    {isLoading ? "Generating..." : "Generate"}
                  </button>
                  <button
                    onClick={abort}
                    data-testid="abort-btn"
                    disabled={!isLoading}
                    style={{ cursor: "pointer" }}
                    className="px-4 py-2 rounded-2xl border bg-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    aria-label="Abort request"
                  >
                    Abort
                  </button>
                </div>

                {/* Status */}
                <div className="min-h-[24px]" aria-live="polite" aria-atomic="true">
                  {isLoading && <Spinner label="Working..." />}
                  {errorText && <p className="text-sm text-red-600" data-testid="error-message">{errorText}</p>}
                  <div ref={statusRef} className="sr-only" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4 border">
              <Suspense fallback={<Spinner label="Loading history..." />}>
                <HistoryPanel items={history} onSelect={restore} onClear={clearHistory} />
              </Suspense>
            </div>

          </section>

          {/*  Right section : Live Summary / Preview  */}
          <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-4 border" data-testid="summary">
            <h2 className="font-semibold mb-3">Live Summary</h2>
            <Preview />
          </section>
        </div>
      </main>
    </ErrorBoundary>
  )
}

function uuid(): string {
  // RFC4122-ish simple UUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 0xf) >> 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface GenerateRequest {
  imageDataUrl: string;
  prompt: string;
  style: StyleOption;
  signal?: AbortSignal;
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal) {
      if (signal.aborted) return onAbort();
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

let overloadErrorCount: number = 0;

async function mockGenerateAPI({ imageDataUrl, prompt, style, signal }: GenerateRequest): Promise<Generation> {
  // console.log("overloadErrorCount ", overloadErrorCount)
  // Simulate 1–2s latency
  await wait(1000 + Math.random() * 1000, signal);

  // 20% simulated error
  if (overloadErrorCount >= 3) {
    // console.log("model overloaded error")
    const err: any = new Error("Model overloaded");
    err.code = "OVERLOADED";
    throw err;
  }
  overloadErrorCount++
  return {
    id: uuid(),
    imageUrl: imageDataUrl,
    prompt,
    style,
    createdAt: new Date().toISOString(),
  };
}

async function generateWithRetries(req: GenerateRequest, maxAttempts = 3, baseDelay = 500): Promise<Generation> {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      return await mockGenerateAPI(req);
    } catch (e: any) {
      if (e?.name === "AbortError") throw e; // respect aborts
      attempt++;
      if (attempt >= maxAttempts) {
        overloadErrorCount = 0;
        throw e;
      }
      const backoff = baseDelay * Math.pow(2, attempt - 1);
      await wait(backoff, req.signal);
    }
  }
  throw new Error("Unreachable");
}

// Storage Helpers
const HISTORY_KEY = "ai-studio-history-v1";

function loadHistory(): Generation[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Generation[];
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: Generation[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 5)));
}

export default App
