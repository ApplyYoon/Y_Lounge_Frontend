import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_BASE_URL } from '../config';

const STUN_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
    ],
};

export const useWebRTC = (roomId: string, userId: string) => {
    const [peers, setPeers] = useState<RTCPeerConnection[]>([]);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const stompClient = useRef<Client | null>(null);
    const userStream = useRef<MediaStream | null>(null);
    const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});

    useEffect(() => {
        // Get User Material (Audio)
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then((myStream) => {
                setStream(myStream);
                userStream.current = myStream;
                connectToSignalServer();
            })
            .catch((err) => console.error("Error accessing microphone:", err));

        return () => {
            if (userStream.current) {
                userStream.current.getTracks().forEach(track => track.stop());
            }
            if (stompClient.current) {
                stompClient.current.deactivate();
            }
            Object.values(peersRef.current).forEach(pc => pc.close());
        };
    }, [roomId]);

    const [signalStatus, setSignalStatus] = useState<string>('disconnected');

    const connectToSignalServer = () => {
        setSignalStatus('connecting');
        const socket = new SockJS(WS_BASE_URL);
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            onConnect: () => {
                console.log("Connected to Signal Server");
                setSignalStatus('connected');

                // Subscribe to room messages
                client.subscribe(`/topic/room/${roomId}`, (message) => {
                    const signal = JSON.parse(message.body);
                    if (signal.sender === userId) return; // Ignore own messages
                    handleSignalMessage(signal);
                });

                // Notify others I'm here
                client.publish({
                    destination: `/app/join/${roomId}`,
                    body: JSON.stringify({ type: 'join', sender: userId })
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
                setSignalStatus('error: ' + frame.headers['message']);
            },
            onWebSocketClose: () => {
                console.log("WebSocket Closed");
                setSignalStatus('disconnected');
            }
        });

        client.activate();
        stompClient.current = client;
    };

    const [peerStates, setPeerStates] = useState<{ [key: string]: string }>({});

    // updates peer state helper
    const updatePeerState = (id: string, state: string) => {
        setPeerStates(prev => ({ ...prev, [id]: state }));
    };

    const createPeerConnection = (targetUserId: string) => {
        const pc = new RTCPeerConnection(STUN_SERVERS);
        updatePeerState(targetUserId, 'new');

        pc.onicecandidate = (event) => {
            if (event.candidate && stompClient.current) {
                stompClient.current.publish({
                    destination: `/app/signal/${roomId}`,
                    body: JSON.stringify({
                        type: 'ice-candidate',
                        targetUser: targetUserId,
                        sender: userId,
                        data: event.candidate
                    })
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`ICE Connection State with ${targetUserId}: ${pc.iceConnectionState}`);
            updatePeerState(targetUserId, pc.iceConnectionState);
        };

        pc.ontrack = (event) => {
            console.log("Received remote stream from", targetUserId);
            // Create an audio element for this stream
            const audio = document.createElement('audio');
            audio.srcObject = event.streams[0];
            audio.autoplay = true;
            // audio.controls = true; // Uncomment for debugging
            document.body.appendChild(audio); // Append to body to play

            // Explicitly attempt to play
            audio.play().catch(e => {
                console.error("Audio autoplay blocked or failed:", e);
                updatePeerState(targetUserId, 'audio-blocked');
            });
        };

        if (userStream.current) {
            userStream.current.getTracks().forEach(track => pc.addTrack(track, userStream.current!));
        }

        peersRef.current[targetUserId] = pc;
        return pc;
    };

    const handleSignalMessage = async (signal: any) => {
        const { type, sender, data } = signal;

        switch (type) {
            case 'join':
                // A new user joined. I initiate call (Offer)
                console.log(`User ${sender} joined. Sending Offer.`);
                const pcOffer = createPeerConnection(sender);
                const offer = await pcOffer.createOffer();
                await pcOffer.setLocalDescription(offer);
                stompClient.current?.publish({
                    destination: `/app/signal/${roomId}`,
                    body: JSON.stringify({ type: 'offer', sender: userId, targetUser: sender, data: offer })
                });
                break;

            case 'offer':
                // Received offer. Respond with Answer.
                if (signal.targetUser !== userId) return; // Only process if meant for me (basic filtering)
                console.log(`Received Offer from ${sender}. Sending Answer.`);
                const pcAnswer = createPeerConnection(sender);
                await pcAnswer.setRemoteDescription(new RTCSessionDescription(data));
                const answer = await pcAnswer.createAnswer();
                await pcAnswer.setLocalDescription(answer);
                stompClient.current?.publish({
                    destination: `/app/signal/${roomId}`,
                    body: JSON.stringify({ type: 'answer', sender: userId, targetUser: sender, data: answer })
                });
                break;

            case 'answer':
                if (signal.targetUser !== userId) return;
                console.log(`Received Answer from ${sender}.`);
                const pc = peersRef.current[sender];
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(data));
                }
                break;

            case 'ice-candidate':
                if (signal.targetUser !== userId) return;
                console.log(`Received ICE Candidate from ${sender}.`);
                const pcIce = peersRef.current[sender];
                if (pcIce) {
                    await pcIce.addIceCandidate(new RTCIceCandidate(data));
                }
                break;
        }
    };

    return { stream, peerStates, signalStatus };
};
