export type Language = 'en' | 'vi';
export type WorkspaceView = 'GLOBAL' | 'SE' | 'DK' | 'NO';
export type CountryCode = 'SE' | 'DK' | 'NO';

export interface LedgerAuditEvent {
  id: string;
  timestamp: string;
  sourceNode: string;
  eventTypeEn: string;
  eventTypeVi: string;
  globalSku: string;
  detailsEn: string;
  detailsVi: string;
  latencyMs: number;
  status: 'NOMINAL' | 'SPLIT_ROUTED' | 'CIRCUIT_BREAKER';
}

export interface AIOrchestrationReport {
  reportTitle: string;
  statusVerdict: string;
  confidenceScore: string;
  executiveSummary: string;
  stepByStepInsights: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
  };
  financialAndKpiImpact: string;
  actionableRecommendations: string[];
  modelUsed: string;
  serverLatencyMs: number;
  stepTimingsMs: Record<number, number>;
  generatedAt: string;
}

export interface LocalMapping {
  country: CountryCode;
  localSku: string;
  localName: string;
  localUnit: string;
  conversionRule: string;
  multiplierToBase: number;
  legacyTable: string;
  legacyFieldSku: string;
  legacyFieldQty: string;
}

export interface GlobalMaterial {
  globalSku: string;
  nameEn: string;
  nameVi: string;
  categoryEn: string;
  categoryVi: string;
  baseUnitEn: string;
  baseUnitVi: string;
  unitWeightKg: number;
  unitPriceEur: number;
  mappings: Record<CountryCode, LocalMapping>;
}

export interface BranchStock {
  id: string;
  branchId: string;
  branchNameEn: string;
  branchNameVi: string;
  country: CountryCode;
  distanceToCapitalKm: number;
  globalSku: string;
  physicalStock: number;
  initialPhysicalStock: number;
  softReserved: number;
  initialSoftReserved: number;
  lastPolledAgo: string;
}

export interface CountryNodeProfile {
  code: CountryCode;
  flag: string;
  countryNameEn: string;
  countryNameVi: string;
  adapterTitleEn: string;
  adapterTitleVi: string;
  legacySystemName: string;
  protocolEn: string;
  protocolVi: string;
  encoding: string;
  syncCadenceEn: string;
  syncCadenceVi: string;
  challengeEn: string;
  challengeVi: string;
  architectureSolutionEn: string;
  architectureSolutionVi: string;
  rawColumns: [string, string, string, string, string];
  rawRecords: Array<{
    col1: string;
    col2: string;
    col3: string;
    col4: string;
    col5: string;
    mappedGlobalSku: string;
  }>;
  rawSchemaCode: string;
  rawSamplePayload: string;
}

export interface OrderScenario {
  id: string;
  country: CountryCode;
  badgeEn: string;
  badgeVi: string;
  titleEn: string;
  titleVi: string;
  contractorName: string;
  contractorTier: string;
  primaryBranchId: string;
  backupBranchId: string;
  deliverySiteEn: string;
  deliverySiteVi: string;
  requestedWindow: string;
  globalSku: string;
  requestedBaseQty: number;
  rawLocalQtyText: string;
  rawOrderInput: string;
  nlpExtractedEntity: {
    rawTerm: string;
    detectedLanguage: string;
    localSkuMatched: string;
    globalSkuEncoded: string;
    confidence: string;
    unitConversionNoteEn: string;
    unitConversionNoteVi: string;
  };
  routingMetrics: {
    primaryDistanceKm: number;
    primaryLeadTime: string;
    backupDistanceKm: number;
    backupLeadTime: string;
    co2SavedKg: number;
    kpiCreditPolicyEn: string;
    kpiCreditPolicyVi: string;
  };
}

