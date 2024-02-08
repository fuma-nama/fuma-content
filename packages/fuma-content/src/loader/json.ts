import type { Transformer } from "./types";

export const loadJson = (): Transformer => {
  return (_file, source) => {
    const parsed = JSON.parse(source) as unknown;

    return {
      content: `export default ${JSON.stringify(parsed)}`,
    };
  };
};
