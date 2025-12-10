import React, { useState, useEffect } from 'react';
import CreateChannelModal from './CreateChannelModal';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const ChannelList = ({ onJoinRoom, currentRoomId, user }) => {
    const [rooms, setRooms] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeUsers, setActiveUsers] = useState({}); // { roomId: [username1, username2] }
    const [stompClient, setStompClient] = useState(null);

    const fetchRooms = () => {
        fetch('http://172.21.102.46:8080/api/rooms', { credentials: 'include' })
            .then(res => res.json())
            .then(data => setRooms(data))
            .catch(err => console.error("Error fetching rooms:", err));
    };

    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 10000); // Poll less frequently for rooms

        // Set up separate socket for monitoring rooms (could reuse main socket but keeping clean)
        const socket = new SockJS(WS_BASE_URL);
        const client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                // Subscribe to all rooms active user updates (hacky, ideally global topic)
                rooms.forEach(room => {
                    // subscribeToRoom(client, room.name); 
                });
            }
        });
        client.activate();
        setStompClient(client);

        return () => {
            if (client) client.deactivate();
            clearInterval(interval);
        }
    }, [rooms.length]); // Fix dependency to avoid constant reconnection loop

    // Poll active users every 2 seconds to keep the list fresh (Fallback to sockets)
    useEffect(() => {
        if (rooms.length > 0) {
            const pollUsers = setInterval(() => {
                rooms.forEach(room => {
                    fetch(`${API_BASE_URL}/api/rooms/${room.name}/users`, { credentials: 'include' })
                        .then(res => res.json())
                        .then(users => {
                            setActiveUsers(prev => ({ ...prev, [room.name]: users }));
                        })
                        .catch(() => { });
                });
            }, 2000);
            return () => clearInterval(pollUsers);
        }
    }, [rooms]);


    const handleCreateChannel = (name) => {
        fetch(`${API_BASE_URL}/api/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, type: 'VOICE' }),
            credentials: 'include'
        })
            .then(res => {
                if (res.ok) fetchRooms();
            });
    };

    return (
        <div style={{
            width: '240px', background: '#2f3136', display: 'flex', flexDirection: 'column',
            borderTopLeftRadius: '8px' // bit of style
        }}>
            <div style={{
                padding: '1rem', boxShadow: '0 1px 0 rgba(0,0,0,0.2)', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', color: 'white'
            }}>
                <span style={{ fontWeight: 'bold' }}>Voice Channels</span>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{ background: 'none', border: 'none', color: '#b9bbbe', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                    +
                </button>
            </div>

            <div style={{ flex: 1, padding: '0.5rem', overflowY: 'auto' }}>
                {rooms.map(room => (
                    <div key={room.id} style={{ marginBottom: '8px' }}>
                        <div
                            onClick={() => onJoinRoom(room.name)}
                            style={{
                                padding: '8px 10px', borderRadius: '4px', cursor: 'pointer',
                                color: currentRoomId === room.name ? 'white' : '#8e9297',
                                background: currentRoomId === room.name ? 'rgba(79, 84, 92, 0.6)' : 'transparent',
                                display: 'flex', alignItems: 'center'
                            }}
                            onMouseOver={(e) => { if (currentRoomId !== room.name) e.currentTarget.style.backgroundColor = 'rgba(79, 84, 92, 0.3)' }}
                            onMouseOut={(e) => { if (currentRoomId !== room.name) e.currentTarget.style.backgroundColor = 'transparent' }}
                        >
                            <span style={{ marginRight: '5px' }}>🔊</span>
                            <span style={{ fontWeight: currentRoomId === room.name ? 'bold' : 'normal' }}>{room.name}</span>
                        </div>

                        {/* Active Users List */}
                        {activeUsers[room.name] && activeUsers[room.name].length > 0 && (
                            <div style={{ marginLeft: '24px', marginTop: '4px' }}>
                                {activeUsers[room.name].map(u => (
                                    <div key={u} style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#3ba55c', marginRight: '6px' }}></div>
                                        <span style={{ fontSize: '12px', color: '#b9bbbe' }}>{u}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showCreateModal && (
                <CreateChannelModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateChannel}
                />
            )}
        </div>
    );
};

export default ChannelList;
