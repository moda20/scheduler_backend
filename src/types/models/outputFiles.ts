export interface OutputFile {
  id: string;
  job_log_id: string;
  created_at: Date;
  updated_at: Date;
  file_name: string;
  file_tags: string | null;
  file_path: string;
  file_size: number;
  file_type: string;
}

export interface cacheFile extends OutputFile {
  time_to_live: number;
}

export class OutputFileClass implements OutputFile {
  id: string;
  job_log_id: string;
  created_at: Date;
  updated_at: Date;
  file_name: string;
  file_tags: string | null;
  file_path: string;
  file_size: number;
  file_type: string;

  constructor(outputFile: OutputFile) {
    this.id = outputFile.id;
    this.job_log_id = outputFile.job_log_id;
    this.created_at = outputFile.created_at;
    this.updated_at = outputFile.updated_at;
    this.file_name = outputFile.file_name;
    this.file_tags = outputFile.file_tags;
    this.file_path = outputFile.file_path;
    this.file_size = outputFile.file_size;
    this.file_type = outputFile.file_type;
  }
}

export class CacheFileClass extends OutputFileClass implements cacheFile {
  time_to_live: number;

  constructor(outputFile: cacheFile) {
    super(outputFile);
    this.time_to_live = outputFile.time_to_live;
  }
}

export interface newOutputFileConfig {
  fileName: string;
  data: any;
  tags: string | null;
  type: string;
  jobLogId: string;
  newFile?: boolean;
}
export interface newCacheFileConfig extends newOutputFileConfig {
  ttl: number;
}
