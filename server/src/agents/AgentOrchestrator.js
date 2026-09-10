import { GoogleGenerativeAI } from '@google/generative-ai';
import { IntakeAgent } from './intakeAgent.js';
import { WorkflowAgent } from './workflowAgent.js';
import { ValidationAgent } from './validationAgent.js';
import { RoutingAgent } from './routingAgent.js';
import { agentTools } from '../tools/agentTools.js';

export class AgentOrchestrator {
  /**
   * Orchestrates the agent pipeline: Intake -> Workflow -> Validation -> Routing
   */
  static async analyzeRequest({ promptText, user }) {
    console.log(`[AgentOrchestrator] Processing prompt for user ${user?.name}: "${promptText}"`);

    const studentProfile = await agentTools.get_student_profile({ userId: user._id });

    // 1. Intake Agent Pipeline
    let intakeResult = null;
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: process.env.AI_MODEL || 'gemini-1.5-flash' });
        
        const systemPrompt = `
You are the CampusOS AI Intake Agent. Analyze the student request and output ONLY a JSON object matching this schema:
{
  "intent": "id_card_replacement" | "certificate_request" | "leave_request" | "campus_complaint" | "academic_grievance" | "unknown",
  "title": "Short descriptive title",
  "category": "student_services" | "certificate_services" | "leave_permissions" | "maintenance" | "academic_appeals",
  "urgency": "LOW" | "NORMAL" | "HIGH" | "URGENT",
  "extractedData": { "purpose": string, "subject": string, "location": string, "leave_dates": string },
  "confidence": number between 0 and 1
}

Student Request: "${promptText}"
`;

        const result = await model.generateContent(systemPrompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          intakeResult = {
            ...parsed,
            description: promptText,
            extractedData: { ...parsed.extractedData, studentName: studentProfile?.name, studentId: studentProfile?.studentId },
          };
        }
      } catch (err) {
        console.warn(`[AgentOrchestrator] Gemini LLM call failed (${err.message}). Using IntakeAgent parser.`);
      }
    }

    if (!intakeResult) {
      intakeResult = IntakeAgent.parse(promptText, studentProfile);
    }

    // 2. Workflow Agent Pipeline
    const workflowSelection = await WorkflowAgent.selectWorkflow(intakeResult.intent, intakeResult.confidence);

    // 3. Validation Agent Pipeline
    const validationResult = await ValidationAgent.validate(workflowSelection.workflowKey, intakeResult.extractedData);

    // 4. Routing Agent Pipeline
    const routingResult = await RoutingAgent.resolveRouting(workflowSelection.workflowKey, studentProfile);

    // 5. Build Agent Execution Trace
    const executionTrace = [
      {
        stage: 'INTAKE',
        title: 'Intent & Urgency Detection',
        detail: `Intent: ${intakeResult.intent.toUpperCase()} (${intakeResult.category}). Urgency: ${intakeResult.urgency}. Confidence: ${(intakeResult.confidence * 100).toFixed(0)}%`,
        status: 'completed',
      },
      {
        stage: 'WORKFLOW',
        title: 'Workflow Selection',
        detail: workflowSelection.reason,
        status: 'completed',
      },
      {
        stage: 'VALIDATION',
        title: 'Information Validation',
        detail: validationResult.valid
          ? 'All mandatory fields validated against database workflow rules.'
          : `Missing required fields: ${validationResult.missingFields.join(', ')}`,
        status: validationResult.valid ? 'completed' : 'action_required',
      },
      {
        stage: 'ROUTING',
        title: 'Department & Officer Routing',
        detail: routingResult.routingReason,
        status: 'completed',
      },
    ];

    const needsClarification = intakeResult.confidence < 0.60 || intakeResult.intent === 'unknown';

    return {
      studentProfile,
      analysis: {
        intent: intakeResult.intent,
        request_type: intakeResult.intent,
        workflow_key: workflowSelection.workflowKey,
        workflow_id: workflowSelection.workflowId,
        title: intakeResult.title,
        priority: intakeResult.urgency,
        purpose: intakeResult.extractedData.purpose || 'General Request',
        confidence: intakeResult.confidence,
        needs_clarification: needsClarification,
        extractedData: intakeResult.extractedData,
        missing_information: validationResult.missingFields,
        responsible_department_code: routingResult.departmentCode,
        responsible_department_name: routingResult.departmentName,
        assigned_user_id: routingResult.assignedUserId,
        assigned_user_name: routingResult.assignedUserName,
        assigned_user_role: routingResult.assignedUserRole,
        assigned_user_designation: routingResult.assignedUserDesignation,
        reasoning_steps: executionTrace,
      },
    };
  }
}
