// Standardized Animation Variants for Null's Board - Enhanced

export const EASING = {
    gentle: [0.4, 0, 0.2, 1],
    bouncy: [0.34, 1.56, 0.64, 1], 
    spring: { type: "spring", stiffness: 300, damping: 30 },
    smooth: [0.25, 0.1, 0.25, 1.0] // New super-smooth easing
};

// Container Stagger (Optimized for lists)
export const containerStagger = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.06,
            delayChildren: 0.05,
            ease: EASING.gentle
        }
    },
    exit: { opacity: 0 }
};

// Page / Section Entry
export const pageEntry = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.5, ease: EASING.smooth }
    },
    exit: { opacity: 0, y: -15, transition: { duration: 0.3 } }
};

// Item Entry (Fade Up)
export const fadeInUp = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { ease: EASING.gentle, duration: 0.4 }
    },
    exit: { 
        opacity: 0, 
        y: -10, 
        transition: { duration: 0.2, ease: "easeIn" } 
    }
};

// Table Row Entry (Optimized for performance)
export const rowEntry = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
        opacity: 1, 
        x: 0,
        transition: { type: "spring", stiffness: 500, damping: 40 } 
    },
    exit: { opacity: 0, x: 10, transition: { duration: 0.2 } }
};

// Button Micro-interactions (Subtle & Satisfying)
export const buttonClick = {
    rest: { scale: 1 },
    hover: { 
        scale: 1.04, 
        filter: "brightness(1.1)",
        transition: { duration: 0.2, ease: EASING.bouncy } 
    },
    tap: { 
        scale: 0.96, 
        filter: "brightness(0.9)",
        transition: { duration: 0.1 } 
    }
};

// Interactive Card Hover (Lift & Glow)
export const cardHover = {
    rest: { y: 0, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" },
    hover: { 
        y: -6, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 0 15px rgba(139, 92, 246, 0.15)", // Purple hint
        transition: { duration: 0.3, ease: EASING.smooth }
    }
};

// Sidebar Drawer (Smooth)
export const sidebarDrawer = {
    closed: { x: "-100%", opacity: 0 },
    open: { 
        x: 0, 
        opacity: 1,
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
    }
};

// Pulse Effect (for loading/waiting)
export const pulseEffect = {
    animate: {
        opacity: [0.6, 1, 0.6],
        scale: [0.98, 1.02, 0.98],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
};