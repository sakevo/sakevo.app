import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { adminClient, authenticate } from './_lib/supabase';
import { buildSystemPrompt } from './_lib/prompt';

const FREE_LIMIT = 3;
const MODEL = 'claude-sonnet-4-6';

interface AnalysisResult {
  item_type: string;
  custom_ideas: Array<{
    title: string;
    description: string;
    colors: string[];
    materials_to_use: string[];
    difficulty: string;
    image_prompt: string;
  }>;
  restoration: {
    overall_difficulty: string;
    estimated_time_hours: number;
    steps: Array<{
      step: number;
      title: string;
      instruction: string;
      materials: string[];
      warning: string | null;
    }>;
  } | null;
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

  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('tier, projects_used')
    .eq('id', userId)
    .single();
  if (profileErr || !profile) {
    res.status(500).json({ error: 'Profile not found' });
    return;
  }
  if (profile.tier === 'free' && profile.projects_used >= FREE_LIMIT) {
    res.status(402).json({ error: 'Free tier limit reached' });
    return;
  }

  const { data: project, error: projectErr } = await admin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();
  if (projectErr || !project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  await admin.from('projects').update({ status: 'analyzing' }).eq('id', projectId);

  try {
    const { data: blob, error: dlErr } = await admin.storage
      .from('uploads')
      .download(project.original_image_path);
    if (dlErr || !blob) throw new Error(`Download failed: ${dlErr?.message}`);

    const buf = Buffer.from(await blob.arrayBuffer());
    const base64 = buf.toString('base64');
    const mediaType = blob.type === 'image/png' ? 'image/png' : 'image/jpeg';

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' });
    const systemPrompt = buildSystemPrompt({
      itemType: project.item_type,
      mode: project.mode,
      language: project.language,
      styleHint: project.style_hint,
    });

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: 'Analyze this image and return the JSON object as specified.',
            },
          ],
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') throw new Error('No text response');
    const raw = textBlock.text.trim();

    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    if (jsonStart < 0 || jsonEnd <= jsonStart) throw new Error('No JSON in response');
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as AnalysisResult;

    await admin.from('analyses').insert({
      project_id: projectId,
      model_used: MODEL,
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
      result_json: parsed,
    });

    if (parsed.restoration?.steps?.length) {
      await admin.from('restoration_steps').insert(
        parsed.restoration.steps.map((s) => ({
          project_id: projectId,
          step_no: s.step,
          title: s.title,
          instruction: s.instruction,
          materials: s.materials,
          warning: s.warning,
          difficulty: parsed.restoration?.overall_difficulty ?? null,
        }))
      );
    }

    if (parsed.custom_ideas?.length) {
      await admin.from('mockups').insert(
        parsed.custom_ideas.map((idea, i) => ({
          project_id: projectId,
          idea_index: i,
          prompt: idea.image_prompt,
          status: 'pending',
        }))
      );
    }

    await admin.from('projects').update({ status: 'done' }).eq('id', projectId);
    await admin
      .from('profiles')
      .update({ projects_used: profile.projects_used + 1 })
      .eq('id', userId);

    res.status(200).json({ ok: true, projectId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('analyze error:', message);
    await admin
      .from('projects')
      .update({ status: 'error', error_message: message })
      .eq('id', projectId);
    res.status(500).json({ error: message });
  }
}