export const GLOBAL_MATERIALS: GlobalMaterial[] = [
  {
    globalSku: 'GLB-MAT-PLB13',
    nameEn: 'Standard Gypsum Plasterboard 13mm (1200×2400)',
    nameVi: 'Tấm Thạch Cao Tiêu Chuẩn 13mm (1200×2400)',
    categoryEn: 'Interior Drywall Systems',
    categoryVi: 'Hệ thống Vách ngăn & Nội thất',
    baseUnitEn: 'Board',
    baseUnitVi: 'Tấm',
    unitWeightKg: 25.4,
    unitPriceEur: 14.5,
    mappings: {
      SE: {
        country: 'SE',
        localSku: 'SE-GIPS-13',
        localName: 'Gipsskiva Normal 13mm',
        localUnit: 'St (Skiva)',
        conversionRule: '1 St = 1 Board',
        multiplierToBase: 1,
        legacyTable: 'SE_LAGER_ARTIKEL',
        legacyFieldSku: 'ART_NR',
        legacyFieldQty: 'LAGER_SALDO',
      },
      DK: {
        country: 'DK',
        localSku: 'DK-GIPS-130',
        localName: 'Gipsplade Standard 13mm',
        localUnit: 'Bundt (20 Plader)',
        conversionRule: '1 Bundt = 20 Boards',
        multiplierToBase: 20,
        legacyTable: 'DK_VARE_LAGER_TBL',
        legacyFieldSku: 'VARE_NUMMER',
        legacyFieldQty: 'BEHOLDNING_STK',
      },
      NO: {
        country: 'NO',
        localSku: 'NO-GIPS-13A',
        localName: 'Gipsplate Standard 13x1200',
        localUnit: 'Plate',
        conversionRule: '1 Plate = 1 Board',
        multiplierToBase: 1,
        legacyTable: 'NO_POS_VARELAGER_XML',
        legacyFieldSku: '<VareKode>',
        legacyFieldQty: '<FysiskAntall>',
      },
    },
  },
  {
    globalSku: 'GLB-MAT-CEM25',
    nameEn: 'Portland Limestone Cement CEM II 25kg',
    nameVi: 'Xi Măng Portland Hỗn Hợp CEM II 25kg',
    categoryEn: 'Structural Binders & Concrete',
    categoryVi: 'Chất kết dính & Vật liệu Kết cấu',
    baseUnitEn: 'Bag (25kg)',
    baseUnitVi: 'Bao (25kg)',
    unitWeightKg: 25.0,
    unitPriceEur: 8.2,
    mappings: {
      SE: {
        country: 'SE',
        localSku: 'SE-BYGG-88',
        localName: 'Portlandcement Slite 25kg',
        localUnit: 'Pall (40 Säck)',
        conversionRule: '1 Pall = 40 Bags',
        multiplierToBase: 40,
        legacyTable: 'SE_LAGER_ARTIKEL',
        legacyFieldSku: 'ART_NR',
        legacyFieldQty: 'LAGER_SALDO',
      },
      DK: {
        country: 'DK',
        localSku: 'DK-CEM-01',
        localName: 'Grå Cement Aalborg 25kg Sæk',
        localUnit: 'Sæk (25kg)',
        conversionRule: '1 Sæk = 1 Bag',
        multiplierToBase: 1,
        legacyTable: 'DK_VARE_LAGER_TBL',
        legacyFieldSku: 'VARE_NUMMER',
        legacyFieldQty: 'BEHOLDNING_STK',
      },
      NO: {
        country: 'NO',
        localSku: 'NO-MUR-250',
        localName: 'Standardsement Norcem 25kg',
        localUnit: 'Ton (Metrisk)',
        conversionRule: '1 Ton = 40 Bags',
        multiplierToBase: 40,
        legacyTable: 'NO_POS_VARELAGER_XML',
        legacyFieldSku: '<VareKode>',
        legacyFieldQty: '<FysiskAntall>',
      },
    },
  },
  {
    globalSku: 'GLB-MAT-TIM45',
    nameEn: 'Structural Timber C24 Kiln-Dried 45×195mm',
    nameVi: 'Gỗ Kết Cấu Chịu Lực C24 Sấy Khô 45×195mm',
    categoryEn: 'Engineered Structural Timber',
    categoryVi: 'Gỗ Kỹ thuật & Khung chịu lực',
    baseUnitEn: 'Meter (m)',
    baseUnitVi: 'Mét dài (m)',
    unitWeightKg: 4.8,
    unitPriceEur: 6.8,
    mappings: {
      SE: {
        country: 'SE',
        localSku: 'SE-TRE-45',
        localName: 'Konstruktionsvirke C24 45x195',
        localUnit: 'Lpm (Löpmeter)',
        conversionRule: '1 Lpm = 1 Meter',
        multiplierToBase: 1,
        legacyTable: 'SE_LAGER_ARTIKEL',
        legacyFieldSku: 'ART_NR',
        legacyFieldQty: 'LAGER_SALDO',
      },
      DK: {
        country: 'DK',
        localSku: 'DK-TOM-C24',
        localName: 'Spærtræ C24 45x195mm',
        localUnit: 'Pakke (100m)',
        conversionRule: '1 Pakke = 100 Meters',
        multiplierToBase: 100,
        legacyTable: 'DK_VARE_LAGER_TBL',
        legacyFieldSku: 'VARE_NUMMER',
        legacyFieldQty: 'BEHOLDNING_STK',
      },
      NO: {
        country: 'NO',
        localSku: 'NO-TRE-195',
        localName: 'Konstruksjonsvirke Gran C24',
        localUnit: 'Meter',
        conversionRule: '1 Meter = 1 Meter',
        multiplierToBase: 1,
        legacyTable: 'NO_POS_VARELAGER_XML',
        legacyFieldSku: '<VareKode>',
        legacyFieldQty: '<FysiskAntall>',
      },
    },
  },
  {
    globalSku: 'GLB-MAT-INS95',
    nameEn: 'Acoustic & Thermal Mineral Wool 95mm',
    nameVi: 'Cuộn Bông Khoáng Cách Âm Cách Nhiệt 95mm',
    categoryEn: 'Thermal & Acoustic Insulation',
    categoryVi: 'Vật liệu Cách nhiệt & Tiêu âm',
    baseUnitEn: 'Roll (5.4m²)',
    baseUnitVi: 'Cuộn (5.4m²)',
    unitWeightKg: 14.2,
    unitPriceEur: 32.0,
    mappings: {
      SE: {
        country: 'SE',
        localSku: 'SE-ISOL-50',
        localName: 'Stenull Isolering 95mm',
        localUnit: 'Rulle',
        conversionRule: '1 Rulle = 1 Roll',
        multiplierToBase: 1,
        legacyTable: 'SE_LAGER_ARTIKEL',
        legacyFieldSku: 'ART_NR',
        legacyFieldQty: 'LAGER_SALDO',
      },
      DK: {
        country: 'DK',
        localSku: 'DK-ISOL-95',
        localName: 'Rockwool Flexibatts 95mm',
        localUnit: 'Pall (12 Pk)',
        conversionRule: '1 Pall = 12 Rolls',
        multiplierToBase: 12,
        legacyTable: 'DK_VARE_LAGER_TBL',
        legacyFieldSku: 'VARE_NUMMER',
        legacyFieldQty: 'BEHOLDNING_STK',
      },
      NO: {
        country: 'NO',
        localSku: 'NO-GLAV-95',
        localName: 'Glava Proff 34 95mm',
        localUnit: 'Rull',
        conversionRule: '1 Rull = 1 Roll',
        multiplierToBase: 1,
        legacyTable: 'NO_POS_VARELAGER_XML',
        legacyFieldSku: '<VareKode>',
        legacyFieldQty: '<FysiskAntall>',
      },
    },
  },
];

