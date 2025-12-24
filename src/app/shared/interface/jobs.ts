export interface JobResponse {
  jobIndex: Job[];
  rowCount: number;
}

export interface Job {
  jobId: number;
  clientId: number;
  companyName: string;
  purchaseOrder: string | null;
  requiresPO: boolean;
  venueName: string;
  statusText: string;
  statusContent: string;
  paidDate: string | null;
  paidDateString: string;
  regionText: string;
  overdue: '0' | '1' | string;
  parts: number;
  starts: string; // ISO date
  ends: string;   // ISO date
  totalHours: number;
  cost: number;
}

export interface JobSearchParams {
  searchKey?: string;
  region?: number;
  statusId?: number;
  active?: number;
  jobId?: number;
  page?: number;
  pageSize?: number;
}
