export type GeometryScene = {
  version: 'geometry-v1';
  status: 'ready' | 'clarify' | 'unsupported';
  question: string;
  title: string;
  view: 'plane' | 'space';
  nodes: {
    id: string;
    op: string;
    args: string[];
    values: number[];
    label: string;
    source: string;
  }[];
  strokes: {
    kind: string;
    args: string[];
    values: number[];
    style: 'main' | 'aux' | 'hidden';
    label: string;
    expression: string;
    source: string;
  }[];
  constraints: { kind: string; args: string[]; value: number; source: string }[];
  assumptions: string[];
};
export type SceneValidation = { checked: string[]; unverified: string[]; notice: string };
export const SCENE_VERSION: string;
export const NODE_OPS: string[];
export const STROKE_KINDS: string[];
export const CONSTRAINT_KINDS: string[];
export function evaluateScene(scene: unknown): {
  scene: GeometryScene;
  points: Map<string, number[]>;
  checked: string[];
  notice: string;
};
export function renderScene(scene: unknown): {
  svg: string;
  latex: string;
  scene: GeometryScene;
  validation: SceneValidation;
  renderer: 'geometry-v1';
};
