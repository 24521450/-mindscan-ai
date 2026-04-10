/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Globe,
  Github,
  Facebook,
  LayoutDashboard,
  TrendingUp,
  Calendar,
  GitCompare
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Player } from '@lottiefiles/react-lottie-player';
import { analyzeSurveyData, AIRecommendation } from './services/geminiService';
import { translations } from './translations';

const GaugeChart = ({ level, confidence, t, isDarkMode }: { level: string, confidence: number, t?: (key: string) => string, isDarkMode?: boolean }) => {
  // Arc progress: Low=25%, Medium=55%, High=85% of the arc
  const arcProgress = level === 'Low' ? 0.25 : level === 'Medium' ? 0.55 : 0.85;

  // SVG arc calculation for a half-circle gauge
  const cx = 50, cy = 50, r = 40;
  const startAngle = Math.PI; // 180°
  const endAngle = startAngle + arcProgress * Math.PI;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = arcProgress > 0.5 ? 1 : 0;
  const arcPath = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;

  const levelDisplay = t
    ? (level === 'Low' ? t('results.low') : level === 'Medium' ? t('results.medium') : t('results.high'))
    : (level === 'Low' ? 'Low' : level === 'Medium' ? 'Medium' : 'High');
  const levelColor = level === 'Low' ? '#006b60' : level === 'Medium' ? '#006b60' : '#a53173';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-56 h-28 overflow-hidden">
        <svg viewBox="0 0 100 55" className="w-full h-full">
          <defs>
            <linearGradient id="gaugeGradientNew" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#5bf4de', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#6e3bd8', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          {/* Track */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={isDarkMode ? '#1e293b' : '#dde3e7'}
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Filled arc */}
          <motion.path
            d={arcPath}
            fill="none"
            stroke="url(#gaugeGradientNew)"
            strokeWidth="10"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
        </svg>
      </div>
      <div className="text-center mt-1">
        <div
          className="text-4xl font-black leading-tight"
          style={{ color: levelColor, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
        >
          {levelDisplay}
        </div>
        <div className={`text-xs font-semibold mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
          style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
          {Math.round(confidence * 100)}% {t ? t('ui.confidenceInterval') : 'Confidence Interval'}
        </div>
      </div>
    </div>
  );
};


// Fallback palette for history entries that may have been saved without colors
const BAR_FALLBACK_COLORS = ['#6ee7b7', '#2dd4bf', '#c084fc', '#94a3b8', '#fb7185', '#fbbf24', '#60a5fa', '#a78bfa'];

const CustomStackedBar = ({ data, height = 'h-12', showLabels = true }: { data: any[], height?: string, showLabels?: boolean }) => {
  const total = data.reduce((sum: number, item: any) => sum + item.importance, 0);
  if (!total) return <div className={`flex w-full ${height} rounded-2xl bg-gray-100`} />;
  return (
    <div className={`flex w-full ${height} rounded-2xl overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] bg-gray-100/50 p-1 gap-1 backdrop-blur-sm`}>
      {data.map((item: any, idx: number) => {
        // Use saved color, but fall back to palette if missing or nearly-white
        const color = (!item.color || item.color === '#f3f4f6') ? BAR_FALLBACK_COLORS[idx % BAR_FALLBACK_COLORS.length] : item.color;
        return (
          <div
            key={`${item.feature}-${idx}`}
            style={{ width: `${(item.importance / total) * 100}%`, backgroundColor: color }}
            className="h-full flex items-center justify-center text-white font-bold text-sm rounded-xl relative overflow-hidden group"
            title={`${item.feature}: ${item.importance}%`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 drop-shadow-md">{showLabels && item.importance > 8 ? item.importance : ''}</span>
          </div>
        );
      })}
    </div>
  );
};


const ActionCard = ({ title, description, icon: Icon, colorClass, isBookmarked, onBookmark, bookmarkAriaLabel, detailsLabel }: { id: string, title: string, description: string, icon: any, colorClass: string, isBookmarked: boolean, onBookmark: (e: React.MouseEvent) => void, bookmarkAriaLabel: string, detailsLabel: string, key?: string }) => {
  return (
    <div className="analytics-glass-card dark:bg-slate-800/50 border border-white/50 dark:border-white/10 shadow-[0_8px_24px_rgba(45,51,55,0.06)] rounded-[2rem] overflow-hidden p-6 flex flex-col h-full transition-all duration-300 hover:-translate-y-2 group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${colorClass}`}
        style={{ boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8)' }}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2"
          style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{title}</h4>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-4"
          style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
          {description}
        </p>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${isBookmarked ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`}
          style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
          {detailsLabel}
        </span>
        <button
          onClick={onBookmark}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border
            ${isBookmarked
              ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-200'
              : 'bg-white dark:bg-white/10 text-slate-400 border-slate-200 dark:border-white/20 hover:bg-teal-600 hover:text-white hover:border-teal-600'}`}
          aria-label={bookmarkAriaLabel}
        >
          {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};


type ActionCardItem = {
  id: string;
  title: string;
  description: string;
  categoryKey: string;
};

const LiquidButton = ({ children, onClick, variant = 'primary', className = "", icon: Icon }: any) => {
  const baseStyle = "relative overflow-hidden rounded-full font-semibold px-8 py-4 transition-all duration-300 flex items-center justify-center gap-2 group";
  const variants = {
    primary: "bg-white/30 dark:bg-blue-600/30 backdrop-blur-2xl text-blue-700 dark:text-blue-300 border border-white/50 dark:border-blue-500/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] dark:shadow-blue-900/40 hover:bg-white/40 dark:hover:bg-blue-600/50 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,1)] hover:-translate-y-0.5",
    secondary: "bg-black/5 dark:bg-white/5 backdrop-blur-2xl text-slate-800 dark:text-slate-200 border border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.5)] dark:shadow-slate-900/40 hover:bg-black/10 dark:hover:bg-white/10 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:-translate-y-0.5",
    outline: "bg-transparent border-2 border-slate-300/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-white/20 dark:hover:bg-white/5"
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {/* Liquid hover effect overlay */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer delay-100"></div>
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {Icon && <Icon className="w-5 h-5 transition-transform group-hover:translate-x-1" />}
      </span>
    </button>
  );
};


export default function App() {
  const [hasConsented, setHasConsented] = useState(false);
  const [language, setLanguage] = useState<'vi' | 'en' | 'de' | 'zh' | 'fr'>('en');
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
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
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [stepError, setStepError] = useState<string>('');
  const [earthRotation, setEarthRotation] = useState(0);
  const [activeDataModule, setActiveDataModule] = useState<'dashboard' | 'analytics'>('dashboard');
  const [stressTrendPeriod, setStressTrendPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [radarAnimated, setRadarAnimated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const radarRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  const languageOptions = [
    { code: 'en', label: 'English', flag: 'gb' },
    { code: 'fr', label: 'Français', flag: 'fr' },
    { code: 'de', label: 'Deutsch', flag: 'de' },
    { code: 'zh', label: '中文', flag: 'cn' },
    { code: 'vi', label: 'Tiếng Việt', flag: 'vn' }
  ] as const;

  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly change direction and amount every 2.66s (1.5x faster than 4s)
      const direction = Math.random() > 0.5 ? 1 : -1;
      const amount = 30 + Math.random() * 60; // 30 to 90 degrees
      setEarthRotation(prev => prev + (direction * amount));
    }, 2666);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Translation helper
  const t = (key: string): string => {
    const keys = key.split('.');
    let result: any = translations[language];
    for (const k of keys) {
      if (result && Object.prototype.hasOwnProperty.call(result, k)) {
        result = result[k];
      } else {
        let fallback: any = translations.en;
        for (const fk of keys) {
          if (fallback && Object.prototype.hasOwnProperty.call(fallback, fk)) {
            fallback = fallback[fk];
          } else {
            return key;
          }
        }
        return typeof fallback === 'string' ? fallback : key;
      }
    }
    return typeof result === 'string' ? result : key;
  };

  const formatTemplate = (template: string, vars: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));

  const tWith = (key: string, vars: Record<string, string | number>) =>
    formatTemplate(t(key), vars);

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
    mental_health_history: 'no',
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
        setStepError(t('survey.errors.invalidAge'));
        return;
      }
      if (!formData.gender) {
        setStepError(t('survey.errors.selectGender'));
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
      className={`relative backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.1)] rounded-[2rem] overflow-hidden p-8 md:p-12 max-w-3xl w-full mx-auto text-left ${isDarkMode ? 'bg-[#0b132b]/95 border border-white/10 text-white' : 'bg-white/20 border border-white/40'}`}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 dark:bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-inner border relative z-10 ${isDarkMode ? 'bg-gradient-to-br from-blue-900/50 to-teal-900/50 text-blue-400 border-white/10' : 'bg-gradient-to-br from-blue-100 to-teal-100 text-blue-600 border-white'}`}>
        <ShieldCheck className="w-8 h-8" />
      </div>
      <h2 className={`text-3xl font-extrabold mb-6 tracking-tight relative z-10 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('consent.title')}</h2>

      <div className={`space-y-4 mb-10 h-64 overflow-y-auto pr-4 font-medium leading-relaxed relative z-10 custom-scrollbar ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
        <p>{t('consent.welcome')}</p>
        <h3 className={`font-bold mt-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('consent.h1')}</h3>
        <p>{t('consent.p1')}</p>

        <h3 className={`font-bold mt-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('consent.h2')}</h3>
        <p>{t('consent.p2')}</p>

        <h3 className={`font-bold mt-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('consent.h3')}</h3>
        <p>{t('consent.p3')}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-end relative z-10">
        <LiquidButton
          variant="secondary"
          onClick={() => setIsSurveyOpen(false)}
        >
          {t('consent.btnDecline')}
        </LiquidButton>
        <LiquidButton
          onClick={acceptConsent}
        >
          {t('consent.btnAccept')}
        </LiquidButton>
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
                  <div className="flex gap-4 mt-6"><span className="text-gray-500 italic">/* {t('ui.predictionOutput')}: LOW, MEDIUM, HIGH */</span></div>
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
            className={`relative backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-[2rem] overflow-hidden p-8 md:p-10 max-w-lg w-full text-center ${isDarkMode ? 'bg-[#0b132b]/80 border-white/10' : 'bg-white/95 border border-gray-200'}`}
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
    const questionCardClass = `space-y-4 rounded-[2rem] p-6 border shadow-[0_8px_32px_0_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] ${isDarkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white/20 backdrop-blur-3xl border-white/40'}`;
    const questionLabelClass = `block text-base font-bold ${isDarkMode ? 'text-gray-200' : 'text-slate-800'}`;
    const textHintClass = `text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`;
    const inputClass = `w-full p-4 rounded-2xl border-2 focus:outline-none focus:ring-4 transition-all font-medium ${isDarkMode ? 'bg-[#0b132b]/60 border-white/15 text-white focus:border-blue-500 focus:ring-blue-500/20' : 'bg-white/90 border-slate-100 text-slate-700 focus:border-blue-500 focus:ring-blue-500/10'}`;
    const selectClass = `w-full p-4 rounded-2xl border-2 appearance-none focus:outline-none focus:ring-4 transition-all font-medium ${isDarkMode ? 'bg-[#0b132b]/60 border-white/15 text-white focus:border-blue-500 focus:ring-blue-500/20' : 'bg-white/90 border-slate-100 text-slate-700 focus:border-blue-500 focus:ring-blue-500/10'}`;
    const choiceButtonClass = (selected: boolean) => (
      `px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 border focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${selected
        ? (isDarkMode
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)] border-transparent')
        : (isDarkMode
          ? 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50')
      }`
    );

    switch (currentStep) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
            <h2 className={`text-2xl font-extrabold mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('questions.s1Title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q1')}</label>
                <input type="number" min="10" max="100" value={formData.age} onChange={(e) => handleInputChange('age', e.target.value)} placeholder="20" className={inputClass} />
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q2')}</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { val: 'male', label: t('questions.genderMale') },
                    { val: 'female', label: t('questions.genderFemale') },
                    { val: 'other', label: t('questions.genderOther') }
                  ].map(gender => (
                    <button key={gender.val} onClick={() => handleInputChange('gender', gender.val)} className={choiceButtonClass(formData.gender === gender.val)}>{gender.label}</button>
                  ))}
                </div>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q3')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.academic_performance} onChange={(v) => handleInputChange('academic_performance', v)} ariaLabel="Academic performance" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>5</span></div>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q4')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.study_load} onChange={(v) => handleInputChange('study_load', v)} ariaLabel="Study load" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>5</span></div>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q5')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.teacher_student_relationship} onChange={(v) => handleInputChange('teacher_student_relationship', v)} ariaLabel="Teacher relationship" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>5</span></div>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q6')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.future_career_concerns} onChange={(v) => handleInputChange('future_career_concerns', v)} ariaLabel="Career concern" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>5</span></div>
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
            <h2 className={`text-2xl font-extrabold mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('questions.s2Title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q7')}</label>
                <CustomSlider min={0} max={21} step={1} value={formData.anxiety_level} onChange={(v) => handleInputChange('anxiety_level', v)} ariaLabel="Anxiety" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>21</span></div>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q8')}</label>
                <CustomSlider min={0} max={27} step={1} value={formData.depression} onChange={(v) => handleInputChange('depression', v)} ariaLabel="Depression" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>27</span></div>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q9')}</label>
                <CustomSlider min={0} max={30} step={1} value={formData.self_esteem} onChange={(v) => handleInputChange('self_esteem', v)} ariaLabel="Self Esteem" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>30</span></div>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q10')}</label>
                <div className="flex gap-4">
                  {[
                    { val: 'yes', label: t('questions.yes') },
                    { val: 'no', label: t('questions.no') }
                  ].map(opt => (
                    <button key={opt.val} onClick={() => handleInputChange('mental_health_history', opt.val)} className={choiceButtonClass(formData.mental_health_history === opt.val)}>{opt.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
            <h2 className={`text-2xl font-extrabold mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('questions.s3Title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q11')}</label>
                <select value={formData.blood_pressure} onChange={(e) => handleInputChange('blood_pressure', parseInt(e.target.value))} className={selectClass}>
                  <option value={1}>{t('questions.bpLow')}</option>
                  <option value={2}>{t('questions.bpNormal')}</option>
                  <option value={3}>{t('questions.bpHigh')}</option>
                </select>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q12')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.sleep_quality} onChange={(v) => handleInputChange('sleep_quality', v)} ariaLabel="Sleep" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>5</span></div>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q13')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.headache} onChange={(v) => handleInputChange('headache', v)} ariaLabel="Headache" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>5</span></div>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q14')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.breathing_problem} onChange={(v) => handleInputChange('breathing_problem', v)} ariaLabel="Breathing" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>5</span></div>
              </div>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
            <h2 className={`text-2xl font-extrabold mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('questions.s4Title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q15')}</label>
                <CustomSlider min={0} max={3} step={1} value={formData.social_support} onChange={(v) => handleInputChange('social_support', v)} ariaLabel="Social support" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>3</span></div>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q16')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.peer_pressure} onChange={(v) => handleInputChange('peer_pressure', v)} ariaLabel="Peer pressure" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>5</span></div>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q17')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.extracurricular_activities} onChange={(v) => handleInputChange('extracurricular_activities', v)} ariaLabel="Extracurricular" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>5</span></div>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q18')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.bullying} onChange={(v) => handleInputChange('bullying', v)} ariaLabel="Bullying" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>5</span></div>
              </div>
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
            <h2 className={`text-2xl font-extrabold mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('questions.s5Title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q19')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.noise_level} onChange={(v) => handleInputChange('noise_level', v)} ariaLabel="Noise" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>5</span></div>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q20')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.living_conditions} onChange={(v) => handleInputChange('living_conditions', v)} ariaLabel="Living conditions" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>5</span></div>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q21')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.safety} onChange={(v) => handleInputChange('safety', v)} ariaLabel="Safety" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>5</span></div>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q22')}</label>
                <CustomSlider min={0} max={5} step={1} value={formData.basic_needs} onChange={(v) => handleInputChange('basic_needs', v)} ariaLabel="Basic needs" />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>5</span></div>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const buildInsightCopy = (result: AIRecommendation) => {
    const sorted = [...result.feature_importance].sort((a, b) => b.importance - a.importance);
    const formatTop = (count: number) =>
      sorted
        .slice(0, count)
        .map((item) => `${item.feature} (${Math.round(item.importance)}%)`)
        .join(', ');

    const levelLabel = t(`results.${result.stress_level.toLowerCase()}`);
    const confidencePct = Math.round(result.confidence_score * 100);
    const primary = sorted[0]?.feature;
    const secondary = sorted[1]?.feature;

    switch (language) {
      case 'en':
        return {
          trends: `Current stress level: ${levelLabel} (confidence ${confidencePct}%). Top trends: ${formatTop(3)}.`,
          touchpoints: `Strongest drivers: ${formatTop(2)}. Prioritize ${primary}${secondary ? ` and ${secondary}` : ''}.`
        };
      case 'fr':
        return {
          trends: `Niveau de stress actuel: ${levelLabel} (confiance ${confidencePct}%). Tendances principales: ${formatTop(3)}.`,
          touchpoints: `Facteurs les plus influents: ${formatTop(2)}. Priorisez ${primary}${secondary ? ` et ${secondary}` : ''}.`
        };
      case 'de':
        return {
          trends: `Aktueller Stress-Level: ${levelLabel} (Konfidenz ${confidencePct}%). Wichtigste Trends: ${formatTop(3)}.`,
          touchpoints: `Stärkste Einflussfaktoren: ${formatTop(2)}. Priorisieren Sie ${primary}${secondary ? ` und ${secondary}` : ''}.`
        };
      case 'zh':
        return {
          trends: `当前压力水平：${levelLabel}（置信度 ${confidencePct}%）。主要趋势：${formatTop(3)}。`,
          touchpoints: `影响最大的因素：${formatTop(2)}。优先关注 ${primary}${secondary ? ` 与 ${secondary}` : ''}。`
        };
      default:
        return {
          trends: `Mức stress hiện tại: ${levelLabel} (độ tin cậy ${confidencePct}%). Xu hướng chính: ${formatTop(3)}.`,
          touchpoints: `Các yếu tố ảnh hưởng mạnh nhất: ${formatTop(2)}. Ưu tiên theo dõi ${primary}${secondary ? ` và ${secondary}` : ''}.`
        };
    }
  };

  // ─── Dashboard Chart Data ───────────────────────────────────────────────
  const buildRadarData = () => {
    // Normalize each dimension to 0–100
    const study = Math.round(((Number(formData.academic_performance) + (5 - Number(formData.study_load))) / 10) * 100);
    const sleep = Math.round((Number(formData.sleep_quality) / 5) * 100);
    const social = Math.round(((Number(formData.social_support) / 3 + Number(formData.extracurricular_activities) / 5) / 2) * 100);
    const finance = Math.round(((Number(formData.basic_needs) + Number(formData.living_conditions)) / 10) * 100);
    const exercise = Math.round(((Number(formData.extracurricular_activities) / 5 * 0.6) + ((5 - Number(formData.headache)) / 5 * 0.4)) * 100);
    return [
      { subject: 'Study', value: Math.min(100, Math.max(5, study)), fullMark: 100 },
      { subject: 'Sleep', value: Math.min(100, Math.max(5, sleep)), fullMark: 100 },
      { subject: 'Social', value: Math.min(100, Math.max(5, social)), fullMark: 100 },
      { subject: 'Finance', value: Math.min(100, Math.max(5, finance)), fullMark: 100 },
      { subject: 'Exercise', value: Math.min(100, Math.max(5, exercise)), fullMark: 100 },
    ];
  };

  const buildStressTrendData = () => {
    const weekly = [
      { label: 'Mon', stress: 45, avg: 52 },
      { label: 'Tue', stress: 62, avg: 55 },
      { label: 'Wed', stress: 38, avg: 50 },
      { label: 'Thu', stress: 71, avg: 58 },
      { label: 'Fri', stress: 55, avg: 53 },
      { label: 'Sat', stress: 30, avg: 42 },
      { label: 'Sun', stress: 25, avg: 38 },
    ];
    const monthly = [
      { label: 'W1', stress: 48, avg: 50 },
      { label: 'W2', stress: 65, avg: 54 },
      { label: 'W3', stress: 42, avg: 51 },
      { label: 'W4', stress: 58, avg: 55 },
    ];
    // Blend with actual session data if available
    if (sessionHistory.length > 0) {
      const lastScore = sessionHistory[sessionHistory.length - 1]?.stressScore ?? 50;
      if (stressTrendPeriod === 'weekly') {
        weekly[weekly.length - 1].stress = lastScore;
      } else {
        monthly[monthly.length - 1].stress = lastScore;
      }
    }
    return stressTrendPeriod === 'weekly' ? weekly : monthly;
  };

  const buildCalendarData = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
    // Stress levels: 0=none, 1=low, 2=medium, 3=high
    const stressPattern = [1, 1, 2, 3, 2, 1, 1, 2, 3, 3, 2, 1, 1, 2, 3, 3, 2, 2, 1, 1, 2, 2, 2, 1, 1, 1, 2, 3, 3, 2, 1];
    const currentStress = aiResult?.stress_level === 'High' ? 3 : aiResult?.stress_level === 'Medium' ? 2 : 1;
    stressPattern[now.getDate() - 1] = currentStress;
    return { daysInMonth, firstDayOfWeek: firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1, stressPattern, month, year };
  };

  const buildPeerData = () => [
    {
      label: 'Sleep Hours',
      you: Math.round((Number(formData.sleep_quality) / 5) * 10),
      avg: 7,
      unit: 'hrs',
      youPct: Math.round((Number(formData.sleep_quality) / 5) * 100),
      avgPct: 70,
    },
    {
      label: 'Study Load',
      you: Number(formData.study_load),
      avg: 3,
      unit: '/5',
      youPct: Math.round((Number(formData.study_load) / 5) * 100),
      avgPct: 60,
    },
    {
      label: 'Social Activity',
      you: Number(formData.social_support),
      avg: 2,
      unit: '/3',
      youPct: Math.round((Number(formData.social_support) / 3) * 100),
      avgPct: 65,
    },
    {
      label: 'Exercise Score',
      you: Number(formData.extracurricular_activities),
      avg: 3,
      unit: '/5',
      youPct: Math.round((Number(formData.extracurricular_activities) / 5) * 100),
      avgPct: 60,
    },
    {
      label: 'Basic Needs',
      you: Number(formData.basic_needs),
      avg: 4,
      unit: '/5',
      youPct: Math.round((Number(formData.basic_needs) / 5) * 100),
      avgPct: 80,
    },
  ];

  // Custom Radar tooltip
  const RadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0];
      return (
        <div className={`px-3 py-2 rounded-xl text-xs font-bold shadow-lg border ${isDarkMode ? 'bg-slate-900 border-white/10 text-slate-100' : 'bg-white border-white/60 text-slate-800'
          }`} style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
          <div className="text-[10px] uppercase tracking-widest mb-1 text-slate-400">{d.payload?.subject}</div>
          <div style={{ color: '#006b60' }}>{d.value}<span className="text-slate-400 font-normal">/100</span></div>
        </div>
      );
    }
    return null;
  };

  const AreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`px-3 py-2 rounded-xl text-xs shadow-lg border ${isDarkMode ? 'bg-slate-900 border-white/10 text-slate-100' : 'bg-white border-white/60 text-slate-800'
          }`} style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
          <div className="font-bold mb-1">{label}</div>
          {payload.map((p: any, i: number) => (
            <div key={i} style={{ color: p.color }} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
              {p.name}: <span className="font-bold">{p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderDashboardView = () => {
    const radarData = buildRadarData();
    const trendData = buildStressTrendData();
    const calendar = buildCalendarData();
    const peerData = buildPeerData();
    const localeMap = { vi: 'vi-VN', en: 'en-US', fr: 'fr-FR', de: 'de-DE', zh: 'zh-CN' } as const;
    const monthName = new Date(calendar.year, calendar.month).toLocaleString(localeMap[language], { month: 'long', year: 'numeric' });
    const dayLabels = [t('ui.calendar.mon'), t('ui.calendar.tue'), t('ui.calendar.wed'), t('ui.calendar.thu'), t('ui.calendar.fri'), t('ui.calendar.sat'), t('ui.calendar.sun')];
    const stressColors = [
      isDarkMode ? '#1e293b' : '#f1f4f6',   // 0 = no data
      '#5bf4de',  // 1 = low
      '#6e3bd8',  // 2 = medium
      '#a53173',  // 3 = high
    ];

    return (
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className={`text-3xl lg:text-4xl font-extrabold tracking-tight`}
              style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
              {t('ui.dashboard.title')}
            </h2>
            <p className={`mt-2 text-sm md:text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
              style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
              {t('ui.dashboard.subtitle')}
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide shrink-0 ${isDarkMode ? 'bg-teal-500/15 text-teal-300' : 'bg-teal-600/10 text-teal-700'
            }`} style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
            <Activity className="w-4 h-4" /> {t('ui.dashboard.period')}
          </div>
        </div>

        {/* Row 1: Radar Chart + Summary Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Radar Chart */}
          <div className={`lg:col-span-7 analytics-glass-card rounded-[2rem] p-6 md:p-8 shadow-sm ${isDarkMode ? 'dark' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
                  style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{t('ui.dashboard.lifeBalance')}</h3>
                <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                  style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.dashboard.lifeBalanceDesc')}</p>
              </div>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${isDarkMode ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-teal-100 text-teal-700 border border-teal-200'
                }`} style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.live')}</span>
            </div>
            <div className="w-full" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <defs>
                    <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#006b60" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#5bf4de" stopOpacity={0.05} />
                    </radialGradient>
                  </defs>
                  <PolarGrid
                    stroke={isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}
                    strokeDasharray="4 4"
                  />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 700, fontFamily: "'Manrope', 'Inter', sans-serif" }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: isDarkMode ? '#475569' : '#94a3b8', fontSize: 9 }}
                    tickCount={4}
                    stroke="transparent"
                  />
                  <Tooltip content={<RadarTooltip />} />
                  <Radar
                    name="You"
                    dataKey="value"
                    stroke="#006b60"
                    strokeWidth={2.5}
                    fill="url(#radarFill)"
                    isAnimationActive={true}
                    animationBegin={200}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    dot={{ fill: '#006b60', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {radarData.map(d => (
                <div key={d.subject} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{
                    backgroundColor: d.value >= 70 ? '#006b60' : d.value >= 40 ? '#6e3bd8' : '#a53173'
                  }} />
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                    style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
                    {d.subject}: <span style={{ color: d.value >= 70 ? '#006b60' : d.value >= 40 ? '#6e3bd8' : '#a53173' }}>{d.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Column */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {radarData.map((d, i) => {
              const icons = [BookOpen, Moon, Users, DollarSign, Activity];
              const Icon = icons[i];
              const colors = ['#006b60', '#6e3bd8', '#a53173', '#48e5d0', '#f59e0b'];
              const color = colors[i];
              const level = d.value >= 70 ? t('ui.status.good') : d.value >= 40 ? t('ui.status.fair') : t('ui.status.needsAttention');
              const levelColor = d.value >= 70 ? '#006b60' : d.value >= 40 ? '#6e3bd8' : '#a53173';
              return (
                <div key={d.subject} className={`analytics-glass-card rounded-2xl p-4 flex items-center gap-4 ${isDarkMode ? 'dark' : ''}`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: color + '20', color }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}
                        style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{d.subject}</span>
                      <span className="text-xs font-bold" style={{ color: levelColor, fontFamily: "'Manrope', 'Inter', sans-serif" }}>{level}</span>
                    </div>
                    <div className={`h-2 rounded-full w-full overflow-hidden ${isDarkMode ? 'bg-slate-700/60' : 'bg-slate-100'}`}>
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${d.value}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm font-black shrink-0 w-9 text-right ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}
                    style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{d.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 2: Area Chart + Calendar Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Stress Trend Area Chart */}
          <div className={`lg:col-span-8 analytics-glass-card rounded-[2rem] p-6 md:p-8 shadow-sm ${isDarkMode ? 'dark' : ''}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
                  style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{t('ui.dashboard.stressTrend')}</h3>
                <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                  style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.dashboard.stressTrendDesc')}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStressTrendPeriod('weekly')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${stressTrendPeriod === 'weekly'
                      ? (isDarkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-600/10 text-teal-700')
                      : (isDarkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100/70')
                    }`} style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.weekly')}</button>
                <button
                  onClick={() => setStressTrendPeriod('monthly')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${stressTrendPeriod === 'monthly'
                      ? (isDarkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-600/10 text-teal-700')
                      : (isDarkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100/70')
                    }`} style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.monthly')}</button>
              </div>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006b60" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#006b60" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6e3bd8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6e3bd8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 11, fontWeight: 700, fontFamily: "'Manrope', 'Inter', sans-serif" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10, fontFamily: "'Manrope', 'Inter', sans-serif" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<AreaTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="avg"
                    name={t('ui.campusAvg')}
                    stroke="#6e3bd8"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    fill="url(#avgGrad)"
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1200}
                  />
                  <Area
                    type="monotone"
                    dataKey="stress"
                    name={t('ui.yourStress')}
                    stroke="#006b60"
                    strokeWidth={3}
                    fill="url(#stressGrad)"
                    strokeLinecap="round"
                    dot={{ fill: '#006b60', r: 4, strokeWidth: 2.5, stroke: isDarkMode ? '#0f172a' : '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#006b60' }}
                    isAnimationActive={true}
                    animationDuration={1400}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11, fontFamily: "'Manrope', 'Inter', sans-serif", fontWeight: 700 }}>{value}</span>
                    )}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Calendar Heatmap */}
          <div className={`lg:col-span-4 analytics-glass-card rounded-[2rem] p-6 shadow-sm ${isDarkMode ? 'dark' : ''}`}>
            <h3 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
              style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{t('ui.dashboard.moodCalendar')}</h3>
            <p className={`text-xs mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
              style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{monthName}</p>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayLabels.map(d => (
                <div key={d} className={`text-center text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`} style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{d}</div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: calendar.firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {/* Day cells */}
              {Array.from({ length: calendar.daysInMonth }).map((_, i) => {
                const day = i + 1;
                const stressLevel = calendar.stressPattern[i] ?? 0;
                const bgColor = stressColors[stressLevel];
                const today = new Date().getDate() === day && new Date().getMonth() === calendar.month;
                return (
                  <div
                    key={`day-${day}`}
                    className="aspect-square rounded-lg transition-transform hover:scale-110 relative flex items-center justify-center"
                    style={{ backgroundColor: bgColor, cursor: 'default' }}
                      title={`${t('ui.day')} ${day}: ${stressLevel === 0 ? t('ui.noData') :
                        stressLevel === 1 ? t('ui.lowStress') :
                          stressLevel === 2 ? t('ui.mediumStress') : t('ui.highStress')
                      }`}
                  >
                    {today && (
                      <span className="absolute inset-0 rounded-lg ring-2 ring-offset-1 ring-white/80" />
                    )}
                    <span className={`text-[9px] font-black ${stressLevel >= 2 ? 'text-white/80' : (isDarkMode ? 'text-slate-400' : 'text-slate-500')
                      }`}>{day}</span>
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="mt-4 flex items-center justify-between">
              <span className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('results.low')}</span>
              <div className="flex gap-1.5 items-center">
                {stressColors.slice(1).map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('results.high')}</span>
            </div>
          </div>
        </div>

        {/* Row 3: Peer Comparison Horizontal Bar Chart */}
        <div className={`analytics-glass-card rounded-[2rem] p-6 md:p-8 shadow-sm ${isDarkMode ? 'dark' : ''}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
                style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{t('ui.dashboard.peerComparison')}</h3>
              <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.dashboard.peerComparisonDesc')}</p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-2.5 rounded-full" style={{ background: 'linear-gradient(90deg, #006b60, #48e5d0)' }} />
                <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                  style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.you')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-2.5 rounded-full" style={{ backgroundColor: isDarkMode ? '#334155' : '#ddcdff' }} />
                <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                  style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.campusAvg')}</span>
              </div>
            </div>
          </div>
          <div className="space-y-7">
            {peerData.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}
                    style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.youPct >= item.avgPct
                        ? (isDarkMode ? 'bg-teal-500/15 text-teal-300' : 'bg-teal-600/10 text-teal-700')
                        : (isDarkMode ? 'bg-purple-500/15 text-purple-300' : 'bg-purple-50 text-purple-700')
                      }`} style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
                      You: {item.you}{item.unit}
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                      style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>vs Avg: {item.avg}{item.unit}</span>
                  </div>
                </div>
                {/* Avg bar (background) */}
                <div className="relative h-5 w-full rounded-full overflow-hidden" style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${item.avgPct}%`, background: isDarkMode ? '#334155' : '#ddcdff' }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-1200 ease-out"
                    style={{
                      width: `${item.youPct}%`,
                      background: 'linear-gradient(90deg, #006b60, #48e5d0)',
                      boxShadow: '4px 0 12px rgba(0,107,96,0.35)'
                    }}
                  />
                  {/* Value label inside bar */}
                  {item.youPct > 15 && (
                    <span className="absolute inset-y-0 flex items-center text-[10px] font-black text-white/90 px-2"
                      style={{ left: `${Math.min(item.youPct - 8, 85)}%`, fontFamily: "'Manrope', 'Inter', sans-serif" }}>
                      {item.youPct}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const insightCopy = aiResult ? buildInsightCopy(aiResult) : null;
  const insightMeta = aiResult
    ? {
      levelLabel: aiResult.stress_level === 'Low' ? 'Low' : aiResult.stress_level === 'Medium' ? 'Medium' : 'High',
      confidencePct: Math.round(aiResult.confidence_score * 100),
      topFeatures: [...aiResult.feature_importance].sort((a, b) => b.importance - a.importance).slice(0, 2)
    }
    : null;

  const levelBadgeClass = (level?: string) => {
    if (level === 'High') return isDarkMode ? 'bg-rose-900/40 text-rose-300 border-rose-800/50' : 'bg-rose-50 text-rose-700 border-rose-100';
    if (level === 'Medium') return isDarkMode ? 'bg-amber-900/40 text-amber-300 border-amber-800/50' : 'bg-amber-50 text-amber-700 border-amber-100';
    return isDarkMode ? 'bg-emerald-900/40 text-emerald-300 border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border-emerald-100';
  };

  const buildPersonalizedActionCards = (result: AIRecommendation, data: typeof formData): ActionCardItem[] => {
    const cards: ActionCardItem[] = [];

    const addCard = (card: ActionCardItem) => {
      if (!cards.some(existing => existing.id === card.id)) {
        cards.push(card);
      }
    };

    const addTemplate = (
      id: string,
      categoryKey: string,
      titleKey: string,
      descKey: string,
      vars: Record<string, string | number> = {}
    ) => {
      addCard({
        id,
        categoryKey,
        title: t(titleKey),
        description: tWith(descKey, vars)
      });
    };

    const sleepScore = Number(data.sleep_quality);
    const studyLoadScore = Number(data.study_load);
    const academicScore = Number(data.academic_performance);
    const anxietyScore = Number(data.anxiety_level);
    const depressionScore = Number(data.depression);
    const supportScore = Number(data.social_support);
    const peerScore = Number(data.peer_pressure);
    const bullyingScore = Number(data.bullying);
    const activityScore = Number(data.extracurricular_activities);
    const needsScore = Math.min(Number(data.basic_needs), Number(data.living_conditions));
    const reliefScore = Math.max(Number(data.headache), Number(data.breathing_problem));

    if (sleepScore <= 2) {
      addTemplate('auto-sleep-reset', 'sleep', 'results.actionCards.sleepTitle', 'results.actionCards.sleepDesc', { score: sleepScore });
    }
    if (studyLoadScore >= 4) {
      addTemplate('auto-study-load', 'study', 'results.actionCards.studyLoadTitle', 'results.actionCards.studyLoadDesc', { score: studyLoadScore });
    }
    if (academicScore <= 2) {
      addTemplate('auto-study-focus', 'study', 'results.actionCards.studyFocusTitle', 'results.actionCards.studyFocusDesc', { score: academicScore });
    }
    if (anxietyScore >= 14) {
      addTemplate('auto-anxiety', 'mental', 'results.actionCards.anxietyTitle', 'results.actionCards.anxietyDesc', { score: anxietyScore });
    }
    if (depressionScore >= 14) {
      addTemplate('auto-mood', 'mental', 'results.actionCards.moodTitle', 'results.actionCards.moodDesc', { score: depressionScore });
    }
    if (supportScore <= 1) {
      addTemplate('auto-support', 'social', 'results.actionCards.supportTitle', 'results.actionCards.supportDesc', { score: supportScore });
    }
    if (peerScore >= 4) {
      addTemplate('auto-peer-pressure', 'social', 'results.actionCards.peerTitle', 'results.actionCards.peerDesc', { score: peerScore });
    }
    if (bullyingScore >= 3) {
      addTemplate('auto-bullying', 'social', 'results.actionCards.bullyingTitle', 'results.actionCards.bullyingDesc', { score: bullyingScore });
    }
    if (activityScore <= 1) {
      addTemplate('auto-activity', 'exercise', 'results.actionCards.activityTitle', 'results.actionCards.activityDesc', { score: activityScore });
    }
    if (needsScore <= 2) {
      addTemplate('auto-needs', 'finance', 'results.actionCards.needsTitle', 'results.actionCards.needsDesc', { score: needsScore });
    }
    if (reliefScore >= 3) {
      addTemplate('auto-relief', 'mental', 'results.actionCards.reliefTitle', 'results.actionCards.reliefDesc', { score: reliefScore });
    }
    if (result.stress_level === 'High') {
      addTemplate('auto-high-stress', 'mental', 'results.actionCards.highStressTitle', 'results.actionCards.highStressDesc');
    }

    const topFeature = [...result.feature_importance].sort((a, b) => b.importance - a.importance)[0];
    if (topFeature) {
      addTemplate('auto-top-driver', 'general', 'results.actionCards.topDriverTitle', 'results.actionCards.topDriverDesc', {
        feature: topFeature.feature,
        pct: Math.round(topFeature.importance)
      });
    }

    const fallbackTemplates = [
      { id: 'auto-breathe', categoryKey: 'mental', titleKey: 'results.actionCards.breatheTitle', descKey: 'results.actionCards.breatheDesc' },
      { id: 'auto-breaks', categoryKey: 'study', titleKey: 'results.actionCards.breaksTitle', descKey: 'results.actionCards.breaksDesc' },
      { id: 'auto-connect', categoryKey: 'social', titleKey: 'results.actionCards.connectTitle', descKey: 'results.actionCards.connectDesc' },
      { id: 'auto-hydrate', categoryKey: 'exercise', titleKey: 'results.actionCards.hydrateTitle', descKey: 'results.actionCards.hydrateDesc' },
      { id: 'auto-week-plan', categoryKey: 'study', titleKey: 'results.actionCards.weekPlanTitle', descKey: 'results.actionCards.weekPlanDesc' }
    ];

    for (const fallback of fallbackTemplates) {
      if (cards.length >= 5) break;
      addTemplate(fallback.id, fallback.categoryKey, fallback.titleKey, fallback.descKey);
    }

    return cards;
  };

  const actionCards: ActionCardItem[] = aiResult
    ? (() => {
      const base = aiResult.recommendations.map((rec) => ({
        id: rec.id,
        title: rec.title,
        description: rec.description,
        categoryKey: (rec as any).categoryKey || 'general'
      }));
      const personalized = buildPersonalizedActionCards(aiResult, formData);
      const merged: ActionCardItem[] = [];
      const seen = new Set<string>();
      for (const card of [...base, ...personalized]) {
        if (seen.has(card.id)) continue;
        seen.add(card.id);
        merged.push(card);
      }
      return merged;
    })()
    : [];

  return (
    <div className={`min-h-screen font-sans text-[#0b132b] relative overflow-x-hidden transition-colors duration-500 ${isDarkMode ? 'dark bg-gradient-to-br from-[#020510] via-[#0a0f1e] to-[#0d1b3e]' : 'bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100'}`}>
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
            {/* Aurora light — top-left blue */}
            <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full filter blur-[100px] opacity-50 animate-blob" style={{ background: 'radial-gradient(circle, #93c5fd 0%, #bfdbfe 60%, transparent 80%)' }} />
            {/* Aurora light — bottom-right pink/lavender */}
            <div className="absolute bottom-[-5%] right-[-5%] w-[55vw] h-[55vw] rounded-full filter blur-[110px] opacity-45 animate-blob animation-delay-2000" style={{ background: 'radial-gradient(circle, #c4b5fd 0%, #ddd6fe 50%, transparent 80%)' }} />
            {/* Aurora light — center */}
            <div className="absolute top-[30%] left-[30%] w-[35vw] h-[35vw] rounded-full filter blur-[90px] opacity-30 animate-blob animation-delay-4000" style={{ background: 'radial-gradient(circle, #fbcfe8 0%, #f9a8d4 40%, transparent 70%)' }} />
          </>
        )}
      </div>
      {/* Header */}
      <header className="absolute w-full top-0 z-50 transition-colors duration-500">
        <div className={`container mx-auto px-6 py-4 flex items-center justify-between ${!isDarkMode ? 'mt-3' : ''
          }`}>
          {/* Light mode: floating glass pill wrapper */}
          <div className={`flex items-center justify-between w-full transition-all duration-500 ${isDarkMode
              ? ''
              : 'bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-full px-5 py-2'
            }`}>
            <div className="flex items-center gap-8 min-w-0">
              <div className={`text-xl font-bold tracking-tight cursor-pointer transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`} onClick={() => { setIsSurveyOpen(false); setIsCompleted(false); setCurrentStep(1); }}>{t('appName')}</div>
              {!isSurveyOpen && (
                <nav className={`hidden md:flex items-center gap-6 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-slate-800'}`}>
                  <a href="#solutions" className={`transition-colors ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-slate-900 hover:text-blue-700'}`}>{t('nav.solutions')}</a>
                  <a href="#technology" className={`transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-blue-700'}`}>{t('nav.technology')}</a>
                </nav>
              )}
            </div>

            {isSurveyOpen && isCompleted && aiResult && (
              <div className="flex lg:hidden items-center gap-3 shrink-0">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-white/40 text-slate-700'}`}
                  aria-label={t('ui.menu')}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              {!isSurveyOpen && (
                <>
                  {/* Premium Dark / Light Mode Toggle */}
                  <motion.div
                    className="relative w-[130px] h-[43px] rounded-full border-2 border-white/60 cursor-pointer overflow-hidden flex items-center shrink-0 shadow-[0_10px_20px_rgba(0,0,0,0.2),inset_2px_4px_4px_2px_rgba(2,1,68,0.5),inset_-2px_-2px_2px_rgba(1,0,89,0.5)]"
                    animate={{ backgroundColor: isDarkMode ? '#0f172a' : '#236fe9' }}
                    transition={{ duration: 0.5 }}
                    onClick={() => setIsDarkMode(prev => !prev)}
                    aria-label={t('ui.toggleDarkMode')}
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
                  <a href="#" className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>{t('nav.signIn')}</a>
                  <button
                    onClick={() => setIsSurveyOpen(true)}
                    className={`relative overflow-hidden rounded-full font-semibold px-5 py-2 text-sm transition-all duration-300 flex items-center gap-2 group ${isDarkMode
                        ? 'bg-blue-600 text-white border border-blue-500 hover:bg-blue-500'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg hover:-translate-y-0.5'
                      }`}
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    {t('nav.getStarted')}
                  </button>
                </>
              )}
              {/* Language switcher */}
              <div className="relative z-50" ref={languageMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsLanguageMenuOpen(prev => !prev)}
                  aria-label={t('ui.languageSwitcher')}
                  className={`flex items-center rounded-full p-1 pr-3 cursor-pointer transition-colors border ${isDarkMode
                    ? 'bg-black/90 hover:bg-black border-white/10 shadow-lg shadow-black/20'
                    : 'bg-white/60 hover:bg-white/90 border-white/60 shadow-sm'
                  }`}
                >
                  <img
                    src={`https://hatscripts.github.io/circle-flags/flags/${language === 'en' ? 'gb' : language === 'fr' ? 'fr' : language === 'de' ? 'de' : language === 'zh' ? 'cn' : 'vn'}.svg`}
                    alt="flag"
                    className="w-6 h-6 rounded-full object-cover mr-2 shadow-sm"
                  />
                  <span className={`text-[13px] font-bold tracking-wider select-none pointer-events-none ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>
                    {language === 'en' ? 'EN' : language === 'fr' ? 'FR' : language === 'de' ? 'DE' : language === 'zh' ? 'ZH' : 'VI'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`} />
                </button>

                {/* Dropdown Menu */}
                <div className={`absolute top-full right-0 mt-2 w-48 transition-all duration-200 ${isLanguageMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                  <div className={`py-2 rounded-2xl border shadow-xl backdrop-blur-xl ${isDarkMode ? 'bg-[#0f172a]/95 border-white/10 shadow-black/50' : 'bg-white/95 border-gray-200 shadow-xl'}`}>
                    {languageOptions.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLanguageMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${language === lang.code ? (isDarkMode ? 'bg-teal-500/15 text-teal-300' : 'bg-teal-600/10 text-teal-700') : (isDarkMode ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900')}`}
                      >
                        <img
                          src={`https://hatscripts.github.io/circle-flags/flags/${lang.flag}.svg`}
                          alt={lang.code}
                          className="w-5 h-5 rounded-full object-cover shadow-sm"
                        />
                        <span className="font-medium text-sm">{lang.label} ({lang.code.toUpperCase()})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
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
              className={`relative backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-[2rem] overflow-hidden p-8 md:p-10 max-w-2xl w-full text-left max-h-[85vh] overflow-y-auto ${isDarkMode ? 'bg-[#0b132b]/95 border-white/10' : 'bg-white/95 border border-gray-200'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-500/20 border border-blue-300/40 rounded-2xl flex items-center justify-center text-blue-600">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>{t('legal.privacy.title')}</h2>
              </div>
              <div className={`space-y-5 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />{t('legal.privacy.a1h')}</h3>
                  <p>{t('legal.privacy.a1p')}</p>
                </div>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />{t('legal.privacy.a2h')}</h3>
                  <p>{t('legal.privacy.a2p')}</p>
                </div>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />{t('legal.privacy.a3h')}</h3>
                  <p>{t('legal.privacy.a3p')}</p>
                </div>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />{t('legal.privacy.a4h')}</h3>
                  <p>{t('legal.privacy.a4p')}</p>
                </div>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />{t('legal.privacy.a5h')}</h3>
                  <p>{t('legal.privacy.a5p')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className={`mt-8 w-full py-3 rounded-full font-semibold transition-all ${isDarkMode ? 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20' : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'}`}              >
                {t('legal.close')}
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
              className={`relative backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-[2rem] overflow-hidden p-8 md:p-10 max-w-2xl w-full text-left max-h-[85vh] overflow-y-auto ${isDarkMode ? 'bg-[#0b132b]/95 border-white/10' : 'bg-white/95 border border-gray-200'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-500/20 border border-green-300/40 rounded-2xl flex items-center justify-center text-green-600">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>{t('legal.ethics.title')}</h2>
              </div>
              <div className={`space-y-5 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{t('legal.ethics.a1h')}</h3>
                  <p>{t('legal.ethics.a1p')}</p>
                </div>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{t('legal.ethics.a2h')}</h3>
                  <p>{t('legal.ethics.a2p')}</p>
                </div>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{t('legal.ethics.a3h')}</h3>
                  <p>{t('legal.ethics.a3p')}</p>
                </div>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{t('legal.ethics.a4h')}</h3>
                  <p>{t('legal.ethics.a4p')}</p>
                </div>
                <div>
                  <h3 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{t('legal.ethics.a5h')}</h3>
                  <p>{t('legal.ethics.a5p')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEthicsModal(false)}
                className={`mt-8 w-full py-3 rounded-full font-semibold transition-all ${isDarkMode ? 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20' : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'}`}
              >
                {t('legal.close')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {renderHowItWorksModal()}
      {renderEmergencyModal()}

      <AnimatePresence mode="wait">
        {!isSurveyOpen ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Hero Section — Left-aligned layout in light mode, space theme in dark mode */}
            <section className="relative w-full overflow-hidden" style={{ minHeight: '100vh' }}>
              {/* Starfield overlay (Only visible in dark mode) */}
              <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${isDarkMode ? 'opacity-100' : 'opacity-0'}`}>
                {/* Background Space Gradient */}
                <div className="absolute inset-0" style={{
                  background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #000000 100%)',
                }} />

                {/* Twinkling stars */}
                {[...Array(60)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-white animate-pulse"
                    style={{
                      width: `${Math.random() * 2.5 + 0.5}px`,
                      height: `${Math.random() * 2.5 + 0.5}px`,
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      opacity: Math.random() * 0.7 + 0.1,
                      animationDuration: `${Math.random() * 4 + 2}s`,
                      animationDelay: `${Math.random() * 3}s`,
                    }}
                  />
                ))}
              </div>

              {isDarkMode ? (
                /* ========== DARK MODE: centered full-globe layout ========== */
                <>
                  {/* Earth Background — centered */}
                  <div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none overflow-hidden">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 100 }}
                      animate={{ opacity: 0.9, scale: 1, y: 0 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      style={{ width: '100vw', maxWidth: '1200px', minWidth: '800px', aspectRatio: '1/1' }}
                    >
                      <motion.img
                        src="https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=2000&auto=format&fit=crop"
                        alt="Earth"
                        className="w-full h-full object-cover rounded-full grayscale contrast-[1.2] brightness-[0.7]"
                        style={{
                          maskImage: 'radial-gradient(circle at 50% 50%, black 65%, transparent 70%)',
                          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 65%, transparent 70%)'
                        }}
                        animate={{ rotate: earthRotation }}
                        transition={{ duration: 2.66, ease: "easeInOut" }}
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent via-[#0B0F19]/80 to-[#0B0F19] pointer-events-none" />
                    </motion.div>
                  </div>
                  {/* Bottom gradient */}
                  <div className="absolute bottom-0 left-0 w-full h-[30vh] bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/90 to-transparent z-[2] pointer-events-none" />
                  {/* Dark mode content — centered */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-32 pb-80 md:pb-96" style={{ minHeight: '100vh' }}>
                    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide mb-8 border bg-white/8 border-white/15 text-white/90 backdrop-blur-md"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#a3e635] shadow-[0_0_8px_#a3e635] animate-pulse" />
                      {t('hero.badge')}
                    </motion.div>
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
                      className="font-extrabold tracking-tight leading-[1.08] mb-6 text-white"
                      style={{ fontSize: 'clamp(2.4rem, 6vw, 5.5rem)', maxWidth: '800px' }}
                    >
                      {t('hero.title1')}{' '}
                      <span className="text-[#a3e635]">{t('hero.title2')}</span>
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
                      className="text-base md:text-lg leading-relaxed mb-10 max-w-xl text-white/70"
                    >
                      {t('hero.subtitle')}
                    </motion.p>
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
                      className="flex flex-wrap items-center justify-center gap-4 mb-12"
                    >
                      <button onClick={() => setIsSurveyOpen(true)}
                        className="relative overflow-hidden group flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold bg-[#a3e635] text-black shadow-[0_8px_32px_rgba(163,230,53,0.35)] hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,1)] transition-all duration-300"
                      >
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        {t('hero.btnStart')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button onClick={() => setIsHowItWorksOpen(true)}
                        className="flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-slate-800 hover:bg-white/50 transition-all duration-300"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        {t('hero.btnWatch')}
                      </button>
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
                      className="flex flex-wrap items-center justify-center gap-6 text-white/50"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#a3e635]" />
                        <span className="text-sm" dangerouslySetInnerHTML={{ __html: t('hero.statsExpert') }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-[#a3e635]" />
                        <span className="text-sm">{t('hero.statsAnon')}</span>
                      </div>
                    </motion.div>
                  </div>
                </>
              ) : (
                /* ========== LIGHT MODE: Glassmorphism overlap layout ========== */
                <div className="relative z-10 container mx-auto px-6 flex flex-col justify-center min-h-screen pt-28 pb-16">

                  {/* Background Globe - Absolute positioned to allow overlapping */}
                  <div className="absolute top-1/2 right-[-20%] md:right-[-10%] lg:right-[0%] -translate-y-1/2 w-[600px] h-[600px] lg:w-[900px] lg:h-[900px] pointer-events-none z-0">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="w-full h-full relative"
                      style={{
                        WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 55%, transparent 80%)',
                        maskImage: 'radial-gradient(circle at 50% 50%, black 55%, transparent 80%)'
                      }}
                    >
                      {/* Inner glow to make it look like pale frosted glass */}
                      <div className="absolute inset-0 rounded-full" style={{
                        background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.4) 45%, transparent 75%)',
                        zIndex: 10
                      }} />
                      <motion.div
                        className="w-full h-full rounded-full"
                        style={{
                          backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/2/22/Earth_Western_Hemisphere_transparent_background.png)',
                          backgroundSize: '100%',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          /* Soft, bright, blurry globe filter */
                          filter: 'brightness(1.8) contrast(0.85) grayscale(0.2) saturate(0.9) blur(1.5px) opacity(0.9)',
                          mixBlendMode: 'luminosity'
                        }}
                        animate={{ rotate: earthRotation }}
                        transition={{ duration: 2.66, ease: "easeInOut" }}
                      />
                      {/* Deep internal shadow to give 3D volume with very soft edges */}
                      <div className="absolute inset-0 rounded-full shadow-[inset_-20px_-20px_80px_rgba(200,220,255,0.3),inset_30px_30px_80px_rgba(255,255,255,0.8)] z-20 pointer-events-none" />
                    </motion.div>
                  </div>

                  {/* Foreground Content */}
                  <div className="relative z-10 w-full max-w-2xl text-left">
                    {/* Badge */}
                    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-widest mb-8 bg-white/40 border border-white/60 text-slate-700 shadow-sm backdrop-blur-xl uppercase"
                    >
                      {t('hero.badge')}
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
                      className="font-extrabold tracking-tight leading-[1.1] mb-6 text-slate-900"
                      style={{ fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)' }}
                    >
                      {t('hero.title1')}<br />
                      <span className="text-[#0f172a]">{t('hero.title2')}</span>
                    </motion.h1>

                    {/* Subtitle — highly blurred frosted glass card */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
                      className="bg-white/20 backdrop-blur-3xl border border-white/60 rounded-3xl p-6 sm:p-8 mb-10 shadow-[0_8px_32px_rgba(255,255,255,0.3)] max-w-xl relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10" />
                      <p className="relative z-10 text-base sm:text-lg leading-relaxed text-slate-800 font-medium">
                        {t('hero.subtitle')}
                      </p>
                    </motion.div>

                    {/* CTA Buttons in a single subtle pill container layout */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
                      className="inline-flex flex-wrap items-center gap-2 p-2 mb-10 bg-white/30 backdrop-blur-2xl border border-white/60 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
                    >
                      <button onClick={() => setIsSurveyOpen(true)}
                        className="relative overflow-hidden group flex items-center gap-2 px-8 py-3.5 rounded-full font-bold bg-[#1d70f5] text-white shadow-[0_4px_16px_rgba(29,112,245,0.4)] hover:shadow-[0_8px_24px_rgba(29,112,245,0.6)] transition-all duration-300"
                      >
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        {t('hero.btnStart')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button onClick={() => setIsHowItWorksOpen(true)}
                        className="flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-slate-800 hover:bg-white/50 transition-all duration-300"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        {t('hero.btnWatch')}
                      </button>
                    </motion.div>

                    {/* Trust badges */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
                      className="flex flex-wrap items-center gap-4"
                    >
                      <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/40 border border-white/60 backdrop-blur-xl shadow-sm text-slate-700">
                        <ShieldCheck className="w-5 h-5 text-slate-700" />
                        <span className="text-xs font-bold uppercase tracking-wide" dangerouslySetInnerHTML={{ __html: t('hero.statsExpert') }} />
                      </div>
                      <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/40 border border-white/60 backdrop-blur-xl shadow-sm text-slate-700">
                        <Lock className="w-5 h-5 text-slate-700" />
                        <span className="text-xs font-bold uppercase tracking-wide">{t('hero.statsAnon')}</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}
            </section>

            {/* Wellness Tools Section */}
            <section id="solutions" className="py-24 relative z-10">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className={`text-3xl lg:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>{t('solutions.title')}</h2>
                  <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('solutions.subtitle')}
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {/* Card 1 */}
                  <div className={`relative backdrop-blur-3xl border rounded-[2rem] overflow-hidden p-8 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${isDarkMode
                      ? 'bg-gradient-to-br from-blue-950/60 to-slate-900/60 border-blue-900/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
                      : 'bg-white/75 border-sky-100/80 shadow-lg hover:shadow-xl hover:bg-white/90'
                    }`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${isDarkMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-600 border-blue-200'
                      }`}>
                      <BarChart2 className="w-7 h-7" />
                    </div>
                    <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>{t('solutions.card1Title')}</h3>
                    <p className={`leading-relaxed text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                      {t('solutions.card1Text')}
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className={`relative backdrop-blur-3xl border rounded-[2rem] overflow-hidden p-8 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${isDarkMode
                      ? 'bg-gradient-to-br from-emerald-950/60 to-slate-900/60 border-emerald-900/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
                      : 'bg-white/75 border-green-100/80 shadow-lg hover:shadow-xl hover:bg-white/90'
                    }`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-green-100 text-green-600 border-green-200'
                      }`}>
                      <Leaf className="w-7 h-7" />
                    </div>
                    <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>{t('solutions.card2Title')}</h3>
                    <p className={`leading-relaxed text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                      {t('solutions.card2Text')}
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className={`relative backdrop-blur-3xl border rounded-[2rem] overflow-hidden p-8 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${isDarkMode
                      ? 'bg-gradient-to-br from-purple-950/60 to-slate-900/60 border-purple-900/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
                      : 'bg-white/75 border-purple-100/80 shadow-lg hover:shadow-xl hover:bg-white/90'
                    }`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${isDarkMode ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-purple-100 text-purple-600 border-purple-200'
                      }`}>
                      <HeartHandshake className="w-7 h-7" />
                    </div>
                    <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>{t('solutions.card3Title')}</h3>
                    <p className={`leading-relaxed text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                      {t('solutions.card3Text')}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Technology Section */}
            <section id="technology" className={`py-24 transition-colors duration-700 ${isDarkMode ? 'bg-[#030712]' : 'bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950'} text-white`}>
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
                          <h4 className="text-xl font-bold mb-2">{t('tech.point1Title')}</h4>
                          <p className="text-gray-400 leading-relaxed text-sm">{t('tech.point1Text')}</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-14 h-14 bg-green-900/50 text-green-400 rounded-2xl flex items-center justify-center shrink-0 border border-green-800/50">
                          <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold mb-2">{t('tech.point2Title')}</h4>
                          <p className="text-gray-400 leading-relaxed text-sm">{t('tech.point2Text')}</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-14 h-14 bg-purple-900/50 text-purple-400 rounded-2xl flex items-center justify-center shrink-0 border border-purple-800/50">
                          <Brain className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold mb-2">{t('tech.point3Title')}</h4>
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
                          <span className="text-blue-400">model</span> = XGBClassifier(<br />
                          &nbsp;&nbsp;n_estimators=<span className="text-orange-400">200</span>,<br />
                          &nbsp;&nbsp;learning_rate=<span className="text-orange-400">0.05</span>,<br />
                          &nbsp;&nbsp;max_depth=<span className="text-orange-400">6</span>,<br />
                          &nbsp;&nbsp;objective=<span className="text-green-400">'multi:softprob'</span><br />
                          )<br />
                          <span className="block mt-4 text-gray-500 italic">/* {t('ui.predictionOutput')}: LOW, MEDIUM, HIGH */</span>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-xl text-sm font-mono text-gray-300 border border-gray-800 flex items-center justify-between">
                          <span>{t('tech.modelAcc')}</span>
                          <span className="bg-green-900/80 text-green-400 px-2 py-1 rounded text-sm border border-green-800">92.4%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className={`border-t pt-12 pb-8 relative z-10 transition-colors duration-500 ${isDarkMode
                ? 'border-white/10 bg-black/30 backdrop-blur-2xl'
                : 'border-slate-200/60 bg-white/70 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.06)]'
              }`}>
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
                  <a href="https://github.com/24521450/-mindscan-ai" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/10 border border-white/20 text-gray-400 hover:bg-white/20 hover:text-white' : 'bg-white/30 border border-white/40 text-gray-500 hover:bg-white/50 hover:text-gray-900'}`}>
                    <Github className="w-4 h-4" />
                  </a>
                  <a href="https://www.facebook.com/Hor1zoNnn/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/10 border border-white/20 text-gray-400 hover:bg-white/20 hover:text-white' : 'bg-white/30 border border-white/40 text-gray-500 hover:bg-white/50 hover:text-gray-900'}`}>
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a href="mailto:24521450@gm.uit.edu.vn" aria-label="Email" className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/10 border border-white/20 text-gray-400 hover:bg-white/20 hover:text-white' : 'bg-white/30 border border-white/40 text-gray-500 hover:bg-white/50 hover:text-gray-900'}`}>
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </footer>
          </motion.div>
        ) : !hasConsented ? (
          <motion.div
            key="consent"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="container mx-auto px-6 min-h-[100dvh] flex flex-col items-center justify-center py-24"
          >
            {renderConsentScreen()}
          </motion.div>
        ) : (
          <motion.div
            key="survey"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`container mx-auto px-6 min-h-[100dvh] flex flex-col w-full ${isCompleted ? 'items-stretch justify-start pt-20 pb-12 lg:pt-24 max-w-full' : 'items-center justify-center py-24 max-w-3xl'}`}
          >
            {!isCompleted ? (
              <div className={`relative rounded-[2rem] overflow-hidden p-8 md:p-12 border shadow-[0_8px_32px_0_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] ${isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white/20 backdrop-blur-3xl border-white/40'}`}>
                {/* Progress Bar */}
                <div className="mb-12">
                  <div className={`flex justify-between text-sm font-bold mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>{t('survey.step')} {currentStep} / 5</span>
                    <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>{Math.round((currentStep / 5) * 100)}% {t('survey.completed')}</span>
                  </div>
                  <div className={`w-full h-3 rounded-full overflow-hidden shadow-inner ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full relative"
                      initial={{ width: `${((currentStep - 1) / 5) * 100}%` }}
                      animate={{ width: `${(currentStep / 5) * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                    </motion.div>
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
                <div className={`mt-10 pt-8 border-t flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <button
                    onClick={prevStep}
                    aria-label={t('survey.btnPrev')}
                    className={`flex items-center gap-2 font-bold px-4 py-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDarkMode ? 'text-slate-300 hover:text-white hover:bg-white/10 focus:ring-blue-400 focus:ring-offset-[#0b132b]' : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 focus:ring-slate-400 focus:ring-offset-white'}`}
                  >
                    <ArrowLeft className="w-5 h-5" aria-hidden="true" /> {t('survey.btnPrev')}
                  </button>
                  <button
                    onClick={nextStep}
                    aria-label={currentStep === 5 ? t('survey.btnSubmit') : t('survey.btnNext')}
                    className={`relative overflow-hidden group rounded-full font-semibold px-8 py-3 transition-all duration-300 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:-translate-y-0.5 ${isDarkMode ? 'bg-blue-600/30 text-blue-100 border border-blue-500/40 hover:bg-blue-600/40 focus:ring-blue-400 focus:ring-offset-[#0b132b]' : 'bg-white/30 backdrop-blur-2xl text-blue-700 border border-white/50 hover:bg-white/40 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,1)] focus:ring-blue-600 focus:ring-offset-white'}`}
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    {currentStep === 5 ? t('survey.btnSubmit') : t('survey.btnNext')} <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className={`relative rounded-[2rem] overflow-hidden p-8 md:p-12 border shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] ${isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white/20 backdrop-blur-3xl border-white/40'}`}
              >
                {isAnalyzing ? (
                  <div className="text-center py-12">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                      <div className={`absolute inset-0 border-4 rounded-full ${isDarkMode ? 'border-slate-700' : 'border-blue-100'}`}></div>
                      <div className={`absolute inset-0 border-4 rounded-full border-t-transparent animate-spin ${isDarkMode ? 'border-blue-400' : 'border-blue-500'}`}></div>
                      <div className={`absolute inset-0 m-auto w-8 h-8 rounded-full ${isDarkMode ? 'bg-blue-500/30' : 'bg-blue-500/20'}`}></div>
                    </div>
                    <h2 className={`text-2xl font-extrabold mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('survey.analyzingTitle')}</h2>
                    <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>{t('survey.analyzingDesc')}</p>
                  </div>
                ) : aiResult ? (
                  <div className="w-full flex flex-col lg:flex-row gap-6 lg:gap-0">
                    {/* Sidebar Navigation */}
                    <motion.div
                      initial={{ x: -300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      className={`fixed lg:static inset-y-0 left-0 w-72 lg:w-64 h-full lg:h-auto bg-gradient-to-b ${isDarkMode ? 'from-slate-900/95 to-slate-900/80' : 'from-white/80 to-blue-50/60'} backdrop-blur-xl border-r ${isDarkMode ? 'border-white/10' : 'border-white/40'} z-40 lg:z-0 lg:rounded-2xl lg:m-2 lg:sticky lg:top-0 overflow-y-auto lg:overflow-y-visible shadow-2xl lg:shadow-lg transition-all duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                    >
                      <div className="p-6 space-y-8 h-full flex flex-col">
                        {/* Sidebar Header */}
                        <div className="flex items-center justify-between lg:justify-start">
                          <h3 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                            style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                            {t('ui.modules')}
                          </h3>
                          <button
                            onClick={() => setIsSidebarOpen(false)}
                            className={`lg:hidden p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-white/40 text-slate-600'}`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {/* Module Selector */}
                        <div className="space-y-3">
                          <label className={`text-[11px] font-black uppercase tracking-[0.25em] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                            style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
                            {t('ui.dataModule')}
                          </label>
                          <div className="space-y-2">
                            {[
                              { value: 'dashboard' as const, label: t('ui.module.dashboard'), icon: LayoutDashboard },
                              { value: 'analytics' as const, label: t('ui.module.analytics'), icon: BarChart2 }
                            ].map((module) => {
                              const Icon = module.icon;
                              const isActive = activeDataModule === module.value;
                              return (
                                <button
                                  key={module.value}
                                  onClick={() => {
                                    setActiveDataModule(module.value);
                                    setIsSidebarOpen(false);
                                  }}
                                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${isActive
                                      ? isDarkMode
                                        ? 'bg-gradient-to-r from-teal-500/30 to-teal-500/10 text-teal-100 border border-teal-500/40 shadow-lg shadow-teal-500/20'
                                        : 'bg-gradient-to-r from-teal-600/20 to-teal-600/5 text-teal-700 border border-teal-600/30 shadow-lg shadow-teal-600/10'
                                      : isDarkMode
                                        ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent hover:border-white/10'
                                        : 'text-slate-600 hover:bg-white/40 hover:text-slate-900 border border-transparent hover:border-white/40'
                                    }`}
                                  style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}
                                >
                                  <Icon className="w-5 h-5" />
                                  <span>{module.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Period Selector (for analytics) */}
                        {activeDataModule === 'analytics' && (
                          <div className="space-y-3 pt-4 border-t border-white/10">
                            <label className={`text-[11px] font-black uppercase tracking-[0.25em] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                              style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
                              {t('ui.dashboard.period')}
                            </label>
                            <div className="space-y-2">
                              {[
                                { value: 'weekly' as const, label: t('ui.dashboard.weekly'), icon: Calendar },
                                { value: 'monthly' as const, label: t('ui.dashboard.monthly'), icon: Calendar }
                              ].map((period) => (
                                <button
                                  key={period.value}
                                  onClick={() => setStressTrendPeriod(period.value)}
                                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${stressTrendPeriod === period.value
                                      ? isDarkMode
                                        ? 'bg-purple-500/30 text-purple-100 border border-purple-500/40'
                                        : 'bg-purple-600/20 text-purple-700 border border-purple-600/30'
                                      : isDarkMode
                                        ? 'text-slate-400 hover:bg-white/5'
                                        : 'text-slate-600 hover:bg-white/40'
                                    }`}
                                  style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}
                                >
                                  <Calendar className="w-4 h-4" />
                                  <span>{period.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Spacer for mobile, sticky footer for desktop */}
                        <div className="flex-1" />
                      </div>
                    </motion.div>

                    {/* Mobile overlay */}
                    <AnimatePresence>
                      {isSidebarOpen && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setIsSidebarOpen(false)}
                          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                        />
                      )}
                    </AnimatePresence>

                    {/* Main Content Area */}
                    <div className="flex-1 w-full lg:overflow-y-auto">
                      <div className="text-left w-full analytics-liquid-bg rounded-2xl lg:rounded-[2.5rem] p-4 md:p-6 lg:p-0">
                        <section className={`rounded-2xl lg:rounded-[2.75rem] p-6 md:p-8 xl:p-10 shadow-[0_24px_90px_rgba(45,51,55,0.06)] ${isDarkMode ? 'bg-slate-900/40 border border-white/10' : ''} lg:min-h-[640px]`}>
                          <div className="grid grid-cols-1 gap-8 h-full">
                            <div className="flex flex-col gap-8">
                              {activeDataModule === 'analytics' ? (
                                renderDashboardView()
                              ) : (
                                <><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                              <div>
                                <h2 className={`text-3xl lg:text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                                  style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{t('ui.resultsPanel.title')}</h2>
                                <p className={`mt-2 text-sm md:text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                                  style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.resultsPanel.subtitle')}</p>
                              </div>
                              <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'bg-teal-500/15 text-teal-300' : 'bg-teal-600/10 text-teal-700'}`}
                                style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
                                <Activity className="w-4 h-4" /> {t('ui.resultsPanel.last30Days')}
                              </div>
                            </div>

                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 flex-1">
                                {/* Stress Load Card */}
                                <div className={`lg:col-span-5 analytics-glass-card rounded-[2rem] p-6 md:p-8 shadow-sm ${isDarkMode ? 'dark' : ''}`}>
                                  <div className="flex items-start justify-between gap-3 mb-4">
                                    <div>
                                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
                                        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{t('ui.resultsPanel.stressLoad')}</h3>
                                      <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                                        style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.resultsPanel.stressLoadDesc')}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${isDarkMode ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-700 border border-purple-200'
                                      }`} style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.live')}</span>
                                  </div>
                                  <div className="flex flex-col items-center justify-center py-4">
                                    <GaugeChart level={aiResult.stress_level} confidence={aiResult.confidence_score} t={t} isDarkMode={isDarkMode} />
                                  </div>
                                  <div className="mt-4 pt-4 grid grid-cols-3 gap-4" style={{ borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                                    <div className="text-center">
                                      <div className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                                        style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.status.title')}</div>
                                      <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}
                                        style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{insightMeta?.levelLabel || t('results.medium')}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                                        style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.trend')}</div>
                                      <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}
                                        style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.stable')}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                                        style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.baseline')}</div>
                                      <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}
                                        style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{Math.max(0, Math.round((insightMeta?.confidencePct ?? 0) * 0.8))}%</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Impact Factors Card */}
                                <div className={`lg:col-span-7 analytics-glass-card rounded-[2rem] p-6 md:p-8 shadow-sm ${isDarkMode ? 'dark' : ''}`}>
                                  <h3 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
                                    style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{t('ui.impactFactors')}</h3>
                                  <p className={`text-sm mb-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                                    style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.impactFactorsDesc')}</p>
                                  <div className="w-full h-12 rounded-full overflow-hidden flex" style={{ background: isDarkMode ? '#1e293b' : '#eaeef1' }}>
                                    {aiResult.feature_importance.map((item: any, idx: number) => {
                                      const total = aiResult.feature_importance.reduce((s: number, f: any) => s + f.importance, 0);
                                      const pct = total > 0 ? (item.importance / total) * 100 : 0;
                                      const color = (!item.color || item.color === '#f3f4f6') ? ['#006b60', '#6e3bd8', '#a53173', '#48e5d0'][idx % 4] : item.color;
                                      return (
                                        <div key={`bar-${idx}`} style={{ width: `${pct}%`, backgroundColor: color }}
                                          className="h-full flex items-center justify-center text-[10px] text-white font-bold"
                                          title={`${item.feature}: ${Math.round(item.importance)}%`}>
                                          {pct > 8 ? Math.round(item.importance) : ''}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                                    {aiResult.feature_importance.slice(0, 4).map((item: any, idx: number) => {
                                      const dotColors = ['#006b60', '#6e3bd8', '#a53173', '#48e5d0'];
                                      const dotColor = (!item.color || item.color === '#f3f4f6') ? dotColors[idx % 4] : item.color;
                                      return (
                                        <div key={`fi-${idx}`} className={`flex items-start gap-3 p-3 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-white/40'}`}>
                                          <span className="w-3 h-3 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: dotColor }} />
                                          <div>
                                            <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}
                                              style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{item.feature}</div>
                                            <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                                              style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{Math.round(item.importance)}% {t('ui.impact')}</div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                              {/* Prominent Trends + Critical Touchpoints */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <div className={`analytics-glass-card rounded-[1.75rem] p-5 flex items-center gap-4 border border-white/40 ${isDarkMode ? 'dark' : ''}`}>
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-600/10 text-teal-700'}`}>
                                    <Activity className="w-6 h-6" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <h4 className={`text-base font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}
                                        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{t('ui.prominentTrends')}</h4>
                                      <Info className={`w-4 h-4 shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-slate-300'}`} />
                                    </div>
                                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                                      style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
                                      {insightCopy?.trends || t('ui.prominentTrendsFallback')}
                                    </p>
                                  </div>
                                </div>

                                <div className={`analytics-glass-card rounded-[1.75rem] p-5 flex items-center gap-4 border border-white/40 ${isDarkMode ? 'dark' : ''}`}>
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                                    <CheckCircle2 className="w-6 h-6" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`text-base font-bold mb-1.5 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}
                                      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{t('ui.criticalTouchpoints')}</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {(insightMeta?.topFeatures || []).map((item, idx) => (
                                        <span key={`touch-${idx}`}
                                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-white/10 text-slate-200' : 'bg-white/60 text-slate-700'}`}
                                          style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
                                          {item.feature} ({Math.round(item.importance)}%)
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {sessionHistory.length > 0 && (
                                <section className="mt-8 space-y-5">
                                  <div className="flex items-end justify-between gap-4">
                                    <div>
                                      <h3 className={`text-2xl font-extrabold tracking-tight ${isDarkMode ? 'text-gray-200' : 'text-slate-900'}`}
                                        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{t('results.historyTitle')}</h3>
                                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                                        style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.anonymousHistoryDesc')}</p>
                                    </div>
                                    <button
                                      onClick={() => setShowFullHistory(prev => !prev)}
                                      className={`${isDarkMode ? 'text-teal-300' : 'text-teal-700'} text-sm font-semibold flex items-center gap-1 hover:underline transition-opacity`}
                                      style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
                                      {showFullHistory ? t('ui.showLess') : t('ui.viewFullLog')} <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className={`p-5 rounded-[2rem] border ${isDarkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white/25 backdrop-blur-3xl border-white/40'}`}>
                                    <div className="space-y-3">
                                      {(showFullHistory ? sessionHistory : sessionHistory.slice(0, 5)).map((session, idx) => {
                                        const score = session.level === 'High' ? '8.1' : session.level === 'Medium' ? '6.2' : '4.8';
                                        return (
                                          <div key={`history-${session.date}-${idx}`}
                                            className={`analytics-glass-card rounded-2xl p-4 flex items-center gap-6 border border-white/40 group hover:bg-white/60 transition-colors ${isDarkMode ? 'dark' : ''}`}>
                                            <div className={`w-24 text-xs font-bold shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                                              style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{session.date}</div>
                                            <div className="flex-1">
                                              {session.features && (
                                                <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                                                  {session.features.map((f: any, fi: number) => {
                                                    const ftotal = session.features.reduce((s: number, x: any) => s + x.importance, 0);
                                                    const fpct = ftotal > 0 ? (f.importance / ftotal) * 100 : 0;
                                                    const fcolor = (!f.color || f.color === '#f3f4f6') ? ['#006b60', '#6e3bd8', '#a53173', '#48e5d0'][fi % 4] : f.color;
                                                    return <div key={fi} style={{ width: `${fpct}%`, backgroundColor: fcolor }} className="h-full" />;
                                                  })}
                                                </div>
                                              )}
                                            </div>
                                            <div className={`w-10 text-right text-xs font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}
                                              style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{score}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </section>
                              )}

                              <section className="mt-10 mb-12 space-y-5">
                                <div>
                                  <h3 className={`text-2xl font-extrabold tracking-tight ${isDarkMode ? 'text-gray-200' : 'text-slate-900'}`}
                                    style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{t('ui.recommendedActions')}</h3>
                                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                                    style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.recommendedActionsDesc')}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                  {(showAllRecs ? actionCards : actionCards.slice(0, 4)).map((rec) => {
                                    const key = rec.categoryKey || '';
                                    let Icon = Brain;
                                    let colorClass = isDarkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-600/10 text-teal-700';
                                    if (key === 'sleep') { Icon = Moon; colorClass = isDarkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-600/10 text-teal-700'; }
                                    else if (key === 'study') { Icon = BookOpen; colorClass = isDarkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'; }
                                    else if (key === 'social') { Icon = Users; colorClass = isDarkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'; }
                                    else if (key === 'exercise') { Icon = Activity; colorClass = isDarkMode ? 'bg-pink-500/20 text-pink-300' : 'bg-pink-100 text-pink-700'; }
                                    else if (key === 'finance') { Icon = DollarSign; colorClass = isDarkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'; }
                                    else if (key === 'mental') { Icon = HeartHandshake; colorClass = isDarkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-600/10 text-teal-700'; }

                                    return (
                                      <ActionCard
                                        key={rec.id}
                                        id={rec.id}
                                        title={rec.title}
                                        description={rec.description}
                                        icon={Icon}
                                        colorClass={colorClass}
                                        isBookmarked={bookmarkedRecs.includes(rec.id)}
                                        detailsLabel={t('ui.details')}
                                        bookmarkAriaLabel={t('results.saveRec')}
                                        onBookmark={(e) => {
                                          e.stopPropagation();
                                          toggleBookmark(rec.id);
                                        }}
                                      />
                                    );
                                  })}
                                </div>
                                {actionCards.length > 4 && (
                                  <div className="text-center mt-6">
                                    <button
                                      onClick={() => setShowAllRecs(prev => !prev)}
                                      className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} font-medium text-sm underline underline-offset-4`}
                                    >
                                      {showAllRecs ? t('ui.showLess') : tWith('ui.showMore', { count: actionCards.length - 4 })}
                                    </button>
                                  </div>
                                )}
                              </section>
                            </>
                          )}
                        </section>
                      </div>
                    </div>

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

