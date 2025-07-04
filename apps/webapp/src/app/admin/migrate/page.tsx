'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MigratePage() {
  const migrateTransactions = useSessionMutation(api.transactions.migrateTransactionTypes);
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<{ updatedCount: number } | null>(null);

  async function handleMigrate() {
    setIsMigrating(true);
    try {
      const migrationResult = await migrateTransactions({});
      setResult(migrationResult);
      toast.success(`Migration complete: ${migrationResult.updatedCount} transactions updated`);
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error('Migration failed. See console for details.');
    } finally {
      setIsMigrating(false);
    }
  }

  return (
    <div className="container max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Transaction Type Migration</CardTitle>
          <CardDescription>
            This utility will update any existing transactions that don't have a transaction type
            set.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>This will automatically assign transaction types based on the following rules:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Negative amounts will be marked as <strong>expense</strong> transactions
            </li>
            <li>
              Positive amounts with &quot;Savings&quot; category will be marked as{' '}
              <strong>savings</strong> transactions
            </li>
            <li>
              All other positive amounts will be marked as <strong>income</strong> transactions
            </li>
          </ul>

          <div className="flex flex-col gap-2 mt-6">
            <Button onClick={handleMigrate} disabled={isMigrating}>
              {isMigrating ? 'Migrating...' : 'Run Migration'}
            </Button>

            {result && (
              <div className="mt-4 p-4 border rounded-md bg-muted">
                <p>Migration completed successfully!</p>
                <p className="font-medium">
                  {result.updatedCount} transactions were updated with transaction types.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
