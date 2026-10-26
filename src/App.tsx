import React, { useState, useEffect, useRef } from 'react';
import {
  AIOrchestrationReport,
  COUNTRY_PROFILES,
  GLOBAL_MATERIALS,
  INITIAL_BRANCH_STOCKS,
  ORDER_SCENARIOS,
  BranchStock,
  CountryCode,
  Language,
  LedgerAuditEvent,
  OrderScenario,
  WorkspaceView,
} from './data/onsiteData';
import { SystemArchitectureBanner } from './components/SystemArchitectureBanner';
import { GlobalAnalyticsDashboard } from './components/GlobalAnalyticsDashboard';
import { CountrySmartShellView } from './components/CountrySmartShellView';

const INITIAL_LEDGER_EVENTS: LedgerAuditEvent[] = [
  {
    id: 'EVT-INIT-1',
    timestamp: '08:41:12.104',
    sourceNode: '🇸🇪 SE-ADAPTER',
    eventTypeEn: 'SE_DELTA_HARMONIZED',
    eventTypeVi: 'ĐỒNG_BỘ_TẦNG_TÍCH_HỢP_SE',
    globalSku: 'GLB-MAT-PLB13',
    detailsEn:
      'Sweden Smart Shell normalized SE-GIPS-13 (80 St) → GLB-MAT-PLB13. Applied 10% Safety Buffer (−8) & Reserved (−2) → Net ATP = 70 Boards.',
    detailsVi:
      'Tầng tích hợp SE chuẩn hóa SE-GIPS-13 (80 Tấm) → GLB-MAT-PLB13. Dự phòng an toàn 10% (−8) & Tạm giữ (−2) → Khả dụng ATP = 70 Tấm.',
    latencyMs: 92,
    status: 'NOMINAL',
  },
  {
    id: 'EVT-INIT-2',
    timestamp: '08:41:18.490',
    sourceNode: '🇩🇰 DK-ADAPTER',
    eventTypeEn: 'DK_SQL_POLL_SYNCED',
    eventTypeVi: 'ĐỒNG_BỘ_TẦNG_TÍCH_HỢP_DK',
    globalSku: 'GLB-MAT-CEM25',
    detailsEn:
      'Denmark Smart Shell mapped DK-CEM-01 (70 Sæk) → GLB-MAT-CEM25. Applied 10% Safety Buffer (−7) & Reserved (−3) → Net ATP = 60 Bags.',
    detailsVi:
      'Tầng tích hợp DK ánh xạ DK-CEM-01 (70 Bao) → GLB-MAT-CEM25. Dự phòng an toàn 10% (−7) & Tạm giữ (−3) → Khả dụng ATP = 60 Bao.',
    latencyMs: 148,
    status: 'NOMINAL',
  },
  {
    id: 'EVT-INIT-3',
    timestamp: '08:41:24.812',
    sourceNode: '🇳🇴 NO-ADAPTER',
    eventTypeEn: 'NO_POS_XML_CONVERTED',
    eventTypeVi: 'ĐỒNG_BỘ_TẦNG_TÍCH_HỢP_NO',
    globalSku: 'GLB-MAT-CEM25',
    detailsEn:
      'Norway Smart Shell converted NO-MUR-250 (3.0 Metric Tons × 40) → 120 Bags GLB-MAT-CEM25. Buffer (−12) → Net ATP = 100 Bags.',
    detailsVi:
      'Tầng tích hợp NO quy đổi NO-MUR-250 (3.0 Tấn × 40) → 120 Bao GLB-MAT-CEM25. Dự phòng 10% (−12) → Khả dụng ATP = 100 Bao.',
    latencyMs: 115,
    status: 'NOMINAL',
  },
];

