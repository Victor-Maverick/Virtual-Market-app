//TwilioVideoCallModal.tsx

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { CallResponse, TwilioVideoCall, webRTCCallService } from '../services/callService';
import { AudioUtils } from '../utils/audioUtils';
import { usePusher } from '../providers/PusherProvider';

interface WebRTCCallModalProps {
  isOpen: boolean;
  call: CallResponse;
  isInitiator: boolean;
  onClose: () => void;
  // accessToken?: string;
}

const WebRTCCallModal: React.FC<WebRTCCallModalProps> = ({
  isOpen,
  call,
  isInitiator,
  onClose
  // accessToken
}) => {
  const { pusher } = usePusher();

  const [isVideoEnabled, setIsVideoEnabled] = useState(call.type === 'video');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>(
    isInitiator ? 'Calling...' : 'Joining call...'
  );
  const [callDuration, setCallDuration] = useState(0);
  const [bothUsersConnected, setBothUsersConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(1); // Start with 1 (current user)

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const twilioCallRef = useRef<TwilioVideoCall | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const twilioScriptLoadedRef = useRef<boolean>(false);

  // const userEmail = isInitiator ? call.callerEmail : call.calleeEmail;

  // Call duration timer - only start when both users are connected
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (bothUsersConnected && callStartTimeRef.current) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current!) / 1000);
        setCallDuration(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [bothUsersConnected]);

  // Load Twilio Video SDK
  useEffect(() => {
    const loadTwilioSDK = () => {
      if (twilioScriptLoadedRef.current || (window as any).Twilio?.Video) {
        twilioScriptLoadedRef.current = true;
        return Promise.resolve();
      }

      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://sdk.twilio.com/js/video/releases/2.15.2/twilio-video.min.js';
        script.onload = () => {
          console.log('✅ Twilio Video SDK loaded');
          twilioScriptLoadedRef.current = true;
          resolve();
        };
        script.onerror = () => {
          console.error('❌ Failed to load Twilio Video SDK');
          reject(new Error('Failed to load Twilio Video SDK'));
        };
        document.head.appendChild(script);
      });
    };

    if (isOpen && call.roomName) {
      loadTwilioSDK().then(() => {
        initializeTwilioVideo();
      }).catch(error => {
        console.error('Failed to load Twilio SDK:', error);
        setConnectionStatus('Failed to load video service');
      });
    }

    return () => {
      cleanup();
      AudioUtils.stopRingbackSound();
      AudioUtils.stopIncomingCallSound();
    };
  }, [isOpen, call.roomName, call.type, isInitiator]);

  // Listen for call status changes
  useEffect(() => {
    if (call.status === 'ended' || call.status === 'declined') {
      console.log('Call ended or declined - closing modal');
      cleanup();
      onClose();
      return;
    }

    if (call.status === 'accepted' && twilioCallRef.current && !bothUsersConnected) {
      console.log('Call accepted - joining Twilio Video room');
      AudioUtils.stopRingbackSound();
      setConnectionStatus('Joining video room...');

      // Join Twilio Video room
      setTimeout(() => {
        if (twilioCallRef.current) {
          twilioCallRef.current.joinRoom().catch(error => {
            console.error('Failed to join Twilio room:', error);
            setConnectionStatus('Failed to join video room');
          });
        }
      }, 500);
    }
  }, [call.status, bothUsersConnected, onClose]);

  // Play ringback sound for caller when call is initiated and waiting for callee
  useEffect(() => {
    if (isInitiator && call.status === 'initiated' && call.roomName && !bothUsersConnected) {
      console.log('Playing ringback sound for caller - waiting for callee to accept');
      AudioUtils.playRingbackSound();
    }
  }, [isInitiator, call.status, call.roomName, bothUsersConnected]);

  const initializeTwilioVideo = async () => {
    try {
      console.log('🎬 Initializing Twilio Video call');
      
      // Set initial status
      if (isInitiator) {
        setConnectionStatus('Waiting for other person to join...');
      } else {
        setConnectionStatus('Preparing to join...');
      }

      // Get current user email and pre-generated token
      const currentUserEmail = isInitiator ? call.callerEmail : call.calleeEmail;
      const preGeneratedToken = isInitiator ? 
        (call as any).callerToken : 
        (call as any).calleeToken;

      console.log('Pre-generated token available:', !!preGeneratedToken);

      // Create Twilio Video call instance
      twilioCallRef.current = new TwilioVideoCall(
        call.type,
        call.roomName,
        currentUserEmail,
        (participant) => {
          // Handle remote participant joining
          console.log('🎭 Remote participant joined:', participant.identity);
          
          // Mark as connected when remote participant joins
          setBothUsersConnected(true);
          setParticipantCount(2);
          callStartTimeRef.current = Date.now();
          setConnectionStatus('Connected');

          // Stop notification sounds
          AudioUtils.stopRingbackSound();
          AudioUtils.stopIncomingCallSound();

          // Handle participant tracks
          participant.tracks.forEach((publication: any) => {
            if (publication.isSubscribed) {
              attachTrack(publication.track, participant);
            }
          });

          // Handle new tracks from this participant
          participant.on('trackSubscribed', (track: any) => {
            console.log('📺 New track from participant:', track.kind);
            attachTrack(track, participant);
          });

          participant.on('trackUnsubscribed', (track: any) => {
            console.log('📺 Track removed from participant:', track.kind);
            detachTrack(track);
          });
        },
        (state: string) => {
          // Handle connection state changes
          console.log('🔗 Twilio connection state:', state);
          if (state === 'connecting') {
            setConnectionStatus('Connecting to video room...');
          } else if (state === 'connected') {
            setConnectionStatus('Connected to video room');
          } else if (state === 'disconnected' || state === 'failed') {
            setBothUsersConnected(false);
            setParticipantCount(1);
            setConnectionStatus('Call ended');
            AudioUtils.stopRingbackSound();
            AudioUtils.stopIncomingCallSound();
          }
        },
        (tracks) => {
          // Handle local tracks
          console.log('🎥 Local tracks created:', tracks.map(track => `${track.kind}: ${track.isEnabled}`));
          
          tracks.forEach(track => {
            if (track.kind === 'video' && call.type === 'video' && localVideoRef.current) {
              track.attach(localVideoRef.current);
              console.log('📹 Attached local video track');
              setIsVideoEnabled(track.isEnabled);
            }
            
            if (track.kind === 'audio') {
              console.log('🎤 Local audio track ready');
              setIsAudioEnabled(track.isEnabled);
            }
          });
        },
        preGeneratedToken // Pass pre-generated token for instant connection
      );

      // Initialize Twilio Video
      await twilioCallRef.current.initialize();

      // Set appropriate status
      if (isInitiator) {
        setConnectionStatus('Calling...');
        console.log('📞 Caller waiting for callee to accept');
      } else {
        setConnectionStatus('Ready to join...');
        console.log('📱 Callee ready to join');
      }

    } catch (error) {
      console.error('❌ Failed to initialize Twilio Video:', error);
      setConnectionStatus(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper function to attach remote tracks to DOM elements
  const attachTrack = (track: any, participant: any) => {
    console.log(`📺 Attaching ${track.kind} track from ${participant.identity}`);
    
    if (track.kind === 'video' && call.type === 'video' && remoteVideoRef.current) {
      track.attach(remoteVideoRef.current);
      console.log('📹 Attached remote video track - showing OTHER participant');
    } else if (track.kind === 'audio' && remoteAudioRef.current) {
      track.attach(remoteAudioRef.current);
      console.log('🔊 Attached remote audio track - hearing OTHER participant');
    }
  };

  // Helper function to detach tracks
  const detachTrack = (track: any) => {
    console.log(`📺 Detaching ${track.kind} track`);
    track.detach();
  };

  const cleanup = () => {
    if (twilioCallRef.current) {
      twilioCallRef.current.disconnect();
      twilioCallRef.current = null;
    }

    // Stop all call sounds
    AudioUtils.stopRingbackSound();
    AudioUtils.stopIncomingCallSound();

    setCallDuration(0);
    callStartTimeRef.current = null;
    setBothUsersConnected(false);
    setParticipantCount(1);
  };

  const handleEndCall = async () => {
    try {
      // End call on backend
      await webRTCCallService.endCall(
        call.roomName,
        call.callerEmail,
        call.calleeEmail,
        call.timeInitiated,
        call.type
      );

      cleanup();
      onClose();
    } catch (error) {
      console.error('Failed to end call on backend:', error);
      cleanup();
      onClose();
    }
  };

  const toggleVideo = () => {
    if (twilioCallRef.current && call.type === 'video') {
      const enabled = twilioCallRef.current.toggleVideo();
      setIsVideoEnabled(enabled);
    }
  };

  const toggleAudio = () => {
    if (twilioCallRef.current) {
      const enabled = twilioCallRef.current.toggleAudio();
      setIsAudioEnabled(enabled);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg p-3 sm:p-6 w-full max-w-4xl mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-2">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-semibold">
              {call.type === 'video' ? 'Video Call' : 'Voice Call'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 truncate">
              {isInitiator ? call.calleeEmail : call.callerEmail}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              {bothUsersConnected ? (
                <span className="text-green-600 font-medium">
                  ● {participantCount} participant{participantCount !== 1 ? 's' : ''} connected
                </span>
              ) : (
                <span className="text-orange-600">
                  Waiting for connection... ({participantCount} participant{participantCount !== 1 ? 's' : ''})
                </span>
              )}
            </p>
          </div>
          <div className="text-left sm:text-right">
            {/* Only show duration when both users are connected */}
            {bothUsersConnected && callStartTimeRef.current && (
              <p className="text-sm font-mono text-green-600">{formatDuration(callDuration)}</p>
            )}
          </div>
        </div>

        {/* Video Call Interface */}
        {call.type === 'video' && (
          <div className="relative bg-gray-900 rounded-lg mb-3 sm:mb-4 h-48 sm:h-64 md:h-80 lg:h-96">
            {/* Main Video Window - Shows OTHER participant's video (NEVER shows self) */}
            {bothUsersConnected ? (
              <div className="relative w-full h-full">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted={true} // Video element muted to prevent audio feedback - audio comes from separate audio element
                  className="w-full h-full object-cover rounded-lg"
                  onLoadedMetadata={() => console.log('📺 Remote video loaded - showing OTHER participant')}
                  onCanPlay={() => console.log('▶️ Remote video playing - OTHER participant visible')}
                  onError={(e) => console.error('❌ Remote video error:', e)}
                  style={{ display: 'block' }}
                />
                <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 text-xs sm:text-sm text-white bg-black bg-opacity-70 px-2 sm:px-3 py-1 rounded-full">
                  👤 {isInitiator ? call.calleeEmail.split('@')[0] : call.callerEmail.split('@')[0]}
                </div>
                {/* Connection indicator */}
                <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-white bg-black bg-opacity-70 px-2 py-1 rounded">Connected</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-pulse">
                    <Video className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <p className="text-base sm:text-lg">{connectionStatus}</p>
                  <p className="text-xs sm:text-sm mt-2 opacity-75 truncate">
                    Waiting for {isInitiator ? call.calleeEmail.split('@')[0] : call.callerEmail.split('@')[0]}
                  </p>
                  <p className="text-xs mt-2 opacity-60">No audio until both users connect</p>
                </div>
              </div>
            )}

            {/* Small Self-View (Picture-in-Picture) - Shows YOUR own video */}
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 w-20 h-16 sm:w-32 sm:h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted // Always muted - this is YOUR video, you don't hear yourself
                className="w-full h-full object-cover"
                style={{ display: 'block' }}
                onLoadedMetadata={() => console.log('📹 Local video loaded - showing YOUR video')}
              />
              <div className="absolute bottom-0.5 sm:bottom-1 left-0.5 sm:left-1 text-xs text-white bg-black bg-opacity-70 px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                You
              </div>
            </div>
          </div>
        )}

        {/* Voice Call Interface - NO VIDEO ELEMENTS */}
        {call.type === 'voice' && (
          <div className="flex items-center justify-center h-32 sm:h-48 bg-gradient-to-br from-green-50 to-green-100 rounded-lg mb-3 sm:mb-4">
            <div className="text-center px-4">
              <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 ${bothUsersConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400 animate-pulse'
                }`}>
                <Phone className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
              </div>
              <p className="text-lg sm:text-xl font-medium text-gray-800">
                Voice Call
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 truncate">
                📞 {isInitiator ? call.calleeEmail : call.callerEmail}
              </p>
              {/*<p className="text-xs sm:text-sm mt-2 font-medium">*/}
              {/*  {bothUsersConnected ? (*/}
              {/*    <span className="text-green-600">*/}
              {/*      🔊 {participantCount} participant{participantCount !== 1 ? 's' : ''} connected - Audio active*/}
              {/*    </span>*/}
              {/*  ) : (*/}
              {/*    <span className="text-orange-600">*/}
              {/*      🔇 {connectionStatus} - No audio until connected*/}
              {/*    </span>*/}
              {/*  )}*/}
              {/*</p>*/}
              {!bothUsersConnected && (
                <p className="text-xs text-gray-500 mt-1">
                  Waiting for {isInitiator ? call.calleeEmail.split('@')[0] : call.callerEmail.split('@')[0]} to join
                </p>
              )}
            </div>
          </div>
        )}

        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          controls={false}
          muted={false} // NOT muted - this is how you hear the OTHER person
          style={{ display: 'none' }}
          onLoadedData={() => console.log('🎵 Twilio remote audio loaded')}
          onCanPlay={() => console.log('▶️ Twilio remote audio ready')}
          onPlay={() => console.log('🔊 Twilio remote audio playing')}
          onError={(e) => console.error('❌ Twilio remote audio error:', e)}
        />

        {/* Connection Status Display */}
        {!bothUsersConnected && (
          <div className="text-center mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm sm:text-base text-blue-700 font-medium">{connectionStatus}</p>
            <p className="text-xs sm:text-sm text-blue-600 mt-1">
              {isInitiator ? 'Waiting for the other person to join...' : 'Connecting to the call...'}
            </p>
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              <p>Waiting for other participant to connect</p>
            </div>
          </div>
        )}

        {/* Controls - Video toggle only for video calls */}
        <div className="flex justify-center space-x-3 sm:space-x-4">
          {/* Video toggle - ONLY for video calls */}
          {call.type === 'video' && (
            <button
              onClick={toggleVideo}
              className={`p-2 sm:p-3 rounded-full transition-colors ${isVideoEnabled ? 'bg-gray-200 hover:bg-gray-300' : 'bg-red-500 hover:bg-red-600'
                }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? (
                <Video className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              ) : (
                <VideoOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </button>
          )}

          {/* Audio toggle - Available for both video and voice calls */}
          <button
            onClick={toggleAudio}
            className={`p-2 sm:p-3 rounded-full transition-colors ${isAudioEnabled ? 'bg-gray-200 hover:bg-gray-300' : 'bg-red-500 hover:bg-red-600'
              }`}
            title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isAudioEnabled ? (
              <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            ) : (
              <MicOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            )}
          </button>

          {/* End call - Available for both call types */}
          <button
            onClick={handleEndCall}
            className="p-2 sm:p-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            title="End call"
          >
            <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebRTCCallModal;