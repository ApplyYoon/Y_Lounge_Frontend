import React from 'react';
import { useWebRTC } from '../hooks/useWebRTC';

const VoiceRoom: React.FC<{ roomId: string; userId: string }> = ({ roomId, userId }) => {
    const hookResult = useWebRTC(roomId, userId);
    const stream = hookResult?.stream || null;

    const handleDisconnect = () => {
        window.location.reload(); // Quick disconnect for now
    };

    return (
        <div className="flex flex-col gap-2 p-4 bg-gray-900 rounded-lg text-white">
            <h3 className="text-xl font-bold">{roomId}</h3>
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${stream ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                <span>{stream ? "Connected" : "Connecting..."}</span>
            </div>
            {/* Debug Signal Status */}
            <div className="text-xs mb-2">
                Signal: <span className={hookResult.signalStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>{hookResult.signalStatus}</span>
            </div>

            <div className="h-1 bg-gray-700 rounded overflow-hidden">
                {/* Visualizer placeholder */}
                <div style={{ width: stream ? '60%' : '0%', transition: 'width 0.2s' }} className="h-full bg-green-500"></div>
            </div>

            {/* Debug Peer States */}
            <div className="mt-2 text-xs text-gray-400">
                {Object.entries(hookResult.peerStates || {}).map(([peerId, state]) => (
                    <div key={peerId} className="flex justify-between">
                        <span>{peerId}:</span>
                        <span className={state === 'connected' ? 'text-green-400' : 'text-yellow-500'}>{state}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={handleDisconnect}
                className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
            >
                Disconnect
            </button>
        </div>
    );
};

export default VoiceRoom;
