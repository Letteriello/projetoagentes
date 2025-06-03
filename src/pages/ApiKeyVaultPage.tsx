// src/pages/ApiKeyVaultPage.tsx
import React, { useState } from 'react';
import useApiKeyVault from '../hooks/use-api-key-vault';

const ApiKeyVaultPage: React.FC = () => {
  const {
    apiKeys,
    isLoading,
    error,
    addApiKey,
    removeApiKey,
    visibleApiKey,
    toggleKeyVisibility,
    clearVisibleKey,
    reArmKey,
    getKeyById,
  } = useApiKeyVault();

  const [newServiceName, setNewServiceName] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newServiceType, setNewServiceType] = useState('');
  const [reArmInputVisible, setReArmInputVisible] = useState<string | null>(null);
  const [reArmKeyValue, setReArmKeyValue] = useState<string>('');

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newApiKey.trim() || !newServiceType.trim()) { // Add validation for newServiceType
      alert('Service name, API key, and Service Type cannot be empty.');
      return;
    }
    await addApiKey(newServiceName, newApiKey, newServiceType); // Pass newServiceType
    setNewServiceName('');
    setNewApiKey('');
    setNewServiceType(''); // Reset newServiceType
  };

  const handleToggleVisibility = async (id: string) => {
    await toggleKeyVisibility(id);
  };

  const handleReArmKey = async (id: string) => {
    if (!reArmKeyValue.trim()) {
      alert('Please enter the full API key to re-arm.');
      return;
    }
    const success = await reArmKey(id, reArmKeyValue);
    if (success) {
      setReArmInputVisible(null);
      setReArmKeyValue('');
      alert('Key re-armed successfully.');
    } else {
      alert('Failed to re-arm key. It might not exist or there was an error.');
    }
  };

  const needsReArm = (keyId: string): boolean => {
    const key = getKeyById(keyId);
    // A key needs re-arming if we have a fragment but no full key in the hook's current state.
    // This relies on the hook and service correctly clearing the apiKey field when it's not in volatile memory.
    return !!(key?.fragment && !key?.apiKey);
  }

  if (isLoading && !apiKeys.length) { // Show loading only on initial load
    return <p>Loading API keys...</p>;
  }

  if (error) {
    return <p>Error loading API keys: {error.message}</p>;
  }

  return (
    <div>
      <h1>API Key Vault</h1>
      <p style={{color: 'red', fontSize: '0.9em', border: '1px solid red', padding: '8px'}}>
        <strong>Security Warning:</strong> This vault is for demonstration purposes.
        API keys are stored in browser memory and localStorage fragments.
        This is NOT secure for production. Use a proper backend secret management system.
      </p>

      <h2>Add New API Key</h2>
      <form onSubmit={handleAddKey}>
        <div>
          <label htmlFor="serviceName">Service Name:</label>
          <input
            id="serviceName"
            type="text"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            placeholder="e.g., Google Search"
            required
          />
        </div>
        <div>
          <label htmlFor="apiKey">API Key:</label>
          <input
            id="apiKey"
            type="password" // Use password type for basic masking
            value={newApiKey}
            onChange={(e) => setNewApiKey(e.target.value)}
            placeholder="Enter API Key"
            required
          />
        </div>
        <div>
          <label htmlFor="serviceType">Service Type:</label>
          <input
            id="serviceType"
            type="text"
            value={newServiceType}
            onChange={(e) => setNewServiceType(e.target.value)}
            placeholder="e.g., googleCustomSearch, openapi, Generic"
            required
          />
          <p className="text-xs text-muted-foreground">
            Helps categorize the key. Examples: googleCustomSearch, openapi, database, Generic. This should match the 'serviceTypeRequired' by tools.
          </p>
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Key'}
        </button>
      </form>

      <h2>Managed API Keys</h2>
      {apiKeys.length === 0 ? (
        <p>No API keys stored yet.</p>
      ) : (
        <ul>
          {apiKeys.map((key) => (
            <li key={key.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
              <strong>{key.serviceName}</strong>
              <p>ID: {key.id}</p>
              <p>Fragment: {key.fragment}</p>
              <p>Service Type: {key.serviceType}</p>
              <p>Created At: {new Date(key.createdAt).toLocaleString()}</p>

              {visibleApiKey && toggleKeyVisibility && getKeyById(key.id)?.id === key.id && visibleApiKey.startsWith('Full key not in memory') ? (
                 <p style={{ color: 'orange' }}>{visibleApiKey}</p>
              ) : visibleApiKey && toggleKeyVisibility && getKeyById(key.id)?.id === key.id ? (
                 <p>Full Key: {visibleApiKey}</p>
              ) : null}

              <button onClick={() => handleToggleVisibility(key.id)} disabled={isLoading}>
                {visibleApiKey && getKeyById(key.id)?.id === key.id && !visibleApiKey.startsWith('Full key not in memory') ? 'Hide Key' : 'Show Key'}
              </button>
              <button onClick={() => removeApiKey(key.id)} disabled={isLoading} style={{ marginLeft: '10px' }}>
                {isLoading ? 'Deleting...' : 'Delete Key'}
              </button>

              {needsReArm(key.id) && (
                <div style={{ marginTop: '5px', padding:'5px', border:'1px dashed orange'}}>
                  <p style={{color: 'orange', fontWeight:'bold'}}>This key needs to be re-entered to be used.</p>
                  {reArmInputVisible === key.id ? (
                    <div>
                      <input
                        type="password"
                        value={reArmKeyValue}
                        onChange={(e) => setReArmKeyValue(e.target.value)}
                        placeholder="Enter full API key"
                      />
                      <button onClick={() => handleReArmKey(key.id)} style={{ marginLeft: '5px' }}>Submit Key</button>
                      <button onClick={() => {setReArmInputVisible(null); setReArmKeyValue('');}} style={{ marginLeft: '5px' }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => {setReArmInputVisible(key.id); setReArmKeyValue(''); clearVisibleKey();}}>Re-Arm Key</button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ApiKeyVaultPage;
```
