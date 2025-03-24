export interface JobDTO {
  // Properties
  createdAt: string | Date;
  id: string | number;
  name: string;
  cronSetting: string;
  consumer: string;
  status: string;
  param: any;
  exclusive: boolean;
  uniqueSingularId: string | number;
  averageTime: number;
  latestRun: string | Date;

  // Methods
  getId(): string | number;
  getName(): string;
  getParam(): any;
  getCronSetting(): string;
  getConsumer(): string;
  getExclusive(): boolean;
  getStats(): string;
  getAverageTime(): number;
  getUniqueSingularId(): string | number;
  getCreatedAt(): string | Date;
  getLatestRun(): string | Date;

  setId(id: string | number): void;
  setName(name: string): void;
  setParam(param: any): void;
  setCronSetting(cronSetting: string): void;
  setConsumer(consumer: string): void;
  setExclusive(exclusive: boolean): void;
  setStatus(status: string): void;
  setUniqueSingularId(id: string | number): void;
  setCreatedAt(createdAt: string | Date): void;
  setAverageTime(averageTime: number): void;
  setLatestRun(latestRun: string | Date): void;
}
