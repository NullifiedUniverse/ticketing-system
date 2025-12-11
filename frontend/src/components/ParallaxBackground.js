import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const ParallaxBackground = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 150 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            const x = clientX / innerWidth - 0.5;
            const y = clientY / innerHeight - 0.5;
            mouseX.set(x);
            mouseY.set(y);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    // Layer 1: Deep Background (Slow movement)
    const x1 = useTransform(springX, [-0.5, 0.5], [20, -20]);
    const y1 = useTransform(springY, [-0.5, 0.5], [20, -20]);

    // Layer 2: Mid Background (Medium movement)
    const x2 = useTransform(springX, [-0.5, 0.5], [-40, 40]);
    const y2 = useTransform(springY, [-0.5, 0.5], [-40, 40]);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            {/* Ambient Base Layer */}
            <div className="absolute inset-0 bg-slate-950" />

            {/* Moving Orbs */}
            <motion.div 
                style={{ x: x1, y: y1 }}
                className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-violet-600/10 rounded-full blur-[120px]" 
            />
            <motion.div 
                style={{ x: x2, y: y2 }}
                className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[150px]" 
            />
            
            {/* Subtle Noise Texture for Texture/Grit */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
        </div>
    );
};

export default ParallaxBackground;
