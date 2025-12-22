export interface StudioDocument {
  name: string;
}
export interface StudioHandler {
  getDocuments: () => Promise<StudioDocument[]>;
}
