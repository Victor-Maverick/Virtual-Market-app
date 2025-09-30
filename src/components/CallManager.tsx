'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePusherCall } from '../hooks/usePusherCall';
import WebRTCCallModal from './WebRTCCallModal';
import IncomingCallModal from './IncomingCallModal';

interface CallManagerProps {
  children?: React.ReactNode;
}

const CallManager: React.FC<CallManagerProps> = ({ children }) => {
  const { data: session } = useSession();
  const {
    incomingCall,
    currentCall,
    acceptCall,
    declineCall,
    endCall,
    dismissIncomingCall
  } = usePusherCall();

  const [showIncomingModal, setShowIncomingModal] = useState(false);

  // Handle incoming call notifications
  useEffect(() => {
    if (incomingCall && !currentCall) {
      setShowIncomingModal(true);
      // Play incoming call sound only when showing the modal
      if (typeof window !== 'undefined') {
        import('../utils/audioUtils').then(({ AudioUtils }) => {
          AudioUtils.playIncomingCallSound();
        });
      }
    } else {
      setShowIncomingModal(false);
      // Stop incoming call sound when hiding the modal
      if (typeof window !== 'undefined') {
        import('../utils/audioUtils').then(({ AudioUtils }) => {
          AudioUtils.stopIncomingCallSound();
        });
      }
    }
  }, [incomingCall, currentCall]);

  const handleAcceptCall = async () => {
    if (incomingCall) {
      try {
        // Stop all notification sounds when accepting
        if (typeof window !== 'undefined') {
          import('../utils/audioUtils').then(({ AudioUtils }) => {
            AudioUtils.stopIncomingCallSound();
            AudioUtils.stopRingbackSound();
          });
        }
        await acceptCall(incomingCall.roomName);
        setShowIncomingModal(false);
      } catch (error) {
        console.error('Failed to accept call:', error);
      }
    }
  };

  const handleDeclineCall = async () => {
    if (incomingCall) {
      try {
        // Stop all notification sounds when declining
        if (typeof window !== 'undefined') {
          import('../utils/audioUtils').then(({ AudioUtils }) => {
            AudioUtils.stopIncomingCallSound();
            AudioUtils.stopRingbackSound();
          });
        }
        await declineCall(incomingCall.roomName);
        setShowIncomingModal(false);
        dismissIncomingCall();
      } catch (error) {
        console.error('Failed to decline call:', error);
      }
    }
  };

  const handleEndCall = async () => {
    if (currentCall) {
      try {
        await endCall(currentCall.roomName);
      } catch (error) {
        console.error('Failed to end call:', error);
      }
    }
  };

  const handleCloseCallModal = () => {
    // End the call when modal is closed
    if (currentCall) {
      handleEndCall();
    }
    
    // Route back to previous location if on call page
    if (typeof window !== 'undefined' && window.location.pathname === '/call') {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    }
  };



  if (!session?.user?.email) {
    return <>{children}</>;
  }

  return (
      <>
        {children}

        {/* Incoming Call Modal */}
        {showIncomingModal && incomingCall && (
            <IncomingCallModal
                isOpen={showIncomingModal}
                call={incomingCall}
                onAccept={handleAcceptCall}
                onDecline={handleDeclineCall}
                onClose={() => {
                  setShowIncomingModal(false);
                  dismissIncomingCall();
                }}
            />
        )}

        {/* Active Call Modal */}
        {currentCall && (
            <WebRTCCallModal
                isOpen={!!currentCall}
                call={currentCall}
                isInitiator={currentCall.callerEmail === session.user.email}
                onClose={handleCloseCallModal}
            />
        )}
      </>
  );
};

export default CallManager;