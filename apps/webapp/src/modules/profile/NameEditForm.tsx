'use client';

import { ChevronDownIcon } from '@radix-ui/react-icons';
import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthState, useCurrentUser } from '@/modules/auth/AuthProvider';
import { ConnectButton, GoogleIcon } from '@/modules/auth/ConnectButton';

// Helper function to create OAuth state for connect flow
function createConnectOAuthState(connectRequestId: string): string {
  const state = {
    flowType: 'connect' as const,
    requestId: connectRequestId,
    version: 'v1' as const,
  };
  return encodeURIComponent(JSON.stringify(state));
}

interface _DisconnectDialogState {
  isOpen: boolean;
  providerId: string;
  providerName: string;
  isDisconnecting: boolean;
}

/**
 * Name edit form component allowing users to update their display name.
 * Supports different user types (Google, anonymous, full account) with appropriate messaging.
 */
export function NameEditForm() {
  const currentUser = useCurrentUser();
  const authState = useAuthState();
  const authMethod = authState?.state === 'authenticated' ? authState.authMethod : undefined;

  // Get Google auth availability
  const googleAuthAvailable = useQuery(api.auth.google.getConfig);
  const isGoogleAuthAvailable = googleAuthAvailable?.enabled ?? false;

  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // State for Google connection
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [connectLoginRequestId, setConnectLoginRequestId] = useState<string | null>(null);

  // State for disconnect confirmation dialog
  const [disconnectDialog, setDisconnectDialog] = useState<_DisconnectDialogState>({
    isOpen: false,
    providerId: '',
    providerName: '',
    isDisconnecting: false,
  });

  // Convex mutations
  const updateUserName = useSessionMutation(api.auth.updateUserName);
  const disconnectGoogle = useSessionMutation(api.auth.google.disconnectGoogle);
  const createConnectRequest = useSessionMutation(api.auth.google.createConnectRequest);

  // Query to poll connect request status for connect flow
  const connectRequest = useQuery(
    api.auth.google.getConnectRequest,
    connectLoginRequestId
      ? { connectRequestId: connectLoginRequestId as Id<'auth_connectRequests'> }
      : 'skip'
  );

  // Effect to handle connect request status changes
  useEffect(() => {
    if (!connectRequest || !isConnectingGoogle) return;

    if (connectRequest.status === 'completed') {
      toast.success('Google account connected successfully!');
      setIsConnectingGoogle(false);
      setConnectLoginRequestId(null);
    } else if (connectRequest.status === 'failed') {
      toast.error(connectRequest.error || 'Failed to connect Google account');
      setIsConnectingGoogle(false);
      setConnectLoginRequestId(null);
    }
  }, [connectRequest, isConnectingGoogle]);

  // Initialize name when user data is available
  useEffect(() => {
    if (currentUser?.name) {
      setName(currentUser.name);
    }
  }, [currentUser?.name]);

  // Handle name change
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setError(null);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) {
        setError('Name cannot be empty');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await updateUserName({ newName: name.trim() });
        setIsEditing(false);
        toast.success('Name updated successfully');
      } catch (_error) {
        setError('Failed to update name. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [name, updateUserName]
  );

  // Handle cancel editing
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setName(currentUser?.name || '');
    setError(null);
  }, [currentUser?.name]);

  // Handle start editing
  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  // Handle Google connection
  const handleGoogleConnect = useCallback(async () => {
    setIsConnectingGoogle(true);
    try {
      // Generate redirect URI from current window location
      if (typeof window === 'undefined') {
        throw new Error('Window is not available');
      }

      const redirectUri = `${window.location.origin}/api/auth/google/callback`;

      // Create a connect request in the backend for connect flow
      const result = await createConnectRequest({ redirectUri });

      // Set the connect request ID for polling
      setConnectLoginRequestId(result.connectId);

      // Generate the Google OAuth URL using the structured state parameter
      const state = createConnectOAuthState(result.connectId);
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: googleAuthAvailable?.clientId || '',
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state: state,
        access_type: 'offline',
        prompt: 'consent',
      })}`;

      // Open popup window instead of redirecting current page
      const popup = window.open(
        authUrl,
        'google-oauth-connect',
        'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
      );

      if (!popup) {
        toast.error('Failed to open popup. Please enable popups and try again.');
        setIsConnectingGoogle(false);
        setConnectLoginRequestId(null);
        return;
      }

      // Poll for popup closure
      const pollInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollInterval);
          // Don't reset connecting state here - let the login request status handle it
        }
      }, 1000);

      // Cleanup on timeout
      setTimeout(
        () => {
          clearInterval(pollInterval);
          if (!popup.closed) {
            popup.close();
          }
          toast.error('Connection timeout. Please try again.');
          setIsConnectingGoogle(false);
          setConnectLoginRequestId(null);
        },
        15 * 60 * 1000
      ); // 15 minutes timeout
    } catch (_error) {
      toast.error('Failed to connect Google account');
      setIsConnectingGoogle(false);
      setConnectLoginRequestId(null);
    }
  }, [googleAuthAvailable?.clientId, createConnectRequest]);

  // Handle disconnect confirmation
  const showDisconnectConfirmation = useCallback((providerId: string, providerName: string) => {
    setDisconnectDialog({
      isOpen: true,
      providerId,
      providerName,
      isDisconnecting: false,
    });
  }, []);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    if (disconnectDialog.providerId === 'google') {
      setDisconnectDialog((prev) => ({ ...prev, isDisconnecting: true }));
      try {
        await disconnectGoogle();
        toast.success('Google account disconnected successfully');
        setDisconnectDialog({
          isOpen: false,
          providerId: '',
          providerName: '',
          isDisconnecting: false,
        });
      } catch (_error) {
        toast.error('Failed to disconnect Google account');
        setDisconnectDialog((prev) => ({ ...prev, isDisconnecting: false }));
      }
    }
  }, [disconnectDialog.providerId, disconnectGoogle]);

  // Close disconnect dialog
  const closeDisconnectDialog = useCallback(() => {
    setDisconnectDialog({
      isOpen: false,
      providerId: '',
      providerName: '',
      isDisconnecting: false,
    });
  }, []);

  // Memoized Google provider info
  const googleProvider = useMemo(
    () => ({
      id: 'google',
      name: 'Google',
      icon: <GoogleIcon className="mr-2 h-4 w-4" />,
      isConnected: currentUser?.type === 'full' && !!currentUser.google,
      connectedEmail: currentUser?.type === 'full' ? currentUser.google?.email : undefined,
    }),
    [currentUser]
  );

  // Handle disconnect click
  const handleDisconnectClick = useCallback(() => {
    showDisconnectConfirmation(googleProvider.id, googleProvider.name);
  }, [showDisconnectConfirmation, googleProvider.id, googleProvider.name]);

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {_renderHeader(isEditing, startEditing)}

      {/* Main content */}
      {isEditing
        ? _renderEditForm(name, error, isLoading, handleNameChange, handleSubmit, handleCancel)
        : _renderDisplayView(
            currentUser,
            showDisconnectConfirmation,
            handleGoogleConnect,
            isConnectingGoogle,
            !!isGoogleAuthAvailable,
            authMethod,
            googleProvider,
            handleDisconnectClick
          )}

      {/* Disconnect confirmation dialog */}
      <AlertDialog open={disconnectDialog.isOpen} onOpenChange={closeDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {disconnectDialog.providerName}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect your {disconnectDialog.providerName} account? You
              can reconnect it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnectDialog.isDisconnecting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={disconnectDialog.isDisconnecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnectDialog.isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// 5. Internal helper functions
/**
 * Renders the section header with edit button.
 */
function _renderHeader(isEditing: boolean, startEditing: () => void) {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Your Display Name</h2>
      {!isEditing && (
        <Button variant="outline" size="sm" onClick={startEditing}>
          Edit Name
        </Button>
      )}
    </div>
  );
}

/**
 * Renders the display view showing current user information.
 */
function _renderDisplayView(
  user: NonNullable<
    Extract<NonNullable<ReturnType<typeof useAuthState>>, { state: 'authenticated' }>['user']
  >,
  showDisconnectConfirmation: (providerId: string, providerName: string) => void,
  handleGoogleConnect: () => Promise<void>,
  isConnectingGoogle: boolean,
  googleAuthAvailable: boolean,
  authMethod: string | undefined,
  googleProvider: {
    id: string;
    name: string;
    icon: React.ReactNode;
    isConnected: boolean;
    connectedEmail?: string;
  },
  handleDisconnectClick: () => void
) {
  return (
    <div className="p-4 bg-secondary/50 rounded-md">
      <div className="flex items-center space-x-3">
        {_renderUserAvatar(user)}
        <div className="flex-1">
          <p className="font-medium">{user.name}</p>
          {_renderUserTypeInfo(
            user,
            showDisconnectConfirmation,
            handleGoogleConnect,
            isConnectingGoogle,
            googleAuthAvailable,
            authMethod,
            googleProvider,
            handleDisconnectClick
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the user avatar if available (from any linked account).
 */
function _renderUserAvatar(user: { type: string; google?: { picture?: string }; name: string }) {
  // Check for profile picture from any linked account
  const profilePicture = user.type === 'full' ? user.google?.picture : undefined;

  if (profilePicture) {
    return (
      <img
        src={profilePicture}
        alt={`${user.name}'s profile`}
        width={48}
        height={48}
        className="w-12 h-12 rounded-full"
      />
    );
  }
  return null;
}

