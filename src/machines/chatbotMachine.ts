import { setup, fromPromise } from 'xstate';
import type { Chatbot, ChatbotApiResponse } from '@/types/chatbot';

// Define the context type
interface ChatbotContext {
  chatbot: Chatbot | null;
  error: string | null;
  chatbotId: string;
}

// Define the events
type ChatbotEvent = 
  | { type: 'FETCH_CHATBOT'; chatbotId: string }
  | { type: 'RETRY' }
  | { type: 'RESET' };

// API function to fetch chatbot
const fetchChatbot = async ({ input }: { input: { chatbotId: string } }): Promise<Chatbot> => {
  const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGI1N2IwOWZlODRhNDI0MWVlOWE2ZjAiLCJ0ZW5hbnRJZCI6IjY4YjU3YjA5ZmU4NGE0MjQxZWU5YTZlYyIsImVtYWlsIjoiZjIxYmluc2UzbTAxMDA0QGl1Yi5lZHUucGsiLCJyb2xlIjoiQWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJBTEwiXSwiaWF0IjoxNzU2NzI0MTc5LCJleHAiOjE3NTczMjg5Nzl9.X_DDBmluHus1TvrNx3NdeVMjyim_pcxI3JJwgYhBoHI';
  
  const response = await fetch(`http://localhost:3001/api/v1/ai-support/chatbots/${input.chatbotId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    cache: 'no-cache',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch chatbot: ${response.status} ${response.statusText}`);
  }
  
  const data: ChatbotApiResponse = await response.json();
  
  if (!data.success) {
    throw new Error('API returned unsuccessful response');
  }
  
  return data.data;
};

// Create the XState v5 machine
export const chatbotMachine = setup({
  types: {
    context: {} as ChatbotContext,
    events: {} as ChatbotEvent,
    input: {} as { chatbotId: string },
  },
  actors: {
    fetchChatbot: fromPromise(fetchChatbot),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QGMAWBDALgIwPaYDoBLCAGzAGIAxAUQBUBhACQH1mBBOgIQHk6BtAAwBdRKAAOuWEUxFcAOzEgAHogAsagOwFNANgCsugEybNWs2v0BmADQgAnoisBGbQE4jbzVaP7BXqwMAXyC7NCw8QhJyCiFRJBBJaVkFJVUEDW09QxMzUw1rO0cM5ysCAA5yo3L9fTNPfSNnELCMHHwCUlx0CCJ5KAoIBTBieQA3XABrEYAzMEw0BjbIuKUkmTlFBPS3YwJjP1LPUqs1NyL1fwI6hrdBNUCrTSMWkHD2wi6evoGwACc-rg-gRxKQsDMgQBbAhzBaoJYRfCrBLrFJbUDpSyCAhGAzGUzlQTlQLlC4IIxGNQELy6XT+FzGBmvd6RAiwACuyGQcFg1HozDYTE4vAEIjWUg2qW2iF2Rn2vkERzcJzOZJcZV0zjcxP05Wc9yawVCb2WHQ5XJ5FAASjQAMr0ZESCVotKIfUPHF4tTOb2WSn6Ml666CENaXRuWVPNzM02Ef6Av7W+hWgCajsSzs2roQzkM1xclPKllOtMMZL85WpgmMbkssusujUMcRcYBQL5jFYHG4fHTqKz0pzeeszkLxbUpd0ZLpVJqtdcVVr4ZexpZHXj7Zt9tF8SdyQHGLdw4LaiL1gneLVmkr19Hd1rE80EZCxvkuAgcCUa8w4v3UsPCAALRTg4iDAQQIaQVBUFNM2HzEGQYC-pK6IqE4p46HiuJ3IIupWOcoEZIIcohteljPISZy6HBrJfL0-TIS6g4GNi0GarW5TGGqyoVFUnFanclh6jRZqctysDwCimb-mhOa5rO+huPhrhWGelJqvhBAlvhuFKU+pQia2CaMQeslqEY065vmim6DUo7lG4uovkEQA */
  id: 'chatbot',
  initial: 'idle',
  context: ({ input }) => ({
    chatbot: null,
    error: null,
    chatbotId: input.chatbotId,
  }),
  states: {
    idle: {
      always: {
        target: 'loading',
      },
      on: {
        FETCH_CHATBOT: {
          target: 'loading',
          actions: [
            ({ context, event }) => {
              context.chatbotId = event.chatbotId;
              context.error = null;
            }
          ],
        },
      },
    },
    loading: {
      invoke: {
        id: 'fetchChatbot',
        src: 'fetchChatbot',
        input: ({ context }) => ({ chatbotId: context.chatbotId }),
        onDone: {
          target: 'success',
          actions: [
            ({ context, event }) => {
              context.chatbot = event.output;
              context.error = null;
            }
          ],
        },
        onError: {
          target: 'error',
          actions: [
            ({ context, event }) => {
              context.error = event.error instanceof Error ? event.error.message : 'Unknown error occurred';
              context.chatbot = null;
            }
          ],
        },
      },
    },
    success: {
      on: {
        FETCH_CHATBOT: {
          target: 'loading',
          actions: [
            ({ context, event }) => {
              context.chatbotId = event.chatbotId;
              context.error = null;
            }
          ],
        },
        RESET: {
          target: 'idle',
          actions: [
            ({ context }) => {
              context.chatbot = null;
              context.error = null;
              context.chatbotId = '';
            }
          ],
        },
      },
    },
    error: {
      on: {
        RETRY: {
          target: 'loading',
          actions: [
            ({ context }) => {
              context.error = null;
            }
          ],
        },
        FETCH_CHATBOT: {
          target: 'loading',
          actions: [
            ({ context, event }) => {
              context.chatbotId = event.chatbotId;
              context.error = null;
            }
          ],
        },
        RESET: {
          target: 'idle',
          actions: [
            ({ context }) => {
              context.chatbot = null;
              context.error = null;
              context.chatbotId = '';
            }
          ],
        },
      },
    },
  },
});
