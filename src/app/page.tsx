'use client';

import React from 'react';
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputButton,
} from '@/components/ai-elements/prompt-input';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageAvatar } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion';
import { Actions, Action } from '@/components/ai-elements/actions';
import { Tool, ToolHeader, ToolContent } from '@/components/ai-elements/tool';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';
import { CodeBlock } from '@/components/ai-elements/code-block';
import { CopyIcon, ThumbsUpIcon, ThumbsDownIcon, RefreshCwIcon, SparklesIcon, MessageCircleIcon, MicIcon, PlusIcon } from 'lucide-react';
import { Loader } from '@/components/ai-elements/loader';
import { getRandomJoke } from '@/lib/joke-tool';
import type { ToolUIPart } from 'ai';

// Type for JSON-serializable data
type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reasoning?: string;
  tools?: Array<{
    type: string;
    state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
    name: string;
    input?: JsonValue;
    output?: JsonValue;
  }>;
}

const predefinedSuggestions = [
  'Tell me a programming joke',
  'Tell me an animal joke',
  'Tell me a general joke',
  'Explain quantum computing',
  'Write a Python function',
  'Help me debug this code',
];

export default function Page() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isStreamingComplete, setIsStreamingComplete] = React.useState(true);
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  // Helper function to detect joke requests and simulate tool usage
  const detectJokeRequest = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('programming joke')) return 'programming';
    if (lowerMessage.includes('animal joke')) return 'animals';
    if (lowerMessage.includes('general joke') || lowerMessage.includes('joke')) return 'general';
    return null;
  };

  const simulateJokeTool = async (topic: string): Promise<ChatMessage> => {
    const jokeResult = await getRandomJoke(topic);
    
    return {
      id: Date.now().toString() + '_tool',
      role: 'assistant',
      content: `Here's a ${jokeResult.topic} joke for you:\n\n"${jokeResult.joke}"`,
      timestamp: new Date(),
      reasoning: `I detected you wanted a ${topic} joke, so I used my joke tool to find one for you.`,
      tools: [{
        type: 'joke-generator',
        name: 'get-random-joke',
        state: 'output-available' as const,
        input: { topic: topic },
        output: jokeResult as unknown as JsonValue
      }]
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isStreamingComplete) return; // Use isStreamingComplete instead of isLoading

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    
    // Check if this is a joke request
    const jokeType = detectJokeRequest(input);
    
    setInput('');
    setIsLoading(true);
    setIsStreamingComplete(false);

    if (jokeType) {
      // Handle joke request with our dummy tool
      try {
        const jokeMessage = await simulateJokeTool(jokeType);
        setMessages((prev) => [...prev, jokeMessage]);
        setIsLoading(false);
        setIsStreamingComplete(true);
        return;
      } catch (error) {
        console.error('Error generating joke:', error);
        // Fall through to regular chat API
      }
    }

    // Regular chat API handling
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        // reasoning:
        //   Math.random() > 0.5 ? 'Let me analyze your request and provide a comprehensive response with examples and practical guidance.' : undefined,
        // tools:
        //   Math.random() > 0.7
        //     ? [
        //         {
        //           type: 'search',
        //           name: 'knowledge-search',
        //           state: 'output-available' as const,
        //           input: { query: input.slice(0, 50) },
        //           output: { results: 'Found relevant information in knowledge base' },
        //         },
        //       ]
        //     : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        let isFirstChunk = true;
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Stream is complete, enable submit button
            setIsStreamingComplete(true);
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((line) => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  if (isFirstChunk) {
                    setIsLoading(false); // Hide loading indicator on first chunk
                    isFirstChunk = false;
                  }
                  assistantMessage.content += parsed.content;
                  setMessages((prev) => prev.map((msg) => (msg.id === assistantMessage.id ? { ...msg, content: assistantMessage.content } : msg)));
                }
              } catch {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your request.',
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
      setIsStreamingComplete(true); // Re-enable submit on error
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
    // In a real app, you'd send feedback to your analytics/feedback system
    console.log('Thumbs up for message:', messageId);
  };

  const handleThumbsDown = (messageId: string) => {
    // In a real app, you'd send feedback to your analytics/feedback system
    console.log('Thumbs down for message:', messageId);
  };

  const handleRegenerate = async (messageId: string) => {
    // Remove the assistant message and regenerate response
    const messageIndex = messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex > 0 && !isLoading && isStreamingComplete) {
      // const previousUserMessage = messages[messageIndex - 1]; // Not currently used

      // Remove the assistant message we want to regenerate
      const updatedMessages = messages.slice(0, messageIndex);
      setMessages(updatedMessages);

      // Start loading state
      setIsLoading(true);
      setIsStreamingComplete(false);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: updatedMessages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          // reasoning:
          //   Math.random() > 0.5
          //     ? 'Let me analyze your request and provide a comprehensive response with examples and practical guidance.'
          //     : undefined,
          // tools:
          //   Math.random() > 0.7
          //     ? [
          //         {
          //           type: 'search',
          //           name: 'knowledge-search',
          //           state: 'output-available' as const,
          //           input: { query: previousUserMessage.content.slice(0, 50) },
          //           output: { results: 'Found relevant information in knowledge base' },
          //         },
          //       ]
          //     : undefined,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (reader) {
          let isFirstChunk = true;
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // Stream is complete, enable submit button
              setIsStreamingComplete(true);
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter((line) => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    if (isFirstChunk) {
                      setIsLoading(false); // Hide loading indicator on first chunk
                      isFirstChunk = false;
                    }
                    assistantMessage.content += parsed.content;
                    setMessages((prev) => prev.map((msg) => (msg.id === assistantMessage.id ? { ...msg, content: assistantMessage.content } : msg)));
                  }
                } catch {
                  // Ignore parsing errors for incomplete chunks
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Sorry, I encountered an error while processing your request.',
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        setIsStreamingComplete(true); // Re-enable submit on error
      }
    }
  };

  return (
    <div className='flex h-screen justify-center items-center flex-col bg-background w-full p-4'>
      <div className='w-full max-w-lg overflow-hidden border shadow-sm border-gray-500 rounded-2xl h-[calc(100vh-48px)] flex flex-col'>
        {/* Enhanced Header with Model Selection */}
        <div className='border-b bg-slate-900 text-white p-6 flex-shrink-0'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='flex items-center gap-2 text-xl font-semibold'>
                <SparklesIcon className='h-5 w-5 text-white' />
                AI Chatbot
              </h1>
              <p className='text-sm text-muted-foreground'>Ask me anything and I&apos;ll help you out!</p>
            </div>
          </div>
        </div>

        {/* Conversation Area */}
        <Conversation className='flex-1 overflow-hidden'>
          <ConversationContent>
            {/* Welcome Screen with Suggestions */}
            {messages.length === 0 && (
              <div className='flex h-full flex-col items-center justify-center space-y-8'>
                <div className='text-center space-y-2'>
                  <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
                    <MessageCircleIcon className='h-8 w-8 text-primary' />
                  </div>
                  <h2 className='text-2xl font-semibold'>Start a conversation</h2>
                  <p className='text-muted-foreground max-w-md'>Choose from the suggestions below or type your own question to get started</p>
                </div>

                {/* Suggestion Pills */}
                <div className='w-full max-w-2xl'>
                  <h3 className='mb-4 text-sm font-medium text-muted-foreground'>Try asking about:</h3>
                  <Suggestions className='flex-wrap flex-row overflow-visible w-full max-w-full'>
                    {predefinedSuggestions.map((suggestion, index) => (
                      <Suggestion key={index} suggestion={suggestion} onClick={handleSuggestionClick} className='whitespace-nowrap'>
                        {suggestion}
                      </Suggestion>
                    ))}
                  </Suggestions>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message: ChatMessage) => (
              <div key={message.id} className='w-full group'>
                <Message from={message.role}>
                  {message.role === 'assistant' && <MessageAvatar src='/ai-avatar.svg' name='AI' />}
                  <MessageContent>
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

                {/* Actions - Outside message and right-aligned for assistant messages */}
                {message.role === 'assistant' && (
                  <div className='flex justify-start pr-10 -mt-2 pl-10'>
                    <Actions className='opacity-50 group-hover:opacity-100 transition-opacity'>
                      <Action tooltip='Copy message' onClick={() => handleCopy(message.content)}>
                        <CopyIcon className='h-4 w-4' />
                      </Action>
                      <Action tooltip='Good response' onClick={() => handleThumbsUp(message.id)}>
                        <ThumbsUpIcon className='h-4 w-4' />
                      </Action>
                      <Action tooltip='Bad response' onClick={() => handleThumbsDown(message.id)}>
                        <ThumbsDownIcon className='h-4 w-4' />
                      </Action>
                      <Action tooltip='Regenerate response' onClick={() => handleRegenerate(message.id)} disabled={!isStreamingComplete || isLoading}>
                        <RefreshCwIcon className='h-4 w-4' />
                      </Action>
                    </Actions>
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <Message from='assistant'>
                <MessageAvatar src='/ai-avatar.svg' name='AI' />
                <MessageContent>
                  <Loader className='h-4 w-4' />
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Enhanced Input Area - Fixed at bottom */}
        <div className='border-t bg-background p-4 flex-shrink-0'>
          {/* Quick Suggestions (shown when input is focused but empty) */}
          {messages.length > 0 && (
            <div className='pt-3'>
              <Suggestions className='flex-row'>
                {predefinedSuggestions.map((suggestion, index) => (
                  <Suggestion key={index} suggestion={suggestion} onClick={handleSuggestionClick} size='sm'>
                    {suggestion}
                  </Suggestion>
                ))}
              </Suggestions>
            </div>
          )}

          <div className='w-full pt-4'>
            <PromptInput onSubmit={handleSubmit} className='relative'>
              <PromptInputTextarea
                value={input}
                onChange={handleInputChange}
                placeholder='Type your message here..'
                disabled={!isStreamingComplete} // Disable during streaming
                className='min-h-[48px] max-h-[120px]'
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
                <PromptInputSubmit disabled={!input.trim() || !isStreamingComplete} status={!isStreamingComplete ? 'streaming' : undefined} />
              </PromptInputToolbar>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  );
}
