// Standardized Animation Variants for Null's Board - Enhanced Physics

export const EASING = {
    gentle: [0.4, 0, 0.2, 1],
    bouncy: [0.34, 1.56, 0.64, 1], 
    spring: { type: "spring", stiffness: 400, damping: 25, mass: 1 }, // Snappier Spring
    smooth: [0.25, 0.1, 0.25, 1.0] 
};

// Container Stagger (Optimized for lists)
export const containerStagger = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.02,
            ease: EASING.gentle
        }
    },
    exit: { 
        opacity: 0, 
        transition: { duration: 0.2 } 
    }
};

// Page / Section Entry
export const pageEntry = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { ...EASING.spring, delay: 0.1 }
    },
    exit: { 
        opacity: 0, 
        y: -20, 
        scale: 0.98,
        transition: { duration: 0.2 } 
    }
};

// Item Entry (Fade Up)
export const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: EASING.spring
    },
    exit: { 
        opacity: 0, 
        y: -10, 
        scale: 0.95,
        transition: { duration: 0.15 } 
    }
};

// Table Row Entry (Optimized for performance)
export const rowEntry = {
    hidden: { opacity: 0, x: -15 },
    visible: { 
        opacity: 1, 
        x: 0,
        transition: { type: "spring", stiffness: 500, damping: 30 } 
    },
    exit: { 
        opacity: 0, 
        x: 15, 
        transition: { duration: 0.15 } 
    }
};

// Button Micro-interactions (Subtle & Satisfying)
export const buttonClick = {
    rest: { scale: 1 },
    hover: { 
        scale: 1.05, 
        filter: "brightness(1.1)",
        transition: { ...EASING.spring, stiffness: 400, damping: 15 } 
    },
    tap: { 
        scale: 0.95, 
        filter: "brightness(0.9)",
        transition: { duration: 0.05 } 
    }
};

// Interactive Card Hover (Lift & Glow)
export const cardHover = {
    rest: { y: 0, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" },
    hover: { 
        y: -6, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 0 15px rgba(59, 130, 246, 0.2)", // Rainbow Blue hint
        transition: { duration: 0.3, ease: EASING.smooth }
    }
};

// Bento Card Bounce (Tactile Physics)
export const bentoBounce = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
        opacity: 1, 
        scale: 1, 
        y: 0,
        transition: { ...EASING.spring, stiffness: 350, damping: 20 } 
    },
    hover: { 
        scale: 1.03,
        y: -4,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        zIndex: 10,
        transition: { type: "spring", stiffness: 400, damping: 15 }
    },
    tap: { scale: 0.97 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

// Sidebar Drawer (Smooth)
export const sidebarDrawer = {
    closed: { x: "-100%", opacity: 0 },
    open: { 
        x: 0, 
        opacity: 1,
        transition: { ...EASING.spring, damping: 25 }
    },
    exit: { x: "-100%", opacity: 0, transition: { duration: 0.2 } }
};

// Pulse Effect (for loading/waiting)
export const pulseEffect = {
    animate: {
        opacity: [0.6, 1, 0.6],
        scale: [0.98, 1.02, 0.98],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
};