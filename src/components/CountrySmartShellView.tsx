import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Cpu,
  Play,
  SkipForward,
  RotateCcw,
  Lock,
  Calculator,
  Wifi,
  WifiOff,
  Send,
  Sparkles,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  AIOrchestrationReport,
  BranchStock,
  CountryCode,
  COUNTRY_PROFILES,
  GlobalMaterial,
  Language,
  ORDER_SCENARIOS,
  OrderScenario,
  WorkspaceView,
} from '../data/onsiteData';

interface CountrySmartShellViewProps {
  lang: Language;
  country: CountryCode;
  onSelectView: (view: WorkspaceView) => void;
  materials: GlobalMaterial[];
  branchStocks: BranchStock[];
  countryBufferPct: Record<CountryCode, number>;
  onChangeCountryBufferPct: (country: CountryCode, pct: number) => void;
  offlineNodes: Record<CountryCode, boolean>;
  onToggleOfflineNode: (country: CountryCode) => void;
  onUpdatePhysicalStock: (stockId: string, newPhysical: number, reason: string) => void;
  onUpdateSoftReserved: (stockId: string, newReserved: number) => void;
  onResetStocks: () => void;
  customRequestedQty: number;
  onChangeCustomRequestedQty: (qty: number) => void;
  activeStep: number;
  onSetActiveStep: (step: number) => void;
  isRunningRealAI: boolean;
  onRunRealAI: (customRawOrderText?: string) => void;
  aiThinkingMs: number;
  stepThinkingTimes: Record<number, number>;
  aiReport: AIOrchestrationReport | null;
  aiError: string | null;
  onCommitOrderSoftLock: (
    scenario: OrderScenario,
    requestedQty: number,
    primaryAllocated: number,
    backupAllocated: number
  ) => void;
  committedOrders: Record<string, boolean>;
  onManualSyncShellToGlobal: (country: CountryCode) => void;
}

