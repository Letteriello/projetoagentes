import React, { useMemo } from 'react'; // Import useMemo
import ReactFlow, { Node, Edge } from 'reactflow'; // Elements type is deprecated
import 'reactflow/dist/style.css';

interface Agent {
  id: string;
  name: string;
  // Add other agent properties as needed
}

interface A2AChannel {
  sourceAgentId: string;
  targetAgentId: string;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  // Add other channel properties as needed
}

interface A2AGraphVisualizerProps {
  currentAgent: Agent;
  subAgents: Agent[];
  a2aChannels: A2AChannel[];
}

const A2AGraphVisualizer: React.FC<A2AGraphVisualizerProps> = ({
  currentAgent,
  subAgents,
  a2aChannels,
}) => {
  const nodes = useMemo<Node[]>(() => {
    const initialNodes: Node[] = [
      {
        id: currentAgent.id,
        data: { label: `${currentAgent.name} (Current)` },
        position: { x: 250, y: 5 },
        style: { backgroundColor: '#D6D5E6', color: '#333', border: '1px solid #222138', width: 180 },
      },
      ...subAgents.map((agent, index) => ({
        id: agent.id,
        data: { label: agent.name },
        position: { x: 50 + index * 200, y: 100 }, // Consider a more robust layout algorithm for larger graphs
        style: { backgroundColor: '#D6D5E6', color: '#333', border: '1px solid #222138', width: 180 },
      })),
    ];

    const allAgentIdsInGraph = new Set(initialNodes.map(n => n.id));
    const additionalNodes: Node[] = [];

    a2aChannels.forEach(channel => {
      if (!allAgentIdsInGraph.has(channel.sourceAgentId)) {
        additionalNodes.push({
          id: channel.sourceAgentId,
          data: { label: `Agent ${channel.sourceAgentId}` }, // You might want to fetch actual agent names
          position: { x: Math.random() * 400, y: Math.random() * 200 + 200 }, // Random, ensure y is distinct from subAgents
          style: { backgroundColor: '#D6D5E6', color: '#333', border: '1px solid #222138', width: 180 },
        });
        allAgentIdsInGraph.add(channel.sourceAgentId); // Add to set to avoid duplicates if multiple channels reference it
      }
      if (!allAgentIdsInGraph.has(channel.targetAgentId)) {
        additionalNodes.push({
          id: channel.targetAgentId,
          data: { label: `Agent ${channel.targetAgentId}` }, // You might want to fetch actual agent names
          position: { x: Math.random() * 400, y: Math.random() * 200 + 200 }, // Random, ensure y is distinct
          style: { backgroundColor: '#D6D5E6', color: '#333', border: '1px solid #222138', width: 180 },
        });
        allAgentIdsInGraph.add(channel.targetAgentId);
      }
    });

    return [...initialNodes, ...additionalNodes];
  }, [currentAgent, subAgents, a2aChannels]);

  const edges = useMemo<Edge[]>(() => {
    return a2aChannels.map((channel, index) => ({
      id: `e${index}-${channel.sourceAgentId}-${channel.targetAgentId}`,
      source: channel.sourceAgentId,
      target: channel.targetAgentId,
      label: channel.direction,
      animated: channel.direction === 'bidirectional',
    }));
  }, [a2aChannels]);

  return (
    <div style={{ height: '500px', border: '1px solid #ccc', margin: '10px 0' }}>
      {/* Pass nodes and edges separately */}
      <ReactFlow nodes={nodes} edges={edges} defaultZoom={1.5} minZoom={0.2} maxZoom={4} fitView>
        {/* <MiniMap /> */}
        {/* <Controls /> */}
        {/* <Background /> */}
      </ReactFlow>
    </div>
  );
};

// Wrap the component with React.memo for props shallow comparison
export default React.memo(A2AGraphVisualizer);
