import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Tool = {
  id: string;
  name: string;
  description: string;
  configured: boolean;
};

export default function ToolsTab() {
  const { watch } = useFormContext();
  const tools: Tool[] = watch('tools') || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Available Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tools.map((tool) => (
            <div key={tool.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <h4 className="font-medium">{tool.name}</h4>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </div>
              <Button variant={tool.configured ? 'default' : 'outline'} size="sm">
                {tool.configured ? 'Configured' : 'Configure'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
