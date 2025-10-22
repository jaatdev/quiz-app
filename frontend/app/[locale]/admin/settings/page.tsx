'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Database, Shield, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/providers/toast-provider';
import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

export default function AdminSettingsPage() {
  const { user } = useUser();

  const [settings, setSettings] = useState({
    quizTimeLimit: 600,
    questionsPerQuiz: 10,
    negativeMarking: true,
    negativeMarkingValue: 0.25,
    showExplanations: true,
    allowRetake: true,
    leaderboardEnabled: true,
    achievementsEnabled: true,
  });

  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { saveSettingsAction } = await import('@/app/admin/actions');
      const resp = await saveSettingsAction(settings);
      if (resp?.success) {
        showToast({ variant: 'success', title: 'Settings saved successfully!' });
      } else {
        showToast({ variant: 'error', title: resp?.error || 'Failed to save settings' });
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      showToast({ variant: 'error', title: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user) return;
      try {
        const { fetchSettingsAction } = await import('@/app/admin/actions');
        const resp = await fetchSettingsAction();
        if (mounted && resp?.success && resp.data) {
          setSettings(prev => ({ ...prev, ...resp.data }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure platform settings</p>
      </div>

      <div className="grid gap-6">
        {/* Quiz Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Quiz Settings
            </CardTitle>
            <CardDescription>Configure default quiz parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Limit (seconds)
                </label>
                <input
                  type="number"
                  value={settings.quizTimeLimit}
                  onChange={(e) => setSettings({ ...settings, quizTimeLimit: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Questions per Quiz
                </label>
                <input
                  type="number"
                  value={settings.questionsPerQuiz}
                  onChange={(e) => setSettings({ ...settings, questionsPerQuiz: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.negativeMarking}
                  onChange={(e) => setSettings({ ...settings, negativeMarking: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Enable Negative Marking</span>
              </label>
              
              {settings.negativeMarking && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Penalty:</label>
                  <input
                    type="number"
                    value={settings.negativeMarkingValue}
                    onChange={(e) => setSettings({ ...settings, negativeMarkingValue: parseFloat(e.target.value) })}
                    className="w-20 p-1 border rounded"
                    step="0.25"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.showExplanations}
                  onChange={(e) => setSettings({ ...settings, showExplanations: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Show Explanations After Quiz</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.allowRetake}
                  onChange={(e) => setSettings({ ...settings, allowRetake: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Allow Quiz Retake</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Feature Toggles
            </CardTitle>
            <CardDescription>Enable or disable platform features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.leaderboardEnabled}
                onChange={(e) => setSettings({ ...settings, leaderboardEnabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Enable Leaderboard</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.achievementsEnabled}
                onChange={(e) => setSettings({ ...settings, achievementsEnabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Enable Achievements</span>
            </label>
          </CardContent>
        </Card>

        {/* Database Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Actions
            </CardTitle>
            <CardDescription>Manage database operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Demo Data
              </Button>
              <Button variant="destructive" disabled>
                Clear All Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
