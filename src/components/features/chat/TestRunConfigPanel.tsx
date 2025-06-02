"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { TestRunConfig } from "@/types/chat-types"; // Verify path once types are settled

interface TestRunConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: TestRunConfig;
  onConfigChange: (newConfig: Partial<TestRunConfig>) => void;
  onApply: () => void;
}

export function TestRunConfigPanel({
  isOpen,
  onClose,
  config,
  onConfigChange,
  onApply,
}: TestRunConfigPanelProps) {
  if (!isOpen) {
    return null;
  }

  const handleTemperatureChange = (value: number[]) => {
    onConfigChange({ temperature: value[0] });
  };

  const handleStreamingChange = (checked: boolean) => {
    onConfigChange({ streamingEnabled: checked });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
      <Card className="w-full max-w-md mx-auto z-50 shadow-xl">
        <CardHeader>
          <CardTitle>Test Execution Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="temperature-slider" className="text-sm font-medium">
              Temperature: {config.temperature?.toFixed(2) ?? "Default"}
            </Label>
            <Slider
              id="temperature-slider"
              min={0}
              max={1}
              step={0.05}
              defaultValue={[config.temperature ?? 0.7]} // Default to 0.7 if not set
              onValueChange={handleTemperatureChange}
              className="[&>span:first-child]:h-1 [&>span:first-child]:bg-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              Controls randomness. Lower values are more deterministic.
            </p>
          </div>
          <div className="flex items-center justify-between space-x-2 pt-2">
            <div className="space-y-0.5">
                <Label htmlFor="streaming-switch" className="text-sm font-medium">
                Enable Response Streaming
                </Label>
                <p className="text-xs text-muted-foreground">
                    Receive responses word by word, or all at once.
                </p>
            </div>
            <Switch
              id="streaming-switch"
              checked={config.streamingEnabled ?? true} // Default to true if not set
              onCheckedChange={handleStreamingChange}
            />
          </div>
          {/* Placeholder for RAG document upload in the future */}
          {/*
          <div className="space-y-2">
            <Label htmlFor="temp-document" className="text-sm font-medium">
              Temporary Document (for RAG)
            </Label>
            <Input id="temp-document" type="file" disabled />
            <p className="text-xs text-muted-foreground">
              Upload a document to be used for this test session only.
            </p>
          </div>
          */}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onApply}>Apply & Close</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
