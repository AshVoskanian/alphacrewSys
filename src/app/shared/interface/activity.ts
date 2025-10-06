export interface JobPartLog {
  id: number;
  jobId: number;
  jobPartId: number;
  content: string;
  name: string;
  createDate: string;
  jobPartCrewId: number;
  loading?: boolean;
}
