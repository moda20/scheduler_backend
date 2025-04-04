export interface Notifications {
  sendJobFinishNotification(
    jobId: string,
    jobName: string,
    results: string,
    options?: { title: string; message: string; priority: number },
  ): Promise<any>;
  sendJobCrashNotification(
    jobId: string,
    jobName: string,
    error?: string,
    options?: { title: string; message: string; priority: number },
  ): Promise<any>;
}
