import React, { useEffect, useState, useCallback, Suspense } from 'react';
import {
  useDirectSalesforceAction,
} from '../hooks/useSalesforceOperations';
import './PresentationQuestion.module.css';

interface Question {
  Id: string;
  Question__c: string;
  Type__c: string;
  Answers__c?: string;
}

interface Response {
  Id?: string;
  Answer__c: string;
  Question__c: string;
  Related_Question__c: string;
  Sales_Opportunity__c: string;
}

interface Props {
  recordId: string;
  question: Question;
}

const PresentationQuestion: React.FC<Props> = ({ recordId, question }) => {
  const [answer, setAnswer] = useState<string | boolean>('');
  const [response, setResponse] = useState<Response | null>(null);
  const [options, setOptions] = useState<{ label: string; value: string }[]>(
    []
  );

  const {
    result: responseData,
    loading,
    error,
    refetch: getResponsesBySIDAndQID,
  } = useDirectSalesforceAction<Response>(
    'ResponseService.getResponsesBySIDAndQID',
    { salesOpportunityId: recordId, questionId: question.Id }
  );

  const { refetch: createResponse } = useDirectSalesforceAction<Response>(
    'ResponseService.createResponse',
    {},
    false
  );

  useEffect(() => {
    getResponsesBySIDAndQID()
      .then((result) => {
        if (result) {
          setResponse(result);
          setAnswer(
            question.Type__c === 'Boolean'
              ? result.Answer__c === 'true'
              : result.Answer__c
          );
        }
      })
      .catch((err) => {
        console.error('Error getting responses:', err);
      });
  }, [recordId, question.Id]);

  useEffect(() => {
    if (responseData) {
      setResponse(responseData);
      setAnswer(
        question.Type__c === 'Boolean'
          ? responseData.Answer__c === 'true'
          : responseData.Answer__c
      );
    }

    if (question.Type__c === 'Picklist' && question.Answers__c) {
      setOptions(
        question.Answers__c.split(',').map((a) => ({ label: a, value: a }))
      );
    }
  }, [responseData, question]);

  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }, []);

  const executeAnswer = useCallback(async (newResponse: Response) => {
    try {
      const result = await createResponse({ response: newResponse });
      setResponse(result);
    } catch (error) {
      console.error('Error creating response:', error);
    }
  }, [recordId,question.Id]);

  const debouncedExecuteAnswer = useCallback(
    debounce((newResponse: Response) => executeAnswer(newResponse), 500),
    [debounce, executeAnswer]
  );

  const handleAnswer = useCallback((value: string | boolean) => {
    setAnswer(value);
    const newResponse: Response = {
      ...response,
      Answer__c: value.toString(),
      Question__c: question.Question__c,
      Related_Question__c: question.Id,
      Sales_Opportunity__c: recordId,
      attributes: undefined,
    } as Response;
    setResponse(newResponse);

    if (question.Type__c === 'Text') {
      debouncedExecuteAnswer(newResponse); // very problematic, issue was oversubscription i.e. we should not subscribe to methods
      // executeAnswer(newResponse);
    } else {
      executeAnswer(newResponse);
    }
  }, [response, question, recordId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="pw-presentation-question">
      <p>{question.Question__c}</p>
      {question.Type__c === 'Boolean' && (
        // <input
        //   type="checkbox"
        //   checked={answer as boolean}
        //   onChange={(e) => handleAnswer(e.target.checked)}
        // />
        <div className="pw-efficiency-toggle">
            <label className="pw-switch">
              <input
                type="pw-checkbox"
                checked={answer as boolean}
                onChange={(e) => handleAnswer(e.target.checked)}
              />
              <span className="pw-slider pw-round"></span>
            </label>
          </div>
      )}
      {question.Type__c === 'Picklist' && (
        <select
          value={answer as string}
          onChange={(e) => handleAnswer(e.target.value)}
        >
          <option value="">Select Option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      {question.Type__c === 'Text' && (
        <textarea
          value={answer as string}
          onChange={(e) => handleAnswer(e.target.value)}
          placeholder="Type answer..."
        />
      )}
    </div>
    </Suspense>
  );
};

export default PresentationQuestion;
