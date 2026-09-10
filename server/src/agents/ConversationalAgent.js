import { GoogleGenerativeAI } from '@google/generative-ai';
import { agentTools } from '../tools/agentTools.js';
import { RoutingAgent } from './routingAgent.js';
import { AuditLog } from '../models/AuditLog.js';

function isExplicitConfirmation(text) {
  const lower = text.toLowerCase().trim();
  const confirmationWords = ['yes', 'submit', 'confirm', 'go ahead', 'create', 'yes please', 'do it', 'okay submit', 'proceed', 'sure submit', 'yes, submit'];
  return confirmationWords.some((word) => lower.includes(word));
}

function isInformationalQuery(promptText) {
  const lower = promptText.toLowerCase().trim();
  const infoPhrases = [
    'how can i apply',
    'how do i apply',
    'how to apply',
    'how can i get',
    'how to get',
    'where is',
    'what is',
    'what are',
    'when does',
    'how long',
    'can you tell me',
    'process for',
    'procedure for',
    'what is the policy',
  ];

  if (infoPhrases.some((phrase) => lower.includes(phrase))) {
    return true;
  }

  const actionKeywords = ['i need', 'i want', 'please issue', 'lost my', 'broken', 'leakage', 'submit', 'grant me', 'marks are wrong', 'wrong marks'];
  const hasAction = actionKeywords.some((word) => lower.includes(word));
  const hasQuestionMark = lower.endsWith('?');

  return hasQuestionMark && !hasAction;
}

function handleInformationalAnswer(promptText) {
  const lower = promptText.toLowerCase();

  if (lower.includes('scholarship')) {
    return "You can apply for state and university scholarships through the Accounts & Finance Department or National Scholarship Portal. Required documents usually include income certificates, marks memos, and bank passbooks.\n\nIf you need an official Bonafide Certificate for your scholarship application, just let me know!";
  }
  if (lower.includes('bonafide') || lower.includes('certificate')) {
    return "Bonafide Certificates can be requested directly here through CampusOS AI. Once submitted, the Student Section office reviews and issues the certificate within 1-2 business days.\n\nWould you like me to prepare a Bonafide Certificate request for you?";
  }
  if (lower.includes('id card')) {
    return "ID Card replacements are handled by the Student Section. If your card is lost or damaged, I can immediately prepare a reissuance request for you using your student profile details. Would you like me to start that?";
  }
  if (lower.includes('leave') || lower.includes('duty leave')) {
    return "Duty leave and academic leave requests are routed to your Faculty Advisor and Department HOD for approval. You can request leave directly through me by specifying your leave dates and reason.";
  }
  if (lower.includes('hostel') || lower.includes('timings')) {
    return "Hostel gate entry closing time is 9:00 PM for all campus hostels. For room maintenance or plumbing issues, you can report a complaint through CampusOS AI anytime.";
  }
  if (lower.includes('library')) {
    return "The Central University Library is open from 8:00 AM to 8:00 PM on working days. Digital e-resources can be accessed 24/7 through the campus network.";
  }

  return "I can answer university operational questions or help you submit official requests for ID cards, bonafide certificates, leave permission, campus complaints, or academic evaluation grievances. How can I assist you?";
}

