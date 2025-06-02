import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ReviewTab() {
  const { watch } = useFormContext();
  
  const agentName = watch('agentName');
  const description = watch('description');
  const agentTone = watch('agentTone');
  const tools = watch('tools') || [];
  const config = watch('config') || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agent Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">{agentName || 'Unnamed Agent'}</h4>
            <p className="text-muted-foreground">{description || 'No description provided'}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Tone:</span>
            <Badge variant="outline">{agentTone || 'Not specified'}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Tools ({tools.length})</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {tools.map((tool: any) => (
                <Badge key={tool.id} variant={tool.configured ? 'default' : 'secondary'}>
                  {tool.name}
                </Badge>
              ))}
              {tools.length === 0 && <span className="text-sm text-muted-foreground">No tools selected</span>}
            </div>
          </div>

          <div>
            <h4 className="font-medium">Memory Configuration</h4>
            <pre className="mt-2 p-2 bg-muted rounded text-sm overflow-x-auto">
              {JSON.stringify(config.statePersistence || {}, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
