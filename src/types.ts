export interface AIRecommendation {
  stress_level: 'Low' | 'Medium' | 'High';
  confidence_score: number;
  feature_importance: Array<{
    feature: string;
    importance: number;
    color?: string;
  }>;
  recommendations: Array<{
    reco_id?: string;
    i18n_key?: string;
    category?: string;
    title?: string;
    description?: string;
  }>;
}

export interface ActionCardItem {
  id: string;
  title: string;
  description: string;
  categoryKey: string;
}

export interface FormData {
  age: string;
  gender: string;
  academic_performance: number;
  study_load: number;
  teacher_student_relationship: number;
  future_career_concerns: number;
  anxiety_level: number;
  depression: number;
  self_esteem: number;
  mental_health_history: 'yes' | 'no';
  blood_pressure: number;
  sleep_quality: number;
  headache: number;
  breathing_problem: number;
  social_support: number;
  peer_pressure: number;
  extracurricular_activities: number;
  bullying: number;
  noise_level: number;
  living_conditions: number;
  safety: number;
  basic_needs: number;
}
