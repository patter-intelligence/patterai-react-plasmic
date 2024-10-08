/* eslint-disable @typescript-eslint/no-explicit-any */
// import { APPLICATION_SCOPE, subscribe, unsubscribe, publish } from 'lightning/messageService';
// import SYSTEM_CONFIGURATION_MESSAGE_CHANNEL from '@salesforce/messageChannel/SystemConfigurationMessageChannel__c';
import { EventEmitter } from 'events';

// Mock Lightning Message Service
// Mock Lightning Message Service
const messageService = new EventEmitter();

const APPLICATION_SCOPE = 'APPLICATION_SCOPE';
const SYSTEM_CONFIGURATION_MESSAGE_CHANNEL = 'SYSTEM_CONFIGURATION_MESSAGE_CHANNEL';

const subscribe = (context: any, channel: string, callback: (message: any) => void, options: any) => {
    messageService.on(channel, callback);
    return { unsubscribe: () => messageService.off(channel, callback) };
};

const unsubscribe = (subscription: { unsubscribe: () => void }) => {
    subscription.unsubscribe();
};

const publish = (context: any, channel: string, message: any) => {
    messageService.emit(channel, message);
};



interface ComponentMap {
    [key: string]: React.ComponentType;
}
// Initialize an empty map for storing function names to functions
const componentMap: ComponentMap = {};




// Define a method to add a function to the map
const addComponentToCache = (functionName: any, functionCallable: any) => {
    componentMap[functionName] = functionCallable; // temporarily disabled to avoid caching functions for tests of the presentation
    // console.log('ignored: addComponentToCache: added component to cache', functionName)
};

const getComponentFromCache = (functionName: string | number) => {
    return componentMap[functionName];
}

// Optionally, define a method to execute a function by name
const loadComponentByPath = async (componentName: string) => {
    try {
        let component = null;
        // console.log('loadComponentByPath: loading component', componentName)
        if (!componentMap[componentName]) {
            // console.log('loadComponentByPath: not cached', componentName)
            /* eslint-disable */
            const module = await import(componentName);
            // componentMap[componentName] = module.default;
            addComponentToCache(componentName, module.default);
            component = module.default;

            // console.log('loadComponentByPath: saved', componentName)
        }
        else {
            // console.log('loadComponentByPath: already cached', componentName)
            component = componentMap[componentName];
        }
        return component;
    }
    catch (e) {
        console.error('loadComponentByPath: error loading component', e);
        return null;
    }
};

const componentLoaded = (componentName: string | number) => {
    const component = componentMap[componentName];
    // console.log('componentLoaded: checking if component is loaded', componentName, component !== undefined)
    return component !== undefined;
};




const debounce = (fn: Function, delay: number | undefined) => {
    let timerId: string | number | NodeJS.Timeout | undefined;
    return function (...args: any) {
        if (timerId) {
            clearTimeout(timerId);
        }
        timerId = setTimeout(() => {
            fn(...args);
        }, delay);
    };
};


// utils/debounce.js
function debounceWithPromise(fn: Function, delay: number | undefined) {
    const timers = new Map();

    return function (...args: any) {
        const key = JSON.stringify(args);  // Unique key based on arguments
        return new Promise((resolve, reject) => {
            if (timers.has(key)) {
                clearTimeout(timers.get(key).timerId);
            }
            const timerId = setTimeout(async () => {
                try {
                    const result = await fn(...args);
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    timers.delete(key);
                }
            }, delay);
            timers.set(key, { timerId, resolve });
        });
    };
}

// Generic/ Shared messaging utilities

//this function will receive the message context as argument
//and we will use the callbk function to send the subscription
//and message back to the calling component
const subscribeChannel = (messageContext: any, callback: (arg0: any, arg1: any) => void) => {
    const subscription = subscribe(
        messageContext, SYSTEM_CONFIGURATION_MESSAGE_CHANNEL, (message: any) => {
            // we will only send JSON messages, so we will parse the message           
                callback(subscription, message)
            
        }, { scope: APPLICATION_SCOPE });
}

//unsubscribe using the subscription passed
const unsubscribeChannel = (subscription: any) => {
    unsubscribe(subscription);
}

//publish using the message context, the message and channel type
//passed from calling component
const publishChannel = (messageContext: any, messageData: any, messageType: any) => {
    const message = {
        data: messageData,
        type: messageType
    };
    publish(messageContext, SYSTEM_CONFIGURATION_MESSAGE_CHANNEL, message);
}

// mock uploadFilesToSalesforce
const uploadFilesToSalesforce = async (files: any) => {
    return files;
}

const getPhotosForRecord = async (recordId: string) => {
    // Mock implementation - replace with actual Salesforce API call
    return [
        { id: 'photo1', title: 'Photo 1', contentDocumentId: 'doc1', fileType: 'jpg', sectionName: 'house-photo-10ft' },
        { id: 'photo2', title: 'Photo 2', contentDocumentId: 'doc2', fileType: 'png', sectionName: 'house-photo-left' },
    ];
}

const getOpportunityDetails = async (recordId: string) => {
    return {
        photosBucket: 'mock-bucket',
        territory: 'mock-territory',
        state: 'mock-state',
    };
}

const getSalesforcePhotoBlob = async (photoId: string) => {
    // This should fetch the actual image data for a single photo
    return null;
}

import { MAX_FILE_SIZE, MAX_IMAGE_SIZE, sanitizeBytesToMBAndGB, sanitizeName, readFileAsDataURL, resizeImage } from './FileUtils';

// Export the function map, addFunction, and executeFunctionByName methods
export { getPhotosForRecord, getOpportunityDetails, MAX_FILE_SIZE, MAX_IMAGE_SIZE, sanitizeBytesToMBAndGB, sanitizeName, componentMap, addComponentToCache, loadComponentByPath, componentLoaded, getComponentFromCache, debounce, debounceWithPromise, subscribeChannel, unsubscribeChannel, publishChannel, uploadFilesToSalesforce, readFileAsDataURL, resizeImage };
