import React from 'react';
import { MessageCircleIcon } from 'lucide-react';

interface ChatBubbleProps {
  isChatOpen: boolean;
  onToggle: () => void;
  hasUnreadMessages: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  isChatOpen,
  onToggle,
  hasUnreadMessages,
}) => {
  return (
    <div className='fixed bottom-6 right-6 z-50'>
      <button
        onClick={onToggle}
        className={`relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
          isChatOpen 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
        aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
      >
        {isChatOpen ? (
          <svg className="w-6 h-6 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <MessageCircleIcon className="w-6 h-6 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        )}
        
        {/* Notification dot for unread messages */}
        {!isChatOpen && hasUnreadMessages && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white">
            <span className="sr-only">New messages</span>
          </div>
        )}
      </button>
    </div>
  );
};
