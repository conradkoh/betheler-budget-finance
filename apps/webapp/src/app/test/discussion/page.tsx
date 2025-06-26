'use client';

import { Discussion } from '@/modules/discussion/discussion';

export default function DiscussionTestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Discussion Test Page</h1>

      <div className="space-y-8">
        {/* Basic Discussion Example */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Basic Discussion</h2>
          <div className="max-w-md">
            <Discussion title="Team Feedback" discussionKey="test-team-feedback" />
          </div>
        </div>

        {/* Project Planning Discussion */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Project Planning</h2>
          <div className="max-w-md">
            <Discussion title="Q4 Planning Session" discussionKey="test-q4-planning" />
          </div>
        </div>

        {/* Feature Discussion */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Feature Discussion</h2>
          <div className="max-w-md">
            <Discussion title="New Feature Ideas" discussionKey="test-feature-ideas" />
          </div>
        </div>

        {/* Side-by-side Layout Example */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Multiple Discussions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Technical Discussion</h3>
              <Discussion title="Architecture Review" discussionKey="test-architecture-review" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">General Discussion</h3>
              <Discussion title="Open Forum" discussionKey="test-open-forum" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
