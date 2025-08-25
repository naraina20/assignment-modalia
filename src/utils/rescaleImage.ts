
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

export default async function downscaleIfNeeded(file: File, maxDim = 1920): Promise<string> {
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