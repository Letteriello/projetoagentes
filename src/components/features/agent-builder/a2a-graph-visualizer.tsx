import React from 'react';
import ReactFlow, { Elements, Node, Edge } from 'reactflow';
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
  const nodes: Node[] = [
    {
      id: currentAgent.id,
      data: { label: `${currentAgent.name} (Current)` },
      position: { x: 250, y: 5 },
      style: { backgroundColor: '#D6D5E6', color: '#333', border: '1px solid #222138', width: 180 },
    },
    ...subAgents.map((agent, index) => ({
      id: agent.id,
      data: { label: agent.name },
      position: { x: 50 + index * 200, y: 100 },
      style: { backgroundColor: '#D6D5E6', color: '#333', border: '1px solid #222138', width: 180 },
    })),
  ];

  const edges: Edge[] = a2aChannels.map((channel, index) => ({
    id: `e${index}-${channel.sourceAgentId}-${channel.targetAgentId}`,
    source: channel.sourceAgentId,
    target: channel.targetAgentId,
    label: channel.direction,
    animated: channel.direction === 'bidirectional',
  }));

  // Combine nodes from channels that might not be subAgents
  const allAgentIdsInGraph = new Set(nodes.map(n => n.id));
  a2aChannels.forEach(channel => {
    if (!allAgentIdsInGraph.has(channel.sourceAgentId)) {
      nodes.push({
        id: channel.sourceAgentId,
        data: { label: `Agent ${channel.sourceAgentId}` }, // You might want to fetch actual agent names
        position: { x: Math.random() * 400, y: Math.random() * 400 }, // Random position for now
        style: { backgroundColor: '#D6D5E6', color: '#333', border: '1px solid #222138', width: 180 },
      });
      allAgentIdsInGraph.add(channel.sourceAgentId);
    }
    if (!allAgentIdsInGraph.has(channel.targetAgentId)) {
      nodes.push({
        id: channel.targetAgentId,
        data: { label: `Agent ${channel.targetAgentId}` }, // You might want to fetch actual agent names
        position: { x: Math.random() * 400, y: Math.random() * 400 }, // Random position for now
        style: { backgroundColor: '#D6D5E6', color: '#333', border: '1px solid #222138', width: 180 },
      });
      allAgentIdsInGraph.add(channel.targetAgentId);
    }
  });


  const elements: Elements = [...nodes, ...edges];

  return (
    <div style={{ height: '500px', border: '1px solid #ccc', margin: '10px 0' }}>
      <ReactFlow elements={elements} defaultZoom={1.5} minZoom={0.2} maxZoom={4}>
        {/* <MiniMap />
        <Controls />
        <Background /> */}
      </ReactFlow>
    </div>
  );
};

export default A2AGraphVisualizer;
