import type { ChartData } from '../lib/curriculum';
export function validateTable(data: ChartData): ChartData & {total:number;angles:number[]};

export function chartScale(data: ChartData): {min:number;max:number;ticks:number[]};
