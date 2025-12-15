'use client';

import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import {
  Check,
  Edit,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  MoreVertical,
  Plus,
  RefreshCw,
  Trash,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConclusionForm } from '@/modules/discussion/discussion-conclusion';
import { DiscussionForm } from '@/modules/discussion/discussion-form';
import { useDiscussionSync } from '@/modules/discussion/use-discussion-sync';

interface DiscussionProps {
  title: string;
  discussionKey: string;
  className?: string;
}

export function Discussion({ title, discussionKey, className }: DiscussionProps) {
  // State for UI controls
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showConclusionDialog, setShowConclusionDialog] = useState(false);
  const [showEditConclusionDialog, setShowEditConclusionDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Id<'discussionMessages'> | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // References
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Use the discussion sync hook
  const {
    messages,
    conclusion,
    isActive,
    isConcluded,
    userName,
    addMessage,
    deleteMessage,
    concludeDiscussion,
    updateConclusions,
    reopenDiscussion,
    initializeDiscussion,
  } = useDiscussionSync({
    key: discussionKey,
    title,
  });

  // Set loading state based on data availability
  useEffect(() => {
    // Consider the discussion loaded once we have fetched the messages (even if empty)
    if (messages !== undefined) {
      // Add a small delay to prevent flickering for fast loads
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Initialize discussion on mount
  useEffect(() => {
    initializeDiscussion();
  }, [initializeDiscussion]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showMenu) {
        setShowMenu(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showMenu]);

  // Handle message submission
  const handleMessageSubmit = async (name: string, message: string) => {
    const success = await addMessage(name, message);
    if (success) {
      setShowFormDialog(false);
    }
    return success || false;
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId: Id<'discussionMessages'>) => {
    setMessageToDelete(messageId);
    setShowDeleteConfirm(true);
  };

  // Confirm and perform message deletion
  const confirmDeleteMessage = async () => {
    if (messageToDelete) {
      await deleteMessage(messageToDelete as Id<'discussionMessages'>);
      setShowDeleteConfirm(false);
      setMessageToDelete(null);
    }
  };

  // Handle conclusion submission
  const handleConclusionSubmit = async (conclusions: { text: string; tags: string[] }[]) => {
    const success = await concludeDiscussion(conclusions);
    if (success) {
      setShowConclusionDialog(false);
      setShowMenu(false);
    }
    return success || false;
  };

  // Handle conclusion update
  const handleConclusionUpdate = async (conclusions: { text: string; tags: string[] }[]) => {
    const success = await updateConclusions(conclusions);
    if (success) {
      setShowEditConclusionDialog(false);
      setShowMenu(false);
    }
    return success || false;
  };

  // Handle reopening the discussion
  const handleReopenDiscussion = async () => {
    await reopenDiscussion();
    setShowMenu(false);
  };

  // Render loading state with spinner within fixed height container
  const renderLoadingState = () => {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary/60 mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Loading discussion...</p>
        </div>
      </div>
    );
  };

  // Render messages
  const renderMessages = () => {
    if (isLoading) {
      return renderLoadingState();
    }

    return (
      <div className="space-y-2 h-full">
        {messages && messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg._id} className="bg-primary/5 rounded-md p-2 text-sm">
              <div className="flex justify-between items-start">
                <p className="font-medium text-xs">{msg.name}</p>
                {isActive && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDeleteMessage(msg._id as Id<'discussionMessages'>)}
                      >
                        <Trash className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <p className="mt-1 whitespace-pre-line">{msg.message}</p>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground italic">
              No messages yet. Be the first to contribute!
            </p>
          </div>
        )}
      </div>
    );
  };

  // Render conclusion
  const renderConclusion = () => {
    // When loading, show spinner
    if (isLoading) {
      return renderLoadingState();
    }

    // Get conclusions from discussion state, if it exists
    const discussionConclusions = conclusion?.conclusions || [];

    if (!conclusion) return null;

    return (
      <div className="space-y-4">
        {/* Simplified heading */}
        <div className="flex items-center justify-center">
          <div className="bg-muted px-3 py-1 rounded-full flex items-center">
            <span className="text-sm font-medium">Summary</span>
          </div>
        </div>

        {discussionConclusions.length > 0 ? (
          <div className="space-y-2">
            {discussionConclusions.map((item, index) => (
              <div
                key={`conclusion-${item.text.substring(0, 15)}-${index}`}
                className="flex items-center border rounded-md py-2 px-3 bg-background/50"
              >
                <div className="mr-2 bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium">{index + 1}</span>
                </div>
                <span className="text-sm flex-1">{item.text}</span>
                {item.tags && item.tags.length > 0 && (
                  <Badge variant="outline" className="text-xs ml-2">
                    {item.tags[0]}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <p className="text-sm text-muted-foreground italic text-center">
              No conclusions were added.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Determine what to render based on state
  const renderContent = () => {
    // If concluded, show the conclusion with option to view messages
    if (isConcluded) {
      const conclusionContent = renderConclusion();
      if (!conclusionContent) {
        return isLoading ? (
          renderLoadingState()
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground italic">
              Discussion has been concluded, but no summary is available.
            </p>
          </div>
        );
      }
      return conclusionContent;
    }

    // Show messages if we have any
    return renderMessages();
  };

  return (
    <>
      <div className={`bg-card/60 backdrop-blur-sm border rounded-md overflow-hidden ${className}`}>
        <div className="p-3 flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium">
              <MessageCircle className="h-4 w-4 inline-block mr-1" />
              {title}
            </h3>
            {isConcluded && <Badge variant="secondary">Concluded</Badge>}
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Discussion actions"
              onClick={() => setShowMenu(!showMenu)}
              ref={menuButtonRef}
              disabled={isLoading}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {showMenu && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-1 w-48 z-50 bg-popover rounded-md shadow-md border p-1 text-popover-foreground"
              >
                {isActive && (
                  <button
                    type="button"
                    className="flex w-full items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
                    onClick={() => {
                      setShowFormDialog(true);
                      setShowMenu(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contribution
                  </button>
                )}

                {isActive && (
                  <button
                    type="button"
                    className="flex w-full items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
                    onClick={() => {
                      setShowConclusionDialog(true);
                      setShowMenu(false);
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Conclude Discussion
                  </button>
                )}

                {isConcluded && (
                  <button
                    type="button"
                    className="flex w-full items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
                    onClick={() => {
                      setShowEditConclusionDialog(true);
                      setShowMenu(false);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Conclusions
                  </button>
                )}

                {isConcluded && (
                  <button
                    type="button"
                    className="flex w-full items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
                    onClick={handleReopenDiscussion}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reopen Discussion
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          {/* Discussion content with fixed height container */}
          <div className="p-3 h-[250px] overflow-y-auto">{renderContent()}</div>

          {/* Action buttons for quick access */}
          {isActive && (
            <div className="p-3 border-t">
              {!isLoading ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowFormDialog(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Contribution
                </Button>
              ) : (
                <div className="h-9" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialog for adding a new message */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Your Contribution</DialogTitle>
            <DialogDescription>
              Share your thoughts on the discussion topic: {title}
            </DialogDescription>
          </DialogHeader>
          <DiscussionForm
            initialName={userName}
            onSubmit={handleMessageSubmit}
            onCancel={() => setShowFormDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog for concluding discussion */}
      <Dialog open={showConclusionDialog} onOpenChange={setShowConclusionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conclude Discussion</DialogTitle>
            <DialogDescription>
              Summarize the key tasks and decisions from this discussion.
            </DialogDescription>
          </DialogHeader>
          <ConclusionForm
            onSubmit={handleConclusionSubmit}
            onCancel={() => setShowConclusionDialog(false)}
            existingConclusion={conclusion}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog for editing conclusions */}
      <Dialog open={showEditConclusionDialog} onOpenChange={setShowEditConclusionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Conclusions</DialogTitle>
            <DialogDescription>
              Modify the key tasks and decisions from this discussion.
            </DialogDescription>
          </DialogHeader>
          <ConclusionForm
            onSubmit={handleConclusionUpdate}
            onCancel={() => setShowEditConclusionDialog(false)}
            existingConclusion={conclusion}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog for delete confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteMessage}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
