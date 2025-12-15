'use client';

import { useSearchParams } from 'next/navigation';
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/utils';
import { usePresentationSync } from '@/modules/presentation/use-presentation-sync';

type PresentationContextType = {
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  currentSlide: number;
  totalSlides: number;
  nextSlide: () => void;
  previousSlide: () => void;
  goToSlide: (index: number) => void;
  controlsVisible: boolean;
  isSynced: boolean;
  isPresenter: boolean;
  isPresentationActive: boolean;
  isFollowing: boolean;
  isSoloMode: boolean;
  sessionId: string;
  startPresenting: () => void;
  stopPresenting: () => void;
  followPresenter: () => void;
};

const PresentationContext = createContext<PresentationContextType | null>(null);

export function usePresentationContext() {
  const context = useContext(PresentationContext);
  if (!context) {
    throw new Error('usePresentationContext must be used within a PresentationContainer');
  }
  return context;
}

interface PresentationContainerProps {
  children: React.ReactNode;
  totalSlides: number;
  className?: string;
  presentationKey: string;
  fallback?: React.ReactNode;
}

// Main component that wraps the inner component with Suspense
export function PresentationContainer({
  fallback,
  children,
  ...props
}: PresentationContainerProps) {
  return (
    <Suspense fallback={fallback}>
      <PresentationContainerInner {...props}>{children}</PresentationContainerInner>
    </Suspense>
  );
}

function PresentationContainerInner({
  children,
  totalSlides,
  className,
  presentationKey,
}: PresentationContainerProps) {
  const searchParams = useSearchParams();
  const slideParam = searchParams.get('slide');

  // Initialize slide from URL if available, otherwise default to 1
  const initialSlide = slideParam
    ? Math.max(1, Math.min(Number.parseInt(slideParam, 10), totalSlides))
    : 1;

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Use the presentation sync hook
  const {
    currentSlide,
    nextSlide: nextSlideSync,
    previousSlide: previousSlideSync,
    goToSlide: goToSlideSync,
    isPresenter,
    isPresentationActive,
    isFollowing,
    isSoloMode,
    sessionId,
    startPresenting,
    stopPresenting,
    followPresenter,
  } = usePresentationSync({
    key: presentationKey,
    initialSlide: !Number.isNaN(initialSlide) ? initialSlide : 1,
    totalSlides,
  });

  // Sync is always enabled since presentationKey is mandatory
  const isSynced = true;

  // Handle fullscreen changes from outside (e.g., Escape key)
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  // Auto-hide controls in fullscreen mode
  useEffect(() => {
    if (!isFullScreen) {
      setControlsVisible(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const startHideTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    };

    const handleMouseMove = () => {
      setControlsVisible(true);
      startHideTimer();
    };

    window.addEventListener('mousemove', handleMouseMove);
    startHideTimer();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isFullScreen]);

  const toggleFullScreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullScreen(false);
    }
  }, []);

  // These slide navigation methods use the ones from the sync hook
  const nextSlide = useCallback(() => {
    nextSlideSync();
  }, [nextSlideSync]);

  const previousSlide = useCallback(() => {
    previousSlideSync();
  }, [previousSlideSync]);

  const goToSlide = useCallback(
    (index: number) => {
      goToSlideSync(index);
    },
    [goToSlideSync]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the event originated from an input field
      const target = e.target as HTMLElement;
      const isTextInput =
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLInputElement && (!target.type || target.type === 'text')) ||
        target.isContentEditable;

      // If we're in a text input and modifier keys are pressed,
      // let the browser handle text editing shortcuts
      if (isTextInput && (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey)) {
        return;
      }

      // If we're in a text input with no modifiers, don't navigate
      if (isTextInput) {
        return;
      }

      // Handle navigation shortcuts when not in text input
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        previousSlide();
      } else if (e.key === 'f') {
        toggleFullScreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, previousSlide, toggleFullScreen]);

  return (
    <PresentationContext.Provider
      value={{
        isFullScreen,
        toggleFullScreen,
        currentSlide,
        totalSlides,
        nextSlide,
        previousSlide,
        goToSlide,
        controlsVisible,
        isSynced,
        isPresenter,
        isPresentationActive,
        isFollowing,
        isSoloMode,
        sessionId,
        startPresenting,
        stopPresenting,
        followPresenter,
      }}
    >
      <div
        className={cn(
          'grow bg-background text-foreground flex flex-col justify-center pb-20',
          isFullScreen && 'fixed inset-0 z-50',
          className
        )}
      >
        {children}
      </div>
    </PresentationContext.Provider>
  );
}
