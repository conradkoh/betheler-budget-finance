'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import {
  useSessionAction,
  useSessionMutation,
  useSessionQuery,
} from 'convex-helpers/react/sessions';
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  TestTube,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAppInfo } from '@/modules/app/useAppInfo';

/**
 * Displays Google Authentication configuration page with OAuth setup, testing, and management capabilities.
 */
export default function GoogleAuthConfigPage() {
  const { isLoading: appInfoLoading } = useAppInfo();

  // State for form inputs
  const [enabled, setEnabled] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [clientSecretFocused, setClientSecretFocused] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);

  // Convex queries and mutations
  const configData = useSessionQuery(api.system.auth.google.getConfig);
  const updateConfig = useSessionMutation(api.system.auth.google.updateConfig);
  const toggleEnabled = useSessionMutation(api.system.auth.google.toggleEnabled);
  const testConfig = useSessionAction(api.system.auth.google.testConfig);
  const resetConfig = useSessionMutation(api.system.auth.google.resetConfig);

  // Computed values - generate redirect URIs on frontend
  const redirectUris = useMemo(() => {
    if (typeof window === 'undefined') return [];
    return [`${window.location.origin}/api/auth/google/callback`];
  }, []);
  const isConfigLoading = configData === undefined;
  const isPageLoading = appInfoLoading || isConfigLoading;
  const isFullyConfigured = isConfigured && enabled;
  const clientSecretDisplayValue = useMemo(
    () => _getClientSecretDisplayValue(configData || undefined, clientSecretFocused, clientSecret),
    [configData, clientSecretFocused, clientSecret]
  );
  const googleCloudLinks = useMemo(() => _getGoogleCloudLinks(projectId), [projectId]);

  // Load existing configuration
  useEffect(() => {
    if (configData) {
      setEnabled(configData.enabled);
      setProjectId(configData.projectId || '');
      setClientId(configData.clientId || '');
      setClientSecret(''); // Never load the actual secret for security
      setIsConfigured(configData.isConfigured);
    }
  }, [configData]);

  // Event handlers
  const handleClientSecretFocus = useCallback(() => {
    _handleClientSecretFocus(setClientSecretFocused);
  }, []);

  const handleClientSecretBlur = useCallback(() => {
    _handleClientSecretBlur(setClientSecretFocused);
  }, []);

  const handleToggleEnabled = useCallback(
    async (newEnabled: boolean) => {
      await _handleToggleEnabled(newEnabled, toggleEnabled, setEnabled);
    },
    [toggleEnabled]
  );

  const handleSave = useCallback(async () => {
    await _handleSave({
      isFormLoading,
      setIsFormLoading,
      redirectUris,
      projectId,
      clientId,
      clientSecret,
      configData: configData || undefined,
      enabled,
      updateConfig,
      setIsConfigured,
    });
  }, [
    isFormLoading,
    redirectUris,
    projectId,
    clientId,
    clientSecret,
    configData,
    enabled,
    updateConfig,
  ]);

  const handleTest = useCallback(async () => {
    await _handleTest(clientId, clientSecret, testConfig);
  }, [clientId, clientSecret, testConfig]);

  const handleReset = useCallback(async () => {
    await _handleReset(resetConfig, setProjectId, setClientId, setClientSecret, setIsConfigured);
  }, [resetConfig]);

  const handleCopyToClipboard = useCallback(async (text: string) => {
    await _copyToClipboard(text);
  }, []);

  // Show loading state while data is being fetched
  if (isPageLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Google Authentication Configuration</h1>
          <p className="text-muted-foreground">Configure Google OAuth for user authentication</p>
        </div>

        {/* Enable/Disable Control Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-64" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-96" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-11" />
            </div>
          </CardContent>
        </Card>

        {/* Status Overview Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-80" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Form Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-56" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-72" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project ID Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-96" />
            </div>

            {/* Client ID Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-80" />
            </div>

            {/* Client Secret Skeleton */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-36" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-96" />
            </div>

            <Separator />

            {/* Redirect URIs Skeleton */}
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full mt-1" />
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-16" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-16" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Buttons Skeleton */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-40" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-64" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i}>
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 pt-6">
        <h1 className="text-3xl font-bold">Google Authentication Configuration</h1>
        <p className="text-muted-foreground">Configure Google OAuth for user authentication</p>
      </div>

      {/* Enable/Disable Control */}
      <Card>
        <CardHeader>
          <CardTitle>Google Authentication Control</CardTitle>
          <CardDescription>Enable or disable Google Authentication for your users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="google-auth-enabled" className="text-base font-medium">
                Google Authentication
              </Label>
              <p className="text-sm text-muted-foreground">
                {enabled ? 'Users can sign in with Google' : 'Google sign-in is disabled'}
              </p>
            </div>
            <Switch
              id="google-auth-enabled"
              checked={enabled}
              onCheckedChange={handleToggleEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Status</CardTitle>
          <CardDescription>Current state of Google Authentication setup</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Configuration Status</span>
              <div className="flex items-center gap-2">
                {isConfigured ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Configured</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">Not Configured</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Status</span>
              <div className="flex items-center gap-2">
                {isFullyConfigured ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Ready</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-600">Setup Required</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Google Cloud Console Setup</CardTitle>
          <CardDescription>Configure your Google OAuth application settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project ID */}
          <div className="space-y-2">
            <Label htmlFor="projectId">Google Cloud Project ID (Optional)</Label>
            <Input
              id="projectId"
              placeholder="e.g., my-awesome-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Optional: Provides project-specific links to Google Cloud Console
              </p>
              <Link
                href={googleCloudLinks.console}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                Open Console
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Client ID */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="clientId">Google Client ID</Label>
              <Link
                href={googleCloudLinks.credentials}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                Manage Credentials
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <Input
              id="clientId"
              placeholder="e.g., 123456789012-abcdefghijklmnop.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className={_getClientIdValidationClass(clientId)}
            />
            {_renderClientIdValidation(clientId)}
          </div>

          {/* Client Secret */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="clientSecret">Google Client Secret</Label>
              {configData && (
                <div className="flex items-center gap-2">
                  {configData.hasClientSecret ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">Configured</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-xs text-amber-600 font-medium">Not Set</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              <Input
                id="clientSecret"
                type={showClientSecret ? 'text' : 'password'}
                placeholder={
                  configData?.hasClientSecret
                    ? 'Enter new client secret (leave empty to keep current)'
                    : 'Enter your Google Client Secret'
                }
                value={clientSecretDisplayValue}
                onChange={(e) => setClientSecret(e.target.value)}
                onFocus={handleClientSecretFocus}
                onBlur={handleClientSecretBlur}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowClientSecret(!showClientSecret)}
                tabIndex={-1}
              >
                {showClientSecret ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {showClientSecret ? 'Hide password' : 'Show password'}
                </span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {configData?.hasClientSecret
                ? 'A client secret is already configured. Click to enter a new secret, or leave empty to keep the current one.'
                : 'Copy this from your Google Cloud Console OAuth 2.0 Client IDs'}
            </p>
          </div>

          <Separator />

          {/* Redirect URIs */}
          <div className="space-y-4">
            <div>
              <Label>Authorized Redirect URIs</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Copy these URIs and add them to your Google Cloud Console OAuth configuration
              </p>
            </div>

            <div className="space-y-2">
              {redirectUris.map((uri) => (
                <div key={uri} className="flex gap-2">
                  <Input value={uri} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(uri)}>
                    Copy
                  </Button>
                </div>
              ))}
            </div>

            {redirectUris.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Redirect URIs will be generated automatically based on your current domain.
              </p>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleSave} disabled={isFormLoading}>
              {isFormLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Configuration
            </Button>

            {(clientId.trim() || clientSecret.trim()) && (
              <Button variant="outline" onClick={handleTest}>
                <TestTube className="mr-2 h-4 w-4" />
                Test Configuration
              </Button>
            )}

            {configData && (
              <Button variant="destructive" onClick={handleReset}>
                Reset Configuration
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Guide</CardTitle>
          <CardDescription>Configure Google OAuth for your application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. Create Google Cloud Project</h4>
              <p className="text-muted-foreground">
                Create or select a project in Google Cloud Console. Add the Project ID above for
                easier navigation.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Configure OAuth Consent Screen</h4>
              <p className="text-muted-foreground mb-2">
                Set up your app information including name, support email, and authorized domains.
              </p>
              <Link
                href={googleCloudLinks.authPlatform}
                target="_blank"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                OAuth Consent Screen
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Create OAuth Credentials</h4>
              <p className="text-muted-foreground mb-2">
                Create a new OAuth 2.0 Client ID with these settings:
              </p>
              <div className="ml-4 space-y-1 text-muted-foreground">
                <p>
                  • <strong>Application Type:</strong> Web Application
                </p>
                <p>
                  • <strong>Authorized JavaScript origins:</strong> Your domain(s)
                </p>
                <p>
                  • <strong>Authorized redirect URIs:</strong> Copy from the redirect URIs section
                  above
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">4. Configure Application</h4>
              <p className="text-muted-foreground">
                Copy the Client ID and Secret from your OAuth credentials and enter them in the
                configuration form above.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Copies text to clipboard and shows success/error toast notification.
 */
async function _copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch (error: unknown) {
    console.error('Failed to copy to clipboard:', error);
    toast.error('Failed to copy to clipboard');
  }
}

/**
 * Validates Google Client ID format.
 */
function _validateClientIdFormat(clientId: string): { isValid: boolean; message?: string } {
  if (!clientId.trim()) {
    return { isValid: true }; // Empty is valid (not required for validation)
  }

  const pattern = /^\d+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$/;
  if (!pattern.test(clientId.trim())) {
    return {
      isValid: false,
      message: 'Expected format: 123456789012-abcdefg.apps.googleusercontent.com',
    };
  }

  return { isValid: true };
}

/**
 * Gets CSS class for Client ID input based on validation state.
 */
function _getClientIdValidationClass(clientId: string): string {
  if (!clientId.trim()) {
    return '';
  }
  const validation = _validateClientIdFormat(clientId);
  return validation.isValid
    ? 'border-green-500 dark:border-green-400'
    : 'border-amber-500 dark:border-amber-400';
}

/**
 * Renders Client ID validation message and help text.
 */
function _renderClientIdValidation(clientId: string) {
  const validation = _validateClientIdFormat(clientId);
  return (
    <div className="space-y-1">
      {!validation.isValid && validation.message && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {validation.message}
        </p>
      )}
      {validation.isValid && clientId.trim() && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Client ID format looks correct
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Copy this from your Google Cloud Console OAuth 2.0 Client IDs
      </p>
    </div>
  );
}

/**
 * Generates Google Cloud Console convenience links based on project ID.
 */
function _getGoogleCloudLinks(projectId: string) {
  const hasProjectId = projectId.trim().length > 0;
  const baseUrl = 'https://console.cloud.google.com';

  return {
    hasProjectId,
    console: hasProjectId ? `${baseUrl}?project=${encodeURIComponent(projectId.trim())}` : baseUrl,
    authPlatform: hasProjectId
      ? `${baseUrl}/auth/overview?inv=1&invt=Ab1dxg&project=${encodeURIComponent(projectId.trim())}`
      : `${baseUrl}/auth/overview?inv=1&invt=Ab1dxg`,
    credentials: hasProjectId
      ? `${baseUrl}/apis/credentials?project=${encodeURIComponent(projectId.trim())}`
      : `${baseUrl}/apis/credentials`,
    apisLibrary: hasProjectId
      ? `${baseUrl}/apis/library?project=${encodeURIComponent(projectId.trim())}`
      : `${baseUrl}/apis/library`,
    oauth: hasProjectId
      ? `${baseUrl}/apis/credentials/oauthconsent?project=${encodeURIComponent(projectId.trim())}`
      : `${baseUrl}/apis/credentials/oauthconsent`,
  };
}

/**
 * Computes display value for client secret field showing masked value or user input.
 */
function _getClientSecretDisplayValue(
  configData: { hasClientSecret?: boolean } | undefined,
  clientSecretFocused: boolean,
  clientSecret: string
): string {
  const hasExistingSecret = configData?.hasClientSecret;
  const hasUserInput = clientSecret.length > 0;

  // If there's an existing secret, field is not focused, and user hasn't entered anything
  if (hasExistingSecret && !clientSecretFocused && !hasUserInput) {
    return '••••••••••••••••••••••••••••••••';
  }

  // Otherwise show the actual input value
  return clientSecret;
}

/**
 * Handles client secret field focus by setting focused state.
 */
function _handleClientSecretFocus(setClientSecretFocused: (focused: boolean) => void): void {
  setClientSecretFocused(true);
}

/**
 * Handles client secret field blur by clearing focused state.
 */
function _handleClientSecretBlur(setClientSecretFocused: (focused: boolean) => void): void {
  setClientSecretFocused(false);
}

/**
 * Handles enable/disable toggle for Google Authentication.
 */
async function _handleToggleEnabled(
  newEnabled: boolean,
  toggleEnabled: (params: { enabled: boolean }) => Promise<{ success: boolean; message: string }>,
  setEnabled: (enabled: boolean) => void
): Promise<void> {
  try {
    await toggleEnabled({ enabled: newEnabled });
    setEnabled(newEnabled);
    toast.success(`Google Auth ${newEnabled ? 'enabled' : 'disabled'} successfully`);
  } catch (error: unknown) {
    console.error('Failed to toggle Google Auth:', error);
    toast.error('Failed to toggle Google Auth. Please try again.');
  }
}

interface _SaveConfigParams {
  isFormLoading: boolean;
  setIsFormLoading: (loading: boolean) => void;
  redirectUris: string[];
  projectId: string;
  clientId: string;
  clientSecret: string;
  configData: { hasClientSecret?: boolean } | undefined;
  enabled: boolean;
  updateConfig: (params: {
    enabled: boolean;
    projectId?: string;
    clientId: string;
    clientSecret: string;
    redirectUris: string[];
  }) => Promise<{ success: boolean; message: string }>;
  setIsConfigured: (configured: boolean) => void;
}

/**
 * Handles form submission to save Google OAuth configuration.
 */
async function _handleSave(params: _SaveConfigParams): Promise<void> {
  const {
    isFormLoading,
    setIsFormLoading,
    redirectUris,
    projectId,
    clientId,
    clientSecret,
    configData,
    enabled,
    updateConfig,
    setIsConfigured,
  } = params;

  if (isFormLoading) return;

  setIsFormLoading(true);
  try {
    if (redirectUris.length === 0) {
      toast.error('No redirect URIs available. Please refresh the page.');
      return;
    }

    if (!clientId.trim()) {
      toast.error('Client ID is required');
      return;
    }

    // Check if client secret is required (new configuration or replacing existing)
    const hasExistingSecret = configData?.hasClientSecret;
    if (!hasExistingSecret && !clientSecret.trim()) {
      toast.error('Client Secret is required for new configuration');
      return;
    }

    await updateConfig({
      enabled, // Keep current enabled state
      projectId: projectId.trim() || undefined,
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(), // Backend will preserve existing if empty and one exists
      redirectUris: redirectUris,
    });

    toast.success('Google Auth configuration saved successfully');
    setIsConfigured(true);
  } catch (error: unknown) {
    console.error('Failed to save Google Auth configuration:', error);
    toast.error('Failed to save configuration. Please try again.');
  } finally {
    setIsFormLoading(false);
  }
}

/**
 * Handles configuration test using the provided clientId and optional clientSecret.
 * If no clientSecret is provided, the backend will use the saved one.
 */
async function _handleTest(
  clientId: string,
  clientSecret: string,
  testConfig: (params: { clientId: string; clientSecret?: string }) => Promise<{
    success: boolean;
    message: string;
    details?: { issues?: string[] };
  }>
): Promise<void> {
  // Client ID is mandatory
  if (!clientId.trim()) {
    toast.error('Please enter a Client ID to test the configuration');
    return;
  }

  try {
    const params: { clientId: string; clientSecret?: string } = {
      clientId: clientId.trim(),
    };

    // Only include clientSecret if provided
    if (clientSecret.trim()) {
      params.clientSecret = clientSecret.trim();
    }

    const result = await testConfig(params);

    if (result.success) {
      toast.success(`✅ Configuration is valid: ${result.message}`);
    } else {
      toast.error(`❌ Configuration failed: ${result.message}`);
    }
  } catch (error: unknown) {
    console.error('Failed to test Google Auth configuration:', error);
    toast.error('Failed to test configuration. Please try again.');
  }
}

/**
 * Handles configuration reset with confirmation dialog.
 */
async function _handleReset(
  resetConfig: (params: Record<string, never>) => Promise<{ success: boolean; message: string }>,
  setProjectId: (id: string) => void,
  setClientId: (id: string) => void,
  setClientSecret: (secret: string) => void,
  setIsConfigured: (configured: boolean) => void
): Promise<void> {
  if (
    !confirm(
      'Are you sure you want to reset the Google Auth configuration? This action cannot be undone.'
    )
  ) {
    return;
  }

  try {
    await resetConfig({});
    toast.success('Google Auth configuration has been reset');
    // Note: enabled state is preserved and handled separately
    setProjectId('');
    setClientId('');
    setClientSecret('');
    setIsConfigured(false);
  } catch (error: unknown) {
    console.error('Failed to reset Google Auth configuration:', error);
    toast.error('Failed to reset configuration. Please try again.');
  }
}