export const CountrySmartShellView: React.FC<CountrySmartShellViewProps> = ({
  lang,
  country,
  onSelectView,
  materials,
  branchStocks,
  countryBufferPct,
  onChangeCountryBufferPct,
  offlineNodes,
  onToggleOfflineNode,
  onUpdatePhysicalStock,
  onUpdateSoftReserved,
  onResetStocks,
  customRequestedQty,
  onChangeCustomRequestedQty,
  activeStep,
  onSetActiveStep,
  isRunningRealAI,
  onRunRealAI,
  aiThinkingMs,
  stepThinkingTimes,
  aiReport,
  aiError,
  onCommitOrderSoftLock,
  committedOrders,
  onManualSyncShellToGlobal,
}) => {
  const [schemaTab, setSchemaTab] = useState<'visual' | 'ddl'>('visual');

  const profile = COUNTRY_PROFILES[country];
  const activeScenario = ORDER_SCENARIOS[country];
  const [editableOrderText, setEditableOrderText] = useState<string>(
    activeScenario.rawOrderInput
  );

  useEffect(() => {
    setEditableOrderText(ORDER_SCENARIOS[country].rawOrderInput);
  }, [country]);

  const countryStocks = branchStocks.filter((s) => s.country === country);

  const getMaterial = (globalSku: string) =>
    materials.find((m) => m.globalSku === globalSku) || materials[0];

  const calcStockMetrics = (stock: BranchStock) => {
    const isOffline = offlineNodes[stock.country];
    const rawPct = countryBufferPct[stock.country];
    const effectivePct = isOffline ? Math.max(15, rawPct) : rawPct;
    const safetyBuffer = Math.ceil((stock.physicalStock * effectivePct) / 100);
    const atp = Math.max(0, stock.physicalStock - safetyBuffer - stock.softReserved);
    return {
      isOffline,
      bufferPct: effectivePct,
      safetyBuffer,
      atp,
    };
  };

  const primaryStockObj = countryStocks.find(
    (s) =>
      s.branchId === activeScenario.primaryBranchId &&
      s.globalSku === activeScenario.globalSku
  );
  const backupStockObj = countryStocks.find(
    (s) =>
      s.branchId === activeScenario.backupBranchId &&
      s.globalSku === activeScenario.globalSku
  );

  const primaryMetrics = primaryStockObj
    ? calcStockMetrics(primaryStockObj)
    : { isOffline: false, bufferPct: 10, safetyBuffer: 0, atp: 0 };
  const backupMetrics = backupStockObj
    ? calcStockMetrics(backupStockObj)
    : { isOffline: false, bufferPct: 10, safetyBuffer: 0, atp: 0 };

  const isPrimaryOffline = offlineNodes[country];
  const effectivePrimaryATP = isPrimaryOffline ? 0 : primaryMetrics.atp;
  const requestedQty = customRequestedQty;

  const primaryAllocated = Math.min(requestedQty, effectivePrimaryATP);
  const shortageQty = Math.max(0, requestedQty - primaryAllocated);
  const backupAllocated = Math.min(shortageQty, backupMetrics.atp);
  const unfulfilledQty = Math.max(0, shortageQty - backupAllocated);

  const activeMat = getMaterial(activeScenario.globalSku);
  const activeLocalMap = activeMat.mappings[country];
  const rawLocalUnitsNeeded = Number(
    (requestedQty / activeLocalMap.multiplierToBase).toFixed(2)
  );

  const totalThinkingMs = aiReport
    ? aiReport.serverLatencyMs
    : Object.values(stepThinkingTimes).reduce((a, b) => a + b, 0);
  const isAlreadyCommitted = Boolean(committedOrders[activeScenario.id]);

  const stepsMeta = [
    {
      num: 1,
      titleEn: '1. Order Intake',
      titleVi: '1. Tiếp nhận đơn',
      ms: stepThinkingTimes[1] || 110,
      aiNote: aiReport?.stepByStepInsights.step1,
    },
    {
      num: 2,
      titleEn: '2. NLP & Unit Math',
      titleVi: '2. Chuẩn hóa đơn vị',
      ms: stepThinkingTimes[2] || 220,
      aiNote: aiReport?.stepByStepInsights.step2,
    },
    {
      num: 3,
      titleEn: '3. ATP & Buffer',
      titleVi: '3. Kiểm tra ATP',
      ms: stepThinkingTimes[3] || 120,
      aiNote: aiReport?.stepByStepInsights.step3,
    },
    {
      num: 4,
      titleEn: '4. Split Route',
      titleVi: '4. Định tuyến tách đơn',
      ms: stepThinkingTimes[4] || 260,
      aiNote: aiReport?.stepByStepInsights.step4,
    },
    {
      num: 5,
      titleEn: '5. AI Report & Sync',
      titleVi: '5. Báo cáo AI & Đồng bộ',
      ms: stepThinkingTimes[5] || 140,
      aiNote: aiReport?.stepByStepInsights.step5,
    },
  ];

  const canonicalGlobalJson = JSON.stringify(
    {
      event_id: `EVT-${country}-ADAPTER-2026-${primaryStockObj?.physicalStock ?? 0}`,
      source_adapter: `${country}_SMART_SHELL_ADAPTER_V2.4`,
      destination_hub: 'GLOBAL_UNIFIED_HUB',
      ai_engine_model: aiReport?.modelUsed || 'gemini-3.8-flash',
      inference_and_sync_latency_ms: totalThinkingMs,
      circuit_breaker_status: isPrimaryOffline
        ? 'OPEN_FAILOVER_REPLICA'
        : 'CLOSED_NOMINAL',
      contractor_requisition: {
        contractor: activeScenario.contractorName,
        market: country,
        delivery_site:
          lang === 'en'
            ? activeScenario.deliverySiteEn
            : activeScenario.deliverySiteVi,
      },
      harmonized_line_item: {
        global_sku: activeScenario.globalSku,
        native_local_sku: activeScenario.nlpExtractedEntity.localSkuMatched,
        uom_conversion_applied: activeLocalMap.conversionRule,
        standardized_requested_qty: requestedQty,
      },
      allocation_and_buffer_math: {
        safety_buffer_policy_pct: `${primaryMetrics.bufferPct}%`,
        primary_branch: {
          branch_id: activeScenario.primaryBranchId,
          physical_balance: primaryStockObj?.physicalStock ?? 0,
          safety_buffer_deduction: primaryMetrics.safetyBuffer,
          soft_reserved_balance: primaryStockObj?.softReserved ?? 0,
          net_available_atp: effectivePrimaryATP,
          allocated_units: primaryAllocated,
        },
        secondary_fulfillment_branch: {
          branch_id: activeScenario.backupBranchId,
          net_available_atp: backupMetrics.atp,
          split_allocated_units: backupAllocated,
        },
        kpi_governance: '100_PCT_DUAL_BRANCH_ATTRIBUTION',
      },
    },
    null,
    2
  );

  return (
    <div className="space-y-8">
      {/* SECTION 1: VISUAL 4-GATE SMART SHELL ARCHITECTURE PIPELINE FOR SELECTED COUNTRY */}
      <section className="surface-elevated border-2 border-[#13342D]/15 rounded-3xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#13342D]/15 pb-4 mb-5">
          <div className="flex items-start gap-3.5">
            <button
              type="button"
              onClick={() => onSelectView('GLOBAL')}
              className="px-3.5 py-2.5 rounded-xl bg-[#0F2923] hover:bg-[#13342D] text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>
                {lang === 'en'
                  ? 'Global Analytics Hub'
                  : 'Về Bảng Phân Tích Tổng Global'}
              </span>
            </button>

            <div>
              <div className="text-xs font-mono-tabular font-extrabold uppercase text-[#13342D]">
                {lang === 'en' ? profile.adapterTitleEn : profile.adapterTitleVi}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F2923] flex items-center gap-2">
                <span>{profile.flag}</span>
                <span>
                  {lang === 'en'
                    ? `${profile.countryNameEn} — Visual Smart Shell Architecture`
                    : `${profile.countryNameVi} — Mô Hình Hoạt Động Khi Bổ Sung Tầng Tích Hợp`}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            <button
              type="button"
              onClick={() => onToggleOfflineNode(country)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 border-2 ${
                isPrimaryOffline
                  ? 'bg-[#E05A47] text-white border-[#E05A47]'
                  : 'bg-[#F4F7F5] text-[#0F2923] border-[#13342D]/25 hover:bg-[#CFE3DC]'
              }`}
            >
              {isPrimaryOffline ? (
                <WifiOff className="w-4 h-4" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
              <span>
                {isPrimaryOffline
                  ? lang === 'en'
                    ? 'Circuit Breaker: Failover Active'
                    : 'Đang Chạy Dự Phòng (Circuit Breaker)'
                  : lang === 'en'
                  ? 'Simulate Connection Interruption'
                  : 'Mô Phỏng Gián Đoạn Kết Nối'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onManualSyncShellToGlobal(country)}
              className="px-3.5 py-2 rounded-xl bg-[#CFE3DC] hover:bg-[#8EB9AC] text-[#0F2923] border-2 border-[#13342D]/20 text-xs font-extrabold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {lang === 'en'
                  ? `Push ${country} Stream → Global`
                  : `Đồng Bộ Tầng ${country} → Global`}
              </span>
            </button>
          </div>
        </div>

        {/* VISUAL INTERACTIVE SCHEMATIC OF HOW THIS COUNTRY'S SMART SHELL WRAPS THE LEGACY DB */}
        <div className="bg-[#0F2923] surface-dark-blueprint blueprint-grid rounded-2xl p-5 mb-5 text-white border-2 border-[#13342D]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-xs font-mono-tabular text-[#CFE3DC] font-extrabold uppercase tracking-wide">
              {lang === 'en'
                ? `LIVE ${country} SMART SHELL TRANSFORMATION PIPELINE (NON-INVASIVE WRAPPER)`
                : `SƠ ĐỒ TRỰC QUAN CƠ CHẾ BỌC & CHUẨN HÓA DỮ LIỆU TẠI TẦNG TÍCH HỢP ${country}`}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#CFE3DC] text-[#0F2923] font-mono-tabular text-[11px] font-extrabold">
              ZERO LEGACY DB MODIFICATION
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-11 gap-3 items-center">
            {/* STAGE 1: NATIVE LEGACY DB CORE */}
            <div className="lg:col-span-3 bg-[#071713] border-2 border-dashed border-[#E05A47] rounded-2xl p-4">
              <div className="flex items-center justify-between text-[11px] font-mono-tabular font-extrabold mb-2">
                <span className="px-2 py-0.5 rounded bg-[#E05A47] text-white">
                  1. LEGACY CORE
                </span>
                <span className="px-2 py-0.5 rounded bg-white/15 text-white">
                  0 CODE EDITS
                </span>
              </div>
              <div className="text-sm font-extrabold text-white mb-1">
                {profile.legacySystemName}
              </div>
              <div className="text-xs text-[#CFE3DC] font-medium mb-2.5">
                {lang === 'en' ? profile.challengeEn : profile.challengeVi}
              </div>
              <div className="bg-[#0F2923] border border-white/15 rounded-lg p-2.5 font-mono-tabular text-[11px] text-white space-y-1">
                {profile.rawRecords.slice(0, 2).map((r, i) => (
                  <div key={i} className="truncate font-semibold">
                    • <span className="text-[#CFE3DC]">{r.col1}</span> ({r.col4} {r.col5})
                  </div>
                ))}
              </div>
            </div>

            {/* ANIMATED ARROW 1 */}
            <div className="hidden lg:flex lg:col-span-1 justify-center">
              <svg className="w-16 h-10" viewBox="0 0 64 40">
                <path
                  d="M 4 20 L 58 20"
                  stroke="#E05A47"
                  strokeWidth="3"
                  className="animate-packet-flow"
                />
                <polygon points="52,14 62,20 52,26" fill="#E05A47" />
              </svg>
            </div>

            {/* STAGE 2: THE 4 GATES OF THE COUNTRY SMART SHELL ADAPTER */}
            <div className="lg:col-span-4 bg-[#0B221C] border-2 border-[#CFE3DC] rounded-2xl p-4 shadow-[0_0_25px_rgba(142,185,172,0.25)]">
              <div className="flex items-center justify-between text-xs font-mono-tabular text-white font-extrabold mb-2.5">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-[#CFE3DC]" />
                  2. {country} SMART SHELL ADAPTER
                </span>
                <span className="bg-[#CFE3DC] text-[#0F2923] px-2 py-0.5 rounded text-[10px] font-extrabold">
                  4 Active Gates
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono-tabular">
                <div className="bg-[#071713] p-2.5 rounded-xl border border-[#8EB9AC]/40">
                  <div className="text-[10px] text-[#CFE3DC] font-bold">
                    GATE 01 · PROTOCOL
                  </div>
                  <div className="font-extrabold text-white mt-0.5">
                    {profile.encoding}
                  </div>
                </div>
                <div className="bg-[#071713] p-2.5 rounded-xl border border-[#8EB9AC]/40">
                  <div className="text-[10px] text-[#CFE3DC] font-bold">
                    GATE 02 · UOM MATH
                  </div>
                  <div className="font-extrabold text-white mt-0.5">
                    {activeLocalMap.conversionRule}
                  </div>
                </div>
                <div className="bg-[#071713] p-2.5 rounded-xl border border-[#8EB9AC]/40">
                  <div className="text-[10px] text-[#CFE3DC] font-bold">
                    GATE 03 · BUFFER
                  </div>
                  <div className="font-extrabold text-white mt-0.5">
                    −{primaryMetrics.bufferPct}% Safety Shield
                  </div>
                </div>
                <div className="bg-[#071713] p-2.5 rounded-xl border border-[#8EB9AC]/40">
                  <div className="text-[10px] text-[#CFE3DC] font-bold">
                    GATE 04 · ROUTING
                  </div>
                  <div className="font-extrabold text-white mt-0.5">
                    Auto-Split & 100% KPI
                  </div>
                </div>
              </div>
            </div>

            {/* ANIMATED ARROW 2 */}
            <div className="hidden lg:flex lg:col-span-1 justify-center">
              <svg className="w-16 h-10" viewBox="0 0 64 40">
                <path
                  d="M 4 20 L 58 20"
                  stroke="#CFE3DC"
                  strokeWidth="3"
                  className="animate-packet-flow"
                />
                <polygon points="52,14 62,20 52,26" fill="#CFE3DC" />
              </svg>
            </div>

            {/* STAGE 3: CANONICAL GLOBAL OUTPUT */}
            <div className="lg:col-span-2 bg-[#CFE3DC] text-[#0F2923] border-2 border-white rounded-2xl p-4 font-mono-tabular">
              <div className="text-[10px] font-extrabold uppercase text-[#0F2923] mb-1">
                3. GLOBAL HUB STREAM
              </div>
              <div className="text-sm font-extrabold text-[#0F2923] mb-1">
                {activeScenario.globalSku}
              </div>
              <div className="text-xs font-extrabold text-[#0F2923] mb-2">
                ATP: {effectivePrimaryATP + backupMetrics.atp} Units
              </div>
              <div className="text-[11px] bg-[#0F2923] text-white px-2 py-1 rounded text-center font-extrabold">
                Synced &lt; 500ms
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Tabs for Schema Details */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-extrabold text-[#0F2923]">
            {lang === 'en'
              ? 'Inspect Local Records vs. Standardized Global Identifiers:'
              : 'Đối chiếu Bản ghi Hệ thống Gốc và Mã Chuẩn Hóa Toàn Cầu:'}
          </span>
          <div className="flex items-center gap-1.5 p-1 bg-[#E6EFEA] rounded-xl border border-[#13342D]/20">
            <button
              type="button"
              onClick={() => setSchemaTab('visual')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-colors ${
                schemaTab === 'visual'
                  ? 'bg-[#0F2923] text-white'
                  : 'text-[#0F2923] hover:bg-white/60'
              }`}
            >
              {lang === 'en' ? 'Visual Mapping Cards' : 'Thẻ Ánh Xạ Trực Quan'}
            </button>
            <button
              type="button"
              onClick={() => setSchemaTab('ddl')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-colors ${
                schemaTab === 'ddl'
                  ? 'bg-[#0F2923] text-white'
                  : 'text-[#0F2923] hover:bg-white/60'
              }`}
            >
              {lang === 'en' ? 'Legacy SQL / XML' : 'Cấu Trúc SQL / XML Gốc'}
            </button>
          </div>
        </div>

        {schemaTab === 'visual' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {profile.rawRecords.map((row, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white border-2 border-[#13342D]/15 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono-tabular mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-[#E05A47] text-white font-extrabold">
                      {row.col1}
                    </span>
                    <span className="text-[#0F2923] font-extrabold">
                      {row.col3.split(' ')[0]}
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-[#0F2923] mb-2">
                    {row.col2}
                  </div>
                </div>
                <div className="pt-2 border-t border-[#13342D]/15 flex items-center justify-between font-mono-tabular text-xs">
                  <span className="text-[#0F2923] font-bold">
                    {row.col4} {row.col5.split(' ')[0]}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#0F2923] text-[#CFE3DC] font-extrabold text-[11px]">
                    → {row.mappedGlobalSku}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <pre className="bg-[#0A1E19] text-[#FFFFFF] border-2 border-[#13342D] p-4 rounded-2xl text-xs font-mono-tabular overflow-x-auto leading-relaxed">
            {profile.rawSchemaCode}
          </pre>
        )}
      </section>

      {/* SECTION 2: VISUAL SILO INVENTORY CALCULATOR + REAL GEMINI AI ORCHESTRATION ENGINE */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* LEFT 6 COLS: VISUAL WAREHOUSE SILO GAUGES & BUFFER CONTROLS */}
        <div className="xl:col-span-6 surface-elevated border-2 border-[#13342D]/15 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#13342D]/15 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#0F2923]">
                  {lang === 'en'
                    ? `${country} Smart Shell — Live Warehouse Silo Simulators`
                    : `Mô Phỏng Tháp Tồn Kho & Định Mức Dự Phòng Tại ${country}`}
                </h3>
                <p className="text-xs font-semibold text-[#13342D]">
                  {lang === 'en'
                    ? 'Stock balances update dynamically from live ERP/POS events or manual sliders'
                    : 'Số dư tồn kho tự động biến động theo luồng ERP/POS thực tế hoặc kéo thanh trượt'}
                </p>
              </div>

              <button
                type="button"
                onClick={onResetStocks}
                className="px-3 py-1.5 rounded-xl bg-[#E6EFEA] hover:bg-[#CFE3DC] text-[#0F2923] text-xs font-extrabold flex items-center gap-1.5 border border-[#13342D]/20 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Reset' : 'Khôi phục'}</span>
              </button>
            </div>

            {/* Country Safety Buffer Slider */}
            <div className="bg-[#0F2923] text-white rounded-2xl p-4 mb-5 border-2 border-[#13342D]">
              <div className="flex items-center justify-between text-xs font-extrabold mb-2">
                <span className="flex items-center gap-2 text-white">
                  <Calculator className="w-4 h-4 text-[#CFE3DC]" />
                  {lang === 'en'
                    ? `${country} Smart Shell Safety Stock Buffer Ratio:`
                    : `Định mức Dự phòng An toàn (Safety Stock Buffer %) tại ${country}:`}
                </span>
                <span className="font-mono-tabular text-base font-extrabold bg-[#CFE3DC] text-[#0F2923] px-3 py-0.5 rounded-lg">
                  {countryBufferPct[country]}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={25}
                step={5}
                value={countryBufferPct[country]}
                onChange={(e) =>
                  onChangeCountryBufferPct(country, Number(e.target.value))
                }
                aria-label={`Safety stock buffer ratio for ${country}`}
                className="w-full onsite-slider"
              />
              <div className="flex justify-between text-[11px] font-mono-tabular text-[#CFE3DC] font-bold mt-1.5">
                <span>0% (No Shield)</span>
                <span>10% (Standard Shield)</span>
                <span>25% (Max Shield)</span>
              </div>
            </div>

            {/* Visual Warehouse Silo Cards for Each Branch Item */}
            <div className="space-y-3.5">
              {countryStocks.map((stock) => {
                const mat = getMaterial(stock.globalSku);
                const localMap = mat.mappings[stock.country];
                const { safetyBuffer, atp } = calcStockMetrics(stock);

                const isPrimary =
                  stock.branchId === activeScenario.primaryBranchId &&
                  stock.globalSku === activeScenario.globalSku;
                const isShortage = isPrimary && atp < requestedQty;

                const totalPhys = Math.max(1, stock.physicalStock);
                const atpWidth = Math.round((atp / totalPhys) * 100);
                const bufWidth = Math.round((safetyBuffer / totalPhys) * 100);
                const resWidth = Math.max(0, 100 - atpWidth - bufWidth);

                return (
                  <div
                    key={stock.id}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      isPrimary
                        ? 'bg-[#E6EFEA] border-[#0F2923]'
                        : 'bg-white border-[#13342D]/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#0F2923]">
                            {stock.branchId}
                          </span>
                          <span className="font-mono-tabular text-xs px-2 py-0.5 rounded bg-[#0F2923] text-white font-extrabold">
                            {localMap.localSku} → {stock.globalSku}
                          </span>
                          <span className="font-mono-tabular text-[10px] px-2 py-0.5 rounded bg-[#CFE3DC] text-[#0F2923] font-bold">
                            {stock.lastPolledAgo}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#13342D] mt-0.5">
                          {lang === 'en' ? mat.nameEn : mat.nameVi} ({localMap.conversionRule})
                        </div>
                      </div>

                      <div className="text-right font-mono-tabular">
                        <span
                          className={`text-xl font-extrabold ${
                            isShortage ? 'text-[#E05A47]' : 'text-[#0F2923]'
                          }`}
                        >
                          {atp} ATP
                        </span>
                        <span className="text-xs text-[#0F2923] font-bold block">
                          / {stock.physicalStock} Physical
                        </span>
                      </div>
                    </div>

                    {/* VISUAL STACKED SILO BAR */}
                    <div className="w-full h-6 bg-white rounded-xl overflow-hidden flex border-2 border-[#13342D]/25 shadow-inner mb-2.5">
                      <div
                        className="bg-[#0F2923] h-full flex items-center justify-center text-[11px] font-mono-tabular font-extrabold text-white transition-all duration-300"
                        style={{ width: `${atpWidth}%` }}
                      >
                        {atpWidth > 18 ? `ATP ${atp}` : ''}
                      </div>
                      <div
                        className="bg-buffer-stripes h-full flex items-center justify-center text-[11px] font-mono-tabular font-extrabold text-[#0F2923] transition-all duration-300"
                        style={{ width: `${bufWidth}%` }}
                      >
                        {bufWidth > 12 ? `-${safetyBuffer}` : ''}
                      </div>
                      <div
                        className="bg-[#E05A47] h-full flex items-center justify-center text-[11px] font-mono-tabular font-extrabold text-white transition-all duration-300"
                        style={{ width: `${resWidth}%` }}
                      >
                        {resWidth > 10 ? `-${stock.softReserved}` : ''}
                      </div>
                    </div>

                    {/* Interactive Slider & Quick Stepper Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex-1 min-w-[160px]">
                        <input
                          type="range"
                          min={0}
                          max={600}
                          step={5}
                          value={stock.physicalStock}
                          onChange={(e) =>
                            onUpdatePhysicalStock(
                              stock.id,
                              Number(e.target.value),
                              `Physical Stock Slider Adjusted at ${stock.branchId}`
                            )
                          }
                          aria-label={`Physical balance slider for ${stock.branchId}`}
                          className="w-full onsite-slider"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 font-mono-tabular text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdatePhysicalStock(
                              stock.id,
                              Math.max(0, stock.physicalStock - 10),
                              `POS Dispatch (-10) at ${stock.branchId}`
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-[#E05A47] hover:bg-[#c94a38] text-white font-extrabold transition-colors"
                        >
                          POS −10
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdatePhysicalStock(
                              stock.id,
                              stock.physicalStock + 10,
                              `Replenishment (+10) at ${stock.branchId}`
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#0F2923] hover:text-white text-[#0F2923] border-2 border-[#13342D]/25 font-extrabold transition-colors"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSoftReserved(
                              stock.id,
                              stock.softReserved + 5
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-white hover:bg-[#CFE3DC] text-[#0F2923] border-2 border-[#13342D]/25 font-extrabold transition-colors"
                        >
                          Lock +5
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT 6 COLS: REAL GEMINI AI 5-STEP ORCHESTRATION & SPLIT-ORDER ROUTE */}
        <div className="xl:col-span-6 surface-elevated border-2 border-[#13342D]/15 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#13342D]/15 pb-4 mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#CFE3DC] text-[#0F2923] text-[11px] font-mono-tabular font-extrabold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#0F2923]" />
                  <span>GEMINI 3.1 FLASH LITE · REAL-TIME AI ENGINE</span>
                </div>
                <h3 className="text-lg font-extrabold text-[#0F2923]">
                  {lang === 'en'
                    ? 'Real Gemini AI 5-Step Orchestration & Report'
                    : 'Điều Phối Đơn Hàng Bằng AI Thực Tế & Xuất Báo Cáo'}
                </h3>
                <p className="text-xs font-semibold text-[#13342D]">
                  {lang === 'en'
                    ? activeScenario.titleEn
                    : activeScenario.titleVi}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start">
                <button
                  type="button"
                  onClick={() => onRunRealAI(editableOrderText)}
                  disabled={isRunningRealAI}
                  className="px-4 py-2.5 rounded-xl bg-[#0F2923] hover:bg-[#13342D] disabled:opacity-60 text-white text-xs font-extrabold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-md cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {isRunningRealAI
                      ? lang === 'en'
                        ? `Gemini Thinking (${aiThinkingMs} ms)...`
                        : `AI Đang Xử Lý (${aiThinkingMs} ms)...`
                      : lang === 'en'
                      ? 'Run Real AI & Generate Report'
                      : 'Chạy AI Thực Tế & Xuất Báo Cáo'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetActiveStep(activeStep < 5 ? activeStep + 1 : 1)}
                  disabled={isRunningRealAI}
                  className="px-3 py-2.5 rounded-xl bg-[#CFE3DC] hover:bg-[#8EB9AC] text-[#0F2923] border border-[#13342D]/20 text-xs font-extrabold transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Step' : 'Xem Bước'}</span>
                </button>
              </div>
            </div>

            {/* Order Quantity Parameter Slider + Radial AI Inference Stopwatch */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-5">
              <div className="md:col-span-7 bg-[#E6EFEA] border-2 border-[#13342D]/20 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#0F2923] mb-1.5">
                  <span>
                    {lang === 'en'
                      ? 'Contractor Order Demand (Drag to Test Split):'
                      : 'Sản Lượng Đặt Hàng B2B (Kéo Để Thử Tách Đơn):'}
                  </span>
                  <span className="font-mono-tabular text-sm bg-[#0F2923] text-white px-2.5 py-0.5 rounded-lg font-extrabold">
                    {requestedQty} {lang === 'en' ? activeMat.baseUnitEn : activeMat.baseUnitVi}
                  </span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={220}
                  step={10}
                  value={requestedQty}
                  onChange={(e) => onChangeCustomRequestedQty(Number(e.target.value))}
                  aria-label="Order demand quantity parameter"
                  className="w-full onsite-slider"
                />
                <div className="flex justify-between text-[11px] font-mono-tabular text-[#0F2923] font-bold mt-1">
                  <span>30 Units</span>
                  <span>{activeScenario.requestedBaseQty} (Case Study)</span>
                  <span>220 Units</span>
                </div>
              </div>

              <div className="md:col-span-5 bg-[#0F2923] surface-dark-blueprint text-white rounded-2xl p-4 flex items-center justify-between gap-3 border-2 border-[#13342D]">
                <div>
                  <div className="text-[11px] font-mono-tabular text-[#CFE3DC] uppercase font-extrabold">
                    {lang === 'en' ? 'Real Gemini Latency' : 'Thời Gian Phản Hồi AI'}
                  </div>
                  <div className="font-mono-tabular text-2xl font-extrabold text-white">
                    {isRunningRealAI ? aiThinkingMs : totalThinkingMs} ms
                  </div>
                  <div className="text-[11px] font-mono-tabular text-[#CFE3DC] font-bold">
                    {aiReport
                      ? `✓ ${aiReport.modelUsed} (${aiReport.generatedAt})`
                      : lang === 'en'
                      ? 'Click Run AI to execute'
                      : 'Nhấn Chạy AI để phân tích'}
                  </div>
                </div>

                {/* Radial Stopwatch Gauge */}
                <div className="w-14 h-14 relative flex items-center justify-center shrink-0">
                  <svg className="w-full h-full" viewBox="0 0 56 56">
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="5"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      fill="none"
                      stroke="#CFE3DC"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={`${(activeStep / 5) * 138} 138`}
                      transform="rotate(-90 28 28)"
                    />
                  </svg>
                  <span className="absolute font-mono-tabular text-xs font-extrabold text-white">
                    {activeStep}/5
                  </span>
                </div>
              </div>
            </div>

            {/* CONNECTED 5-NODE VISUAL FLOWCHART */}
            <div className="relative mb-5">
              <div className="hidden sm:block absolute top-6 left-8 right-8 h-1.5 bg-[#CFE3DC] z-0">
                <div
                  className="h-full bg-[#0F2923] transition-all duration-300"
                  style={{ width: `${((activeStep - 1) / 4) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-5 gap-1.5 relative z-10">
                {stepsMeta.map((step) => {
                  const isCurrent = activeStep === step.num;
                  const isDone = activeStep > step.num || Boolean(aiReport);
                  return (
                    <button
                      key={step.num}
                      type="button"
                      onClick={() => onSetActiveStep(step.num)}
                      className="flex flex-col items-center text-center group"
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-mono-tabular text-xs font-extrabold border-2 transition-all mb-1.5 ${
                          isCurrent
                            ? 'bg-[#0F2923] text-white border-[#0F2923] shadow-lg scale-110'
                            : isDone
                            ? 'bg-[#CFE3DC] text-[#0F2923] border-[#0F2923]'
                            : 'bg-white text-[#0F2923] border-[#13342D]/35 group-hover:border-[#0F2923]'
                        }`}
                      >
                        <span>0{step.num}</span>
                      </div>
                      <div className="text-[11px] font-extrabold text-[#0F2923] leading-tight">
                        {lang === 'en' ? step.titleEn : step.titleVi}
                      </div>
                      <div className="text-[10px] font-mono-tabular font-bold text-[#13342D]">
                        {step.ms}ms
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* VISUAL INTERACTIVE CANVAS FOR CURRENT STEP */}
            <div className="bg-[#E6EFEA] border-2 border-[#13342D]/20 rounded-2xl p-5 min-h-[260px] flex flex-col justify-between">
              {activeStep === 1 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-extrabold text-[#0F2923]">
                      {lang === 'en'
                        ? `STEP 1: B2B Contractor Order Input (Editable for Live AI)`
                        : `BƯỚC 1: Tiếp Nhận Đơn Đặt Hàng B2B (Có Thể Chỉnh Sửa Để AI Phân Tích)`}
                    </div>
                  </div>
                  <textarea
                    value={editableOrderText}
                    onChange={(e) => setEditableOrderText(e.target.value)}
                    rows={5}
                    className="w-full bg-[#0A1E19] text-[#FFFFFF] border-2 border-[#13342D] p-3.5 rounded-xl text-xs font-mono-tabular leading-relaxed focus:outline-none focus:border-[#CFE3DC]"
                  />
                  {aiReport?.stepByStepInsights.step1 && (
                    <div className="mt-2.5 p-3 rounded-xl bg-white border border-[#13342D]/20 text-xs font-semibold text-[#0F2923]">
                      <strong className="font-extrabold">🤖 AI Step 1 Analysis: </strong>
                      {aiReport.stepByStepInsights.step1}
                    </div>
                  )}
                </div>
              )}

              {activeStep === 2 && (
                <div>
                  <div className="text-sm font-extrabold text-[#0F2923] mb-3">
                    {lang === 'en'
                      ? `STEP 2: Visual NLP & Unit Conversion Pipeline (${stepThinkingTimes[2]} ms)`
                      : `BƯỚC 2: Sơ Đồ Quy Đổi Đơn Vị & Chuẩn Hóa Mã SKU (${stepThinkingTimes[2]} ms)`}
                  </div>

                  {/* Visual Transformation Flow Diagram */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center bg-white p-4 rounded-2xl border-2 border-[#13342D]/15 font-mono-tabular text-center">
                    <div className="p-3 rounded-xl bg-[#FFF5F3] border-2 border-[#E05A47]">
                      <div className="inline-block px-2 py-0.5 rounded bg-[#E05A47] text-white text-[10px] font-extrabold">
                        LOCAL INPUT ({country})
                      </div>
                      <div className="text-base font-extrabold text-[#0F2923] mt-1.5">
                        {activeScenario.nlpExtractedEntity.localSkuMatched}
                      </div>
                      <div className="text-xs font-bold text-[#0F2923]">
                        {rawLocalUnitsNeeded} {activeLocalMap.localUnit}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0F2923] text-white border-2 border-[#0F2923]">
                      <div className="text-[10px] text-[#CFE3DC] font-extrabold">
                        MULTIPLIER RULE
                      </div>
                      <div className="text-lg font-extrabold text-white my-0.5">
                        × {activeLocalMap.multiplierToBase}
                      </div>
                      <div className="text-[11px] text-[#CFE3DC] font-bold">
                        AI Conf: {aiReport?.confidenceScore || activeScenario.nlpExtractedEntity.confidence}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#CFE3DC] border-2 border-[#0F2923]">
                      <div className="text-[10px] text-[#0F2923] font-extrabold">
                        CANONICAL GLOBAL
                      </div>
                      <div className="text-base font-extrabold text-[#0F2923] mt-1">
                        {activeScenario.globalSku}
                      </div>
                      <div className="text-xs font-extrabold text-[#0F2923]">
                        {requestedQty} {lang === 'en' ? activeMat.baseUnitEn : activeMat.baseUnitVi}
                      </div>
                    </div>
                  </div>
                  {aiReport?.stepByStepInsights.step2 && (
                    <div className="mt-2.5 p-3 rounded-xl bg-white border border-[#13342D]/20 text-xs font-semibold text-[#0F2923]">
                      <strong className="font-extrabold">🤖 AI Step 2 Analysis: </strong>
                      {aiReport.stepByStepInsights.step2}
                    </div>
                  )}
                </div>
              )}

              {activeStep === 3 && (
                <div>
                  <div className="text-sm font-extrabold text-[#0F2923] mb-2">
                    {lang === 'en'
                      ? `STEP 3: Visual ATP Waterfall vs. Contractor Demand (${stepThinkingTimes[3]} ms)`
                      : `BƯỚC 3: Biểu Đồ Khấu Trừ ATP & Phát Hiện Thiếu Hụt (${stepThinkingTimes[3]} ms)`}
                  </div>

                  {/* Visual Waterfall Comparison Bars */}
                  <div className="space-y-2.5 bg-white p-4 rounded-2xl border-2 border-[#13342D]/15 font-mono-tabular text-xs text-[#0F2923]">
                    <div>
                      <div className="flex justify-between mb-1 font-bold">
                        <span>
                          1. {activeScenario.primaryBranchId} Physical Balance −{' '}
                          {primaryMetrics.bufferPct}% Buffer (−{primaryMetrics.safetyBuffer}) −
                          Reserved (−{primaryStockObj?.softReserved ?? 0}):
                        </span>
                        <strong className="text-[#0F2923] font-extrabold">
                          ATP = {effectivePrimaryATP} Units
                        </strong>
                      </div>
                      <div className="w-full h-3.5 bg-[#E6EFEA] rounded-full overflow-hidden border border-[#13342D]/20">
                        <div
                          className="bg-[#0F2923] h-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((effectivePrimaryATP / Math.max(1, requestedQty)) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1 font-bold">
                        <span>2. Contractor Order Demand ({activeScenario.contractorName}):</span>
                        <strong className="text-[#E05A47] font-extrabold">
                          {requestedQty} Units Requested
                        </strong>
                      </div>
                      <div className="w-full h-3.5 bg-[#E6EFEA] rounded-full overflow-hidden flex border border-[#13342D]/20">
                        <div
                          className="bg-[#0F2923] h-full"
                          style={{
                            width: `${Math.round(
                              (primaryAllocated / Math.max(1, requestedQty)) * 100
                            )}%`,
                          }}
                        />
                        <div
                          className="bg-[#E05A47] h-full"
                          style={{
                            width: `${Math.round(
                              (shortageQty / Math.max(1, requestedQty)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#13342D]/15 flex items-center justify-between font-extrabold text-sm">
                      <span className="text-[#0F2923]">
                        {lang === 'en'
                          ? 'Primary Branch Deficit:'
                          : 'Lượng thiếu hụt tại kho chính:'}
                      </span>
                      <span
                        className={
                          shortageQty > 0
                            ? 'px-2.5 py-0.5 rounded bg-[#E05A47] text-white'
                            : 'px-2.5 py-0.5 rounded bg-[#CFE3DC] text-[#0F2923]'
                        }
                      >
                        {shortageQty > 0
                          ? `−${shortageQty} Units (Triggers Step 4 Split Route)`
                          : '0 Units (100% Primary)'}
                      </span>
                    </div>
                  </div>
                  {aiReport?.stepByStepInsights.step3 && (
                    <div className="mt-2.5 p-3 rounded-xl bg-white border border-[#13342D]/20 text-xs font-semibold text-[#0F2923]">
                      <strong className="font-extrabold">🤖 AI Step 3 Analysis: </strong>
                      {aiReport.stepByStepInsights.step3}
                    </div>
                  )}
                </div>
              )}

              {activeStep === 4 && (
                <div>
                  <div className="text-sm font-extrabold text-[#0F2923] mb-2">
                    {lang === 'en'
                      ? `STEP 4: Visual Multi-Branch Split-Order Route Map (${stepThinkingTimes[4]} ms)`
                      : `BƯỚC 4: Sơ Đồ Điều Phối Xe Giao Hàng Liên Chi Nhánh & Đồng KPI (${stepThinkingTimes[4]} ms)`}
                  </div>

                  {/* Visual Split-Order Logistics Diagram */}
                  <div className="bg-[#0F2923] surface-dark-blueprint rounded-2xl p-4 text-white mb-2.5 border-2 border-[#13342D]">
                    <svg className="w-full h-32" viewBox="0 0 480 116" fill="none">
                      <defs>
                        <path id="truckRoute1" d="M 140 28 C 215 28, 240 58, 330 58" />
                        <path id="truckRoute2" d="M 140 88 C 215 88, 240 58, 330 58" />
                      </defs>

                      <use
                        href="#truckRoute1"
                        stroke="#CFE3DC"
                        strokeWidth="3"
                        className="animate-packet-flow"
                      />
                      <use
                        href="#truckRoute2"
                        stroke="#E05A47"
                        strokeWidth="3"
                        className="animate-packet-flow"
                      />

                      <circle r="5" fill="#CFE3DC">
                        <animateMotion dur="1.3s" repeatCount="indefinite">
                          <mpath href="#truckRoute1" />
                        </animateMotion>
                      </circle>
                      <circle r="5" fill="#E05A47">
                        <animateMotion dur="1.6s" repeatCount="indefinite">
                          <mpath href="#truckRoute2" />
                        </animateMotion>
                      </circle>

                      {/* Primary Hub Box */}
                      <rect
                        x="6"
                        y="8"
                        width="138"
                        height="40"
                        rx="8"
                        fill="#071713"
                        stroke="#CFE3DC"
                        strokeWidth="2"
                      />
                      <text
                        x="14"
                        y="24"
                        fill="#CFE3DC"
                        fontSize="10"
                        fontWeight="800"
                        fontFamily="JetBrains Mono"
                      >
                        {activeScenario.primaryBranchId} ({activeScenario.routingMetrics.primaryDistanceKm}km)
                      </text>
                      <text
                        x="14"
                        y="40"
                        fill="#FFFFFF"
                        fontSize="11"
                        fontWeight="800"
                        fontFamily="JetBrains Mono"
                      >
                        Alloc: {primaryAllocated} u
                      </text>

                      {/* Secondary Hub Box */}
                      <rect
                        x="6"
                        y="66"
                        width="138"
                        height="40"
                        rx="8"
                        fill="#071713"
                        stroke="#E05A47"
                        strokeWidth="2"
                      />
                      <text
                        x="14"
                        y="82"
                        fill="#CFE3DC"
                        fontSize="10"
                        fontWeight="800"
                        fontFamily="JetBrains Mono"
                      >
                        {activeScenario.backupBranchId} ({activeScenario.routingMetrics.backupDistanceKm}km)
                      </text>
                      <text
                        x="14"
                        y="98"
                        fill="#FFFFFF"
                        fontSize="11"
                        fontWeight="800"
                        fontFamily="JetBrains Mono"
                      >
                        Split: +{backupAllocated} u
                      </text>

                      {/* Destination Construction Site Box */}
                      <rect
                        x="330"
                        y="32"
                        width="142"
                        height="52"
                        rx="10"
                        fill="#CFE3DC"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <text
                        x="342"
                        y="52"
                        fill="#0F2923"
                        fontSize="10"
                        fontWeight="800"
                        fontFamily="Plus Jakarta Sans"
                      >
                        CONTRACTOR SITE
                      </text>
                      <text
                        x="342"
                        y="72"
                        fill="#0F2923"
                        fontSize="13"
                        fontWeight="800"
                        fontFamily="JetBrains Mono"
                      >
                        {primaryAllocated + backupAllocated}/{requestedQty} OTIF
                      </text>
                    </svg>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tabular text-white font-extrabold pt-2 border-t border-white/20">
                      <span className="px-2 py-0.5 rounded bg-white/15">
                        🏆 {activeScenario.primaryBranchId}: 100% KPI Credit
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/15">
                        🏆 {activeScenario.backupBranchId}: 100% KPI Credit
                      </span>
                    </div>
                  </div>
                  {aiReport?.stepByStepInsights.step4 && (
                    <div className="p-3 rounded-xl bg-white border border-[#13342D]/20 text-xs font-semibold text-[#0F2923]">
                      <strong className="font-extrabold">🤖 AI Step 4 Analysis: </strong>
                      {aiReport.stepByStepInsights.step4}
                    </div>
                  )}
                </div>
              )}

              {activeStep === 5 && (
                <div>
                  <div className="text-sm font-extrabold text-[#0F2923] mb-2">
                    {lang === 'en'
                      ? `STEP 5: Commit Allocation & Synchronize to Global Hub (${stepThinkingTimes[5]} ms)`
                      : `BƯỚC 5: Xác Nhận Phân Bổ & Đồng Bộ Về Global Hub (${stepThinkingTimes[5]} ms)`}
                  </div>

                  <div className="bg-white p-4 rounded-2xl border-2 border-[#13342D]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="font-mono-tabular text-xs">
                      <div className="text-sm font-extrabold text-[#0F2923]">
                        {activeScenario.globalSku} · Total Fulfilled:{' '}
                        {primaryAllocated + backupAllocated}/{requestedQty}
                      </div>
                      <div className="text-[#13342D] font-bold mt-0.5">
                        {activeScenario.primaryBranchId} (+{primaryAllocated}) &{' '}
                        {activeScenario.backupBranchId} (+{backupAllocated}) · Latency:{' '}
                        {totalThinkingMs}ms
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isAlreadyCommitted || unfulfilledQty > 0}
                      onClick={() =>
                        onCommitOrderSoftLock(
                          activeScenario,
                          requestedQty,
                          primaryAllocated,
                          backupAllocated
                        )
                      }
                      className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                        isAlreadyCommitted
                          ? 'bg-[#CFE3DC] text-[#0F2923] border-2 border-[#0F2923] cursor-default'
                          : 'bg-[#0F2923] hover:bg-[#13342D] text-white'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      <span>
                        {isAlreadyCommitted
                          ? lang === 'en'
                            ? 'Allocation Synchronized ✓'
                            : 'Đã Đồng Bộ Về Global Hub ✓'
                          : lang === 'en'
                          ? 'Commit Allocation & Sync Global'
                          : 'Xác Nhận Phân Bổ & Đồng Bộ Global'}
                      </span>
                    </button>
                  </div>
                  {aiReport?.stepByStepInsights.step5 && (
                    <div className="mt-2.5 p-3 rounded-xl bg-white border border-[#13342D]/20 text-xs font-semibold text-[#0F2923]">
                      <strong className="font-extrabold">🤖 AI Step 5 Analysis: </strong>
                      {aiReport.stepByStepInsights.step5}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 pt-2.5 border-t border-[#13342D]/20 flex items-center justify-between text-xs font-mono-tabular font-bold text-[#0F2923]">
                <span>
                  {lang === 'en'
                    ? `Active Adapter: ${country} Smart Shell`
                    : `Tầng tích hợp: ${country} Smart Shell`}
                </span>
                <span>
                  {lang === 'en'
                    ? `Real AI Response Time: ${totalThinkingMs} ms`
                    : `Tổng thời gian phản hồi AI: ${totalThinkingMs} ms`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2.5: REAL GEMINI AI EXECUTIVE & OPERATIONAL REPORT PANEL */}
      {(aiReport || isRunningRealAI || aiError) && (
        <section className="bg-[#0F2923] surface-dark-blueprint blueprint-grid border-2 border-[#13342D] rounded-3xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/20 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#CFE3DC] text-[#0F2923]">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular font-extrabold text-[#CFE3DC]">
                  <span>
                    {lang === 'en'
                      ? 'LIVE AI EXECUTIVE & OPERATIONAL DISPATCH REPORT'
                      : 'BÁO CÁO PHẢN HỒI & ĐIỀU PHỐI TỪ TRÍ TUỆ NHÂN TẠO (GEMINI 3.1 FLASH LITE)'}
                  </span>
                  {aiReport && (
                    <span className="px-2 py-0.5 rounded bg-[#CFE3DC] text-[#0F2923]">
                      {aiReport.serverLatencyMs} ms · Conf {aiReport.confidenceScore}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-white mt-0.5">
                  {isRunningRealAI
                    ? lang === 'en'
                      ? 'Generating Real-Time Supply Chain Orchestration Report...'
                      : 'AI Đang Tổng Hợp Số Liệu Tồn Kho & Xuất Báo Cáo Điều Phối...'
                    : aiReport?.reportTitle ||
                      (lang === 'en'
                        ? 'AI Orchestration Report'
                        : 'Báo Cáo Điều Phối Đơn Hàng AI')}
                </h3>
              </div>
            </div>

            {aiReport && (
              <span className="px-3.5 py-1.5 rounded-xl bg-[#CFE3DC] text-[#0F2923] font-mono-tabular text-xs font-extrabold self-start">
                {aiReport.statusVerdict}
              </span>
            )}
          </div>

          {aiError && (
            <div className="p-4 rounded-2xl bg-[#E05A47] text-white font-bold text-sm flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {isRunningRealAI && (
            <div className="p-6 rounded-2xl bg-[#071713] border border-white/20 text-center space-y-2">
              <div className="font-mono-tabular text-2xl font-extrabold text-[#CFE3DC]">
                {aiThinkingMs} ms
              </div>
              <div className="text-sm font-bold text-white">
                {lang === 'en'
                  ? `Querying Gemini 3.8 Flash (Low Latency Mode) with live ${country} branch stock & buffer parameters...`
                  : `Đang truy vấn trực tiếp mô hình Gemini 3.8 Flash với thông số tồn kho thực tế của ${country}...`}
              </div>
            </div>
          )}

          {aiReport && !isRunningRealAI && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left 7 Cols: Executive Summary + Step-by-Step Breakdown */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-2xl bg-[#071713] border border-[#CFE3DC]/40">
                  <div className="text-xs font-mono-tabular font-extrabold uppercase text-[#CFE3DC] mb-1.5">
                    {lang === 'en'
                      ? '1. EXECUTIVE SUMMARY & DELIVERY PROMISE VERDICT'
                      : '1. TÓM TẮT ĐIỀU HÀNH & KẾT LUẬN CAM KẾT GIAO HÀNG (DELIVERY PROMISE)'}
                  </div>
                  <p className="text-sm font-semibold text-white leading-relaxed">
                    {aiReport.executiveSummary}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#071713] border border-white/15 space-y-2.5">
                  <div className="text-xs font-mono-tabular font-extrabold uppercase text-[#CFE3DC]">
                    {lang === 'en'
                      ? '2. STEP-BY-STEP AI AUDIT TRAIL'
                      : '2. CHI TIẾT PHÂN TÍCH 5 BƯỚC CỦA AI TRÊN DỮ LIỆU THỰC TẾ'}
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {[
                      { num: 1, text: aiReport.stepByStepInsights.step1 },
                      { num: 2, text: aiReport.stepByStepInsights.step2 },
                      { num: 3, text: aiReport.stepByStepInsights.step3 },
                      { num: 4, text: aiReport.stepByStepInsights.step4 },
                      { num: 5, text: aiReport.stepByStepInsights.step5 },
                    ].map((item) => (
                      <div
                        key={item.num}
                        className="p-2.5 rounded-xl bg-[#0F2923] border border-white/10 flex items-start gap-2.5"
                      >
                        <span className="px-2 py-0.5 rounded bg-[#CFE3DC] text-[#0F2923] font-mono-tabular font-extrabold shrink-0">
                          0{item.num}
                        </span>
                        <span className="text-white font-medium leading-snug">
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Financial/KPI Impact + 3 Actionable Recommendations */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                <div className="p-4 rounded-2xl bg-[#CFE3DC] text-[#0F2923] border-2 border-white">
                  <div className="text-xs font-mono-tabular font-extrabold uppercase text-[#0F2923] mb-1">
                    {lang === 'en'
                      ? '3. FINANCIAL & DUAL-BRANCH KPI GOVERNANCE'
                      : '3. HIỆU QUẢ TÀI CHÍNH & CƠ CHẾ ĐỒNG GHI NHẬN 100% KPI'}
                  </div>
                  <p className="text-xs font-extrabold text-[#0F2923] leading-relaxed">
                    {aiReport.financialAndKpiImpact}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#071713] border border-[#CFE3DC]/40 flex-1">
                  <div className="text-xs font-mono-tabular font-extrabold uppercase text-[#CFE3DC] mb-2.5">
                    {lang === 'en'
                      ? '4. AI ACTIONABLE RECOMMENDATIONS FOR OPERATIONS'
                      : '4. KHUYẾN NGHỊ HÀNH ĐỘNG TỨC THỜI TỪ AI CHO VẬN HÀNH'}
                  </div>
                  <div className="space-y-2.5">
                    {aiReport.actionableRecommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-[#0F2923] border border-white/15 flex items-start gap-2.5 text-xs font-semibold text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#CFE3DC] shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* SECTION 3: LIVE PROTOCOL TRANSLATION TERMINAL */}
      <section className="surface-elevated border-2 border-[#13342D]/15 rounded-3xl p-6">
        <div className="mb-4 border-b border-[#13342D]/15 pb-3">
          <div className="text-xs font-mono-tabular font-extrabold uppercase text-[#13342D]">
            {lang === 'en'
              ? `LIVE PAYLOAD TRANSFORMATION · ${country} ADAPTER TO GLOBAL HUB`
              : `ĐỐI CHIẾU GÓI TIN TRƯỚC VÀ SAU KHI QUA TẦNG TÍCH HỢP ${country}`}
          </div>
          <h3 className="text-lg font-extrabold text-[#0F2923]">
            {lang === 'en'
              ? `${country} Native Legacy Input vs. Canonical Global JSON Output`
              : `Dữ Liệu Nguyên Bản (${country}) vs. Bản Tin Chuẩn Hóa Gửi Về Global Hub`}
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5">
            <div className="text-xs font-mono-tabular font-extrabold text-[#0F2923] mb-2">
              1. {profile.legacySystemName}
            </div>
            <pre className="bg-[#0A1E19] text-[#FFFFFF] border-2 border-[#13342D] p-4 rounded-2xl text-xs font-mono-tabular overflow-x-auto leading-relaxed max-h-[300px]">
              {editableOrderText}
            </pre>
          </div>

          <div className="lg:col-span-7">
            <div className="text-xs font-mono-tabular font-extrabold text-[#0F2923] mb-2">
              2. Canonical Global Hub JSON Output
            </div>
            <pre className="bg-[#0A1E19] text-[#CFE3DC] border-2 border-[#13342D] p-4 rounded-2xl text-xs font-mono-tabular overflow-x-auto leading-relaxed max-h-[300px]">
              {canonicalGlobalJson}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
};
