import React, { createContext, useContext } from 'react';
import SalesforceRepository from '../repositories/SalesforceRepository';

const SalesforceContext = createContext<SalesforceRepository | null>(null);

export const useSalesforce = () => {
  const context = useContext(SalesforceContext);
  if (!context) {
    throw new Error('useSalesforce must be used within a SalesforceProvider');
  }
  return context;
};

interface SalesforceProviderProps {
  children: React.ReactNode;
}

export const SalesforceProvider: React.FC<SalesforceProviderProps> = ({ children }) => {
  const repository = new SalesforceRepository();

  return (
    <SalesforceContext.Provider value={repository}>
      {children}
    </SalesforceContext.Provider>
  );
};
