import { ConvexError, v } from 'convex/values';
import { SessionIdArg } from 'convex-helpers/server/sessions';

import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { getAuthUserOptional } from '../modules/auth/getAuthUser';

// Hardcoded attendance key
const ATTENDANCE_KEY = 'default-attendance';

// Record attendance for an attendee (both anonymous and authenticated)
export const recordAttendance = mutation({
  args: {
    attendanceKey: v.optional(v.string()),
    name: v.string(),
    status: v.union(v.literal('attending'), v.literal('not_attending')),
    reason: v.optional(v.string()),
    remarks: v.optional(v.string()),
    self: v.optional(v.boolean()),
    isManuallyJoined: v.boolean(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    let attendanceUserId: Id<'users'> | undefined; //the user id associated with the attendance record
    const name = args.name;
    const attendanceKey = args.attendanceKey || ATTENDANCE_KEY;
    const self = args.self ?? false;
    const isManuallyJoined = args.isManuallyJoined;

    // For authenticated users
    const user = await getAuthUserOptional(ctx, args);
    if (user && self) {
      attendanceUserId = user._id; //only associate the user if they are recording for themselves
    }

    // Name is required if not authenticated or not self
    if (!attendanceUserId && !name) {
      throw new ConvexError('Name is required for anonymous attendance');
    }

    // delete any records already associated with this user
    if (attendanceUserId) {
      // if the user is registering
      const existingRecords = await ctx.db
        .query('attendanceRecords')
        .withIndex('by_user_attendance', (q) =>
          q.eq('attendanceKey', attendanceKey).eq('userId', attendanceUserId)
        )
        .collect();
      //delete all existing records
      await Promise.all(
        existingRecords.map((record) => ctx.db.delete('attendanceRecords', record._id))
      );
    }

    // delete any records with the same name
    const existingRecords = await ctx.db
      .query('attendanceRecords')
      .withIndex('by_name_attendance', (q) => q.eq('attendanceKey', attendanceKey).eq('name', name))
      .collect();
    await Promise.all(
      existingRecords.map((record) => ctx.db.delete('attendanceRecords', record._id))
    );
    // Create a new record
    return ctx.db.insert('attendanceRecords', {
      attendanceKey,
      userId: attendanceUserId,
      name,
      timestamp: Date.now(),
      status: args.status,
      reason: args.status === 'not_attending' ? args.reason : undefined,
      remarks: args.status === 'attending' ? args.remarks : undefined,
      isManuallyJoined,
    });
  },
});

// Delete an attendance record
export const deleteAttendanceRecord = mutation({
  args: {
    recordId: v.id('attendanceRecords'),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Get the record to check permissions
    const record = await ctx.db.get('attendanceRecords', args.recordId);
    if (!record) {
      throw new ConvexError('Attendance record not found');
    }

    // Check if the user is authorized to delete this record
    const user = await getAuthUserOptional(ctx, args);

    // Only allow deletion if:
    // 1. The user is the owner of the record (their userId matches)
    // 2. The record doesn't have a userId (anonymous entry)
    if (record.userId && (!user || record.userId !== user._id)) {
      throw new ConvexError('Not authorized to delete this attendance record');
    }

    // Delete the record
    await ctx.db.delete('attendanceRecords', args.recordId);
    return { success: true };
  },
});

// Get attendance data including records and current user's response
export const getAttendanceData = query({
  args: {
    attendanceKey: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Get all attendance records for this key
    const records = await ctx.db
      .query('attendanceRecords')
      .withIndex('by_attendance', (q) => q.eq('attendanceKey', args.attendanceKey))
      .collect();

    // Get current user's response if authenticated
    const user = await getAuthUserOptional(ctx, args);
    const currentUserResponse = user
      ? await ctx.db
          .query('attendanceRecords')
          .withIndex('by_user_attendance', (q) =>
            q.eq('attendanceKey', args.attendanceKey).eq('userId', user._id)
          )
          .first()
      : null;
    return {
      records,
      currentUserResponse,
    };
  },
});
