'use client';
import { LucideBarChart, LucideUsers } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAppVersion } from '@/modules/app/useAppInfo';

export default function Home() {
  const appVersion = useAppVersion();

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center max-w-3xl text-center">
        <h1 className="text-4xl font-bold sm:text-5xl">Bethel ER Budget & Finance</h1>
        <p className="text-lg text-muted-foreground">Your personal finance management solution</p>

        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <Link href="/app">
            <Button size="lg" className="min-w-[160px]">
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="outline" size="lg" className="min-w-[160px]">
              <LucideUsers className="mr-2 h-4 w-4" />
              Leaderboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 w-full">
          <div className="bg-card p-6 rounded-lg border flex flex-col items-center text-center">
            <LucideBarChart className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Track Your Finances</h2>
            <p className="text-muted-foreground">
              Easily track your income, expenses, and savings all in one place.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg border flex flex-col items-center text-center">
            <LucideUsers className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Community Leaderboard</h2>
            <p className="text-muted-foreground">
              See how your financial tracking compares with others in the community.
            </p>
          </div>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <div>App Version: {appVersion ?? 'Loading...'}</div>
      </footer>
    </div>
  );
}
