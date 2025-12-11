
import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

const themes = {
    pink: { 
        border: "border-pink-500/10 hover:border-pink-500/40", 
        glow: "bg-pink-500/10", 
        text: "text-pink-400",
        bar: "from-pink-500 to-rose-500" 
    },
    blue: { 
        border: "border-cyan-500/10 hover:border-cyan-500/40", 
        glow: "bg-cyan-500/10", 
        text: "text-cyan-400",
        bar: "from-cyan-500 to-blue-500" 
    },
    green: { 
        border: "border-emerald-500/10 hover:border-emerald-500/40", 
        glow: "bg-emerald-500/10", 
        text: "text-emerald-400",
        bar: "from-emerald-500 to-teal-500" 
    },
    yellow: { 
        border: "border-amber-500/10 hover:border-amber-500/40", 
        glow: "bg-amber-500/10", 
        text: "text-amber-400",
        bar: "from-amber-500 to-orange-500" 
    }
};

const StatsCard = ({ title, value, total, showProgress, colorTheme = 'blue' }) => {
    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
    const theme = themes[colorTheme] || themes.blue;

    // 3D Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXVal = e.clientX - rect.left;
        const mouseYVal = e.clientY - rect.top;
        const xPct = mouseXVal / width - 0.5;
        const yPct = mouseYVal / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div 
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`glass-panel p-6 relative overflow-hidden group transition-colors duration-300 rounded-3xl border ${theme.border} backdrop-blur-xl bg-slate-900/40 perspective-1000`}
        >
            {/* Animated Glow Blob */}
            <div 
                className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl transition-all duration-700 opacity-20 group-hover:opacity-50 group-hover:scale-110 ${theme.glow}`}
                style={{ transform: "translateZ(20px)" }}
            ></div>
            
            <div style={{ transform: "translateZ(30px)" }}>
                <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-3 relative z-10 ${theme.text} opacity-90`}>{title}</h3>
                
                <div className="flex items-end gap-2 relative z-10">
                    <span className="text-5xl font-black text-white drop-shadow-lg tracking-tighter">
                        <AnimatedCounter value={value} />
                    </span>
                    {total !== undefined && (
                        <span className="text-slate-500 text-sm mb-1.5 font-bold">/ {total}</span>
                    )}
                </div>

                {showProgress && (
                    <div className="mt-5 h-2 w-full bg-white/5 rounded-full overflow-hidden relative z-10">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className={`h-full bg-gradient-to-r shadow-[0_0_15px_currentColor] ${theme.bar}`}
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default StatsCard;
