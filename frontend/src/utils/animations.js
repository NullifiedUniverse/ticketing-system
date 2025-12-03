// Standardized Animation Variants for Null's Board

// Easing curves
export const EASING = {
    gentle: [0.4, 0, 0.2, 1], // Good for standard UI transitions
    bouncy: [0.34, 1.56, 0.64, 1], // Good for small "pop" effects
    spring: { type: "spring", stiffness: 300, damping: 30 } // Standard spring physics
};

// Container Stagger (for lists)
export const containerStagger = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    },
    exit: { opacity: 0 }
};

// Item Entry (Fade Up)
export const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { ease: EASING.gentle, duration: 0.4 }
    },
    exit: { 
        opacity: 0, 
        y: -10, 
        transition: { duration: 0.2 } 
    }
};

// Item Entry (Fade In)
export const fadeIn = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1, 
        transition: { ease: EASING.gentle, duration: 0.3 }
    },
    exit: { opacity: 0 }
};

// Button Micro-interactions
export const buttonClick = {
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.96, transition: { duration: 0.1 } }
};

// Card Hover Effect (Lift)
export const cardHover = {
    rest: { y: 0, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" },
    hover: { 
        y: -4, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: { ease: EASING.gentle, duration: 0.3 }
    }
};

// Modal Transitions
export const modalBackdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
};

export const modalContent = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
        opacity: 1, 
        scale: 1, 
        y: 0,
        transition: EASING.spring 
    },
    exit: { 
        opacity: 0, 
        scale: 0.95, 
        y: 20, 
        transition: { duration: 0.2 } 
    }
};

// Sidebar Drawer
export const sidebarDrawer = {
    closed: { x: "-100%", opacity: 0 },
    open: { 
        x: 0, 
        opacity: 1,
        transition: { ease: EASING.gentle, duration: 0.4 }
    }
};
