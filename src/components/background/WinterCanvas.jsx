import React, { useRef, useEffect } from 'react';

const WinterCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const particles = [];
        const particleCount = 150;
        let w, h;

        let mouseX = 0;
        let mouseY = 0;

        const resize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };

        const createParticle = () => {
            return {
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 1.5,
                vy: Math.random() * 2 + 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.3
            };
        };

        const init = () => {
            resize();
            for (let i = 0; i < particleCount; i++) {
                particles.push(createParticle());
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, w, h);

            // Draw gradient background
            const gradient = ctx.createLinearGradient(0, 0, 0, h);
            gradient.addColorStop(0, '#0f172a'); // Deep Midnight Blue
            gradient.addColorStop(1, '#1e293b'); // Dark Slate
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = 'white';

            particles.forEach((p, i) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.fill();

                // Update position
                p.x += p.vx;
                p.y += p.vy;

                // Mouse interaction (wind)
                const dx = p.x - mouseX;
                const dy = p.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    const force = (150 - dist) / 150;
                    p.vx += (dx / dist) * force * 0.5;
                    p.vy += (dy / dist) * force * 0.5;
                }

                // Friction to return to normal
                p.vx *= 0.99;

                // Wrap around
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y > h) {
                    p.y = 0;
                    p.x = Math.random() * w;
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        const handleMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        init();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -10 }} />;
};

export default WinterCanvas;
