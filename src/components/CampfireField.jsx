import React, { useState, useEffect } from 'react';
import Bonfire from './Bonfire';
import CreateChannelModal from './CreateChannelModal';

import { API_BASE_URL } from '../config';

const CampfireField = ({ onJoinRoom, user }) => {
    const [rooms, setRooms] = useState([]);
    const [activeUsers, setActiveUsers] = useState({});
    const [hoveredRoom, setHoveredRoom] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 3000); // Polling for room updates
        return () => clearInterval(interval);
    }, []);

    const fetchRooms = () => {
        fetch(`${API_BASE_URL}/api/rooms`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                setRooms(data);
                // Also fetch active users for each room
                data.forEach(room => {
                    fetch(`${API_BASE_URL}/api/rooms/${room.name}/users`, { credentials: 'include' })
                        .then(res => res.json())
                        .then(users => {
                            setActiveUsers(prev => ({ ...prev, [room.name]: users }));
                        })
                        .catch(e => console.error("Failed to fetch users for room", room.name, e));
                });
            })
            .catch(err => console.error("Failed to fetch rooms", err));
    };

    // ...
    const handleCreateChannel = (name) => {
        fetch(`${API_BASE_URL}/api/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
            credentials: 'include'
        })
            .then(res => {
                if (res.ok) {
                    fetchRooms();
                    setShowCreateModal(false);
                } else {
                    alert("Failed to create room");
                }
            })
            .catch(err => console.error(err));
    };

    const handleDeleteRoom = (roomId) => {
        fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
            method: 'DELETE',
            credentials: 'include'
        }).then(res => {
            if (res.ok) fetchRooms();
            else alert("Failed to delete room");
        }).catch(err => console.error("Delete failed", err));
    };

    const handleUpdateRoom = (roomId, newName) => {
        console.log("Attempting to update room:", roomId, "New Name:", newName);
        fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName }),
            credentials: 'include'
        }).then(res => {
            console.log("Update response status:", res.status);
            if (res.ok) fetchRooms();
            else res.text().then(msg => {
                console.error("Update failed:", msg);
                alert("Failed: " + msg);
            });
        }).catch(err => console.error("Update fetch error:", err));
    };

    return (
        <div style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            overflow: 'hidden'
        }}>
            {/* Title / Instructions */}
            <div style={{
                position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
                color: 'white', textAlign: 'center', zIndex: 10,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
                <h1 style={{ margin: 0, fontSize: '2.5rem', fontFamily: 'serif' }}>The Winter Gathering</h1>
                <p style={{ opacity: 0.8 }}>Choose a fire to warm yourself.</p>
            </div>

            {/* Create Room Button */}
            <button
                onClick={() => setShowCreateModal(true)}
                style={{
                    position: 'absolute', top: '20px', right: '30px',
                    background: 'rgba(255,255,255,0.2)', border: '1px solid white',
                    color: 'white', padding: '10px 20px', borderRadius: '20px',
                    cursor: 'pointer', zIndex: 20, backdropFilter: 'blur(5px)'
                }}
            >
                + Ignite New Fire
            </button>

            {/* The Field of Bonfires */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                maxWidth: '1200px',
                gap: '40px',
                padding: '40px'
            }}>
                {rooms.map(room => {
                    // Debug Log
                    // console.log(`Checking Room: ${room.name}, Host: ${room.hostUsername}, CurrentUser: ${user?.username}`);

                    const isHost = room.hostUsername === user?.username;
                    return (
                        <div key={room.id} style={{
                            position: 'relative',
                            display: 'flex', flexDirection: 'column', alignItems: 'center'
                        }}>
                            <Bonfire
                                roomName={room.name}
                                userCount={(activeUsers[room.name] || []).length}
                                onClick={() => onJoinRoom(room.name)}
                                isHovered={hoveredRoom === room.id}
                            />

                            {/* Host Controls - Placed BELOW the bonfire label for stability */}
                            {isHost && (
                                <div
                                    onClick={(e) => { e.stopPropagation(); console.log("Container clicked"); }}
                                    style={{
                                        marginTop: '-20px', // Pull up slightly to overlap bottom of bonfire area
                                        display: 'flex', gap: '8px', zIndex: 100,
                                        background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '12px',
                                        backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)',
                                        cursor: 'default' // Cursor shouldn't look like pointer on the bar itself
                                    }}>
                                    <button
                                        onClick={(e) => {
                                            // Extra safety
                                            e.stopPropagation();
                                            console.log("Edit button clicked");
                                            const newName = prompt("New room name:", room.name);
                                            console.log("Prompt result:", newName);
                                            if (newName) handleUpdateRoom(room.id, newName);
                                        }}
                                        style={{
                                            background: 'transparent', color: '#ffcc80', border: 'none',
                                            cursor: 'pointer', fontSize: '14px', padding: '2px'
                                        }}
                                        title="Rename"
                                    >
                                        ✏️
                                    </button>
                                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.3)' }}></div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log("Delete button clicked - requesting confirmation");
                                            setDeleteTargetId(room.id);
                                        }}
                                        style={{
                                            background: 'transparent', color: '#ef5350', border: 'none',
                                            cursor: 'pointer', fontSize: '14px', padding: '2px'
                                        }}
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {showCreateModal && (
                <CreateChannelModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateChannel}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteTargetId && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                    zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{
                        background: 'rgba(20,20,30,0.9)', padding: '30px', borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center',
                        maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                    }}>
                        <h2 style={{ color: '#ef5350', marginTop: 0 }}>Extinguish Fire?</h2>
                        <p style={{ color: '#ccc', marginBottom: '30px' }}>
                            Are you sure you want to permanently remove this campfire?
                            <br /><br />
                            This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                            <button
                                onClick={() => setDeleteTargetId(null)}
                                style={{
                                    padding: '10px 20px', borderRadius: '10px', border: 'none',
                                    background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleDeleteRoom(deleteTargetId);
                                    setDeleteTargetId(null);
                                }}
                                style={{
                                    padding: '10px 20px', borderRadius: '10px', border: 'none',
                                    background: '#ef5350', color: 'white', cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                Extinguish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampfireField;
