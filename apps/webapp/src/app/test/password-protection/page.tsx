'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PasswordProtect,
  PasswordProtectProvider,
  PasswordProtectedConditionalRender,
  usePasswordProtection,
} from '@/modules/password-protection';

// Public tab content - shows basic info, enhanced when authenticated
function PublicContent() {
  const { isAuthorized } = usePasswordProtection();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Public Information</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This content is always visible to everyone.
        </p>
        <div className="space-y-2">
          <p>• Basic feature overview</p>
          <p>• Public documentation</p>
          <p>• Contact information</p>
        </div>
      </div>

      {isAuthorized && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">Authenticated</Badge>
          </div>
          <h4 className="font-medium mb-2">Enhanced Content</h4>
          <div className="space-y-1 text-sm">
            <p>• Advanced configuration options</p>
            <p>• Detailed analytics</p>
            <p>• Priority support access</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Locked tab content - shows password protection UI
function LockedContent() {
  return (
    <PasswordProtect
      title="Protected Features"
      description="Enter password to access advanced features."
    >
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Advanced Features</h3>
        <p className="text-sm text-muted-foreground">
          You now have access to protected functionality.
        </p>
        <div className="space-y-2">
          <p>• Admin dashboard</p>
          <p>• User management</p>
          <p>• System configuration</p>
          <p>• Export capabilities</p>
        </div>
      </div>
    </PasswordProtect>
  );
}

// Hidden tab content - only shows when authenticated
function HiddenTabTrigger() {
  const { isAuthorized } = usePasswordProtection();

  if (!isAuthorized) {
    return null;
  }

  return <TabsTrigger value="hidden">Hidden Tab</TabsTrigger>;
}

function HiddenContent() {
  return (
    <PasswordProtectedConditionalRender>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Secret Content</h3>
        <p className="text-sm text-muted-foreground">
          This tab only appears when you're authenticated.
        </p>
        <div className="space-y-2">
          <p>• Confidential reports</p>
          <p>• Internal documentation</p>
          <p>• Beta features</p>
          <p>• Development tools</p>
        </div>
      </div>
    </PasswordProtectedConditionalRender>
  );
}

// Authentication controls
function AuthControls() {
  const { isAuthorized, logout, temporarilyHide, unhide, isTemporarilyHidden } =
    usePasswordProtection();

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline">Authenticated</Badge>
      <Button variant="outline" size="sm" onClick={isTemporarilyHidden ? unhide : temporarilyHide}>
        {isTemporarilyHidden ? 'Show' : 'Hide'}
      </Button>
      <Button variant="outline" size="sm" onClick={logout}>
        Logout
      </Button>
    </div>
  );
}

// Dynamic TabsList that adjusts grid based on authentication
function DynamicTabsList() {
  const { isAuthorized } = usePasswordProtection();

  return (
    <TabsList className={`grid w-full ${isAuthorized ? 'grid-cols-3' : 'grid-cols-2'}`}>
      <TabsTrigger value="public">Public</TabsTrigger>
      <TabsTrigger value="locked">Locked</TabsTrigger>
      <HiddenTabTrigger />
    </TabsList>
  );
}

export default function PasswordDemoPage() {
  const config = {
    verifyHash: '3432e159dd0de3cc62e3bc502248f9b6761e7a3dacf1a20a5b76a9e0ef88d816',
    salt: 'demo-salt-2024',
    localStorageKey: 'password-protect-demo-context',
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Password Protection Demo</h1>
        <p className="text-muted-foreground">
          Password: <code className="bg-muted px-1 rounded">demo123</code>
        </p>
      </div>

      <PasswordProtectProvider config={config}>
        <div className="space-y-6">
          <AuthControls />

          <Tabs defaultValue="public" className="w-full">
            <DynamicTabsList />

            <TabsContent value="public" className="mt-6">
              <PublicContent />
            </TabsContent>

            <TabsContent value="locked" className="mt-6">
              <LockedContent />
            </TabsContent>

            <TabsContent value="hidden" className="mt-6">
              <HiddenContent />
            </TabsContent>
          </Tabs>
        </div>
      </PasswordProtectProvider>
    </div>
  );
}
