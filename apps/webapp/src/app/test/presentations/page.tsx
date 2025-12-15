'use client';

import { useState } from 'react';

import { Discussion } from '@/modules/discussion/discussion';
import { PresentationContainer } from '@/modules/presentation/presentation-container';
import { PresentationControls } from '@/modules/presentation/presentation-controls';
import { Slide } from '@/modules/presentation/slide';

function PresentationContent() {
  return (
    <>
      {/* Slides */}
      <Slide index={1}>
        <h1 className="text-6xl font-bold mb-10">Slide 1</h1>
        <div className="text-xl max-w-2xl text-center">
          <h2 className="text-3xl mb-4">Enhanced Presenter Mode Demo</h2>
          <p className="mb-4">
            This presentation demonstrates the enhanced presenter mode with automatic joining.
          </p>
          <ul className="text-left list-disc pl-6 space-y-2">
            <li>When a presenter activates sync mode, viewers automatically join</li>
            <li>Only the presenter can control slide navigation</li>
            <li>Viewers see a different UI indicating they are in view mode</li>
            <li>The presenter can stop presenting at any time</li>
          </ul>
        </div>
      </Slide>

      <Slide index={2}>
        <h1 className="text-6xl font-bold mb-10">Slide 2</h1>
        <div className="text-xl max-w-2xl text-center">
          <h2 className="text-3xl mb-4">How to Use</h2>
          <p className="mb-4">Try these features:</p>
          <ol className="text-left list-decimal pl-6 space-y-2 mb-6">
            <li>Click "Start Presenting" to become a presenter</li>
            <li>Open this page in another tab to see auto-joining as a viewer</li>
            <li>Notice that viewers cannot control navigation</li>
            <li>Try copying the viewer link to share with others</li>
          </ol>
        </div>
      </Slide>

      <Slide index={3}>
        <h1 className="text-6xl font-bold mb-10">Slide 3</h1>
        <div className="text-xl max-w-2xl text-center">
          <h2 className="text-3xl mb-4">Implementation Details</h2>
          <p className="mb-4">The enhanced presenter mode includes:</p>
          <ul className="text-left list-disc pl-6 space-y-2 mb-6">
            <li>Role-based permissions (presenter vs viewer)</li>
            <li>Backend state for active presentations</li>
            <li>Automatic detection and joining of active presentations</li>
            <li>UI differences for presenters and viewers</li>
          </ul>
        </div>
      </Slide>

      <Slide index={4}>
        <h1 className="text-6xl font-bold mb-10">Slide 4</h1>
        <div className="text-xl max-w-2xl text-center">
          <h2 className="text-3xl mb-4">Thank You!</h2>
          <p className="mb-4">
            This enhanced presenter mode creates a more natural presentation experience that works
            across multiple devices.
          </p>
          <p className="mb-4">
            The presenter maintains control while viewers can effortlessly join and follow along.
          </p>

          {/* Discussion component for slide 4 */}
          <div className="mt-8 max-w-md mx-auto">
            <Discussion title="What shall we do?" discussionKey="feedback-discussion" />
          </div>
        </div>
      </Slide>
      {/* Controls */}
      <PresentationControls />
    </>
  );
}

// Generate a unique presentation key based on the URL path
function useUniquePresentation() {
  const [key] = useState(() => {
    // Use a consistent key for this presentation
    return 'test-presentation-demo';
  });

  return key;
}

export default function PresentationTestPage() {
  const presentationKey = useUniquePresentation();

  return (
    <PresentationContainer totalSlides={4} presentationKey={presentationKey}>
      <PresentationContent />
    </PresentationContainer>
  );
}