function extractStructuredData(promptText, currentWorkflowKey, existingData, studentProfile) {
  const lower = promptText.toLowerCase();
  let intent = currentWorkflowKey || 'unknown';
  let title = 'Campus Request';
  let extractedData = { ...existingData };

  // Intent Classification
  if (
    lower.includes('id card') ||
    lower.includes('identity card') ||
    lower.includes('lost card') ||
    (lower.includes('lost') && lower.includes('card'))
  ) {
    intent = 'id_card_replacement';
    title = 'ID Card Replacement & Reissuance';
    if (!extractedData.purpose) extractedData.purpose = 'Lost ID Card Replacement';
  } else if (
    lower.includes('bonafide') ||
    lower.includes('certificate') ||
    lower.includes('internship letter') ||
    lower.includes('passport') ||
    lower.includes('visa')
  ) {
    intent = 'bonafide_certificate';
    title = lower.includes('internship') ? 'Bonafide Certificate for Internship' : 'Bonafide Certificate Request';
    if (lower.includes('internship') && !extractedData.purpose) extractedData.purpose = 'Internship Application';
    else if (lower.includes('passport') && !extractedData.purpose) extractedData.purpose = 'Passport Application';
    else if (lower.includes('visa') && !extractedData.purpose) extractedData.purpose = 'Visa Application';
    else if (lower.includes('bank') && !extractedData.purpose) extractedData.purpose = 'Bank Account Opening';
  } else if (
    lower.includes('leave') ||
    lower.includes('absent') ||
    lower.includes('sick') ||
    lower.includes('duty leave') ||
    lower.includes('permission')
  ) {
    intent = 'leave_request';
    title = lower.includes('sick') ? 'Medical Leave Request' : 'Academic Duty Leave Request';
  } else if (
    lower.includes('complaint') ||
    lower.includes('wifi') ||
    lower.includes('water') ||
    lower.includes('pipe') ||
    lower.includes('leakage') ||
    lower.includes('broken') ||
    lower.includes('repair')
  ) {
    intent = 'campus_complaint';
    title = 'Campus Infrastructure Complaint';
  } else if (
    lower.includes('grievance') ||
    lower.includes('grade') ||
    lower.includes('re-evaluation') ||
    lower.includes('mark') ||
    lower.includes('internal marks') ||
    lower.includes('wrong marks')
  ) {
    intent = 'academic_grievance';
    title = 'Academic Evaluation Grievance';
  } else if (lower.includes('scholarship') || lower.includes('financial aid')) {
    intent = 'scholarship_request';
    title = 'Scholarship Application & Assistance';
    if (!extractedData.purpose) extractedData.purpose = 'Scholarship Processing';
  } else if (lower.includes('fee') || lower.includes('tuition') || lower.includes('refund') || lower.includes('payment dispute')) {
    intent = 'fee_request';
    title = 'Fee Payment & Refund Query';
    if (!extractedData.purpose) extractedData.purpose = 'Fee Query';
  } else if (lower.includes('event') || lower.includes('club') || lower.includes('symposium') || lower.includes('fest')) {
    intent = 'event_permission';
    title = 'Event & Club Permission Request';
    if (!extractedData.purpose) extractedData.purpose = 'Campus Event Permission';
  } else if (lower.includes('internship letter') || lower.includes('internship noc') || lower.includes('internship permission')) {
    intent = 'internship_document';
    title = 'Internship Permission & Document Request';
    if (!extractedData.purpose) extractedData.purpose = 'Internship Approval';
  } else if (lower.includes('hostel') || lower.includes('warden') || lower.includes('gate pass')) {
    intent = 'hostel_request';
    title = 'Hostel Accommodation & Welfare Request';
    if (!extractedData.purpose) extractedData.purpose = 'Hostel Request';
  } else if (lower.includes('bus') || lower.includes('transport') || lower.includes('bus pass')) {
    intent = 'transportation_request';
    title = 'Campus Transportation & Bus Pass Request';
    if (!extractedData.purpose) extractedData.purpose = 'Transport Request';
  } else if (lower.includes('assistance') || lower.includes('general help') || lower.includes('support')) {
    intent = 'student_assistance';
    title = 'General Student Assistance Request';
    if (!extractedData.purpose) extractedData.purpose = 'General Assistance';
  }

  // Purpose extraction for general responses
  if (!extractedData.purpose) {
    if (lower.includes('family function') || lower.includes('family') || lower.includes('marriage') || lower.includes('wedding')) {
      extractedData.purpose = 'Family Function';
    } else if (lower.includes('sick') || lower.includes('fever') || lower.includes('medical') || lower.includes('health')) {
      extractedData.purpose = 'Medical Reasons';
    } else if (lower.includes('hackathon') || lower.includes('competition') || lower.includes('symposium')) {
      extractedData.purpose = 'Hackathon / Competition Participation';
    } else if (lower.includes('internship')) {
      extractedData.purpose = 'Internship Application';
    }
  }

  // Dates extraction for Leave
  if (intent === 'leave_request') {
    const fullDateRangeMatch = promptText.match(/(?:from\s+)?([a-zA-Z]+\s+\d{1,2}(?:\s*to\s*[a-zA-Z]+\s+\d{1,2}|\s*-\s*\d{1,2})|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?(?:\s*to\s*\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)?|september\s+\d{1,2}(?:\s*to\s*september\s+\d{1,2})?|\d+\s+days?)/i);
    if (fullDateRangeMatch) {
      extractedData.leave_dates = fullDateRangeMatch[0].trim();
    } else {
      const singleDateMatch = promptText.match(/([a-zA-Z]+\s+\d{1,2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|next week|tomorrow|next monday|september\s+\d{1,2})/i);
      if (singleDateMatch) {
        if (!extractedData.startDate) {
          extractedData.startDate = singleDateMatch[0].trim();
        } else if (!extractedData.endDate && singleDateMatch[0].trim() !== extractedData.startDate) {
          extractedData.endDate = singleDateMatch[0].trim();
          extractedData.leave_dates = `${extractedData.startDate} to ${extractedData.endDate}`;
        } else if (!extractedData.leave_dates) {
          extractedData.leave_dates = singleDateMatch[0].trim();
        }
      }
    }
  }

  // Subject / Course Extraction for Academic Grievances
  if (intent === 'academic_grievance') {
    const subjectMatch = promptText.match(/(data mining|operating systems|dbms|networks|python|java|mathematics|dsa|machine learning|[a-zA-Z\s]+(?=\s+marks|\s+subject|\s+course))/i);
    if (subjectMatch) {
      extractedData.subject = subjectMatch[0].trim();
      if (!extractedData.purpose) extractedData.purpose = `${extractedData.subject} Internal Marks Correction`;
    } else if (!extractedData.purpose) {
      extractedData.purpose = promptText;
    }
  }

  // Location Extraction for Maintenance Complaints
  if (intent === 'campus_complaint') {
    const locationMatch = promptText.match(/(hostel(?:\s+block\s+[a-z0-9]+|\s+room\s+\d+)?|room\s+\d+|lab\s+\d+|library|canteen|block\s+[a-z0-9]+)/i);
    if (locationMatch) {
      extractedData.location = locationMatch[0].trim();
    }
    if (!extractedData.purpose) extractedData.purpose = promptText;
  }

  return {
    intent,
    title,
    extractedData,
    confidence: intent !== 'unknown' ? 0.95 : 0.4,
  };
}

function generateNaturalFollowUp(workflowKey, extractedData) {
  if (workflowKey === 'leave_request') {
    if (!extractedData.leave_dates && !extractedData.startDate) {
      return "What date would you like your leave to start?";
    }
    if (extractedData.startDate && !extractedData.endDate && !extractedData.leave_dates) {
      return `Got it, starting on ${extractedData.startDate}. What date will your leave end?`;
    }
    if (!extractedData.purpose) {
      return "What is the reason for your leave request?";
    }
  }

  if (workflowKey === 'bonafide_certificate') {
    if (!extractedData.purpose) {
      return "What is the Bonafide Certificate required for? (e.g. Internship, Passport, Visa, Bank Account)";
    }
  }

  if (workflowKey === 'id_card_replacement') {
    if (!extractedData.purpose) {
      return "Could you specify the reason for the ID Card replacement? (e.g. Lost ID card, Damaged card)";
    }
  }

  if (workflowKey === 'campus_complaint') {
    if (!extractedData.location) {
      return "Where on campus is this issue located? (e.g. Hostel Block B Room 204, CSE Department Lab)";
    }
    if (!extractedData.purpose) {
      return "Please provide a brief description of the maintenance issue.";
    }
  }

  if (workflowKey === 'academic_grievance') {
    if (!extractedData.subject) {
      return "Which subject or course is this evaluation grievance for?";
    }
  }

  return "Could you please provide a few more details to complete your request?";
}

export class ConversationalAgent {
  static async processTurn({ user, promptText, conversationHistory = [], context = {} }) {
    console.log(`[ConversationalAgent] Action Turn for ${user.email}: "${promptText}"`);

    const studentProfile = await agentTools.get_student_profile({ userId: user._id });

    // 1. Check if this is purely an Informational Query (e.g., "How can I apply for a scholarship?")
    if (isInformationalQuery(promptText) && !context.workflowKey) {
      const infoResponse = handleInformationalAnswer(promptText);
      return {
        success: true,
        responseText: infoResponse,
        stage: 'INFORMATIONAL_RESPONSE',
        workflowKey: null,
        extractedData: {},
        reasoningTrace: [
          { stage: 'INTAKE', title: 'Informational Query Detected', detail: 'User asked an informational question. Provided direct guidance without initiating workflow.', status: 'completed' },
        ],
      };
    }

    let extractedData = {
      ...(context.extractedData || {}),
      studentName: studentProfile?.name,
      studentId: studentProfile?.studentId,
      department: studentProfile?.department?.name,
      email: studentProfile?.email,
      designation: studentProfile?.designation,
    };

    let currentWorkflowKey = context.workflowKey || null;
    let currentStage = context.stage || 'INTAKE';

    const explicitConfirm = isExplicitConfirmation(promptText);

    // 2. Explicit Confirmation to Submit
    if (explicitConfirm && currentWorkflowKey && (currentStage === 'AWAITING_CONFIRMATION' || currentStage === 'CONFIRMATION_PENDING')) {
      await AuditLog.create({
        institutionId: user.institutionId || null,
        userId: user._id,
        action: 'AI_STUDENT_CONFIRMATION_RECEIVED',
        metadata: { workflowKey: currentWorkflowKey, extractedData },
      });

      const workflowDef = await agentTools.get_workflow_definition({ workflowKey: currentWorkflowKey });
      const requestTitle = context.title || workflowDef?.name || 'Student Request';

      const createdRequest = await agentTools.create_request({
        user,
        workflowKey: currentWorkflowKey,
        title: requestTitle,
        description: promptText,
        extractedData,
        priority: context.priority || 'NORMAL',
      });

      await AuditLog.create({
        institutionId: user.institutionId || null,
        requestId: createdRequest._id,
        userId: user._id,
        action: 'AI_REQUEST_CREATED',
        metadata: { requestNumber: createdRequest.requestNumber, workflowKey: currentWorkflowKey },
      });

      const responseText = `Request submitted. Request ID: ${createdRequest.requestNumber}. Status: Pending approval.`;

      return {
        success: true,
        responseText,
        stage: 'SUBMITTED',
        workflowKey: currentWorkflowKey,
        extractedData,
        createdRequest,
        reasoningTrace: [
          { stage: 'CONFIRMATION', title: 'Student Confirmation Received', detail: 'Explicit confirmation acknowledged.', status: 'completed' },
          { stage: 'EXECUTION', title: 'Backend Request Creation', detail: `Created ${createdRequest.requestNumber} via WorkflowEngine.`, status: 'completed' },
        ],
      };
    }

    // 3. Extraction Pipeline (Gemini LLM or Rule Engine)
    let aiParsed = null;
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: process.env.AI_MODEL || 'gemini-1.5-flash' });

        const prompt = `
You are the CampusOS AI Conversational Agent. Analyze the student's message, existing context, and return ONLY JSON:

Available Workflows:
- "leave_request": Leave / Duty leave / Sick leave. Required fields: "purpose", "leave_dates".
- "bonafide_certificate": Bonafide certificate for internship, passport, visa, bank. Required fields: "purpose".
- "id_card_replacement": Lost/Damaged ID card. Required fields: "purpose".
- "campus_complaint": Hostel, wifi, water, pipe, maintenance issue. Required fields: "purpose", "location".
- "academic_grievance": Grade, exam, re-evaluation appeal. Required fields: "purpose", "subject".
- "fee_issue": Fees, payment, dues. Required fields: "purpose", "description".
- "unknown": Ambiguous query requiring category clarification.

Existing Extracted Data: ${JSON.stringify(extractedData)}
Current Workflow Key: "${currentWorkflowKey || ''}"
Student Message: "${promptText}"

Return JSON matching:
{
  "intent": "leave_request" | "bonafide_certificate" | "id_card_replacement" | "campus_complaint" | "academic_grievance" | "fee_issue" | "unknown",
  "confidence": number (0 to 1),
  "title": string,
  "extractedData": { ...merged fields }
}
`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          aiParsed = JSON.parse(match[0]);
        }
      } catch (err) {
        console.warn('[ConversationalAgent] Gemini LLM warning:', err.message);
      }
    }

    if (!aiParsed) {
      aiParsed = extractStructuredData(promptText, currentWorkflowKey, extractedData, studentProfile);
    }

    extractedData = { ...extractedData, ...(aiParsed.extractedData || {}) };
    currentWorkflowKey = (aiParsed.intent && aiParsed.intent !== 'unknown') ? aiParsed.intent : currentWorkflowKey;

    // 4. Ambiguous Intent Resolution
    if (!currentWorkflowKey || currentWorkflowKey === 'unknown' || aiParsed.confidence < 0.6) {
      return {
        success: true,
        responseText: "I can help with that! Is the issue related to academics, fees, hostel, transportation, campus facilities, documents, or something else?",
        stage: 'CLARIFYING_INTENT',
        workflowKey: null,
        extractedData,
        reasoningTrace: [
          { stage: 'INTAKE', title: 'Intent Clarification', detail: 'General query detected. Solicit category choice.', status: 'action_required' },
        ],
      };
    }

    // 5. Retrieve Workflow & Check Required Fields
    const workflowDef = await agentTools.get_workflow_definition({ workflowKey: currentWorkflowKey });
    const validationCheck = await agentTools.check_required_information({
      workflowKey: currentWorkflowKey,
      extractedData,
    });

    const routingResult = await RoutingAgent.resolveRouting(currentWorkflowKey, studentProfile);

    // 6. If Missing Mandatory Info -> Ask Natural Single Question (DO NOT SUBMIT REQUEST)
    if (!validationCheck.valid && validationCheck.missing.length > 0) {
      const missingFields = validationCheck.missing;
      const questionText = generateNaturalFollowUp(currentWorkflowKey, extractedData);

      await AuditLog.create({
        institutionId: user.institutionId || null,
        userId: user._id,
        action: 'AI_MISSING_INFO_REQUESTED',
        metadata: { workflowKey: currentWorkflowKey, missingFields },
      });

      return {
        success: true,
        responseText: questionText,
        stage: 'COLLECTING_INFO',
        workflowKey: currentWorkflowKey,
        title: aiParsed.title || workflowDef?.name || 'Campus Request',
        extractedData,
        missingFields,
        reasoningTrace: [
          { stage: 'INTAKE', title: 'Intent Classification', detail: `Identified workflow: ${workflowDef?.name || currentWorkflowKey}`, status: 'completed' },
          { stage: 'VALIDATION', title: 'Minimum Necessary Info Check', detail: `Asking natural follow-up for missing information: ${missingFields.join(', ')}`, status: 'action_required' },
        ],
      };
    }

    // 7. All Information Present -> Present Concise Confirmation Summary
    currentStage = 'AWAITING_CONFIRMATION';

    let responseText = '';
    if (currentWorkflowKey === 'id_card_replacement') {
      responseText = `Got it. ID card replacement for ${studentProfile?.name || 'Student'}. Submit this request?`;
    } else if (currentWorkflowKey === 'leave_request') {
      responseText = `Got it. Leave from ${extractedData.leave_dates}${extractedData.purpose ? ' for ' + extractedData.purpose : ''}. Submit this leave request?`;
    } else if (currentWorkflowKey === 'academic_grievance') {
      responseText = `Got it. Academic evaluation grievance for ${extractedData.subject || 'course'}. Submit this request?`;
    } else {
      responseText = `Got it. ${workflowDef?.name || 'Request'}${extractedData.purpose ? ': ' + extractedData.purpose : ''}. Submit this request?`;
    }

    await AuditLog.create({
      institutionId: user.institutionId || null,
      userId: user._id,
      action: 'AI_WORKFLOW_SELECTED',
      metadata: { workflowKey: currentWorkflowKey, extractedData },
    });

    return {
      success: true,
      responseText,
      stage: 'AWAITING_CONFIRMATION',
      workflowKey: currentWorkflowKey,
      title: aiParsed.title || workflowDef?.name || 'Campus Request',
      extractedData,
      routing: routingResult,
      summary: {
        type: workflowDef?.name || currentWorkflowKey,
        purpose: extractedData.purpose || 'General Request',
        dates: extractedData.leave_dates || null,
        location: extractedData.location || null,
        subject: extractedData.subject || null,
        department: routingResult.departmentName,
        assignedTo: `${routingResult.assignedUserName} (${routingResult.assignedUserRole})`,
      },
      reasoningTrace: [
        { stage: 'INTAKE', title: 'Intent Classification', detail: `Workflow: ${workflowDef?.name || currentWorkflowKey}`, status: 'completed' },
        { stage: 'VALIDATION', title: 'Information Validation', detail: 'All mandatory workflow fields verified.', status: 'completed' },
        { stage: 'ROUTING', title: 'Dynamic Authority Routing', detail: `Routed to ${routingResult.departmentName} (${routingResult.assignedUserName})`, status: 'completed' },
        { stage: 'CONFIRMATION', title: 'Student Confirmation Summary', detail: 'Awaiting explicit confirmation to submit.', status: 'pending' },
      ],
    };
  }
}
