import React from 'react';
import { useSocket, type SocketMessage, type SocketEvents } from '@/hooks/useSocket';
import type { ChatMessage, TypingState, ConnectionState } from '@/types/chat';

export const useChat = () => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [typingState, setTypingState] = React.useState<TypingState>({ isTyping: false });
  const [connectionState, setConnectionState] = React.useState<ConnectionState>({
    status: 'disconnected',
    conversationId: null,
    agentPresent: false,
  });
  const [conversationStarted, setConversationStarted] = React.useState(false);

  // Socket event handlers
  const socketEvents: SocketEvents = {
    onConnected: (data) => {
      setConnectionState(prev => ({ ...prev, status: 'connected' }));
    },
    
    onConversationStarted: (data) => {
      setConnectionState(prev => ({ 
        ...prev, 
        conversationId: data.conversationId 
      }));
      setConversationStarted(true);
    },
    
    onMessage: (socketMessage: SocketMessage) => {
      const newMessage: ChatMessage = {
        id: socketMessage.id || Date.now().toString(),
        role: socketMessage.sender === 'user' ? 'user' : socketMessage.sender === 'agent' ? 'agent' : 'assistant',
        content: socketMessage.content,
        timestamp: socketMessage.timestamp || new Date(),
        sender: socketMessage.sender,
        conversationId: socketMessage.conversationId,
      };
      
      setMessages(prev => [...prev, newMessage]);
      setIsLoading(false);
    },
    
    onTyping: (data) => {
      setTypingState({ 
        isTyping: data.isTyping, 
        sender: data.sender 
      });
    },
    
    onAgentTyping: (data) => {
      setTypingState({ 
        isTyping: data.isTyping, 
        agentName: data.agentName 
      });
    },
    
    onAgentJoined: (data) => {
      setConnectionState(prev => ({ ...prev, agentPresent: true }));
      
      // Add system message about agent joining
      const systemMessage: ChatMessage = {
        id: `agent-joined-${Date.now()}`,
        role: 'assistant',
        content: `${data.agentName} has joined the conversation and will assist you.`,
        timestamp: new Date(),
        sender: 'ai',
      };
      setMessages(prev => [...prev, systemMessage]);
    },
    
    onConversationEnded: (data) => {
      setConnectionState(prev => ({ 
        ...prev, 
        conversationId: null, 
        agentPresent: false 
      }));
      setConversationStarted(false);
      
      // Add system message about conversation ending
      const systemMessage: ChatMessage = {
        id: `conversation-ended-${Date.now()}`,
        role: 'assistant',
        content: 'The conversation has been ended. Thank you for chatting with us!',
        timestamp: new Date(),
        sender: 'ai',
      };
      setMessages(prev => [...prev, systemMessage]);
    },
    
    onStatusChange: (status) => {
      console.log('Status change:', status);
    },
    
    onQueueUpdate: (data) => {
      setConnectionState(prev => ({ 
        ...prev, 
        queuePosition: data.position 
      }));
    },
    
    onAiAnalysisResult: (result) => {
      console.log('AI Analysis Result:', result);
    },
    
    onConversationSummary: (summary) => {
      console.log('Conversation Summary:', summary);
    },
    
    onConversationMetadataUpdated: (metadata) => {
      console.log('Metadata Updated:', metadata);
    },
    
    onConversationTransferred: (data) => {
      const systemMessage: ChatMessage = {
        id: `transferred-${Date.now()}`,
        role: 'assistant',
        content: 'Your conversation has been transferred to another agent.',
        timestamp: new Date(),
        sender: 'ai',
      };
      setMessages(prev => [...prev, systemMessage]);
    },
    
    onDisconnect: (reason) => {
      setConnectionState(prev => ({ 
        ...prev, 
        status: 'disconnected',
        conversationId: null,
        agentPresent: false
      }));
      setConversationStarted(false);
    },
    
    onError: (error) => {
      setConnectionState(prev => ({ ...prev, status: 'error' }));
      console.error('Socket error:', error);
    },
  };

  // Initialize socket connection
  const {
    isConnected,
    conversationId,
    connectionStatus,
    joinConversation,
    sendMessage,
    setTyping,
    requestAiAnalysis,
    rateConversation,
    endConversation,
    updateConversationMetadata,
    requestConversationSummary,
    disconnect,
  } = useSocket(socketEvents);

  

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Send typing indicator (try even without conversationId)
    if (e.target.value.trim() && isConnected) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isConnected) return;
    
    // If conversation hasn't started yet, try to start it but don't wait
    if (!conversationId && !conversationStarted) {
      console.log('🚀 Starting conversation before sending message...');
      joinConversation(); // No sessionId needed
      setConversationStarted(true); // Set this to true so we don't keep trying
    }

    const messageContent = input.trim();
    
    setInput('');
    setIsLoading(true);
    
    // Stop typing indicator
    setTyping(false);

    try {
      // Send message through WebSocket - backend will echo it back
      sendMessage(messageContent);
      
      console.log('💬 Message sent, waiting for backend response...');
      
      // Optional: Request AI analysis for the message
      if (Math.random() > 0.7) { // 30% chance to request analysis
        setTimeout(() => {
          requestAiAnalysis(messageContent, 'intent');
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error while sending your message.',
          timestamp: new Date(),
          sender: 'ai',
        },
      ]);
      setIsLoading(false);
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleThumbsUp = (messageId: string) => {
    // Rate the conversation positively
    if (conversationId) {
      rateConversation(5, 'Helpful response');
    }
    console.log('Thumbs up for message:', messageId);
  };

  const handleThumbsDown = (messageId: string) => {
    // Rate the conversation negatively
    if (conversationId) {
      rateConversation(2, 'Not helpful');
    }
    console.log('Thumbs down for message:', messageId);
  };

  const handleRegenerate = async (messageId: string) => {
    // For WebSocket implementation, we can resend the previous user message
    const messageIndex = messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex > 0 && !isLoading) {
      const previousUserMessage = messages[messageIndex - 1];
      
      if (previousUserMessage && previousUserMessage.role === 'user') {
        // Remove the assistant message we want to regenerate
        const updatedMessages = messages.slice(0, messageIndex);
        setMessages(updatedMessages);
        setIsLoading(true);

        try {
          // Resend the previous user message
          sendMessage(previousUserMessage.content);
        } catch (error) {
          console.error('Error regenerating response:', error);
          setIsLoading(false);
        }
      }
    }
  };

  const handleEndConversation = () => {
    if (conversationId) {
      endConversation();
    }
  };

  return {
    // State
    messages,
    input,
    isLoading,
    typingState,
    connectionState,
    conversationStarted,
    isConnected,
    conversationId,
    connectionStatus,
    
    // Actions
    handleInputChange,
    handleSubmit,
    handleCopy,
    handleThumbsUp,
    handleThumbsDown,
    handleRegenerate,
    handleEndConversation,
    setInput,
  };
};
