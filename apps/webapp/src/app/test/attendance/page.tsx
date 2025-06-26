'use client';

import { Attendance } from '@/modules/attendance/components/Attendance';

export default function AttendanceTestPage() {
  // Hardcoded attendee names
  const attendeeNames = [
    'John Doe',
    'Jane Smith',
    'Alex Johnson',
    'Michael Brown',
    'Emily Davis',
    'Andrew Brian',
    'John Smith',
    'Jake Brown',
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Attendance Test Page</h1>

      <Attendance
        attendanceKey="weekly-team-meeting"
        title="Weekly Team Meeting"
        expectedNames={attendeeNames}
        remarksPlaceholder="Here are some custom remarks"
      />
    </div>
  );
}
