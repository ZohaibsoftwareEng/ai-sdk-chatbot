import React from 'react';
import { useChatbot } from '@/contexts/ChatbotProvider';
import type { ConnectionState } from '@/types/chat';

interface ChatHeaderProps {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  connectionState: ConnectionState;
  conversationId: string | null;
  conversationStarted: boolean;
  onClose?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  connectionStatus,
  connectionState,
  conversationId,
  conversationStarted,
  onClose,
}) => {
  const { chatbot, isLoading: chatbotLoading } = useChatbot();

  return (
    <div
      className='flex items-center justify-between p-4 border-b-0 rounded-t-2xl shadow-sm relative'
      style={{ backgroundColor: chatbot?.ui?.primaryColor || '#0d1bd3' }}
    >
      {/* Background overlay for glassmorphism effect */}
      <div className='absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none rounded-t-2xl' />

      <div className='flex items-center gap-3 z-10'>
        <div
          className='w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/20'
          style={{ backgroundColor: chatbot?.ui?.primaryColor || '#0d1bd3' }}
        >
          <img 
            src={chatbot?.ui?.logoUrl || '/ai-avatar.svg'} 
            alt='Bot logo' 
            className='w-full h-full object-cover'
            onError={(e) => {
              e.currentTarget.src = '/ai-avatar.svg';
            }}
          />
        </div>
        <div>
          <div className='font-semibold text-white text-base'>
            {chatbot?.ui?.displayName || 'Customer Support'}
          </div>
          <div className='text-xs text-white/90 flex items-center gap-1.5'>
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' : 
              connectionStatus === 'connecting' ? 'bg-yellow-400' : 
              connectionStatus === 'error' ? 'bg-red-400' : 'bg-gray-400'
            }`} />
            {connectionStatus === 'connected' ? 'Online' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 
             connectionStatus === 'error' ? 'Error' : 'Offline'}
            
            {/* Additional connection info */}
            {connectionStatus === 'connected' && !conversationId && conversationStarted && (
              <span className='text-yellow-300 ml-1'>
                (Starting chat...)
              </span>
            )}
            {connectionState.agentPresent && (
              <span className='text-blue-300 ml-1'>
                • Agent Online
              </span>
            )}
            {connectionState.queuePosition && (
              <span className='text-yellow-300 ml-1'>
                • Queue: #{connectionState.queuePosition}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {onClose && (
        <button 
          onClick={onClose}
          className='p-1.5 hover:bg-white/10 rounded-full transition-colors z-10'
        >
          <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2'>
            <line x1='18' y1='6' x2='6' y2='18'></line>
            <line x1='6' y1='6' x2='18' y2='18'></line>
          </svg>
        </button>
      )}
    </div>
  );
};
