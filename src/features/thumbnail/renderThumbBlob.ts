const THUMB_SIZE = 200

export async function renderThumbBlob(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
): Promise<Blob> {
  const canvas = new OffscreenCanvas(THUMB_SIZE, THUMB_SIZE)
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D

  const scale = Math.min(THUMB_SIZE / sourceWidth, THUMB_SIZE / sourceHeight)
  const w = sourceWidth * scale
  const h = sourceHeight * scale
  ctx.drawImage(source, (THUMB_SIZE - w) / 2, (THUMB_SIZE - h) / 2, w, h)

  return canvas.convertToBlob({ type: 'image/webp', quality: 0.8 })
}
