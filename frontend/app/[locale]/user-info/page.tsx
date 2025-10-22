'use client';

import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/providers/toast-provider';

export default function UserInfoPage() {
  const { user, isLoaded } = useUser();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { showToast } = useToast();

  const copyToClipboard = async (text: string, field: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      showToast({
        variant: 'success',
        title: `${label} copied!`,
        description: 'Paste it anywhere you need it.',
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showToast({ variant: 'error', title: 'Failed to copy to clipboard.' });
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Please sign in to view your user information.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const syncCommand = `npx tsx scripts/manual-sync.ts ${user.id} ${user.primaryEmailAddress?.emailAddress} "${user.fullName || user.firstName || 'Anonymous'}"`;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Clerk User Information</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Clerk Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clerk User ID
              </label>
              <div className="flex gap-2">
                <code className="flex-1 p-3 bg-gray-100 rounded-lg text-sm break-all">
                  {user.id}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(user.id, 'id', 'User ID')}
                >
                  {copiedField === 'id' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="flex gap-2">
                <code className="flex-1 p-3 bg-gray-100 rounded-lg text-sm">
                  {user.primaryEmailAddress?.emailAddress}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(user.primaryEmailAddress?.emailAddress || '', 'email', 'Email address')}
                >
                  {copiedField === 'email' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <div className="flex gap-2">
                <code className="flex-1 p-3 bg-gray-100 rounded-lg text-sm">
                  {user.fullName || user.firstName || 'Not set'}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(user.fullName || user.firstName || '', 'name', 'Name')}
                >
                  {copiedField === 'name' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">📋 Manual Database Sync</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-blue-800">
              If your user isn't showing in the database, run this command in PowerShell:
            </p>
            
            <div className="relative">
              <pre className="p-4 bg-gray-900 text-green-400 rounded-lg text-sm overflow-x-auto">
                <code>{syncCommand}</code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(syncCommand, 'command', 'Sync command')}
              >
                {copiedField === 'command' ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Command
                  </>
                )}
              </Button>
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-2">Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Copy the command above</li>
                <li>Open PowerShell in the backend directory</li>
                <li>Paste and run the command</li>
                <li>Your user will be synced to the database</li>
                <li>Then run: <code className="bg-gray-100 px-2 py-1 rounded">npx tsx scripts/make-admin.ts {user.primaryEmailAddress?.emailAddress}</code></li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>🔍 Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <div>
              <strong>Issue:</strong> User not syncing automatically
              <br />
              <strong>Solution:</strong> Use the manual sync command above
            </div>
            <div>
              <strong>Issue:</strong> Can't access admin panel
              <br />
              <strong>Solution:</strong> After syncing, run make-admin command
            </div>
            <div>
              <strong>Issue:</strong> "No users in database" message
              <br />
              <strong>Solution:</strong> Database and Clerk aren't synced yet - use manual sync
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
