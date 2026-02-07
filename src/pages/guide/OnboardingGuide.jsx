import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  motion, AnimatePresence, useMotionValue, useTransform 
} from 'framer-motion';
import { 
  Utensils, MapPin, BadgePoundSterling, Clock, FileCheck, 
  CheckCircle2, ArrowRight, ArrowLeft, ChefHat, 
  CreditCard, Sparkles, Store, Smartphone, Mail, Lock, 
  Map, Building2, Coins, CalendarClock, ShieldCheck
} from 'lucide-react';
import clsx from 'clsx';

// ==========================================
// 1. HELPER COMPONENTS (DEFINED FIRST)
// ==========================================

const ConfettiExplosion = () => {
    return (
        <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className={clsx("absolute w-2 h-2 rounded", ["bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-green-500"][i % 4])}
                    initial={{ x: 0, y: 0 }}
                    animate={{ 
                        x: (Math.random() - 0.5) * 300, 
                        y: (Math.random() - 1) * 300, 
                        rotate: 360,
                        opacity: [1, 0] 
                    }}
                    transition={{ duration: 1.5, ease: "easeOut", repeat: Infinity, delay: Math.random() }}
                />
            ))}
        </div>
    );
};

const StepCircle = ({ num, text }) => (
    <div className="flex flex-col items-center gap-1">
        <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold shadow-md shadow-indigo-200">
            {num}
        </div>
        <span className="text-[10px] uppercase font-bold text-indigo-400">{text}</span>
    </div>
);

function HourglassIcon(props) {
    return <Clock {...props} className="animate-spin-slow" />; 
}

// Simple icon placeholders for background
const PizzaIcon = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 22h20L12 2z"/><circle cx="12" cy="14" r="2"/></svg>;
const BurgerIcon = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="14" width="16" height="6" rx="2"/><path d="M4 10h16v2H4z"/><path d="M4 10c0-4 3-7 8-7s8 3 8 7"/></svg>;
const LeafIcon = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2S2 8 2 16a10 10 0 0 0 20 0c0-8-10-14-10-14z"/><path d="M12 2v20"/></svg>;

