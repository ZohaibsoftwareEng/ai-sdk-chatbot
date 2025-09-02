'use client';

import React, { createContext, useContext } from 'react';
import { useMachine } from '@xstate/react';
import { chatbotMachine } from '@/machines/chatbotMachine';
import type { Chatbot } from '@/types/chatbot';

// Define the context type
interface ChatbotContextType {
  chatbot: Chatbot | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  isSuccess: boolean;
  isIdle: boolean;
  fetchChatbot: (chatbotId: string) => void;
  retry: () => void;
  reset: () => void;
}

// Create the context
const ChatbotContext = createContext<ChatbotContextType | null>(null);

// Custom hook to use the chatbot context
export const useChatbot = (): ChatbotContextType => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};

// Provider component props
interface ChatbotProviderProps {
  children: React.ReactNode;
  defaultChatbotId?: string;
}

// Provider component
export const ChatbotProvider: React.FC<ChatbotProviderProps> = ({ 
  children, 
  defaultChatbotId = '68b57bb9fe84a4241ee9a6f5' // Default chatbot ID from your example
}) => {
  const [state, send] = useMachine(chatbotMachine, {
    input: { chatbotId: defaultChatbotId }
  });
  console.log("machine state", state);

  // Machine automatically fetches chatbot on start

  // Create context value
  const contextValue: ChatbotContextType = {
    chatbot: state.context.chatbot,
    isLoading: state.matches('loading'),
    isError: state.matches('error'),
    error: state.context.error,
    isSuccess: state.matches('success'),
    isIdle: state.matches('idle'),
    fetchChatbot: (chatbotId: string) => {
      send({ type: 'FETCH_CHATBOT', chatbotId });
    },
    retry: () => {
      send({ type: 'RETRY' });
    },
    reset: () => {
      send({ type: 'RESET' });
    },
  };

  return (
    <ChatbotContext.Provider value={contextValue}>
      {children}
    </ChatbotContext.Provider>
  );
};
