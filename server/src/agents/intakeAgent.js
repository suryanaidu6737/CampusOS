import { z } from 'zod';

export const IntakeSchema = z.object({
  intent: z.enum([
    'id_card_replacement',
    'certificate_request',
    'leave_request',
    'campus_complaint',
    'academic_grievance',
    'unknown',
  ]),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  urgency: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  extractedData: z.record(z.any()),
  confidence: z.number().min(0).max(1),
});

export class IntakeAgent {
  /**
   * Parses raw prompt into structured Intake JSON
   */
  static parse(promptText, studentProfile) {
    const lower = promptText.toLowerCase();

    let intent = 'unknown';
    let title = 'General Inquiry';
    let category = 'general';
    let urgency = 'NORMAL';
    let confidence = 0.95;
    const extractedData = {
      studentName: studentProfile?.name || 'Student',
      studentId: studentProfile?.studentId || 'N/A',
      department: studentProfile?.department?.name || 'General',
      requestDate: new Date().toISOString().split('T')[0],
    };

    if (
      lower.includes('id card') ||
      lower.includes('identity card') ||
      lower.includes('lost card') ||
      (lower.includes('lost') && lower.includes('card')) ||
      (lower.includes('replacement') && lower.includes('card'))
    ) {
      intent = 'id_card_replacement';
      title = 'ID Card Replacement & Reissuance';
      category = 'id_card_services';
      urgency = 'NORMAL';
      extractedData.purpose = 'Lost ID Card Replacement';
      confidence = 0.98;
    } else if (
      lower.includes('bonafide') ||
      lower.includes('certificate') ||
      lower.includes('internship') ||
      lower.includes('passport') ||
      lower.includes('visa')
    ) {
      intent = 'certificate_request';
      title = lower.includes('internship') ? 'Bonafide Certificate for Internship' : 'Bonafide Certificate Request';
      category = 'certificate_services';
      urgency = 'NORMAL';
      extractedData.purpose = lower.includes('internship') ? 'Internship Application' : 'General Certificate Request';
      confidence = 0.95;
    } else if (
      lower.includes('leave') ||
      lower.includes('absent') ||
      lower.includes('sick') ||
      lower.includes('permission')
    ) {
      intent = 'leave_request';
      title = lower.includes('sick') ? 'Medical / Sick Leave Request' : 'Academic Duty Leave Request';
      category = 'leave_permissions';
      urgency = lower.includes('sick') ? 'HIGH' : 'NORMAL';
      extractedData.purpose = lower.includes('sick') ? 'Medical Reason' : 'Personal / Academic Event';
      extractedData.leave_dates = 'As per request application';
      confidence = 0.92;
    } else if (
      lower.includes('complaint') ||
      lower.includes('hostel') ||
      lower.includes('wifi') ||
      lower.includes('water') ||
      lower.includes('pipe') ||
      lower.includes('leakage') ||
      lower.includes('repair') ||
      lower.includes('broken')
    ) {
      intent = 'campus_complaint';
      title = 'Campus Infrastructure Maintenance Complaint';
      category = 'maintenance';
      urgency = lower.includes('leakage') || lower.includes('broken') ? 'HIGH' : 'NORMAL';
      extractedData.purpose = 'Infrastructure Maintenance / Repair';
      extractedData.location = lower.includes('hostel') ? 'Hostel Complex' : 'Main Campus Premises';
      confidence = 0.94;
    } else if (
      lower.includes('grievance') ||
      lower.includes('grade') ||
      lower.includes('mark') ||
      lower.includes('exam') ||
      lower.includes('re-evaluation') ||
      lower.includes('result')
    ) {
      intent = 'academic_grievance';
      title = 'Academic Evaluation Grievance & Appeal';
      category = 'academic_appeals';
      urgency = 'NORMAL';
      extractedData.purpose = 'Marks Re-evaluation / Appeal';
      extractedData.subject = 'Academic Course Examination';
      confidence = 0.91;
    } else {
      intent = 'unknown';
      confidence = 0.40; // Trigger clarification flow
    }

    const rawResult = {
      intent,
      title,
      description: promptText,
      category,
      urgency,
      extractedData,
      confidence,
    };

    return IntakeSchema.parse(rawResult);
  }
}
