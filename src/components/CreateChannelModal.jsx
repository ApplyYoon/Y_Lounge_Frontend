import React, { useState } from 'react';

const CreateChannelModal = ({ onClose, onCreate }) => {
    const [channelName, setChannelName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (channelName.trim()) {
            onCreate(channelName);
            onClose();
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: '#2f3136', padding: '2rem', borderRadius: '8px', width: '400px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)', color: 'white'
            }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Create Channel</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#b9bbbe' }}>
                            Channel Name
                        </label>
                        <input
                            type="text"
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                            placeholder="# new-channel"
                            style={{
                                width: '100%', padding: '10px', borderRadius: '4px', border: 'none',
                                background: '#202225', color: 'white', outline: 'none'
                            }}
                            autoFocus
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '10px 20px' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                background: '#5865F2', border: 'none', color: 'white', padding: '10px 20px',
                                borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                            }}
                        >
                            Create Channel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateChannelModal;
