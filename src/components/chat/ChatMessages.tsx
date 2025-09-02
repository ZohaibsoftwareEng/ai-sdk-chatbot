import React from 'react';
import { MessageCircleIcon, CopyIcon, ThumbsUpIcon, ThumbsDownIcon, RefreshCwIcon } from 'lucide-react';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageAvatar } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { Actions, Action } from '@/components/ai-elements/actions';
import { Tool, ToolHeader, ToolContent } from '@/components/ai-elements/tool';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';
import { CodeBlock } from '@/components/ai-elements/code-block';
import { Loader } from '@/components/ai-elements/loader';
import { useChatbot } from '@/contexts/ChatbotProvider';
import type { ChatMessage, TypingState } from '@/types/chat';
import type { ToolUIPart } from 'ai';

interface ChatMessagesProps {
  messages: ChatMessage[];
  typingState: TypingState;
  isLoading: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  onCopy: (content: string) => void;
  onThumbsUp: (messageId: string) => void;
  onThumbsDown: (messageId: string) => void;
  onRegenerate: (messageId: string) => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  typingState,
  isLoading,
  connectionStatus,
  onCopy,
  onThumbsUp,
  onThumbsDown,
  onRegenerate,
}) => {
  const { chatbot } = useChatbot();

  return (
    <Conversation className='flex-1 overflow-hidden'>
      <ConversationContent>
        {/* Welcome Screen with Suggestions */}
        {messages.length === 0 && (
          <div className='flex h-full flex-col items-center justify-center space-y-8'>
            <div className='text-center space-y-2'>
              <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
                <MessageCircleIcon className='h-8 w-8 text-primary' />
              </div>
              <h2 className='text-2xl font-semibold'>
                {connectionStatus === 'connected' ? 'Start a conversation' : 'Connecting to support...'}
              </h2>
              <p className='text-muted-foreground max-w-md'>
                {connectionStatus === 'connected' 
                  ? 'Choose from the suggestions below or type your own question to get started'
                  : 'Please wait while we connect you to our support system'
                }
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message: ChatMessage) => (
          <div key={message.id} className='w-full group'>
            <Message 
              from={message.role === 'agent' ? 'assistant' : message.role}
              className={message.role === 'user' ? 'user-message' : 'bot-message'}
            >
              {(message.role === 'assistant' || message.role === 'agent') && (
                <MessageAvatar 
                  src={chatbot?.ui?.logoUrl || '/ai-avatar.svg'} 
                  name="AI"
                />
              )}
              <MessageContent
                className={message.role === 'user' ? 'user-message-content' : 'bot-message-content'}
                style={{
                  backgroundColor: message.role === 'user' 
                    ? (chatbot?.ui?.primaryColor || '#0d1bd3')
                    : (chatbot?.ui?.botColor || '#f3f4f6'),
                  color: message.role === 'user' ? 'white' : 'inherit'
                }}
              >
                {message.role === 'user' ? (
                  <div>{message.content}</div>
                ) : (
                  <div className='space-y-4'>
                    {/* Reasoning Section */}
                    {message.reasoning && (
                      <Reasoning defaultOpen={false}>
                        <ReasoningTrigger>Thinking process</ReasoningTrigger>
                        <ReasoningContent>{message.reasoning}</ReasoningContent>
                      </Reasoning>
                    )}

                    {/* Tool Usage */}
                    {message.tools?.map((tool, index) => (
                      <Tool key={index}>
                        <ToolHeader type={`tool-${tool.name}` as ToolUIPart['type']} state={tool.state} />
                        <ToolContent>
                          {tool.input && (
                            <div className='p-4'>
                              <h4 className='text-sm font-medium mb-2'>Input:</h4>
                              <CodeBlock code={JSON.stringify(tool.input, null, 2)} language='json' />
                            </div>
                          )}
                          {tool.output && (
                            <div className='p-4 border-t'>
                              <h4 className='text-sm font-medium mb-2'>Output:</h4>
                              <CodeBlock code={JSON.stringify(tool.output, null, 2)} language='json' />
                            </div>
                          )}
                        </ToolContent>
                      </Tool>
                    ))}

                    {/* Main Response */}
                    <Response>{message.content}</Response>
                  </div>
                )}
              </MessageContent>
              {message.role === 'user' && <MessageAvatar src='/user-avatar.svg' name='You' />}
            </Message>

            {/* Actions - Outside message and right-aligned for assistant/agent messages */}
            {(message.role === 'assistant' || message.role === 'agent') && (
              <div className='flex justify-start pr-10 -mt-2 pl-10'>
                <Actions className='opacity-50 group-hover:opacity-100 transition-opacity'>
                  <Action tooltip='Copy message' onClick={() => onCopy(message.content)}>
                    <CopyIcon className='h-4 w-4' />
                  </Action>
                  <Action tooltip='Good response' onClick={() => onThumbsUp(message.id)}>
                    <ThumbsUpIcon className='h-4 w-4' />
                  </Action>
                  <Action tooltip='Bad response' onClick={() => onThumbsDown(message.id)}>
                    <ThumbsDownIcon className='h-4 w-4' />
                  </Action>
                  <Action tooltip='Regenerate response' onClick={() => onRegenerate(message.id)} disabled={isLoading}>
                    <RefreshCwIcon className='h-4 w-4' />
                  </Action>
                </Actions>
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicators */}
        {typingState.isTyping && (
          <Message from='assistant'>
            <MessageAvatar 
              src={chatbot?.ui?.logoUrl || '/ai-avatar.svg'} 
              name="AI"
            />
            <MessageContent
              className='bot-message-content'
              style={{
                backgroundColor: chatbot?.ui?.botColor || '#f3f4f6',
                color: 'inherit'
              }}
            >
              <div className='flex items-center gap-2 text-muted-foreground'>
                <Loader className='h-4 w-4' />
                <span className='text-sm'>
                  {typingState.agentName 
                    ? `${typingState.agentName} is typing...`
                    : typingState.sender === 'agent' 
                      ? 'Agent is typing...'
                      : 'AI is typing...'
                  }
                </span>
              </div>
            </MessageContent>
          </Message>
        )}

        {/* Loading Indicator */}
        {isLoading && !typingState.isTyping && (
          <Message from='assistant'>
            <MessageAvatar src={chatbot?.ui?.logoUrl || '/ai-avatar.svg'} name="AI" />
            <MessageContent
              className='bot-message-content'
              style={{
                backgroundColor: chatbot?.ui?.botColor || '#f3f4f6',
                color: 'inherit'
              }}
            >
              <Loader className='h-4 w-4' />
            </MessageContent>
          </Message>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
};
