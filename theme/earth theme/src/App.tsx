import { useState } from 'react';
import { ArrowRight, Play, Sun } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [isDark, setIsDark] = useState(true);

  return (
    <div className={`min-h-screen font-sans overflow-hidden relative flex flex-col items-center justify-center transition-colors duration-700 ${isDark ? 'bg-black text-white selection:bg-[#ccff00] selection:text-black' : 'bg-[#f0f4f8] text-slate-900 selection:bg-blue-200 selection:text-blue-900'}`}>
      
      {/* Navbar */}
      <nav className={`absolute top-0 left-0 w-full z-50 px-6 lg:px-12 py-4 flex items-center justify-between transition-colors duration-700 ${isDark ? 'bg-[#0a0f1c]/80 border-white/10' : 'bg-white/80 border-slate-200'} backdrop-blur-md border-b`}>
        <div className="flex items-center gap-8 lg:gap-12">
          {/* Logo & Language */}
          <div className="flex items-center gap-6">
            <span className="text-2xl font-extrabold tracking-tight">Mindscan.ai</span>
            <button className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${isDark ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}>
              <div className="w-5 h-5 rounded-full bg-[#DA251D] flex items-center justify-center">
                <svg className="w-3 h-3 text-[#FFFF00] fill-current" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
              </div>
              VI
            </button>
          </div>
          
          {/* Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#" className="text-blue-500 border-b-2 border-blue-500 pb-1">Giải pháp</a>
            <a href="#" className={`pb-1 transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'}`}>Công nghệ AI</a>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Custom Theme Toggle */}
          <button 
            onClick={() => setIsDark(!isDark)}
            className={`relative w-[72px] h-9 rounded-full border transition-colors duration-300 flex items-center px-1 overflow-hidden ${isDark ? 'border-gray-600 bg-transparent' : 'border-gray-300 bg-blue-50'}`}
            aria-label="Toggle theme"
          >
            {/* Stars for dark mode */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full opacity-50"></div>
              <div className="absolute bottom-2 left-4 w-1 h-1 bg-white rounded-full opacity-80"></div>
              <div className="absolute top-4 left-6 w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
            </div>

            <motion.div 
              className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center ${isDark ? 'bg-transparent' : 'bg-white shadow-md'}`}
              animate={{ x: isDark ? 34 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {isDark ? (
                <div className="w-full h-full rounded-full bg-[#94a3b8] flex items-center justify-center relative overflow-hidden">
                   {/* Moon craters */}
                   <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-[#64748b] rounded-full opacity-60"></div>
                   <div className="absolute bottom-1 right-2 w-2 h-2 bg-[#64748b] rounded-full opacity-60"></div>
                   <div className="absolute top-3 right-1 w-1 h-1 bg-[#64748b] rounded-full opacity-60"></div>
                </div>
              ) : (
                <Sun className="w-4 h-4 text-yellow-500" />
              )}
            </motion.div>
          </button>

          <a href="#" className={`hidden sm:block text-sm font-medium transition-opacity hover:opacity-80 ${isDark ? 'text-white' : 'text-slate-900'}`}>Đăng nhập</a>
          <button className="bg-[#2563eb] hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors">
            Bắt đầu
          </button>
        </div>
      </nav>

      {/* Starry Background (Only visible in dark mode) */}
      <div 
        className={`absolute inset-0 z-0 transition-opacity duration-700 ${isDark ? 'opacity-40' : 'opacity-0'}`} 
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 25%, white 1px, transparent 1px),
            radial-gradient(circle at 75% 15%, white 1.5px, transparent 1.5px),
            radial-gradient(circle at 85% 65%, white 1px, transparent 1px),
            radial-gradient(circle at 25% 75%, white 2px, transparent 2px),
            radial-gradient(circle at 50% 45%, white 1px, transparent 1px),
            radial-gradient(circle at 90% 85%, white 1.5px, transparent 1.5px)
          `,
          backgroundSize: '400px 400px',
          backgroundRepeat: 'repeat'
        }}
      ></div>

      {/* Earth Background */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 100 }}
        animate={{ opacity: isDark ? 0.9 : 0.5, scale: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute -top-[5vh] md:-top-[12vh] left-1/2 -translate-x-1/2 w-[280vw] sm:w-[220vw] md:w-[170vw] lg:w-[140vw] max-w-[3000px] aspect-square z-0 pointer-events-none flex justify-center"
      >
        <motion.img
          src="https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=2000&auto=format&fit=crop"
          alt="Earth"
          className={`w-full h-full object-cover rounded-full transition-all duration-700 ${isDark ? 'grayscale contrast-[1.2] brightness-[0.7]' : 'contrast-125 brightness-110'}`}
          style={{
            maskImage: 'radial-gradient(circle at 50% 50%, black 65%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 65%, transparent 70%)'
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 53, repeat: Infinity, ease: "linear" }}
        />
        {/* Overlay to darken the center of the earth for better text readability */}
        <div className={`absolute inset-0 rounded-full transition-colors duration-700 ${isDark ? 'bg-gradient-to-b from-transparent via-black/80 to-black' : 'bg-gradient-to-b from-transparent via-white/60 to-[#f0f4f8]'}`}></div>
      </motion.div>

      {/* Bottom gradient to blend earth into background */}
      <div className={`absolute bottom-0 left-0 w-full h-[70vh] bg-gradient-to-t z-0 pointer-events-none transition-colors duration-700 ${isDark ? 'from-black via-black/90 to-transparent' : 'from-[#f0f4f8] via-[#f0f4f8]/90 to-transparent'}`}></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto mt-48 md:mt-56">
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md mb-8 transition-colors duration-700 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-slate-200 shadow-sm'}`}
        >
          <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] animate-pulse ${isDark ? 'bg-[#ccff00] text-[#ccff00]' : 'bg-blue-500 text-blue-500'}`}></span>
          <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-700 ${isDark ? 'text-white/90' : 'text-slate-700'}`}>AI Dựa trên nghiên cứu</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className={`text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight mb-6 leading-[1.05] transition-colors duration-700 ${isDark ? 'text-white' : 'text-slate-900'}`}
        >
          Phát hiện Căng thẳng <br className="hidden md:block" /> & Sức khỏe Tinh thần
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className={`text-lg md:text-xl max-w-2xl mb-10 leading-relaxed transition-colors duration-700 ${isDark ? 'text-white/60' : 'text-slate-600'}`}
        >
          Khám phá một cuộc sống học tập cân bằng hơn. Công nghệ thông minh và tận tâm của chúng tôi giúp nhận diện sớm các dấu hiệu căng thẳng và đưa ra lộ trình cải thiện cá nhân hóa.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <button className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold transition-all duration-300 group ${isDark ? 'bg-[#ccff00] text-black hover:bg-[#b3e600]' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'}`}>
            Bắt đầu Khảo sát
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className={`w-full sm:w-auto flex items-center justify-center gap-2 border px-8 py-4 rounded-full font-semibold transition-all duration-300 ${isDark ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'}`}>
            <Play className="w-4 h-4 fill-current" />
            Xem cách hoạt động
          </button>
        </motion.div>

      </div>
    </div>
  );
}