export const INITIAL_BRANCH_STOCKS: BranchStock[] = [
  // SWEDEN
  {
    id: 'STO-01-PLB13',
    branchId: 'STO-01',
    branchNameEn: 'Stockholm South Distribution Center (STO-01)',
    branchNameVi: 'Trung tâm Phân phối Nam Stockholm (STO-01)',
    country: 'SE',
    distanceToCapitalKm: 8,
    globalSku: 'GLB-MAT-PLB13',
    physicalStock: 80, // 80 - 8 (10% buffer) - 2 (soft reserved) = 70 ATP
    initialPhysicalStock: 80,
    softReserved: 2,
    initialSoftReserved: 2,
    lastPolledAgo: '12s',
  },
  {
    id: 'STO-01-CEM25',
    branchId: 'STO-01',
    branchNameEn: 'Stockholm South Distribution Center (STO-01)',
    branchNameVi: 'Trung tâm Phân phối Nam Stockholm (STO-01)',
    country: 'SE',
    distanceToCapitalKm: 8,
    globalSku: 'GLB-MAT-CEM25',
    physicalStock: 240,
    initialPhysicalStock: 240,
    softReserved: 16,
    initialSoftReserved: 16,
    lastPolledAgo: '14s',
  },
  {
    id: 'UPP-02-PLB13',
    branchId: 'UPP-02',
    branchNameEn: 'Uppsala Regional Fulfillment Hub (UPP-02)',
    branchNameVi: 'Trung tâm Điều phối Vùng Uppsala (UPP-02)',
    country: 'SE',
    distanceToCapitalKm: 68,
    globalSku: 'GLB-MAT-PLB13',
    physicalStock: 160, // 160 - 16 (10% buffer) - 4 (reserved) = 140 ATP
    initialPhysicalStock: 160,
    softReserved: 4,
    initialSoftReserved: 4,
    lastPolledAgo: '19s',
  },
  {
    id: 'UPP-02-TIM45',
    branchId: 'UPP-02',
    branchNameEn: 'Uppsala Regional Fulfillment Hub (UPP-02)',
    branchNameVi: 'Trung tâm Điều phối Vùng Uppsala (UPP-02)',
    country: 'SE',
    distanceToCapitalKm: 68,
    globalSku: 'GLB-MAT-TIM45',
    physicalStock: 500,
    initialPhysicalStock: 500,
    softReserved: 30,
    initialSoftReserved: 30,
    lastPolledAgo: '21s',
  },
  // DENMARK
  {
    id: 'CPH-01-CEM25',
    branchId: 'CPH-01',
    branchNameEn: 'Copenhagen Nordhavn Logistics Hub (CPH-01)',
    branchNameVi: 'Trung tâm Logistics Cảng Copenhagen (CPH-01)',
    country: 'DK',
    distanceToCapitalKm: 6,
    globalSku: 'GLB-MAT-CEM25',
    physicalStock: 70, // 70 - 7 - 3 = 60 ATP
    initialPhysicalStock: 70,
    softReserved: 3,
    initialSoftReserved: 3,
    lastPolledAgo: '42s',
  },
  {
    id: 'CPH-01-INS95',
    branchId: 'CPH-01',
    branchNameEn: 'Copenhagen Nordhavn Logistics Hub (CPH-01)',
    branchNameVi: 'Trung tâm Logistics Cảng Copenhagen (CPH-01)',
    country: 'DK',
    distanceToCapitalKm: 6,
    globalSku: 'GLB-MAT-INS95',
    physicalStock: 144,
    initialPhysicalStock: 144,
    softReserved: 10,
    initialSoftReserved: 10,
    lastPolledAgo: '45s',
  },
  {
    id: 'AAR-02-CEM25',
    branchId: 'AAR-02',
    branchNameEn: 'Aarhus Central Supply Depot (AAR-02)',
    branchNameVi: 'Kho Cung ứng Trung tâm Aarhus (AAR-02)',
    country: 'DK',
    distanceToCapitalKm: 187,
    globalSku: 'GLB-MAT-CEM25',
    physicalStock: 200,
    initialPhysicalStock: 200,
    softReserved: 10,
    initialSoftReserved: 10,
    lastPolledAgo: '48s',
  },
  {
    id: 'AAR-02-PLB13',
    branchId: 'AAR-02',
    branchNameEn: 'Aarhus Central Supply Depot (AAR-02)',
    branchNameVi: 'Kho Cung ứng Trung tâm Aarhus (AAR-02)',
    country: 'DK',
    distanceToCapitalKm: 187,
    globalSku: 'GLB-MAT-PLB13',
    physicalStock: 120,
    initialPhysicalStock: 120,
    softReserved: 10,
    initialSoftReserved: 10,
    lastPolledAgo: '50s',
  },
  // NORWAY
  {
    id: 'OSL-01-CEM25',
    branchId: 'OSL-01',
    branchNameEn: 'Oslo Alnabru Freight Terminal (OSL-01)',
    branchNameVi: 'Trạm Trung chuyển Hàng hóa Oslo Alnabru (OSL-01)',
    country: 'NO',
    distanceToCapitalKm: 9,
    globalSku: 'GLB-MAT-CEM25',
    physicalStock: 120, // 120 - 12 - 8 = 100 ATP
    initialPhysicalStock: 120,
    softReserved: 8,
    initialSoftReserved: 8,
    lastPolledAgo: '28s',
  },
  {
    id: 'OSL-01-TIM45',
    branchId: 'OSL-01',
    branchNameEn: 'Oslo Alnabru Freight Terminal (OSL-01)',
    branchNameVi: 'Trạm Trung chuyển Hàng hóa Oslo Alnabru (OSL-01)',
    country: 'NO',
    distanceToCapitalKm: 9,
    globalSku: 'GLB-MAT-TIM45',
    physicalStock: 350,
    initialPhysicalStock: 350,
    softReserved: 25,
    initialSoftReserved: 25,
    lastPolledAgo: '31s',
  },
  {
    id: 'BGO-02-CEM25',
    branchId: 'BGO-02',
    branchNameEn: 'Bergen Regional Distribution Branch (BGO-02)',
    branchNameVi: 'Chi nhánh Phân phối Vùng Bergen (BGO-02)',
    country: 'NO',
    distanceToCapitalKm: 305,
    globalSku: 'GLB-MAT-CEM25',
    physicalStock: 160,
    initialPhysicalStock: 160,
    softReserved: 10,
    initialSoftReserved: 10,
    lastPolledAgo: '35s',
  },
  {
    id: 'BGO-02-INS95',
    branchId: 'BGO-02',
    branchNameEn: 'Bergen Regional Distribution Branch (BGO-02)',
    branchNameVi: 'Chi nhánh Phân phối Vùng Bergen (BGO-02)',
    country: 'NO',
    distanceToCapitalKm: 305,
    globalSku: 'GLB-MAT-INS95',
    physicalStock: 100,
    initialPhysicalStock: 100,
    softReserved: 8,
    initialSoftReserved: 8,
    lastPolledAgo: '39s',
  },
];

