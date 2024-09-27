import { Observable, observable } from '@legendapp/state';
import { synced } from '@legendapp/state/sync';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import { ContactItem } from '../types';

interface ISettings {
  theme: string;
  Signer__c: ContactItem[];
  loading: boolean;
}

export const settings$ = observable<ISettings>(
  synced({
    initial: {
      theme: 'dark',
      loading: true,
      Signer__c: [],
    },
    get: async () => {
      // This function will be replaced by useDirectSalesforceAction
      return {
        theme: 'dark',
        loading: false,
        Signer__c: [],
      };
    },
    set: async ({ value }: any) => {
      // This function will be replaced by useDirectSalesforceAction
    },
    persist: {
      name: 'settings$$__Signer__c',
      plugin: ObservablePersistLocalStorage,
      retrySync: true,
    },
    mode: 'merge',
    subscribe: ({ refresh, update }: any) => {
      console.log('App Subscribing to settings', refresh, update);
      return () => {
        console.log('App Unsubscribing from settings');
      };
    },
    retry: {
      infinite: true,
      backoff: 'exponential',
      maxDelay: 30,
    },
    debounceSet: 3000,
    debounceGet: 5000,
  } as any)
);
