import React, { Suspense, useEffect, useState } from 'react';
import { useDirectSalesforceAction } from '../hooks/useSalesforceOperations';
import { appState } from '../state/appState';
import { observer } from '@legendapp/state/react';
import PresentationQuestion from './PresentationQuestion';
import './PresentationWrapup.module.css';
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
      <div className="presentation-wrapup">
        <h1>Wrap Up</h1>
        {questions.map((q) => (
          <div key={q.Id} className="question-container">
            <PresentationQuestion recordId={recordId} question={q} />
          </div>
        ))}
      </div>
    </Suspense>
  );
});

export default PresentationWrapup;
