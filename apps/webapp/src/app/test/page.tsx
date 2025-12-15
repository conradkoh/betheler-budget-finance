'use client';

import { CheckSquare, FileText, Lock, MessageCircle, Monitor, Settings } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TestPage {
  path: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badges?: string[];
  status?: 'stable' | 'experimental' | 'demo';
}

const testPages: TestPage[] = [
  {
    path: '/test/attendance',
    title: 'Attendance Tracker',
    description:
      'Interactive attendance tracking system with real-time updates, name management, and remarks functionality.',
    icon: CheckSquare,
    badges: ['Real-time', 'Interactive'],
    status: 'stable',
  },
  {
    path: '/test/checklist',
    title: 'Checklist Components',
    description:
      'Comprehensive checklist system demonstrating various layouts, configurations, and responsive designs.',
    icon: CheckSquare,
    badges: ['Responsive', 'Multiple Layouts'],
    status: 'stable',
  },
  {
    path: '/test/discussion',
    title: 'Discussion Forums',
    description:
      'Interactive discussion components with real-time updates, multiple forum configurations, and responsive layouts.',
    icon: MessageCircle,
    badges: ['Real-time', 'Forums'],
    status: 'stable',
  },
  {
    path: '/test/mdx',
    title: 'MDX Rendering',
    description:
      'Advanced MDX rendering capabilities with custom components, dark mode support, and typography styling.',
    icon: FileText,
    badges: ['Typography', 'Dark Mode'],
    status: 'stable',
  },
  {
    path: '/test/password-protection',
    title: 'Password Protection',
    description:
      'Advanced password protection system with conditional rendering, temporary hiding, and authentication controls.',
    icon: Lock,
    badges: ['Security', 'Authentication'],
    status: 'demo',
  },
  {
    path: '/test/presentations',
    title: 'Presentation Mode',
    description:
      'Enhanced presenter mode with automatic joining, role-based permissions, and synchronized slide navigation.',
    icon: Monitor,
    badges: ['Sync', 'Multi-device'],
    status: 'stable',
  },
  {
    path: '/test/shadcn-modal',
    title: 'Shadcn Modal Components',
    description:
      'Complex modal interactions testing DropdownMenu, Dialog, and Popover components with iOS compatibility fixes.',
    icon: Settings,
    badges: ['iOS Fix', 'Modal Testing'],
    status: 'experimental',
  },
];

function getStatusBadgeVariant(status: TestPage['status']) {
  switch (status) {
    case 'stable':
      return 'default';
    case 'experimental':
      return 'secondary';
    case 'demo':
      return 'outline';
    default:
      return 'default';
  }
}

function getStatusColor(status: TestPage['status']) {
  switch (status) {
    case 'stable':
      return 'text-green-600 dark:text-green-400';
    case 'experimental':
      return 'text-orange-600 dark:text-orange-400';
    case 'demo':
      return 'text-blue-600 dark:text-blue-400';
    default:
      return 'text-muted-foreground';
  }
}

export default function TestIndexPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Test Suite</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Explore and test various components, features, and functionality. Each test page
            demonstrates different aspects of the application with interactive examples.
          </p>
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Test pages are only available in development mode. They provide
              a playground for testing components and features before integration.
            </p>
          </div>
        </div>

        {/* Test Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testPages.map((page) => {
            const Icon = page.icon;
            return (
              <Link key={page.path} href={page.path} className="group">
                <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {page.title}
                          </CardTitle>
                        </div>
                      </div>
                      {page.status && (
                        <Badge
                          variant={getStatusBadgeVariant(page.status)}
                          className={`text-xs ${getStatusColor(page.status)}`}
                        >
                          {page.status}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-muted-foreground mb-4 line-clamp-3">
                      {page.description}
                    </CardDescription>

                    {page.badges && page.badges.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {page.badges.map((badge) => (
                          <Badge
                            key={badge}
                            variant="outline"
                            className="text-xs bg-accent/50 hover:bg-accent border-border"
                          >
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Footer Information */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 inline-block">
                <CheckSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-foreground">Interactive Components</h3>
              <p className="text-sm text-muted-foreground">
                All test pages feature fully interactive components with real-time functionality
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 inline-block">
                <Monitor className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-foreground">Responsive Design</h3>
              <p className="text-sm text-muted-foreground">
                Test components across different screen sizes and device types
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 inline-block">
                <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-foreground">Development Tools</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive testing environment for development and debugging
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
