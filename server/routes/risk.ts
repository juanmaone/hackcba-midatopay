// AssessmentResponse shape per shared/types/assessment.ts — deliberately does NOT include a
// satellite field (server/satellite/integration/agentBridge.ts stays unwired in this build, see
// plan Global Constraints).
import { Router } from 'express';
import { z } from 'zod';
import type { AgentResult } from '../../shared/types/agent.js';
import type { AssessmentResponse } from '../../shared/types/assessment.js';
import { runAllAgents } from '../agents/index.js';
import { calculateStressScenarios } from '../engine/stressScenarios.js';
import { synthesizeRisk } from '../engine/riskSynthesis.js';

const assessmentRequestSchema = z.object({
  cuit: z.string(),
  applicant: z.object({ name: z.string() }),
  field: z.object({
    lat: z.number(),
    lng: z.number(),
    hectares: z.number().positive(),
    crop: z.string(),
    campaign: z.string(),
    polygon: z.array(z.tuple([z.number(), z.number()])),
  }),
  loan: z.object({
    requestedAmount: z.number().positive(),
    termMonths: z.number().positive(),
  }),
});

export function createRiskRouter(onAgentComplete?: (caseId: string, result: AgentResult) => void): Router {
  const router = Router();

  router.post('/assessment', async (req, res) => {
    const parsed = assessmentRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request body', issues: parsed.error.issues });
      return;
    }

    try {
      const { cuit, applicant, field, loan } = parsed.data;
      const caseId = `AG-${Date.now()}`;

      const agents = await runAllAgents(
        { caseId, applicant: { cuit, name: applicant.name }, field, loan },
        onAgentComplete ? (result) => onAgentComplete(caseId, result) : undefined,
      );

      const synthesis = synthesizeRisk({ field, loan, ...agents });
      const scenarios = calculateStressScenarios({ field, loan, ...agents }, synthesis.agroScore);

      const response: AssessmentResponse = {
        caseId,
        timestamp: new Date().toISOString(),
        agents,
        synthesis,
        scenarios,
      };

      res.json(response);
    } catch (error) {
      console.error('Assessment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