export const COUNTRY_PROFILES: Record<CountryCode, CountryNodeProfile> = {
  SE: {
    code: 'SE',
    flag: '🇸🇪',
    countryNameEn: 'Sweden Market (Stockholm & Uppsala)',
    countryNameVi: 'Thị trường Thụy Điển (Stockholm & Uppsala)',
    adapterTitleEn: 'Sweden Smart Shell Adapter (SE-Adapter v2.4)',
    adapterTitleVi: 'Tầng Tích Hợp Thông Minh Thụy Điển (SE Smart Shell Adapter)',
    legacySystemName: 'Infor M3 / Movex Legacy ERP (IBM DB2)',
    protocolEn: 'REST API Connector (ISO-8859-1 to Canonical UTF-8)',
    protocolVi: 'Bộ kết nối REST API (Chuyển đổi bảng mã ISO-8859-1 sang UTF-8)',
    encoding: 'ISO-8859-1 → UTF-8',
    syncCadenceEn: 'Real-Time Webhook + 15s Delta Synchronization',
    syncCadenceVi: 'Đồng bộ biến động thời gian thực (Chu kỳ 15 giây)',
    challengeEn:
      'Operates on localized Swedish nomenclature (SE-GIPS-13, SE-BYGG-88), mixes wholesale Pallet (Pall) and retail Piece (St) units, and processes counter sales in delayed end-of-day batches.',
    challengeVi:
      'Vận hành trên hệ thống danh mục nội bộ tiếng Thụy Điển (SE-GIPS-13, SE-BYGG-88), sử dụng đồng thời đơn vị Pallet (Pall) và Tấm lẻ (St), đồng thời cập nhật giao dịch bán lẻ theo lô cuối ngày gây trễ dữ liệu.',
    architectureSolutionEn:
      'The Sweden Smart Shell Adapter intercepts local REST streams non-invasively, normalizes 1 Pall = 40 Bags, applies a configurable Safety Stock Buffer (10%), and manages real-time B2B Soft-Reservations before streaming to the Global Hub.',
    architectureSolutionVi:
      'Tầng tích hợp SE Smart Shell tiếp nhận luồng dữ liệu không xâm lấn, tự động chuẩn hóa quy tắc 1 Pall = 40 Bao, áp dụng định mức dự phòng an toàn 10% (Safety Stock Buffer) và quản lý trạng thái tạm giữ hàng B2B trước khi đồng bộ về Global Hub.',
    rawColumns: ['ART_NR', 'BENAMNING_SV', 'FILIAL_ID', 'LAGER_SALDO', 'ENHET_KOD'],
    rawRecords: [
      {
        col1: 'SE-GIPS-13',
        col2: 'Gipsskiva Normal 13mm',
        col3: 'STO-01 (Stockholm)',
        col4: '80',
        col5: 'St (Skiva)',
        mappedGlobalSku: 'GLB-MAT-PLB13',
      },
      {
        col1: 'SE-GIPS-13',
        col2: 'Gipsskiva Normal 13mm',
        col3: 'UPP-02 (Uppsala)',
        col4: '160',
        col5: 'St (Skiva)',
        mappedGlobalSku: 'GLB-MAT-PLB13',
      },
      {
        col1: 'SE-BYGG-88',
        col2: 'Portlandcement Slite 25kg',
        col3: 'STO-01 (Stockholm)',
        col4: '6.0',
        col5: 'Pall (40 Säck)',
        mappedGlobalSku: 'GLB-MAT-CEM25',
      },
      {
        col1: 'SE-TRE-45',
        col2: 'Konstruktionsvirke C24 45x195',
        col3: 'UPP-02 (Uppsala)',
        col4: '500',
        col5: 'Lpm (Meter)',
        mappedGlobalSku: 'GLB-MAT-TIM45',
      },
    ],
    rawSchemaCode: `-- SWEDEN LEGACY DB2 TABLE: SE_LAGER_ARTIKEL
CREATE TABLE SE_BYGG_PROD.SE_LAGER_ARTIKEL (
  ART_NR         CHAR(12) NOT NULL,      -- Local SKU: 'SE-GIPS-13', 'SE-BYGG-88'
  BENAMNING_SV   VARCHAR(64) CCSID 278,  -- Localized Swedish description
  FILIAL_ID      CHAR(6) NOT NULL,       -- 'STO-01' (Stockholm), 'UPP-02' (Uppsala)
  LAGER_SALDO    DECIMAL(10,2) NOT NULL, -- Unbuffered physical balance
  ENHET_KOD      VARCHAR(10) NOT NULL,   -- 'Pall', 'St', 'Lpm', 'Rulle'
  SENAST_UPPDAT  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ART_NR, FILIAL_ID)
);`,
    rawSamplePayload: `{
  "kalla_system": "MOVEX_SE_AS400",
  "filial": "STO-01",
  "artiklar": [
    { "ART_NR": "SE-GIPS-13", "BENAMNING_SV": "Gipsskiva Normal 13mm", "LAGER_SALDO": 80, "ENHET_KOD": "St" },
    { "ART_NR": "SE-BYGG-88", "BENAMNING_SV": "Portlandcement Slite 25kg", "LAGER_SALDO": 6.0, "ENHET_KOD": "Pall" }
  ]
}`,
  },
  DK: {
    code: 'DK',
    flag: '🇩🇰',
    countryNameEn: 'Denmark Market (Copenhagen & Aarhus)',
    countryNameVi: 'Thị trường Đan Mạch (Copenhagen & Aarhus)',
    adapterTitleEn: 'Denmark Smart Shell Adapter (DK-Adapter v2.4)',
    adapterTitleVi: 'Tầng Tích Hợp Thông Minh Đan Mạch (DK Smart Shell Adapter)',
    legacySystemName: 'Microsoft Dynamics NAV 2009 SQL + Manual Order Desk',
    protocolEn: 'Non-Invasive Read-Only SQL Change Poller + AI Document Intake',
    protocolVi: 'Bộ đọc biến động SQL (Read-Only) + Мо-đun AI bóc tách chứng từ B2B',
    encoding: 'Windows-1252 → UTF-8',
    syncCadenceEn: '30s Change-Tracking Poll + Instant NLP Order Parsing',
    syncCadenceVi: 'Quét biến động 30 giây/lần + Xử lý tức thì chứng từ Email/PDF',
    challengeEn:
      'B2B contractor orders arrive via unstructured Danish emails and PDFs requiring manual entry into Dynamics NAV, while stock is tracked in local bundle units (1 Bundt = 20 Boards).',
    challengeVi:
      'Đơn đặt hàng B2B từ nhà thầu gửi qua Email và tệp PDF phi cấu trúc dẫn đến độ trễ khi xử lý thủ công vào hệ thống NAV; đơn vị tính lưu trữ theo kiện/bó nội bộ (1 Bundt = 20 Tấm).',
    architectureSolutionEn:
      'The Denmark Smart Shell Adapter combines a zero-impact SQL Change Poller with a Danish NLP engine that extracts PDF/email orders, converts Bundles to canonical units, and locks ATP in under 500ms.',
    architectureSolutionVi:
      'Tầng tích hợp DK Smart Shell kết hợp cơ chế đọc SQL không xâm lấn với mô hình ngôn ngữ NLP tiếng Đan Mạch giúp tự động hóa tiếp nhận đơn hàng, chuẩn hóa hệ số đơn vị và khóa tồn kho khả dụng (ATP) dưới 500ms.',
    rawColumns: ['VARE_NUMMER', 'VARE_TEKST', 'LOKATION', 'BEHOLDNING_STK', 'MAALE_ENHED'],
    rawRecords: [
      {
        col1: 'DK-CEM-01',
        col2: 'Grå Cement Aalborg 25kg Sæk',
        col3: 'CPH-01 (København)',
        col4: '70',
        col5: 'Sæk (25kg)',
        mappedGlobalSku: 'GLB-MAT-CEM25',
      },
      {
        col1: 'DK-CEM-01',
        col2: 'Grå Cement Aalborg 25kg Sæk',
        col3: 'AAR-02 (Aarhus)',
        col4: '200',
        col5: 'Sæk (25kg)',
        mappedGlobalSku: 'GLB-MAT-CEM25',
      },
      {
        col1: 'DK-GIPS-130',
        col2: 'Gipsplade Standard 13mm',
        col3: 'AAR-02 (Aarhus)',
        col4: '6.0',
        col5: 'Bundt (20 Stk)',
        mappedGlobalSku: 'GLB-MAT-PLB13',
      },
      {
        col1: 'DK-ISOL-95',
        col2: 'Rockwool Flexibatts 95mm',
        col3: 'CPH-01 (København)',
        col4: '12.0',
        col5: 'Pall (12 Pk)',
        mappedGlobalSku: 'GLB-MAT-INS95',
      },
    ],
    rawSchemaCode: `-- DENMARK LEGACY SQL SERVER TABLE: DK_VARE_LAGER_TBL
CREATE TABLE [dbo].[DK_VARE_LAGER_TBL] (
  [VARE_NUMMER]     NVARCHAR(20) NOT NULL,  -- Local SKU: 'DK-CEM-01', 'DK-GIPS-130'
  [VARE_TEKST]      NVARCHAR(80) NOT NULL,  -- Danish item description
  [LOKATION]        VARCHAR(12) NOT NULL,   -- 'CPH-01', 'AAR-02'
  [BEHOLDNING_STK]  NUMERIC(12,2) NOT NULL, -- Raw physical quantity
  [MAALE_ENHED]     VARCHAR(16) NOT NULL,   -- 'Sæk', 'Bundt', 'Pall', 'Pakke'
  [SIDST_OPDATERET] DATETIME DEFAULT GETDATE()
);`,
    rawSamplePayload: `VARE_NUMMER;VARE_TEKST;LOKATION;BEHOLDNING_STK;MAALE_ENHED
DK-CEM-01;Grå Cement Aalborg 25kg Sæk;CPH-01;70.00;Sæk
DK-CEM-01;Grå Cement Aalborg 25kg Sæk;AAR-02;200.00;Sæk
DK-GIPS-130;Gipsplade Standard 13mm;AAR-02;6.00;Bundt`,
  },
  NO: {
    code: 'NO',
    flag: '🇳🇴',
    countryNameEn: 'Norway Market (Oslo & Bergen)',
    countryNameVi: 'Thị trường Na Uy (Oslo & Bergen)',
    adapterTitleEn: 'Norway Smart Shell Adapter (NO-Adapter v2.4)',
    adapterTitleVi: 'Tầng Tích Hợp Thông Minh Na Uy (NO Smart Shell Adapter)',
    legacySystemName: 'Lindbak Retail POS Edge Database (SOAP / XML)',
    protocolEn: 'Edge POS Telemetry Agent + High-Availability Circuit Breaker',
    protocolVi: 'Tác tử Đồng bộ tại Điểm bán (Edge Agent) + Cơ chế Ngắt mạch Dự phòng',
    encoding: 'SOAP XML → Canonical JSON',
    syncCadenceEn: 'Edge Event Trigger + 5-Minute Failover Replica Cache',
    syncCadenceVi: 'Kích hoạt theo sự kiện POS + Bộ nhớ đệm dự phòng 5 phút',
    challengeEn:
      'Decentralized in-store POS databases across regional branches communicate via legacy SOAP/XML envelopes and measure bulk aggregates in Metric Tons (1 Ton = 40 Bags).',
    challengeVi:
      'Cơ sở dữ liệu POS phân tán tại từng chi nhánh khu vực truyền tải qua giao thức SOAP/XML cũ và quản lý định lượng vật tư rời theo đơn vị Tấn (1 Ton = 40 Bao 25kg).',
    architectureSolutionEn:
      'The Norway Smart Shell Adapter parses XML payloads at the edge, converts Metric Tons into canonical 25kg Bags, and maintains a Circuit Breaker cache to guarantee uninterrupted order routing during WAN instability.',
    architectureSolutionVi:
      'Tầng tích hợp NO Smart Shell xử lý gói tin XML ngay tại biên, quy đổi chuẩn xác đơn vị Tấn sang Bao 25kg và duy trì bộ nhớ đệm ngắt mạch (Circuit Breaker) đảm bảo định tuyến đơn hàng liên tục khi đường truyền gián đoạn.',
    rawColumns: ['<VareKode>', '<Beskrivelse>', '<Avdeling>', '<FysiskAntall>', '<Enhet>'],
    rawRecords: [
      {
        col1: 'NO-MUR-250',
        col2: 'Standardsement Norcem 25kg',
        col3: 'OSL-01 (Oslo)',
        col4: '3.0',
        col5: 'Ton (40 Sekk)',
        mappedGlobalSku: 'GLB-MAT-CEM25',
      },
      {
        col1: 'NO-MUR-250',
        col2: 'Standardsement Norcem 25kg',
        col3: 'BGO-02 (Bergen)',
        col4: '4.0',
        col5: 'Ton (40 Sekk)',
        mappedGlobalSku: 'GLB-MAT-CEM25',
      },
      {
        col1: 'NO-TRE-195',
        col2: 'Konstruksjonsvirke Gran C24',
        col3: 'OSL-01 (Oslo)',
        col4: '350',
        col5: 'Meter',
        mappedGlobalSku: 'GLB-MAT-TIM45',
      },
      {
        col1: 'NO-GLAV-95',
        col2: 'Glava Proff 34 95mm',
        col3: 'BGO-02 (Bergen)',
        col4: '100',
        col5: 'Rull',
        mappedGlobalSku: 'GLB-MAT-INS95',
      },
    ],
    rawSchemaCode: `<!-- NORWAY LEGACY POS XML SCHEMA: NO_POS_VARELAGER_XML -->
<xs:element name="LagerBeholdningMelding">
  <xs:complexType>
    <xs:sequence>
      <xs:element name="Avdeling" type="xs:string"/>      <!-- Branch: OSL-01, BGO-02 -->
      <xs:element name="VareKode" type="xs:string"/>      <!-- Local SKU: NO-MUR-250 -->
      <xs:element name="Beskrivelse" type="xs:string"/>   <!-- Norwegian description -->
      <xs:element name="FysiskAntall" type="xs:decimal"/> <!-- Store physical stock -->
      <xs:element name="Enhet" type="xs:string"/>         <!-- Ton, Plate, Meter, Rull -->
    </xs:sequence>
  </xs:complexType>
</xs:element>`,
    rawSamplePayload: `<LagerBeholdningMelding xmlns="http://bygg.no/pos/v2">
  <Avdeling>OSL-01</Avdeling>
  <VareLinje>
    <VareKode>NO-MUR-250</VareKode>
    <Beskrivelse>Standardsement Norcem 25kg</Beskrivelse>
    <FysiskAntall>3.0</FysiskAntall>
    <Enhet>Ton</Enhet>
  </VareLinje>
</LagerBeholdningMelding>`,
  },
};

