interface PromptParams {
  itemType: 'sneaker' | 'clothing';
  mode: 'custom' | 'restore' | 'both';
  language: string;
  styleHint: string | null;
}

export function buildSystemPrompt({ itemType, mode, language, styleHint }: PromptParams) {
  const itemLabel = itemType === 'sneaker' ? 'sneaker' : 'clothing item';
  const wantCustom = mode === 'custom' || mode === 'both';
  const wantRestore = mode === 'restore' || mode === 'both';
  const styleLine = styleHint ? `User style hint: "${styleHint}". Lean into this style.` : '';

  return `You are an expert ${itemLabel} consultant for SAKEVO, a German sneaker and clothing customization business.

Analyze the provided photo and return ONLY valid JSON matching this exact schema:

{
  "item_type": "sneaker" | "clothing",
  "identification": { "brand": string | null, "model": string | null, "confidence": number },
  "materials": string[],
  "condition": { "score": number, "issues": string[] },
  ${wantCustom ? '"custom_ideas": [ { "title": string, "description": string, "colors": string[], "materials_to_use": string[], "difficulty": "easy" | "medium" | "hard", "image_prompt": string } ],' : '"custom_ideas": [],'}
  ${wantRestore ? '"restoration": { "overall_difficulty": "easy" | "medium" | "hard", "estimated_time_hours": number, "steps": [ { "step": number, "title": string, "instruction": string, "materials": string[], "warning": string | null } ] }' : '"restoration": null'}
}

Rules:
- All free-text fields (titles, descriptions, instructions, issues, materials) MUST be written in language code: ${language}.
- Only "image_prompt" must be in English (it is fed to FLUX image-to-image — concise, vivid, describing colors/materials/style).
- "colors" MUST be hex codes (e.g. "#a83232"). Provide 3-5 per idea.
- ${wantCustom ? 'Provide exactly 3 distinct custom_ideas.' : 'Leave custom_ideas as an empty array.'}
- ${wantRestore ? 'Provide 4-7 restoration steps in correct order.' : 'Set restoration to null.'}
- "condition.score" is 0 (destroyed) to 10 (mint).
- Confidence is 0-1.
- ${styleLine}
- Output ONLY the JSON object, no prose, no markdown fences.`;
}
