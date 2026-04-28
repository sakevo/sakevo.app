/**
 * Minimal fal.ai client (no SDK required).
 *
 * We use the synchronous endpoint `fal.run` since FLUX dev img2img typically
 * finishes in 8-15s — well within Vercel's 60s function limit when we run
 * the 3 ideas in parallel via Promise.all.
 */

const FAL_MODEL = 'fal-ai/flux/dev/image-to-image';

interface FalImage {
  url: string;
  width: number;
  height: number;
  content_type: string;
}

interface FalResponse {
  images: FalImage[];
  seed?: number;
  timings?: Record<string, number>;
}

export interface FalImageToImageInput {
  imageUrl: string;
  prompt: string;
  strength?: number; // 0..1, lower = stays closer to original
  numInferenceSteps?: number;
}

export async function falImageToImage({
  imageUrl,
  prompt,
  strength = 0.82,
  numInferenceSteps = 28,
}: FalImageToImageInput): Promise<FalImage> {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) throw new Error('FAL_API_KEY is not set');

  const res = await fetch(`https://fal.run/${FAL_MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageUrl,
      prompt,
      strength,
      num_inference_steps: numInferenceSteps,
      num_images: 1,
      enable_safety_checker: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as FalResponse;
  if (!data.images?.[0]?.url) throw new Error('fal.ai returned no image');
  return data.images[0];
}

/** Download a remote image into a Buffer. */
export async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${url} failed: ${res.status}`);
  const contentType = res.headers.get('content-type') ?? 'image/jpeg';
  const arrayBuffer = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType };
}
