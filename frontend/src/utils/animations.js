// Standardized Professional Animations (Reduced Motion)

export const EASING = {
    standard: [0.4, 0.0, 0.2, 1], // Standard Ease
    smooth: [0.25, 0.1, 0.25, 1.0]
};

// Container Stagger
export const containerStagger = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03,
            delayChildren: 0.01,
            ease: "easeOut"
        }
    },
    exit: { 
        opacity: 0, 
        transition: { duration: 0.15 } 
    }
};

// Page Entry (Simple Fade)
export const pageEntry = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1, 
        transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: { 
        opacity: 0, 
        transition: { duration: 0.15 } 
    }
};

// Item Entry (Simple Fade Up)
export const fadeInUp = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.25, ease: "easeOut" }
    },
    exit: { 
        opacity: 0, 
        transition: { duration: 0.1 } 
    }
};

// Table Row Entry
export const rowEntry = fadeInUp;

// Button (Minimal feedback, rely on CSS)
export const buttonClick = {
    rest: { scale: 1 },
    hover: { scale: 1 },
    tap: { scale: 0.98, transition: { duration: 0.05 } }
};

// Card Hover (Subtle border/bg change via CSS preferred, this is minimal)
export const cardHover = {
    rest: { y: 0 },
    hover: { 
        y: -2, 
        transition: { duration: 0.2, ease: "easeOut" }
    }
};

// Standard Card Entry (Replaces BentoBounce)
export const bentoBounce = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: { opacity: 0, transition: { duration: 0.15 } }
};

// Sidebar Drawer
export const sidebarDrawer = {
    closed: { x: "-100%", opacity: 0 },
    open: { 
        x: 0, 
        opacity: 1,
        transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: { x: "-100%", opacity: 0, transition: { duration: 0.2 } }
};

// Pulse (Subtle)
export const pulseEffect = {
    animate: {
        opacity: [0.8, 1, 0.8],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
};

// Physics Spring for Layouts
export const springTransition = {
    type: "spring",
    stiffness: 400,
    damping: 30,
    mass: 1
};

export const layoutTransition = springTransition;
