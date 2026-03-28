/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Play, 
  ShieldCheck, 
  Lock, 
  GraduationCap, 
  BarChart2, 
  Leaf, 
  HeartHandshake,
  Share2,
  Mail,
  Heart,
  ArrowLeft,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  AlertTriangle,
  PhoneCall,
  Info,
  Moon,
  BookOpen,
  Users,
  Activity,
  DollarSign,
  ChevronDown,
  Brain,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Player } from '@lottiefiles/react-lottie-player';
import { analyzeSurveyData, AIRecommendation } from './services/geminiService';
import { translations } from './translations';

const GaugeChart = ({ level, confidence, t }: { level: string, confidence: number, t?: (key: string) => string }) => {
  // Gauge arc: left = -90° (Low), center = 0° (Medium), right = +90° (High)
  // Each zone spans 60°, confidence (0–1) fine-tunes within the zone
  let rotation = 0;
  const c = Math.max(0, Math.min(1, confidence)); // clamp to [0,1]
  if (level === 'Low') {
    // Zone: -90° to -30°. Higher confidence = more confidently Low (stay left)
    rotation = -90 + (1 - c) * 60;
  } else if (level === 'Medium') {
    // Zone: -30° to +30°
    rotation = -30 + c * 60;
  } else {
    // Zone: +30° to +90°. Higher confidence = more confidently High (stay right)
    rotation = 30 + c * 60;
  }

  const levelText = level === 'Low' ? 'LOW' : level === 'Medium' ? 'MEDIUM' : 'HIGH';
  const levelColor = level === 'Low' ? '#6ee7b7' : level === 'Medium' ? '#fcd34d' : '#fb7185';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-32 overflow-hidden">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="50%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
            </filter>
          </defs>
          <path
            d="M 20 90 A 70 70 0 0 1 180 90"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <g transform="translate(100, 90)">
            <motion.g
              initial={{ rotate: -90 }}
              animate={{ rotate: rotation }}
              transition={{ duration: 1.5, type: "spring", bounce: 0.25 }}
            >
              <path d="M -4 0 L 0 -66 L 4 0 Z" fill="#334155" filter="url(#shadow)" />
              <circle cx="0" cy="0" r="7" fill="#1e293b" />
              <circle cx="0" cy="0" r="3" fill="#94a3b8" />
            </motion.g>
          </g>
        </svg>
      </div>
      <div className="text-center mt-4">
        <div className="text-lg font-bold text-gray-800">
          {t ? t('results.gaugeTitle') : 'Mức độ Stress Hiện tại:'} <span style={{ color: levelColor }}>{t ? t(`results.${level.toLowerCase()}`) : levelText}</span>
        </div>
        <div className="text-sm text-gray-500">
          {t ? t('results.gaugeConf') : 'Độ Tự tin (Confidence):'} {Math.round(confidence * 100)}%
        </div>
      </div>
    </div>
  );
};

// Fallback palette for history entries that may have been saved without colors
const BAR_FALLBACK_COLORS = ['#6ee7b7','#2dd4bf','#c084fc','#94a3b8','#fb7185','#fbbf24','#60a5fa','#a78bfa'];

const CustomStackedBar = ({ data, height = 'h-12', showLabels = true }: { data: any[], height?: string, showLabels?: boolean }) => {
  const total = data.reduce((sum: number, item: any) => sum + item.importance, 0);
  if (!total) return <div className={`flex w-full ${height} rounded-2xl bg-gray-100`} />;
  return (
    <div className={`flex w-full ${height} rounded-2xl overflow-hidden shadow-sm`}>
      {data.map((item: any, idx: number) => {
        // Use saved color, but fall back to palette if missing or nearly-white
        const color = (!item.color || item.color === '#f3f4f6') ? BAR_FALLBACK_COLORS[idx % BAR_FALLBACK_COLORS.length] : item.color;
        return (
          <div
            key={idx}
            style={{ width: `${(item.importance / total) * 100}%`, backgroundColor: color }}
            className="h-full flex items-center justify-center text-white font-bold text-sm transition-all hover:opacity-90"
            title={`${item.feature}: ${item.importance}%`}
          >
            {showLabels && item.importance > 8 ? item.importance : ''}
          </div>
        );
      })}
    </div>
  );
};

