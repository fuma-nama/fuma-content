export interface CollectionItem {
  id: string;
  name: string;
  badge?: string;

  supportStudio: boolean;
  /** Data Collection only  */
  _data?: {
    formats: string[];
  };
}

export interface DocumentItem {
  id: string;
  collectionId: string;
  name: string;

  permissions: {
    delete: boolean;
  };
}
