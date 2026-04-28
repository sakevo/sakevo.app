export interface CustomIdea {
  title: string;
  description: string;
  colors: string[];
  materials_to_use: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  image_prompt: string;
}

export interface RestorationStep {
  step: number;
  title: string;
  instruction: string;
  materials: string[];
  warning: string | null;
}

export interface RestorationPlan {
  overall_difficulty: 'easy' | 'medium' | 'hard';
  estimated_time_hours: number;
  steps: RestorationStep[];
}

export interface AnalysisResult {
  item_type: 'sneaker' | 'clothing';
  identification: {
    brand: string | null;
    model: string | null;
    confidence: number;
  };
  materials: string[];
  condition: {
    score: number;
    issues: string[];
  };
  custom_ideas: CustomIdea[];
  restoration: RestorationPlan | null;
}

export interface MockupRow {
  id: string;
  project_id: string;
  idea_index: number;
  prompt: string;
  image_path: string | null;
  status: 'pending' | 'done' | 'error';
  error_message: string | null;
}
