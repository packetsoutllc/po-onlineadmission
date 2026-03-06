import React, { useState, useEffect } from 'react';

/** Blue 3D arrow icon: flips and returns to normal after 1s, cycle repeats every 1 min. */
const PacketsOutArrowIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5 text-sky-500' }) => {
    const [flipped, setFlipped] = useState(false);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        const runCycle = () => {
            setFlipped(true);
            timeoutId = setTimeout(() => setFlipped(false), 500); // return to normal (0.5s flip + 0.5s return ≈ 1s)
        };
        // First flip after 2s so user sees it without waiting 1 min; then every 60s
        const startId = setTimeout(runCycle, 2000);
        const intervalId = setInterval(runCycle, 60 * 1000);
        return () => {
            clearTimeout(startId);
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, []);

    return (
        <span className="inline-block [perspective:200px]" aria-hidden>
            <span
                className="inline-block transition-transform duration-500 ease-in-out"
                style={{
                    transform: `rotateY(${flipped ? 180 : 0}deg)`,
                    transformStyle: 'preserve-3d',
                }}
            >
            <svg
                className={className}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M3 11L10.5 4H21L13.5 11H3Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.5 11L21 4V14L13.5 21V11Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 11L13.5 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            </span>
        </span>
    );
};

export default PacketsOutArrowIcon;
