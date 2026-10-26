import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  MapPin,
  Sparkles,
  Play,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  AIOrchestrationReport,
  BranchStock,
  CountryCode,
  GlobalMaterial,
  GLOBAL_SCHEMA_DDL,
  Language,
  LedgerAuditEvent,
  ORDER_SCENARIOS,
} from '../data/onsiteData';

interface GlobalAnalyticsDashboardProps {
  lang: Language;
  materials: GlobalMaterial[];
  branchStocks: BranchStock[];
  countryBufferPct: Record<CountryCode, number>;
  offlineNodes: Record<CountryCode, boolean>;
  ledgerEvents: LedgerAuditEvent[];
  onSelectCountryView: (country: CountryCode) => void;
  aiReport: AIOrchestrationReport | null;
  aiError: string | null;
  isRunningRealAI: boolean;
  aiThinkingMs: number;
  onRunGlobalRealAI: (country: CountryCode) => void;
}

export const GlobalAnalyticsDashboard: React.FC<GlobalAnalyticsDashboardProps> = ({
  lang,
  materials,
  branchStocks,
  countryBufferPct,
  offlineNodes,
  ledgerEvents,
  onSelectCountryView,
  aiReport,
  aiError,
  isRunningRealAI,
  aiThinkingMs,
  onRunGlobalRealAI,
}) => {
  const [ledgerTab, setLedgerTab] = useState<'xref' | 'schema'>('xref');
  const [hoveredHub, setHoveredHub] = useState<string | null>(null);
  const [selectedAiCountry, setSelectedAiCountry] = useState<CountryCode>('SE');

  const getStockCalc = (stock: BranchStock) => {
    const isOffline = offlineNodes[stock.country];
    const pct = isOffline
      ? Math.max(15, countryBufferPct[stock.country])
      : countryBufferPct[stock.country];
    const buffer = Math.ceil((stock.physicalStock * pct) / 100);
    const atp = Math.max(0, stock.physicalStock - buffer - stock.softReserved);
    return { buffer, atp, pct };
  };

  let totalPhysical = 0;
  let totalBuffer = 0;
  let totalReserved = 0;
  let totalAtp = 0;
  let totalPortfolioEur = 0;

  branchStocks.forEach((s) => {
    const { buffer, atp } = getStockCalc(s);
    const mat = materials.find((m) => m.globalSku === s.globalSku);
    totalPhysical += s.physicalStock;
    totalBuffer += buffer;
    totalReserved += s.softReserved;
    totalAtp += atp;
    if (mat) {
      totalPortfolioEur += atp * mat.unitPriceEur;
    }
  });

  const globalAtpRatio =
    totalPhysical > 0 ? Math.round((totalAtp / totalPhysical) * 100) : 0;
  const globalBufRatio =
    totalPhysical > 0 ? Math.round((totalBuffer / totalPhysical) * 100) : 0;

  const getCountrySummary = (country: CountryCode) => {
    const items = branchStocks.filter((s) => s.country === country);
    let phys = 0;
    let buf = 0;
    let res = 0;
    let atp = 0;
    items.forEach((s) => {
      const c = getStockCalc(s);
      phys += s.physicalStock;
      buf += c.buffer;
      res += s.softReserved;
      atp += c.atp;
    });
    return { phys, buf, res, atp, pct: countryBufferPct[country] };
  };

  const getMaterialSummary = (globalSku: string) => {
    const items = branchStocks.filter((s) => s.globalSku === globalSku);
    let phys = 0;
    let buf = 0;
    let res = 0;
    let atp = 0;
    const byCountry: Record<CountryCode, number> = { SE: 0, DK: 0, NO: 0 };

    items.forEach((s) => {
      const c = getStockCalc(s);
      phys += s.physicalStock;
      buf += c.buffer;
      res += s.softReserved;
      atp += c.atp;
      byCountry[s.country] += c.atp;
    });
    return { phys, buf, res, atp, byCountry };
  };

  const avgLatencyMs =
    ledgerEvents.length > 0
      ? Math.round(
          ledgerEvents.reduce((acc, e) => acc + e.latencyMs, 0) /
            ledgerEvents.length
        )
      : 118;

  // Well-spaced coordinates for the Interactive Nordic Logistics Map SVG (viewBox 0 0 520 400)
  const mapHubs: Array<{
    branchId: string;
    country: CountryCode;
    x: number;
    y: number;
    labelOffsetX: number;
    labelOffsetY: number;
    isPrimary: boolean;
  }> = [
    {
      branchId: 'UPP-02',
      country: 'SE',
      x: 345,
      y: 175,
      labelOffsetX: 12,
      labelOffsetY: -12,
      isPrimary: false,
    },
    {
      branchId: 'STO-01',
      country: 'SE',
      x: 355,
      y: 245,
      labelOffsetX: 12,
      labelOffsetY: -8,
      isPrimary: true,
    },
    {
      branchId: 'OSL-01',
      country: 'NO',
      x: 225,
      y: 220,
      labelOffsetX: 10,
      labelOffsetY: -10,
      isPrimary: true,
    },
    {
      branchId: 'BGO-02',
      country: 'NO',
      x: 115,
      y: 205,
      labelOffsetX: -72,
      labelOffsetY: -10,
      isPrimary: false,
    },
    {
      branchId: 'AAR-02',
      country: 'DK',
      x: 180,
      y: 325,
      labelOffsetX: -72,
      labelOffsetY: -10,
      isPrimary: false,
    },
    {
      branchId: 'CPH-01',
      country: 'DK',
      x: 255,
      y: 350,
      labelOffsetX: 12,
      labelOffsetY: -10,
      isPrimary: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* SECTION 1: 4 HIGH-CONTRAST VISUAL RADIAL & BAR GAUGE KPI CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Radial Gauge for Global ATP */}
        <div className="surface-elevated border-2 border-[#13342D]/15 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#13342D] mb-1">
              {lang === 'en' ? 'GLOBAL NET ATP' : 'TỒN KHO KHẢ DỤNG (ATP)'}
            </div>
            <div className="font-mono-tabular text-3xl font-extrabold text-[#0F2923]">
              {totalAtp.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-[#13342D] font-mono-tabular mt-1">
              €{Math.round(totalPortfolioEur).toLocaleString()} · {globalAtpRatio}% of{' '}
              {totalPhysical}
            </div>
          </div>

          <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="#CFE3DC"
                strokeWidth="7"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="#13342D"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${(globalAtpRatio / 100) * 163} 163`}
                transform="rotate(-90 32 32)"
              />
            </svg>
            <span className="absolute font-mono-tabular text-xs font-extrabold text-[#0F2923]">
              {globalAtpRatio}%
            </span>
          </div>
        </div>

        {/* KPI 2: Visual Buffer Shield Card */}
        <div className="surface-elevated border-2 border-[#13342D]/15 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#13342D] mb-1">
                {lang === 'en'
                  ? 'SAFETY BUFFER SHIELD'
                  : 'ĐỊNH MỨC DỰ PHÒNG AN TOÀN'}
              </div>
              <div className="font-mono-tabular text-3xl font-extrabold text-[#0F2923]">
                {totalBuffer.toLocaleString()}{' '}
                <span className="text-xs font-bold text-[#13342D]">
                  Units ({globalBufRatio}%)
                </span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#13342D] text-[#CFE3DC]">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-3">
            <div className="w-full h-3 rounded-full bg-[#F4F7F5] overflow-hidden border border-[#13342D]/25">
              <div
                className="h-full bg-[#13342D]"
                style={{ width: `${Math.min(100, globalBufRatio * 4)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono-tabular font-bold text-[#13342D] mt-1.5">
              <span>SE: {countryBufferPct.SE}%</span>
              <span>DK: {countryBufferPct.DK}%</span>
              <span>NO: {countryBufferPct.NO}%</span>
            </div>
          </div>
        </div>

        {/* KPI 3: OTIF SLA Ring */}
        <div className="surface-elevated border-2 border-[#13342D]/15 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#13342D] mb-1">
              {lang === 'en'
                ? 'DELIVERY PROMISE (OTIF)'
                : 'CAM KẾT GIAO ĐÚNG HẸN'}
            </div>
            <div className="font-mono-tabular text-3xl font-extrabold text-[#0F2923]">
              99.4%
            </div>
            <div className="text-xs font-semibold text-[#13342D] mt-1">
              {lang === 'en'
                ? `B2B Reserved: ${totalReserved} units`
                : `Đang tạm giữ B2B: ${totalReserved} đơn vị`}
            </div>
          </div>

          <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="#CFE3DC"
                strokeWidth="7"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="#13342D"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray="161 163"
                transform="rotate(-90 32 32)"
              />
            </svg>
            <TrendingUp className="w-5 h-5 text-[#0F2923] absolute" />
          </div>
        </div>

        {/* KPI 4: Speed & Latency Meter */}
        <div className="surface-elevated border-2 border-[#13342D]/15 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#13342D] mb-1">
                {lang === 'en'
                  ? 'GLOBAL SYNC LATENCY'
                  : 'ĐỘ TRỄ ĐỒNG BỘ TRUNG BÌNH'}
              </div>
              <div className="font-mono-tabular text-3xl font-extrabold text-[#0F2923]">
                {avgLatencyMs} ms
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#13342D] text-[#CFE3DC]">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-3">
            <div className="w-full h-3 bg-[#CFE3DC] rounded-full overflow-hidden border border-[#13342D]/20">
              <div
                className="bg-[#13342D] h-full rounded-full"
                style={{ width: `${Math.min(100, (avgLatencyMs / 500) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono-tabular font-bold text-[#13342D] mt-1.5">
              <span>0 ms</span>
              <span>SLA &lt; 500 ms</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1.5: REAL GEMINI AI EXECUTIVE ORCHESTRATION & REPORT BAR */}
      <section className="bg-[#0F2923] surface-dark-blueprint blueprint-grid border-2 border-[#13342D] rounded-3xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-[#CFE3DC] text-[#0F2923] shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono-tabular font-extrabold uppercase text-[#CFE3DC] mb-1">
                <span>GEMINI 3.1 FLASH LITE · REAL-TIME AI SUPPLY CHAIN ANALYST</span>
                {aiReport && (
                  <span className="px-2 py-0.5 rounded bg-[#CFE3DC] text-[#0F2923]">
                    {aiReport.serverLatencyMs} ms · Conf {aiReport.confidenceScore}
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                {lang === 'en'
                  ? 'Real-Time AI Order Orchestration & Executive Dispatch Report'
                  : 'Phân Tích Điều Phối Đơn Hàng & Xuất Báo Cáo AI Thực Tế (Gemini 3.8 Flash)'}
              </h3>
              <p className="text-xs font-medium text-[#CFE3DC] mt-0.5">
                {lang === 'en'
                  ? 'Select a Nordic market and execute a real, non-looping Gemini AI analysis on current live stock balances.'
                  : 'Chọn quốc gia và nhấn chạy để AI phân tích trực tiếp số liệu tồn kho đang biến động và trả về báo cáo điều hành.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            <div className="flex items-center gap-1 bg-[#071411] p-1 rounded-xl border border-white/20">
              {(['SE', 'DK', 'NO'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedAiCountry(code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    selectedAiCountry === code
                      ? 'bg-[#CFE3DC] text-[#0F2923]'
                      : 'text-white hover:bg-white/15'
                  }`}
                >
                  {code === 'SE' ? '🇸🇪 SE' : code === 'DK' ? '🇩🇰 DK' : '🇳🇴 NO'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onRunGlobalRealAI(selectedAiCountry)}
              disabled={isRunningRealAI}
              className="px-4 py-2.5 rounded-xl bg-[#CFE3DC] hover:bg-white disabled:opacity-60 text-[#0F2923] text-xs font-extrabold flex items-center gap-2 transition-all shadow-md cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-[#0F2923]" />
              <span>
                {isRunningRealAI
                  ? lang === 'en'
                    ? `Gemini Thinking (${aiThinkingMs} ms)...`
                    : `AI Đang Phân Tích (${aiThinkingMs} ms)...`
                  : lang === 'en'
                  ? `Run Real AI Report (${selectedAiCountry})`
                  : `Chạy AI & Xuất Báo Cáo (${selectedAiCountry})`}
              </span>
            </button>
          </div>
        </div>

        {aiError && (
          <div className="mt-4 p-4 rounded-2xl bg-[#E05A47] text-white font-bold text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {isRunningRealAI && (
          <div className="mt-4 p-5 rounded-2xl bg-[#071713] border border-white/20 text-center space-y-1.5">
            <div className="font-mono-tabular text-2xl font-extrabold text-[#CFE3DC]">
              {aiThinkingMs} ms
            </div>
            <div className="text-xs font-bold text-white">
              {lang === 'en'
                ? `Executing live Gemini 3.8 Flash inference on ${selectedAiCountry} inventory & split-order routing...`
                : `Đang thực thi suy luận Gemini 3.8 Flash trên dữ liệu tồn kho thực tế của ${selectedAiCountry}...`}
            </div>
          </div>
        )}

        {aiReport && !isRunningRealAI && (
          <div className="mt-5 pt-5 border-t border-white/20 grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#CFE3DC]" />
                  <span className="text-sm font-extrabold text-white">
                    {aiReport.reportTitle}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-[#CFE3DC] text-[#0F2923] font-mono-tabular text-xs font-extrabold">
                  {aiReport.statusVerdict}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#071713] border border-[#CFE3DC]/40">
                <div className="text-[11px] font-mono-tabular font-extrabold uppercase text-[#CFE3DC] mb-1">
                  {lang === 'en'
                    ? 'AI EXECUTIVE SUMMARY'
                    : 'TÓM TẮT ĐIỀU HÀNH TỪ TRÍ TUỆ NHÂN TẠO'}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                  {aiReport.executiveSummary}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#CFE3DC] text-[#0F2923] border border-white">
                <div className="text-[11px] font-mono-tabular font-extrabold uppercase mb-1">
                  {lang === 'en'
                    ? 'FINANCIAL & DUAL-BRANCH KPI ATTRIBUTION'
                    : 'ĐÁNH GIÁ TÀI CHÍNH & ĐỒNG GHI NHẬN 100% KPI'}
                </div>
                <p className="text-xs font-extrabold leading-relaxed">
                  {aiReport.financialAndKpiImpact}
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 p-4 rounded-2xl bg-[#071713] border border-white/20 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono-tabular font-extrabold uppercase text-[#CFE3DC] mb-2.5">
                  {lang === 'en'
                    ? 'AI ACTIONABLE RECOMMENDATIONS'
                    : 'KHUYẾN NGHỊ HÀNH ĐỘNG TỨC THỜI TỪ AI'}
                </div>
                <div className="space-y-2">
                  {aiReport.actionableRecommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#0F2923] border border-white/15 flex items-start gap-2 text-xs font-semibold text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#CFE3DC] shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px] font-mono-tabular text-[#CFE3DC] font-bold">
                <span>Model: {aiReport.modelUsed}</span>
                <span>
                  Latency: {aiReport.serverLatencyMs} ms · {aiReport.generatedAt}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: INTERACTIVE NORDIC GEO-SPATIAL MAP + 3D SILO & WATERFALL CHARTS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT 6 COLS: INTERACTIVE NORDIC LOGISTICS & SPLIT-ROUTING MAP */}
        <div className="lg:col-span-6 surface-elevated border-2 border-[#13342D]/15 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#13342D]/15 pb-3.5 mb-4">
              <div>
                <div className="text-xs font-mono-tabular font-extrabold uppercase text-[#13342D]">
                  {lang === 'en'
                    ? 'LIVE NORDIC LOGISTICS TOPOLOGY · CLICK ANY HUB OR COUNTRY'
                    : 'BẢN ĐỒ TRỰC QUAN MẠNG LƯỚI KHO VẬN & ĐIỀU PHỐI BẮC ÂU'}
                </div>
                <h3 className="text-lg font-extrabold text-[#0F2923]">
                  {lang === 'en'
                    ? 'Interactive Scandinavian Fulfillment & Split-Order Map'
                    : 'Bản Đồ Điều Phối Tồn Kho Liên Chi Nhánh (SE · DK · NO)'}
                </h3>
              </div>
              <MapPin className="w-5 h-5 text-[#13342D]" />
            </div>

            {/* Interactive High-Contrast SVG Map of Nordics */}
            <div className="surface-dark-blueprint blueprint-grid rounded-2xl p-4 relative overflow-hidden border-2 border-[#13342D]">
              <svg
                className="w-full h-[320px]"
                viewBox="0 0 520 400"
                fill="none"
              >
                {/* Stylized Nordic Landmass Silhouettes */}
                <path
                  d="M 95 245 C 85 190, 115 130, 175 75 C 215 40, 260 25, 290 35 L 255 110 L 235 235 C 200 265, 130 275, 95 245 Z"
                  fill="rgba(142, 185, 172, 0.22)"
                  stroke="#CFE3DC"
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-[#8EB9AC]/40 transition-all"
                  onClick={() => onSelectCountryView('NO')}
                />
                <path
                  d="M 255 110 L 345 65 C 385 115, 395 210, 355 295 C 325 340, 280 350, 265 325 L 235 235 Z"
                  fill="rgba(207, 227, 220, 0.28)"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-[#CFE3DC]/45 transition-all"
                  onClick={() => onSelectCountryView('SE')}
                />
                <path
                  d="M 165 315 C 195 305, 245 325, 260 360 C 245 385, 185 388, 165 365 Z"
                  fill="rgba(142, 185, 172, 0.28)"
                  stroke="#CFE3DC"
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-[#8EB9AC]/45 transition-all"
                  onClick={() => onSelectCountryView('DK')}
                />

                {/* High-Contrast Country Pill Labels on Map */}
                <g
                  className="cursor-pointer"
                  onClick={() => onSelectCountryView('NO')}
                >
                  <rect
                    x="115"
                    y="115"
                    width="96"
                    height="24"
                    rx="6"
                    fill="#061310"
                    stroke="#CFE3DC"
                    strokeWidth="1.5"
                  />
                  <text
                    x="125"
                    y="131"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="Plus Jakarta Sans"
                  >
                    🇳🇴 NORWAY
                  </text>
                </g>

                <g
                  className="cursor-pointer"
                  onClick={() => onSelectCountryView('SE')}
                >
                  <rect
                    x="275"
                    y="105"
                    width="98"
                    height="24"
                    rx="6"
                    fill="#061310"
                    stroke="#CFE3DC"
                    strokeWidth="1.5"
                  />
                  <text
                    x="285"
                    y="121"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="Plus Jakarta Sans"
                  >
                    🇸🇪 SWEDEN
                  </text>
                </g>

                <g
                  className="cursor-pointer"
                  onClick={() => onSelectCountryView('DK')}
                >
                  <rect
                    x="335"
                    y="340"
                    width="108"
                    height="24"
                    rx="6"
                    fill="#061310"
                    stroke="#CFE3DC"
                    strokeWidth="1.5"
                  />
                  <text
                    x="345"
                    y="356"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="Plus Jakarta Sans"
                  >
                    🇩🇰 DENMARK
                  </text>
                </g>

                {/* Animated Split-Order Fulfillment Routes */}
                <defs>
                  <path id="routeSE" d="M 345 175 Q 385 210 355 245" />
                  <path id="routeDK" d="M 180 325 Q 220 305 255 350" />
                  <path id="routeNO" d="M 115 205 Q 170 175 225 220" />
                </defs>

                <use
                  href="#routeSE"
                  stroke="#FF8A75"
                  strokeWidth="3"
                  className="animate-packet-flow"
                />
                <use
                  href="#routeDK"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  className="animate-packet-flow"
                />
                <use
                  href="#routeNO"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  className="animate-packet-flow"
                />

                <circle r="4.5" fill="#FF8A75">
                  <animateMotion dur="1.4s" repeatCount="indefinite">
                    <mpath href="#routeSE" />
                  </animateMotion>
                </circle>
                <circle r="4" fill="#FFFFFF">
                  <animateMotion dur="1.6s" repeatCount="indefinite">
                    <mpath href="#routeDK" />
                  </animateMotion>
                </circle>
                <circle r="4" fill="#FFFFFF">
                  <animateMotion dur="1.8s" repeatCount="indefinite">
                    <mpath href="#routeNO" />
                  </animateMotion>
                </circle>

                {/* Plot the 6 Distribution Hubs with Solid High-Contrast Tags */}
                {mapHubs.map((hub) => {
                  const isHovered = hoveredHub === hub.branchId;
                  return (
                    <g
                      key={hub.branchId}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredHub(hub.branchId)}
                      onMouseLeave={() => setHoveredHub(null)}
                      onClick={() => onSelectCountryView(hub.country)}
                    >
                      <circle
                        cx={hub.x}
                        cy={hub.y}
                        r={isHovered ? 15 : 10}
                        fill={
                          hub.isPrimary
                            ? 'rgba(224, 90, 71, 0.45)'
                            : 'rgba(207, 227, 220, 0.35)'
                        }
                      />
                      <circle
                        cx={hub.x}
                        cy={hub.y}
                        r={isHovered ? 7 : 5.5}
                        fill={hub.isPrimary ? '#E05A47' : '#CFE3DC'}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <rect
                        x={hub.x + hub.labelOffsetX}
                        y={hub.y + hub.labelOffsetY}
                        width="60"
                        height="20"
                        rx="5"
                        fill="#061310"
                        stroke={hub.isPrimary ? '#FF8A75' : '#CFE3DC'}
                        strokeWidth="1.5"
                      />
                      <text
                        x={hub.x + hub.labelOffsetX + 8}
                        y={hub.y + hub.labelOffsetY + 14}
                        fill="#FFFFFF"
                        fontSize="11"
                        fontWeight="800"
                        fontFamily="JetBrains Mono"
                      >
                        {hub.branchId}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Map Legend Overlay */}
              <div className="mt-2 pt-3 border-t border-white/25 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-white">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#E05A47] border border-white inline-block" />
                    {lang === 'en'
                      ? 'Primary Hub (Demand Deficit)'
                      : 'Kho chính (Cần điều phối bổ sung)'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#CFE3DC] border border-white inline-block" />
                    {lang === 'en'
                      ? 'Secondary Hub (Split Supplier)'
                      : 'Kho dự phòng (Cấp bù tự động)'}
                  </span>
                </div>
                <span className="font-mono-tabular text-xs text-[#CFE3DC]">
                  {lang === 'en'
                    ? 'Click any hub to open Country Shell →'
                    : 'Nhấn vào kho để mở Tầng tích hợp →'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Quick-Action Country Buttons */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {(['SE', 'DK', 'NO'] as const).map((code) => {
              const s = getCountrySummary(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => onSelectCountryView(code)}
                  className="p-3.5 rounded-2xl bg-[#F4F7F5] hover:bg-[#CFE3DC] border-2 border-[#13342D]/20 text-left transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-extrabold text-[#0F2923]">
                      {code === 'SE'
                        ? '🇸🇪 Sweden'
                        : code === 'DK'
                        ? '🇩🇰 Denmark'
                        : '🇳🇴 Norway'}
                    </div>
                    <div className="text-xs font-mono-tabular font-bold text-[#13342D] mt-0.5">
                      ATP: {s.atp} · Buf: {s.pct}%
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#0F2923] shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT 6 COLS: VISUAL 3D WAREHOUSE SILOS & WATERFALL INVENTORY CHART */}
        <div className="lg:col-span-6 surface-elevated border-2 border-[#13342D]/15 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#13342D]/15 pb-3.5 mb-5">
              <div>
                <div className="text-xs font-mono-tabular font-extrabold uppercase text-[#13342D]">
                  {lang === 'en'
                    ? 'VISUAL CAPACITY SILOS & DEMAND BALANCING'
                    : 'BIỂU ĐỒ TRỰC QUAN THÁP TỒN KHO & CÂN ĐỐI CUNG - CẦU'}
                </div>
                <h3 className="text-lg font-extrabold text-[#0F2923]">
                  {lang === 'en'
                    ? 'Multi-Country Warehouse Silo Levels & Split-Order Analysis'
                    : 'Mức Tồn Kho Theo Quốc Gia & Tự Động Bù Đắp Thiếu Hụt B2B'}
                </h3>
              </div>
              <BarChart3 className="w-5 h-5 text-[#13342D]" />
            </div>

            {/* 3 VISUAL VERTICAL SILO COLUMNS FOR SWEDEN, DENMARK, NORWAY */}
            <div className="grid grid-cols-3 gap-4 mb-6 bg-[#F4F7F5] p-4 rounded-2xl border border-[#13342D]/20">
              {(
                [
                  { code: 'SE' as CountryCode, flag: '🇸🇪', label: 'Sweden (SE)' },
                  { code: 'DK' as CountryCode, flag: '🇩🇰', label: 'Denmark (DK)' },
                  { code: 'NO' as CountryCode, flag: '🇳🇴', label: 'Norway (NO)' },
                ] as const
              ).map((item) => {
                const sum = getCountrySummary(item.code);
                const maxScale = 900;
                const atpHeightPct = Math.round((sum.atp / maxScale) * 100);
                const bufHeightPct = Math.round((sum.buf / maxScale) * 100);
                const resHeightPct = Math.round((sum.res / maxScale) * 100);

                return (
                  <div
                    key={item.code}
                    onClick={() => onSelectCountryView(item.code)}
                    className="cursor-pointer bg-white rounded-2xl p-3.5 border-2 border-[#13342D]/15 hover:border-[#13342D] transition-all flex flex-col items-center"
                  >
                    <div className="text-xs font-extrabold text-[#0F2923] mb-2">
                      {item.flag} {item.label}
                    </div>

                    {/* Visual Vertical Warehouse Silo Tube */}
                    <div className="w-16 h-36 bg-[#EDF3F0] rounded-xl border-2 border-[#13342D]/30 p-1 flex flex-col justify-end overflow-hidden relative">
                      <div
                        className="w-full bg-[#E05A47] rounded-t-sm transition-all duration-300"
                        style={{ height: `${Math.max(5, resHeightPct)}%` }}
                        title={`Reserved: ${sum.res}`}
                      />
                      <div
                        className="w-full bg-buffer-stripes border-y border-[#13342D]/20 transition-all duration-300"
                        style={{ height: `${Math.max(7, bufHeightPct)}%` }}
                        title={`Safety Buffer: ${sum.buf}`}
                      />
                      <div
                        className="w-full bg-[#13342D] rounded-b-md transition-all duration-300"
                        style={{ height: `${Math.max(18, atpHeightPct)}%` }}
                        title={`Net ATP: ${sum.atp}`}
                      />
                    </div>

                    <div className="mt-2.5 text-center font-mono-tabular">
                      <div className="text-base font-extrabold text-[#0F2923]">
                        {sum.atp}{' '}
                        <span className="text-xs font-bold text-[#13342D]">
                          ATP
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-[#13342D]">
                        Phys: {sum.phys} · Buf: −{sum.buf}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Split-Order Visual Gauge Bars */}
            <div className="space-y-3">
              {(['SE', 'DK', 'NO'] as const).map((code) => {
                const scen = ORDER_SCENARIOS[code];
                const primaryStock = branchStocks.find(
                  (s) =>
                    s.branchId === scen.primaryBranchId &&
                    s.globalSku === scen.globalSku
                );
                const primaryAtp = primaryStock ? getStockCalc(primaryStock).atp : 0;
                const primaryAlloc = Math.min(scen.requestedBaseQty, primaryAtp);
                const splitAlloc = Math.max(0, scen.requestedBaseQty - primaryAlloc);
                const primaryPct = Math.round(
                  (primaryAlloc / scen.requestedBaseQty) * 100
                );
                const splitPct = 100 - primaryPct;

                return (
                  <div
                    key={scen.id}
                    onClick={() => onSelectCountryView(code)}
                    className="cursor-pointer p-3.5 rounded-2xl bg-[#F4F7F5] hover:bg-[#CFE3DC]/50 border border-[#13342D]/20 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-[#0F2923] mb-1.5">
                      <span>
                        {code === 'SE' ? '🇸🇪' : code === 'DK' ? '🇩🇰' : '🇳🇴'}{' '}
                        {scen.contractorName} ({scen.requestedBaseQty} Units)
                      </span>
                      <span className="font-mono-tabular px-2 py-0.5 rounded bg-[#E05A47] text-white font-bold">
                        {splitAlloc > 0
                          ? `${primaryAlloc} (${scen.primaryBranchId}) + ${splitAlloc} (${scen.backupBranchId})`
                          : '100% Primary Hub'}
                      </span>
                    </div>

                    <div className="w-full h-3.5 bg-white rounded-full overflow-hidden flex border border-[#13342D]/25">
                      <div
                        className="bg-[#13342D] h-full transition-all duration-300"
                        style={{ width: `${primaryPct}%` }}
                      />
                      <div
                        className="bg-[#E05A47] h-full transition-all duration-300"
                        style={{ width: `${splitPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#13342D]/15 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#13342D]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-xs bg-[#13342D] inline-block" />
                {lang === 'en' ? 'Primary ATP' : 'Khả dụng Kho chính'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-xs bg-buffer-stripes border border-[#13342D]/30 inline-block" />
                {lang === 'en' ? 'Safety Buffer' : 'Định mức dự phòng'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-xs bg-[#E05A47] inline-block" />
                {lang === 'en' ? 'Split / Reserved' : 'Bù thiếu hụt / Tạm giữ'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: VISUAL MASTER CROSS-REFERENCE MATRIX */}
      <section className="surface-elevated border-2 border-[#13342D]/15 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#13342D]/15 pb-4 mb-5">
          <div>
            <div className="text-xs font-mono-tabular font-extrabold uppercase text-[#13342D]">
              {lang === 'en'
                ? 'MASTER CROSS-REFERENCE & UNIT HARMONIZATION ENGINE'
                : 'BẢNG ĐỐI CHIẾU & QUY ĐỔI ĐƠN VỊ TỰ ĐỘNG TOÀN KHỐI'}
            </div>
            <h3 className="text-xl font-extrabold text-[#0F2923]">
              {lang === 'en'
                ? 'Canonical Global SKU Mapping Across Sweden, Denmark & Norway'
                : 'Ánh Xạ Danh Mục Vật Tư Chuẩn Hóa Xuyên Biên Giới (SE · DK · NO → Global)'}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#F4F7F5] rounded-xl border border-[#13342D]/20 self-start">
            <button
              type="button"
              onClick={() => setLedgerTab('xref')}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-colors ${
                ledgerTab === 'xref'
                  ? 'bg-[#13342D] text-white'
                  : 'text-[#13342D] hover:bg-[#CFE3DC]'
              }`}
            >
              {lang === 'en'
                ? '1. Visual Cross-Reference Matrix'
                : '1. Ma Trận Quy Đổi Trực Quan'}
            </button>
            <button
              type="button"
              onClick={() => setLedgerTab('schema')}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-colors ${
                ledgerTab === 'schema'
                  ? 'bg-[#13342D] text-white'
                  : 'text-[#13342D] hover:bg-[#CFE3DC]'
              }`}
            >
              {lang === 'en'
                ? '2. Canonical SQL Schema'
                : '2. Lược Đồ Cơ Sở Dữ Liệu Global'}
            </button>
          </div>
        </div>

        {ledgerTab === 'xref' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.map((mat) => {
              const summary = getMaterialSummary(mat.globalSku);
              return (
                <div
                  key={mat.globalSku}
                  className="p-5 rounded-2xl bg-[#F4F7F5] border-2 border-[#13342D]/15 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="font-mono-tabular text-xs font-extrabold px-2.5 py-1 rounded-md bg-[#13342D] text-white">
                          {mat.globalSku}
                        </span>
                        <h4 className="text-base font-extrabold text-[#0F2923] mt-1.5">
                          {lang === 'en' ? mat.nameEn : mat.nameVi}
                        </h4>
                      </div>
                      <div className="text-right font-mono-tabular">
                        <div className="text-xl font-extrabold text-[#0F2923]">
                          {summary.atp.toLocaleString()}
                        </div>
                        <div className="text-xs font-bold text-[#13342D]">
                          {lang === 'en' ? mat.baseUnitEn : mat.baseUnitVi} ATP
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs font-mono-tabular">
                      {(['SE', 'DK', 'NO'] as const).map((c) => {
                        const m = mat.mappings[c];
                        const cAtp = summary.byCountry[c];
                        return (
                          <div
                            key={c}
                            onClick={() => onSelectCountryView(c)}
                            className="cursor-pointer bg-white p-3 rounded-xl border border-[#13342D]/20 hover:border-[#13342D] flex items-center justify-between gap-2 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <span>
                                {c === 'SE' ? '🇸🇪' : c === 'DK' ? '🇩🇰' : '🇳🇴'}
                              </span>
                              <span className="font-extrabold text-[#0F2923]">
                                {m.localSku}
                              </span>
                              <span className="font-semibold text-[#13342D]">
                                ({m.conversionRule})
                              </span>
                            </div>
                            <span className="font-extrabold text-[#0F2923] bg-[#CFE3DC] px-2 py-0.5 rounded">
                              ATP: {cAtp}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <pre className="bg-[#0F2923] text-white p-5 rounded-2xl text-xs font-mono-tabular overflow-x-auto leading-relaxed">
            {GLOBAL_SCHEMA_DDL}
          </pre>
        )}
      </section>
    </div>
  );
};
