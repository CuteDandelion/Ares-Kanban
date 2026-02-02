'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { PulsingStatusDot } from '@/components/ui/PulsingStatusDot';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Key, TestTube, Check, X } from 'lucide-react';

export interface SettingsPanelProps {
  className?: string;
}

export function SettingsPanel({ className }: SettingsPanelProps) {
  const {
    claudeApiKey,
    claudeEnabled,
    dockerEnabled,
    isSettingsOpen,
    claudeConnectionStatus,
    openSettings,
    closeSettings,
    setClaudeApiKey,
    setDockerEnabled,
    testClaudeConnection,
    saveSettingsToSupabase,
  } = useSettingsStore();

  const [tempApiKey, setTempApiKey] = React.useState(claudeApiKey || '');
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ success: boolean; message?: string } | null>(null);

  // Sync temp key with store when dialog opens
  React.useEffect(() => {
    if (isSettingsOpen) {
      setTempApiKey(claudeApiKey || '');
      setTestResult(null);
    }
  }, [isSettingsOpen, claudeApiKey]);

  const handleTestConnection = async () => {
    if (!tempApiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key first' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    // Temporarily set the key for testing
    setClaudeApiKey(tempApiKey);

    const result = await testClaudeConnection();
    
    setIsTesting(false);
    setTestResult({
      success: result.success,
      message: result.success ? 'Connection successful!' : result.error,
    });
  };

  const handleSave = async () => {
    setClaudeApiKey(tempApiKey.trim() || null);
    await saveSettingsToSupabase();
    closeSettings();
  };

  const getConnectionDotState = (): import('@/components/ui/PulsingStatusDot').StatusState => {
    switch (claudeConnectionStatus) {
      case 'connected':
        return 'online';
      case 'error':
        return 'error';
      case 'testing':
        return 'processing';
      default:
        return 'offline';
    }
  };

  return (
    <Dialog open={isSettingsOpen} onOpenChange={(open) => open ? openSettings() : closeSettings()}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative text-ares-dark-400 hover:text-white hover:bg-ares-dark-800',
            className
          )}
          onClick={openSettings}
        >
          <Settings className="h-5 w-5" />
          {claudeEnabled && (
            <span className="absolute top-1 right-1">
              <PulsingStatusDot state="online" size="sm" pulse={false} />
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-ares-dark-900 border-ares-dark-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-5 w-5 text-ares-red-500" />
            ARES Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Claude API Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-ares-dark-700 pb-2">
              <Key className="h-4 w-4 text-ares-red-500" />
              <h3 className="font-semibold">Claude API Configuration</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key" className="text-ares-dark-300">
                Claude API Key
              </Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk-ant-..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="bg-ares-dark-800 border-ares-dark-700 text-white font-mono"
              />
              <p className="text-xs text-ares-dark-500">
                Your API key is stored securely in Supabase and never exposed client-side.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={isTesting || !tempApiKey.trim()}
                className="border-ares-dark-600 hover:bg-ares-dark-800"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isTesting ? 'Testing...' : 'Test Connection'}
              </Button>

              <div className="flex items-center gap-2">
                <PulsingStatusDot 
                  state={getConnectionDotState()} 
                  size="md" 
                  pulse={claudeConnectionStatus === 'testing'} 
                />
                <span className="text-sm text-ares-dark-400">
                  {claudeConnectionStatus === 'connected' && 'Connected'}
                  {claudeConnectionStatus === 'error' && 'Connection failed'}
                  {claudeConnectionStatus === 'testing' && 'Testing...'}
                  {claudeConnectionStatus === 'unknown' && 'Not tested'}
                </span>
              </div>
            </div>

            {testResult && (
              <div
                className={cn(
                  'flex items-center gap-2 text-sm p-2 rounded',
                  testResult.success 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'bg-red-500/10 text-red-400'
                )}
              >
                {testResult.success ? (
                  <>
                    <Check className="h-4 w-4" />
                    {testResult.message}
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    {testResult.message}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Docker Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-ares-dark-700 pb-2">
              <svg className="h-4 w-4 text-ares-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.186.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.186.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.186.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"/>
              </svg>
              <h3 className="font-semibold">Docker Configuration</h3>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-ares-dark-300">Enable Docker Sandbox</Label>
                <p className="text-xs text-ares-dark-500">
                  Allows ARES to execute safe CLI commands in isolated containers
                </p>
              </div>
              <Switch
                checked={dockerEnabled}
                onCheckedChange={setDockerEnabled}
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-ares-dark-800 rounded-lg">
              <PulsingStatusDot 
                state={dockerEnabled ? 'online' : 'offline'} 
                size="sm" 
                pulse={false} 
              />
              <span className="text-sm text-ares-dark-400">
                {dockerEnabled ? 'Docker sandbox enabled' : 'Docker sandbox disabled'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-ares-dark-700">
            <Button
              variant="outline"
              onClick={closeSettings}
              className="border-ares-dark-600 hover:bg-ares-dark-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-ares-red-600 hover:bg-ares-red-700 text-white"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsPanel;
