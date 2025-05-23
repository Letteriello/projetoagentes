import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Cpu, PlusCircle, Save } from "lucide-react";
import Image from "next/image";

export default function AgentBuilderPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Agent Builder</h1>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Agent
        </Button>
      </header>
      
      <p className="text-muted-foreground">
        Design, configure, and deploy your custom AI agents. Use the visual interface below to define your agent's capabilities, tools, and behavior.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Agent Configuration</CardTitle>
            <CardDescription>Define the core properties and settings for your agent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agentName">Agent Name</Label>
              <Input id="agentName" placeholder="e.g., Customer Support Pro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agentDescription">Description</Label>
              <Textarea id="agentDescription" placeholder="Describe what this agent does..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentModel">Base Model (Google ADK)</Label>
                <Select>
                  <SelectTrigger id="agentModel">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    <SelectItem value="gemini-flash">Gemini Flash</SelectItem>
                    <SelectItem value="custom-model">Custom Model (via ADK)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentVersion">Version</Label>
                <Input id="agentVersion" placeholder="1.0.0" defaultValue="1.0.0" />
              </div>
            </div>
             <div className="space-y-2">
              <Label>Tools & Integrations</Label>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">Select and configure tools from Google ADK library.</p>
                  <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Tool</Button>
                  {/* Placeholder for selected tools list */}
                </CardContent>
              </Card>
            </div>
          </CardContent>
          <CardFooter>
            <Button>
              <Save className="mr-2 h-4 w-4" /> Save Agent Configuration
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visual Workflow (Coming Soon)</CardTitle>
              <CardDescription>Drag-and-drop interface for agent logic.</CardDescription>
            </CardHeader>
            <CardContent>
              <Image 
                src="https://placehold.co/600x400.png"
                alt="Visual Workflow Placeholder"
                width={600}
                height={400}
                className="rounded-md aspect-video object-cover"
                data-ai-hint="flowchart diagram"
              />
              <p className="text-sm text-muted-foreground mt-2">This feature will allow visual construction of agent flows.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>• Clearly define your agent's goal for better AI assistance.</p>
              <p>• Start with simpler models and iterate.</p>
              <p>• Test your agent frequently during development.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