const ActionCard = ({ id, title, description, icon: Icon, colorClass, isBookmarked, onBookmark, bookmarkAriaLabel }: { id: string, title: string, description: string, icon: any, colorClass: string, isBookmarked: boolean, onBookmark: (e: React.MouseEvent) => void, bookmarkAriaLabel: string, key?: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className="relative bg-white/20 backdrop-blur-3xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] rounded-[2rem] overflow-hidden p-6 flex items-start gap-4 cursor-pointer hover:bg-white/30 hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] transition-all duration-300"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <h4 className="text-lg font-bold text-gray-800 mb-1">{title}</h4>
        <p className={`text-gray-600 text-sm transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
          {description}
        </p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button 
          onClick={onBookmark}
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${isBookmarked ? 'bg-blue-200/60 text-blue-600 border border-blue-200' : 'bg-white/30 text-gray-400 hover:bg-white/50 border border-white/30'}`}
          aria-label={bookmarkAriaLabel}
        >
          {isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
        </button>
        <div className="w-8 h-8 rounded-full bg-white/30 border border-white/30 flex items-center justify-center shrink-0 text-gray-400 hover:bg-white/50 transition-all">
          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [hasConsented, setHasConsented] = useState(false);
  const [language, setLanguage] = useState<'vi' | 'en' | 'de' | 'zh'>('vi');
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIRecommendation | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showEthicsModal, setShowEthicsModal] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [bookmarkedRecs, setBookmarkedRecs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('mindscan_bookmarks') || '[]'); } catch { return []; }
  });
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [showAllRecs, setShowAllRecs] = useState(false);
  const [stepError, setStepError] = useState<string>('');
  
  // Translation helper
  const t = (key: string): string => {
    const keys = key.split('.');
    let result: any = translations[language];
    for (const k of keys) {
      if (result && result[k]) result = result[k];
      else return key;
    }
    return typeof result === 'string' ? result : key;
  };

  const [formData, setFormData] = useState({
    // Demographics
    age: '',
    gender: '',
    // Step 1: Academic
    academic_performance: 3,
    study_load: 3,
    teacher_student_relationship: 3,
    future_career_concerns: 3,
    // Step 2: Psychological
    anxiety_level: 0,
    depression: 0,
    self_esteem: 15,
    mental_health_history: 'Không',
    // Step 3: Physical
    blood_pressure: 2,
    sleep_quality: 3,
    headache: 0,
    breathing_problem: 0,
    // Step 4: Social
    social_support: 1,
    peer_pressure: 0,
    extracurricular_activities: 2,
    bullying: 0,
    // Step 5: Environment
    noise_level: 0,
    living_conditions: 3,
    safety: 3,
    basic_needs: 3
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    // Storage version — bump this to clear stale data after format changes
    const STORAGE_VERSION = 'v2';
    const storedVersion = localStorage.getItem('mindscan_storage_version');
    if (storedVersion !== STORAGE_VERSION) {
      // Clear old history entries that may have bad color data
      Object.keys(localStorage)
        .filter(k => k.startsWith('mindscan_history_'))
        .forEach(k => localStorage.removeItem(k));
      localStorage.setItem('mindscan_storage_version', STORAGE_VERSION);
    }

    let sid = localStorage.getItem('mindscan_session_id');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('mindscan_session_id', sid);
    }
    setSessionId(sid);

    const history = localStorage.getItem(`mindscan_history_${sid}`);
    if (history) {
      setSessionHistory(JSON.parse(history));
    } else {
      const dummyHistory = [
        {
          date: '10 Mar 2026',
          stressScore: 30,
          level: 'Low',
          features: [
            { feature: 'Giấc ngủ', importance: 40, color: '#6ee7b7' },
            { feature: 'Học tập', importance: 30, color: '#2dd4bf' },
            { feature: 'Xã hội', importance: 20, color: '#c084fc' },
            { feature: 'Thể chất', importance: 5, color: '#cbd5e1' },
            { feature: 'Tài chính', importance: 5, color: '#fb7185' },
          ]
        },
        {
          date: '12 Mar 2026',
          stressScore: 60,
          level: 'Medium',
          features: [
            { feature: 'Giấc ngủ', importance: 20, color: '#6ee7b7' },
            { feature: 'Học tập', importance: 40, color: '#2dd4bf' },
            { feature: 'Xã hội', importance: 15, color: '#c084fc' },
            { feature: 'Thể chất', importance: 10, color: '#cbd5e1' },
            { feature: 'Tài chính', importance: 15, color: '#fb7185' },
          ]
        }
      ];
      setSessionHistory(dummyHistory);
    }
  }, []);

  const saveToHistory = (result: AIRecommendation) => {
    const newEntry = {
      date: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }),
      stressScore: result.stress_level === 'High' ? 85 : result.stress_level === 'Medium' ? 50 : 20,
      level: result.stress_level,
      features: result.feature_importance
    };
    setSessionHistory(prev => {
      const updated = [...prev, newEntry];
      localStorage.setItem(`mindscan_history_${sessionId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const startSurvey = () => {
    setIsSurveyOpen(true);
  };

  const acceptConsent = () => {
    setHasConsented(true);
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedRecs(prev => {
      const next = prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id];
      localStorage.setItem('mindscan_bookmarks', JSON.stringify(next));
      return next;
    });
  };

  const nextStep = async () => {
    // Validate required fields on step 1
    if (currentStep === 1) {
      const age = parseInt(formData.age as any);
      if (!formData.age || isNaN(age) || age < 10 || age > 100) {
        setStepError(
          language === 'vi' ? 'Vui lòng nhập tuổi hợp lệ (10–100).' :
          language === 'de' ? 'Bitte geben Sie ein gültiges Alter ein (10–100).' :
          language === 'zh' ? '请输入有效年龄（10–100岁）。' :
          'Please enter a valid age (10–100).'
        );
        return;
      }
      if (!formData.gender) {
        setStepError(
          language === 'vi' ? 'Vui lòng chọn giới tính.' :
          language === 'de' ? 'Bitte wählen Sie Ihr Geschlecht aus.' :
          language === 'zh' ? '请选择您的性别。' :
          'Please select your gender.'
        );
        return;
      }
    }
    setStepError('');
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsAnalyzing(true);
      setIsCompleted(true);
      try {
        const result = await analyzeSurveyData(formData, language);
        
        // Colors and display names are already mapped by geminiService.ts.
        // No re-mapping needed here — just set the result directly.
        setAiResult(result);
        saveToHistory(result);
        if (result.stress_level === 'High') {
          setShowEmergencyModal(true);
        }
      } catch (error) {
        console.error("Error analyzing data:", error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
    else setIsSurveyOpen(false);
  };

  // Helper to calculate color based on slider value
  const getSliderColor = (value: number, min: number, max: number) => {
    const percentage = (value - min) / (max - min);
    const hue = (1 - percentage) * 120;
    return `hsl(${hue}, 84%, 50%)`;
  };

  const CustomSlider = ({ min, max, step, value, onChange, size = 'normal', ariaLabel }: { min: number, max: number, step: number, value: number, onChange: (val: number) => void, size?: 'normal' | 'large', ariaLabel: string }) => {
    const percentage = ((value - min) / (max - min)) * 100;
    const currentColor = getSliderColor(value, min, max);

    const heightClass = size === 'large' ? 'h-4' : 'h-2';
    const thumbSizeClass = size === 'large' 
      ? '[&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:h-8' 
      : '[&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6';
    
    // Calculate exact pixel offset for the thumb center since the thumb takes up space
    const thumbOffset = size === 'large' ? 16 : 12; // half width of thumb in px
    const offsetPx = thumbOffset - (percentage / 100) * (thumbOffset * 2);

    return (
      <div className="relative pt-8 pb-1 w-full group">
        <div 
          className="absolute top-0 transform -translate-x-1/2 text-xs font-bold px-2.5 py-1 rounded-lg text-white shadow-md pointer-events-none"
          style={{ 
            left: `calc(${percentage}% + ${offsetPx}px)`,
            backgroundColor: currentColor
          }}
        >
          {value}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 border-[5px] border-transparent"
            style={{ borderTopColor: currentColor }}
          ></div>
        </div>
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={ariaLabel}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          className={`w-full appearance-none bg-transparent rounded-full cursor-grab active:cursor-grabbing ${heightClass} ${thumbSizeClass} focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-[var(--thumb-color)] [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-[var(--thumb-color)] [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:transition-transform relative z-10`}
          style={{
            background: `linear-gradient(to right, ${currentColor} ${percentage}%, ${isDarkMode ? '#374151' : '#e5e7eb'} ${percentage}%)`,
            '--thumb-color': currentColor,
          } as React.CSSProperties}
        />
      </div>
    );
  };

  const renderConsentScreen = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className={`relative backdrop-blur-3xl shadow-[0_16px_48px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.9)] rounded-[2rem] overflow-hidden p-8 md:p-12 max-w-3xl mx-auto text-left ${isDarkMode ? 'bg-[#0b132b]/80 border border-white/10 text-white' : 'bg-white/25 border border-white/40'}`}
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
        <ShieldCheck className="w-8 h-8" />
      </div>
      <h2 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>{t('consent.title')}</h2>
      
      <div className={`space-y-4 mb-8 h-64 overflow-y-auto pr-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <p>{t('consent.welcome')}</p>
        <h3 className={`font-bold mt-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('consent.h1')}</h3>
        <p>{t('consent.p1')}</p>
        
        <h3 className={`font-bold mt-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('consent.h2')}</h3>
        <p dangerouslySetInnerHTML={{ __html: t('consent.p2')
          .replace('ẩn danh', '<strong>ẩn danh</strong>')
          .replace('anonymously', '<strong>anonymously</strong>')
          .replace('absolut anonym', '<strong>absolut anonym</strong>')
          .replace('完全匿名', '<strong>完全匿名</strong>') 
        }} />
        
        <h3 className={`font-bold mt-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('consent.h3')}</h3>
        <p dangerouslySetInnerHTML={{ __html: t('consent.p3')
          .replace('Kết quả từ hệ thống không thay thế cho chẩn đoán y khoa hoặc lời khuyên từ chuyên gia tâm lý/bác sĩ.', '<strong>Kết quả từ hệ thống không thay thế cho chẩn đoán y khoa hoặc lời khuyên từ chuyên gia tâm lý/bác sĩ.</strong>')
          .replace('Results do not substitute medical diagnoses or professional psychiatric advice.', '<strong>Results do not substitute medical diagnoses or professional psychiatric advice.</strong>')
          .replace('Ergebnisse ersetzen keine ärztliche Diagnose.', '<strong>Ergebnisse ersetzen keine ärztliche Diagnose.</strong>')
          .replace('结果不能代替医学诊断。', '<strong>结果不能代替医学诊断。</strong>')
        }} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <button 
          onClick={() => setIsSurveyOpen(false)}
          className={`px-6 py-3 rounded-xl font-medium transition-all backdrop-blur-sm ${isDarkMode ? 'text-gray-300 bg-white/10 border border-white/20 hover:bg-white/20' : 'text-gray-600 bg-white/20 border border-white/30 hover:bg-white/30'}`}
        >
          {t('consent.btnDecline')}
        </button>
        <button 
          onClick={acceptConsent}
          className={`relative overflow-hidden group px-8 py-3 rounded-full font-semibold transition-all duration-300 shadow-[0_8px_32px_rgba(59,130,246,0.2)] hover:-translate-y-0.5 ${isDarkMode ? 'bg-blue-600 text-white border border-blue-500/50 hover:bg-blue-500' : 'bg-white/30 backdrop-blur-2xl text-blue-700 border border-white/50 hover:bg-white/50'}`}
        >
          <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          {t('consent.btnAccept')}
        </button>
      </div>
    </motion.div>
  );

  const renderHowItWorksModal = () => (
    <AnimatePresence>
      {isHowItWorksOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className={`relative w-full max-w-5xl rounded-[2rem] overflow-hidden p-8 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.3)] border ${isDarkMode ? 'bg-[#0b132b]/80 border-white/10 text-white backdrop-blur-3xl' : 'bg-[#0b132b]/95 border-blue-900/50 text-white backdrop-blur-3xl'}`}
          >
            {/* Close button */}
            <button 
              onClick={() => setIsHowItWorksOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <span className="text-xl">&times;</span>
            </button>

            <div className="text-center mb-12 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('tech.title')}</h2>
              <p className="text-gray-300 text-lg leading-relaxed">{t('tech.subtitle')}</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side: 3 Features */}
              <div className="space-y-8">
                {/* Feature 1 */}
                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                    <Activity className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t('tech.point1Title')}</h3>
                    <p className="text-gray-400 leading-relaxed text-sm">{t('tech.point1Text')}</p>
                  </div>
                </div>
                {/* Feature 2 */}
                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t('tech.point2Title')}</h3>
                    <p className="text-gray-400 leading-relaxed text-sm">{t('tech.point2Text')}</p>
                  </div>
                </div>
                {/* Feature 3 */}
                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                    <Brain className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t('tech.point3Title')}</h3>
                    <p className="text-gray-400 leading-relaxed text-sm">{t('tech.point3Text')}</p>
                  </div>
                </div>
              </div>

              {/* Right Side: Code Mockup */}
              <div className="bg-[#1e293b] rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative mt-4 lg:mt-0">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                  <Lock className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-sm tracking-wide text-gray-200">{t('tech.modelTitle')}</span>
                </div>

                {/* Code Body */}
                <div className="p-6 font-mono text-sm overflow-x-auto text-gray-300">
                  <div className="flex gap-4"><span className="text-blue-400">model</span> <span className="text-gray-400">=</span> <span className="text-emerald-400">XGBClassifier</span><span className="text-gray-400">(</span></div>
                  <div className="flex gap-4 pl-4"><span className="text-indigo-300">n_estimators</span><span className="text-gray-400">=</span><span className="text-orange-300">200</span><span className="text-gray-400">,</span></div>
                  <div className="flex gap-4 pl-4"><span className="text-indigo-300">learning_rate</span><span className="text-gray-400">=</span><span className="text-orange-300">0.05</span><span className="text-gray-400">,</span></div>
                  <div className="flex gap-4 pl-4"><span className="text-indigo-300">max_depth</span><span className="text-gray-400">=</span><span className="text-orange-300">6</span><span className="text-gray-400">,</span></div>
                  <div className="flex gap-4 pl-4"><span className="text-indigo-300">objective</span><span className="text-gray-400">=</span><span className="text-green-300">'multi:softprob'</span></div>
                  <div className="flex gap-4"><span className="text-gray-400">)</span></div>
                  <div className="flex gap-4 mt-6"><span className="text-gray-500 italic">/* Đầu ra dự báo: LOW, MEDIUM, HIGH */</span></div>
                </div>

                {/* Footer Stats */}
                <div className="px-6 py-5 border-t border-white/5 flex items-center justify-between bg-black/20">
                  <span className="text-sm font-medium text-gray-400">{t('tech.modelAcc')}</span>
                  <div className="bg-emerald-500/20 text-emerald-400 font-mono font-bold px-3 py-1 rounded text-sm border border-emerald-500/30">
                    92.4%
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderEmergencyModal = () => (
    <AnimatePresence>
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className={`relative backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-[2rem] overflow-hidden p-8 md:p-10 max-w-lg w-full text-center ${isDarkMode ? 'bg-[#0b132b]/80 border border-white/10' : 'bg-white/30 border border-white/50'}`}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{t('emergency.title')}</h2>
            <p className={`mb-6 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} dangerouslySetInnerHTML={{ __html: t('emergency.desc').replace('rất cao', '<strong>rất cao</strong>').replace('extremely high', '<strong>extremely high</strong>') }} />
            
            <div className={`rounded-2xl p-6 mb-8 text-left ${isDarkMode ? 'bg-red-900/20 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-white text-red-600'}`}>
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('emergency.hotlineLabel')}</div>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>1800 599 920</div>
                </div>
              </div>
              <a 
                href="tel:1800599920"
                className="block w-full text-center bg-red-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
              >
                {t('emergency.btnCall')}
              </a>
            </div>

            <div className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} dangerouslySetInnerHTML={{ __html: t('emergency.clinic').replace('Phòng Tư vấn Tâm lý', '<strong>Phòng Tư vấn Tâm lý</strong>').replace('University Counseling Center', '<strong>University Counseling Center</strong>') }} />

            <button 
              onClick={() => setShowEmergencyModal(false)}
              className={`font-medium underline ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
            >
              {t('emergency.btnUnderstand')}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>{t('questions.s1Title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q1')}</label>
                <input type="number" min="10" max="100" value={formData.age} onChange={(e) => handleInputChange('age', e.target.value)} placeholder="20" className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-600 outline-none ${isDarkMode ? 'bg-[#0b132b]/50 border-white/20 text-white' : 'bg-white border-gray-300'}`} />
              </div>
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q2')}</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { val: 'Nam', label: t('questions.genderMale') }, 
                    { val: 'Nữ', label: t('questions.genderFemale') }, 
                    { val: 'Khác', label: t('questions.genderOther') }
                  ].map(gender => (
                    <button key={gender.val} onClick={() => handleInputChange('gender', gender.val)} className={`px-4 py-2 rounded-full text-sm font-medium border ${formData.gender === gender.val ? 'bg-blue-600 text-white border-blue-600' : isDarkMode ? 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>{gender.label}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q3')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.academic_performance} onChange={(v) => handleInputChange('academic_performance', v)} ariaLabel="Academic performance" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>5</span></div>
              </div>
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q4')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.study_load} onChange={(v) => handleInputChange('study_load', v)} ariaLabel="Study load" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>5</span></div>
              </div>
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q5')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.teacher_student_relationship} onChange={(v) => handleInputChange('teacher_student_relationship', v)} ariaLabel="Teacher relationship" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>5</span></div>
              </div>
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q6')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.future_career_concerns} onChange={(v) => handleInputChange('future_career_concerns', v)} ariaLabel="Career concern" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>5</span></div>
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>{t('questions.s2Title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q7')}</label>
                <CustomSlider min={0} max={21} step={1} value={formData.anxiety_level} onChange={(v) => handleInputChange('anxiety_level', v)} ariaLabel="Anxiety" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>21</span></div>
              </div>
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q8')}</label>
                <CustomSlider min={0} max={27} step={1} value={formData.depression} onChange={(v) => handleInputChange('depression', v)} ariaLabel="Depression" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>27</span></div>
              </div>
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q9')}</label>
                <CustomSlider min={0} max={30} step={1} value={formData.self_esteem} onChange={(v) => handleInputChange('self_esteem', v)} ariaLabel="Self Esteem" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>30</span></div>
              </div>
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q10')}</label>
                <div className="flex gap-4">
                  {[
                    { val: 'Có', label: t('questions.yes') },
                    { val: 'Không', label: t('questions.no') }
                  ].map(opt => (
                    <button key={opt.val} onClick={() => handleInputChange('mental_health_history', opt.val)} className={`px-6 py-2 rounded-xl text-sm font-medium border ${formData.mental_health_history === opt.val ? 'bg-blue-600 text-white border-blue-600' : isDarkMode ? 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>{opt.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>{t('questions.s3Title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q11')}</label>
                <select value={formData.blood_pressure} onChange={(e) => handleInputChange('blood_pressure', parseInt(e.target.value))} className={`w-full p-3 border rounded-xl outline-none ${isDarkMode ? 'bg-[#0b132b] text-white border-white/20' : 'bg-white border-gray-300'}`}>
                  <option value={1}>{t('questions.bpLow')}</option>
                  <option value={2}>{t('questions.bpNormal')}</option>
                  <option value={3}>{t('questions.bpHigh')}</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q12')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.sleep_quality} onChange={(v) => handleInputChange('sleep_quality', v)} ariaLabel="Sleep" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>5</span></div>
              </div>
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q13')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.headache} onChange={(v) => handleInputChange('headache', v)} ariaLabel="Headache" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>5</span></div>
              </div>
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q14')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.breathing_problem} onChange={(v) => handleInputChange('breathing_problem', v)} ariaLabel="Breathing" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>5</span></div>
              </div>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>{t('questions.s4Title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q15')}</label>
                <CustomSlider min={0} max={3} step={1} value={formData.social_support} onChange={(v) => handleInputChange('social_support', v)} ariaLabel="Social support" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>3</span></div>
              </div>
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q16')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.peer_pressure} onChange={(v) => handleInputChange('peer_pressure', v)} ariaLabel="Peer pressure" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>5</span></div>
              </div>
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q17')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.extracurricular_activities} onChange={(v) => handleInputChange('extracurricular_activities', v)} ariaLabel="Extracurricular" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>5</span></div>
              </div>
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q18')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.bullying} onChange={(v) => handleInputChange('bullying', v)} ariaLabel="Bullying" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>5</span></div>
              </div>
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>{t('questions.s5Title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q19')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.noise_level} onChange={(v) => handleInputChange('noise_level', v)} ariaLabel="Noise" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>5</span></div>
              </div>
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q20')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.living_conditions} onChange={(v) => handleInputChange('living_conditions', v)} ariaLabel="Living conditions" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>5</span></div>
              </div>
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q21')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.safety} onChange={(v) => handleInputChange('safety', v)} ariaLabel="Safety" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>5</span></div>
              </div>
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t('questions.q22')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.basic_needs} onChange={(v) => handleInputChange('basic_needs', v)} ariaLabel="Basic needs" />
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}><span>0</span><span>5</span></div>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen font-sans text-[#0b132b] relative overflow-x-hidden transition-colors duration-500 ${isDarkMode ? 'dark bg-gradient-to-br from-[#0a0f1e] via-[#0d1b3e] to-[#1a0a2e]' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'}`}>
      {/* Liquid Glass Background Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {isDarkMode ? (
          <>
            <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full filter blur-[120px] opacity-30 animate-blob bg-indigo-700" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full filter blur-[120px] opacity-20 animate-blob animation-delay-2000 bg-violet-900" />
            <div className="absolute top-[40%] left-[40%] w-[40vw] h-[40vw] rounded-full filter blur-[100px] opacity-15 animate-blob animation-delay-4000 bg-blue-900" />
          </>
        ) : (
          <>
            <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full filter blur-[120px] opacity-40 animate-blob bg-blue-400" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full filter blur-[120px] opacity-30 animate-blob animation-delay-2000 bg-violet-400" />
            <div className="absolute top-[40%] left-[40%] w-[40vw] h-[40vw] rounded-full filter blur-[100px] opacity-25 animate-blob animation-delay-4000 bg-teal-300" />
          </>
        )}
      </div>
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-2xl border-b shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-colors duration-500 ${isDarkMode ? 'bg-black/30 border-white/10' : 'bg-white/20 border-white/30'}`}>
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <div className={`text-2xl font-bold tracking-tight cursor-pointer transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`} onClick={() => {setIsSurveyOpen(false); setIsCompleted(false); setCurrentStep(1);}}>{t('appName')}</div>
          {!isSurveyOpen && (
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
              <a href="#solutions" className="text-blue-600 border-b-2 border-blue-600 pb-1">{t('nav.solutions')}</a>
              <a href="#technology" className="hover:text-gray-900 pb-1">{t('nav.technology')}</a>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!isSurveyOpen && (
            <>
              {/* Premium Dark / Light Mode Toggle */}
              <motion.div
                className="relative w-[130px] h-[43px] rounded-full border-2 border-white/60 cursor-pointer overflow-hidden flex items-center shrink-0 shadow-[0_10px_20px_rgba(0,0,0,0.2),inset_2px_4px_4px_2px_rgba(2,1,68,0.5),inset_-2px_-2px_2px_rgba(1,0,89,0.5)]"
                animate={{ backgroundColor: isDarkMode ? '#0f172a' : '#236fe9' }}
                transition={{ duration: 0.5 }}
                onClick={() => setIsDarkMode(prev => !prev)}
                aria-label="Toggle dark mode"
              >
                {/* Stars Lottie (dark mode) */}
                <motion.div
                  className="absolute left-0 top-0 w-full h-full pointer-events-none z-0"
                  animate={{ opacity: isDarkMode ? 1 : 0, y: isDarkMode ? 0 : 20 }}
                  transition={{ duration: 0.5 }}
                >
                  <Player autoplay loop src="https://cdn.prod.website-files.com/6485b1e6f5eb4dc9ec89e560/6485bab4d8da4bb319001bbe_stars.json" style={{ width: '100%', height: '100%' }} />
                </motion.div>
                {/* Clouds Lottie base (light mode) */}
                <motion.div
                  className="absolute pointer-events-none z-0"
                  style={{ width: '140%', height: '200%', left: '-20%', top: '-50%' }}
                  animate={{ opacity: isDarkMode ? 0 : 0.9 }}
                  transition={{ duration: 0.5 }}
                >
                  <Player autoplay loop speed={1.5} src="https://cdn.prod.website-files.com/6485b1e6f5eb4dc9ec89e560/6485bab50719867ec6c32ff9_clouds.json" style={{ width: '100%', height: '100%' }} />
                </motion.div>
                {/* Static Clouds (light mode) */}
                <motion.div
                  className="absolute bottom-[-20px] left-[-20%] w-[140%] h-[110px] flex flex-col items-center justify-end pointer-events-none z-0"
                  animate={{ y: isDarkMode ? 60 : 0, opacity: isDarkMode ? 0 : 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.img
                    src="https://cdn.prod.website-files.com/69c773b68211f0dc7da25e7a/69c773b78211f0dc7da25ed6_Vectors-Wrapper.svg"
                    className="w-[180px] h-[66px] object-cover absolute bottom-[-8px]"
                    animate={{ x: [-10, 10, -10] }}
                    transition={{ repeat: Infinity, duration: 5.33, ease: 'easeInOut' }}
                    alt=""
                  />
                  <motion.img
                    src="https://cdn.prod.website-files.com/69c773b68211f0dc7da25e7a/69c773b78211f0dc7da25ed5_Vectors-Wrapper.svg"
                    className="w-[180px] h-[66px] object-cover absolute bottom-[8px]"
                    animate={{ x: [10, -10, 10] }}
                    transition={{ repeat: Infinity, duration: 6.67, ease: 'easeInOut' }}
                    alt=""
                  />
                </motion.div>
                {/* Ripple rings */}
                <motion.div
                  className="absolute pointer-events-none z-0"
                  style={{ left: '22px', top: '50%' }}
                  animate={{ x: isDarkMode ? 88 : 0 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                >
                  <div className="absolute w-[70px] h-[70px] bg-white/10 rounded-full" style={{ transform: 'translate(-50%, -50%)' }} />
                  <div className="absolute w-[110px] h-[110px] bg-white/10 rounded-full" style={{ transform: 'translate(-50%, -50%)' }} />
                  <div className="absolute w-[150px] h-[150px] bg-white/10 rounded-full" style={{ transform: 'translate(-50%, -50%)' }} />
                </motion.div>
                {/* Glow (moves with thumb) */}
                <motion.div
                  className="absolute flex items-center justify-center mix-blend-screen pointer-events-none z-0"
                  style={{ left: '-50px', top: '50%', transform: 'translateY(-50%)' }}
                  animate={{ x: isDarkMode ? 88 : 0 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                >
                  <motion.img src="https://cdn.prod.website-files.com/69c773b68211f0dc7da25e7a/69c773b78211f0dc7da25ed3_Vectors-Wrapper.svg" className="absolute w-[85px] h-[85px] object-cover" animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} alt="" />
                  <motion.img src="https://cdn.prod.website-files.com/69c773b68211f0dc7da25e7a/69c773b78211f0dc7da25ed2_Vectors-Wrapper.svg" className="absolute w-[114px] h-[114px] object-cover" animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.5 }} alt="" />
                  <motion.img src="https://cdn.prod.website-files.com/69c773b68211f0dc7da25e7a/69c773b78211f0dc7da25ed4_Vectors-Wrapper.svg" className="absolute w-[142px] h-[142px] object-cover" animate={{ scale: [1, 1.02, 1], opacity: [0.4, 0.6, 0.4] }} transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }} alt="" />
                </motion.div>
                {/* Thumb: Sun / Moon */}
                <div className="absolute inset-0 flex items-center px-[8px] pointer-events-none z-10">
                  <motion.div
                    className="relative w-[29px] h-[29px] rounded-full flex items-center justify-center"
                    animate={{ x: isDarkMode ? 88 : 0, rotate: isDarkMode ? 360 : 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  >
                    <motion.img
                      src="https://cdn.prod.website-files.com/69c773b68211f0dc7da25e7a/69c773b78211f0dc7da25ed0_Vectors-Wrapper.svg"
                      className="absolute w-[29px] h-[29px] rounded-full shadow-[4px_8px_6px_rgba(0,0,0,0.2)]"
                      animate={{ opacity: isDarkMode ? 0 : 1, scale: isDarkMode ? 0.5 : 1 }}
                      transition={{ duration: 0.3 }}
                      alt="Sun"
                    />
                    <motion.img
                      src="https://cdn.prod.website-files.com/69c773b68211f0dc7da25e7a/69c773b78211f0dc7da25ed1_Vectors-Wrapper.svg"
                      className="absolute w-[29px] h-[29px] rounded-full"
                      animate={{ opacity: isDarkMode ? 1 : 0, scale: isDarkMode ? 1 : 0.5 }}
                      transition={{ duration: 0.3 }}
                      alt="Moon"
                    />
                  </motion.div>
                </div>
              </motion.div>
              <a href="#" className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>{t('nav.signIn')}</a>
              <button 
                onClick={() => setIsSurveyOpen(true)}
                className="relative overflow-hidden rounded-full font-semibold px-6 py-2.5 text-sm transition-all duration-300 flex items-center gap-2 group bg-white/30 backdrop-blur-2xl text-blue-700 border border-white/50 shadow-[0_4px_20px_rgba(59,130,246,0.15)] hover:bg-white/50 hover:shadow-[0_6px_24px_rgba(59,130,246,0.2)] hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                {t('nav.getStarted')}
              </button>
            </>
          )}
          {/* Language switcher — always visible */}
          <div className="relative flex items-center bg-black/90 rounded-full p-1 pr-4 cursor-pointer hover:bg-black transition-colors border border-white/10 shadow-lg shadow-black/20 group">
            <img 
              src={`https://hatscripts.github.io/circle-flags/flags/${language === 'vi' ? 'vn' : language === 'en' ? 'gb' : language === 'de' ? 'de' : 'cn'}.svg`} 
              alt="flag" 
              className="w-7 h-7 rounded-full object-cover mr-3 bg-white/10"
            />
            <span className="text-[15px] font-bold tracking-wider text-white select-none pointer-events-none mt-[1px]">
              {language === 'vi' ? 'VI' : language === 'en' ? 'EN' : language === 'de' ? 'DE' : 'ZH'}
            </span>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            >
              <option value="vi">Tiếng Việt (VI)</option>
              <option value="en">English (EN)</option>
              <option value="de">Deutsch (DE)</option>
              <option value="zh">中文 (ZH)</option>
            </select>
          </div>
        </div>
      </div>
      </header>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={() => setShowPrivacyModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className={`relative backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-[2rem] overflow-hidden p-8 md:p-10 max-w-2xl w-full text-left max-h-[85vh] overflow-y-auto ${isDarkMode ? 'bg-[#0b132b]/95 border border-white/10' : 'bg-white/30 border border-white/50'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-500/20 border border-blue-300/40 rounded-2xl flex items-center justify-center text-blue-600">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>Chính sách Bảo mật</h2>
              </div>
              <div className={`space-y-5 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Nguyên tắc Ẩn danh (Anonymization)</h3>
                  <p>Hệ thống tuyệt đối không thu thập các thông tin định danh cá nhân (PII) như Họ tên, MSSV, Email, Số điện thoại hoặc địa chỉ IP.</p>
                </div>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Mã hóa Dữ liệu</h3>
                  <p>Mọi phản hồi từ người dùng đều được mã hóa trước khi lưu trữ vào cơ sở dữ liệu. Các phiên làm việc (Session ID) được tạo ngẫu nhiên và không liên kết với thông tin thực tế của bạn.</p>
                </div>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Bảo mật Kỹ thuật</h3>
                  <p>Toàn bộ giao tiếp giữa thiết bị của bạn và máy chủ được bảo vệ qua giao thức HTTPS. Quyền truy cập quản trị được kiểm soát nghiêm ngặt bằng mã xác thực (JWT).</p>
                </div>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Giới hạn Lưu trữ</h3>
                  <p>Dữ liệu chỉ phục vụ cho mục đích nghiên cứu học thuật của môn học <strong>MSIS3033</strong>. Toàn bộ dữ liệu sẽ được xóa sạch trong vòng <strong>3 tháng</strong> sau khi dự án kết thúc.</p>
                </div>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Báo cáo Tổng hợp</h3>
                  <p>Các kết quả thống kê chỉ hiển thị dưới dạng dữ liệu gộp (như tỷ lệ theo giới tính, năm học), đảm bảo không một cá nhân nào có thể bị nhận diện từ báo cáo.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPrivacyModal(false)} 
                className={`mt-8 w-full py-3 rounded-full font-semibold transition-all ${isDarkMode ? 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20' : 'bg-white/30 border border-white/50 text-gray-700 hover:bg-white/50'}`}
              >
                Đóng
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ethics Modal */}
      <AnimatePresence>
        {showEthicsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={() => setShowEthicsModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className={`relative backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-[2rem] overflow-hidden p-8 md:p-10 max-w-2xl w-full text-left max-h-[85vh] overflow-y-auto ${isDarkMode ? 'bg-[#0b132b]/95 border border-white/10' : 'bg-white/30 border border-white/50'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-500/20 border border-green-300/40 rounded-2xl flex items-center justify-center text-green-600">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>Đạo đức Nghiên cứu</h2>
              </div>
              <div className={`space-y-5 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Tính Tự nguyện</h3>
                  <p>Việc tham gia khảo sát là hoàn toàn tự nguyện. Bạn có quyền dừng lại và thoát khỏi hệ thống bất cứ lúc nào mà không cần giải thích.</p>
                </div>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Giới hạn Chẩn đoán (Disclaimer)</h3>
                  <p>MindScan AI là công cụ sàng lọc sơ bộ, không phải là chẩn đoán y tế hoặc lâm sàng. Kết quả này <strong>không thay thế</strong> cho lời khuyên hoặc điều trị từ các chuyên gia sức khỏe tâm thần.</p>
                </div>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />An toàn Người dùng là Trên hết</h3>
                  <p>Trong trường hợp hệ thống phát hiện mức độ stress cao (High Stress), chúng tôi bắt buộc hiển thị thông tin hỗ trợ khẩn cấp và Hotline tư vấn 24/7 <strong>(1800 599 920)</strong>.</p>
                </div>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Sử dụng Ngôn ngữ</h3>
                  <p>Hệ thống cam kết sử dụng ngôn ngữ trung lập, không gây thêm áp lực tâm lý hoặc tạo sự kỳ thị (stigma) đối với người tham gia.</p>
                </div>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Công khai Hạn chế</h3>
                  <p>Chúng tôi thừa nhận các hạn chế về mặt dữ liệu (như thiên kiến tự đánh giá) để đảm bảo tính trung thực và khách quan của kết quả nghiên cứu.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEthicsModal(false)} 
                className={`mt-8 w-full py-3 rounded-full font-semibold transition-all ${isDarkMode ? 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20' : 'bg-white/30 border border-white/50 text-gray-700 hover:bg-white/50'}`}
              >
                Đóng
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {renderHowItWorksModal()}
        {renderEmergencyModal()}
        {!isSurveyOpen ? (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Hero Section */}
            <section className="container mx-auto px-6 pt-12 pb-24 grid lg:grid-cols-2 gap-12 items-center">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide mb-6">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {t('hero.badge')}
                </div>
                <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight text-[#0b132b]">
                  {t('hero.title1')} <span className="text-blue-600">{t('hero.title2')}</span>
                </h1>
                <p className="text-lg text-gray-500 mb-10 leading-relaxed">
                  {t('hero.subtitle')}
                </p>
                
                <div className="flex flex-wrap items-center gap-6 mb-16">
                  <button 
                    onClick={() => setIsSurveyOpen(true)}
                    className="relative overflow-hidden rounded-full font-semibold px-8 py-4 transition-all duration-300 flex items-center gap-2 group bg-white/30 backdrop-blur-2xl text-blue-700 border border-white/50 shadow-[0_8px_32px_rgba(59,130,246,0.2)] hover:bg-white/50 hover:shadow-[0_12px_40px_rgba(59,130,246,0.25)] hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    {t('hero.btnStart')} <ArrowRight className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsHowItWorksOpen(true)}
                    className={`flex items-center gap-3 font-medium transition-colors ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <div className={`w-10 h-10 rounded-full backdrop-blur-sm border flex items-center justify-center shadow-sm ${isDarkMode ? 'bg-white/10 border-white/20 text-gray-300' : 'bg-white/40 border-white/50 text-gray-500'}`}>
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                    {t('hero.btnWatch')}
                  </button>
                </div>

                <div className={`flex items-center gap-12 font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-green-500" />
                    <span className="text-base leading-tight" dangerouslySetInnerHTML={{ __html: t('hero.statsExpert').replace(' ', '<br/>') }}></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Lock className="w-6 h-6 text-green-500" />
                    <span className="text-base leading-tight">{t('hero.statsAnon').split(' ').slice(0,2).join(' ')}<br/>{t('hero.statsAnon').split(' ').slice(2).join(' ')}</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-teal-50 rounded-[3rem] transform translate-x-4 translate-y-4 -z-10"></div>
                <img 
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop" 
                  alt="Student relaxing in library" 
                  className="rounded-[2.5rem] object-cover w-full h-[600px] shadow-2xl"
                  referrerPolicy="no-referrer"
                />
                
                {/* Top Right Floating Badge */}
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/30 backdrop-blur-2xl border border-white/50 rounded-full shadow-xl flex items-center justify-center text-blue-600">
                  <Leaf className="w-6 h-6" />
                </div>

                {/* Bottom Right Floating Card */}
                <div className="absolute bottom-8 right-8 bg-white/20 backdrop-blur-3xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-5 rounded-2xl max-w-xs">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <Heart className="w-4 h-4 fill-current" />
                    </div>
                    <span className="text-xs font-bold tracking-wide text-gray-800">{t('hero.cardTitle')}</span>
                  </div>
                  <p className="text-sm text-gray-600">{t('hero.cardText')}</p>
                </div>
              </div>
            </section>

            {/* Wellness Tools Section */}
            <section id="solutions" className="py-24 relative z-10">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-[#0b132b]">{t('solutions.title')}</h2>
                  <p className="text-gray-500 text-lg">
                    {t('solutions.subtitle')}
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {/* Card 1 */}
                  <div className="relative bg-white/20 backdrop-blur-3xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] rounded-[2rem] overflow-hidden p-8 hover:bg-white/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center mb-6 border border-blue-200/50">
                      <BarChart2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-[#0b132b]">{t('solutions.card1Title')}</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {t('solutions.card1Text')}
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="relative bg-white/20 backdrop-blur-3xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] rounded-[2rem] overflow-hidden p-8 hover:bg-white/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-600 flex items-center justify-center mb-6 border border-green-200/50">
                      <Leaf className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-[#0b132b]">{t('solutions.card2Title')}</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {t('solutions.card2Text')}
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="relative bg-white/20 backdrop-blur-3xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] rounded-[2rem] overflow-hidden p-8 hover:bg-white/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-600 flex items-center justify-center mb-6 border border-purple-200/50">
                      <HeartHandshake className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-[#0b132b]">{t('solutions.card3Title')}</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {t('solutions.card3Text')}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Technology Section */}
            <section id="technology" className="py-24 bg-[#0b132b] text-white">
              <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-blue-900/50 text-blue-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-blue-800/50">
                      <Activity className="w-4 h-4" />
                      {t('tech.badge')}
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold mb-6">{t('tech.title')}</h2>
                    <p className="text-gray-400 text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: t('tech.subtitle').replace('XGBoost', '<b>XGBoost</b>').replace('20 điểm dữ liệu', '<b>20 điểm dữ liệu</b>').replace('20 data points', '<b>20 data points</b>') }} />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                      <div className="flex gap-4">
                        <div className="w-14 h-14 bg-blue-900/50 text-blue-400 rounded-2xl flex items-center justify-center shrink-0 border border-blue-800/50">
                          <Activity className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white mb-2">{t('tech.point1Title')}</h4>
                          <p className="text-gray-400 leading-relaxed text-sm">{t('tech.point1Text')}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="w-14 h-14 bg-green-900/50 text-green-400 rounded-2xl flex items-center justify-center shrink-0 border border-green-800/50">
                          <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white mb-2">{t('tech.point2Title')}</h4>
                          <p className="text-gray-400 leading-relaxed text-sm">{t('tech.point2Text')}</p>
                        </div>
                      </div>
                      
                       <div className="flex gap-4">
                        <div className="w-14 h-14 bg-purple-900/50 text-purple-400 rounded-2xl flex items-center justify-center shrink-0 border border-purple-800/50">
                          <Brain className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white mb-2">{t('tech.point3Title')}</h4>
                          <p className="text-gray-400 leading-relaxed text-sm">{t('tech.point3Text')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#111827] rounded-[2rem] p-8 border border-gray-800 relative shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-[2rem] pointer-events-none"></div>
                      <h4 className="text-lg font-bold text-white mb-6 text-center relative z-10 flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4 text-blue-400" />
                        {t('tech.modelTitle')}
                      </h4>
                      <div className="space-y-4 relative z-10">
                         <div className="bg-gray-900 p-5 rounded-xl text-sm font-mono text-gray-300 border border-gray-800">
                           <span className="text-blue-400">model</span> = XGBClassifier(<br/>
                           &nbsp;&nbsp;n_estimators=<span className="text-orange-400">200</span>,<br/>
                           &nbsp;&nbsp;learning_rate=<span className="text-orange-400">0.05</span>,<br/>
                           &nbsp;&nbsp;max_depth=<span className="text-orange-400">6</span>,<br/>
                           &nbsp;&nbsp;objective=<span className="text-green-400">'multi:softprob'</span><br/>
                           )<br/>
                           <span className="block mt-4 text-gray-500">/* {language === 'vi' ? 'Đầu ra dự báo' : language === 'zh' ? '预测输出' : language === 'de' ? 'Vorhersageausgabe' : 'Prediction output'}: LOW, MEDIUM, HIGH */</span>
                         </div>
                         <div className="bg-gray-900 p-4 rounded-xl text-sm font-mono text-gray-300 border border-gray-800 flex items-center justify-between">
                            <span>{t('tech.modelAcc')}</span>
                            <span className="bg-green-900/80 text-green-400 px-2 py-1 rounded font-bold border border-green-800">92.4%</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/30 bg-white/10 backdrop-blur-2xl pt-12 pb-8 relative z-10">
              <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <div className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>{t('appName')}</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>© 2026 MindScan AI: Thấu hiểu áp lực – Sẻ chia giải pháp.</div>
                </div>
                
                <div className={`flex items-center gap-6 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <button onClick={() => setShowPrivacyModal(true)} className={`transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}>{t('footer.privacy')}</button>
                  <button onClick={() => setShowEthicsModal(true)} className={`transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}>{t('footer.ethics')}</button>
                </div>

                <div className="flex items-center gap-4">
                  <button className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/10 border border-white/20 text-gray-400 hover:bg-white/20 hover:text-white' : 'bg-white/30 border border-white/40 text-gray-500 hover:bg-white/50 hover:text-gray-900'}`}>
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/10 border border-white/20 text-gray-400 hover:bg-white/20 hover:text-white' : 'bg-white/30 border border-white/40 text-gray-500 hover:bg-white/50 hover:text-gray-900'}`}>
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </footer>
          </motion.div>
        ) : !hasConsented ? (
          <motion.div 
            key="consent"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="container mx-auto px-6 py-12"
          >
            {renderConsentScreen()}
          </motion.div>
        ) : (
          <motion.div 
            key="survey"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="container mx-auto px-6 py-12 max-w-3xl"
          >
            {!isCompleted ? (
              <div className="relative bg-white/25 backdrop-blur-3xl border border-white/40 shadow-[0_16px_48px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.9)] rounded-[2rem] overflow-hidden p-8 md:p-12">
                {/* Progress Bar */}
                <div className="mb-12">
                  <div className="flex justify-between text-sm font-medium text-gray-500 mb-3">
                    <span>{t('survey.step')} {currentStep} / 5</span>
                    <span>{Math.round((currentStep / 5) * 100)}% {t('survey.completed')}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-600 rounded-full"
                      initial={{ width: `${((currentStep - 1) / 5) * 100}%` }}
                      animate={{ width: `${(currentStep / 5) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Survey Content */}
                <AnimatePresence mode="wait">
                  {renderStepContent()}
                </AnimatePresence>

                {/* Validation error banner */}
                {stepError && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {stepError}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-8 pt-8 border-t border-gray-200 flex items-center justify-between">
                  <button 
                    onClick={prevStep}
                    aria-label={t('survey.btnPrev')}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                  >
                    <ArrowLeft className="w-5 h-5" aria-hidden="true" /> {t('survey.btnPrev')}
                  </button>
                  <button 
                    onClick={nextStep}
                    aria-label={currentStep === 5 ? t('survey.btnSubmit') : t('survey.btnNext')}
                    className="relative overflow-hidden group px-8 py-3 rounded-full font-semibold bg-white/30 backdrop-blur-2xl text-blue-700 border border-white/50 shadow-[0_8px_32px_rgba(59,130,246,0.15)] hover:bg-white/50 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    {currentStep === 5 ? t('survey.btnSubmit') : t('survey.btnNext')} <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="relative bg-white/25 backdrop-blur-3xl border border-white/40 shadow-[0_16px_48px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.9)] rounded-[2rem] overflow-hidden p-8 md:p-12"
              >
                {isAnalyzing ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
                    <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>{t('survey.analyzingTitle')}</h2>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{t('survey.analyzingDesc')}</p>
                  </div>
                ) : aiResult ? (
                  <div className="text-left w-full max-w-4xl mx-auto">
                    
                    {/* 1. Biểu đồ Gauge */}
                    <div className="mb-12 flex flex-col items-center">
                      <GaugeChart level={aiResult.stress_level} confidence={aiResult.confidence_score} t={t} />
                    </div>

                    {/* 2. Biểu đồ Stacked Bar - Yếu tố tác động */}
                    <div className="mb-12">
                      <h3 className={`text-xl font-bold mb-6 text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{t('results.featureTitle')}</h3>
                      
                      {/* Legend */}
                      <div className="flex flex-wrap justify-center gap-4 mb-4">
                        {aiResult.feature_importance.map((item: any, idx: number) => (
                          <div key={idx} className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                            {item.feature}
                          </div>
                        ))}
                      </div>

                      <CustomStackedBar data={aiResult.feature_importance} height="h-16" />
                    </div>

                    {/* 3. Biểu đồ Line/Bar (Lịch sử ẩn danh) */}
                    {sessionHistory.length > 0 && (
                      <div className="mb-12">
                        <h3 className={`text-xl font-bold mb-6 text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{t('results.historyTitle')}</h3>
                        <div className="space-y-4">
                          {sessionHistory.map((session, idx) => (
                            <div key={idx} className={`flex items-center gap-4 backdrop-blur-sm border p-4 rounded-2xl ${isDarkMode ? 'bg-[#0b132b]/50 border-white/10' : 'bg-white/20 border-white/30'}`}>
                              <div className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${
                                session.level === 'High' ? 'bg-red-100 text-red-700' :
                                session.level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {session.date}
                              </div>
                              <div className="flex-1">
                                {session.features && <CustomStackedBar data={session.features} height="h-8" showLabels={false} />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. Action Cards — icon mapped by language-agnostic categoryKey */}
                    <div className="mb-12">
                      <h3 className={`text-xl font-bold mb-6 text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{t('results.recsTitle')}</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {(showAllRecs ? aiResult.recommendations : aiResult.recommendations.slice(0, 4)).map((rec, idx) => {
                          const key = (rec as any).categoryKey || '';
                          let Icon = Brain;
                          let colorClass = isDarkMode ? 'bg-blue-900/50 text-blue-400 border border-blue-800' : 'bg-blue-100 text-blue-600';
                          if (key === 'sleep')    { Icon = Moon;        colorClass = isDarkMode ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'bg-[#a7f3d0] text-[#047857]'; }
                          else if (key === 'study')   { Icon = BookOpen;    colorClass = isDarkMode ? 'bg-teal-900/50 text-teal-400 border border-teal-800' : 'bg-[#99f6e4] text-[#0f766e]'; }
                          else if (key === 'social')  { Icon = Users;       colorClass = isDarkMode ? 'bg-purple-900/50 text-purple-400 border border-purple-800' : 'bg-[#e9d5ff] text-[#7e22ce]'; }
                          else if (key === 'exercise'){ Icon = Activity;    colorClass = isDarkMode ? 'bg-slate-800 border border-slate-700 text-slate-300' : 'bg-[#e2e8f0] text-[#334155]'; }
                          else if (key === 'finance') { Icon = DollarSign;  colorClass = isDarkMode ? 'bg-rose-900/50 text-rose-400 border border-rose-800' : 'bg-[#fecdd3] text-[#be123c]'; }
                          else if (key === 'mental')  { Icon = HeartHandshake; colorClass = isDarkMode ? 'bg-purple-900/50 text-purple-400 border border-purple-800' : 'bg-purple-100 text-purple-600'; }

                          return (
                            <ActionCard 
                              key={rec.id}
                              id={rec.id}
                              title={rec.title}
                              description={rec.description}
                              icon={Icon}
                              colorClass={colorClass}
                              isBookmarked={bookmarkedRecs.includes(rec.id)}
                              bookmarkAriaLabel={t('results.saveRec')}
                              onBookmark={(e) => {
                                e.stopPropagation();
                                toggleBookmark(rec.id);
                              }}
                            />
                          );
                        })}
                      </div>
                      {/* Show more / show less toggle */}
                      {aiResult.recommendations.length > 4 && (
                        <div className="text-center mt-6">
                          <button
                            onClick={() => setShowAllRecs(prev => !prev)}
                            className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} font-medium text-sm underline underline-offset-4`}
                          >
                            {showAllRecs
                              ? (language === 'vi' ? 'Thu gọn' : language === 'de' ? 'Weniger anzeigen' : language === 'zh' ? '收起' : 'Show less')
                              : (language === 'vi' ? `Xem thêm ${aiResult.recommendations.length - 4} gợi ý` : language === 'de' ? `${aiResult.recommendations.length - 4} weitere anzeigen` : language === 'zh' ? `查看更多 ${aiResult.recommendations.length - 4} 条建议` : `Show ${aiResult.recommendations.length - 4} more`)
                            }
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 5. Disclaimer & Quyền riêng tư */}
                    <div className="mt-12 pt-8 border-t border-gray-100/20 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{t('results.disclaimer')}</p>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium ${isDarkMode ? 'bg-green-900/30 text-green-400 border border-green-800/50' : 'bg-green-50 text-green-700'}`}>
                        <ShieldCheck className="w-4 h-4" />
                        {t('results.consentConfirmed')}
                      </div>
                    </div>

                    <div className="text-center mt-8">
                      <button 
                        onClick={() => {
                          setIsSurveyOpen(false);
                          setIsCompleted(false);
                          setCurrentStep(1);
                          setAiResult(null);
                          setShowAllRecs(false);
                        }}
                        className={`font-medium underline underline-offset-4 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
                      >
                        {t('results.btnHome')}
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDarkMode ? 'bg-red-900/30 text-red-500' : 'bg-red-100 text-red-500'}`}>
                      <AlertTriangle className="w-10 h-10" />
                    </div>
                    <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>{t('results.errorTitle')}</h2>
                    <p className={`mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('results.errorDesc')}</p>
                    <button 
                      onClick={() => {
                        setIsSurveyOpen(false);
                        setIsCompleted(false);
                        setCurrentStep(1);
                        setAiResult(null);
                      }}
                      className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      {t('results.btnHome')}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

