declare module "process" {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        readonly STUDIO_PARENT_DIR?: string;
        readonly STUDIO_DIST?: string;
        readonly STUDIO_CONFIG?: string;
        readonly STUDIO_VERSION?: string;
      }
    }
  }
}
