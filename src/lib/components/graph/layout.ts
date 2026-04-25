// D3 force-directed layout for the graph view.
//
// Runs in the browser, deterministic seed (Math.random replaced by a
// PRNG so the same graph always renders the same way until the user
// drags). Tick callback dispatches positions back to the WebGPU
// renderer.

import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';

export interface GraphNodeInput {
  id: string;
  type: string;
  title: string;
  slug: string;
}

export interface GraphLinkInput {
  id: string;
  source: string;
  target: string;
  relationType: string;
}

export interface GraphNodePosition extends SimulationNodeDatum {
  id: string;
  type: string;
  title: string;
  slug: string;
  hue: number;
}

export interface GraphLinkPosition extends SimulationLinkDatum<GraphNodePosition> {
  id: string;
  relationType: string;
  hue: number;
}

const TYPE_HUES: Record<string, number> = {
  note: 0.62,
  task: 0.04,
  decision: 0.92,
  spec: 0.32,
  snippet: 0.55,
  link: 0.22,
  person: 0.78,
  project: 0.12,
  daily: 0.46,
};

const RELATION_HUES: Record<string, number> = {
  references: 0.0,
  blocks: 0.32,
  related: 0.18,
  supersedes: 0.58,
  derives_from: 0.82,
  embeds: 0.45,
};

export interface LayoutHandle {
  positions: GraphNodePosition[];
  links: GraphLinkPosition[];
  tick: () => void;
  stop: () => void;
}

export function createLayout(
  nodeRows: GraphNodeInput[],
  linkRows: GraphLinkInput[],
  width: number,
  height: number,
): LayoutHandle {
  const positions: GraphNodePosition[] = nodeRows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    slug: n.slug,
    hue: TYPE_HUES[n.type] ?? 0.5,
  }));
  const idIndex = new Map(positions.map((p) => [p.id, p]));
  const linkObjs: GraphLinkPosition[] = linkRows
    .map((l) => {
      const source = idIndex.get(l.source);
      const target = idIndex.get(l.target);
      if (!source || !target) return null;
      const link: GraphLinkPosition = {
        id: l.id,
        source,
        target,
        relationType: l.relationType,
        hue: RELATION_HUES[l.relationType] ?? 0.0,
      };
      return link;
    })
    .filter((l): l is GraphLinkPosition => l !== null);

  const sim = forceSimulation<GraphNodePosition>(positions)
    .force(
      'link',
      forceLink<GraphNodePosition, GraphLinkPosition>(linkObjs)
        .id((d) => d.id)
        .distance(80)
        .strength(0.3),
    )
    .force('charge', forceManyBody().strength(-220).distanceMax(800))
    .force('center', forceCenter(width / 2, height / 2))
    .force('collide', forceCollide<GraphNodePosition>().radius(18).strength(0.7))
    .alphaDecay(0.03);

  return {
    positions,
    links: linkObjs,
    tick: () => sim.tick(),
    stop: () => sim.stop(),
  };
}
