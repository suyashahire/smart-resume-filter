'use client';

export default function GridOverlay() {
    return (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                backgroundImage:
                    'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                opacity: 0.5,
            }}
        />
    );
}
