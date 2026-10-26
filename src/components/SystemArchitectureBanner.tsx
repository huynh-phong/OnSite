import React from 'react';
import {
  Globe,
  Cpu,
  Send,
  BarChart3,
  Wifi,
  WifiOff,
  Layers,
  Activity,
  Pause,
  Play,
} from 'lucide-react';
import {
  BranchStock,
  CountryCode,
  GlobalMaterial,
  Language,
  WorkspaceView,
} from '../data/onsiteData';

interface SystemArchitectureBannerProps {
  lang: Language;
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  offlineNodes: Record<CountryCode, boolean>;
  onToggleOfflineNode: (country: CountryCode) => void;
  materials: GlobalMaterial[];
  branchStocks: BranchStock[];
  countryBufferPct: Record<CountryCode, number>;
  onManualSyncShellToGlobal: (country: CountryCode) => void;
  shellSyncStatus: Record<
    CountryCode,
    { syncing: boolean; lastMs: number; lastTime: string; lastDeltaText?: string }
  >;
  isLiveStreamActive: boolean;
  onToggleLiveStream: () => void;
  liveTxCount: number;
}

export const SystemArchitectureBanner: React.FC<SystemArchitectureBannerProps> = ({
  lang,
  activeView,
  onSelectView,
  offlineNodes,
  onToggleOfflineNode,
  branchStocks,
  countryBufferPct,
  onManualSyncShellToGlobal,
  shellSyncStatus,
  isLiveStreamActive,
  onToggleLiveStream,
  liveTxCount,
}) => {
  const getCountryTotals = (country: CountryCode) => {
    const stocks = branchStocks.filter((s) => s.country === country);
    const pct = offlineNodes[country]
      ? Math.max(15, countryBufferPct[country])
      : countryBufferPct[country];
    let physical = 0;
    let buffer = 0;
    let reserved = 0;
    let atp = 0;
    stocks.forEach((s) => {
      const itemBuf = Math.ceil((s.physicalStock * pct) / 100);
      const itemAtp = Math.max(0, s.physicalStock - itemBuf - s.softReserved);
      physical += s.physicalStock;
      buffer += itemBuf;
      reserved += s.softReserved;
      atp += itemAtp;
    });
    return { physical, buffer, reserved, atp, pct };
  };

  const seTotals = getCountryTotals('SE');
  const dkTotals = getCountryTotals('DK');
  const noTotals = getCountryTotals('NO');
  const globalTotalAtp = seTotals.atp + dkTotals.atp + noTotals.atp;
  const globalTotalPhysical =
    seTotals.physical + dkTotals.physical + noTotals.physical;
  const globalTotalBuffer =
    seTotals.buffer + dkTotals.buffer + noTotals.buffer;

  const countryNodes: Array<{
    code: CountryCode;
    flag: string;
    nameEn: string;
    nameVi: string;
    legacySystem: string;
    conversionBadge: string;
    rawSample: string;
    encodedSample: string;
    totals: {
      physical: number;
      buffer: number;
      reserved: number;
      atp: number;
      pct: number;
    };
  }> = [
    {
      code: 'SE',
      flag: '🇸🇪',
      nameEn: 'SWEDEN (SE)',
      nameVi: 'THỤY ĐIỂN (SE)',
      legacySystem: 'Movex ERP DB2',
      conversionBadge: '1 Pall × 40 = 40 Bags',
      rawSample: 'SE-GIPS-13',
      encodedSample: 'GLB-MAT-PLB13',
      totals: seTotals,
    },
    {
      code: 'DK',
      flag: '🇩🇰',
      nameEn: 'DENMARK (DK)',
      nameVi: 'ĐAN MẠCH (DK)',
      legacySystem: 'Dynamics NAV SQL',
      conversionBadge: '1 Bundt × 20 = 20 Boards',
      rawSample: 'DK-CEM-01',
      encodedSample: 'GLB-MAT-CEM25',
      totals: dkTotals,
    },
    {
      code: 'NO',
      flag: '🇳🇴',
      nameEn: 'NORWAY (NO)',
      nameVi: 'NA UY (NO)',
      legacySystem: 'Lindbak POS XML',
      conversionBadge: '1 Ton × 40 = 40 Bags',
      rawSample: 'NO-MUR-250',
      encodedSample: 'GLB-MAT-CEM25',
      totals: noTotals,
    },
  ];

  return (
    <section id="architecture-overview" className="mb-8">
      <div className="bg-[#0F2923] surface-dark-blueprint blueprint-grid rounded-3xl p-6 sm:p-8 text-white border-2 border-[#13342D] relative overflow-hidden">
        {/* Top Control Bar inside Blueprint Canvas */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/25 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#CFE3DC] text-[#0F2923] text-xs font-mono-tabular font-extrabold uppercase tracking-wider shadow-sm">
                <Layers className="w-4 h-4 text-[#0F2923] shrink-0" />
                <span className="text-[#0F2923] font-extrabold">
                  {lang === 'en'
                    ? 'INTERACTIVE 3D-LAYERED ARCHITECTURE TOPOLOGY · CLICK ANY NODE TO EXPLORE'
                    : 'MÔ HÌNH TRỰC QUAN KIẾN TRÚC 3 TẦNG TÍCH HỢP · NHẤN VÀO TỪNG KHỐI ĐỂ ĐIỀU HÀNH'}
                </span>
              </div>

              {/* Live Multi-Country Heartbeat Toggle Badge */}
              <button
                type="button"
                onClick={onToggleLiveStream}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono-tabular font-extrabold border transition-all cursor-pointer ${
                  isLiveStreamActive
                    ? 'bg-[#163D35] text-white border-[#CFE3DC]'
                    : 'bg-[#071411] text-[#CFE3DC] border-white/25'
                }`}
              >
                <Activity
                  className={`w-3.5 h-3.5 ${
                    isLiveStreamActive ? 'text-[#CFE3DC] animate-pulse' : 'text-white/60'
                  }`}
                />
                <span>
                  {isLiveStreamActive
                    ? lang === 'en'
                      ? `LIVE ERP/POS HEARTBEAT: ON (${liveTxCount} events)`
                      : `LUỒNG VẬN HÀNH THỰC TẾ 3 NƯỚC: ĐANG CHẠY (${liveTxCount} biến động)`
                    : lang === 'en'
                    ? 'LIVE ERP/POS HEARTBEAT: PAUSED'
                    : 'LUỒNG VẬN HÀNH THỰC TẾ: TẠM DỪNG'}
                </span>
                {isLiveStreamActive ? (
                  <Pause className="w-3 h-3 text-[#CFE3DC]" />
                ) : (
                  <Play className="w-3 h-3 text-[#CFE3DC]" />
                )}
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {lang === 'en'
                ? 'OnSite — Non-Invasive "Smart Shell" Integration Architecture'
                : 'OnSite — Kiến Trúc Tầng Tích Hợp Thông Minh "Smart Shell" Đa Quốc Gia'}
            </h1>
          </div>

          {/* Interactive Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-[#071411] p-1.5 rounded-2xl border border-white/25 self-start">
            <button
              type="button"
              onClick={() => onSelectView('GLOBAL')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeView === 'GLOBAL'
                  ? 'bg-[#CFE3DC] text-[#0F2923] shadow-md'
                  : 'text-white hover:bg-white/15'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>
                {lang === 'en'
                  ? '🌐 Global Analytics Hub'
                  : '🌐 Trung Tâm Phân Tích Tổng Global'}
              </span>
            </button>

            {(['SE', 'DK', 'NO'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onSelectView(code)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 ${
                  activeView === code
                    ? 'bg-[#CFE3DC] text-[#0F2923] shadow-md'
                    : 'text-white hover:bg-white/15'
                }`}
              >
                {code === 'SE'
                  ? lang === 'en'
                    ? '🇸🇪 Sweden Shell'
                    : '🇸🇪 Hệ Thống Thụy Điển'
                  : code === 'DK'
                  ? lang === 'en'
                    ? '🇩🇰 Denmark Shell'
                    : '🇩🇰 Hệ Thống Đan Mạch'
                  : lang === 'en'
                  ? '🇳🇴 Norway Shell'
                  : '🇳🇴 Hệ Thống Na Uy'}
              </button>
            ))}
          </div>
        </div>

        {/* VISUAL ARCHITECTURE CANVAS: 3 CONCENTRIC SMART SHELLS -> ANIMATED PIPELINES -> GLOBAL UNIFIED HUB */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          {/* LEFT 7 COLUMNS: 3 CONCENTRIC SMART SHELL DIAGRAMS (SE, DK, NO) */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-4">
            {countryNodes.map((node) => {
              const isSelected = activeView === node.code;
              const isOffline = offlineNodes[node.code];
              const syncInfo = shellSyncStatus[node.code];
              const atpPercent =
                node.totals.physical > 0
                  ? Math.round((node.totals.atp / node.totals.physical) * 100)
                  : 0;
              // Circumference for r=48 is 2 * pi * 48 = 301.6
              const strokeDash = `${(atpPercent / 100) * 301.6} 301.6`;

              return (
                <div
                  key={node.code}
                  onClick={() => onSelectView(node.code)}
                  className={`cursor-pointer rounded-2xl p-4 transition-all relative flex flex-col justify-between border-2 ${
                    isSelected
                      ? 'bg-[#163D35] border-[#CFE3DC] shadow-[0_0_28px_rgba(207,227,220,0.3)]'
                      : isOffline
                      ? 'bg-[#2A1210] border-[#E05A47]'
                      : syncInfo.syncing
                      ? 'bg-[#18433A] border-[#CFE3DC]'
                      : 'bg-[#0B201B] hover:bg-[#12312A] border-white/25 hover:border-[#CFE3DC]'
                  }`}
                >
                  {/* Top Bar of Country Shell Node */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{node.flag}</span>
                      <span className="text-xs font-extrabold tracking-wide text-white">
                        {lang === 'en' ? node.nameEn : node.nameVi}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleOfflineNode(node.code);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 transition-colors ${
                        isOffline
                          ? 'bg-[#E05A47] text-white'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {isOffline ? (
                        <WifiOff className="w-3 h-3" />
                      ) : (
                        <Wifi className="w-3 h-3" />
                      )}
                      <span>{isOffline ? 'Failover' : 'Online'}</span>
                    </button>
                  </div>

                  {/* CONCENTRIC VISUAL DIAGRAM: LEGACY DB CORE INSIDE PROTECTIVE SMART SHELL RING */}
                  <div className="relative mx-auto my-2 w-48 h-48 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 136 136">
                      {/* Outer Protective Smart Shell Dashed Orbit Ring (r=62) */}
                      <circle
                        cx="68"
                        cy="68"
                        r="62"
                        fill="none"
                        stroke={isOffline ? '#FF8A75' : '#8EB9AC'}
                        strokeWidth="1.5"
                        strokeDasharray="6 4"
                        className="animate-ring-spin"
                      />

                      {/* Middle Radial ATP Capacity Gauge Track (r=48) */}
                      <circle
                        cx="68"
                        cy="68"
                        r="48"
                        fill="#061310"
                        stroke="rgba(255,255,255,0.18)"
                        strokeWidth="8"
                      />

                      {/* Active Radial ATP Gauge Arc (r=48) */}
                      <circle
                        cx="68"
                        cy="68"
                        r="48"
                        fill="none"
                        stroke={isOffline ? '#E05A47' : '#CFE3DC'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={strokeDash}
                        transform="rotate(-90 68 68)"
                        className="transition-all duration-500"
                      />

                      {/* Orbiting Smart Shell Node Dots */}
                      <g className="animate-ring-spin-reverse">
                        <circle
                          cx="68"
                          cy="6"
                          r="4"
                          fill={isOffline ? '#FF8A75' : '#CFE3DC'}
                        />
                        <circle
                          cx="68"
                          cy="130"
                          r="4"
                          fill={isOffline ? '#FF8A75' : '#8EB9AC'}
                        />
                      </g>
                    </svg>

                    {/* INNER CORE: LEGACY SYSTEM CYLINDER */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <div className="w-[116px] flex flex-col items-center justify-center">
                        <span className="text-[9px] font-mono-tabular font-bold text-[#8EB9AC] uppercase tracking-wider">
                          {lang === 'en' ? 'LEGACY CORE' : 'LÕI HỆ THỐNG'}
                        </span>
                        <span className="text-[11px] font-extrabold text-white leading-tight mt-0.5">
                          {node.legacySystem}
                        </span>
                        <div className="font-mono-tabular text-base font-extrabold text-[#CFE3DC] mt-1 transition-all">
                          {node.totals.atp}
                          <span className="text-[11px] font-semibold text-white/85">
                            /{node.totals.physical}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono-tabular font-bold text-white mt-0.5">
                          ATP {atpPercent}% · Buf {node.totals.pct}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* OUTER SHELL ENCODING BADGES (High Contrast + Live Delta Indicator) */}
                  <div className="bg-[#061310] border border-white/20 rounded-xl p-3 text-xs font-mono-tabular space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-extrabold text-white flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-[#CFE3DC]" />
                        {node.code} Smart Shell
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-white/15 text-[#CFE3DC] font-extrabold text-[11px]">
                        {syncInfo.lastMs}ms
                      </span>
                    </div>
                    <div className="text-white font-semibold truncate">
                      {syncInfo.lastDeltaText
                        ? `⚡ ${syncInfo.lastDeltaText}`
                        : `⚡ ${node.conversionBadge}`}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/15">
                      <span className="px-1.5 py-0.5 rounded bg-[#E05A47] text-white font-bold">
                        {node.rawSample}
                      </span>
                      <span className="text-white font-bold">→</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#CFE3DC] text-[#0F2923] font-extrabold">
                        {node.encodedSample}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Bottom Action */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-white">
                      {isSelected
                        ? lang === 'en'
                          ? '● Active View'
                          : '● Đang mở'
                        : lang === 'en'
                        ? 'Inspect Shell →'
                        : 'Mở Tầng Tích Hợp →'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onManualSyncShellToGlobal(node.code);
                      }}
                      className="px-3 py-1 rounded-lg bg-[#CFE3DC] hover:bg-white text-[#0F2923] text-xs font-extrabold flex items-center gap-1 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>
                        {syncInfo.syncing
                          ? '...'
                          : lang === 'en'
                          ? 'Sync'
                          : 'Đồng bộ'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MIDDLE 1 COLUMN: ANIMATED DATA STREAM PIPELINES WITH MOVING PACKETS */}
          <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
            <svg className="w-24 h-64" viewBox="0 0 100 260" fill="none">
              <defs>
                <path id="streamTop" d="M 4 45 C 50 45, 50 130, 96 130" />
                <path id="streamMid" d="M 4 130 L 96 130" />
                <path id="streamBot" d="M 4 215 C 50 215, 50 130, 96 130" />
              </defs>

              <use
                href="#streamTop"
                stroke={offlineNodes.SE ? '#FF8A75' : '#CFE3DC'}
                strokeWidth="3"
                className="animate-packet-flow"
              />
              <use
                href="#streamMid"
                stroke={offlineNodes.DK ? '#FF8A75' : '#CFE3DC'}
                strokeWidth="3"
                className="animate-packet-flow"
              />
              <use
                href="#streamBot"
                stroke={offlineNodes.NO ? '#FF8A75' : '#CFE3DC'}
                strokeWidth="3"
                className="animate-packet-flow"
              />

              <circle r="5" fill="#FFFFFF">
                <animateMotion dur="1.5s" repeatCount="indefinite">
                  <mpath href="#streamTop" />
                </animateMotion>
              </circle>
              <circle r="5" fill="#FFFFFF">
                <animateMotion dur="1.2s" repeatCount="indefinite">
                  <mpath href="#streamMid" />
                </animateMotion>
              </circle>
              <circle r="5" fill="#FFFFFF">
                <animateMotion dur="1.7s" repeatCount="indefinite">
                  <mpath href="#streamBot" />
                </animateMotion>
              </circle>

              <circle cx="94" cy="130" r="6" fill="#FFFFFF" />
            </svg>
          </div>

          {/* RIGHT 4 COLUMNS: CENTRAL GLOBAL UNIFIED HUB (High Contrast White/Mint Card) */}
          <div className="lg:col-span-4">
            <div
              onClick={() => onSelectView('GLOBAL')}
              className={`cursor-pointer rounded-3xl p-6 border-2 transition-all relative overflow-hidden bg-white text-[#0F2923] ${
                activeView === 'GLOBAL'
                  ? 'border-[#CFE3DC] shadow-[0_0_40px_rgba(207,227,220,0.45)]'
                  : 'border-white/60 hover:border-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#13342D] text-[#CFE3DC]">
                    <Globe className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono-tabular font-extrabold uppercase text-[#13342D]/80">
                      {lang === 'en'
                        ? 'UNIFIED ENTERPRISE CORE'
                        : 'TRUNG TÂM DỮ LIỆU ĐỒNG NHẤT'}
                    </div>
                    <h2 className="text-xl font-extrabold leading-tight text-[#0F2923]">
                      GLOBAL UNIFIED HUB
                    </h2>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-lg text-xs font-mono-tabular font-extrabold bg-[#13342D] text-white">
                  &lt; 500ms SLA
                </span>
              </div>

              {/* Visual Stacked Progress Bar inside Global Hub */}
              <div className="p-4 rounded-2xl mb-4 bg-[#13342D] text-white">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs text-[#CFE3DC] font-bold">
                    {lang === 'en'
                      ? 'Real-Time Harmonized Global ATP'
                      : 'Tổng Tồn Kho Khả Dụng Toàn Khối (ATP)'}
                  </span>
                  <span className="font-mono-tabular text-2xl font-extrabold text-white">
                    {globalTotalAtp.toLocaleString()}{' '}
                    <span className="text-xs font-semibold text-[#CFE3DC]">
                      Units
                    </span>
                  </span>
                </div>

                {/* 3-Country Contribution Visual Bar */}
                <div className="w-full h-3.5 bg-white/20 rounded-full overflow-hidden flex my-2.5">
                  <div
                    className="bg-[#8EB9AC] h-full transition-all duration-500"
                    style={{
                      width: `${Math.round(
                        (seTotals.atp / Math.max(1, globalTotalAtp)) * 100
                      )}%`,
                    }}
                  />
                  <div
                    className="bg-[#CFE3DC] h-full transition-all duration-500"
                    style={{
                      width: `${Math.round(
                        (dkTotals.atp / Math.max(1, globalTotalAtp)) * 100
                      )}%`,
                    }}
                  />
                  <div
                    className="bg-white h-full transition-all duration-500"
                    style={{
                      width: `${Math.round(
                        (noTotals.atp / Math.max(1, globalTotalAtp)) * 100
                      )}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono-tabular font-bold text-white pt-1">
                  <div>🇸🇪 SE: {seTotals.atp}</div>
                  <div>🇩🇰 DK: {dkTotals.atp}</div>
                  <div>🇳🇴 NO: {noTotals.atp}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono-tabular mb-3">
                <div className="p-3 rounded-xl bg-[#F4F7F5] border border-[#13342D]/20">
                  <div className="text-xs font-bold text-[#13342D]">
                    {lang === 'en' ? 'Raw Physical Total' : 'Tổng Tồn Vật Lý'}
                  </div>
                  <div className="text-lg font-extrabold text-[#0F2923] mt-0.5">
                    {globalTotalPhysical.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#F4F7F5] border border-[#13342D]/20">
                  <div className="text-xs font-bold text-[#13342D]">
                    {lang === 'en' ? 'Protected Buffer' : 'Tổng Dự Phòng An Toàn'}
                  </div>
                  <div className="text-lg font-extrabold text-[#0F2923] mt-0.5">
                    −{globalTotalBuffer.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-extrabold pt-2.5 border-t border-[#13342D]/15 text-[#13342D]">
                <span>
                  {activeView === 'GLOBAL'
                    ? lang === 'en'
                      ? '● Viewing Global Analytics Dashboard Below'
                      : '● Đang hiển thị Bảng Phân Tích Tổng bên dưới'
                    : lang === 'en'
                    ? 'Click to Return to Global Analytics →'
                    : 'Nhấn để mở Bảng Phân Tích Tổng Global →'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