/**
 * Renders user type-specific information.
 */
function _renderUserTypeInfo(
  user: { type: string; email?: string; google?: { email?: string } },
  showDisconnectConfirmation: (providerId: string, providerName: string) => void,
  handleGoogleConnect: () => Promise<void>,
  isConnectingGoogle: boolean,
  googleAuthAvailable: boolean,
  authMethod: string | undefined,
  googleProvider: {
    id: string;
    name: string;
    icon: React.ReactNode;
    isConnected: boolean;
    connectedEmail?: string;
  },
  handleDisconnectClick: () => void
) {
  return (
    <div className="mt-3 space-y-4">
      {/* Show email if available */}
      {user.email && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Email:</span> {user.email}
        </div>
      )}

      {/* Show current session info subtly */}
      {authMethod && _renderSessionInfo(authMethod)}

      {/* Third-party accounts section */}
      {_renderThirdPartyAccounts(
        user,
        showDisconnectConfirmation,
        handleGoogleConnect,
        isConnectingGoogle,
        googleAuthAvailable,
        googleProvider,
        handleDisconnectClick
      )}

      {/* Show user type specific info */}
      {_renderUserTypeSpecificInfo(user)}
    </div>
  );
}

/**
 * Renders subtle session information.
 */
function _renderSessionInfo(authMethod: string | undefined) {
  if (!authMethod) return null;

  const sessionLabels = {
    google: 'Active Google session',
    login_code: 'Signed in with code',
    recovery_code: 'Signed in with recovery code',
    anonymous: 'Anonymous session',
    username_password: 'Password session',
  };

  const label = sessionLabels[authMethod as keyof typeof sessionLabels];

  if (!label) return null;

  return <div className="text-xs text-muted-foreground/70">{label}</div>;
}

