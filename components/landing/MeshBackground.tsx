'use client';

import { motion } from 'framer-motion';

export default function MeshBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Orange glow */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: 600,
                    height: 600,
                    top: '-10%',
                    left: '10%',
                    background: 'radial-gradient(circle, rgba(255,138,0,0.3) 0%, transparent 70%)',
                    filter: 'blur(160px)',
                }}
                animate={{ y: [0, -40, 0], x: [0, 20, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Blue glow */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: 500,
                    height: 500,
                    top: '5%',
                    right: '5%',
                    background: 'radial-gradient(circle, rgba(79,124,255,0.25) 0%, transparent 70%)',
                    filter: 'blur(160px)',
                }}
                animate={{ y: [0, 30, 0], x: [0, -25, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Purple glow */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: 450,
                    height: 450,
                    top: '20%',
                    left: '40%',
                    background: 'radial-gradient(circle, rgba(123,97,255,0.2) 0%, transparent 70%)',
                    filter: 'blur(160px)',
                }}
                animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            />
        </div>
    );
}
