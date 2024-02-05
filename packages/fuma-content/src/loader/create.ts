interface LoaderParam {
  info: unknown;
  data: unknown;
}

export interface CreateOptions {
  files: string[];
}

export interface Loader<Options extends LoaderParam = LoaderParam> {
  load: () => LoaderResult<Options>;
}

interface LoaderResult<Options extends LoaderParam> {
  documents: Document<Options["info"], Options["data"]>[];
}

export interface Document<Info = unknown, Data = unknown> {
  info: Info;

  /**
   * Render data, should be accepted by renderer
   */
  data: Data;

  /**
   * File Path
   */
  file: string;
}

export function createLoader(_: CreateOptions): Loader {
  return {
    load() {
      return {
        documents: [],
      };
    },
  };
}
