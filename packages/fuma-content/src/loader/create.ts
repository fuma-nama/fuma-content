interface LoaderOptions {
  info: unknown;
  data: unknown;
}

export interface Options {
  files: string[];
}

export interface Loader<Options extends LoaderOptions = LoaderOptions> {
  load: () => LoaderResult<Options>;
}

interface LoaderResult<Options extends LoaderOptions> {
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

export function createLoader({ files }: Options): Loader {
  return {
    load() {
      return {
        documents: [],
      };
    },
  };
}
