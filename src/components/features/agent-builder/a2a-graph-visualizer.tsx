import React, { useMemo, useState, useEffect } from 'react';
import ReactFlow, { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

interface Agent {
  id: string;
  name: string;
}

interface A2AChannel {
  sourceAgentId: string;
  targetAgentId: string;
  direction: 'inbound' | 'outbound' | 'bidirectional';
}

interface A2AGraphVisualizerProps {
  currentAgent: Agent | null;
  subAgents: Agent[];
  a2aChannels: A2AChannel[];
  loading?: boolean;
}

const Spinner = () => (
  <div className="flex items-center justify-center h-full">
    <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
    </svg>
    <span className="ml-2 text-gray-500">Carregando grafo...</span>
  </div>
);

const A2AGraphVisualizer: React.FC<A2AGraphVisualizerProps> = ({
  currentAgent,
  subAgents,
  a2aChannels,
  loading = false,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    // Defensive checks for required data
    if (!currentAgent || !currentAgent.id || !currentAgent.name) {
      setNoData(true);
      return;
    }
    if (!Array.isArray(subAgents) || !Array.isArray(a2aChannels)) {
      setError('Dados de agentes ou canais estão malformados.');
      return;
    }
    if (
      subAgents.length === 0 &&
      a2aChannels.length === 0
    ) {
      setNoData(true);
      return;
    }
    setNoData(false);
    setError(null);
  }, [currentAgent, subAgents, a2aChannels]);

  const nodes = useMemo<Node[]>(() => {
    if (!currentAgent) return [];
    try {
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
          position: { x: 50 + index * 200, y: 100 },
          style: { backgroundColor: '#D6D5E6', color: '#333', border: '1px solid #222138', width: 180 },
        })),
      ];

      const allAgentIdsInGraph = new Set(initialNodes.map(n => n.id));
      const additionalNodes: Node[] = [];

      a2aChannels.forEach(channel => {
        if (!allAgentIdsInGraph.has(channel.sourceAgentId)) {
          additionalNodes.push({
            id: channel.sourceAgentId,
            data: { label: `Agent ${channel.sourceAgentId}` },
            position: { x: Math.random() * 400, y: Math.random() * 200 + 200 },
            style: { backgroundColor: '#D6D5E6', color: '#333', border: '1px solid #222138', width: 180 },
          });
          allAgentIdsInGraph.add(channel.sourceAgentId);
        }
        if (!allAgentIdsInGraph.has(channel.targetAgentId)) {
          additionalNodes.push({
            id: channel.targetAgentId,
            data: { label: `Agent ${channel.targetAgentId}` },
            position: { x: Math.random() * 400, y: Math.random() * 200 + 200 },
            style: { backgroundColor: '#D6D5E6', color: '#333', border: '1px solid #222138', width: 180 },
          });
          allAgentIdsInGraph.add(channel.targetAgentId);
        }
      });
      return [...initialNodes, ...additionalNodes];
    } catch (e) {
      setError('Erro ao processar os dados do grafo.');
      return [];
    }
  }, [currentAgent, subAgents, a2aChannels]);

  const edges = useMemo<Edge[]>(() => {
    try {
      return a2aChannels.map((channel, index) => ({
        id: `e${index}-${channel.sourceAgentId}-${channel.targetAgentId}`,
        source: channel.sourceAgentId,
        target: channel.targetAgentId,
        label: channel.direction,
        animated: channel.direction === 'bidirectional',
      }));
    } catch (e) {
      setError('Erro ao processar as conexões do grafo.');
      return [];
    }
  }, [a2aChannels]);

  if (loading) {
    return (
      <div style={{ height: '500px', border: '1px solid #ccc', margin: '10px 0' }}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '500px', border: '1px solid #ccc', margin: '10px 0' }} className="flex items-center justify-center">
        <span className="text-red-500">{error}</span>
      </div>
    );
  }

  if (noData || !nodes.length) {
    return (
      <div style={{ height: '500px', border: '1px solid #ccc', margin: '10px 0' }} className="flex items-center justify-center">
        <span className="text-gray-500">Sem dados para exibir o grafo.</span>
      </div>
    );
  }

  return (
    <div style={{ height: '500px', border: '1px solid #ccc', margin: '10px 0' }}>
      <ReactFlow nodes={nodes} edges={edges} defaultZoom={1.5} minZoom={0.2} maxZoom={4} fitView>
        {/* <MiniMap /> */}
        {/* <Controls /> */}
        {/* <Background /> */}
      </ReactFlow>
    </div>
  );
};

export default React.memo(A2AGraphVisualizer);
