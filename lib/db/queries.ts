import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, inArray, } from 'drizzle-orm';
import { supabase } from '../supabase/client';

import type {
  User,
  Suggestion,
  DBMessage,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

export async function getUser(email: string): Promise<Array<User>> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password: hash }])
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    const { data, error } = await supabase
      .from('chats')
      .insert([{
        id,
        created_at: new Date().toISOString(),
        user_id: userId,
        title,
      }])
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    // Delete related records first
    await supabase.from('votes').delete().eq('chat_id', id);
    await supabase.from('messages').delete().eq('chat_id', id);
    
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    let query = supabase
      .from('chats')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (startingAfter) {
      const { data: [selectedChat] } = await supabase
        .from('chats')
        .select('created_at')
        .eq('id', startingAfter)
        .single();

      if (!selectedChat) {
        throw new Error(`Chat with id ${startingAfter} not found`);
      }

      query = query.gt('created_at', selectedChat.created_at);
    } else if (endingBefore) {
      const { data: [selectedChat] } = await supabase
        .from('chats')
        .select('created_at')
        .eq('id', endingBefore)
        .single();

      if (!selectedChat) {
        throw new Error(`Chat with id ${endingBefore} not found`);
      }

      query = query.lt('created_at', selectedChat.created_at);
    }

    const { data: chats, error } = await query;
    
    if (error) throw error;

    const hasMore = chats.length > limit;
    return {
      chats: hasMore ? chats.slice(0, limit) : chats,
      hasMore,
    };
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert(messages.map(msg => ({
        ...msg,
        created_at: msg.createdAt.toISOString(),
      })))
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', id)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await supabase
      .from('votes')
      .select()
      .where(and(eq('messageId', messageId)));

    if (existingVote) {
      return await supabase
        .from('votes')
        .update({ isUpvoted: type === 'up' })
        .where(and(eq('messageId', messageId), eq('chatId', chatId)));
    }
    return await supabase
      .from('votes')
      .insert({
        chatId,
        messageId,
        isUpvoted: type === 'up',
      });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await supabase
      .from('votes')
      .select()
      .where(eq('chatId', id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await supabase
      .from('documents')
      .insert({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await supabase
      .from('documents')
      .select()
      .where(eq('id', id))
      .orderBy(asc('createdAt'));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select()
      .where(eq('id', id))
      .orderBy(desc('createdAt'))
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await supabase
      .from('suggestions')
      .delete()
      .where(
        and(
          eq('documentId', id),
          gt('documentCreatedAt', timestamp),
        ),
      );

    return await supabase
      .from('documents')
      .delete()
      .where(and(eq('id', id), gt('createdAt', timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await supabase
      .from('suggestions')
      .insert(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await supabase
      .from('suggestions')
      .select()
      .where(and(eq('documentId', documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await supabase
      .from('messages')
      .select()
      .where(eq('id', id))
      .single();
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await supabase
      .from('messages')
      .select({ id: 'id' })
      .where(
        and(eq('chatId', chatId), gte('createdAt', timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await supabase
        .from('votes')
        .delete()
        .where(
          and(eq('chatId', chatId), inArray('messageId', messageIds)),
        );

      return await supabase
        .from('messages')
        .delete()
        .where(
          and(eq('chatId', chatId), inArray('id', messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await supabase
      .from('chats')
      .update({ visibility })
      .where(eq('id', chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}
