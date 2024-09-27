graph TD
    subgraph "Legacy System"
        LS[Legacy Salesforce Integration]
    end

    subgraph "New System"
        SF[SalesforceProvider]
        SR[SalesforceRepository]
        HSO[useSalesforceOperations Hooks]
        CC[ContactConfirmation Component]
        SS[Synced State]
        LF[Local First Approach]
        LS[LegendState]
    end

    subgraph "Facade"
        WS[Window.__salesforce__]
    end

    subgraph "Backend API"
        BA[Express Server]
    end

    subgraph "Future Improvements"
        PM[Protecting Margins]
        DO[Developer Onboarding]
    end

    subgraph "Competitors"
        CA[Aurora]
        CS[Sunpro]
        CO[Other Competitors]
    end

    %% Connections
    LS --> WS
    WS --> SR
    SF --> SR
    HSO --> SF
    CC --> HSO
    CC --> SS
    SR --> BA
    BA --> LS
    LF --> SS
    LS --> SS

    %% Explanations
    WS -->|"Provides interface for legacy operations"| SR
    SR -->|"Decides between client-side and server-side execution"| BA
    BA -->|"Proxies requests to legacy system when needed"| LS
    SF -->|"Provides context for Salesforce operations"| HSO
    HSO -->|"Offers hooks for Salesforce operations"| CC
    CC -->|"Uses hooks for data operations"| HSO
    SS -->|"Syncs state with persistence and backend"| CC
    LF -->|"Enables offline-first functionality"| SS
    LS -->|"Persists data locally"| SS
    PM -->|"Gradual migration protects margins"| SR
    DO -->|"Improved architecture eases onboarding"| SR

    %% Styles
    classDef legacy fill:#FFA07A,stroke:#FF6347,stroke-width:2px;
    classDef new fill:#98FB98,stroke:#32CD32,stroke-width:2px;
    classDef facade fill:#87CEFA,stroke:#4169E1,stroke-width:2px;
    classDef backend fill:#DDA0DD,stroke:#8A2BE2,stroke-width:2px;
    classDef future fill:#FFD700,stroke:#FFA500,stroke-width:2px;
    classDef competitor fill:#D3D3D3,stroke:#A9A9A9,stroke-width:2px;

    class LS legacy;
    class SF,SR,HSO,CC,SS,LF,LS new;
    class WS facade;
    class BA backend;
    class PM,DO future;
    class CA,CS,CO competitor;

    %% Labels
    LS:::legacy
    SF:::new
    SR:::new
    HSO:::new
    CC:::new
    SS:::new
    LF:::new
    LS:::new
    WS:::facade
    BA:::backend
    PM:::future
    DO:::future
    CA:::competitor
    CS:::competitor
    CO:::competitor

    %% Additional Notes
    subgraph "Notes"
        N1[Protecting Margins: Gradual migration allows for cost control]
        N2[Developer Onboarding: Improved architecture and documentation]
        N3[Local First: Enables offline functionality and improved performance]
        N4[LegendState: Efficient local data persistence and sync]
        N5[Competitors: Aurora, Sunpro, and others in the solar industry]
    end
