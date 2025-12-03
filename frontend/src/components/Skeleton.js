import React from 'react';

const Skeleton = ({ className = "", height, width }) => {
    return (
        <div 
            className={`animate-pulse bg-white/10 rounded-lg ${className}`} 
            style={{ 
                height: height, 
                width: width 
            }}
        />
    );
};

export default Skeleton;
