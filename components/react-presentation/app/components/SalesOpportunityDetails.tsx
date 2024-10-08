// /* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { useEffect, useState } from 'react';
// import styled from 'styled-components';
// import { observer } from '@legendapp/state/react';
// import { appState } from '../state/appState';
// import {
//   useSalesforceQuery,
//   useSalesforceAction,
// } from '../hooks/useSalesforceOperations';

// const Container = styled.div`
//   padding: 20px;
//   background-color: #f5f5f5;
//   border-radius: 8px;
//   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
// `;

// const Title = styled.h2`
//   color: #333;
//   margin-bottom: 20px;
// `;

// const FieldContainer = styled.div`
//   margin-bottom: 15px;
// `;

// const FieldLabel = styled.span`
//   font-weight: bold;
//   color: #555;
// `;

// const FieldValue = styled.span`
//   margin-left: 10px;
// `;

// interface ObjectMetadata {
//   fields: [
//     {
//       label: string;
//       type: string;
//       name: string;
//     }
//   ];
// }

// interface OpportunityData {
//   records: Array<Record<string, any>>;
//   totalSize: number;
//   done: boolean;
// }

// interface SalesOpportunityDetailsProps {
//   onLoadingChange: (isLoading: boolean) => void;
// }

// const SalesOpportunityDetails: React.FC<SalesOpportunityDetailsProps> = observer(({ onLoadingChange }) => {
//   const {
//     data: opportunityData,
//     loading: queryLoading,
//     error: queryError,
//     executeQuery,
//   } = useSalesforceQuery<OpportunityData>();
//   const {
//     result: objectMetadata,
//     loading: metadataLoading,
//     error: metadataError,
//     executeAction: getObjectInfo,
//   } = useSalesforceAction<ObjectMetadata>();

//   const [isInitialLoad, setIsInitialLoad] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         onLoadingChange(true);
//         const metadata = await getObjectInfo('getObjectInfo', {
//           objectName: 'Sales_Opportunity__c',
//         });
//         if (metadata && metadata.fields) {
//           const fieldNames = metadata.fields.map((field) => field.name);
//           console.log('fieldNames', fieldNames);
//           await executeQuery({
//             objectName: 'Sales_Opportunity__c',
//             fields: fieldNames,
//             orderBy: 'LastModifiedDate DESC',
//             limit: 1,
//           });
//         }
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       } finally {
//         onLoadingChange(false);
//         setIsInitialLoad(false);
//       }
//     };

//     if (isInitialLoad) {
//       fetchData();
//     }
//   }, []);

//   useEffect(() => {
//     onLoadingChange(queryLoading || metadataLoading);
//   }, [queryLoading, metadataLoading, onLoadingChange]);

//   const renderFieldValue = (fieldName: string, value: any) => {
//     if (!objectMetadata || !objectMetadata.fields) return value;
//     const fieldMetadata = objectMetadata.fields.find(
//       (field) => field.name === fieldName
//     );
//     switch (fieldMetadata?.type) {
//       case 'date':
//       case 'datetime':
//         return new Date(value).toLocaleString();
//       case 'currency':
//         return new Intl.NumberFormat('en-US', {
//           style: 'currency',
//           currency: 'USD',
//         }).format(value);
//       case 'percent':
//         return `${value}%`;
//       case 'boolean':
//         return value ? 'Yes' : 'No';
//       default:
//         return value;
//     }
//   };

//   if (queryLoading || metadataLoading) {
//     return <div>Loading...</div>;
//   }

//   if (queryError || metadataError) {
//     return <div>Error: {queryError?.message || metadataError?.message}</div>;
//   }

//   if (!opportunityData || !objectMetadata || !opportunityData.records || opportunityData.records.length === 0) {
//     return <div>No data available</div>;
//   }

//   const opportunity = opportunityData.records[0];

//   return (
//     <Container>
//       <Title>Latest Sales Opportunity Details</Title>
//       {Object.entries(opportunity).map(([fieldName, value]) => {
//         if (fieldName === 'attributes') return null;
//         return (
//           <FieldContainer key={fieldName}>
//             <FieldLabel>
//               {objectMetadata.fields.find((field) => field.name === fieldName)
//                 ?.label || fieldName}
//               :
//             </FieldLabel>
//             <FieldValue>{renderFieldValue(fieldName, value)}</FieldValue>
//           </FieldContainer>
//         );
//       })}
//     </Container>
//   );
// });

// export default SalesOpportunityDetails;

