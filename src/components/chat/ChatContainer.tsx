import React from 'react';
import { ChatBubble } from './ChatBubble';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { useChat } from '@/hooks/useChat';

export const ChatContainer: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  
  const {
    messages,
    input,
    isLoading,
    typingState,
    connectionState,
    conversationStarted,
    isConnected,
    conversationId,
    connectionStatus,
    handleInputChange,
    handleSubmit,
    handleCopy,
    handleThumbsUp,
    handleThumbsDown,
    handleRegenerate,
  } = useChat();

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className='relative w-full h-screen bg-background'>
      {/* Chat Bubble Toggle - Fixed in bottom right */}
      <ChatBubble 
        isChatOpen={isChatOpen}
        onToggle={toggleChat}
        hasUnreadMessages={messages.length > 0}
      />

      {/* Chat Interface - Floating above bubble */}
      {isChatOpen && (
        <div className='fixed bottom-24 right-6 z-40 max-w-96 w-full h-[600px]  max-h-[80vh] animate-in slide-in-from-bottom-4 duration-300'>
          <div className='w-full h-full overflow-hidden border shadow-xl border-gray-300 rounded-2xl bg-white flex flex-col'>
            {/* Enhanced Header with Connection Status */}
            <ChatHeader 
              connectionStatus={connectionStatus}
              connectionState={connectionState}
              conversationId={conversationId}
              conversationStarted={conversationStarted}
              onClose={toggleChat}
            />

            {/* Conversation Area */}
            <ChatMessages 
              messages={messages}
              typingState={typingState}
              isLoading={isLoading}
              connectionStatus={connectionStatus}
              onCopy={handleCopy}
              onThumbsUp={handleThumbsUp}
              onThumbsDown={handleThumbsDown}
              onRegenerate={handleRegenerate}
            />

            {/* Enhanced Input Area - Fixed at bottom */}
            <ChatInput 
              input={input}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              isConnected={isConnected}
              conversationId={conversationId}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};
