import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

interface VideoCallProps {
    roomId: string;
    onParticipantJoin?: (id: string) => void;
    onParticipantLeave?: (id: string) => void;
}

interface PeerConnection {
    id: string;
    connection: RTCPeerConnection;
    stream?: MediaStream;
}

export interface VideoCallHandle {
    toggleAudio: () => boolean;
    toggleVideo: () => boolean;
    getLocalStream: () => MediaStream | null;
    getPeers: () => Map<string, PeerConnection>;
}

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ],
};

const VideoCall = forwardRef<VideoCallHandle, VideoCallProps>((props, ref) => {
    const { roomId, onParticipantJoin, onParticipantLeave } = props;

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
    const [connected, setConnected] = useState(false);
    const [socketReady, setSocketReady] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const socketRef = useRef<WebSocket | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const peersRef = useRef<Map<string, PeerConnection>>(new Map());

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        toggleAudio: () => {
            if (localStream) {
                const audioTracks = localStream.getAudioTracks();
                if (audioTracks.length > 0) {
                    const enabled = !audioTracks[0].enabled;
                    audioTracks[0].enabled = enabled;
                    setIsMuted(!enabled);
                    return enabled;
                }
            }
            return false;
        },
        toggleVideo: () => {
            if (localStream) {
                const videoTracks = localStream.getVideoTracks();
                if (videoTracks.length > 0) {
                    const enabled = !videoTracks[0].enabled;
                    videoTracks[0].enabled = enabled;
                    setIsVideoOff(!enabled);
                    return enabled;
                }
            }
            return false;
        },
        getLocalStream: () => localStream,
        getPeers: () => peers
    }));

    // Initialize the connection to the signaling server
    useEffect(() => {
        const socket = new WebSocket(`ws://localhost:3000`);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log('Connected to signaling server');
            setSocketReady(true);

            // Join the room
            socket.send(JSON.stringify({
                type: 'join',
                roomId: roomId,
                userId: generateUserId(),
            }));
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleSignalingMessage(message);
        };

        socket.onclose = () => {
            console.log('Disconnected from signaling server');
            setSocketReady(false);
        };

        return () => {
            socket.close();
            // Cleanup all peer connections
            peersRef.current.forEach((peer) => {
                peer.connection.close();
            });

            // Stop all tracks in local stream
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [roomId]);

    // Initialize local media stream
    useEffect(() => {
        const initializeMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });

                setLocalStream(stream);

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                setConnected(true);
            } catch (error) {
                console.error('Error accessing media devices:', error);
            }
        };

        initializeMedia();
    }, []);

    // Handle signaling messages
    const handleSignalingMessage = (message: any) => {
        const { type, from, data } = message;

        switch (type) {
            case 'user-joined':
                // A new user has joined the room, initiate a connection
                console.log(`User ${from} joined the room`);
                createPeerConnection(from);
                break;

            case 'user-left':
                // A user has left the room, close the connection
                console.log(`User ${from} left the room`);
                closePeerConnection(from);
                if (onParticipantLeave) onParticipantLeave(from);
                break;

            case 'offer':
                // Received an offer from a peer
                handleOffer(from, data);
                break;

            case 'answer':
                // Received an answer from a peer
                handleAnswer(from, data);
                break;

            case 'ice-candidate':
                // Received an ICE candidate from a peer
                handleIceCandidate(from, data);
                break;
        }
    };

    // Create a new peer connection
    const createPeerConnection = async (peerId: string) => {
        if (!socketRef.current || !localStream) return;

        console.log(`Creating peer connection with ${peerId}`);

        const peerConnection = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks to the connection
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        // Set up event handlers
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // Send ICE candidate to the peer
                socketRef.current?.send(JSON.stringify({
                    type: 'ice-candidate',
                    to: peerId,
                    data: event.candidate,
                }));
            }
        };

        peerConnection.ontrack = (event) => {
            // A new track has been added to the connection
            console.log(`Received track from ${peerId}`);

            // Create a new MediaStream for the peer
            const peerStream = new MediaStream();
            event.streams[0].getTracks().forEach(track => {
                peerStream.addTrack(track);
            });

            // Update the peer connection with the stream
            const updatedPeers = new Map(peersRef.current);
            const peerConnection = updatedPeers.get(peerId);

            if (peerConnection) {
                updatedPeers.set(peerId, {
                    ...peerConnection,
                    stream: peerStream,
                });

                peersRef.current = updatedPeers;
                setPeers(updatedPeers);

                if (onParticipantJoin) onParticipantJoin(peerId);
            }
        };

        // Create and send offer
        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            socketRef.current.send(JSON.stringify({
                type: 'offer',
                to: peerId,
                data: offer,
            }));
        } catch (error) {
            console.error('Error creating offer:', error);
        }

        // Store the peer connection
        const peer: PeerConnection = {
            id: peerId,
            connection: peerConnection,
        };

        peersRef.current.set(peerId, peer);
        setPeers(new Map(peersRef.current));
    };

    // Close a peer connection
    const closePeerConnection = (peerId: string) => {
        const peer = peersRef.current.get(peerId);

        if (peer) {
            peer.connection.close();
            peersRef.current.delete(peerId);
            setPeers(new Map(peersRef.current));
        }
    };

    // Handle an offer from a peer
    const handleOffer = async (peerId: string, offer: RTCSessionDescriptionInit) => {
        if (!socketRef.current || !localStream) return;

        console.log(`Received offer from ${peerId}`);

        // Create a new peer connection if it doesn't exist
        if (!peersRef.current.has(peerId)) {
            const peerConnection = new RTCPeerConnection(ICE_SERVERS);

            // Add local tracks to the connection
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });

            // Set up event handlers
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    // Send ICE candidate to the peer
                    socketRef.current?.send(JSON.stringify({
                        type: 'ice-candidate',
                        to: peerId,
                        data: event.candidate,
                    }));
                }
            };

            peerConnection.ontrack = (event) => {
                // A new track has been added to the connection
                console.log(`Received track from ${peerId}`);

                // Create a new MediaStream for the peer
                const peerStream = new MediaStream();
                event.streams[0].getTracks().forEach(track => {
                    peerStream.addTrack(track);
                });

                // Update the peer connection with the stream
                const updatedPeers = new Map(peersRef.current);
                const peerConnection = updatedPeers.get(peerId);

                if (peerConnection) {
                    updatedPeers.set(peerId, {
                        ...peerConnection,
                        stream: peerStream,
                    });

                    peersRef.current = updatedPeers;
                    setPeers(updatedPeers);

                    if (onParticipantJoin) onParticipantJoin(peerId);
                }
            };

            // Store the peer connection
            const peer: PeerConnection = {
                id: peerId,
                connection: peerConnection,
            };

            peersRef.current.set(peerId, peer);
            setPeers(new Map(peersRef.current));
        }

        const peerConnection = peersRef.current.get(peerId)?.connection;

        if (peerConnection) {
            // Set the remote description
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            // Create and send answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            socketRef.current.send(JSON.stringify({
                type: 'answer',
                to: peerId,
                data: answer,
            }));
        }
    };

    // Handle an answer from a peer
    const handleAnswer = async (peerId: string, answer: RTCSessionDescriptionInit) => {
        console.log(`Received answer from ${peerId}`);

        const peerConnection = peersRef.current.get(peerId)?.connection;

        if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        }
    };

    // Handle an ICE candidate from a peer
    const handleIceCandidate = async (peerId: string, candidate: RTCIceCandidateInit) => {
        console.log(`Received ICE candidate from ${peerId}`);

        const peerConnection = peersRef.current.get(peerId)?.connection;

        if (peerConnection) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    };

    // Generate a random user ID
    const generateUserId = () => {
        return Math.random().toString(36).substring(2, 15);
    };

    // Render the video component
    return (
        <div className="flex flex-col">
            <div className="relative">
                <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full rounded-lg ${isVideoOff ? 'hidden' : 'block'}`}
                />
                {isVideoOff && (
                    <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-white">Video Off</span>
                    </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-full text-sm text-white">
                    You {isMuted && '(Muted)'}
                </div>
            </div>
            {/* This component intentionally doesn't render remote videos.
               The parent component should use the peer streams from the exposed state */}
        </div>
    );
});

VideoCall.displayName = 'VideoCall';

export default VideoCall; 