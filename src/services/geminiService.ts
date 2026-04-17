import type { AIRecommendation, FormData } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';
const API_TIMEOUT_MS = 15000;

const featureColors: Record<string, string> = {
  anxiety_level: '#fb7185',
  depression: '#f43f5e',
  self_esteem: '#8b5cf6',
  sleep_quality: '#3b82f6',
  study_load: '#8b5cf6',
  social_support: '#ec4899',
  peer_pressure: '#7c3aed',
  academic_performance: '#10b981',
  basic_needs: '#6ee7b7',
  living_conditions: '#fcd34d',
};

type LangCode = 'vi' | 'en' | 'de' | 'zh' | 'fr';

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = API_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function toStressLabel(level: unknown): 'Low' | 'Medium' | 'High' {
  if (typeof level === 'number') {
    return level >= 2 ? 'High' : level >= 1 ? 'Medium' : 'Low';
  }
  const normalized = String(level || '').toLowerCase();
  if (normalized === 'high' || normalized === '2') return 'High';
  if (normalized === 'medium' || normalized === '1') return 'Medium';
  return 'Low';
}

function mapGender(gender: string): 'male' | 'female' | 'other' {
  const normalized = (gender || '').trim().toLowerCase();
  if (['male', 'nam'].includes(normalized)) return 'male';
  if (['female', 'nu'].includes(normalized)) return 'female';
  return 'other';
}

function toBackendPayload(data: FormData, language: string) {
  const mentalHistoryYes = new Set(['yes']);
  const historyRaw = String(data.mental_health_history || '').toLowerCase();

  return {
    age: parseInt(data.age, 10) || 20,
    gender: mapGender(data.gender),
    anxiety_level: Number(data.anxiety_level) || 0,
    depression: Number(data.depression) || 0,
    self_esteem: Number(data.self_esteem) || 15,
    mental_health_history: mentalHistoryYes.has(historyRaw) ? 1 : 0,
    blood_pressure: Number(data.blood_pressure) || 2,
    sleep_quality: Number(data.sleep_quality) || 3,
    headache: Number(data.headache) || 0,
    breathing_problem: Number(data.breathing_problem) || 0,
    study_load: Number(data.study_load) || 3,
    academic_performance: Number(data.academic_performance) || 3,
    teacher_student_relationship: Number(data.teacher_student_relationship) || 3,
    future_career_concerns: Number(data.future_career_concerns) || 3,
    social_support: Number(data.social_support) || 1,
    peer_pressure: Number(data.peer_pressure) || 0,
    extracurricular_activities: Number(data.extracurricular_activities) || 2,
    bullying: Number(data.bullying) || 0,
    noise_level: Number(data.noise_level) || 0,
    living_conditions: Number(data.living_conditions) || 3,
    safety: Number(data.safety) || 3,
    basic_needs: Number(data.basic_needs) || 3,
    language,
  };
}

async function getOrCreateSessionId(): Promise<string> {
  const existing = localStorage.getItem('mindscan_session_id');
  if (existing) return existing;

  const resp = await fetchWithTimeout(`${API_BASE}/api/session`, { method: 'POST' });
  if (!resp.ok) throw new Error(`Failed to create session: ${resp.status}`);
  const json = await resp.json();
  const sessionId = String(json.session_id || '');
  if (!sessionId) throw new Error('Missing session_id in response');
  localStorage.setItem('mindscan_session_id', sessionId);
  return sessionId;
}

function buildLocalFallback(formData: FormData): AIRecommendation {
  const features = [
    { feature: 'sleep_quality', importance: Math.random() * 25 + 10 },
    { feature: 'study_load', importance: Math.random() * 25 + 10 },
    { feature: 'anxiety_level', importance: Math.random() * 25 + 10 },
    { feature: 'social_support', importance: Math.random() * 25 + 10 },
    { feature: 'academic_performance', importance: Math.random() * 15 + 5 },
  ]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5)
    .map((f) => ({ ...f, color: featureColors[f.feature] || '#cbd5e1' }));

  const totalScore = Number(formData.anxiety_level) + Number(formData.depression) + Number(formData.study_load) * 2;
  const stressLevel: 'Low' | 'Medium' | 'High' = totalScore > 40 ? 'High' : totalScore > 20 ? 'Medium' : 'Low';

  return {
    stress_level: stressLevel,
    confidence_score: 0.85 + Math.random() * 0.15,
    feature_importance: features,
    recommendations: [
      {
        i18n_key: stressLevel === 'High' ? 'highStress' : 'sleep',
        category: 'mental',
        title: '',
        description: '',
      },
    ],
  };
}

export const analyzeSurveyData = async (formData: FormData, language: string): Promise<AIRecommendation> => {
  const lang = (['vi', 'en', 'de', 'zh', 'fr'].includes(language) ? language : 'en') as LangCode;

  try {
    let sessionId = await getOrCreateSessionId();
    const payload = toBackendPayload(formData, lang);

    let res = await fetchWithTimeout(`${API_BASE}/api/predict?session_id=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.status === 404) {
      localStorage.removeItem('mindscan_session_id');
      sessionId = await getOrCreateSessionId();
      res = await fetchWithTimeout(`${API_BASE}/api/predict?session_id=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok) throw new Error(`Backend API error ${res.status}`);

    const result = await res.json();
    const prediction = result?.prediction || {};

    const featureImportance = Object.entries(prediction.feature_importance || {})
      .map(([feature, importance]) => ({
        feature,
        importance: Math.round(Number(importance || 0) * 100),
        color: featureColors[feature] || '#cbd5e1',
      }))
      .sort((a, b) => b.importance - a.importance);

    const recommendations = (prediction.recommendations || []).map((r: any) => ({
      reco_id: r.reco_id,
      i18n_key: r.i18n_key || undefined,
      category: r.category || 'general',
      title: r.title || '',
      description: r.description || '',
    }));

    return {
      stress_level: toStressLabel(prediction.stress_level),
      confidence_score: Number(prediction.confidence_score || 0.5),
      feature_importance: featureImportance,
      recommendations,
    };
  } catch (error) {
    console.warn('Using local fallback because backend call failed:', error);
    return buildLocalFallback(formData);
  }
};