export default function App() {
  const [lang, setLang] = useState<Language>('vi');
  const [activeView, setActiveView] = useState<WorkspaceView>('GLOBAL');
  const [branchStocks, setBranchStocks] = useState<BranchStock[]>(
    INITIAL_BRANCH_STOCKS
  );

  // Independent Safety Stock Buffer Ratio (%) per Country Smart Shell
  const [countryBufferPct, setCountryBufferPct] = useState<
    Record<CountryCode, number>
  >({
    SE: 10,
    DK: 10,
    NO: 10,
  });

  const [offlineNodes, setOfflineNodes] = useState<
    Record<CountryCode, boolean>
  >({
    SE: false,
    DK: false,
    NO: false,
  });

  const [shellSyncStatus, setShellSyncStatus] = useState<
    Record<
      CountryCode,
      { syncing: boolean; lastMs: number; lastTime: string; lastDeltaText?: string }
    >
  >({
    SE: { syncing: false, lastMs: 92, lastTime: 'Just now' },
    DK: { syncing: false, lastMs: 148, lastTime: 'Just now' },
    NO: { syncing: false, lastMs: 115, lastTime: 'Just now' },
  });

  // Live Multi-Country Autonomous Production Stream State
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(true);
  const [liveTxCount, setLiveTxCount] = useState<number>(3);
  const liveTickRef = useRef<number>(0);

  // Per-Country Requested Order Quantities & Real AI Orchestration State
  const [customRequestedQtys, setCustomRequestedQtys] = useState<
    Record<CountryCode, number>
  >({
    SE: ORDER_SCENARIOS.SE.requestedBaseQty,
    DK: ORDER_SCENARIOS.DK.requestedBaseQty,
    NO: ORDER_SCENARIOS.NO.requestedBaseQty,
  });

  const [activeStep, setActiveStep] = useState<number>(3);
  const [isRunningRealAI, setIsRunningRealAI] = useState<boolean>(false);
  const [aiThinkingMs, setAiThinkingMs] = useState<number>(0);
  const [stepThinkingTimes, setStepThinkingTimes] = useState<
    Record<number, number>
  >({
    1: 115,
    2: 245,
    3: 130,
    4: 280,
    5: 145,
  });

  const [aiReports, setAiReports] = useState<
    Record<CountryCode, AIOrchestrationReport | null>
  >({
    SE: null,
    DK: null,
    NO: null,
  });
  const [lastGlobalAiReport, setLastGlobalAiReport] =
    useState<AIOrchestrationReport | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [committedOrders, setCommittedOrders] = useState<
    Record<string, boolean>
  >({});
  const [ledgerEvents, setLedgerEvents] = useState<LedgerAuditEvent[]>(
    INITIAL_LEDGER_EVENTS
  );

  const formatNow = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${hh}:${mm}:${ss}.${ms}`;
  };

  const appendLedgerEvent = (
    event: Omit<LedgerAuditEvent, 'id' | 'timestamp'>
  ) => {
    setLedgerEvents((prev) => [
      {
        ...event,
        id: `EVT-${Date.now()}-${Math.floor(Math.random() * 999)}`,
        timestamp: formatNow(),
      },
      ...prev.slice(0, 14),
    ]);
  };

  // STAGGERED LIVE AUTONOMOUS MULTI-COUNTRY PRODUCTION HEARTBEAT (2.4s Cadence, 1 Country per Tick)
  // Updates one country at a time (SE -> DK -> NO) so all 3 never flash simultaneously
  useEffect(() => {
    if (!isLiveStreamActive) return;

    const interval = setInterval(() => {
      liveTickRef.current += 1;
      const countries: CountryCode[] = ['SE', 'DK', 'NO'];
      const targetCountry = countries[liveTickRef.current % 3];

      if (offlineNodes[targetCountry]) return;

      setBranchStocks((prevStocks) => {
        const cIndices = prevStocks
          .map((s, idx) => (s.country === targetCountry ? idx : -1))
          .filter((idx) => idx !== -1);
        if (cIndices.length === 0) return prevStocks;

        const chosenIndex =
          cIndices[Math.floor(Math.random() * cIndices.length)];
        const targetStock = prevStocks[chosenIndex];

        const isReplenish =
          targetStock.physicalStock < 70 || Math.random() > 0.52;
        const delta = isReplenish
          ? 5 + Math.floor(Math.random() * 10)
          : -(3 + Math.floor(Math.random() * 7));

        const nextPhysical = Math.max(
          45,
          Math.min(540, targetStock.physicalStock + delta)
        );
        const actualDelta = nextPhysical - targetStock.physicalStock;
        if (actualDelta === 0) return prevStocks;

        const resDelta =
          Math.random() > 0.65 ? (Math.random() > 0.5 ? 2 : -2) : 0;
        const nextReserved = Math.max(
          0,
          Math.min(45, targetStock.softReserved + resDelta)
        );

        const pct = countryBufferPct[targetCountry];
        const buffer = Math.ceil((nextPhysical * pct) / 100);
        const nextAtp = Math.max(0, nextPhysical - buffer - nextReserved);
        const measuredLatency = 68 + Math.floor(Math.random() * 82);
        const signStr =
          actualDelta >= 0 ? `+${actualDelta}` : `${actualDelta}`;

        setShellSyncStatus((prevSync) => ({
          ...prevSync,
          [targetCountry]: {
            syncing: true,
            lastMs: measuredLatency,
            lastTime: formatNow(),
            lastDeltaText: `${targetStock.branchId}: ${signStr}u → ATP ${nextAtp}`,
          },
        }));

        setTimeout(() => {
          setShellSyncStatus((prevSync) => ({
            ...prevSync,
            [targetCountry]: {
              ...prevSync[targetCountry],
              syncing: false,
            },
          }));
        }, 500);

        setLiveTxCount((c) => c + 1);

        const flag =
          targetCountry === 'SE' ? '🇸🇪' : targetCountry === 'DK' ? '🇩🇰' : '🇳🇴';
        appendLedgerEvent({
          sourceNode: `${flag} ${targetCountry}-ADAPTER (${targetStock.branchId})`,
          eventTypeEn:
            actualDelta > 0
              ? 'LIVE_ERP_REPLENISHMENT'
              : 'LIVE_POS_COUNTER_DISPATCH',
          eventTypeVi:
            actualDelta > 0
              ? 'NHẬP_KHO_THỰC_TẾ_ERP'
              : 'XUẤT_BÁN_QUẦY_POS_THỰC_TẾ',
          globalSku: targetStock.globalSku,
          detailsEn: `Live ${targetCountry} stream at ${targetStock.branchId} (${signStr}u): Physical=${nextPhysical}, Buffer(${pct}%)=−${buffer}, Reserved=−${nextReserved} → Net ATP = ${nextAtp}.`,
          detailsVi: `Biến động thực tế tại ${targetStock.branchId} (${signStr} đơn vị): Tồn vật lý=${nextPhysical}, Dự phòng(${pct}%)=−${buffer}, Tạm giữ=−${nextReserved} → Khả dụng ATP = ${nextAtp}.`,
          latencyMs: measuredLatency,
          status: 'NOMINAL',
        });

        return prevStocks.map((item, idx) =>
          idx === chosenIndex
            ? {
                ...item,
                physicalStock: nextPhysical,
                softReserved: nextReserved,
                lastPolledAgo: 'Live · 2s',
              }
            : item
        );
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [isLiveStreamActive, offlineNodes, countryBufferPct]);

  // REAL GEMINI 3.8 FLASH EXECUTION (SINGLE-PASS, NON-LOOPING, REAL SERVER CALL)
  const handleRunRealAI = async (
    targetCountry: CountryCode,
    customRawOrderText?: string
  ) => {
    if (isRunningRealAI) return;

    setIsRunningRealAI(true);
    setAiError(null);
    setActiveStep(1);
    setAiThinkingMs(0);

    const startPerf = performance.now();

    // Advance the visual step indicator 1 -> 2 -> 3 -> 4 while awaiting the real Gemini API response (no loop!)
    const timer = setInterval(() => {
      const elapsed = Math.round(performance.now() - startPerf);
      setAiThinkingMs(elapsed);
      if (elapsed < 220) {
        setActiveStep(1);
      } else if (elapsed < 480) {
        setActiveStep(2);
      } else if (elapsed < 750) {
        setActiveStep(3);
      } else {
        setActiveStep(4);
      }
    }, 35);

    try {
      const scenario = ORDER_SCENARIOS[targetCountry];
      const profile = COUNTRY_PROFILES[targetCountry];
      const mat =
        GLOBAL_MATERIALS.find((m) => m.globalSku === scenario.globalSku) ||
        GLOBAL_MATERIALS[0];
      const localMap = mat.mappings[targetCountry];

      const countryStocks = branchStocks.filter(
        (s) => s.country === targetCountry
      );
      const primaryStockObj = countryStocks.find(
        (s) =>
          s.branchId === scenario.primaryBranchId &&
          s.globalSku === scenario.globalSku
      );
      const backupStockObj = countryStocks.find(
        (s) =>
          s.branchId === scenario.backupBranchId &&
          s.globalSku === scenario.globalSku
      );

      const isOffline = offlineNodes[targetCountry];
      const bufferPct = isOffline
        ? Math.max(15, countryBufferPct[targetCountry])
        : countryBufferPct[targetCountry];

      const pPhys = primaryStockObj?.physicalStock ?? 0;
      const pBuf = Math.ceil((pPhys * bufferPct) / 100);
      const pRes = primaryStockObj?.softReserved ?? 0;
      const pAtp = isOffline ? 0 : Math.max(0, pPhys - pBuf - pRes);

      const bPhys = backupStockObj?.physicalStock ?? 0;
      const bBuf = Math.ceil((bPhys * bufferPct) / 100);
      const bRes = backupStockObj?.softReserved ?? 0;
      const bAtp = Math.max(0, bPhys - bBuf - bRes);

      const requestedQty = customRequestedQtys[targetCountry];
      const primaryAllocated = Math.min(requestedQty, pAtp);
      const shortageQty = Math.max(0, requestedQty - primaryAllocated);
      const backupAllocated = Math.min(shortageQty, bAtp);
      const unfulfilledQty = Math.max(0, shortageQty - backupAllocated);

      const response = await fetch('/api/ai-orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang,
          country: targetCountry,
          legacySystemName: profile.legacySystemName,
          contractorName: scenario.contractorName,
          deliverySite:
            lang === 'en' ? scenario.deliverySiteEn : scenario.deliverySiteVi,
          rawOrderText: customRawOrderText || scenario.rawOrderInput,
          globalSku: scenario.globalSku,
          localSku: localMap.localSku,
          conversionRule: localMap.conversionRule,
          requestedQty,
          baseUnit: lang === 'en' ? mat.baseUnitEn : mat.baseUnitVi,
          bufferPct,
          isOffline,
          primaryBranch: {
            branchId: scenario.primaryBranchId,
            physicalStock: pPhys,
            safetyBuffer: pBuf,
            softReserved: pRes,
            atp: pAtp,
            allocated: primaryAllocated,
            distanceKm: scenario.routingMetrics.primaryDistanceKm,
          },
          backupBranch: {
            branchId: scenario.backupBranchId,
            physicalStock: bPhys,
            safetyBuffer: bBuf,
            softReserved: bRes,
            atp: bAtp,
            allocated: backupAllocated,
            distanceKm: scenario.routingMetrics.backupDistanceKm,
          },
          shortageQty,
          unfulfilledQty,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to execute Gemini AI analysis.');
      }

      clearInterval(timer);
      const report = data as AIOrchestrationReport;
      setAiThinkingMs(report.serverLatencyMs);
      setStepThinkingTimes(report.stepTimingsMs);
      setActiveStep(5);

      setAiReports((prev) => ({
        ...prev,
        [targetCountry]: report,
      }));
      setLastGlobalAiReport(report);

      appendLedgerEvent({
        sourceNode: `🤖 ${targetCountry}-GEMINI-AI`,
        eventTypeEn: 'GEMINI_AI_REPORT_GENERATED',
        eventTypeVi: 'BÁO_CÁO_ĐIỀU_PHỐI_AI_HOÀN_TẤT',
        globalSku: scenario.globalSku,
        detailsEn: `[${report.modelUsed}] ${report.reportTitle} — ${report.statusVerdict} (${report.serverLatencyMs} ms).`,
        detailsVi: `[${report.modelUsed}] ${report.reportTitle} — ${report.statusVerdict} (${report.serverLatencyMs} ms).`,
        latencyMs: report.serverLatencyMs,
        status: shortageQty > 0 ? 'SPLIT_ROUTED' : 'NOMINAL',
      });
    } catch (err: unknown) {
      clearInterval(timer);
      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể kết nối tới máy chủ AI Gemini.';
      setAiError(msg);
    } finally {
      setIsRunningRealAI(false);
    }
  };

  const handleManualSyncShellToGlobal = (country: CountryCode) => {
    const measuredMs = 85 + Math.floor(Math.random() * 95);
    setShellSyncStatus((prev) => ({
      ...prev,
      [country]: {
        syncing: true,
        lastMs: measuredMs,
        lastTime: formatNow(),
        lastDeltaText: 'Manual Sync → Global Hub',
      },
    }));

    setTimeout(() => {
      setShellSyncStatus((prev) => ({
        ...prev,
        [country]: {
          ...prev[country],
          syncing: false,
        },
      }));
    }, 350);

    const stocks = branchStocks.filter((s) => s.country === country);
    const pct = countryBufferPct[country];
    const totalAtp = stocks.reduce((acc, s) => {
      const buf = Math.ceil((s.physicalStock * pct) / 100);
      return acc + Math.max(0, s.physicalStock - buf - s.softReserved);
    }, 0);

    appendLedgerEvent({
      sourceNode: `${country}-ADAPTER`,
      eventTypeEn: 'ADAPTER_TO_GLOBAL_SYNC',
      eventTypeVi: `ĐỒNG_BỘ_${country}_VỀ_GLOBAL`,
      globalSku: `ALL_${country}_SKUS`,
      detailsEn: `${country} Smart Shell harmonized local SKUs, enforced ${pct}% Safety Buffer, and synchronized ${totalAtp} net ATP units to Global Hub in ${measuredMs} ms.`,
      detailsVi: `Tầng tích hợp ${country} đã chuẩn hóa danh mục SKU, áp dụng định mức dự phòng ${pct}% và đồng bộ ${totalAtp} đơn vị khả dụng (ATP) về Global Hub trong ${measuredMs} ms.`,
      latencyMs: measuredMs,
      status: 'NOMINAL',
    });
  };

  const handleChangeCountryBufferPct = (country: CountryCode, pct: number) => {
    setCountryBufferPct((prev) => ({ ...prev, [country]: pct }));
    appendLedgerEvent({
      sourceNode: `${country}-ADAPTER`,
      eventTypeEn: 'SAFETY_BUFFER_UPDATED',
      eventTypeVi: `CẬP_NHẬT_ĐỊNH_MỨC_DỰ_PHÒNG_${country}`,
      globalSku: `ALL_${country}_SKUS`,
      detailsEn: `Adjusted ${country} Smart Shell Safety Stock Buffer ratio to ${pct}%. Recalculated regional ATP and updated Global Hub.`,
      detailsVi: `Điều chỉnh định mức dự phòng an toàn tại tầng tích hợp ${country} thành ${pct}%. Đã tính toán lại ATP và cập nhật về Global Hub.`,
      latencyMs: 52,
      status: pct === 0 ? 'CIRCUIT_BREAKER' : 'NOMINAL',
    });
  };

  const handleToggleOfflineNode = (country: CountryCode) => {
    setOfflineNodes((prev) => {
      const nextState = !prev[country];
      appendLedgerEvent({
        sourceNode: `${country}-ADAPTER`,
        eventTypeEn: nextState ? 'CIRCUIT_BREAKER_ENGAGED' : 'CONNECTION_RESTORED',
        eventTypeVi: nextState
          ? 'KÍCH_HOẠT_NGẮT_MẠCH_DỰ_PHÒNG'
          : 'KHÔI_PHỤC_KẾT_NỐI_HỆ_THỐNG',
        globalSku: 'ALL_NODE_SKUS',
        detailsEn: nextState
          ? `${country} legacy core connection interrupted. ${country} Smart Shell engaged Circuit Breaker replica cache (<5m TTL) and failover routing.`
          : `${country} legacy core connection restored. Resumed real-time delta synchronization.`,
        detailsVi: nextState
          ? `Gián đoạn kết nối hệ thống gốc ${country}. Tầng tích hợp ${country} đã kích hoạt bộ nhớ đệm dự phòng (Circuit Breaker <5 phút) và định tuyến thay thế.`
          : `Đã khôi phục kết nối hệ thống gốc ${country}. Tiếp tục đồng bộ biến động thời gian thực.`,
        latencyMs: nextState ? 18 : 135,
        status: nextState ? 'CIRCUIT_BREAKER' : 'NOMINAL',
      });
      return { ...prev, [country]: nextState };
    });
  };

  const handleUpdatePhysicalStock = (
    stockId: string,
    newPhysical: number,
    reason: string
  ) => {
    setBranchStocks((prev) =>
      prev.map((item) => {
        if (item.id !== stockId) return item;
        const pct = countryBufferPct[item.country];
        const buffer = Math.ceil((newPhysical * pct) / 100);
        const newAtp = Math.max(0, newPhysical - buffer - item.softReserved);
        appendLedgerEvent({
          sourceNode: `${item.country}-ADAPTER (${item.branchId})`,
          eventTypeEn: 'INVENTORY_BALANCE_UPDATED',
          eventTypeVi: 'CẬP_NHẬT_SỐ_DƯ_TỒN_KHO',
          globalSku: item.globalSku,
          detailsEn: `${reason}: Physical=${newPhysical} − Buffer(${pct}%)=${buffer} − Reserved=${item.softReserved} → Net ATP = ${newAtp}.`,
          detailsVi: `${reason}: Tồn vật lý=${newPhysical} − Dự phòng(${pct}%)=${buffer} − Tạm giữ=${item.softReserved} → Khả dụng ATP = ${newAtp}.`,
          latencyMs: 78,
          status: 'NOMINAL',
        });
        return {
          ...item,
          physicalStock: newPhysical,
          lastPolledAgo: '1s ago',
        };
      })
    );
  };

  const handleUpdateSoftReserved = (stockId: string, newReserved: number) => {
    setBranchStocks((prev) =>
      prev.map((item) => {
        if (item.id !== stockId) return item;
        const pct = countryBufferPct[item.country];
        const buffer = Math.ceil((item.physicalStock * pct) / 100);
        const newAtp = Math.max(0, item.physicalStock - buffer - newReserved);
        appendLedgerEvent({
          sourceNode: `${item.country}-ADAPTER (${item.branchId})`,
          eventTypeEn: 'SOFT_RESERVATION_ADJUSTED',
          eventTypeVi: 'ĐIỀU_CHỈNH_TẠM_GIỮ_B2B',
          globalSku: item.globalSku,
          detailsEn: `B2B Soft-Reservation updated to ${newReserved} at ${item.branchId} → Net ATP = ${newAtp}.`,
          detailsVi: `Cập nhật lượng hàng tạm giữ B2B thành ${newReserved} tại ${item.branchId} → Khả dụng ATP = ${newAtp}.`,
          latencyMs: 64,
          status: 'NOMINAL',
        });
        return {
          ...item,
          softReserved: newReserved,
        };
      })
    );
  };

  const handleResetStocks = () => {
    setBranchStocks(INITIAL_BRANCH_STOCKS);
    setCountryBufferPct({ SE: 10, DK: 10, NO: 10 });
    setCommittedOrders({});
    setOfflineNodes({ SE: false, DK: false, NO: false });
    setCustomRequestedQtys({
      SE: ORDER_SCENARIOS.SE.requestedBaseQty,
      DK: ORDER_SCENARIOS.DK.requestedBaseQty,
      NO: ORDER_SCENARIOS.NO.requestedBaseQty,
    });

    appendLedgerEvent({
      sourceNode: 'GLOBAL-HUB',
      eventTypeEn: 'SYSTEM_BASELINE_RESTORED',
      eventTypeVi: 'KHÔI_PHỤC_THÔNG_SỐ_CHUẨN',
      globalSku: 'ALL_SKUS',
      detailsEn:
        'Restored all regional adapters (SE, DK, NO) to 10% safety buffer and baseline inventory balances.',
      detailsVi:
        'Đã khôi phục toàn bộ tầng tích hợp quốc gia (SE, DK, NO) về định mức dự phòng 10% và số dư tồn kho tiêu chuẩn.',
      latencyMs: 55,
      status: 'NOMINAL',
    });
  };

  const handleCommitOrderSoftLock = (
    scenario: OrderScenario,
    requestedQty: number,
    primaryAllocated: number,
    backupAllocated: number
  ) => {
    if (committedOrders[scenario.id]) return;

    setBranchStocks((prev) =>
      prev.map((stock) => {
        if (
          stock.branchId === scenario.primaryBranchId &&
          stock.globalSku === scenario.globalSku
        ) {
          return {
            ...stock,
            softReserved: stock.softReserved + primaryAllocated,
            lastPolledAgo: 'Just now',
          };
        }
        if (
          stock.branchId === scenario.backupBranchId &&
          stock.globalSku === scenario.globalSku
        ) {
          return {
            ...stock,
            softReserved: stock.softReserved + backupAllocated,
            lastPolledAgo: 'Just now',
          };
        }
        return stock;
      })
    );

    setCommittedOrders((prev) => ({ ...prev, [scenario.id]: true }));

    appendLedgerEvent({
      sourceNode: `${scenario.country}-ADAPTER`,
      eventTypeEn: 'SPLIT_ALLOCATION_COMMITTED',
      eventTypeVi: 'XÁC_NHẬN_PHÂN_BỔ_LIÊN_CHI_NHÁNH',
      globalSku: scenario.globalSku,
      detailsEn: `Committed ${requestedQty} units for ${scenario.contractorName}: Reserved ${primaryAllocated} at ${scenario.primaryBranchId} + ${backupAllocated} at ${scenario.backupBranchId}. Synchronized to Global Hub.`,
      detailsVi: `Đã xác nhận phân bổ đơn hàng ${requestedQty} đơn vị của ${scenario.contractorName}: Tạm giữ ${primaryAllocated} tại ${scenario.primaryBranchId} + ${backupAllocated} tại ${scenario.backupBranchId} và đồng bộ về Global Hub.`,
      latencyMs: 210,
      status: 'SPLIT_ROUTED',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F5] text-[#13342D]">
      {/* TOP NAVIGATION BAR (3-Zone Contract) */}
      <header className="sticky top-0 z-30 bg-[#13342D] text-white border-b border-white/10 px-6 py-4 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('GLOBAL');
          }}
          className="text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          OnSite
        </a>

        {/* Zone 2: 4 Concise Single-Line Workspace Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#CFE3DC]">
          <button
            type="button"
            onClick={() => setActiveView('GLOBAL')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'GLOBAL'
                ? 'text-white underline underline-offset-8 decoration-2 decoration-[#8EB9AC]'
                : ''
            }`}
          >
            {lang === 'en'
              ? 'Global Hub & Analytics'
              : 'Trung Tâm Vận Hành & Phân Tích Global'}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveView('SE');
              setActiveStep(3);
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'SE'
                ? 'text-white underline underline-offset-8 decoration-2 decoration-[#8EB9AC]'
                : ''
            }`}
          >
            {lang === 'en' ? '🇸🇪 Sweden System' : '🇸🇪 Hệ Thống Thụy Điển'}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveView('DK');
              setActiveStep(3);
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'DK'
                ? 'text-white underline underline-offset-8 decoration-2 decoration-[#8EB9AC]'
                : ''
            }`}
          >
            {lang === 'en' ? '🇩🇰 Denmark System' : '🇩🇰 Hệ Thống Đan Mạch'}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveView('NO');
              setActiveStep(3);
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'NO'
                ? 'text-white underline underline-offset-8 decoration-2 decoration-[#8EB9AC]'
                : ''
            }`}
          >
            {lang === 'en' ? '🇳🇴 Norway System' : '🇳🇴 Hệ Thống Na Uy'}
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (Instant Bilingual Switcher) */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setLang((prev) => (prev === 'en' ? 'vi' : 'en'))}
            className="px-4 py-2 rounded-xl bg-[#CFE3DC] hover:bg-[#8EB9AC] text-[#13342D] text-xs font-extrabold transition-colors whitespace-nowrap shrink-0"
          >
            {lang === 'en'
              ? '🇬🇧 EN  |  🇻🇳 Tiếng Việt'
              : '🇻🇳 Tiếng Việt  |  🇬🇧 English'}
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE CONTAINER */}
      <main
        id="top"
        className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6"
      >
        {/* TOP SYSTEM ARCHITECTURE TOPOLOGY (Always Visible: Click Global or Any of the 3 Countries) */}
        <SystemArchitectureBanner
          lang={lang}
          activeView={activeView}
          onSelectView={(view) => {
            setActiveView(view);
            setActiveStep(3);
          }}
          offlineNodes={offlineNodes}
          onToggleOfflineNode={handleToggleOfflineNode}
          materials={GLOBAL_MATERIALS}
          branchStocks={branchStocks}
          countryBufferPct={countryBufferPct}
          onManualSyncShellToGlobal={handleManualSyncShellToGlobal}
          shellSyncStatus={shellSyncStatus}
          isLiveStreamActive={isLiveStreamActive}
          onToggleLiveStream={() => setIsLiveStreamActive((prev) => !prev)}
          liveTxCount={liveTxCount}
        />

        {/* DYNAMIC WORKSPACE VIEW: DEFAULT GLOBAL ANALYTICS HUB vs. SELECTED COUNTRY SMART SHELL */}
        {activeView === 'GLOBAL' ? (
          <GlobalAnalyticsDashboard
            lang={lang}
            materials={GLOBAL_MATERIALS}
            branchStocks={branchStocks}
            countryBufferPct={countryBufferPct}
            offlineNodes={offlineNodes}
            ledgerEvents={ledgerEvents}
            onSelectCountryView={(country) => {
              setActiveView(country);
              setActiveStep(3);
            }}
            aiReport={lastGlobalAiReport}
            aiError={aiError}
            isRunningRealAI={isRunningRealAI}
            aiThinkingMs={aiThinkingMs}
            onRunGlobalRealAI={(country) => handleRunRealAI(country)}
          />
        ) : (
          <CountrySmartShellView
            lang={lang}
            country={activeView}
            onSelectView={setActiveView}
            materials={GLOBAL_MATERIALS}
            branchStocks={branchStocks}
            countryBufferPct={countryBufferPct}
            onChangeCountryBufferPct={handleChangeCountryBufferPct}
            offlineNodes={offlineNodes}
            onToggleOfflineNode={handleToggleOfflineNode}
            onUpdatePhysicalStock={handleUpdatePhysicalStock}
            onUpdateSoftReserved={handleUpdateSoftReserved}
            onResetStocks={handleResetStocks}
            customRequestedQty={customRequestedQtys[activeView]}
            onChangeCustomRequestedQty={(qty) =>
              setCustomRequestedQtys((prev) => ({
                ...prev,
                [activeView]: qty,
              }))
            }
            activeStep={activeStep}
            onSetActiveStep={setActiveStep}
            isRunningRealAI={isRunningRealAI}
            onRunRealAI={(customRawOrderText) =>
              handleRunRealAI(activeView, customRawOrderText)
            }
            aiThinkingMs={aiThinkingMs}
            stepThinkingTimes={stepThinkingTimes}
            aiReport={aiReports[activeView]}
            aiError={aiError}
            onCommitOrderSoftLock={handleCommitOrderSoftLock}
            committedOrders={committedOrders}
            onManualSyncShellToGlobal={handleManualSyncShellToGlobal}
          />
        )}
      </main>

      {/* ENTERPRISE FOOTER */}
      <footer className="bg-white border-t border-[#13342D]/15 px-6 py-4 text-xs text-[#13342D]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-bold">
            {lang === 'en'
              ? 'OnSite — The Delivery Promise Platform · Team Pyramid (Netcompany IT Consultant Challenge 2026)'
              : 'OnSite — Nền Tảng Cam Kết Giao Hàng · Team Pyramid (Netcompany IT Consultant Challenge 2026)'}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleResetStocks}
              className="underline font-bold hover:text-[#0F2923] transition-colors whitespace-nowrap shrink-0"
            >
              {lang === 'en'
                ? 'Restore Standard Simulation Parameters'
                : 'Khôi phục thông số tiêu chuẩn'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
