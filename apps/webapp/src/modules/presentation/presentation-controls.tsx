'use client';

import { Info, LinkIcon, Maximize2, Minimize2, MonitorSmartphone, UserIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { usePresentationContext } from './presentation-container';
import { Button } from '../../components/ui/button';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Custom hook for safe client-side feature detection
const useClientSideFeatures = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return {
    isMounted,
    isClient: typeof window !== 'undefined',
  };
};

/**
 * PresentationControls Component
 *
 * Provides UI controls for presentation navigation and synchronization features.
 * Handles different user roles (presenter, viewer, solo mode) and their interactions.
 */
export function PresentationControls() {
  // Get all presentation state and methods from context
  const {
    currentSlide,
    totalSlides,
    previousSlide,
    nextSlide,
    isFullScreen,
    controlsVisible,
    toggleFullScreen,
    isPresenter, // Whether current user is the active presenter
    isPresentationActive, // Whether any presentation is active
    isSoloMode, // Whether viewer is navigating independently
    startPresenting,
    stopPresenting,
    followPresenter,
  } = usePresentationContext();

  // For safe client-side feature detection
  const { isMounted, isClient } = useClientSideFeatures();

  // Local state for the info dialog
  const [showSyncInfo, setShowSyncInfo] = useState(false);
  const infoButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Using classNames for responsive positioning instead of explicit coordinates
  const [dialogPosition, setDialogPosition] = useState<'center' | 'default'>('default');

  // Close the info dialog
  const handleCloseModal = useCallback(() => {
    setShowSyncInfo(false);
  }, []);

  // Position dialog when shown
  useEffect(() => {
    if (!showSyncInfo || !isMounted) return;

    // Check if we need to use center positioning (for small screens)
    const updateDialogPosition = () => {
      // Use CSS breakpoint equivalent check - sm is typically 640px
      if (isClient && window.innerWidth < 640) {
        setDialogPosition('center');
      } else {
        setDialogPosition('default');
      }
    };

    // Initial position calculation
    updateDialogPosition();

    // Update on resize
    if (isClient) {
      window.addEventListener('resize', updateDialogPosition);
      return () => window.removeEventListener('resize', updateDialogPosition);
    }
  }, [showSyncInfo, isMounted, isClient]);

  // Handle Escape key to close the info dialog
  useEffect(() => {
    if (!isClient || !showSyncInfo) return;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [showSyncInfo, handleCloseModal, isClient]);

  // Handle key down events within the dialog
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCloseModal();
    }
  };

  /**
   * Create and copy a shareable link with sync enabled
   * Includes the current slide position in the URL
   */
  const copyShareableLink = useCallback(() => {
    if (!isClient) return;

    // Create URL with current slide
    const url = new URL(window.location.href);
    url.searchParams.set('slide', currentSlide.toString());

    navigator.clipboard
      .writeText(url.toString())
      .then(() => {
        toast.success('Link copied!', {
          description: 'Shareable link has been copied to clipboard',
          duration: 3000,
        });
      })
      .catch((error) => {
        toast.error('Failed to copy', {
          description: 'Please copy the URL manually from your address bar',
          duration: 3000,
        });
        console.error('Failed to copy URL:', error);
      });
  }, [currentSlide, isClient]);

  /**
   * Handle sync button click based on current state
   *
   * Different behaviors based on:
   * 1. User's role (presenter/viewer)
   * 2. Whether a presentation is active
   * 3. Whether viewer is in solo mode
   */
  const handleSyncButtonClick = useCallback(() => {
    // If user is presenter, stop presenting
    if (isPresenter) {
      stopPresenting();
    }
    // If there's an active presentation and user is not presenter
    else if (isPresentationActive) {
      if (isSoloMode) {
        // If in solo mode, return to following presenter
        followPresenter();
      } else {
        // If following presenter, advance to next slide
        nextSlide();
      }
    }
    // If no active presentation, start presenting
    else {
      startPresenting();
    }
  }, [
    isPresenter,
    stopPresenting,
    isPresentationActive,
    isSoloMode,
    followPresenter,
    nextSlide,
    startPresenting,
  ]);

  /**
   * Determine the sync button's appearance and tooltip based on current state
   * Returns variant, icon, and tooltip text for the button
   */
  const getSyncButtonState = useCallback(() => {
    // User is presenter - show option to stop presenting
    if (isPresenter) {
      return {
        variant: 'default' as const,
        icon: <MonitorSmartphone className="h-4 w-4 text-background" />,
        tooltip: 'Stop Presenting',
      };
    }

    // There's an active presentation
    if (isPresentationActive) {
      // User is in solo mode - show option to return to presenter
      if (isSoloMode) {
        return {
          variant: 'outline' as const,
          icon: <MonitorSmartphone className="h-4 w-4" />,
          tooltip: 'Return to Presenter',
        };
      }

      // User is following presenter - show status
      return {
        variant: 'secondary' as const,
        icon: <MonitorSmartphone className="h-4 w-4" />,
        tooltip: 'Following Presenter',
      };
    }

    // No active presentation - show option to start presenting
    return {
      variant: 'ghost' as const,
      icon: <MonitorSmartphone className="h-4 w-4" />,
      tooltip: 'Start Presenting',
    };
  }, [isPresenter, isPresentationActive, isSoloMode]);

  const syncButtonState = getSyncButtonState();

  return (
    <>
      {/* Main Controls - Fixed bar at bottom of screen */}
      <div
        className={cn(
          'fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 gap-3 transition-opacity duration-300 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md',
          // Hide controls in fullscreen mode when not interacting
          isFullScreen && !controlsVisible && 'opacity-0'
        )}
      >
        {/* Role Badge */}
        <Badge
          variant={isPresenter ? 'default' : isSoloMode ? 'outline' : 'secondary'}
          className="flex items-center gap-1 h-8"
        >
          <UserIcon className="h-3 w-3" />
          {isPresenter ? 'Presenting' : isSoloMode ? 'Solo Mode' : 'Viewer'}
        </Badge>

        {/* Slide Navigation Controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={previousSlide}>
            ←
          </Button>
          <div className="min-w-12 text-center">
            {currentSlide} / {totalSlides}
          </div>
          <Button variant="ghost" size="icon" onClick={nextSlide}>
            →
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Additional Controls (Fullscreen, Sync, Info) */}
        <div className="flex items-center gap-2">
          {/* Fullscreen Toggle - Hidden on mobile with CSS */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullScreen}
                  className="hidden sm:flex h-8 w-8"
                >
                  {isFullScreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Sync Control Button - Changes based on current state */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={syncButtonState.variant}
                  size="icon"
                  onClick={handleSyncButtonClick}
                  className="h-8 w-8"
                >
                  {syncButtonState.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{syncButtonState.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Info Button - Shows detailed controls and status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSyncInfo(true)}
                  className="h-8 w-8"
                  ref={infoButtonRef}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Presentation Info</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Info Dialog - Shown when info button is clicked */}
      {showSyncInfo && isMounted && (
        <div
          className="fixed inset-0 z-50 bg-black/30"
          onClick={handleCloseModal}
          onKeyDown={handleKeyDown}
          aria-hidden="true"
        >
          <dialog
            ref={dialogRef}
            open
            className={cn(
              'bg-card shadow-lg rounded-lg p-4 w-80 max-w-[calc(100vw-40px)]',
              // Apply different classes based on screen size
              dialogPosition === 'center'
                ? 'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' // Centered on mobile
                : 'absolute z-50 max-h-[80vh] overflow-y-auto' // Default positioning near button on desktop
            )}
            style={{
              margin: 0,
              // Only apply specific positioning for desktop mode
              ...(dialogPosition === 'default' &&
                infoButtonRef.current && {
                  top: `${Math.max(20, infoButtonRef.current.getBoundingClientRect().top - 430)}px`,
                  left: `${Math.max(20, infoButtonRef.current.getBoundingClientRect().left - 160)}px`,
                }),
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Presentation Controls</h2>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleCloseModal}>
                ✕
              </Button>
            </div>

            <div className="space-y-3">
              {/* Keyboard Shortcuts Section */}
              <section>
                <h3 className="text-sm font-medium">Keyboard Shortcuts</h3>
                <ul className="text-xs mt-1 space-y-1">
                  <li className="flex justify-between">
                    <span className="font-mono">←/→</span>
                    <span>Navigate slides</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="font-mono">Space</span>
                    <span>Next slide</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="font-mono">F</span>
                    <span>Toggle fullscreen</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="font-mono">Esc</span>
                    <span>Close this dialog</span>
                  </li>
                </ul>
              </section>

              <div className="h-px w-full bg-border" />

              {/* Sync Status Section */}
              <section>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Sync Status</h3>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    Connected
                  </span>
                </div>

                {/* Sync Controls - Only shown when sync is enabled */}

                {/* Role Display */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">Role:</span>
                  <span className="text-xs font-medium">
                    {isPresenter ? 'Presenter' : isSoloMode ? 'Solo Viewer' : 'Viewer'}
                  </span>
                </div>

                {/* Status Message - Different based on user role */}
                <p className="text-xs text-muted-foreground mt-1">
                  {isPresenter
                    ? 'You are controlling the presentation for all viewers.'
                    : isPresentationActive
                      ? isSoloMode
                        ? 'You are viewing independently. Click "Return to Presenter" to follow again.'
                        : "You are following the presenter's slides."
                      : 'No active presentation. Click "Start Presenting" to begin.'}
                </p>

                {/* Button: Return to presenter - For viewers in solo mode */}
                {isPresentationActive && !isPresenter && isSoloMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={followPresenter}
                    className="flex items-center gap-1 text-xs w-full mt-2 h-8"
                  >
                    <MonitorSmartphone className="h-3 w-3" />
                    Return to presenter
                  </Button>
                )}

                {/* Button: Become presenter - For viewers following presenter */}
                {isPresentationActive && !isPresenter && !isSoloMode && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={startPresenting}
                    className="flex items-center gap-1 text-xs w-full mt-2 h-8"
                  >
                    <MonitorSmartphone className="h-3 w-3" />
                    Become presenter
                  </Button>
                )}

                {/* Button: Start presenting - When no presentation is active */}
                {!isPresenter && !isPresentationActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startPresenting}
                    className="flex items-center gap-1 text-xs w-full mt-2 h-8"
                  >
                    <MonitorSmartphone className="h-3 w-3" />
                    Start presenting
                  </Button>
                )}

                {/* Button: Stop presenting - For current presenter */}
                {isPresenter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopPresenting}
                    className="flex items-center gap-1 text-xs w-full mt-2 h-8"
                  >
                    <MonitorSmartphone className="h-3 w-3" />
                    Stop presenting
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyShareableLink}
                  className="flex items-center gap-1 text-xs w-full mt-2 h-8"
                >
                  <LinkIcon className="h-3 w-3" />
                  Copy shareable link
                </Button>
              </section>
            </div>
          </dialog>
        </div>
      )}
    </>
  );
}
