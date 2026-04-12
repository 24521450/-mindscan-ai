/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  GitCompare,
  X
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Player } from '@lottiefiles/react-lottie-player';
import { analyzeSurveyData, AIRecommendation, featureLabels } from './services/geminiService';
import { translations } from './translations';
import { ArticleSection } from './components';

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

  // Since the maximum arc is 180 degrees (Math.PI), the arc drawn covers at most 180 degrees.
  // Therefore, largeArcFlag is always 0.
  const largeArc = 0;
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
      <div className="text-center -mt-2">
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
      <div className="flex-1">
        <h4 className="text-base font-bold bg-gradient-to-r from-black to-slate-800 bg-clip-text text-transparent dark:text-slate-100 dark:bg-none mb-2"
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
    primary: "bg-blue-600 dark:bg-blue-500 backdrop-blur-2xl text-white border border-blue-500/50 shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 hover:-translate-y-0.5",
    secondary: "bg-slate-200/80 dark:bg-slate-800/80 backdrop-blur-2xl text-slate-900 dark:text-slate-100 border border-slate-300/50 dark:border-slate-700/50 shadow-md hover:bg-slate-300/80 dark:hover:bg-slate-700/80 hover:-translate-y-0.5",
    outline: "bg-transparent border-2 border-slate-300/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
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
  const [showMotivational, setShowMotivational] = useState(false);
  const [language, setLanguage] = useState<'vi' | 'en' | 'de' | 'zh' | 'fr'>('en');
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIRecommendation | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showEthicsModal, setShowEthicsModal] = useState(false);
  const [showTechnologyModal, setShowTechnologyModal] = useState(false);
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
  const [activeDataModule, setActiveDataModule] = useState<'dashboard' | 'analytics'>('dashboard');
  const [stressTrendPeriod, setStressTrendPeriod] = useState<'weekly' | 'monthly'>('weekly');
const [radarAnimated, setRadarAnimated] = useState(false);
  const [heroVariant, setHeroVariant] = useState<1 | 2>(2);
  const [earthRotation, setEarthRotation] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!localStorage.getItem('mindscan_currentUser'));
  const [showLoginConfirm, setShowLoginConfirm] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(() => {
    const stored = localStorage.getItem('mindscan_currentUser');
    return stored ? JSON.parse(stored) : null;
  });

