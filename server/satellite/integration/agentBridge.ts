import type { ClimateAgentResult, SoilAgentResult, YieldAgentResult } from '../../../shared/types/agent.js';
import type { VegetationAnalysis } from '../../../shared/types/satellite.js';
import { mockDroughtAnalysis, mockSatelliteAnalysis } from '../providers/mockSatellite.js';

export interface AgentBridgeField {
  lat: number;
  lng: number;
  polygon: Array<[number, number]>;
}

export interface AgentBridgeAgents {
  climate?: ClimateAgentResult;
  soil?: SoilAgentResult;
  yield?: YieldAgentResult;
}

/**
 * No real satellite provider exists yet — Tareas 1-8 only built the spectral-index math and the
 * Tarea 1 mock fixtures, per docs/TRACK_B_PLAN.md Tarea 9 ("coordinar con Track A el momento en
 * que sus agentes existen de verdad; hasta entonces, usar el mock de la tarea 1 como valor de
 * retorno"). This bridge already has the real async (field, agents) -> Promise<VegetationAnalysis>
 * signature docs/SATELLITE_MODULE.md §4 specifies, so callers don't need to change once a real
 * Sentinel/Planetary Computer fetch replaces this body. It picks the drought mock when the
 * Climate Agent already reports high drought risk, so the two data sources don't visibly
 * disagree in the demo.
 */
export async function enrichWithSatelliteData(_field: AgentBridgeField, agents: AgentBridgeAgents): Promise<VegetationAnalysis> {
  const isDroughtSignal = agents.climate?.data.droughtRisk === 'high';
  return isDroughtSignal ? mockDroughtAnalysis : mockSatelliteAnalysis;
}