// ==========================================
// 2. CHEF MASCOT
// ==========================================
const ChefMascot = ({ step }) => {
  // --- ANIMATION VARIANTS ---
  const variants = {
    // 0. INTRO: Friendly Wave
    0: {
      head: { y: [0, -2, 0], transition: { repeat: Infinity, duration: 2 } },
      leftArm: { rotate: [0, 20, 0, 20, 0], transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } },
      rightArm: { rotate: 10 },
      mouth: { d: "M 38 65 Q 50 75 62 65" }, 
      eyes: { scaleY: [1, 0.1, 1], transition: { repeat: Infinity, delay: 3, duration: 0.2 } }
    },
    // 1. IDENTITY: Proud / ID Badge
    1: {
      head: { rotate: -5 },
      leftArm: { rotate: -30, x: 5 }, 
      rightArm: { rotate: -140, x: -10, y: 10 }, 
      mouth: { d: "M 40 70 Q 50 75 60 70" }, 
      eyes: { scaleY: 1 },
      prop: "badge"
    },
    // 2. LOCATION: Reading Map
    2: {
      head: { rotate: 0, y: 5 }, 
      leftArm: { rotate: -80, x: 20 }, 
      rightArm: { rotate: 80, x: -20 }, 
      mouth: { d: "M 45 72 Q 50 65 55 72" }, 
      eyes: { y: 2 }, 
      prop: "map"
    },
    // 3. FINANCIALS: Holding Coin
    3: {
      head: { rotate: 5 },
      leftArm: { rotate: -120, x: 10 }, 
      rightArm: { rotate: 20 },
      mouth: { d: "M 38 65 Q 50 75 62 65" }, 
      eyes: { scaleY: 1 },
      prop: "coin"
    },
    // 4. TIMINGS: Checking Watch
    4: {
      head: { rotate: -15, y: 3 }, 
      leftArm: { rotate: -20 },
      rightArm: { rotate: -100, x: -10, y: 0 }, 
      mouth: { d: "M 42 70 L 58 70" }, 
      prop: "watch"
    },
    // 5. DOCS: Checking Clipboard
    5: {
      head: { rotate: [0, 0, 0, 5, 0], transition: { repeat: Infinity, duration: 1.5 } }, 
      leftArm: { rotate: -90, x: 15 }, 
      rightArm: { rotate: -45, x: -5 }, 
      mouth: { d: "M 40 70 Q 50 75 60 70" },
      prop: "clipboard"
    },
    // 6. APPROVAL: Waiting/Twiddling
    6: {
      head: { rotate: [5, -5, 5], transition: { repeat: Infinity, duration: 3 } },
      leftArm: { rotate: -50, x: 15 }, 
      rightArm: { rotate: 50, x: -15 },
      mouth: { d: "M 42 72 Q 50 68 58 72" }, 
      eyes: { scaleY: 1.1 }, 
      sweat: true
    },
    // 7. STRIPE: Victory
    7: {
      head: { y: -5 },
      body: { y: [0, -10, 0], transition: { repeat: Infinity, duration: 0.6 } }, 
      leftArm: { rotate: -150, transition: { yoyo: Infinity, duration: 0.3 } }, 
      rightArm: { rotate: 150, transition: { yoyo: Infinity, duration: 0.3 } },
      mouth: { d: "M 35 60 Q 50 85 65 60" }, 
      eyes: { d: "M 35 45 L 45 45 M 55 45 L 65 45" }, 
      confetti: true
    }
  };

  const current = variants[step] || variants[0];

  return (
    <div className="relative w-72 h-72 flex items-center justify-center">
      {/* --- CONFETTI LAYER --- */}
      {current.confetti && <ConfettiExplosion />}

      <motion.div className="relative w-48 h-48" animate={current.body || { y: 0 }}>
        
        {/* SHADOW */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-6 bg-black/10 rounded-[100%] blur-sm" />

        {/* --- LEFT ARM (Behind Body) --- */}
        <motion.div 
          className="absolute top-20 left-2 w-10 h-24 bg-orange-600 rounded-full origin-top border-2 border-orange-700 z-0"
          animate={current.leftArm}
        >
           <div className="absolute bottom-0 w-10 h-10 bg-[#FFD1AA] rounded-full border-2 border-orange-800" />
        </motion.div>

        {/* --- RIGHT ARM (Behind Body) --- */}
        <motion.div 
          className="absolute top-20 right-2 w-10 h-24 bg-orange-600 rounded-full origin-top border-2 border-orange-700 z-0"
          animate={current.rightArm}
        >
           {/* Watch Prop */}
           {current.prop === 'watch' && (
               <div className="absolute bottom-8 w-full h-4 bg-gray-800" />
           )}
           <div className="absolute bottom-0 w-10 h-10 bg-[#FFD1AA] rounded-full border-2 border-orange-800" />
        </motion.div>

        {/* --- BODY --- */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-28 h-32 bg-white rounded-3xl shadow-lg border-2 border-gray-200 z-10 overflow-hidden flex flex-col items-center">
           {/* Buttons */}
           <div className="mt-4 flex flex-col gap-3">
              <div className="w-3 h-3 bg-black rounded-full opacity-80" />
              <div className="w-3 h-3 bg-black rounded-full opacity-80" />
           </div>
           {/* Badge Prop */}
           <AnimatePresence>
             {current.prop === 'badge' && (
                <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute top-6 left-2 bg-yellow-400 w-12 h-8 rounded border border-yellow-600 flex items-center justify-center"
                >
                    <span className="text-[6px] font-bold">CHEF</span>
                </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* --- HEAD --- */}
        <motion.div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#FFD1AA] rounded-[40px] shadow-xl border-2 border-[#EBB084] z-20"
          animate={current.head}
        >
           {/* Chef Hat */}
           <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-24">
              <div className="w-full h-full bg-white rounded-t-full rounded-b-lg shadow-md border-b-4 border-gray-100 relative">
                  <div className="absolute bottom-2 w-full h-1 bg-gray-100" />
              </div>
           </div>

           {/* Face Container */}
           <div className="relative w-full h-full">
               
               {/* Eyes */}
               <motion.div className="absolute top-12 left-6 w-4 h-4 bg-black rounded-full" animate={current.eyes} />
               <motion.div className="absolute top-12 right-6 w-4 h-4 bg-black rounded-full" animate={current.eyes} />

               {/* Cheeks */}
               <div className="absolute top-16 left-4 w-5 h-3 bg-red-400 rounded-full opacity-30 blur-[2px]" />
               <div className="absolute top-16 right-4 w-5 h-3 bg-red-400 rounded-full opacity-30 blur-[2px]" />

               {/* Mouth */}
               <svg className="absolute top-12 left-0 w-full h-full pointer-events-none">
                  <motion.path 
                    d="M 38 65 Q 50 75 62 65" 
                    stroke="#4A3B32" 
                    strokeWidth="3" 
                    fill="transparent" 
                    strokeLinecap="round"
                    animate={current.mouth}
                  />
               </svg>

               {/* Sweat Drop */}
               <AnimatePresence>
                   {current.sweat && (
                     <motion.div 
                       initial={{ opacity: 0, y: -10 }}
                       animate={{ opacity: 1, y: 10 }}
                       exit={{ opacity: 0 }}
                       transition={{ repeat: Infinity, duration: 1.2 }}
                       className="absolute top-6 right-2 w-3 h-5 bg-blue-300 rounded-full rounded-tr-none"
                     />
                   )}
               </AnimatePresence>
           </div>
        </motion.div>

        {/* --- DYNAMIC PROPS (Overlay) --- */}
        <AnimatePresence mode="wait">
            {current.prop === 'map' && (
                <motion.div 
                    initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                    className="absolute top-36 left-4 z-30 w-40 h-24 bg-blue-50 border-2 border-blue-200 rounded shadow-lg flex items-center justify-center"
                >
                    <MapPin className="text-red-500 w-8 h-8 drop-shadow-md" />
                    <div className="absolute bottom-2 w-3/4 h-1 bg-gray-200 rounded" />
                    <div className="absolute bottom-4 w-1/2 h-1 bg-gray-200 rounded" />
                </motion.div>
            )}
            
            {current.prop === 'coin' && (
                <motion.div 
                    initial={{ y: 0 }} animate={{ y: -40, rotateY: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute top-10 -left-10 z-40"
                >
                    <div className="w-12 h-12 bg-yellow-400 rounded-full border-4 border-yellow-500 flex items-center justify-center text-yellow-700 font-black shadow-lg">$</div>
                </motion.div>
            )}

            {current.prop === 'clipboard' && (
                <motion.div 
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    className="absolute top-28 -left-8 z-30 w-20 h-28 bg-orange-100 border-4 border-orange-800 rounded-lg shadow-md flex flex-col items-center pt-3"
                >
                    <div className="w-12 h-2 bg-gray-300 mb-2 rounded" />
                    <div className="w-10 h-1 bg-gray-400 mb-2 rounded" />
                    <div className="w-10 h-1 bg-gray-400 mb-2 rounded" />
                    <CheckCircle2 className="w-8 h-8 text-green-600 mt-2" />
                </motion.div>
            )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

// ==========================================
// 3. BACKGROUND: FLOATING FOOD
// ==========================================
const FloatingFood = () => {
    // A subtle background of floating SVG icons
    const icons = [Utensils, PizzaIcon, BurgerIcon, LeafIcon]; 
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
            {[...Array(20)].map((_, i) => {
                const Icon = icons[i % icons.length];
                return (
                    <motion.div
                        key={i}
                        className="absolute text-black"
                        initial={{ 
                            x: Math.random() * window.innerWidth, 
                            y: Math.random() * window.innerHeight,
                            rotate: 0 
                        }}
                        animate={{ 
                            y: [0, -100, 0], 
                            rotate: 360 
                        }}
                        transition={{ 
                            duration: 20 + Math.random() * 10, 
                            repeat: Infinity, 
                            ease: "linear" 
                        }}
                    >
                        <Icon size={40 + Math.random() * 40} />
                    </motion.div>
                )
            })}
        </div>
    )
};

// ==========================================
// 4. DATA: ONBOARDING STEPS
// ==========================================
const CHAPTERS = [
  {
    id: 'intro',
    title: "Welcome, Chef!",
    subtitle: "Let's build your digital kitchen.",
    icon: Sparkles,
    theme: "from-orange-50 to-white",
    cardBg: "bg-white",
    accent: "text-orange-600",
    mascotText: "Hi! I'm Chef Odi. I'll help you set up your restaurant in just 5 minutes. Ready to cook?",
    isIntro: true,
  },
  {
    id: 'identity',
    title: "Step 1: The Brand",
    subtitle: "Name on the door.",
    icon: Store,
    theme: "from-blue-50 to-white",
    cardBg: "bg-white",
    accent: "text-blue-600",
    mascotText: "First, tell me who you are! Your Restaurant Name is what customers will see on the app.",
    inputs: [
      { name: "Restaurant Name", icon: Store, required: true, why: "Your public brand name.", tip: "Make it catchy!" },
      { name: "Owner Name", icon: Utensils, required: true, why: "For legal verification.", tip: "Must match your ID." },
      { name: "Email", icon: Mail, required: true, why: "Your admin login key.", tip: "Use a secure business email." },
      { name: "Password", icon: Lock, required: true, why: "Protect your earnings.", tip: "Keep it secret, keep it safe." },
      { name: "Phone", icon: Smartphone, required: true, why: "For urgent order updates.", tip: "UK mobile or landline." },
    ]
  },
  {
    id: 'location',
    title: "Step 2: The Spot",
    subtitle: "Where the magic happens.",
    icon: MapPin,
    theme: "from-green-50 to-white",
    cardBg: "bg-white",
    accent: "text-green-600",
    mascotText: "I need to know where to send the drivers! Use the search bar to find your kitchen.",
    inputs: [
      { name: "Search Address", icon: Map, required: true, why: "Auto-fills everything.", tip: "Type postcode or business name." },
      { name: "Shop No", icon: Building2, required: true, why: "Exact pickup point.", tip: "Unit number or floor." },
      { name: "Coordinates", icon: MapPin, required: true, why: "For GPS radius.", tip: "Auto-detected. Don't touch!" },
    ]
  },
  {
    id: 'financials',
    title: "Step 3: The Menu Money",
    subtitle: "Setting the rules.",
    icon: BadgePoundSterling,
    theme: "from-purple-50 to-white",
    cardBg: "bg-white",
    accent: "text-purple-600",
    mascotText: "Let's talk cash. Set your delivery fees and how far you're willing to travel.",
    inputs: [
      { name: "Handling Fee", icon: Coins, required: true, why: "Small order surcharge.", tip: "Usually 1-2%." },
      { name: "Free Radius", icon: CheckCircle2, required: true, why: "Free delivery zone.", tip: "Keep it local (2-3 miles)." },
      { name: "Max Radius", icon: Map, required: true, why: "The hard limit.", tip: "Don't go too far (cold food!)." },
      { name: "Charge/Mile", icon: ArrowRight, required: true, why: "Extra distance fee.", tip: "e.g. £1.50 per mile." },
    ]
  },
  {
    id: 'timings',
    title: "Step 4: Opening Hours",
    subtitle: "Clocking in.",
    icon: Clock,
    theme: "from-amber-50 to-white",
    cardBg: "bg-white",
    accent: "text-amber-600",
    mascotText: "Don't leave customers hanging! Tell us exactly when your kitchen is firing.",
    inputs: [
      { name: "Daily Switches", icon: CalendarClock, required: true, why: "Open/Close days.", tip: "Uncheck days you're closed." },
      { name: "Time Slots", icon: Clock, required: true, why: "Operating window.", tip: "24h format (e.g. 17:00 - 23:00)." },
    ]
  },
  {
    id: 'docs',
    title: "Step 5: The Papers",
    subtitle: "Make it official.",
    icon: FileCheck,
    theme: "from-slate-50 to-white",
    cardBg: "bg-white",
    accent: "text-slate-600",
    mascotText: "Boring but essential. I need to see your license and bank details to pay you.",
    inputs: [
      { name: "License", icon: FileCheck, required: true, why: "Council registration.", tip: "Clear photo/scan." },
      { name: "Hygiene", icon: ShieldCheck, required: true, why: "FSA Rating.", tip: "Food safety proof." },
      { name: "Bank Info", icon: CreditCard, required: true, why: "Where we pay you.", tip: "UK Sort Code & Acc No." },
    ]
  },
  {
    id: 'approval',
    title: "Phase 2: The Wait",
    subtitle: "Cooking in progress.",
    icon: HourglassIcon,
    theme: "from-gray-100 to-gray-50",
    cardBg: "bg-gray-50",
    accent: "text-gray-600",
    mascotText: "Fingers crossed! Our team is reviewing your application. It usually takes 24 hours.",
    isSpecial: true,
    content: (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-2">What happens now?</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex gap-2 items-center"><span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"/> Account is Locked</li>
                    <li className="flex gap-2 items-center"><span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"/> Admin Reviews Docs</li>
                    <li className="flex gap-2 items-center"><span className="w-2 h-2 bg-green-400 rounded-full"/> Approval Email Sent</li>
                </ul>
            </div>
            <p className="text-xs text-center text-gray-400">Need it faster? Email admin@ordernow.com</p>
        </div>
    )
  },
  {
    id: 'stripe',
    title: "Phase 3: Get Paid",
    subtitle: "Cha-ching!",
    icon: CreditCard,
    theme: "from-indigo-50 to-white",
    cardBg: "bg-white",
    accent: "text-indigo-600",
    mascotText: "You're approved! Now, connect your Stripe account in settings so we can send you money!",
    isSpecial: true,
    content: (
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-200" />
            <h4 className="font-bold text-indigo-900 mb-4">Activation Checklist</h4>
            <div className="flex justify-center gap-4 mb-6">
                <StepCircle num="1" text="Login" />
                <div className="w-8 h-0.5 bg-indigo-200 self-center" />
                <StepCircle num="2" text="Settings" />
                <div className="w-8 h-0.5 bg-indigo-200 self-center" />
                <StepCircle num="3" text="Stripe" />
            </div>
            <div className="inline-block px-4 py-2 bg-white rounded-lg shadow-sm border border-indigo-100 text-sm font-medium text-indigo-700">
                Action: Settings &gt; Configuration
            </div>
        </div>
    )
  }
];

// ==========================================
// 5. MAIN PAGE COMPONENT
// ==========================================
export default function OnboardingGuide() {
    const [activeStep, setActiveStep] = useState(0);
    const [direction, setDirection] = useState(0);
    
    // Auto-scroll to top
    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [activeStep]);

    const nextStep = () => { if (activeStep < CHAPTERS.length - 1) { setDirection(1); setActiveStep(prev => prev + 1); }};
    const prevStep = () => { if (activeStep > 0) { setDirection(-1); setActiveStep(prev => prev - 1); }};

    const chapter = CHAPTERS[activeStep];
    const Icon = chapter.icon;

    // 3D Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-0.5, 0.5], ["3deg", "-3deg"]);
    const rotateY = useTransform(x, [-0.5, 0.5], ["-3deg", "3deg"]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br ${chapter.theme} font-sans text-slate-800 transition-colors duration-700 overflow-hidden relative flex flex-col`}>
            
            <FloatingFood />

            {/* HEADER */}
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center">
                <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                            <ChefHat size={18} />
                        </div>
                        <span className="text-lg font-extrabold tracking-tight text-slate-900">
                            Order<span className="text-orange-500">Now</span> Guide
                        </span>
                    </Link>
                    <Link to="/auth/register" className="text-sm font-bold text-slate-600 hover:text-orange-600 transition-colors">
                        Skip to Registration →
                    </Link>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 pt-28 pb-12 px-4 flex flex-col items-center relative z-10 w-full max-w-6xl mx-auto">
                
                {/* PROGRESS STEPS */}
                <div className="w-full max-w-lg mb-8 flex gap-1.5">
                    {CHAPTERS.map((_, idx) => (
                        <div key={idx} 
                             onClick={() => setActiveStep(idx)}
                             className={clsx("h-1.5 flex-1 rounded-full transition-all duration-300 cursor-pointer", 
                                idx === activeStep ? "bg-orange-500 scale-y-110" : idx < activeStep ? "bg-orange-200" : "bg-gray-200"
                             )} 
                        />
                    ))}
                </div>

                <div className="flex flex-col lg:flex-row items-center justify-between w-full gap-8 lg:gap-16">
                    
                    {/* LEFT: MASCOT & DIALOGUE (Sticky) */}
                    <div className="lg:w-5/12 flex flex-col items-center justify-center text-center lg:sticky lg:top-32">
                        <motion.div 
                            key={activeStep}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", bounce: 0.4 }}
                            className="mb-6 filter drop-shadow-2xl"
                        >
                            <ChefMascot step={activeStep} />
                        </motion.div>
                        
                        {/* Speech Bubble */}
                        <motion.div 
                            key={`text-${activeStep}`}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 relative max-w-xs mx-auto"
                        >
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rotate-45 border-t border-l border-gray-100" />
                            <p className="text-lg font-medium text-slate-700 leading-snug">"{chapter.mascotText}"</p>
                        </motion.div>
                    </div>

                    {/* RIGHT: CONTENT CARD */}
                    <div className="lg:w-7/12 w-full perspective-1000">
                        <motion.div
                            className="w-full"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => { x.set(0); y.set(0); }}
                            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                        >
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div 
                                    key={activeStep}
                                    custom={direction}
                                    initial={{ opacity: 0, x: direction * 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: direction * -50 }}
                                    transition={{ duration: 0.4, ease: "circOut" }}
                                    className={clsx("rounded-[32px] p-8 md:p-10 shadow-2xl border-4 border-white/60 backdrop-blur-sm", chapter.cardBg)}
                                >
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
                                        <div>
                                            <h2 className={clsx("text-xs font-bold uppercase tracking-widest mb-2 opacity-80", chapter.accent)}>
                                                {chapter.isIntro ? "Start Here" : `Step ${activeStep} of ${CHAPTERS.length - 1}`}
                                            </h2>
                                            <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">{chapter.title}</h1>
                                            <p className="text-lg text-slate-500 font-medium">{chapter.subtitle}</p>
                                        </div>
                                        <div className={clsx("p-4 rounded-2xl bg-slate-50 shadow-inner", chapter.accent)}>
                                            <Icon size={32} />
                                        </div>
                                    </div>

                                    {/* Inputs Grid */}
                                    {chapter.inputs && (
                                        <div className="grid grid-cols-1 gap-3">
                                            {chapter.inputs.map((input, i) => (
                                                <motion.div 
                                                    key={i}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all group"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors shadow-sm shrink-0">
                                                        <input.icon size={18} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                            {input.name}
                                                            {input.required && <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Required"/>}
                                                        </h4>
                                                        <p className="text-sm text-slate-500 leading-tight mb-1">{input.why}</p>
                                                        <p className="text-xs text-orange-600 font-medium bg-orange-50 inline-block px-2 py-0.5 rounded">
                                                            Tip: {input.tip}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Special Content */}
                                    {chapter.isSpecial && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                            {chapter.content}
                                        </motion.div>
                                    )}

                                    {/* CTA Buttons */}
                                    <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-100">
                                        {!chapter.isIntro ? (
                                            <>
                                                <button onClick={prevStep} className="px-5 py-2.5 rounded-full text-slate-500 font-bold hover:bg-slate-100 transition-colors flex items-center gap-2 text-sm">
                                                    <ArrowLeft size={16} /> Back
                                                </button>
                                                {activeStep === CHAPTERS.length - 1 ? (
                                                    <Link to="/auth/register" className="px-8 py-3 rounded-full bg-slate-900 text-white font-bold hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                                                        Finish Guide <CheckCircle2 size={18} />
                                                    </Link>
                                                ) : (
                                                    <button onClick={nextStep} className="px-8 py-3 rounded-full bg-orange-600 text-white font-bold hover:bg-orange-700 hover:shadow-lg transition-all flex items-center gap-2">
                                                        Next Step <ArrowRight size={18} />
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <button onClick={nextStep} className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 hover:shadow-xl transition-all flex items-center justify-center gap-2">
                                                Start the Tour <ArrowRight />
                                            </button>
                                        )}
                                    </div>

                                </motion.div>
                            </AnimatePresence>
                        </motion.div>
                    </div>

                </div>
            </main>
        </div>
    );
}