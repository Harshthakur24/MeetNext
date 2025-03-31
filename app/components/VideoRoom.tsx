import React, { useEffect, useRef, useState } from 'react';
import VideoCall, { VideoCallHandle } from './VideoCall';
import { Button } from '@/components/ui/button';
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    PhoneOff,
    MessageSquare,
    Users,
    Share2,
    MoreVertical,
    Settings,
    Maximize2,
    Maximize
} from 'lucide-react';

interface VideoRoomProps {
    roomId: string;
    onLeaveRoom: () => void;
}

interface Participant {
    id: string;
    stream?: MediaStream;
    name: string;
    isMuted?: boolean;
    isVideoOff?: boolean;
}

const VideoRoom: React.FC<VideoRoomProps> = ({ roomId, onLeaveRoom }) => {
    const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [messages, setMessages] = useState<{ sender: string; text: string; time: Date }[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [layout, setLayout] = useState<'grid' | 'spotlight'>('grid');
    const [spotlightParticipant, setSpotlightParticipant] = useState<string | null>(null);
    const [meetingTime, setMeetingTime] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const videoCallRef = useRef<VideoCallHandle>(null);
    const remoteVideosRef = useRef<Map<string, HTMLVideoElement | null>>(new Map());
    const mainContainerRef = useRef<HTMLDivElement>(null);

    // Effect to update participants when peer connections change
    useEffect(() => {
        const interval = setInterval(() => {
            if (videoCallRef.current) {
                const peers = videoCallRef.current.getPeers();

                setParticipants(prev => {
                    const updated = new Map(prev);

                    // Add any new peers
                    peers.forEach((peer, id) => {
                        if (!updated.has(id)) {
                            updated.set(id, {
                                id,
                                name: `Participant ${updated.size + 1}`,
                                stream: peer.stream,
                                isMuted: false,
                                isVideoOff: false
                            });
                        } else if (peer.stream && !updated.get(id)?.stream) {
                            // Update stream if it's now available
                            const participant = updated.get(id);
                            if (participant) {
                                updated.set(id, {
                                    ...participant,
                                    stream: peer.stream
                                });
                            }
                        }
                    });

                    return updated;
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Update meeting time
    useEffect(() => {
        const timer = setInterval(() => {
            setMeetingTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Format meeting time
    const formatMeetingTime = () => {
        const hours = Math.floor(meetingTime / 3600);
        const minutes = Math.floor((meetingTime % 3600) / 60);
        const seconds = meetingTime % 60;

        return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Handle a new participant joining the room
    const handleParticipantJoin = (id: string) => {
        setParticipants(prev => {
            const updated = new Map(prev);
            if (!updated.has(id)) {
                updated.set(id, {
                    id,
                    name: `Participant ${updated.size + 1}`,
                    isMuted: false,
                    isVideoOff: false
                });
            }
            return updated;
        });
    };

    // Handle a participant leaving the room
    const handleParticipantLeave = (id: string) => {
        setParticipants(prev => {
            const updated = new Map(prev);
            updated.delete(id);
            return updated;
        });
    };

    // Toggle mute audio
    const toggleMute = () => {
        if (videoCallRef.current) {
            const enabled = videoCallRef.current.toggleAudio();
            setIsMuted(!enabled);
        }
    };

    // Toggle video
    const toggleVideo = () => {
        if (videoCallRef.current) {
            const enabled = videoCallRef.current.toggleVideo();
            setIsVideoOff(!enabled);
        }
    };

    // Send a chat message
    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            const message = {
                sender: 'You',
                text: newMessage,
                time: new Date()
            };
            setMessages(prev => [...prev, message]);
            setNewMessage('');

            // TODO: Send message through the signaling server
        }
    };

    // Toggle chat sidebar
    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
        if (!isChatOpen) {
            setIsParticipantsOpen(false);
        }
    };

    // Toggle participants sidebar
    const toggleParticipants = () => {
        setIsParticipantsOpen(!isParticipantsOpen);
        if (!isParticipantsOpen) {
            setIsChatOpen(false);
        }
    };

    // Copy room ID to clipboard
    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        // TODO: Add toast notification
    };

    // Toggle layout between grid and spotlight
    const toggleLayout = () => {
        setLayout(prev => prev === 'grid' ? 'spotlight' : 'grid');
        if (layout === 'grid' && participants.size > 0) {
            // Set first participant as spotlight when switching to spotlight mode
            setSpotlightParticipant(Array.from(participants.keys())[0]);
        }
    };

    // Set a participant as spotlight
    const setParticipantAsSpotlight = (id: string) => {
        setSpotlightParticipant(id);
        if (layout === 'grid') {
            setLayout('spotlight');
        }
    };

    // Toggle fullscreen
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            mainContainerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            setIsFullScreen(true);
        } else {
            document.exitFullscreen();
            setIsFullScreen(false);
        }
    };

    return (
        <div ref={mainContainerRef} className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
            {/* Top Bar */}
            <div className="h-14 bg-gray-800/90 backdrop-blur-md flex items-center justify-between px-6 border-b border-gray-700/50 z-10">
                <div className="flex items-center space-x-3">
                    <Video className="h-6 w-6 text-blue-500" />
                    <span className="text-xl font-semibold">MeetNext</span>
                    <div className="h-5 w-px bg-gray-700 mx-2" />
                    <div className="text-sm text-gray-300">
                        {formatMeetingTime()}
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center bg-gray-700/50 rounded-full px-3 py-1">
                        <span className="text-sm mr-2">Room:</span>
                        <code className="text-blue-400 font-mono text-sm">{roomId}</code>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1 text-gray-400 hover:text-white"
                            onClick={copyRoomId}
                            title="Copy room ID"
                        >
                            <Share2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-8 w-8 bg-gray-700/50 hover:bg-gray-600"
                        onClick={toggleFullScreen}
                        title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                        <Maximize className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-8 w-8 bg-gray-700/50 hover:bg-gray-600"
                        onClick={toggleLayout}
                        title={layout === 'grid' ? "Switch to spotlight view" : "Switch to grid view"}
                    >
                        <Maximize2 className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-8 w-8 bg-gray-700/50 hover:bg-gray-600"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex relative overflow-hidden">
                {/* Video Grid */}
                <div className={`flex-1 ${isChatOpen || isParticipantsOpen ? 'mr-80' : ''} transition-all duration-300 ease-in-out`}>
                    {layout === 'grid' ? (
                        <div className={`grid ${participants.size === 0 ? 'grid-cols-1' :
                            participants.size === 1 ? 'grid-cols-2' :
                                participants.size <= 3 ? 'grid-cols-2' :
                                    participants.size <= 6 ? 'grid-cols-3' :
                                        participants.size <= 9 ? 'grid-cols-3' :
                                            'grid-cols-4'
                            } auto-rows-fr gap-2 p-4 h-full`}>
                            {/* Local Video */}
                            <div className="relative rounded-lg overflow-hidden bg-gray-800 group aspect-square">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                                <VideoCall
                                    roomId={roomId}
                                    onParticipantJoin={handleParticipantJoin}
                                    onParticipantLeave={handleParticipantLeave}
                                    ref={videoCallRef}
                                />
                                <div className="absolute bottom-2 left-2 z-20">
                                    <div className="bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs flex items-center space-x-1">
                                        {isMuted && <MicOff className="h-2.5 w-2.5 text-red-500 mr-0.5" />}
                                        <span>You (Host)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Remote Videos */}
                            {Array.from(participants.values()).map(participant => (
                                <div key={participant.id} className="relative rounded-lg overflow-hidden bg-gray-800 group aspect-square">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                                    {participant.stream ? (
                                        <video
                                            ref={el => {
                                                if (el) {
                                                    el.srcObject = participant.stream as MediaStream;
                                                    remoteVideosRef.current.set(participant.id, el);
                                                }
                                            }}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                                                    <Users className="h-6 w-6 text-blue-400" />
                                                </div>
                                                <p className="text-sm">{participant.name}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 left-2 z-20">
                                        <div className="bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs flex items-center space-x-1">
                                            {participant.isMuted && <MicOff className="h-2.5 w-2.5 text-red-500 mr-0.5" />}
                                            <span>{participant.name}</span>
                                        </div>
                                    </div>
                                    <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full h-6 w-6 p-0"
                                            onClick={() => setParticipantAsSpotlight(participant.id)}
                                        >
                                            <Maximize2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {/* Placeholder for empty grid slots when no participants */}
                            {participants.size === 0 && (
                                <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                                    <div className="text-center max-w-md p-4">
                                        <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                                            <Users className="h-8 w-8 text-blue-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-1">Waiting for others to join</h3>
                                        <p className="text-sm text-gray-400 mb-4">Share the room ID with others to invite them to your meeting</p>
                                        <div className="flex items-center justify-center space-x-2">
                                            <code className="bg-gray-700/50 px-3 py-1.5 rounded-md font-mono text-sm text-blue-400">{roomId}</code>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-gray-600 hover:bg-gray-700 h-8"
                                                onClick={copyRoomId}
                                            >
                                                <Share2 className="h-3.5 w-3.5 mr-1" />
                                                Share
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            {/* Spotlight View */}
                            <div className="flex-1 p-1">
                                {spotlightParticipant ? (
                                    <div className="h-full relative rounded-lg overflow-hidden bg-gray-800">
                                        {participants.has(spotlightParticipant) ? (
                                            <>
                                                {participants.get(spotlightParticipant)?.stream ? (
                                                    <video
                                                        ref={el => {
                                                            if (el) {
                                                                el.srcObject = participants.get(spotlightParticipant)?.stream as MediaStream;
                                                            }
                                                        }}
                                                        autoPlay
                                                        playsInline
                                                        className="w-full h-full object-contain bg-black"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                                        <div className="text-center">
                                                            <div className="w-32 h-32 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                                                                <Users className="h-16 w-16 text-blue-400" />
                                                            </div>
                                                            <p className="text-xl">{participants.get(spotlightParticipant)?.name}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="absolute bottom-4 left-4 z-20">
                                                    <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm flex items-center space-x-2">
                                                        {participants.get(spotlightParticipant)?.isMuted && <MicOff className="h-4 w-4 text-red-500 mr-1" />}
                                                        <span className="text-base">{participants.get(spotlightParticipant)?.name}</span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                                <p>Participant no longer in the meeting</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full relative rounded-lg overflow-hidden bg-gray-800">
                                        <VideoCall
                                            roomId={roomId}
                                            onParticipantJoin={handleParticipantJoin}
                                            onParticipantLeave={handleParticipantLeave}
                                            ref={videoCallRef}
                                        />
                                        <div className="absolute bottom-4 left-4 z-20">
                                            <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm flex items-center space-x-2">
                                                {isMuted && <MicOff className="h-4 w-4 text-red-500 mr-1" />}
                                                <span className="text-base">You (Host)</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails at bottom */}
                            <div className="h-24 bg-gray-800/90 backdrop-blur-md border-t border-gray-700/50 p-2">
                                <div className="flex space-x-2 h-full overflow-x-auto">
                                    {/* Local Video Thumbnail */}
                                    <div
                                        className={`h-full aspect-video rounded-lg overflow-hidden cursor-pointer border-2 ${spotlightParticipant === null ? 'border-blue-500' : 'border-transparent'}`}
                                        onClick={() => setSpotlightParticipant(null)}
                                    >
                                        <div className="h-full w-full relative">
                                            <VideoCall
                                                roomId={roomId}
                                                onParticipantJoin={handleParticipantJoin}
                                                onParticipantLeave={handleParticipantLeave}
                                                ref={videoCallRef}
                                            />
                                            <div className="absolute bottom-1 left-1 text-xs bg-black/70 px-1 rounded">You</div>
                                        </div>
                                    </div>

                                    {/* Remote Video Thumbnails */}
                                    {Array.from(participants.values()).map(participant => (
                                        <div
                                            key={participant.id}
                                            className={`h-full aspect-video rounded-lg overflow-hidden cursor-pointer border-2 ${spotlightParticipant === participant.id ? 'border-blue-500' : 'border-transparent'}`}
                                            onClick={() => setSpotlightParticipant(participant.id)}
                                        >
                                            {participant.stream ? (
                                                <div className="relative h-full w-full">
                                                    <video
                                                        ref={el => {
                                                            if (el) {
                                                                el.srcObject = participant.stream as MediaStream;
                                                            }
                                                        }}
                                                        autoPlay
                                                        playsInline
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute bottom-1 left-1 text-xs bg-black/70 px-1 rounded">{participant.name}</div>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
                                                    <Users className="h-6 w-6 text-gray-400" />
                                                    <div className="absolute bottom-1 left-1 text-xs bg-black/70 px-1 rounded">{participant.name}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className={`absolute right-0 top-0 bottom-0 w-80 bg-gray-800/90 backdrop-blur-md border-l border-gray-700/50 transform transition-transform duration-300 ease-in-out ${isChatOpen || isParticipantsOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}>
                    <div className="h-full flex flex-col">
                        {/* Sidebar Header */}
                        <div className="h-12 border-b border-gray-700/50 flex items-center justify-between px-4">
                            <h3 className="font-medium">
                                {isChatOpen ? 'Chat' : 'Participants'}
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                                onClick={isChatOpen ? toggleChat : toggleParticipants}
                            >
                                ✕
                            </Button>
                        </div>

                        {/* Sidebar Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {isChatOpen && (
                                <div className="space-y-4">
                                    {messages.map((message, index) => (
                                        <div key={index} className={`${message.sender === 'You' ? 'ml-auto max-w-[80%]' : 'mr-auto max-w-[80%]'}`}>
                                            <div className={`rounded-lg p-3 ${message.sender === 'You' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-sm">{message.sender}</span>
                                                    <span className="text-xs text-gray-300 ml-2">
                                                        {message.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm">{message.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {messages.length === 0 && (
                                        <div className="text-center text-gray-400 my-8">
                                            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>No messages yet</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isParticipantsOpen && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between py-2 px-1">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            <span>You (Host)</span>
                                        </div>
                                    </div>

                                    {Array.from(participants.values()).map(participant => (
                                        <div key={participant.id} className="flex items-center justify-between py-2 px-1">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                                <span>{participant.name}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {participants.size === 0 && (
                                        <div className="text-center text-gray-400 my-8">
                                            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>No other participants yet</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Chat Input */}
                        {isChatOpen && (
                            <form onSubmit={sendMessage} className="border-t border-gray-700/50 p-3">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-gray-700/70 border-none rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="rounded-full bg-blue-600 hover:bg-blue-700 h-8 w-8"
                                        disabled={!newMessage.trim()}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                        </svg>
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="h-20 bg-gray-800/90 backdrop-blur-md flex items-center justify-center border-t border-gray-700/50">
                <div className="flex items-center justify-between max-w-4xl w-full px-8">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`rounded-full p-3 ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700/70 hover:bg-gray-600'}`}
                            onClick={toggleMute}
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`rounded-full p-3 ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700/70 hover:bg-gray-600'}`}
                            onClick={toggleVideo}
                            title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                        >
                            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                        </Button>
                    </div>

                    <div className="flex items-center space-x-4">
                        <Button
                            variant={isChatOpen ? "default" : "ghost"}
                            size="icon"
                            className={`rounded-full p-3 ${isChatOpen ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700/70 hover:bg-gray-600'}`}
                            onClick={toggleChat}
                            title="Chat"
                        >
                            <MessageSquare className="h-6 w-6" />
                        </Button>
                        <Button
                            variant={isParticipantsOpen ? "default" : "ghost"}
                            size="icon"
                            className={`rounded-full p-3 ${isParticipantsOpen ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700/70 hover:bg-gray-600'}`}
                            onClick={toggleParticipants}
                            title="Participants"
                        >
                            <Users className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full p-3 bg-gray-700/70 hover:bg-gray-600"
                            title="Settings"
                        >
                            <Settings className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="destructive"
                            className="rounded-full px-6 py-6 bg-red-600 hover:bg-red-700"
                            onClick={onLeaveRoom}
                            title="Leave meeting"
                        >
                            <PhoneOff className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoRoom;