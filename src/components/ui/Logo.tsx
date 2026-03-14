import React from 'react';

interface LogoProps {
    className?: string;
    iconOnly?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "h-10", iconOnly = false }) => {
    return (
        <div className={`flex items-center space-x-3 ${className}`}>
            {/* SVG Logo Graphic - High Fidelity "Stones" Design */}
            <svg viewBox="0 0 100 100" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Top Left Stone */}
                <rect x="10" y="10" width="35" height="35" rx="12" className="fill-indigo-950" opacity="0.4" />
                {/* Top Right Stone */}
                <rect x="55" y="10" width="35" height="35" rx="12" className="fill-indigo-950" opacity="0.2" />
                {/* Bottom Left Stone */}
                <rect x="10" y="55" width="35" height="35" rx="12" className="fill-indigo-950" opacity="0.1" />
                {/* Bottom Right Stone (The Green One) */}
                <rect x="55" y="55" width="35" height="35" rx="12" className="fill-emerald-500" />
            </svg>

            {!iconOnly && (
                <div className="flex items-center font-black italic tracking-tighter uppercase text-2xl lg:text-3xl">
                    <span className="text-indigo-950">COD</span>
                    <span className="text-emerald-500">O</span>
                </div>
            )}
        </div>
    );
};

export default Logo;
