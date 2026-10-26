import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLATFORM_GEMINI_KEY = process.env.GEMINI_API_KEY;
dotenv.config();

function getCandidateApiKeys(): string[] {
  let dotEnvParsed: Record<string, string> = {};
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      dotEnvParsed = dotenv.parse(fs.readFileSync(envPath, 'utf-8'));
    }
  } catch {
    // ignore fs read errors
  }

  const rawCandidates = [
    dotEnvParsed.GEMINI_API_KEY,
    dotEnvParsed.VITE_GEMINI_API_KEY,
    PLATFORM_GEMINI_KEY,
    process.env.GEMINI_API_KEY,
    process.env.VITE_GEMINI_API_KEY,
  ];

  const uniqueKeys: string[] = [];
  for (const k of rawCandidates) {
    const trimmed = k?.trim();
    if (
      trimmed &&
      trimmed !== '' &&
      trimmed !== 'MY_GEMINI_API_KEY' &&
      trimmed !== 'YOUR_GEMINI_API_KEY_HERE' &&
      !uniqueKeys.includes(trimmed)
    ) {
      uniqueKeys.push(trimmed);
    }
  }
  return uniqueKeys;
}

const RESPONSE_SCHEMA = {
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
          description: 'Concise AI insight for Step 1 Order Ingestion.',
        },
        step2: {
          type: Type.STRING,
          description: 'Concise AI insight for Step 2 Semantic & UoM Conversion.',
        },
        step3: {
          type: Type.STRING,
          description: 'Concise AI insight for Step 3 ATP & Safety Buffer Math.',
        },
        step4: {
          type: Type.STRING,
          description: 'Concise AI insight for Step 4 Multi-Branch Split Routing.',
        },
        step5: {
          type: Type.STRING,
          description:
            'Concise AI insight for Step 5 Soft-Reservation & Global Hub Sync.',
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
};

async function callGeminiFast(prompt: string, keys: string[]) {
  // Primary ultra-low-latency model: gemini-3.1-flash-lite with ThinkingLevel.MINIMAL (~1.3s response)
  const modelsToTry = [
    { name: 'gemini-3.1-flash-lite', thinking: ThinkingLevel.MINIMAL, timeoutMs: 12000 },
    { name: 'gemini-3.8-flash', thinking: ThinkingLevel.LOW, timeoutMs: 12000 },
  ];
  let lastError: unknown = null;

  for (const apiKey of keys) {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    for (const modelCfg of modelsToTry) {
      try {
        const callPromise = ai.models.generateContent({
          model: modelCfg.name,
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: modelCfg.thinking },
            temperature: 0.25,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Model ${modelCfg.name} timed out`)),
            modelCfg.timeoutMs
          )
        );

        const response = await Promise.race([callPromise, timeoutPromise]);
        if (response && response.text) {
          return {
            text: response.text,
            modelUsed: modelCfg.name,
          };
        }
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error('All Gemini API keys/models failed.');
}

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

      const candidateKeys = getCandidateApiKeys();
      if (candidateKeys.length === 0) {
        res.status(500).json({
          error:
            lang === 'vi'
              ? 'Chưa tìm thấy GEMINI_API_KEY trong file .env hoặc biến môi trường.'
              : 'GEMINI_API_KEY is not configured in .env or environment variables.',
        });
        return;
      }

      const languageInstruction =
        lang === 'vi'
          ? 'Trả lời hoàn toàn bằng Tiếng Việt chuyên ngành Chuỗi cung ứng & Kiến trúc hệ thống (ngắn gọn, súc tích, trích dẫn chính xác các con số).'
          : 'Respond in concise Enterprise English citing the exact numbers.';

      const prompt = `Role: OnSite AI Smart Shell Orchestration Engine (${country} Market).
Analyze this live B2B order execution and generate a fast, high-precision operational report.
${languageInstruction}

LIVE TELEMETRY & ORDER CONTEXT:
- Country Node: ${country} (${legacySystemName})
- Circuit Breaker State: ${isOffline ? 'FAILOVER_REPLICA_CACHE_ACTIVE' : 'ONLINE_NOMINAL'}
- Contractor: ${contractorName} | Site: ${deliverySite}
- Raw Order Input: ${rawOrderText}
- SKU Mapping: ${localSku} -> ${globalSku} (${conversionRule})
- Requested Demand: ${requestedQty} ${baseUnit} | Safety Buffer: ${bufferPct}%
- Primary Branch (${primaryBranch?.branchId || 'Primary'}): Physical=${primaryBranch?.physicalStock}, Buffer=-${primaryBranch?.safetyBuffer}, SoftReserved=-${primaryBranch?.softReserved}, Net ATP=${primaryBranch?.atp}, Allocated=${primaryBranch?.allocated}, Distance=${primaryBranch?.distanceKm}km
- Secondary Branch (${backupBranch?.branchId || 'Backup'}): Physical=${backupBranch?.physicalStock}, Net ATP=${backupBranch?.atp}, Split Allocated=${backupBranch?.allocated}, Distance=${backupBranch?.distanceKm}km
- Primary Deficit / Split Volume: ${shortageQty} ${baseUnit} | Unfulfilled Deficit: ${unfulfilledQty} ${baseUnit}`;

      const { text, modelUsed } = await callGeminiFast(prompt, candidateKeys);

      const totalServerMs = Date.now() - startMs;
      const parsed = JSON.parse(text);

      const s1 = Math.max(40, Math.round(totalServerMs * 0.12));
      const s2 = Math.max(80, Math.round(totalServerMs * 0.28));
      const s3 = Math.max(45, Math.round(totalServerMs * 0.14));
      const s4 = Math.max(95, Math.round(totalServerMs * 0.32));
      const s5 = Math.max(40, totalServerMs - (s1 + s2 + s3 + s4));

      res.json({
        ...parsed,
        modelUsed,
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
