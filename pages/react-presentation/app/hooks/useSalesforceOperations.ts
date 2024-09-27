/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from 'react';
import { useSalesforce } from '../providers/SalesforceProvider';


export const useDirectSalesforceAction = <T = any>(
  methodName: string,
  initialParams: Record<string, any>,
  executeImmediately = false
) => {
  const salesforce = useSalesforce();
  const [result, setResult] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeAction = useCallback(async (newParams?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const actionResult = await salesforce.callApexMethod(methodName, newParams || initialParams);
      setResult(actionResult as T);
      return actionResult as T;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [salesforce, methodName, initialParams]);

  useEffect(() => {
    let isMounted = true;
    if (executeImmediately) {
      executeAction().then((result) => {
        if (isMounted) {
          setResult(result as T);
        }
      }).catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [executeImmediately]);

  const refetch = useCallback(async (newParams?: Record<string, any>) => {
    return executeAction(newParams);
  }, [executeAction]);

  return { result, loading, error, refetch, executeAction };
};

// simplified version of useDirectSalesforceAction that allows you to call a Salesforce action directly i.e. the refetch function is only available and you can pass it method name and parameters
export const useSalesforceAction = () => {
  const salesforce = useSalesforce();
  const [error, setError] = useState<Error | null>(null);

  const executeAction = useCallback(async (methodName: string, params: Record<string, any> = {}) => {
    setError(null);
    try {
      return await salesforce.callApexMethod(methodName, params);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    }
    // return salesforce.callApexMethod(methodName, params);
  }, [salesforce]);

  return { executeAction, error };
}

export const useRunAnalysis = () => {
  const { executeAction: validateInput } = useDirectSalesforceAction('validateInput', {});
  const { executeAction: updateConsumption } = useDirectSalesforceAction('updateConsumption', {});
  const { executeAction: createProfile } = useDirectSalesforceAction('createProfile', {});
  const { executeAction: runAnalysis } = useDirectSalesforceAction('runAnalysis', {});
  const { executeAction: updateSalesOpportunity } = useDirectSalesforceAction('updateSalesOpportunity', {});
  const { executeAction: clearAnalyses } = useDirectSalesforceAction('clearAnalyses', {});
  const { executeAction: updateProfile } = useDirectSalesforceAction('updateProfile', {});

  return async (setProgress: (progress: number) => void, setMessage: (message: string) => void) => {
    try {
      setMessage('Validating Input...');
      setProgress(0);
      await validateInput();

      setMessage('Updating Consumption...');
      setProgress(1 / 7);
      await updateConsumption();

      setMessage('Creating Profile...');
      setProgress(2 / 7);
      await createProfile();

      setMessage('Running Analysis...');
      setProgress(3 / 7);
      const analysisResult = await runAnalysis();

      setMessage('Updating Sales Opportunity...');
      setProgress(4 / 7);
      await updateSalesOpportunity();

      setMessage('Clearing Analyses...');
      setProgress(5 / 7);
      await clearAnalyses();

      setMessage('Updating Profile...');
      setProgress(6 / 7);
      await updateProfile();

      setProgress(1);
      setMessage('Analysis Complete');

      return analysisResult;
    } catch (error) {
      console.error('Error in runAnalysis process:', error);
      throw error;
    }
  };
};
