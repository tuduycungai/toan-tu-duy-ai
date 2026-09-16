export function stripComments(source:string):string;
export function prepareTikz(source:unknown):{body:string;libraries:string};
export function parseDiagramValue(value:unknown):{latex:string;question:string};
export function parseDiagramText(text:string):{latex:string;question:string};
