import React, { useEffect, useState } from 'react';

const Bonfire = ({ roomName, userCount, level, onClick, isHovered, size = 'normal' }) => {
    // Determine fire intensity: 0-10
    // Use explicit 'level' if provided (Game Mode), otherwise fallback to userCount (Lobby Mode)
    // Level 10 maps to Intensity 10 (max visual)
    const intensity = level !== undefined ? Math.min(level, 10) : Math.min(userCount || 0, 10);
    const isExtinguished = intensity === 0;

    // Scale size: Base + dramatic growth
    const baseScale = size === 'large' ? 1.2 : 0.8;
    const growthFactor = size === 'large' ? 0.1 : 0.03;
    const scale = baseScale + (Math.max(0, intensity - 1) * growthFactor); // Don't shrink below base for 0 users

    // Fire warmth shifts from yellow/orange to raging red/white at high intensity
    // Stage Logic
    let stage = 1;
    if (intensity >= 7) stage = 3;
    else if (intensity >= 4) stage = 2;
    // else stage = 1 (Levels 1-3)

    // Color Palettes
    // Stage 1: Pale / Yellow / Gentle (Lighter)
    const s1_glow = '#ffcc00';
    const s1_grad = 'radial-gradient(white, #fff7e6, #ffcc00, #ffaa00)';
    const s1_red = 'rgba(255, 140, 0, 0.6)'; // Dark Orange transparency
    const s1_orange = '#ffb300';
    const s1_gold = '#ffeb3b';

    // Stage 2: Standard Orange / Red (Current Default)
    const s2_glow = '#ff4d00';
    const s2_grad = 'radial-gradient(white, gold, orange, red)';
    const s2_red = 'rgba(255, 69, 0, 0.7)';
    const s2_orange = 'orange';
    const s2_gold = 'gold';

    // Stage 3: Intense / Dark Red / Furious (Darker)
    const s3_glow = '#ff2a00';
    const s3_grad = 'radial-gradient(white, #ffb700, #ff4500, #8b0000)'; // Ends in DarkRed
    const s3_red = 'rgba(139, 0, 0, 0.85)'; // Darker Red
    const s3_orange = '#ff4500'; // OrangeRed
    const s3_gold = '#ff8c00'; // DarkOrange

    // Active Colors
    let activeGlow = s1_glow;
    let activeGrad = s1_grad;
    let activeRed = s1_red;
    let activeOrange = s1_orange;
    let activeGold = s1_gold;

    if (stage === 2) {
        activeGlow = s2_glow;
        activeGrad = s2_grad;
        activeRed = s2_red;
        activeOrange = s2_orange;
        activeGold = s2_gold;
    } else if (stage === 3) {
        activeGlow = s3_glow;
        activeGrad = s3_grad;
        activeRed = s3_red;
        activeOrange = s3_orange;
        activeGold = s3_gold;
    }

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
                    filter: drop-shadow(0 0 ${intensity * 1.5}px ${activeGlow});
                }
                .flame {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: ${20 + (intensity * 1.5)}px;
                    height: ${20 + (intensity * 1.5)}px;
                    border-radius: 50% 50% 20% 20%;
                    background: ${activeGrad};
                    opacity: 0.8;
                    animation: burn 1s infinite alternate ease-in-out;
                }
                .flame.red {
                    width: ${30 + (intensity * 2)}px; 
                    height: ${50 + (intensity * 3.5)}px; 
                    background: ${activeRed}; 
                    animation-duration: 1.2s;
                }
                .flame.orange { 
                    width: ${25 + (intensity * 1.5)}px; 
                    height: ${40 + (intensity * 3)}px; 
                    background: ${activeOrange}; 
                    animation-duration: 1.5s;
                    bottom: 5px;
                }
                .flame.gold { 
                    width: ${20 + (intensity * 1)}px; 
                    height: ${30 + (intensity * 2)}px; 
                    background: ${activeGold}; 
                    animation-duration: 0.8s;
                    bottom: 10px;
                }
                .flame.white { 
                    width: ${10 + (intensity * 0.8)}px; 
                    height: ${20 + (intensity * 1.5)}px; 
                    background: white; 
                    animation-duration: 0.6s;
                    bottom: 15px;
                    box-shadow: 0 0 10px white;
                }
                
                .ember {
                    position: absolute;
                    bottom: 20px;
                    width: 4px; height: 4px;
                    background: ${activeGold};
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
