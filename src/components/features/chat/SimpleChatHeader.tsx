import React from 'react';

interface SimpleChatHeaderProps {
  title: string;
  description: string;
  modelInfo: string;
  tools: number;
}

const SimpleChatHeader: React.FC<SimpleChatHeaderProps> = ({
  title,
  description,
  modelInfo,
  tools,
}) => {
  return (
    <div className="flex flex-col flex-grow mr-2 overflow-hidden">
      <h2 className="text-lg font-semibold truncate" title={title}>{title}</h2>
      <p className="text-sm text-muted-foreground truncate" title={description}>
        {description}
      </p>
      <div className="text-xs text-muted-foreground">
        <span title={modelInfo}>Model: {modelInfo}</span>
        <span className="ml-2">| Tools: {tools}</span>
      </div>
    </div>
  );
};

export default SimpleChatHeader;