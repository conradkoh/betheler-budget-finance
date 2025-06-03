import type { Id } from '@workspace/backend/convex/_generated/dataModel';

export type AttendanceMode = 'simple' | 'full';

export enum AttendanceStatus {
  ATTENDING = 'attending',
  NOT_ATTENDING = 'not_attending',
}

export interface AttendanceRecord {
  _id: Id<'attendanceRecords'>;
  _creationTime: number;
  attendanceKey: string;
  timestamp: number;
  userId?: Id<'users'>;
  name?: string;
  status?: AttendanceStatus;
  reason?: string;
}
