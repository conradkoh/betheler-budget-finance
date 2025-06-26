'use client';

import { Checklist } from '@/modules/checklist/checklist';

/**
 * Test page for demonstrating checklist functionality and layouts.
 * Showcases various checklist configurations including single, side-by-side,
 * and three-column layouts with different titles and descriptions.
 *
 * This page serves as:
 * - Development testing environment for checklist features
 * - Visual demonstration of responsive layouts
 * - Example implementation reference for developers
 * - UI/UX validation for different use cases
 */
export default function ChecklistTestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Checklist Test Page</h1>

      <div className="space-y-8">
        {/* Basic Checklist Example */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Project Tasks</h2>
          <div className="max-w-md">
            <Checklist
              title="Sprint Planning"
              description="Organize and prioritize tasks for the upcoming sprint"
              checklistKey="test-sprint-planning"
            />
          </div>
        </div>

        {/* Meeting Checklist */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Meeting Preparation</h2>
          <div className="max-w-md">
            <Checklist
              title="Team Meeting Prep"
              description="Essential items to prepare before the team standup"
              checklistKey="test-meeting-prep"
            />
          </div>
        </div>

        {/* Daily Tasks */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Daily Routine</h2>
          <div className="max-w-md">
            <Checklist title="Morning Checklist" checklistKey="test-morning-routine" />
          </div>
        </div>

        {/* Side-by-side Layout Example */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Multiple Checklists</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Development Tasks</h3>
              <Checklist
                title="Code Review"
                description="Quality assurance checklist for code reviews"
                checklistKey="test-code-review"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Deployment Tasks</h3>
              <Checklist
                title="Release Checklist"
                description="Pre-deployment verification steps"
                checklistKey="test-release-checklist"
              />
            </div>
          </div>
        </div>

        {/* Three Column Layout */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Project Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">To Do</h3>
              <Checklist title="Backlog" checklistKey="test-backlog" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">In Progress</h3>
              <Checklist
                title="Current Sprint"
                description="Active development tasks"
                checklistKey="test-current-sprint"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Review</h3>
              <Checklist title="QA Checklist" checklistKey="test-qa-checklist" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
