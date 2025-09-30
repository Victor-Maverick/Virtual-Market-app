// callService.ts - Twilio Video call service
import axios from 'axios';

// API Configuration with fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

// Debug: Log API base URL
console.log('🌐 API_BASE_URL:', API_BASE_URL);

// Configure axios for SSL issues (development only)
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
    try {
        // Dynamic import for Node.js environment only
        import('https').then((https) => {
            axios.defaults.httpsAgent = new https.Agent({
                rejectUnauthorized: false
            });
        }).catch(() => {
            console.log('HTTPS agent configuration skipped (browser environment)');
        });
    } catch (e) {
        console.log('HTTPS agent configuration skipped (browser environment)');
    }
}

// Minimal logging for production
if (process.env.NODE_ENV === 'development') {
    axios.interceptors.request.use(
        (config) => {
            console.log(`${config.method?.toUpperCase()} ${config.url}`);
            return config;
        },
        (error) => {
            console.error('Request Error:', error instanceof Error ? error.message : 'Unknown error');
            return Promise.reject(error);
        }
    );

    axios.interceptors.response.use(
        (response) => {
            console.log(`${response.status} ${response.config.url}`);
            return response;
        },
        (error) => {
            console.error(`${error.response?.status || 'Network'} Error:`, error instanceof Error ? error.message : 'Unknown error');
            return Promise.reject(error);
        }
    );
}

export interface CallRequest {
    callerEmail: string;
    calleeEmail: string;
    type: 'video' | 'voice';
}

export interface CallResponse {
    id?: string;
    callerEmail: string;
    calleeEmail: string;
    callerName?: string;
    calleeName?: string;
    timeInitiated: number;
    duration: number;
    roomName: string;
    status: 'initiated' | 'accepted' | 'declined' | 'ended';
    type: 'video' | 'voice';
    createdAt?: string;
    startedAt?: string;
    endedAt?: string;
    message?: string;
    // Pre-generated tokens for instant connection
    callerToken?: string;
    calleeToken?: string;
}

export const webRTCCallService = {
    async initiateCall(request: CallRequest): Promise<CallResponse> {
        try {
            console.log('Call initiated');

            const timeInitiated = Date.now();
            const notification = {
                callerEmail: request.callerEmail,
                calleeEmail: request.calleeEmail,
                timeInitiated: timeInitiated,
                duration: 0,
                roomName: '',
                status: 'initiated',
                type: request.type
            };

            const config = {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            };

            const response = await axios.post(`${API_BASE_URL}/call-notifications/incoming`, notification, config);
            console.log('Call created successfully');

            return response.data;
        } catch (error) {
            console.error('Failed to initiate call:', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    },

    async acceptCall(roomName: string, callerEmail: string, calleeEmail: string, type: 'video' | 'voice' = 'video'): Promise<CallResponse> {
        try {
            const notification = {
                callerEmail: callerEmail,
                calleeEmail: calleeEmail,
                timeInitiated: Date.now(),
                duration: 0,
                roomName: roomName,
                status: 'accepted',
                type: type
            };

            await axios.post(`${API_BASE_URL}/call-notifications/accepted`, notification);

            return {
                callerEmail: callerEmail,
                calleeEmail: calleeEmail,
                timeInitiated: Date.now(),
                duration: 0,
                roomName: roomName,
                status: 'accepted',
                type: type
            };
        } catch (error) {
            console.error('Error accepting call:', error);
            throw error;
        }
    },

    async declineCall(roomName: string, callerEmail: string, calleeEmail: string, type: 'video' | 'voice' = 'voice'): Promise<void> {
        try {
            const notification = {
                callerEmail: callerEmail,
                calleeEmail: calleeEmail,
                timeInitiated: Date.now(),
                duration: 0,
                roomName: roomName,
                status: 'declined',
                type: type
            };

            await axios.post(`${API_BASE_URL}/call-notifications/declined`, notification);
        } catch (error) {
            console.error('Error declining call:', error);
            throw error;
        }
    },

    async endCall(roomName: string, callerEmail: string, calleeEmail: string, timeInitiated: number, type: 'video' | 'voice' = 'voice'): Promise<void> {
        try {
            const notification = {
                callerEmail: callerEmail,
                calleeEmail: calleeEmail,
                timeInitiated: timeInitiated,
                duration: 0,
                roomName: roomName,
                status: 'ended',
                type: type
            };

            await axios.post(`${API_BASE_URL}/call-notifications/ended`, notification);
        } catch (error) {
            console.error('Error ending call:', error);
            throw error;
        }
    },

    async getCallHistory(userEmail: string): Promise<CallResponse[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/call-notifications/history/${encodeURIComponent(userEmail)}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching call history:', error);
            return [];
        }
    },

    async getPendingCalls(userEmail: string): Promise<CallResponse[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/call-notifications/pending/${encodeURIComponent(userEmail)}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching pending calls:', error);
            return [];
        }
    }
};

