import React, { useEffect, useState } from 'react';

const Bonfire = ({ roomName, userCount, level, onClick, isHovered, size = 'normal' }) => {
    // Determine fire intensity: 0-10
    // Use explicit 'level' if provided (Game Mode), otherwise fallback to userCount (Lobby Mode)
    const intensity = level !== undefined ? Math.min(level, 10) : Math.min(userCount || 0, 10);
    const isExtinguished = intensity === 0;

    // Scale size: Base + dramatic growth
    const baseScale = size === 'large' ? 2.0 : 0.8;
    const growthFactor = size === 'large' ? 0.2 : 0.05;
    const scale = baseScale + (Math.max(0, intensity - 1) * growthFactor); // Don't shrink below base for 0 users

    // Fire warmth shifts from yellow/orange to raging red/white at high intensity
    const fireColor = intensity > 5 ? '#ff4d00' : '#ff9a00';

    return (
        <div
            onClick={onClick}
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                transform: isHovered ? 'scale(1.1)' : 'scale(1.0)',
                margin: size === 'large' ? '0' : '20px',
                pointerEvents: onClick ? 'auto' : 'none'
            }}
        >
            {/* The Fire Animation Container */}
            <div style={{
                position: 'relative',
                width: '100px',
                height: '100px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                transform: `scale(${scale})`,
                transition: 'transform 1s ease-in-out'
            }}>
                {/* Wood Logs - Always visible (Cold/Dark if extinguished) */}
                <div style={{
                    position: 'absolute', bottom: '5px', width: '70px', height: '12px',
                    background: isExtinguished ? '#2a1e1a' : '#4a332a', // Darker when cold
                    borderRadius: '5px', transform: 'rotate(15deg)',
                    boxShadow: 'inset 0 0 5px rgba(0,0,0,0.8)',
                    transition: 'background 1s'
                }}></div>
                <div style={{
                    position: 'absolute', bottom: '5px', width: '70px', height: '12px',
                    background: isExtinguished ? '#1e1310' : '#3e2723', // Darker when cold
                    borderRadius: '5px', transform: 'rotate(-15deg)',
                    boxShadow: 'inset 0 0 5px rgba(0,0,0,0.8)',
                    transition: 'background 1s'
                }}></div>

                {/* Flames - Only if NOT extinguished */}
                {!isExtinguished && (
                    <div className="fire-container" style={{
                        opacity: 0.8 + (intensity * 0.02)
                    }}>
                        <div className="flame red"></div>
                        <div className="flame orange"></div>
                        <div className="flame gold"></div>
                        <div className="flame white"></div>
                    </div>
                )}

                {/* Embers / Particles for high intensity */}
                {!isExtinguished && intensity > 3 && (
                    <div className="ember" style={{ left: '20%', animationDelay: '0s' }}></div>
                )}
                {!isExtinguished && intensity > 6 && (
                    <div className="ember" style={{ left: '80%', animationDelay: '1.2s' }}></div>
                )}
            </div>

            {/* Room Label (Only show if roomName exists) */}
            {roomName && (
                <div style={{
                    marginTop: '10px',
                    background: isHovered ? 'rgba(255, 100, 0, 0.8)' : 'rgba(0,0,0,0.6)',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    textShadow: '0 1px 2px black',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.3s'
                }}>
                    {roomName} ({userCount})
                </div>
            )}



            <style>{`
                .fire-container {
                    position: absolute;
                    bottom: 12px;
                    width: 60px;
                    height: 60px;
                    filter: drop-shadow(0 0 ${intensity * 2}px ${fireColor});
                }
                .flame {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: ${20 + (intensity * 2)}px;
                    height: ${20 + (intensity * 2)}px;
                    border-radius: 50% 50% 20% 20%;
                    background: radial-gradient(white, gold, orange, red);
                    opacity: 0.8;
                    animation: burn 1s infinite alternate ease-in-out;
                }
                .flame.red {
                    width: ${30 + (intensity * 3)}px; 
                    height: ${50 + (intensity * 5)}px; 
                    background: rgba(255, 69, 0, 0.7); 
                    animation-duration: 1.2s;
                }
                .flame.orange { 
                    width: ${25 + (intensity * 2)}px; 
                    height: ${40 + (intensity * 4)}px; 
                    background: orange; 
                    animation-duration: 1.5s;
                    bottom: 5px;
                }
                .flame.gold { 
                    width: ${20 + (intensity * 1.5)}px; 
                    height: ${30 + (intensity * 3)}px; 
                    background: gold; 
                    animation-duration: 0.8s;
                    bottom: 10px;
                }
                .flame.white { 
                    width: ${10 + (intensity)}px; 
                    height: ${20 + (intensity * 2)}px; 
                    background: white; 
                    animation-duration: 0.6s;
                    bottom: 15px;
                    box-shadow: 0 0 10px white;
                }
                
                .ember {
                    position: absolute;
                    bottom: 20px;
                    width: 4px; height: 4px;
                    background: #ffcc00;
                    border-radius: 50%;
                    animation: flyUp 2s infinite linear;
                    opacity: 0;
                }

                @keyframes burn {
                    0% { transform: translateX(-50%) scale(1) rotate(-2deg); border-radius: 50% 50% 20% 20%; }
                    100% { transform: translateX(-50%) scale(1.1) rotate(2deg); border-radius: 50% 50% 50% 50%; height: 110%; }
                }

                @keyframes flyUp {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    100% { transform: translateY(-100px) scale(0); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default Bonfire;
