'use client';

import { ArrowLeftIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  description?: string;
  backLink?: string;
  backLabel?: string;
  action?: ReactNode;
}

export function PageHeader({
  title,
  description,
  backLink = '/app',
  backLabel = 'Dashboard',
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      {/* Back link navigation */}
      <div className="flex items-center gap-3 mb-2">
        <Link href={backLink}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeftIcon className="h-4 w-4" />
            {backLabel}
          </Button>
        </Link>
      </div>

      {/* Header with title and optional action button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
          {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
        </div>
        {action && <div className="w-full sm:w-auto">{action}</div>}
      </div>
    </div>
  );
}