/**
 * Renders authentication provider accounts section.
 */
function _renderThirdPartyAccounts(
  _user: { google?: { email?: string } },
  _showDisconnectConfirmation: (providerId: string, providerName: string) => void,
  handleGoogleConnect: () => Promise<void>,
  isConnectingGoogle: boolean,
  googleAuthAvailable: boolean,
  googleProvider: {
    id: string;
    name: string;
    icon: React.ReactNode;
    isConnected: boolean;
    connectedEmail?: string;
  },
  handleDisconnectClick: () => void
) {
  // Only show Google row if available or already connected
  const showGoogleRow = googleAuthAvailable || googleProvider.isConnected;

  if (!showGoogleRow) {
    // No third-party providers to show
    return null;
  }

  return (
    <div className="border-t pt-4">
      <h3 className="text-sm font-medium text-foreground mb-3">Connected Accounts</h3>
      <div className="space-y-3">
        {showGoogleRow && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              {googleProvider.icon}
              <span className="text-sm font-medium">{googleProvider.name}</span>
            </div>
            <div className="flex items-center gap-3">
              {googleProvider.isConnected ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>
                        Connected
                        {googleProvider.connectedEmail && (
                          <span className="ml-1">({googleProvider.connectedEmail})</span>
                        )}
                      </span>
                      <ChevronDownIcon className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={handleDisconnectClick}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <ConnectButton
                  onClick={handleGoogleConnect}
                  isLoading={isConnectingGoogle}
                  isDisabled={!googleAuthAvailable}
                  variant="outline"
                  className="text-xs h-auto px-3 py-1"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Renders user type specific information.
 */
function _renderUserTypeSpecificInfo(user: { type: string }) {
  if (user.type === 'anonymous') {
    return (
      <div className="text-sm text-muted-foreground bg-muted/30 rounded-md p-3">
        <p>Personalize your account by updating your display name above.</p>
      </div>
    );
  }

  return null;
}

/**
 * Renders the edit form for updating the display name.
 */
function _renderEditForm(
  name: string,
  error: string | null,
  isLoading: boolean,
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  handleSubmit: (e: React.FormEvent) => void,
  handleCancel: () => void
) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Display Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={handleNameChange}
          className={`mt-1 block w-full px-3 py-2 border ${
            error ? 'border-destructive' : 'border-input'
          } rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring`}
          placeholder="Enter your display name"
          disabled={isLoading}
        />
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
        {_renderFormHelperText()}
      </div>

      <div className="flex space-x-2 justify-end">
        <Button type="button" variant="ghost" onClick={handleCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Name'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Renders helper text for the name input field.
 */
function _renderFormHelperText() {
  return (
    <p className="mt-1 text-sm text-muted-foreground">
      Your name must be between 3 and 30 characters.
    </p>
  );
}
