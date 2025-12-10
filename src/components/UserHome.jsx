
import React, { useState, useEffect, useRef } from 'react';
import WinterCanvas from './background/WinterCanvas';
import VoiceRoom from './VoiceRoom';
import CampfireField from './CampfireField';
import ChatOverlay from './ChatOverlay';
import ErrorBoundary from './ErrorBoundary';
import Bonfire from './Bonfire';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { API_BASE_URL, WS_BASE_URL } from '../config';

const UserHome = ({ user, onLogout }) => {
    const [currentRoom, setCurrentRoom] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [chatBubbles, setChatBubbles] = useState({});
    const [isMuted, setIsMuted] = useState(false);

    const [fireLevel, setFireLevel] = useState(0); // 0-10
    const [burnTimer, setBurnTimer] = useState(30); // Seconds until level drop

    // Refs for accessing state in closures without triggering re-renders
    const stompClientRef = useRef(null);
    const fireLevelRef = useRef(fireLevel);
    const audioRef = useRef(null);
    const woodAudioRef = useRef(null);

    // Update Ref when state changes
    useEffect(() => {
        fireLevelRef.current = fireLevel;
    }, [fireLevel]);

    // WebSocket & Participant Logic (Lifted State)
    useEffect(() => {
        if (!currentRoom) {
            setParticipants([]);
            setFireLevel(0); // Reset fire when leaving
            return;
        }

        const socket = new SockJS(WS_BASE_URL);
        const stompClient = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                stompClientRef.current = stompClient; // Store client in ref

                // Subscribe to room signaling channel (Participants & Game State)
                stompClient.subscribe(`/topic/room/${currentRoom}`, (message) => {
                    const signal = JSON.parse(message.body);

                    if (signal.type === 'join' || signal.type === 'leave') {
                        if (signal.users) setParticipants(signal.users);
                        // If someone joins and I have fire, share the state
                        if (signal.type === 'join' && fireLevelRef.current > 0) {
                            stompClient.publish({
                                destination: `/app/signal/${currentRoom}`,
                                body: JSON.stringify({
                                    type: 'fire_update',
                                    level: fireLevelRef.current,
                                    sender: user.username
                                })
                            });
                        }
                    } else if (signal.type === 'fire_update') {
                        // Sync fire state from others
                        if (signal.sender !== user.username) {
                            setFireLevel(signal.level);
                            setBurnTimer(30); // Sync timer reset
                        }
                    } else if (signal.type === 'request_fire_sync') {
                        // If someone requests sync and we have fire, broadcast our state
                        if (fireLevelRef.current > 0) {
                            stompClient.publish({
                                destination: `/app/signal/${currentRoom}`,
                                body: JSON.stringify({
                                    type: 'fire_update',
                                    level: fireLevelRef.current,
                                    sender: user.username
                                })
                            });
                        }
                    }
                });

                // Subscribe to Chat channel (Bubbles)
                stompClient.subscribe(`/topic/room/${currentRoom}/chat`, (message) => {
                    const msg = JSON.parse(message.body);
                    const msgId = Date.now() + Math.random();

                    setChatBubbles(prev => {
                        const userBubbles = prev[msg.sender] || [];
                        const updated = [...userBubbles, { id: msgId, text: msg.content }];
                        if (updated.length > 3) updated.shift();
                        return { ...prev, [msg.sender]: updated };
                    });

                    // Remove after 5 seconds
                    setTimeout(() => {
                        setChatBubbles(prev => {
                            const userBubbles = prev[msg.sender];
                            if (!userBubbles) return prev;
                            return {
                                ...prev,
                                [msg.sender]: userBubbles.filter(b => b.id !== msgId)
                            };
                        });
                    }, 5000);
                });

                // Send JOIN signal
                stompClient.publish({
                    destination: `/app/join/${currentRoom}`,
                    body: JSON.stringify({
                        type: 'join',
                        sender: user.username
                    })
                });

                // Request fire state from others for late joiners
                stompClient.publish({
                    destination: `/app/signal/${currentRoom}`,
                    body: JSON.stringify({
                        type: 'request_fire_sync',
                        sender: user.username
                    })
                });
            },
            onDisconnect: () => {
                console.log("Disconnected from room");
                stompClientRef.current = null;
            }
        });

        stompClient.activate();

        // Initial fetch as fallback
        fetch(`${API_BASE_URL}/api/rooms/${currentRoom}/users`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setParticipants(data);
            })
            .catch(e => console.error(e));

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
        };
    }, [currentRoom, user.username]); // Removed fireLevel to prevent loop

    // Audio Initialization
    useEffect(() => {
        audioRef.current = new Audio("/bonfire_mood.mp3");
        audioRef.current.loop = true;
        audioRef.current.volume = 0.4;

        woodAudioRef.current = new Audio("/fire_burst.mp3");
        woodAudioRef.current.volume = 0.6;

        return () => {
            audioRef.current.pause();
            woodAudioRef.current.pause();
        };
    }, []);

    // Ambient Audio Control (Based on Room & Fire Level)
    useEffect(() => {
        if (currentRoom && !isMuted && fireLevel > 0) {
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        } else {
            audioRef.current.pause();
        }
    }, [currentRoom, isMuted, fireLevel]);


    // Bonfire Decay Timer
    useEffect(() => {
        if (!currentRoom || fireLevel === 0) return;

        const timer = setInterval(() => {
            setBurnTimer(prev => {
                if (prev <= 1) {
                    // Time up, drop level
                    setFireLevel(lvl => Math.max(0, lvl - 1));
                    return 30; // Reset timer
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentRoom, fireLevel]);


    // Game Mechanics
    const addFirewood = () => {
        if (fireLevel === 0) return; // Must be ignited first

        setFireLevel(prev => Math.min(10, prev + 1));
        setBurnTimer(30); // Reset decay

        if (stompClientRef.current && stompClientRef.current.connected) {
            // Since setFireLevel is async, we can't trust 'fireLevel' here immediately.
            // Use the ref to get the current state for broadcast.
            const current = fireLevelRef.current;
            const next = Math.min(10, current + 1);
            stompClientRef.current.publish({
                destination: `/app/signal/${currentRoom}`,
                body: JSON.stringify({ type: 'fire_update', level: next, sender: user.username })
            });
        }

        // Play sound
        if (woodAudioRef.current) {
            woodAudioRef.current.currentTime = 0;
            woodAudioRef.current.play().catch(e => console.log("SFX failed", e));
        }
    };

    const igniteFire = () => {
        setFireLevel(1);
        setBurnTimer(30);

        if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.publish({
                destination: `/app/signal/${currentRoom}`,
                body: JSON.stringify({ type: 'fire_update', level: 1, sender: user.username })
            });
        }

        if (woodAudioRef.current) {
            woodAudioRef.current.currentTime = 0;
            woodAudioRef.current.play();
        }
    };

    // Drag and Drop Handlers
    const handleDragStart = (e, type) => {
        e.dataTransfer.setData("type", type);
        e.dataTransfer.effectAllowed = "copy";
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData("type");

        if (type === "fireSource" && fireLevel === 0) {
            igniteFire();
        } else if (type === "firewood" && fireLevel > 0) {
            addFirewood();
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Allow dropping
        e.dataTransfer.dropEffect = "copy";
    };


    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#050505' }}>

            {/* Global Background (Snowy Sky) - Always Visible */}
            <WinterCanvas />

            {/* Logout Button (Floating) */}
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 100 }}>
                <button onClick={onLogout} style={{
                    background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid #555',
                    padding: '8px 16px', borderRadius: '4px', cursor: 'pointer'
                }}>
                    Leave the Cold (Logout)
                </button>
            </div>

            {/* Main Content Layer */}
            <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>
                {!currentRoom ? (
                    // LOBBY VIEW: The Field of Bonfires
                    <>
                        <ErrorBoundary>
                            <CampfireField
                                user={user}
                                onJoinRoom={(roomId) => setCurrentRoom(roomId)}
                            />
                        </ErrorBoundary>
                    </>
                ) : (
                    // ROOM VIEW: Enhanced Night Atmosphere
                    <div
                        style={{
                            position: 'relative',
                            width: '100%', height: '100%',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            animation: 'fadeIn 2s ease',
                        }}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        {/* 2. Vignette & Atmosphere Overlay */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.3) 70%, rgba(5, 10, 20, 0.8) 100%)',
                            zIndex: 2, pointerEvents: 'none'
                        }}></div>

                        {/* 3. Fire Light & Glow (Atmospheric) - Only visible if fire is burning */}
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            width: '900px', height: '900px',
                            background: `radial-gradient(circle, rgba(255, 120, 0, ${fireLevel > 0 ? 0.15 + (fireLevel * 0.02) : 0}) 0%, rgba(200, 50, 0, ${fireLevel > 0 ? 0.05 : 0}) 30%, transparent 60%)`,
                            mixBlendMode: 'screen',
                            pointerEvents: 'none',
                            zIndex: 3,
                            transition: 'background 1s'
                        }}></div>

                        <ErrorBoundary>
                            {/* Controls Container (Top Left) */}
                            <div style={{
                                position: 'absolute', top: '20px', left: '20px', zIndex: 50,
                                display: 'flex', flexDirection: 'column', gap: '10px'
                            }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {/* Leave Room Button */}
                                    <button
                                        onClick={() => setCurrentRoom(null)}
                                        style={{
                                            background: 'rgba(0,0,0,0.3)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)',
                                            padding: '10px', borderRadius: '8px', width: '45px', height: '45px',
                                            fontSize: '1.2rem', cursor: 'pointer',
                                            backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center'
                                        }}
                                        title="Back to Lobby"
                                    >
                                        ❄️
                                    </button>

                                    {/* Audio Toggle Button */}
                                    <button
                                        onClick={() => setIsMuted(!isMuted)}
                                        style={{
                                            background: 'rgba(0,0,0,0.3)', color: isMuted ? '#ef5350' : '#ffa726',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            padding: '10px 15px', borderRadius: '8px',
                                            fontSize: '1rem', cursor: 'pointer',
                                            backdropFilter: 'blur(2px)'
                                        }}
                                        title={isMuted ? "Unmute Fire" : "Mute Fire"}
                                    >
                                        {isMuted ? "🔇" : "🔥"}
                                    </button>
                                </div>

                                {/* GAME CONTROLS */}
                                {/* Draggable Wood Pile (Replaces Button) */}
                                <div
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, "firewood")}
                                    style={{
                                        background: fireLevel > 0 ? 'rgba(139, 69, 19, 0.6)' : 'rgba(50,50,50,0.5)',
                                        color: fireLevel > 0 ? '#deb887' : '#555',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        padding: '10px', borderRadius: '50%', width: '60px', height: '60px',
                                        fontSize: '2rem', cursor: fireLevel > 0 ? 'grab' : 'not-allowed',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                                        userSelect: 'none'
                                    }}
                                    title={fireLevel > 0 ? "Drag Wood to Bonfire" : "Fire is out!"}
                                >
                                    🪵
                                </div>

                                {/* Ignite Draggable (Only if Fire is Dead) */}
                                {fireLevel === 0 && (
                                    <div
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, "fireSource")}
                                        style={{
                                            background: 'linear-gradient(135deg, #ff4d00, #ff9a00)',
                                            color: 'white',
                                            padding: '10px', borderRadius: '50%',
                                            width: '60px', height: '60px',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                                            fontSize: '2rem', cursor: 'grab',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.3), 0 0 10px rgba(255, 77, 0, 0.5)',
                                            userSelect: 'none'
                                        }}
                                        title="Drag to Bonfire to Ignite!"
                                    >
                                        🔥
                                    </div>
                                )}

                                {/* Status Display Removed from here */}
                            </div>

                            {/* Room Title */}
                            <h2 style={{
                                position: 'absolute', top: '15%',
                                color: 'rgba(255, 200, 150, 0.9)', fontSize: '2rem',
                                textShadow: '0 2px 10px rgba(0,0,0,0.9)',
                                fontFamily: 'serif', letterSpacing: '4px',
                                zIndex: 10, pointerEvents: 'none'
                            }}>
                                {currentRoom}
                            </h2>

                            <div
                                style={{ zIndex: 10, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                            >
                                <Bonfire
                                    level={fireLevel}
                                    userCount={participants.length}
                                    size="large"
                                />

                                {/* Status Display Moved Here */}
                                {fireLevel > 0 && (
                                    <div style={{
                                        marginTop: '10px',
                                        color: '#ddd', fontSize: '14px', background: 'rgba(0,0,0,0.5)',
                                        padding: '5px 12px', borderRadius: '12px', textAlign: 'center',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        <div style={{ fontWeight: 'bold', color: '#ffa726' }}>Lv.{fireLevel}</div>
                                        <div style={{ fontSize: '12px', color: '#ccc' }}>-{burnTimer}s</div>
                                    </div>
                                )}
                            </div>

                            {/* Voice Controls (Visible for Debugging) */}
                            <div style={{ position: 'absolute', top: '80px', right: '20px', zIndex: 50, background: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '8px' }}>
                                <VoiceRoom roomId={currentRoom} userId={user.username} />
                            </div>

                            {/* Participants Circle */}
                            <RoomParticipantsCircle
                                participants={participants}
                                chatBubbles={chatBubbles}
                                currentUser={user.username}
                            />

                            {/* Text Chat Overlay */}
                            <ChatOverlay roomId={currentRoom} user={user} />
                        </ErrorBoundary>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 0 10px #ff4d00; }
                    50% { transform: scale(1.1); box-shadow: 0 0 20px #ff9a00; }
                    100% { transform: scale(1); box-shadow: 0 0 10px #ff4d00; }
                }
            `}</style>
        </div>
    );
};

// Stateless Sub-component for Circular Layout
// Stateless Sub-component for Circular Layout
const RoomParticipantsCircle = ({ participants, chatBubbles, currentUser }) => {
    const radius = 250; // Distance from fire
    const total = participants.length;

    return (
        <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: '0', height: '0', zIndex: 40 // High z-index to ensure visibility
        }}>
            {participants.map((username, index) => {
                const angle = (index / total) * 2 * Math.PI;
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                const yPersp = y * 0.7; // Perspective flattening

                // Restore missing bubbles definition
                const bubbles = chatBubbles[username] || [];

                // Simple hash for color variation (optional, but requested grey)
                const isMe = username === currentUser;

                // Color Logic: Grey/Silver Theme
                // Me: Bright Silver/White-ish (#e5e7eb)
                // Others: Darker Grey (#9ca3af)
                const baseColor = isMe ? '#e5e7eb' : '#9ca3af';
                const bodyColor = isMe ? '#d1d5db' : '#6b7280';
                const borderColor = isMe ? '#ffffff' : '#4b5563';

                return (
                    <div key={username} style={{
                        position: 'absolute',
                        left: `${x}px`, top: `${yPersp}px`,
                        transform: 'translate(-50%, -50%)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        transition: 'all 0.5s ease-out',
                        // animation removed (stopped floating)
                    }}>
                        {/* Chat Bubbles Stack */}
                        <div style={{
                            position: 'absolute', bottom: '100%', marginBottom: '15px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            gap: '5px', width: '200px', pointerEvents: 'none', zIndex: 50
                        }}>
                            {bubbles.map(bubble => (
                                <div key={bubble.id} style={{
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    color: '#111',
                                    border: '1px solid #ccc',
                                    padding: '6px 12px', borderRadius: '12px',
                                    fontSize: '14px', textAlign: 'center',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                }}>
                                    {bubble.text}
                                </div>
                            ))}
                        </div>

                        {/* Human Avatar Shape */}
                        <div style={{ position: 'relative', width: '40px', height: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {/* Head */}
                            <div style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                background: baseColor,
                                border: `1px solid ${borderColor}`,
                                boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                                zIndex: 2
                            }}></div>

                            {/* Body */}
                            <div style={{
                                width: '36px', height: '40px',
                                borderRadius: '16px 16px 4px 4px',
                                background: bodyColor,
                                marginTop: '-4px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                                zIndex: 1
                            }}>
                                {/* Scarf/Detail */}
                                <div style={{
                                    width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '4px 4px 0 0'
                                }}></div>
                            </div>

                            {/* Shadow on Ground */}
                            <div style={{
                                position: 'absolute', bottom: '-5px',
                                width: '40px', height: '10px',
                                background: 'rgba(0,0,0,0.5)',
                                borderRadius: '50%',
                                filter: 'blur(4px)',
                                zIndex: 0
                            }}></div>
                        </div>

                        {/* Nameplate */}
                        <span style={{
                            marginTop: '5px', color: '#eee', fontSize: '13px',
                            fontWeight: 'bold', textShadow: '0 2px 4px black',
                            background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '8px',
                        }}>
                            {username} {isMe ? '(Me)' : ''}
                        </span>
                    </div>
                );
            })}

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translate(-50%, -50%) translateY(0); }
                    50% { transform: translate(-50%, -50%) translateY(-5px); }
                }
            `}</style>
        </div>
    );
};

export default UserHome;