// Modern login handlers
  const handleShowLoginConfirm = () => {
    setShowLoginConfirm(true);
  };

  const handleConfirmLogin = () => {
const modernLoginUrl = window.location.origin + '/src/Modern-Login-master/index.html';
    window.open(modernLoginUrl, '_blank', 'noopener,noreferrer');
    setShowLoginConfirm(false);
  };

  const handleCancelLogin = () => {
    setShowLoginConfirm(false);
  };

  // Sync login state from popup via localStorage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mindscan_currentUser') {
        const userData = e.newValue ? JSON.parse(e.newValue) : null;
        setCurrentUser(userData);
        setIsLoggedIn(!!userData);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
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
    document.documentElement.lang = language;
  }, [language]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showTechnologyModal || showPrivacyModal || showEthicsModal || showEmergencyModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showTechnologyModal, showPrivacyModal, showEthicsModal, showEmergencyModal]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Earth rotation for hero variant 1 (both light and dark mode)
  useEffect(() => {
    if (heroVariant !== 1) return;
    const interval = setInterval(() => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const amount = 30 + Math.random() * 60;
      setEarthRotation(prev => prev + (direction * amount));
    }, 2666);
    return () => clearInterval(interval);
  }, [heroVariant]);

  const languageSwitcher = (
    <div className="relative group/lang">
      <div className={`p-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100'
        }`}>
        <Globe className={`w-5 h-5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`} />
        <span className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-200' : 'text-slate-800'
          }`} style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{language}</span>
        <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} transition-transform group-hover/lang:rotate-180`} />
      </div>
      {/* Dropdown menu */}
      <div className="absolute top-full right-0 mt-2 w-36 py-2 rounded-2xl opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all z-50
        shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border"
        style={{
          background: isDarkMode ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(12px)',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
        }}>
        {[
          { code: 'vi', label: 'Tiếng Việt' },
          { code: 'en', label: 'English' },
          { code: 'fr', label: 'Français' },
          { code: 'de', label: 'Deutsch' },
          { code: 'zh', label: '中文' }
        ].map(lang => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code as any)}
            className={`w-full text-left px-5 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between
              ${language === lang.code
                ? (isDarkMode ? 'text-blue-400 bg-blue-500/10' : 'text-blue-600 bg-blue-50')
                : (isDarkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50')
              }`}
            style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
          >
            {lang.label}
            {language === lang.code && <CheckCircle2 className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );

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

  const getFeatureLabel = (keyObj: string) => {
    if (featureLabels[keyObj]) {
      return (featureLabels[keyObj] as any)[language] || keyObj;
    }
    return keyObj;
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
    academic_performance: 0,
    study_load: 0,
    teacher_student_relationship: 0,
    future_career_concerns: 0,
    // Step 2: Psychological
    anxiety_level: 0,
    depression: 0,
    self_esteem: 0,
    mental_health_history: 'no',
    // Step 3: Physical
    blood_pressure: 0,
    sleep_quality: 0,
    headache: 0,
    breathing_problem: 0,
    // Step 4: Social
    social_support: 0,
    peer_pressure: 0,
    extracurricular_activities: 0,
    bullying: 0,
    // Step 5: Environment
    noise_level: 0,
    living_conditions: 0,
    safety: 0,
    basic_needs: 0
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    // Storage version — bump this to clear stale data after format changes
    const STORAGE_VERSION = 'v3'; // v3: raw feature keys in dummy history + ISO date format
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
      // Dummy history uses raw feature keys so getFeatureLabel() can translate them
      const dummyHistory = [
        {
          date: '2026-03-10',
          stressScore: 30,
          level: 'Low',
          features: [
            { feature: 'sleep_quality', importance: 40, color: '#6ee7b7' },
            { feature: 'study_load', importance: 30, color: '#2dd4bf' },
            { feature: 'social_support', importance: 20, color: '#c084fc' },
            { feature: 'extracurricular_activities', importance: 5, color: '#cbd5e1' },
            { feature: 'basic_needs', importance: 5, color: '#fb7185' },
          ]
        },
        {
          date: '2026-03-12',
          stressScore: 60,
          level: 'Medium',
          features: [
            { feature: 'sleep_quality', importance: 20, color: '#6ee7b7' },
            { feature: 'study_load', importance: 40, color: '#2dd4bf' },
            { feature: 'social_support', importance: 15, color: '#c084fc' },
            { feature: 'extracurricular_activities', importance: 10, color: '#cbd5e1' },
            { feature: 'basic_needs', importance: 15, color: '#fb7185' },
          ]
        }
      ];
      setSessionHistory(dummyHistory);
    }
  }, []);

  const saveToHistory = (result: AIRecommendation) => {
    // Store ISO date string; render uses locale-aware formatting at display time
    const newEntry = {
      date: new Date().toISOString().split('T')[0], // 'YYYY-MM-DD'
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

  // Format a stored ISO date string (YYYY-MM-DD) using the current locale
  const localeMap: Record<string, string> = { vi: 'vi-VN', en: 'en-US', fr: 'fr-FR', de: 'de-DE', zh: 'zh-CN' };
  const formatSessionDate = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00'); // avoid UTC offset shifts
    if (isNaN(d.getTime())) return dateStr;    // fallback for legacy entries
    return d.toLocaleDateString(localeMap[language] ?? 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('mindscan_currentUser');
  };

  const startSurvey = () => {
    setIsSurveyOpen(true);
  };

  const acceptConsent = () => {
    setShowMotivational(true); // Hiển thị trang motivational
  };

  const proceedToSurvey = () => {
    setHasConsented(true); // Đánh dấu đã đọc đầy đủ
    setShowMotivational(false);
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

  // CustomSlider: showDots = true (default) để hiện dấu chấm, false để ẩn
  const CustomSlider = ({ min, max, step, value, onChange, size = 'normal', ariaLabel, showDots = true }: { min: number, max: number, step: number, value: number, onChange: (val: number) => void, size?: 'normal' | 'large', ariaLabel: string, showDots?: boolean }) => {
    const snapPoints = [];
    for (let i = min; i <= max; i += 1) snapPoints.push(i);
    const handleChange = (val: number) => {
      const snapped = Math.round(val);
      onChange(snapped);
    };
    const percentage = ((value - min) / (max - min)) * 100;
    const currentColor = getSliderColor(value, min, max);
    const heightClass = size === 'large' ? 'h-4' : 'h-2';
    const thumbSizeClass = size === 'large'
      ? '[&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:h-8'
      : '[&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6';
    const thumbOffset = size === 'large' ? 16 : 12;
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
        {/* Dấu chấm tròn các mốc nhỏ nằm đè trên track */}

        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => handleChange(Number(e.target.value))}
          aria-label={ariaLabel}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          className={`w-full appearance-none bg-transparent rounded-full cursor-grab active:cursor-grabbing ${heightClass} ${thumbSizeClass} focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-[var(--thumb-color)] [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-[var(--thumb-color)] [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:transition-transform relative z-20`}
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
      className={`relative backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.1)] rounded-[2rem] overflow-hidden p-8 md:p-12 max-w-3xl w-full mx-auto text-left ${
        isDarkMode 
          ? 'bg-slate-900/95 border-slate-700/50 text-white' 
          : 'bg-white/90 border-white/60 text-slate-900'
      }`}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 dark:bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-inner border relative z-10 ${
        isDarkMode
          ? 'bg-slate-800/80 border-slate-700 text-blue-400'
          : 'bg-gradient-to-br from-blue-100 to-teal-100 border-white text-blue-600'
      }`}>
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

  const renderMotivationalScreen = () => (
    <motion.div
      key={language}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="relative w-full min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'none' }}
    >
      {/* Main Content - Centered */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 gap-8 w-full max-w-6xl">
        {/* Navigation Buttons: fixed to left/right, vertically centered with image */}
        <div className="w-full flex items-center justify-between relative" style={{ minHeight: '20rem' }}>
          {/* Previous Button - left edge */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onClick={() => setShowMotivational(false)}
            aria-label="Previous"
            className="w-14 h-14 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-300 shadow transition-all absolute left-0 top-1/2 -translate-y-1/2"
            style={{ zIndex: 20 }}
          >
            <ArrowLeft className="w-7 h-7" />
          </motion.button>
          {/* Large Square Image, centered */}
          <motion.img
            src="https://image2url.com/r2/default/images/1775840954764-fa156538-0eec-4fa2-9e18-56d177c85d21.png"
            alt="Gen Z Motivation"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-80 h-80 rounded-2xl object-cover mx-auto shadow-lg"
            style={{ background: 'transparent', border: 'none' }}
          />
          {/* Next Button - right edge */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onClick={proceedToSurvey}
            aria-label="Next"
            className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all absolute right-0 top-1/2 -translate-y-1/2"
            style={{ zIndex: 20 }}
          >
            <ArrowRight className="w-7 h-7" />
          </motion.button>
        </div>
        {/* Wide Speech Bubble Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className={`relative px-12 py-8 rounded-[2.5rem] backdrop-blur-md w-full max-w-5xl ${
            isDarkMode
              ? 'bg-slate-800/60 border border-slate-700/50 text-white'
              : 'bg-white/80 border border-white/60 text-slate-900 shadow-xl'
          }`}
        >
          <p className="text-xl leading-relaxed font-medium text-center" style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
            {t('motivational.quote')}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderHowItWorksModal = () => (
    <AnimatePresence>
      {isHowItWorksOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen p-4">
            <motion.div
              key={language}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
                isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
            >
              {/* Fixed Header */}
              <div className={`sticky top-0 z-10 border-b p-6 flex items-center justify-between ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('howItWorks.title')}
                </h2>
                <button
                  onClick={() => setIsHowItWorksOpen(false)}
                  className={`p-1 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-6 space-y-6">
                {/* Intro */}
                <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('howItWorks.intro')}
                </p>

                {/* Pillars Section */}
                <div className="space-y-4">
                  {[
                    { key: 'pillar1' },
                    { key: 'pillar2' },
                    { key: 'pillar3' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className={`p-5 rounded-xl border ${
                        isDarkMode
                          ? 'bg-gray-800/50 border-gray-700/50'
                          : 'bg-gray-50 border-gray-200/50'
                      }`}
                    >
                      <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {t(`howItWorks.${item.key}Title`)}
                      </h3>
                      <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t(`howItWorks.${item.key}Text`)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Reliability Stat */}
                <div className={`p-4 rounded-xl text-center border ${
                  isDarkMode
                    ? 'bg-gray-800/50 border-gray-700/50'
                    : 'bg-gray-50 border-gray-200/50'
                }`}>
                  <p className={`font-semibold text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {t('howItWorks.reliability')}
                  </p>
                </div>

                {/* Flowchart Section */}
                <div className="space-y-3 mt-8">
                  <h3 className={`font-bold text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {t('howItWorks.processTitle')}
                  </h3>
                  <div className="flex items-center justify-between gap-3">
                    {/* Step 1 */}
                    <div className={`flex-1 p-4 rounded-lg text-center border ${
                      isDarkMode
                        ? 'bg-gray-800/50 border-gray-700/50'
                        : 'bg-gray-50 border-gray-200/50'
                    }`}>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {t('howItWorks.flowStep1')}
                      </p>
                    </div>

                    {/* Arrow 1 */}
                    <div className={`flex-shrink-0 text-2xl ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      →
                    </div>

                    {/* Step 2 */}
                    <div className={`flex-1 p-4 rounded-lg text-center border ${
                      isDarkMode
                        ? 'bg-gray-800/50 border-gray-700/50'
                        : 'bg-gray-50 border-gray-200/50'
                    }`}>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {t('howItWorks.flowStep2')}
                      </p>
                    </div>

                    {/* Arrow 2 */}
                    <div className={`flex-shrink-0 text-2xl ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      →
                    </div>

                    {/* Step 3 */}
                    <div className={`flex-1 p-4 rounded-lg text-center border ${
                      isDarkMode
                        ? 'bg-gray-800/50 border-gray-700/50'
                        : 'bg-gray-50 border-gray-200/50'
                    }`}>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {t('howItWorks.flowStep3')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className={`sticky bottom-0 border-t p-4 bg-gradient-to-r ${
                isDarkMode
                  ? 'border-gray-700 from-gray-800 to-gray-800'
                  : 'border-gray-200 from-gray-50 to-gray-50'
              }`}>
                <button
                  onClick={() => setIsHowItWorksOpen(false)}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  {t('howItWorks.close')}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );



  const renderEmergencyModal = () => (
    <AnimatePresence>
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <motion.div
            key={language}
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

  const renderLoginConfirmModal = () => (
    <AnimatePresence>
      {showLoginConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative backdrop-blur-3xl shadow-2xl rounded-[2rem] p-8 max-w-md w-full text-center ${
              isDarkMode ? 'bg-slate-900/90 border border-white/10 text-white' : 'bg-white/95 border border-slate-200 text-slate-900'
            }`}
          >
            <h3 className="text-2xl font-bold mb-4">Lợi ích khi Đăng nhập</h3>
            <div className={`text-left space-y-4 mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <p className="font-medium text-center opacity-90">Đăng nhập để mở khóa các tính năng nâng cao giúp bạn quản lý sức khỏe tốt hơn:</p>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span><strong>Theo dõi lịch sử:</strong> Xem lại lịch sử làm khảo sát và theo dõi biểu đồ xu hướng căng thẳng qua từng mốc thời gian.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span><strong>AI Cá nhân hóa:</strong> Hệ thống ghi nhớ thói quen sinh hoạt để đưa ra gợi ý và lộ trình phục hồi chính xác hơn.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span><strong>Gợi ý thông minh:</strong> Nhận các chỉ dẫn tốt hơn cho các vấn đề tâm lý dựa trên dữ liệu thói quen đã lưu trữ.</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmLogin}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30"
              >
                Tiếp tục đăng nhập
              </button>
              <button
                onClick={handleCancelLogin}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Để sau
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderStepContent = () => {
    const questionCardClass = `space-y-4 rounded-[2rem] p-6 border shadow-[0_8px_32px_0_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] ${isDarkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white/20 backdrop-blur-3xl border-white/40'}`;
    const questionLabelClass = `block text-base font-bold ${isDarkMode ? 'text-gray-200' : 'text-slate-800'}`;
    const textHintClass = `text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`;
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
                <CustomSlider min={0} max={21} step={1} value={formData.anxiety_level} onChange={(v) => handleInputChange('anxiety_level', v)} ariaLabel="Anxiety" showDots={false} />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>21</span></div>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q8')}</label>
                <CustomSlider min={0} max={27} step={1} value={formData.depression} onChange={(v) => handleInputChange('depression', v)} ariaLabel="Depression" showDots={false} />
                <div className={`flex justify-between ${textHintClass}`}><span>0</span><span>27</span></div>
              </div>
              <div className={questionCardClass}>
                <label className={questionLabelClass}>{t('questions.q9')}</label>
                <CustomSlider min={0} max={30} step={1} value={formData.self_esteem} onChange={(v) => handleInputChange('self_esteem', v)} ariaLabel="Self Esteem" showDots={false} />
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
        .map((item) => `${getFeatureLabel(item.feature)} (${Math.round(item.importance)}%)`)
        .join(', ');

    const levelLabel = t(`results.${result.stress_level.toLowerCase()}`);
    const confidencePct = Math.round(result.confidence_score * 100);
    const primary = getFeatureLabel(String(sorted[0]?.feature || ''));
    const secondary = getFeatureLabel(String(sorted[1]?.feature || ''));

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
          trends: `Mức stress hiện tại: ${levelLabel} (độ chính xác ${confidencePct}%). Xu hướng chính: ${formatTop(3)}.`,
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

    const getRadarLabel = (cat: string) => {
      const radMap: any = {
        en: { study: "Study", sleep: "Sleep", social: "Social", finance: "Finance", exercise: "Exercise" },
        vi: { study: "Học tập", sleep: "Giấc ngủ", social: "Xã hội", finance: "Tài chính", exercise: "Thể chất" },
        fr: { study: "Études", sleep: "Sommeil", social: "Social", finance: "Finance", exercise: "Exercice" },
        de: { study: "Studium", sleep: "Schlaf", social: "Soziales", finance: "Finanzen", exercise: "Sport" },
        zh: { study: "学习", sleep: "睡眠", social: "社交", finance: "财务", exercise: "运动" }
      };
      return radMap[language]?.[cat] || radMap.en[cat];
    };

    return [
      { subject: getRadarLabel('study'), value: Math.min(100, Math.max(5, study)), fullMark: 100 },
      { subject: getRadarLabel('sleep'), value: Math.min(100, Math.max(5, sleep)), fullMark: 100 },
      { subject: getRadarLabel('social'), value: Math.min(100, Math.max(5, social)), fullMark: 100 },
      { subject: getRadarLabel('finance'), value: Math.min(100, Math.max(5, finance)), fullMark: 100 },
      { subject: getRadarLabel('exercise'), value: Math.min(100, Math.max(5, exercise)), fullMark: 100 },
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
      label: getFeatureLabel('sleep_quality'),
      you: Math.round((Number(formData.sleep_quality) / 5) * 10),
      avg: 7,
      unit: 'hrs',
      youPct: Math.round((Number(formData.sleep_quality) / 5) * 100),
      avgPct: 70,
    },
    {
      label: getFeatureLabel('study_load'),
      you: Number(formData.study_load),
      avg: 3,
      unit: '/5',
      youPct: Math.round((Number(formData.study_load) / 5) * 100),
      avgPct: 60,
    },
    {
      label: getFeatureLabel('social_support'),
      you: Number(formData.social_support),
      avg: 2,
      unit: '/3',
      youPct: Math.round((Number(formData.social_support) / 3) * 100),
      avgPct: 65,
    },
    {
      label: getFeatureLabel('extracurricular_activities'),
      you: Number(formData.extracurricular_activities),
      avg: 3,
      unit: '/5',
      youPct: Math.round((Number(formData.extracurricular_activities) / 5) * 100),
      avgPct: 60,
    },
    {
      label: getFeatureLabel('basic_needs'),
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
    const localeMap: Record<string, string> = { vi: 'vi-VN', en: 'en-US', fr: 'fr-FR', de: 'de-DE', zh: 'zh-CN' };
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

  // Map from backend i18n_key to frontend translation key pairs
  const backendI18nMap: Record<string, { titleKey: string; descKey: string }> = {
    highStress: { titleKey: 'results.actionCards.highStressTitle', descKey: 'results.actionCards.highStressDesc' },
    sleep: { titleKey: 'results.actionCards.sleepTitle', descKey: 'results.actionCards.sleepDesc' },
    studyLoad: { titleKey: 'results.actionCards.studyLoadTitle', descKey: 'results.actionCards.studyLoadDesc' },
    anxiety: { titleKey: 'results.actionCards.anxietyTitle', descKey: 'results.actionCards.anxietyDesc' },
    mood: { titleKey: 'results.actionCards.moodTitle', descKey: 'results.actionCards.moodDesc' },
    support: { titleKey: 'results.actionCards.supportTitle', descKey: 'results.actionCards.supportDesc' },
    bullying: { titleKey: 'results.actionCards.bullyingTitle', descKey: 'results.actionCards.bullyingDesc' },
    needs: { titleKey: 'results.actionCards.needsTitle', descKey: 'results.actionCards.needsDesc' },
    weekPlan: { titleKey: 'results.actionCards.weekPlanTitle', descKey: 'results.actionCards.weekPlanDesc' },
  };

  const actionCards: ActionCardItem[] = aiResult
    ? (() => {
      const base = aiResult.recommendations.map((rec: any) => {
        const i18nKey = rec.i18n_key as string | undefined;
        const mapped = i18nKey ? backendI18nMap[i18nKey] : undefined;
        return {
          id: `backend-${rec.reco_id ?? rec.i18n_key ?? Math.random()}`,
          categoryKey: rec.category || 'general',
          title: mapped ? t(mapped.titleKey) : rec.title,
          description: mapped ? t(mapped.descKey) : rec.description,
        };
      });
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
    <div className={`min-h-screen font-sans text-slate-900 dark:text-slate-100 relative overflow-x-hidden transition-colors duration-500 ${isDarkMode ? 'dark bg-gradient-to-br from-[#020510] via-[#0a0f1e] to-[#0d1b3e]' : 'bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100'}`}>
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
                  <button onClick={() => setShowTechnologyModal(true)} className={`transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-blue-700'}`}>{t('nav.technology')}</button>
                </nav>
              )}
            </div>



            <div className="flex items-center gap-3">
              {/* Premium Dark / Light Mode Toggle */}
              <motion.div
                className="relative hidden sm:flex w-[130px] h-[43px] rounded-full border-2 border-white/60 cursor-pointer overflow-hidden items-center shrink-0 shadow-[0_10px_20px_rgba(0,0,0,0.2),inset_2px_4px_4px_2px_rgba(2,1,68,0.5),inset_-2px_-2px_2px_rgba(1,0,89,0.5)]"
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
                  <Player autoplay style={{ width: '100%', height: '100%' }} loop src="https://cdn.prod.website-files.com/6485b1e6f5eb4dc9ec89e560/6485bab4d8da4bb319001bbe_stars.json" />
                </motion.div>
                {/* Clouds Lottie base (light mode) */}
                <motion.div
                  className="absolute pointer-events-none z-0"
                  style={{ width: '140%', height: '200%', left: '-20%', top: '-50%' }}
                  animate={{ opacity: isDarkMode ? 0 : 0.9 }}
                  transition={{ duration: 0.5 }}
                >
                  <Player autoplay speed={1.5} style={{ width: '100%', height: '100%' }} loop src="https://cdn.prod.website-files.com/6485b1e6f5eb4dc9ec89e560/6485bab50719867ec6c32ff9_clouds.json" />
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

{!isSurveyOpen && (
                <>
                  {!isLoggedIn ? (
                    <>
                      <button
                        onClick={handleShowLoginConfirm}
                        className={`hidden md:block text-sm font-medium transition-colors ${isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        {t('nav.signIn')}
                      </button>
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
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isDarkMode ? 'bg-blue-600' : 'bg-blue-600'}`}>
                        {currentUser?.name?.[0] || 'D'}
                      </div>
                      <div className="hidden sm:flex flex-col">
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{currentUser?.name}</span>
                        <button
                          onClick={handleLogout}
                          className={`text-xs font-semibold transition-colors ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
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
              key={language}
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
                className={`mt-8 w-full py-3 rounded-full font-semibold transition-all ${isDarkMode ? 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20' : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'}`}
              >
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
              key={language}
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

      {/* Technology Modal */}
      <AnimatePresence>
        {showTechnologyModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-md" onClick={() => setShowTechnologyModal(false)}>
            <div className="flex items-center justify-center min-h-screen p-4">
              <motion.div
                key={language}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className={`relative backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-[2rem] overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col ${isDarkMode ? 'bg-[#0b132b]/95 border-white/10' : 'bg-white/95 border border-gray-200'}`}
                onClick={e => e.stopPropagation()}
              >
                {/* Fixed Header */}
                <div className={`sticky top-0 z-10 flex items-center justify-between px-8 py-6 border-b backdrop-blur-3xl ${isDarkMode ? 'border-white/10 bg-[#0b132b]/80' : 'border-gray-200 bg-white/80'}`}>
                  <h2 className={`text-2xl font-bold flex-1 ${isDarkMode ? 'text-white' : 'text-[#0b132b]'}`}>{t('techModal.title')}</h2>
                  <button
                    onClick={() => setShowTechnologyModal(false)}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/10 border border-white/20 text-gray-400 hover:bg-white/20 hover:text-white' : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className={`overflow-y-auto flex-1 px-8 py-6 space-y-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {/* Main Question & Intro */}
                  <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-gray-50 border border-gray-200'}`}>
                    <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                      {t('techModal.question')}
                    </h3>
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('techModal.intro')}
                    </p>
                  </div>

                  {/* Three Core Pillars */}
                  <div>
                    <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {t('techModal.pillars')}
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Pillar 1 */}
                      <div className={`p-5 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                        <h4 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                          <span className="w-2 h-2 rounded-full bg-gray-400" />
                          {t('techModal.pillar1Title')}
                        </h4>
                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {t('techModal.pillar1Text')}
                        </p>
                      </div>

                      {/* Pillar 2 */}
                      <div className={`p-5 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                        <h4 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                          <span className="w-2 h-2 rounded-full bg-gray-400" />
                          {t('techModal.pillar2Title')}
                        </h4>
                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {t('techModal.pillar2Text')}
                        </p>
                      </div>

                      {/* Pillar 3 */}
                      <div className={`p-5 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                        <h4 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                          <span className="w-2 h-2 rounded-full bg-gray-400" />
                          {t('techModal.pillar3Title')}
                        </h4>
                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {t('techModal.pillar3Text')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Operation Principles */}
                  <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-gray-50 border border-gray-200'}`}>
                    <h3 className={`font-bold mb-4 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                      {t('techModal.operationTitle')}
                    </h3>
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('techModal.operationText')}
                    </p>
                  </div>
                </div>

                {/* Fixed Footer */}
                <div className={`sticky bottom-0 z-10 px-8 py-4 border-t backdrop-blur-3xl ${isDarkMode ? 'border-white/10 bg-[#0b132b]/80' : 'border-gray-200 bg-white/80'}`}>
                  <button
                    onClick={() => setShowTechnologyModal(false)}
                    className={`w-full py-3 rounded-full font-semibold transition-all ${isDarkMode ? 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20 hover:text-white' : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 hover:text-gray-900'}`}
                  >
                    {t('techModal.close')}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
      {renderHowItWorksModal()}
      {renderEmergencyModal()}
      {renderLoginConfirmModal()}

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
                  {/* Earth Background — switches based on heroVariant */}
                  <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none overflow-hidden">
                    <AnimatePresence mode="wait">
                      {heroVariant === 1 ? (
                        /* Dark v1: Old rotating grayscale Earth from Unsplash */
                        <motion.div
                          key="dark-globe-old"
                          initial={{ opacity: 0, scale: 0.8, y: 200 }}
                          animate={{ opacity: 0.85, scale: 1, y: -160 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          style={{ width: '180vw', maxWidth: '1920px', minWidth: '1440px', aspectRatio: '1/1' }}
                        >
                          <motion.img
                            src="https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=2000&auto=format&fit=crop"
                            alt="Earth"
                            className="w-full h-full object-cover rounded-full"
                            style={{
                              filter: 'grayscale(1) contrast(1.2) brightness(0.7)',
                              maskImage: 'radial-gradient(circle at 50% 50%, black 65%, transparent 70%)',
                              WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 65%, transparent 70%)'
                            }}
                            animate={{ rotate: earthRotation }}
                            transition={{ duration: 2.66, ease: "easeInOut" }}
                          />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent via-[#0B0F19]/80 to-[#0B0F19] pointer-events-none" />
                        </motion.div>
                      ) : (
                        /* Dark v2: Current space Earth */
                        <motion.div
                          key="dark-globe-new"
                          initial={{ opacity: 0, scale: 0.8, y: 100 }}
                          animate={{ opacity: 0.9, scale: 1, y: -80 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          style={{ width: '100vw', maxWidth: '960px', minWidth: '720px', aspectRatio: '1/1' }}
                        >
                          <motion.img
                            src="https://image2url.com/r2/default/images/1775837714078-559555ac-f611-48f2-afde-5968948264e1.png"
                            alt="Earth"
                            className="w-full h-full object-cover rounded-full"
                            style={{
                              maskImage: 'radial-gradient(circle at 50% 50%, black 65%, transparent 70%)',
                              WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 65%, transparent 70%)'
                            }}
                          />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent via-[#0B0F19]/80 to-[#0B0F19] pointer-events-none" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Bottom gradient */}
                  <div className="absolute bottom-0 left-0 w-full h-[30vh] bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/90 to-transparent z-[2] pointer-events-none" />
                  {/* Dark mode content — centered */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-32 pb-80 md:pb-96" style={{ minHeight: '100vh' }}>
                    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-widest mb-8 border bg-white/8 border-white/15 text-white/90 backdrop-blur-md"
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
                      className="flex flex-wrap items-center gap-6 text-white/50"
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

                  {/* Background Visual - switches between Globe (v1) and Girl Illustration (v2) */}
                  <div className="absolute top-1/2 right-[-20%] md:right-[-10%] lg:right-[0%] -translate-y-1/2 w-[600px] h-[600px] lg:w-[900px] lg:h-[900px] pointer-events-none" style={{ zIndex: -10 }}>
                    <AnimatePresence mode="wait">
                      {heroVariant === 1 ? (
                        /* ---- Hero v1: Rotating Globe ---- */
                        <motion.div
                          key="globe"
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="w-full h-full relative"
                          style={{
                            WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 55%, transparent 80%)',
                            maskImage: 'radial-gradient(circle at 50% 50%, black 55%, transparent 80%)'
                          }}
                        >
                          {/* Inner glow for 3D effect */}
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
                              filter: 'brightness(1.8) contrast(0.85) grayscale(0.2) saturate(0.9) blur(1.5px) opacity(0.9)',
                              mixBlendMode: 'luminosity'
                            }}
                            animate={{ rotate: earthRotation }}
                            transition={{ duration: 2.66, ease: "easeInOut" }}
                          />
                          {/* Deep shadow for 3D volume */}
                          <div className="absolute inset-0 rounded-full shadow-[inset_-20px_-20px_80px_rgba(200,220,255,0.3),inset_30px_30px_80px_rgba(255,255,255,0.8)] z-20 pointer-events-none" />
                        </motion.div>
                      ) : (
                        /* ---- Hero v2: Girl with Flowers Illustration ---- */
                        <motion.div
                          key="flowers"
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="w-full h-full relative"
                        >
                          <motion.div
                            className="w-full h-full"
                            style={{
                              backgroundImage: 'url(https://image2url.com/r2/default/images/1775833042260-9b4ddd91-fea4-4bd9-acfb-ee4c62c41c64.png)',
                              backgroundSize: '100%',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              opacity: 0.9
                            }}
                          />
                          {/* Falling flower petals */}
                          {[...Array(8)].map((_, i) => (
                            <motion.div
                              key={`flower-${i}`}
                              className="absolute rounded-full"
                              style={{
                                width: `${Math.random() * 12 + 8}px`,
                                height: `${Math.random() * 12 + 8}px`,
                                backgroundColor: `rgba(255, 235, 59, ${Math.random() * 0.5 + 0.5})`,
                                left: `${Math.random() * 100}%`,
                                top: '-20px',
                                boxShadow: `0 0 ${Math.random() * 8 + 4}px rgba(255, 235, 59, ${Math.random() * 0.5 + 0.4})`
                              }}
                              animate={{
                                y: ['-20px', '600px'],
                                x: [`${Math.random() * 100 - 50}px`, `${Math.random() * 100 - 50}px`],
                                opacity: [0, 0.95, 0]
                              }}
                              transition={{
                                duration: Math.random() * 6 + 8,
                                repeat: Infinity,
                                delay: Math.random() * 5,
                                ease: "easeInOut"
                              }}
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
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
              {/* ── Hero Variant Toggle Button (bottom-right, both modes) ── */}
              <div className={`absolute bottom-8 right-8 z-50 flex items-center gap-1 p-1.5 rounded-full backdrop-blur-2xl border shadow-lg ${
                isDarkMode
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/30 border-white/60'
              }`}>
                <button
                  id="hero-variant-1-btn"
                  onClick={() => setHeroVariant(1)}
                  title="Hero version 1 — Globe"
                  className={`w-9 h-9 rounded-full font-bold text-sm transition-all duration-300 ${
                    heroVariant === 1
                      ? 'bg-[#1d70f5] text-white shadow-md'
                      : isDarkMode
                        ? 'text-white/60 hover:bg-white/20'
                        : 'text-slate-600 hover:bg-white/50'
                  }`}
                >1</button>
                <button
                  id="hero-variant-2-btn"
                  onClick={() => setHeroVariant(2)}
                  title="Hero version 2 — Illustration"
                  className={`w-9 h-9 rounded-full font-bold text-sm transition-all duration-300 ${
                    heroVariant === 2
                      ? 'bg-[#1d70f5] text-white shadow-md'
                      : isDarkMode
                        ? 'text-white/60 hover:bg-white/20'
                        : 'text-slate-600 hover:bg-white/50'
                  }`}
                >2</button>
              </div>
            </section>

            {/* Wellness Tools Section */}
            <ArticleSection language={language} />

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
        ) : !hasConsented && !showMotivational ? (
          <motion.div
            key="consent"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="container mx-auto px-6 min-h-[100dvh] flex flex-col items-center justify-center py-24"
          >
            {renderConsentScreen()}
          </motion.div>
        ) : !hasConsented && showMotivational ? (
          <motion.div
            key="motivational"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="container mx-auto px-6 min-h-[100dvh] flex flex-col items-center justify-center py-24"
          >
            {renderMotivationalScreen()}
          </motion.div>
        ) : (
          <motion.div
            key="survey"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`container mx-auto px-6 min-h-[100dvh] flex flex-col w-full ${isCompleted ? 'items-stretch justify-start pt-24 pb-12 max-w-[1360px]' : 'items-center justify-center py-24 max-w-3xl'}`}
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
                  <div className="relative w-full">
                    {/* TOP LEFT - Back to Dashboard */}
                    <motion.button
                      onClick={() => setActiveDataModule('dashboard')}
                      className={`hidden lg:flex absolute -left-7 top-8 z-50 w-14 h-14 rounded-full items-center justify-center font-bold text-2xl shadow-lg leading-none pointer-events-auto ${
                        activeDataModule === 'dashboard'
                          ? (isDarkMode ? 'bg-white/30 text-white border border-white/60' : 'bg-white/30 text-slate-900 border border-white/60')
                          : (isDarkMode ? 'bg-white/15 text-slate-300 hover:bg-white/25 border border-white/30' : 'bg-white/15 text-slate-600 hover:bg-white/25 border border-white/30')
                      }`}
                      whileHover={{ scale: 1.1, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ WebkitFontSmoothing: 'antialiased' }}
                      title={t('ui.backToDashboard')}
                    >
                      &lt;
                    </motion.button>

                    {/* TOP RIGHT - Go to Analytics */}
                    <motion.button
                      onClick={() => setActiveDataModule('analytics')}
                      className={`hidden lg:flex absolute -right-7 top-8 z-50 w-14 h-14 rounded-full items-center justify-center font-bold text-2xl shadow-lg leading-none pointer-events-auto ${
                        activeDataModule === 'analytics'
                          ? (isDarkMode ? 'bg-white/30 text-white border border-white/60' : 'bg-white/30 text-slate-900 border border-white/60')
                          : (isDarkMode ? 'bg-white/15 text-slate-300 hover:bg-white/25 border border-white/30' : 'bg-white/15 text-slate-600 hover:bg-white/25 border border-white/30')
                      }`}
                      whileHover={{ scale: 1.1, x: -5 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ WebkitFontSmoothing: 'antialiased' }}
                      title={t('ui.toAnalytics')}
                    >
                      &gt;
                    </motion.button>

                    {/* BOTTOM LEFT - Back to Dashboard */}
                    <motion.button
                      onClick={() => setActiveDataModule('dashboard')}
                      className={`hidden lg:flex absolute left-4 bottom-8 z-50 w-14 h-14 rounded-full items-center justify-center font-bold text-2xl shadow-lg leading-none pointer-events-auto ${
                        activeDataModule === 'dashboard'
                          ? (isDarkMode ? 'bg-white/30 text-white border border-white/60' : 'bg-white/30 text-slate-900 border border-white/60')
                          : (isDarkMode ? 'bg-white/15 text-slate-300 hover:bg-white/25 border border-white/30' : 'bg-white/15 text-slate-600 hover:bg-white/25 border border-white/30')
                      }`}
                      whileHover={{ scale: 1.1, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ WebkitFontSmoothing: 'antialiased' }}
                      title={t('ui.backToDashboard')}
                    >
                      &lt;
                    </motion.button>

                    {/* BOTTOM RIGHT - Go to Analytics */}
                    <motion.button
                      onClick={() => setActiveDataModule('analytics')}
                      className={`hidden lg:flex absolute right-4 bottom-8 z-50 w-14 h-14 rounded-full items-center justify-center font-bold text-2xl shadow-lg leading-none pointer-events-auto ${
                        activeDataModule === 'analytics'
                          ? (isDarkMode ? 'bg-white/30 text-white border border-white/60' : 'bg-white/30 text-slate-900 border border-white/60')
                          : (isDarkMode ? 'bg-white/15 text-slate-300 hover:bg-white/25 border border-white/30' : 'bg-white/15 text-slate-600 hover:bg-white/25 border border-white/30')
                      }`}
                      whileHover={{ scale: 1.1, x: -5 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ WebkitFontSmoothing: 'antialiased' }}
                      title={t('ui.toAnalytics')}
                    >
                      &gt;
                    </motion.button>

                    {/* Dashboard View */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={activeDataModule === 'dashboard' ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      style={{
                        pointerEvents: activeDataModule === 'dashboard' ? 'auto' : 'none',
                        display: activeDataModule === 'dashboard' ? 'block' : 'none'
                      }}
                      className="w-full"
                    >
                    <div className="text-left w-full max-w-[1320px] mx-auto" style={{
                      background: isDarkMode ? 'linear-gradient(135deg, rgba(15,23,42,0.4) 0%, rgba(30,41,59,0.4) 100%)' : 'linear-gradient(135deg, rgba(248,249,250,0.8) 0%, rgba(240,244,248,0.8) 100%)'
                    }}>
                      {/* Medical Report Style */}
                      <div className={`relative rounded-[2.5rem] p-6 md:p-8 xl:p-10 shadow-[0_24px_90px_rgba(45,51,55,0.06)] ${isDarkMode ? 'bg-slate-900/40 border border-white/10' : 'bg-white/95 border border-slate-100'}`}>
                          {/* Binding holes on the left */}
                          <div className="absolute left-8 top-0 bottom-0 w-1 flex flex-col items-center justify-around pointer-events-none">
                            {[...Array(8)].map((_, i) => (
                              <motion.div
                                key={`hole-${i}`}
                                className="w-3 h-3 rounded-full border-2"
                                style={{
                                  borderColor: isDarkMode ? 'rgba(100,116,139,0.5)' : 'rgba(71,85,105,0.4)',
                                  boxShadow: isDarkMode
                                    ? 'inset 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(255,255,255,0.1)'
                                    : 'inset 0 1px 2px rgba(0,0,0,0.1), 0 1px 2px rgba(255,255,255,0.8)'
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                              />
                            ))}
                          </div>

                          {/* Medical Report Header */}
                          <div className={`mb-8 pb-6 border-b-2 pl-8 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div>
                                <h2 className={`text-3xl lg:text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                                  style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                                  {t('ui.resultsPanel.title')}
                                </h2>
                                <p className={`mt-2 text-sm md:text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                                  style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
                                  {t('ui.resultsPanel.subtitle')}
                                </p>
                              </div>
                              <motion.div
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' : 'bg-teal-600/10 text-teal-700 border border-teal-200'}`}
                                style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                              >
                                <Activity className="w-4 h-4" /> {t('ui.resultsPanel.last30Days')}
                              </motion.div>
                            </div>
                          </div>

                          {/* Content Area */}
                          <div className="pl-8">
                            <section className={`rounded-[2rem] p-6 md:p-8 xl:p-10 ${isDarkMode ? 'bg-slate-800/30' : 'bg-slate-50/50'}`}>
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                                <div className="lg:col-span-12 flex flex-col gap-8">
                                  {renderDashboardView()}
                                </div>
                              </div>
                            </section>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Analytics View */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={activeDataModule === 'analytics' ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      style={{
                        pointerEvents: activeDataModule === 'analytics' ? 'auto' : 'none',
                        display: activeDataModule === 'analytics' ? 'block' : 'none'
                      }}
                      className="w-full"
                    >
                    <div className="text-left w-full max-w-[1320px] mx-auto" style={{
                      background: isDarkMode ? 'linear-gradient(135deg, rgba(15,23,42,0.4) 0%, rgba(30,41,59,0.4) 100%)' : 'linear-gradient(135deg, rgba(248,249,250,0.8) 0%, rgba(240,244,248,0.8) 100%)'
                    }}>
                      <div className={`relative rounded-[2.5rem] p-6 md:p-8 xl:p-10 shadow-[0_24px_90px_rgba(45,51,55,0.06)] ${isDarkMode ? 'bg-slate-900/40 border border-white/10' : 'bg-white/95 border border-slate-100'}`}>
                          {/* Binding holes on the left */}
                          <div className="absolute left-8 top-0 bottom-0 w-1 flex flex-col items-center justify-around pointer-events-none">
                            {[...Array(8)].map((_, i) => (
                              <motion.div
                                key={`hole-analytics-${i}`}
                                className="w-3 h-3 rounded-full border-2"
                                style={{
                                  borderColor: isDarkMode ? 'rgba(100,116,139,0.5)' : 'rgba(71,85,105,0.4)',
                                  boxShadow: isDarkMode
                                    ? 'inset 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(255,255,255,0.1)'
                                    : 'inset 0 1px 2px rgba(0,0,0,0.1), 0 1px 2px rgba(255,255,255,0.8)'
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                              />
                            ))}
                          </div>

                          {/* Medical Report Header */}
                          <div className={`mb-8 pb-6 border-b-2 pl-8 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div>
                                <h2 className={`text-3xl lg:text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                                  style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                                  {t('ui.resultsPanel.title')}
                                </h2>
                                <p className={`mt-2 text-sm md:text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                                  style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
                                  {t('ui.resultsPanel.subtitle')}
                                </p>
                              </div>
                              <motion.div
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' : 'bg-teal-600/10 text-teal-700 border border-teal-200'}`}
                                style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                              >
                                <Activity className="w-4 h-4" /> {t('ui.resultsPanel.last30Days')}
                              </motion.div>
                            </div>
                          </div>

                          {/* Content Area */}
                          <div className="pl-8">
                            <section className={`rounded-[2rem] p-6 md:p-8 xl:p-10 ${isDarkMode ? 'bg-slate-800/30' : 'bg-slate-50/50'}`}>
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
                                  <div className="flex flex-col items-center justify-center py-2">
                                    <GaugeChart level={aiResult.stress_level} confidence={aiResult.confidence_score} t={t} isDarkMode={isDarkMode} />
                                  </div>
                                  <div className="mt-4 pt-4 grid grid-cols-3 gap-2" style={{ borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
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
                                          title={`${getFeatureLabel(item.feature)}: ${Math.round(item.importance)}%`}
                                        >
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
                                              style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{getFeatureLabel(item.feature)}</div>
                                            <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                                              style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{Math.round(item.importance)}% {t('ui.impact')}</div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="mt-8 border-t border-slate-200/50 dark:border-white/10 pt-6">
                                    <h4 className={`text-base font-bold mb-3 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}
                                      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{t('ui.criticalTouchpoints')}</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {(insightMeta?.topFeatures || []).map((item, idx) => (
                                        <span key={`touch-${idx}`}
                                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-white/10 text-slate-200' : 'bg-white/60 text-slate-700'}`}
                                          style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
                                          {getFeatureLabel(item.feature)} ({Math.round(item.importance)}%)
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </section>

                              {/* Prominent Trends */}
                              <div className="max-w-2xl mx-auto w-full mt-4">
                                <div className={`analytics-glass-card w-full rounded-[1.75rem] p-5 flex flex-col items-center text-center border border-white/40 ${isDarkMode ? 'dark' : ''}`}>
                                  <h4 className={`text-base font-bold mb-3 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}
                                    style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{t('ui.prominentTrends')}</h4>
                                  {(() => {
                                    // buildInsightCopy() always formats as:
                                    // "<intro>. Top trends: <f1>, <f2>, <f3>."
                                    // We extract ONLY the feature tags (format: "Label (XX%)").
                                    const rawTrends = String(insightCopy?.trends || t('ui.prominentTrendsFallback'));
                                    // Match all "Label (XX%)" tokens regardless of language
                                    const tagRegex = /([^,;\n(]+\([^)]+%\))/g;
                                    const tagMatches = rawTrends.match(tagRegex) || [];
                                    const trendsList: string[] = tagMatches
                                      .map(s => s.trim())
                                      .filter(Boolean);

                                    // Final fallback: split on commas/semicolons
                                    const displayList = trendsList.length > 0
                                      ? trendsList
                                      : rawTrends.split(/[,;\n•]+/).map(s => s.replace(/\.$/, '').trim()).filter(Boolean);

                                    return (
                                      <div className="flex flex-wrap justify-center gap-2">
                                        {displayList.map((item, idx) => (
                                          <span key={`trend-${idx}`}
                                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-white/10 text-slate-200' : 'bg-white/60 text-slate-700'}`}
                                            style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>
                                            {item}
                                          </span>
                                        ))}
                                      </div>
                                    );
                                  })()}
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
                                    <button className={`${isDarkMode ? 'text-teal-300' : 'text-teal-700'} text-sm font-semibold flex items-center gap-1 hover:underline`}
                                      style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{t('ui.viewFullLog')} <ArrowRight className="w-3.5 h-3.5" /></button>
                                  </div>
                                  <div className={`p-5 rounded-[2rem] border ${isDarkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white/25 backdrop-blur-3xl border-white/40'}`}>
                                    <div className="space-y-3">
                                      {sessionHistory.slice(0, 5).map((session, idx) => {
                                        const score = session.level === 'High' ? '8.1' : session.level === 'Medium' ? '6.2' : '4.8';
                                        return (
                                          <div key={`history-${session.date}-${idx}`}
                                            className={`analytics-glass-card rounded-2xl p-4 flex items-center gap-6 border border-white/40 group hover:bg-white/60 transition-colors ${isDarkMode ? 'dark' : ''}`}>
                                            <div className={`w-24 text-xs font-bold shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                                              style={{ fontFamily: "'Manrope', 'Inter', sans-serif" }}>{formatSessionDate(session.date)}</div>
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
                            </div>
                          </div>
                        </div>
                    </motion.div>
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
