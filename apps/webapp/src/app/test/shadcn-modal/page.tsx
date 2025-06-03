'use client';

import { CalendarIcon, Edit, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function ShadcnModalTestPage() {
  const [date, setDate] = useState<Date>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');

  const handleAddAction = () => {
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    console.log('Saving:', { title, date });
    setIsDialogOpen(false);
    setTitle('');
    setDate(undefined);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shadcn Modal Components Test</h1>
          <p className="text-muted-foreground mt-2">
            Testing complex interactions between DropdownMenu, Dialog, and Popover components
          </p>
        </div>

        {/* Known Issues */}
        <div className="border rounded-lg p-6 space-y-4 bg-red-50 dark:bg-red-950/20">
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-100">
            🚨 Known Issues with Shadcn Modals
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">
                1. Pointer Events Issue (Loss of Page Interactivity)
              </h3>
              <p className="text-red-700 dark:text-red-300">
                After opening and closing modal components (Dialog, DropdownMenu, Popover), the page
                becomes unresponsive because{' '}
                <code className="bg-red-100 dark:bg-red-900 px-1 rounded">
                  pointer-events: none
                </code>{' '}
                remains applied to the body element. This is especially noticeable after dismissing
                a modal that was opened from a dropdown menu item.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">
                2. Nested Popover/Calendar Issue (iOS Specific)
              </h3>
              <p className="text-red-700 dark:text-red-300">
                Components like date pickers (which use Popover internally) fail to open or become
                unresponsive when rendered inside other modals, particularly the Calendar component
                on <strong>iOS devices</strong>. The primary fix involves ensuring{' '}
                <code className="bg-red-100 dark:bg-red-900 px-1 rounded">modal=true</code> is
                correctly set on the Popover component.
              </p>
            </div>
          </div>
        </div>

        {/* Fixes Applied */}
        <div className="border rounded-lg p-6 space-y-4 bg-green-50 dark:bg-green-950/20">
          <h2 className="text-xl font-semibold text-green-900 dark:text-green-100">
            ✅ Fixes Applied
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                1. Default Modal Prop Override
              </h3>
              <p className="text-green-700 dark:text-green-300 mb-2">
                Modified all shadcn UI modal components to default{' '}
                <code className="bg-green-100 dark:bg-green-900 px-1 rounded">modal=true</code>:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-green-700 dark:text-green-300">
                <li>
                  <code>src/components/ui/dropdown-menu.tsx</code>
                </li>
                <li>
                  <code>src/components/ui/dialog.tsx</code>
                </li>
                <li>
                  <code>src/components/ui/popover.tsx</code>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                2. Version Alignment via PNPM Overrides
              </h3>
              <p className="text-green-700 dark:text-green-300 mb-2">
                Added version override in root <code>package.json</code> to ensure all components
                use the same dismissable layer version:
              </p>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded font-mono text-xs">
                <pre>
                  {`{
  "pnpm": {
    "overrides": {
      "@radix-ui/react-dismissable-layer": "1.1.10"
    }
  }
}`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                3. How These Fixes Work
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-1 text-green-700 dark:text-green-300">
                <li>Proper modal behavior ensures correct focus and dismissal management</li>
                <li>
                  Version alignment of dismissable layers allows correct state tracking across react
                  contexts with different package versions
                </li>
                <li>iOS calendar issues are resolved through proper modal portal management</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Test Components */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Test Components</h2>
          <p className="text-sm text-muted-foreground">
            Use the action button below to test the interaction flow: DropdownMenu → Dialog → Date
            Picker (Popover + Calendar)
          </p>

          <div className="flex justify-center pt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleAddAction}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Component Status */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-950/50 rounded">
            <h3 className="font-medium mb-2">Current State</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Dialog:</span>{' '}
                {isDialogOpen ? 'Open' : 'Closed'}
              </div>
              <div>
                <span className="text-muted-foreground">Selected Date:</span>{' '}
                {date ? date.toDateString() : 'None'}
              </div>
            </div>
          </div>
        </div>

        {/* Dialog Component */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>
                Test form with date picker. The calendar should open correctly on all devices,
                including iOS.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter title..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Date</Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? date.toDateString() : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Test Instructions */}
        <div className="border rounded-lg p-6 space-y-4 bg-blue-50 dark:bg-blue-950/20">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
            📋 Test Instructions
          </h2>
          <div className="space-y-4 text-sm">
            <p className="text-blue-800 dark:text-blue-200 font-medium">
              Follow these steps in order to verify all fixes are working correctly:
            </p>

            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">Open Action Menu</p>
                  <p className="text-blue-800 dark:text-blue-200">
                    Click the "Actions" button to open the dropdown menu.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">Test Click Outside</p>
                  <p className="text-blue-800 dark:text-blue-200">
                    Click outside the menu to close it, then verify the "Actions" button is still
                    clickable.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">Test Dialog Flow</p>
                  <p className="text-blue-800 dark:text-blue-200">
                    Open action menu → click "Add" → click outside dialog to close → ensure
                    "Actions" button remains clickable.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <div>
                  <p className="font-medium text-orange-900 dark:text-orange-100">
                    Test iOS Calendar (Critical)
                  </p>
                  <p className="text-orange-800 dark:text-orange-200">
                    Open action menu → click "Add" → click date picker button →{' '}
                    <strong>verify calendar opens on iOS devices</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  5
                </span>
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">Final Verification</p>
                  <p className="text-blue-800 dark:text-blue-200">
                    After completing all interactions, click outside to close everything and ensure
                    the "Actions" button is still clickable.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 rounded">
              <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                ✅ Expected Results
              </h3>
              <ul className="list-disc list-inside space-y-1 text-green-800 dark:text-green-200 text-xs">
                <li>All buttons and interactive elements remain clickable throughout the test</li>
                <li>No "pointer-events: none" issues after closing modals</li>
                <li>Date picker opens correctly inside dialogs on all devices, including iOS</li>
                <li>Smooth transitions between all modal states</li>
                <li>Page remains fully responsive after all interactions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