// Twilio Video service functions
export const twilioVideoService = {
    /**
     * Get access token for Twilio Video room
     */
    async getAccessToken(identity: string, roomName: string): Promise<string> {
        try {
            console.log('Getting access token');

            const response = await axios.post(`${API_BASE_URL}/twilio-video/token`, {
                identity,
                roomName
            });

            console.log('Access token received');
            return response.data.token;
        } catch (error) {
            console.error('Failed to get access token:', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    },

    /**
     * Create Twilio Video room
     */
    async createRoom(roomName: string, roomType: string = 'peer-to-peer'): Promise<any> {
        try {
            console.log('Creating room');

            const response = await axios.post(`${API_BASE_URL}/twilio-video/room`, {
                roomName,
                roomType
            });

            console.log('Room created');
            return response.data;
        } catch (error) {
            console.error('Failed to create room:', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    },

    /**
     * End Twilio Video room
     */
    async endRoom(roomName: string): Promise<void> {
        try {
            console.log('Ending room');

            await axios.post(`${API_BASE_URL}/twilio-video/room/${roomName}/end`);
            console.log('Room ended');
        } catch (error) {
            console.error('Failed to end room:', error instanceof Error ? error.message : 'Unknown error');
            // Don't throw error - room ending is not critical
        }
    }
};

// Twilio Video Call class
export class TwilioVideoCall {
    private room: any = null;
    private localTracks: any[] = [];
    private callType: 'video' | 'voice';
    private roomName: string;
    private userEmail: string;
    private onRemoteParticipant?: (participant: any) => void;
    private onConnectionStateChange?: (state: string) => void;
    private onLocalTracks?: (tracks: any[]) => void;
    private preGeneratedToken?: string;

    constructor(
        callType: 'video' | 'voice',
        roomName: string,
        userEmail: string,
        onRemoteParticipant?: (participant: any) => void,
        onConnectionStateChange?: (state: string) => void,
        onLocalTracks?: (tracks: any[]) => void,
        preGeneratedToken?: string
    ) {
        this.callType = callType;
        this.roomName = roomName;
        this.userEmail = userEmail;
        this.onRemoteParticipant = onRemoteParticipant;
        this.onConnectionStateChange = onConnectionStateChange;
        this.onLocalTracks = onLocalTracks;
        this.preGeneratedToken = preGeneratedToken;
    }

    async initialize(): Promise<void> {
        try {
            // Check if Twilio Video SDK is loaded
            if (typeof window === 'undefined' || !(window as any).Twilio?.Video) {
                throw new Error('Twilio Video SDK not loaded');
            }

            const Video = (window as any).Twilio.Video;

            // Create local tracks based on call type
            const trackOptions = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: this.callType === 'video' ? {
                    width: 640,
                    height: 480,
                    frameRate: 30
                } : false
            };

            // Create local tracks
            this.localTracks = await Video.createLocalTracks(trackOptions);

            // Notify about local tracks
            if (this.onLocalTracks) {
                this.onLocalTracks(this.localTracks);
            }

            if (this.onConnectionStateChange) {
                this.onConnectionStateChange('initialized');
            }

        } catch (error) {
            console.error('Failed to initialize Twilio Video:', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    async joinRoom(): Promise<void> {
        try {
            if (this.onConnectionStateChange) {
                this.onConnectionStateChange('connecting');
            }

            // Get access token (use pre-generated if available)
            const token = this.preGeneratedToken || await twilioVideoService.getAccessToken(this.userEmail, this.roomName);

            const Video = (window as any).Twilio.Video;

            // Connect to room with local tracks
            this.room = await Video.connect(token, {
                name: this.roomName,
                tracks: this.localTracks
            });

            // Handle existing participants
            this.room.participants.forEach((participant: any) => {
                this.handleParticipant(participant);
            });

            // Handle new participants joining
            this.room.on('participantConnected', (participant: any) => {
                this.handleParticipant(participant);
            });

            // Handle participants leaving
            this.room.on('participantDisconnected', (participant: any) => {
                this.handleParticipantDisconnected(participant);
            });

            // Handle room disconnection
            this.room.on('disconnected', (room: any, error: any) => {
                if (this.onConnectionStateChange) {
                    this.onConnectionStateChange('disconnected');
                }
            });

            if (this.onConnectionStateChange) {
                this.onConnectionStateChange('connected');
            }

        } catch (error) {
            console.error('Failed to join Twilio Video room:', error instanceof Error ? error.message : 'Unknown error');
            if (this.onConnectionStateChange) {
                this.onConnectionStateChange('failed');
            }
            throw error;
        }
    }

    private handleParticipant(participant: any): void {
        console.log('🎭 Handling participant:', participant.identity);

        // Handle existing tracks
        participant.tracks.forEach((publication: any) => {
            if (publication.isSubscribed) {
                this.handleTrackSubscribed(publication.track, participant);
            }
        });

        // Handle new tracks
        participant.on('trackSubscribed', (track: any) => {
            console.log('📺 Track subscribed:', track.kind, 'from', participant.identity);
            this.handleTrackSubscribed(track, participant);
        });

        // Handle track unsubscribed
        participant.on('trackUnsubscribed', (track: any) => {
            console.log('📺 Track unsubscribed:', track.kind, 'from', participant.identity);
            this.handleTrackUnsubscribed(track, participant);
        });

        // Notify about remote participant
        if (this.onRemoteParticipant) {
            this.onRemoteParticipant(participant);
        }
    }

    private handleParticipantDisconnected(participant: any): void {
        console.log('👋 Cleaning up participant:', participant.identity);
        // Cleanup will be handled by track unsubscribed events
    }

    private handleTrackSubscribed(track: any, participant: any): void {
        console.log(`📺 Attaching ${track.kind} track from ${participant.identity}`);

        // The track will be attached to DOM elements in the component
        // This method just logs for now - actual attachment happens in component
    }

    private handleTrackUnsubscribed(track: any, participant: any): void {
        console.log(`📺 Detaching ${track.kind} track from ${participant.identity}`);

        // Track cleanup will be handled in the component
    }

    getLocalTracks(): any[] {
        return this.localTracks;
    }

    getRoom(): any {
        return this.room;
    }

    toggleVideo(): boolean {
        const videoTrack = this.localTracks.find(track => track.kind === 'video');
        if (videoTrack) {
            if (videoTrack.isEnabled) {
                videoTrack.disable();
            } else {
                videoTrack.enable();
            }
            console.log(`📹 Video ${videoTrack.isEnabled ? 'enabled' : 'disabled'}`);
            return videoTrack.isEnabled;
        }
        return false;
    }

    toggleAudio(): boolean {
        const audioTrack = this.localTracks.find(track => track.kind === 'audio');
        if (audioTrack) {
            if (audioTrack.isEnabled) {
                audioTrack.disable();
            } else {
                audioTrack.enable();
            }
            console.log(`🎤 Audio ${audioTrack.isEnabled ? 'enabled' : 'disabled'}`);
            return audioTrack.isEnabled;
        }
        return false;
    }

    async disconnect(): Promise<void> {
        console.log('🔌 Disconnecting from Twilio Video room');

        // Stop local tracks
        this.localTracks.forEach(track => {
            track.stop();
            console.log(`⏹️ Stopped ${track.kind} track`);
        });

        // Disconnect from room
        if (this.room) {
            this.room.disconnect();
            this.room = null;
        }

        // End room on server
        try {
            await twilioVideoService.endRoom(this.roomName);
        } catch (error) {
            console.error('Failed to end room on server:', error);
        }

        console.log('✅ Twilio Video cleanup completed');
    }
}