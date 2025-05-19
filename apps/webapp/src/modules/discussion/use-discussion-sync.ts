import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionMutation, useSessionQuery } from 'convex-helpers/react/sessions';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// Define the discussion state type
type DiscussionState = {
  key: string;
  title: string;
  isActive: boolean;
  createdAt: number;
  exists: boolean;
  conclusions?: {
    text: string;
    tags: string[];
  }[];
  concludedAt?: number;
  concludedBy?: string;
  _id?: unknown;
  _creationTime?: number;
};

// Define the discussion message type
type DiscussionMessage = {
  _id: string;
  discussionKey: string;
  name: string;
  message: string;
  timestamp: number;
  sessionId?: string;
  _creationTime?: number;
};

// Define the discussion conclusion type
type DiscussionConclusion = {
  _id: string;
  discussionKey: string;
  conclusions: {
    text: string;
    tags: string[];
  }[];
  createdAt: number;
  createdBy?: string;
  _creationTime?: number;
};

export function useDiscussionSync({
  key,
  title,
}: {
  key: string;
  title: string;
}) {
  // Store user's name for messages
  const [userName, setUserName] = useState<string>('');

  // Get discussion state from backend
  const discussionState = useSessionQuery(
    api.discussions.getDiscussionState,
    key ? { key } : 'skip'
  ) as DiscussionState | undefined;

  // Get discussion messages from backend
  const messages = useSessionQuery(api.discussions.getDiscussionMessages, key ? { key } : 'skip') as
    | DiscussionMessage[]
    | undefined;

  // Get discussion conclusion from backend
  const conclusion = useSessionQuery(
    api.discussions.getDiscussionConclusion,
    key ? { key } : 'skip'
  ) as DiscussionConclusion | null | undefined;

  // Mutations
  const createDiscussionMutation = useSessionMutation(api.discussions.createDiscussion);
  const addMessageMutation = useSessionMutation(api.discussions.addDiscussionMessage);
  const concludeDiscussionMutation = useSessionMutation(api.discussions.concludeDiscussion);
  const reopenDiscussionMutation = useSessionMutation(api.discussions.reopenDiscussion);
  const deleteMessageMutation = useSessionMutation(api.discussions.deleteDiscussionMessage);
  const updateConclusionsMutation = useSessionMutation(api.discussions.updateConclusions);

  // Check if discussion exists
  const exists = discussionState?.exists || false;
  const isActive = discussionState?.isActive || false;
  const isConcluded = exists && !isActive;

  // Create discussion if it doesn't exist
  const createDiscussion = useCallback(async () => {
    if (!key || !title) return;

    try {
      await createDiscussionMutation({
        key,
        title,
      });
    } catch (error) {
      toast.error('Failed to create discussion', {
        description: (error as Error).message,
      });
    }
  }, [key, title, createDiscussionMutation]);

  // Add message to discussion
  const addMessage = useCallback(
    async (name: string, message: string) => {
      if (!key || !name || !message) return;

      try {
        await addMessageMutation({
          discussionKey: key,
          name,
          message,
        });

        // Save name for future use
        setUserName(name);

        return true;
      } catch (error) {
        toast.error('Failed to add message', {
          description: (error as Error).message,
        });
        return false;
      }
    },
    [key, addMessageMutation]
  );

  // Delete message from discussion
  const deleteMessage = useCallback(
    async (messageId: Id<'discussionMessages'>) => {
      if (!messageId) return false;

      try {
        await deleteMessageMutation({
          messageId,
        });

        toast.success('Message deleted');
        return true;
      } catch (error) {
        toast.error('Failed to delete message', {
          description: (error as Error).message,
        });
        return false;
      }
    },
    [deleteMessageMutation]
  );

  // Conclude discussion
  const concludeDiscussion = useCallback(
    async (conclusions: { text: string; tags: string[] }[]) => {
      if (!key) return;

      try {
        await concludeDiscussionMutation({
          discussionKey: key,
          conclusions,
        });

        toast.success('Discussion concluded');
        return true;
      } catch (error) {
        toast.error('Failed to conclude discussion', {
          description: (error as Error).message,
        });
        return false;
      }
    },
    [key, concludeDiscussionMutation]
  );

  // Update conclusions for an existing discussion
  const updateConclusions = useCallback(
    async (conclusions: { text: string; tags: string[] }[]) => {
      if (!key) return;

      try {
        await updateConclusionsMutation({
          discussionKey: key,
          conclusions,
        });

        toast.success('Conclusions updated');
        return true;
      } catch (error) {
        toast.error('Failed to update conclusions', {
          description: (error as Error).message,
        });
        return false;
      }
    },
    [key, updateConclusionsMutation]
  );

  // Reopen discussion
  const reopenDiscussion = useCallback(async () => {
    if (!key) return;

    try {
      await reopenDiscussionMutation({
        discussionKey: key,
      });

      toast.success('Discussion reopened');
      return true;
    } catch (error) {
      toast.error('Failed to reopen discussion', {
        description: (error as Error).message,
      });
      return false;
    }
  }, [key, reopenDiscussionMutation]);

  // Initialize discussion if it doesn't exist yet
  const initializeDiscussion = useCallback(async () => {
    if (!exists && key && title) {
      await createDiscussion();
    }
  }, [exists, key, title, createDiscussion]);

  // Get the latest messages (limited by count)
  const getLatestMessages = useCallback(
    (count = 3) => {
      if (!messages || messages.length === 0) return [];
      return messages.slice(0, count);
    },
    [messages]
  );

  return {
    discussionState,
    messages,
    conclusion,
    exists,
    isActive,
    isConcluded,
    userName,
    setUserName,
    createDiscussion,
    addMessage,
    deleteMessage,
    concludeDiscussion,
    updateConclusions,
    reopenDiscussion,
    initializeDiscussion,
    getLatestMessages,
  };
}
