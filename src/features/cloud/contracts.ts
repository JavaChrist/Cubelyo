export type CloudSave = {
  profile: string;
  revision: number;
  updatedAt?: string;
  schema?: 1;
};
export class SaveConflict extends Error {
  constructor() {
    super("cloud/conflict");
  }
}
export type CloudRepository = {
  read(): Promise<CloudSave | null>;
  write(profile: string, expectedRevision: number): Promise<CloudSave>;
  erase(): Promise<void>;
};