export const ORDER_SCENARIOS: Record<CountryCode, OrderScenario> = {
  SE: {
    id: 'SCENARIO_SE_PLASTERBOARD',
    country: 'SE',
    badgeEn: 'Sweden Case Study · Split-Order Fulfillment',
    badgeVi: 'Tình huống Nghiên cứu Thụy Điển · Điều phối Tách đơn Liên chi nhánh',
    titleEn: 'Stockholm Gypsum Plasterboard Allocation — 120 Boards',
    titleVi: 'Điều phối Đơn hàng Tấm Thạch Cao tại Stockholm — 120 Tấm',
    contractorName: 'Skanska Sverige AB (Tier-1 Enterprise Contractor)',
    contractorTier: 'SLA Priority Gold · Scheduled 06:30 CET Delivery',
    primaryBranchId: 'STO-01',
    backupBranchId: 'UPP-02',
    deliverySiteEn: 'Slussen Metro Redevelopment Project, Central Stockholm',
    deliverySiteVi: 'Dự án Cải tạo Ga ngầm Slussen, Trung tâm Stockholm',
    requestedWindow: 'Tomorrow 06:30 CET',
    globalSku: 'GLB-MAT-PLB13',
    requestedBaseQty: 120,
    rawLocalQtyText: '120 St (Skiva)',
    rawOrderInput: `POST /legacy/se/b2b-order-intake HTTP/1.1
Host: se-adapter.onsite-nordics.internal
Content-Type: application/json; charset=ISO-8859-1

{
  "kund_id": "SE-ENTR-SKANSKA-01",
  "leverans_ort": "Slussen Entreprenad, 116 45 Stockholm",
  "onskad_leverans": "2026-10-24T06:30:00+01:00",
  "orderrader": [
    {
      "lokal_art_nr": "SE-GIPS-13",
      "beskrivning": "Gipsskiva Normal 13mm (1200x2400)",
      "bestalld_kvantitet": 120,
      "lokal_enhet": "St"
    }
  ]
}`,
    nlpExtractedEntity: {
      rawTerm: '"Gipsskiva Normal 13mm" · Code: SE-GIPS-13 · Qty: 120 St',
      detectedLanguage: 'Swedish (sv-SE)',
      localSkuMatched: 'SE-GIPS-13',
      globalSkuEncoded: 'GLB-MAT-PLB13',
      confidence: '99.4%',
      unitConversionNoteEn: '1 St (Skiva) = 1 Canonical Board → 120 Boards standardized',
      unitConversionNoteVi: '1 St (Skiva) = 1 Tấm tiêu chuẩn Global → Chuẩn hóa 120 Tấm',
    },
    routingMetrics: {
      primaryDistanceKm: 8,
      primaryLeadTime: '1h 15m',
      backupDistanceKm: 68,
      backupLeadTime: '2h 10m',
      co2SavedKg: 42.5,
      kpiCreditPolicyEn:
        '100% Dual Revenue & SLA KPI Attribution credited to both Stockholm (STO-01) and Uppsala (UPP-02) to incentivize collaborative cross-branch fulfillment.',
      kpiCreditPolicyVi:
        'Áp dụng cơ chế Đồng ghi nhận 100% Doanh thu & Chỉ số SLA cho cả Trung tâm Stockholm (STO-01) và Uppsala (UPP-02), thúc đẩy hợp tác điều phối tồn kho liên chi nhánh.',
    },
  },
  DK: {
    id: 'SCENARIO_DK_EMAIL_CEMENT',
    country: 'DK',
    badgeEn: 'Denmark Case Study · AI Document Parsing & Unit Normalization',
    badgeVi: 'Tình huống Nghiên cứu Đan Mạch · Xử lý Chứng từ Phi cấu trúc & Chuẩn hóa Đơn vị',
    titleEn: 'Copenhagen Unstructured B2B Requisition — 2 Pallets (80 Bags) Cement',
    titleVi: 'Xử lý Yêu cầu Đặt hàng B2B tại Copenhagen — 2 Pallet (80 Bao) Xi măng',
    contractorName: 'MT Højgaard Danmark A/S',
    contractorTier: 'SLA Platinum · Nordhavn Infrastructure Contract',
    primaryBranchId: 'CPH-01',
    backupBranchId: 'AAR-02',
    deliverySiteEn: 'Nordhavn Tunnel Portal Section B, 2150 København',
    deliverySiteVi: 'Hạng mục Cửa hầm Nordhavn Phân khu B, 2150 Copenhagen',
    requestedWindow: 'Tomorrow 07:00 CET',
    globalSku: 'GLB-MAT-CEM25',
    requestedBaseQty: 80,
    rawLocalQtyText: '2 Pall (80 Sæk)',
    rawOrderInput: `FROM: indkoeb@mthojgaard.dk
TO: ordre-kbh@bygma-legacy.dk
SUBJECT: HASTER: Bestilling til Nordhavn plads i morgen tidlig
ATTACHMENT: Rekvisition_Nordhavn_884.pdf

"Hej salgsdesk,
Vi mangler akut 2 Pall Grå Cement Aalborg 25kg (varenr DK-CEM-01, dvs. 80 Sæk i alt)
leveret direkte til Nordhavn Tunnel Portal B inden kl. 07:00 i morgen.
Mvh, Søren Lind — Pladsformand, MT Højgaard"`,
    nlpExtractedEntity: {
      rawTerm: '"2 Pall Grå Cement Aalborg 25kg (DK-CEM-01)"',
      detectedLanguage: 'Danish Free-Text Email & PDF (da-DK)',
      localSkuMatched: 'DK-CEM-01',
      globalSkuEncoded: 'GLB-MAT-CEM25',
      confidence: '98.8%',
      unitConversionNoteEn: '1 Pallet (Pall) = 40 Sæk → 2 Pall = 80 Canonical Bags (25kg)',
      unitConversionNoteVi: '1 Pallet (Pall) = 40 Bao → Quy đổi 2 Pall = 80 Bao tiêu chuẩn (25kg)',
    },
    routingMetrics: {
      primaryDistanceKm: 6,
      primaryLeadTime: '0h 55m',
      backupDistanceKm: 187,
      backupLeadTime: '3h 05m',
      co2SavedKg: 31.0,
      kpiCreditPolicyEn:
        '100% Dual Revenue & SLA KPI Attribution awarded to both Copenhagen (CPH-01) and Aarhus (AAR-02) for automated split fulfillment.',
      kpiCreditPolicyVi:
        'Đồng ghi nhận 100% Doanh thu & KPI SLA cho cả Trung tâm Copenhagen (CPH-01) và Kho Aarhus (AAR-02) khi thực hiện điều phối bổ sung liên vùng.',
    },
  },
  NO: {
    id: 'SCENARIO_NO_TON_CEMENT',
    country: 'NO',
    badgeEn: 'Norway Case Study · SOAP XML & Metric Ton Standardization',
    badgeVi: 'Tình huống Nghiên cứu Na Uy · Chuẩn hóa Giao thức POS XML & Đơn vị Khối lượng',
    titleEn: 'Oslo Infrastructure Dispatch — 3.5 Metric Tons (140 Bags) Cement',
    titleVi: 'Điều phối Vật tư Dự án Hạ tầng Oslo — 3.5 Tấn (140 Bao) Xi măng',
    contractorName: 'Veidekke Entreprenør AS (Norway)',
    contractorTier: 'SLA Gold · Fornebubanen Metro Transit Contract',
    primaryBranchId: 'OSL-01',
    backupBranchId: 'BGO-02',
    deliverySiteEn: 'Fornebubanen Station Shaft 3, Oslo West',
    deliverySiteVi: 'Hạng mục Giếng kỹ thuật số 3 Tuyến Metro Fornebubanen, Tây Oslo',
    requestedWindow: 'Today 15:30 CET (Priority Dispatch)',
    globalSku: 'GLB-MAT-CEM25',
    requestedBaseQty: 140,
    rawLocalQtyText: '3.5 Ton (140 Sekk)',
    rawOrderInput: `<?xml version="1.0" encoding="UTF-8"?>
<EntreprenorBestilling xmlns="http://lindbak.no/pos/order">
  <KundeNavn>Veidekke Entreprenør AS</KundeNavn>
  <LeveringsSted>Fornebubanen Sjakthall 3, Oslo</LeveringsSted>
  <PrimarAvdeling>OSL-01</PrimarAvdeling>
  <VareLinje>
    <VareKode>NO-MUR-250</VareKode>
    <Beskrivelse>Standardsement Norcem 25kg</Beskrivelse>
    <BestiltMengde>3.5</BestiltMengde>
    <MaaleEnhet>Ton</MaaleEnhet>
  </VareLinje>
</EntreprenorBestilling>`,
    nlpExtractedEntity: {
      rawTerm: '<VareKode>NO-MUR-250</VareKode> · <BestiltMengde>3.5</BestiltMengde> <MaaleEnhet>Ton</MaaleEnhet>',
      detectedLanguage: 'Norwegian POS XML (nb-NO)',
      localSkuMatched: 'NO-MUR-250',
      globalSkuEncoded: 'GLB-MAT-CEM25',
      confidence: '99.1%',
      unitConversionNoteEn: '1 Metric Ton = 40 × 25kg Bags → 3.5 Ton = 140 Canonical Bags',
      unitConversionNoteVi: '1 Tấn (Metric Ton) = 40 Bao 25kg → Quy đổi 3.5 Tấn = 140 Bao tiêu chuẩn',
    },
    routingMetrics: {
      primaryDistanceKm: 9,
      primaryLeadTime: '1h 10m',
      backupDistanceKm: 305,
      backupLeadTime: '4h 15m',
      co2SavedKg: 58.2,
      kpiCreditPolicyEn:
        '100% Dual Revenue & SLA KPI Attribution shared between Oslo Terminal (OSL-01) and Bergen Regional Branch (BGO-02).',
      kpiCreditPolicyVi:
        'Đồng ghi nhận 100% Doanh thu & Chỉ số SLA cho cả Trạm Oslo (OSL-01) và Chi nhánh Bergen (BGO-02).',
    },
  },
};

export const GLOBAL_SCHEMA_DDL = `-- GLOBAL UNIFIED HUB — CANONICAL POSTGRESQL LEDGER
CREATE TABLE global_hub.canonical_inventory_ledger (
  global_sku           VARCHAR(20) PRIMARY KEY, -- 'GLB-MAT-PLB13', 'GLB-MAT-CEM25'
  canonical_name_en    VARCHAR(120) NOT NULL,
  base_uom             VARCHAR(24) NOT NULL,    -- 'BOARD', 'BAG_25KG', 'METER', 'ROLL'
  se_local_sku         VARCHAR(20) NOT NULL,    -- Harmonized from Sweden Adapter
  dk_local_sku         VARCHAR(20) NOT NULL,    -- Harmonized from Denmark Adapter
  no_local_sku         VARCHAR(20) NOT NULL,    -- Harmonized from Norway Adapter
  physical_stock_total INTEGER NOT NULL,
  safety_buffer_total  INTEGER NOT NULL,
  soft_reserved_total  INTEGER NOT NULL,
  global_atp_available INTEGER NOT NULL,        -- Guaranteed Available-to-Promise
  last_synced_utc      TIMESTAMPTZ NOT NULL
);`;
