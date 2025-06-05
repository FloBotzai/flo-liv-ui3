import OpenAI from 'openai';
import {
  type UIMessage,
  createDataStreamResponse,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
    }: {
      id: string;
      messages: Array<UIMessage>;
      selectedChatModel: string;
    } = await request.json();

    const session = await auth();

    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);
    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({ message: userMessage });
      await saveChat({ id, userId: session.user.id, title });
    } else if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: userMessage.id,
          role: 'user',
          parts: userMessage.parts,
          attachments: userMessage.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    return createDataStreamResponse({
      execute: async (dataStream) => {
        try {
          const thread = await openai.beta.threads.create();

          const runStream = await openai.beta.threads.createAndRun({
            thread_id: thread.id,
            assistant_id: 'asst_FLYPSgOOB3IEUTgUsa4j3a75',
            stream: true,
            instructions: 'You are FloBotz Assistant. Respond clearly, with helpful and brand-consistent answers.',
          });

          let fullMessage = '';
          const assistantMessageId = generateUUID();

          for await (const chunk of runStream) {
            const content = chunk?.data?.delta?.content;
            if (content) {
              dataStream.append({
                type: 'text',
                content,
              });
              fullMessage += content;
            }
          }

          await saveMessages({
            messages: [
              {
                id: assistantMessageId,
                chatId: id,
                role: 'assistant',
                parts: [{ type: 'text', text: fullMessage }],
                createdAt: new Date(),
              },
            ],
          });

          // 🧠 Send to n8n webhook
          await fetch('https://flobotzai.app.n8n.cloud/webhook/flo-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId: id,
              userId: session.user.id,
              message: fullMessage,
            }),
          });

        } catch (err) {
          console.error('Streaming error:', err);
          dataStream.append({
            type: 'text',
            content: '⚠️ An error occurred while generating a response.',
          });
        }
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

  } catch (error) {
    console.error('POST /api/chat error:', error);
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    console.error('DELETE /api/chat error:', error);
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}

