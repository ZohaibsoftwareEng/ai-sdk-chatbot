import OpenAI from 'openai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000', 
        'X-Title': 'AI Chat App', 
      },
    });

    const completion = await openai.chat.completions.create({
      model: 'moonshotai/kimi-k2:free',
      messages: messages,
      stream: true,
    });

    // Create a custom stream that matches your frontend's expected format
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let hasContent = false;

        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              hasContent = true;
              const data = JSON.stringify({ content: content });
              const streamChunk = encoder.encode(`data: ${data}\n\n`);
              controller.enqueue(streamChunk);
            }
          }

          if (!hasContent) {
            console.log('No content received from AI model');
            const errorData = JSON.stringify({ content: 'No response from AI model. Please try again.' });
            const errorChunk = encoder.encode(`data: ${errorData}\n\n`);
            controller.enqueue(errorChunk);
          }
        } catch (streamError) {
          console.error('Stream error:', streamError);
          const errorData = JSON.stringify({ content: 'Error in streaming response.' });
          const errorChunk = encoder.encode(`data: ${errorData}\n\n`);
          controller.enqueue(errorChunk);
        }

        // Send done signal
        const doneChunk = encoder.encode(`data: [DONE]\n\n`);
        controller.enqueue(doneChunk);
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/stream-events',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
