import type { Doc } from '@workspace/backend/convex/_generated/dataModel';
import { Check, Copy } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Configuration options for copying attendance data.
 */
export interface CopyOptions {
  includeRemarks: boolean;
  groupByStatus: boolean;
}

/**
 * Props for the AttendanceCopyDialog component.
 */
export interface AttendanceCopyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  activeTab: 'pending' | 'responded';
  statusFilter: 'all' | 'attending' | 'not_attending';
  allNames: Set<string>;
  attendanceMap: Map<string, Doc<'attendanceRecords'>>;
}

/**
 * Dialog component for configuring and copying attendance data as formatted text.
 * Provides options for including remarks and grouping by status.
 */
export const AttendanceCopyDialog = ({
  isOpen,
  onClose,
  title,
  activeTab,
  statusFilter,
  allNames,
  attendanceMap,
}: AttendanceCopyDialogProps) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyOptions, setCopyOptions] = useState<CopyOptions>({
    includeRemarks: false,
    groupByStatus: true,
  });

  /**
   * Generate the full text that will be copied based on current options and filters.
   */
  const generateCopyText = useCallback(() => {
    const allNamesArray = Array.from(allNames);

    let copyText = `${title}\n`;
    copyText += `Generated on: ${new Date().toLocaleString()}\n\n`;

    if (activeTab === 'pending') {
      const pendingNames = allNamesArray.filter((name) => {
        const record = attendanceMap.get(name);
        return !record?.status;
      });

      copyText += `Pending Responses (${pendingNames.length}):\n`;
      copyText += pendingNames.map((name, index) => `${index + 1}. ${name}`).join('\n');
    } else {
      // For responded tab, get names based on status filter
      const respondedNames = allNamesArray.filter((name) => {
        const record = attendanceMap.get(name);
        if (!record?.status) return false;
        if (statusFilter === 'all') return true;
        return record?.status === statusFilter;
      });

      if (copyOptions.groupByStatus && statusFilter === 'all') {
        copyText += _generateGroupedStatusText(respondedNames, attendanceMap, copyOptions);
      } else {
        copyText += _generateSingleListText(
          respondedNames,
          attendanceMap,
          statusFilter,
          copyOptions
        );
      }
    }

    return copyText;
  }, [allNames, activeTab, attendanceMap, title, statusFilter, copyOptions]);

  /**
   * Handle copy functionality with modern clipboard API and fallback support.
   */
  const handleCopyAttendanceData = useCallback(async () => {
    try {
      const copyText = generateCopyText();
      let copySuccessful = false;

      // Try modern clipboard API first, then fallback to legacy method
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(copyText);
          copySuccessful = true;
        } catch (clipboardError) {
          console.warn('Modern clipboard API failed, trying fallback:', clipboardError);
          copySuccessful = _fallbackCopyToClipboard(copyText);
        }
      } else {
        copySuccessful = _fallbackCopyToClipboard(copyText);
      }

      if (copySuccessful) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        alert('Failed to copy to clipboard. Please try copying manually from the preview.');
      }
    } catch (error) {
      console.error('Copy operation failed:', error);
      alert('Failed to copy to clipboard. Please try copying manually from the preview.');
    }
  }, [generateCopyText]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Copy Attendance List</DialogTitle>
          <DialogDescription>
            Configure how you want to copy the attendance data as text.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Copy Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Copy Options</h4>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeRemarks"
                checked={copyOptions.includeRemarks}
                onCheckedChange={(checked) =>
                  setCopyOptions((prev) => ({ ...prev, includeRemarks: checked as boolean }))
                }
              />
              <label htmlFor="includeRemarks" className="text-sm">
                Include remarks/reasons
              </label>
            </div>

            {statusFilter === 'all' && activeTab === 'responded' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="groupByStatus"
                  checked={copyOptions.groupByStatus}
                  onCheckedChange={(checked) =>
                    setCopyOptions((prev) => ({ ...prev, groupByStatus: checked as boolean }))
                  }
                />
                <label htmlFor="groupByStatus" className="text-sm">
                  Group by attendance status
                </label>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Preview</h4>
            <div className="border rounded-md p-3 bg-muted text-sm font-mono whitespace-pre-wrap h-60 overflow-y-auto">
              {generateCopyText()}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCopyAttendanceData}
            disabled={copySuccess}
            className="flex items-center gap-2"
          >
            {copySuccess ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy to Clipboard
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Fallback copy method using the legacy approach with textarea element.
 * Used when modern clipboard API is not available or fails.
 */
function _fallbackCopyToClipboard(text: string): boolean {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (error) {
    console.error('Fallback copy failed:', error);
    return false;
  }
}

/**
 * Generate grouped text format with separate sections for attending and not attending.
 * Internal helper function for text generation.
 */
function _generateGroupedStatusText(
  respondedNames: string[],
  attendanceMap: Map<string, Doc<'attendanceRecords'>>,
  copyOptions: CopyOptions
): string {
  let copyText = '';

  const attendingNames = respondedNames.filter((name) => {
    const record = attendanceMap.get(name);
    return record?.status === 'attending';
  });

  const notAttendingNames = respondedNames.filter((name) => {
    const record = attendanceMap.get(name);
    return record?.status === 'not_attending';
  });

  // Attending section
  if (attendingNames.length > 0) {
    copyText += `✓ Attending (${attendingNames.length}):\n`;
    copyText += attendingNames
      .map((name, index) => {
        const record = attendanceMap.get(name);
        let line = `${index + 1}. ${name}`;

        if (copyOptions.includeRemarks && record?.remarks) {
          line += `\n   Remarks: ${record.remarks}`;
        }

        return line;
      })
      .join('\n');
    copyText += '\n\n';
  }

  // Not attending section
  if (notAttendingNames.length > 0) {
    copyText += `✗ Not Attending (${notAttendingNames.length}):\n`;
    copyText += notAttendingNames
      .map((name, index) => {
        const record = attendanceMap.get(name);
        let line = `${index + 1}. ${name}`;

        if (copyOptions.includeRemarks && record?.reason) {
          line += `\n   Reason: ${record.reason}`;
        }

        return line;
      })
      .join('\n');
  }

  return copyText;
}

/**
 * Generate single list format with status indicators for each person.
 * Internal helper function for text generation.
 */
function _generateSingleListText(
  respondedNames: string[],
  attendanceMap: Map<string, Doc<'attendanceRecords'>>,
  statusFilter: 'all' | 'attending' | 'not_attending',
  copyOptions: CopyOptions
): string {
  const statusTitle =
    statusFilter === 'all'
      ? 'All Responses'
      : statusFilter === 'attending'
        ? 'Attending Responses'
        : 'Not Attending Responses';

  let copyText = `${statusTitle} (${respondedNames.length}):\n`;

  copyText += respondedNames
    .map((name, index) => {
      const record = attendanceMap.get(name);
      const status = record?.status;
      const statusIcon = status === 'attending' ? '✓' : '✗';

      let line = `${index + 1}. ${name} [${statusIcon}]`;

      // Add reason or remarks if option is enabled
      if (copyOptions.includeRemarks) {
        if (status === 'attending' && record?.remarks) {
          line += `\n   Remarks: ${record.remarks}`;
        } else if (status === 'not_attending' && record?.reason) {
          line += `\n   Reason: ${record.reason}`;
        }
      }

      return line;
    })
    .join('\n');

  return copyText;
}
