import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClient, authenticate } from './_lib/supabase';
import { downloadImage, falImageToImage } from './_lib/fal';

interface MockupRow {
  id: string;
  project_id: string;
  idea_index: number;
  prompt: string;
  status: 'pending' | 'done' | 'error';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { userId } = await authenticate(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const projectId = (req.body as { projectId?: string } | undefined)?.projectId;
  if (!projectId) {
    res.status(400).json({ error: 'projectId required' });
    return;
  }

  const admin = adminClient();

  const { data: project, error: projErr } = await admin
    .from('projects')
    .select('id, user_id, original_image_path, status')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();
  if (projErr || !project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const { data: mockupsData, error: mErr } = await admin
    .from('mockups')
    .select('id, project_id, idea_index, prompt, status')
    .eq('project_id', projectId)
    .eq('status', 'pending')
    .order('idea_index', { ascending: true });
  if (mErr) {
    res.status(500).json({ error: 'Failed to load mockups' });
    return;
  }
  const mockups = (mockupsData ?? []) as MockupRow[];
  if (mockups.length === 0) {
    res.status(200).json({ ok: true, rendered: 0, message: 'no pending mockups' });
    return;
  }

  // Signed URL of original (fal.ai needs a publicly fetchable URL)
  const { data: signed, error: sErr } = await admin.storage
    .from('uploads')
    .createSignedUrl(project.original_image_path, 600);
  if (sErr || !signed?.signedUrl) {
    res.status(500).json({ error: 'Could not sign original image URL' });
    return;
  }
  const originalUrl = signed.signedUrl;

  await admin.from('projects').update({ status: 'rendering' }).eq('id', projectId);

  const results = await Promise.allSettled(
    mockups.map((m) => renderOne(admin, userId, m, originalUrl))
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.length - succeeded;

  await admin
    .from('projects')
    .update({ status: failed === results.length ? 'error' : 'done' })
    .eq('id', projectId);

  res.status(200).json({ ok: true, rendered: succeeded, failed, total: results.length });
}

async function renderOne(
  admin: ReturnType<typeof adminClient>,
  userId: string,
  mockup: MockupRow,
  originalUrl: string
) {
  try {
    const falImage = await falImageToImage({
      imageUrl: originalUrl,
      prompt: mockup.prompt,
      strength: 0.82,
    });

    const { buffer, contentType } = await downloadImage(falImage.url);
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const path = `${userId}/${mockup.project_id}/mockup-${mockup.idea_index}.${ext}`;

    const { error: upErr } = await admin.storage
      .from('mockups')
      .upload(path, buffer, { contentType, upsert: true });
    if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);

    await admin
      .from('mockups')
      .update({ image_path: path, status: 'done' })
      .eq('id', mockup.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`render-mockups idea_index=${mockup.idea_index} failed:`, message);
    await admin
      .from('mockups')
      .update({ status: 'error', error_message: message })
      .eq('id', mockup.id);
    throw err;
  }
}
