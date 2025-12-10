import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { WS_BASE_URL } from '../config';

const ChatOverlay = ({ roomId, user }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [client, setClient] = useState(null);
    const [isOpen, setIsOpen] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const socket = new SockJS(WS_BASE_URL);
        const stompClient = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                stompClient.subscribe(`/topic/room/${roomId}/chat`, (message) => {
                    const msg = JSON.parse(message.body);
                    setMessages(prev => [...prev, msg]);
                });
            }
        });
        stompClient.activate();
        setClient(stompClient);

        return () => stompClient.deactivate();
    }, [roomId]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (input.trim() && client) {
            const chatMessage = {
                type: 'CHAT',
                content: input,
                sender: user.username,
                roomId: roomId
            };
            client.publish({
                destination: `/app/chat/${roomId}/sendMessage`,
                body: JSON.stringify(chatMessage)
            });
            setInput("");
        }
    };

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            width: '350px',
            height: isOpen ? '400px' : '40px', // Collapsed height
            background: isOpen ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0,0,0,0.8)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 154, 0, 0.3)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            transition: 'height 0.3s ease, background 0.3s ease',
            zIndex: 100,
            overflow: 'hidden'
        }}>
            {/* Header - Click to toggle */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '12px',
                    borderBottom: isOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    fontWeight: 'bold',
                    color: '#ff9a00',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                }}>
                <span>Campfire Chat</span>
                <span style={{ fontSize: '12px', color: '#ccc' }}>
                    {isOpen ? '▼' : '▲'}
                </span>
            </div>

            {/* Content - Only visible when open */}
            {isOpen && (
                <>
                    {/* Messages */}
                    <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{
                                alignSelf: msg.sender === user.username ? 'flex-end' : 'flex-start',
                                maxWidth: '80%',
                            }}>
                                <div style={{ fontSize: '10px', color: '#ccc', marginBottom: '2px', textAlign: msg.sender === user.username ? 'right' : 'left' }}>
                                    {msg.sender}
                                </div>
                                <div style={{
                                    padding: '8px 12px',
                                    borderRadius: '12px',
                                    background: msg.sender === user.username ? '#ff9a00' : 'rgba(255,255,255,0.1)',
                                    color: msg.sender === user.username ? 'black' : 'white',
                                    fontSize: '14px'
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={sendMessage} style={{ padding: '12px', display: 'flex', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Warming hands and talking..."
                            style={{
                                flex: 1,
                                background: 'rgba(0,0,0,0.3)',
                                border: 'none',
                                color: 'white',
                                padding: '8px 12px',
                                borderRadius: '20px',
                                marginRight: '8px',
                                outline: 'none'
                            }}
                        />
                    </form>
                </>
            )}
        </div>
    );
};

export default ChatOverlay;
