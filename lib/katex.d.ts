declare module 'katex' {
  const katex: {
    renderToString: (
      source: string,
      options?: {
        displayMode?: boolean;
        throwOnError?: boolean;
        trust?: boolean;
        strict?: string;
        maxExpand?: number;
        maxSize?: number;
        output?: string;
      },
    ) => string;
  };
  export default katex;
}
