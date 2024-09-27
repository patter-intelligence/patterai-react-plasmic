import React, { useState, useEffect } from 'react';
import './PresentationDesignChanger.module.css';

interface Proposal {
  id: string;
  attributes: {
    name: {
      en: string;
    };
  };
}

interface PresentationDesignChangerProps {
  recordId: string;
  onLoadingChange: (isLoading: boolean) => void;
}

const PresentationDesignChanger: React.FC<PresentationDesignChangerProps> = ({ recordId, onLoadingChange }) => {
  const [projectId, setProjectId] = useState<string>('');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [currentProposalId, setCurrentProposalId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, [recordId]);

  const loadInitialData = async () => {
    setLoading(true);
    onLoadingChange(true);
    // Here you would fetch the initial data using your API
    // For now, we'll just simulate it with a timeout
    setTimeout(() => {
      setProjectId('2229733'); // Default project ID
      setLoading(false);
      onLoadingChange(false);
    }, 1000);
  };

  const handleProjectIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProjectId(event.target.value);
  };

  const handleProposalChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentProposalId(event.target.value);
  };

  const handleLoadProject = async () => {
    setLoading(true);
    onLoadingChange(true);
    // Here you would update the design using your API
    // For now, we'll just simulate it with a timeout
    setTimeout(() => {
      console.log('Project loaded:', { projectId, currentProposalId });
      setLoading(false);
      onLoadingChange(false);
    }, 1000);
  };

  useEffect(() => {
    if (projectId) {
      // Fetch proposals when projectId changes
      setLoading(true);
      onLoadingChange(true);
      // Simulating API call
      setTimeout(() => {
        const mockProposals: Proposal[] = [
          { id: '1', attributes: { name: { en: 'Proposal 1' } } },
          { id: '2', attributes: { name: { en: 'Proposal 2' } } },
        ];
        setProposals(mockProposals);
        setLoading(false);
        onLoadingChange(false);
      }, 1000);
    }
  }, [projectId]);

  return (
    <div className="presentation-design-changer">
      <h2 className="title h2-semi">Design Requests</h2>
      <form onSubmit={(e) => { e.preventDefault(); handleLoadProject(); }}>
        <div className="form-group">
          <label htmlFor="projectId" className="input-label">Project ID</label>
          <input
            type="text"
            id="projectId"
            value={projectId}
            onChange={handleProjectIdChange}
            disabled={loading}
            className="d2-medium"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="proposal" className="input-label">Select Proposal</label>
          <select
            id="proposal"
            value={currentProposalId}
            onChange={handleProposalChange}
            disabled={loading || proposals.length === 0}
            className="d2-medium"
            required
          >
            <option value="" disabled>Select Proposal</option>
            {proposals.map((proposal) => (
              <option key={proposal.id} value={proposal.id}>
                {proposal.attributes.name.en}
              </option>
            ))}
          </select>
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="button-container">
          <button
            type="submit"
            className="update-button contained"
            disabled={loading || !projectId || !currentProposalId}
          >
            {loading ? (
              <>
              <span className="spinner"></span>
              Loading...
            </>
          ) : (
            'Update'
          )}
        </button>
      </div>
      </form>
    </div>
  );
};

const Blank = () => {
  return <div></div>;
};

export default Blank;
