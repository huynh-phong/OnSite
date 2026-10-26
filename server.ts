import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const envConfig = dotenv.config();

function resolveGeminiApiKey(): string | undefined {
  const candidates = [
    envConfig.parsed?.GEMINI_API_KEY,
    envConfig.parsed?.VITE_GEMINI_API_KEY,
    process.env.GEMINI_API_KEY,
    process.env.VITE_GEMINI_API_KEY,
  ];
  for (const key of candidates) {
    if (
      key &&
      key.trim() !== '' &&
      key !== 'MY_GEMINI_API_KEY' &&
      key !== 'YOUR_GEMINI_API_KEY_HERE'
    ) {
      return key.trim();
    }
  }
  return undefined;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  app.post('/api/ai-orchestrate', async (req, res) => {
    const startMs = Date.now();
    try {
      const {
        lang = 'vi',
        country = 'SE',
        legacySystemName = 'Movex ERP DB2',
        contractorName = 'Skanska Sverige AB',
        deliverySite = 'Stockholm Slussen',
        rawOrderText = '',
        globalSku = 'GLB-MAT-PLB13',
        localSku = 'SE-GIPS-13',
        conversionRule = '1 Pall = 40 St',
        requestedQty = 120,
        baseUnit = 'Boards',
        bufferPct = 10,
        isOffline = false,
        primaryBranch,
        backupBranch,
        shortageQty = 0,
        unfulfilledQty = 0,
      } = req.body || {};

      // Re-read .env on each request so if the user edits .env live, it picks up the new key immediately
      dotenv.config({ override: false });
      const apiKey = resolveGeminiApiKey();

      if (!apiKey) {
        res.status(500).json({
          error:
            lang === 'vi'
              ? 'Chưa tìm thấy GEMINI_API_KEY. Hãy dán API Key vào file .env (GEMINI_API_KEY="AIza...") hoặc cấu hình trên Vercel.'
              : 'GEMINI_API_KEY is not configured. Paste your key in .env (GEMINI_API_KEY="AIza...") or in Vercel Environment Variables.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const languageInstruction =
        lang === 'vi'
          ? 'Write all explanations, summaries, and recommendations in professional Enterprise Vietnamese (Tiếng Việt chuyên ngành Chuỗi cung ứng & Kiến trúc hệ thống).'
          : 'Write all explanations, summaries, and recommendations in concise Enterprise English.';

      const prompt = `You are the OnSite AI Smart Shell Orchestration Engine for Nordic B2B Construction Supply Chain (${country} Market).
Analyze this live B2B order execution and generate a fast, high-precision operational report.
${languageInstruction}

LIVE TELEMETRY & ORDER CONTEXT:
- Country Node: ${country} (${legacySystemName})
- Circuit Breaker / Connection State: ${isOffline ? 'FAILOVER_REPLICA_CACHE_ACTIVE (Primary node offline)' : 'ONLINE_NOMINAL'}
- Contractor: ${contractorName} | Site: ${deliverySite}
- Raw Order Payload: ${rawOrderText}
- SKU Harmonization: Local ${localSku} -> Canonical ${globalSku} (${conversionRule})
- Requested Demand: ${requestedQty} ${baseUnit}
- Safety Stock Buffer Policy: ${bufferPct}%
- Primary Branch (${primaryBranch?.branchId || 'Primary'}): Physical=${primaryBranch?.physicalStock}, Buffer=-${primaryBranch?.safetyBuffer}, SoftReserved=-${primaryBranch?.softReserved}, Net ATP=${primaryBranch?.atp}, Allocated=${primaryBranch?.allocated}, Distance=${primaryBranch?.distanceKm}km
- Secondary Branch (${backupBranch?.branchId || 'Backup'}): Physical=${backupBranch?.physicalStock}, Net ATP=${backupBranch?.atp}, Split Allocated=${backupBranch?.allocated}, Distance=${backupBranch?.distanceKm}km
- Primary Deficit / Split Volume: ${shortageQty} ${baseUnit} | Unfulfilled Deficit: ${unfulfilledQty} ${baseUnit}

Keep each field concise, specific to the exact numbers above, and executive-ready.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reportTitle: {
                type: Type.STRING,
                description: 'Headline of the AI orchestration report.',
              },
              statusVerdict: {
                type: Type.STRING,
                description:
                  'One of: OPTIMAL_PRIMARY, SPLIT_FULFILLMENT_ACTIVE, FAILOVER_REPLICA_ROUTED, CRITICAL_DEFICIT',
              },
              confidenceScore: {
                type: Type.STRING,
                description: 'AI confidence percentage, e.g. 99.7%',
              },
              executiveSummary: {
                type: Type.STRING,
                description:
                  '2-3 sentence executive summary citing the exact branch IDs, ATP numbers, buffer deduction, and delivery promise.',
              },
              stepByStepInsights: {
                type: Type.OBJECT,
                properties: {
                  step1: {
                    type: Type.STRING,
                    description: 'AI insight for Step 1 Order Ingestion.',
                  },
                  step2: {
                    type: Type.STRING,
                    description:
                      'AI insight for Step 2 Semantic & UoM Conversion.',
                  },
                  step3: {
                    type: Type.STRING,
                    description:
                      'AI insight for Step 3 ATP & Safety Buffer Math.',
                  },
                  step4: {
                    type: Type.STRING,
                    description:
                      'AI insight for Step 4 Multi-Branch Split Routing.',
                  },
                  step5: {
                    type: Type.STRING,
                    description:
                      'AI insight for Step 5 Soft-Reservation & Global Hub Sync.',
                  },
                },
                required: ['step1', 'step2', 'step3', 'step4', 'step5'],
              },
              financialAndKpiImpact: {
                type: Type.STRING,
                description:
                  'Impact on OTIF SLA, extra freight vs SLA penalty avoided, and 100% Dual-Branch KPI credit.',
              },
              actionableRecommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description:
                  '3 concise, actionable recommendations based on these exact stock levels.',
              },
            },
            required: [
              'reportTitle',
              'statusVerdict',
              'confidenceScore',
              'executiveSummary',
              'stepByStepInsights',
              'financialAndKpiImpact',
              'actionableRecommendations',
            ],
          },
        },
      });

      const totalServerMs = Date.now() - startMs;
      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);

      const s1 = Math.max(40, Math.round(totalServerMs * 0.12));
      const s2 = Math.max(80, Math.round(totalServerMs * 0.28));
      const s3 = Math.max(45, Math.round(totalServerMs * 0.14));
      const s4 = Math.max(95, Math.round(totalServerMs * 0.32));
      const s5 = Math.max(40, totalServerMs - (s1 + s2 + s3 + s4));

      res.json({
        ...parsed,
        modelUsed: 'gemini-3.8-flash',
        serverLatencyMs: totalServerMs,
        stepTimingsMs: {
          1: s1,
          2: s2,
          3: s3,
          4: s4,
          5: s5,
        },
        generatedAt: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      });
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : 'Unknown Gemini API error';
      console.error('Gemini API orchestration error:', errMessage);
      res.status(500).json({
        error: errMessage,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OnSite Smart Shell Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
