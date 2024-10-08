import React, { useCallback, useEffect, useRef, useState } from 'react';
import { observer } from '@legendapp/state/react';
import { appState } from '../state/appState';
import { useDirectSalesforceAction } from '../hooks/useSalesforceOperations';
import { formatNumber } from '../components/ui/utils';
import './Solargraf3DModel.module.css';
import { Roof } from '../types';
import { LoadingSpinner } from '../components/Loader';
import { observable } from '@legendapp/state';


const solargraf3D = observable( {
  status: 'loading' as 'loading' | 'ready' | 'error',
  loadingProgress: 0,
  projectId: '',
  currentProposal: null as { id: string } | null,
  roofs: [] as Roof[],
  productions: [] as any[],
})

const Solargraf3DModel: React.FC = observer(() => {
  const recordId = appState.recordId.get();
  const { status, loadingProgress, projectId, currentProposal, roofs } =
    solargraf3D.get();

  const annualProduction = appState.annualProduction.get();
  const systemSize = appState.systemSize.get();
  const numberOfModules = appState.numberOfModules.get();
  const design = appState.design.get();
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // const { refetch: fetchProductsWithPricing } = useDirectSalesforceAction(
  //   'PricingEngine.fetchProductsWithPricing',
  //   { salesOpportunityId: recordId }
  // );

  // const { executeAction: getSystemSize } = useDirectSalesforceAction(
  //   'PricingEngine.getSystemSizekW',
  //   { salesOpportunityId: recordId }
  // );

  const { refetch: fetchSalesOpportunity } = useDirectSalesforceAction(
    'SalesOpportunityService.getSalesOpportunity',
    { salesOpportunityId: recordId }
  );

  const { refetch: fetchConsumption } = useDirectSalesforceAction(
    'ConsumptionService.getConsumptionBySalesOpportunityId',
    { salesOpportunityId: recordId }
  );

  const { refetch: fetchDesign } = useDirectSalesforceAction(
    'DesignService.getDesignBySalesOpportunityId',
    { salesOpportunityId: recordId }
  );

  const { refetch: fetchProductions } = useDirectSalesforceAction(
    'ProductionService.getProductionBySalesOpportunityId',
    { salesOpportunityId: recordId }
  );

  const { executeAction: createDesign } = useDirectSalesforceAction(
    'DesignService.createDesign',
    { design: null, sid: recordId }
  );

  const { executeAction: createRoofs } = useDirectSalesforceAction(
    'RoofService.createRoofs',
    { roof: null, did: null }
  );

  const { executeAction: setSalesOpportunity } = useDirectSalesforceAction(
    'SalesOpportunityService.setSalesOpportunity',
    { salesOpportunity: null }
  );

  const { executeAction: getDefaultProduct } = useDirectSalesforceAction(
    'ProductService.getDefaultProduct',
    { salesOpportunityId: recordId }
  );

  const loadSalesOpportunity = useCallback(async () => {
    setStatusMessage('Loading Sales Opportunity...');
    solargraf3D.loadingProgress.set(0);
    const salesOpportunity = await fetchSalesOpportunity();
    console.log('Sales Opportunity loaded:', salesOpportunity);
    solargraf3D.loadingProgress.set(20);
  }, [fetchSalesOpportunity]);

  const loadDefaultProduct = useCallback(async () => {
    setStatusMessage('Loading Default Product...');
    const defaultProduct = await getDefaultProduct({
      salesOpportunityId: recordId,
    });
    appState.defaultProduct.set(defaultProduct);
    console.log('Default Product loaded:', defaultProduct);
    solargraf3D.loadingProgress.set(30);
  }, [getDefaultProduct]);

  const loadConsumption = useCallback(async () => {
    setStatusMessage('Loading Consumption...');
    const consumption = await fetchConsumption();
    console.log('Consumption loaded:', consumption);
    solargraf3D.loadingProgress.set(40);
  }, [fetchConsumption]);

  const loadDesign = async () => {
    setStatusMessage('Loading Design...');
    let design = await fetchDesign();
    console.log('Design loaded:', design);

    if (!design) {
      design = await initDesign();
    }

    appState.design.set(design);

    appState.projectId.set(design.DesignProviderProjectId__c);
    appState.currentProposal.set({
      id: design.DesignProviderDesignId__c,
      name: '',
    });

    const roofs = await loadRoofs(design.Id);
    solargraf3D.roofs.set(roofs);

    solargraf3D.loadingProgress.set(60);
  };

  const loadData = useCallback(async () => {
    try {
      console.log('Starting Solargraf3D loading process');
      setIsLoading(true);
      solargraf3D.status.set('loading');

      // Load Sales Opportunity
      await loadSalesOpportunity();

      // Load Default Product
      await loadDefaultProduct();

      // Load Consumption
      await loadConsumption();

      // Load Design
      await loadDesign();

      // Load Production
      await loadProduction();

      // Check if roofs are loaded
      const roofs = solargraf3D.roofs.get();
      if (roofs && roofs.length > 0) {
        // Initialize 3D Renderer
        await initializeSolargrafRenderer();
      } else {
        console.warn('Roofs not loaded, skipping 3D Renderer initialization');
      }

      solargraf3D.loadingProgress.set(100);
      solargraf3D.status.set('ready');
      setStatusMessage('Ready!');
      console.log('Solargraf3D loading process completed');
    } catch (error: any) {
      console.error('Error in Solargraf3D loading process:', error);
      solargraf3D.status.set('error');
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      console.log('Solargraf3D loading process finished');
    }
  }, [recordId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { executeAction: getRoofsByDesignId } = useDirectSalesforceAction(
    'RoofService.getRoofsByDesignId',
    { designId: '' }
  );

  const loadRoofs = useCallback(
    async (designId: string) => {
      const roofs = await getRoofsByDesignId({ designId: designId });

      // Extract modules from roofs.Modules__r.records and set it as Modules__r
      roofs.forEach((roof: any) => {
        roof.Modules__r = roof.Modules__r.records;
      });
      console.log('Roofs loaded:', roofs);
      return roofs;
    },
    [getRoofsByDesignId]
  );

  const loadProduction = async () => {
    setStatusMessage('Loading Production...');
    const productions = await fetchProductions();
    console.log('Production loaded:', productions);
    solargraf3D.loadingProgress.set(80);
    solargraf3D.productions.set(productions);

    calculateAnnualProduction(productions, appState.design.get());
  };

  const initDesign = useCallback(async () => {
    console.log('Initializing Design...');
    const defaultProduct = appState.defaultProduct.get();
    const newDesign = {
      Sales_Opportunity__c: recordId,
      Product__c: defaultProduct || 'a0NOx000008Z6VlMAK',
    };
    const createdDesign = await createDesign({
      design: newDesign,
      sid: recordId,
    });
    console.log('Design created:', createdDesign);

    await updateDesignWithSolargrafRoofsAndPanels(createdDesign);

    return createdDesign;
  }, [recordId, createDesign]);

  const updateDesignWithSolargrafRoofsAndPanels = useCallback(
    async (design: any) => {
      const newRoofs = createRoofsFromSolargrafData();
      if (newRoofs.length > 0) {
        const createdRoofs = await createRoofs({
          roof: newRoofs,
          did: design.Id,
        });
        solargraf3D.roofs.set(createdRoofs);

        const updatedSalesOpportunity = {
          ...appState.salesOpportunity.get(),
          Design_Initialized__c: true,
        };
        await setSalesOpportunity({
          salesOpportunity: updatedSalesOpportunity,
        });

        // Inform system that design changed
        publishSystemConfigurationMessage(
          {
            designProjectId: appState.projectId.get(),
            designProposalId: appState.currentProposal.get()?.id,
            designId: design.Id,
          },
          'designChanged'
        );
      }
    },
    [createRoofs, setSalesOpportunity]
  );

  const createRoofsFromSolargrafData = () => {
    const solargrafRoofs = solargraf3D.roofs.get();
    return solargrafRoofs.map((roof: Roof) => ({
      Name: roof.Name,
      Design__c: appState.design.get().Id,
      Azimuth__c: roof.Azimuth__c,
      Pitch__c: roof.Pitch__c,
      Area__c: roof.Area__c,
      Modules__r: {
        records: roof.Modules__r.map((module) => ({
          Name: module.Name,
          isEnabled__c: module.isEnabled__c,
          X__c: module.X__c,
          Y__c: module.Y__c,
          Z__c: module.Z__c,
        })),
      },
    }));
  };

  const calculateAnnualProduction = (productions: any, design: any) => {
    let totalProduction = 0;
    let systemSizeKw = 0;
    let totalEnabledPanels = 0;

    solargraf3D.roofs.get().forEach((roof: Roof) => {
      const production = productions[roof.Name];
      const enabledPanels = roof.Modules__r.filter(
        (m) => m.isEnabled__c
      ).length;
      const panelSizeWatts = design?.Product__r?.Size_In_Watts__c || 0;
      const roofSizekW = (enabledPanels * panelSizeWatts) / 1000;

      if (production) {
        totalProduction += production.AnnualAC__c * roofSizekW;
        systemSizeKw += roofSizekW;
        totalEnabledPanels += enabledPanels;
      }
    });

    console.log('Total Production:', totalProduction);
    console.log('Total System Size:', systemSizeKw);

    appState.annualProduction.set(totalProduction);
    appState.systemSize.set(systemSizeKw);
    appState.numberOfModules.set(totalEnabledPanels);
    appState.design.set(design);

    publishSystemConfigurationMessage(
      {
        annualProduction: totalProduction,
        systemSizeKw,
        totalEnabledPanels,
        panelId: design?.Product__r?.Id,
      },
      'systemSizeChanged'
    );
  };

  const initializeSolargrafRenderer = async () => {
    console.log('Starting initializeSolargrafRenderer');
    setStatusMessage('Initializing 3D Renderer...');
    const roofs = solargraf3D.roofs.get();
    if (roofs && roofs.length > 0) {
      const iframeSrc = createIframeSrc(roofs);
      console.log('Created iframe src:', iframeSrc);
      if (iframeRef.current) {
        console.log('Setting iframe src');
        iframeRef.current.src = iframeSrc;
        // Wait for the iframe to load
        await new Promise<void>((resolve) => {
          if (iframeRef.current) {
            console.log('Waiting for iframe to load');
            iframeRef.current.onload = () => {
              console.log('Iframe loaded');
              resolve();
            };
          } else {
            console.warn('iframeRef is not available, resolving immediately');
            resolve();
          }
        });
      } else {
        console.warn('iframeRef is not available');
      }
      console.log('3D Renderer initialized');
    } else {
      console.warn('Roofs not loaded yet, skipping iframe initialization');
    }
  };

  const createIframeSrc = (roofs: Roof[]) => {
    // Extract panels from roofs and create a base64 encoded string
    const panels = roofs.flatMap((roof: Roof) =>
      (roof.Modules__r || []).map(
        (module: { Name: any; isEnabled__c: any }) => ({
          id: module.Name,
          roofId: roof.Name,
          isEnabled: module.isEnabled__c,
        })
      )
    );

    const roofStatus = JSON.stringify({
      roofs: roofs.map((roof: Roof) => ({ id: roof.Name, isEnabled: true })),
      panels,
    });

    console.log('Roof status:', roofStatus);
    const panelAndRoofStatus = btoa(roofStatus);

    return `https://patter-demos-mu.vercel.app/test-solargraf.html?projectId=${appState.projectId.get()}&proposalId=${
      appState.currentProposal.get()?.id
    }&panelAndRoofStatus=${panelAndRoofStatus}`;
  };

  const handleIframeMessage = (event: MessageEvent) => {
    const data =
      typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

    if (data?.type === 'rendererReady') {
      setIsLoading(false);
      setStatusMessage('');
    } else if (data?.type === 'panelStatusChanged') {
      handlePanelChange(data?.data);
    }
  };

  useEffect(() => {
    const handleIframeLoad = () => {
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(
          { type: 'checkRendererReady' },
          '*'
        );
      }
    };

    if (iframeRef.current) {
      iframeRef.current.addEventListener('load', handleIframeLoad);
    }

    return () => {
      if (iframeRef.current) {
        iframeRef.current.removeEventListener('load', handleIframeLoad);
      }
    };
  }, []);

  const handlePanelChange = async (data: any) => {
    // Create a map of panels from the iframe data for quick lookup
    const panelMap = new Map(data.panels.map((p: any) => [`${p.id}-${p.roofId}`, p]));

    // Update roofs and modules based on the data received from the iframe
    const updatedRoofs = solargraf3D.roofs.get().map((roof) => ({
      ...roof,
      Modules__r: roof.Modules__r.map((module) => {
        const panelKey = `${module.Name}-${roof.Name}`;
        const panelData = panelMap.get(panelKey) as any;
        return {
          ...module,
          isEnabled__c: panelData ? panelData.isEnabled : module.isEnabled__c,
        };
      }),
    }));

    // Count enabled panels in updatedRoofs
    const enabledPanels = updatedRoofs.reduce(
      (acc, roof) => acc + roof.Modules__r.filter((m) => m.isEnabled__c).length,
      0
    );

    // Count enabled panels in data
    const enabledPanelsData = data.panels.filter((p: any) => p.isEnabled).length;

    // console.log('Enabled panels:', { enabledPanels, enabledPanelsData });

    if (enabledPanels !== enabledPanelsData) {
      console.warn('Mismatch in enabled panel count between updatedRoofs and iframe data');
      console.log('Updated roofs:', updatedRoofs);
      console.log('Iframe data:', data.panels);
    }

    solargraf3D.roofs.set(updatedRoofs as any);

    // Calculate annual production
    calculateAnnualProduction(
      solargraf3D.get().productions,
      appState.design.get()
    );

    // Fetch updated productions and design
    const updatedProductions = await fetchProductions();
    const updatedDesign = await fetchDesign();

    calculateAnnualProduction(updatedProductions, updatedDesign);

    // Update Salesforce with new panel statuses
    await updateSalesforceWithPanelChanges(updatedRoofs);
  };

  const { executeAction: setRoofs } = useDirectSalesforceAction(
    'RoofService.setRoofs',
    { roof: [] }
  );

  const { executeAction: setSolarProfileGenability } =
    useDirectSalesforceAction('GenabilityService.setSolarProfileGenability', {
      pid: '',
      systemSizeKw: 0,
    });

  const { executeAction: runAnalysisGenability } = useDirectSalesforceAction(
    'GenabilityService.runAnalysis',
    { pid: '' }
  );

  const updateSalesforceWithPanelChanges = async (updatedRoofs: any) => {
    try {
      // Update roofs in Salesforce
      await setRoofs({ roof: updatedRoofs });

      // Update solar profile in Genability
      const systemSizeKw = appState.systemSize.get();
      await setSolarProfileGenability({
        pid: appState.recordId.get(),
        data: { System_Size__c: systemSizeKw },
      });

      // Run Genability analysis
      await runAnalysisGenability({
        pid: appState.recordId.get(),
      });

      console.log('Salesforce and Genability updated successfully');
    } catch (error) {
      console.error('Error updating Salesforce and Genability:', error);
    }
  };

  const publishSystemConfigurationMessage = (data: any, type: string) => {
    // Implementation of publishing system configuration message
    // This should be based on the logic in the original code
  };

  useEffect(() => {
    window.addEventListener('message', handleIframeMessage);
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, []);

  return (
    <div className="solargraf-container">
      <LoadingSpinner isLoading={isLoading} message={statusMessage} />

      <iframe
        ref={iframeRef}
        className="solargraf-iframe"
        title="Solargraf 3D Model"
      />
    </div>
  );
});

export default Solargraf3DModel;
