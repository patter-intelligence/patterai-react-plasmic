import React, { Suspense, useEffect, useState } from 'react';
import { useDirectSalesforceAction } from '../hooks/useSalesforceOperations';
import { appState } from '../state/appState';
import { observer } from '@legendapp/state/react';
import PresentationQuestion from './PresentationQuestion';
// import './PresentationWrapup.module.css'; // Remove this line as we're not using the module CSS anymore
import Loader from '../components/Loader';
import { set } from 'lodash';

interface Question {
  Id: string;
  Question__c: string;
  Type__c: string;
  Answers__c?: string;
}

const PresentationWrapup: React.FC = observer(() => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const recordId = appState.recordId.get();
  const [loading, setLoading] = useState(true);

  const { error, refetch: getActiveQuestionsBySID } = useDirectSalesforceAction<
    Question[]
  >('QuestionService.getActiveQuestionsBySID', {
    salesOpportunityId: recordId,
  });

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      const result = await getActiveQuestionsBySID();
      setQuestions(result);
      setLoading(false);
    }

    if (recordId) {
      fetchQuestions();
    }
  }, [recordId]);

  if (loading)
    return (
      <Loader
        contextVariables={{
          LOADER_LOGO: 'https://patter-demos-mu.vercel.app/Patter_Logo.png',
          COMPANY_NAME: 'Patter AI',
        }}
      />
    );
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div style={{backgroundColor: '#F9FBFF' }}>
    <Suspense
      fallback={
        <Loader
          contextVariables={{
            LOADER_LOGO: 'https://patter-demos-mu.vercel.app/Patter_Logo.png',
            COMPANY_NAME: 'Patter AI',
          }}
        />
      }
    >
        <h1 className="h1-semi fade-in heading">Your Wrap Up</h1>

      <div className="pw-presentation-wrapup">
        {questions.map((q) => (
          <div key={q.Id} className="pw-question-container">
            <PresentationQuestion recordId={recordId} question={q} />
          </div>
        ))}
      </div>
    </Suspense>
    </div>
  );
});

export default PresentationWrapup;
