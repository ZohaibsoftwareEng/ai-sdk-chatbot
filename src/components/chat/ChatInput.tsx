import React from "react";
import { PlusIcon, MicIcon } from "lucide-react";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputButton,
} from "@/components/ai-elements/prompt-input";
import { useChatbot } from "@/contexts/ChatbotProvider";

interface ChatInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isConnected: boolean;
  conversationId: string | null;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  onInputChange,
  onSubmit,
  isConnected,
  conversationId,
  isLoading,
}) => {
  const { chatbot } = useChatbot();
  return (
    <div className="border-t bg-background p-4 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        {chatbot?.routing?.escalationEnabled && (
          <button className="text-blue-600 text-xs font-medium flex items-center gap-1 hover:text-blue-700 transition-colors">
            🎧 Talk to Human Agent
          </button>
        )}
        <button className="text-gray-500 hover:text-gray-700 transition-colors ml-auto">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7,10 12,15 17,10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
      </div>
      <PromptInput onSubmit={onSubmit} className="relative">
        <PromptInputTextarea
          value={input}
          onChange={onInputChange}
          placeholder={
            !isConnected
              ? "Connecting to support..."
              : conversationId
              ? "Type your message here.."
              : "Connected! Type your message to start chatting..."
          }
          disabled={!isConnected}
          className="min-h-[48px] max-h-[120px]"
        />
        <PromptInputToolbar>
          <PromptInputTools>
            <PromptInputButton>
              <PlusIcon size={16} />
            </PromptInputButton>
            <PromptInputButton>
              <MicIcon size={16} />
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit
            disabled={!input.trim() || !isConnected}
            status={isLoading ? "streaming" : undefined}
          />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
};
