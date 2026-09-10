# CampusOS AI — University & Campus Workflow Automation Platform

> **PS4 Hackathon Solution**: AI-powered enterprise operating system converting student, faculty, and administrative natural-language requests into structured, trackable, role-permissioned multi-step campus workflows.

---

## 🌟 Executive Summary

Traditional university workflow management suffers from manual paperwork, fragmented department silos, slow approval delays, and lack of real-time request tracking.

**CampusOS AI** solves this problem by replacing static forms and simple chatbots with a **true agentic workflow engine**. Students interact with the platform in plain natural language (e.g., *"I need a bonafide certificate for my internship"*). The system automatically parses intent, selects declarative workflow templates, validates missing fields, routes requests to authorized department staff, enforces role permissions, and tracks execution through completion.

---

## 🏗️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                               CLIENT (React + Vite)                               |
|  +-------------------+  +-------------------+  +-------------------+              |
|  |  Student Portal   |  |   Staff Portal    |  |    Admin Portal   |              |
|  | - AI Assistant    |  | - Review Queue    |  | - Workflow Config |              |
|  | - Request Tracker |  | - Approvals/Reject|  | - Department Mgt  |              |
|  | - Notification    |  | - Escalation      |  | - Analytics/Audit |              |
|  +-------------------+  +-------------------+  +-------------------+              |
+------------------------------------------|----------------------------------------+
                                           | REST APIs / JWT Auth
+------------------------------------------v----------------------------------------+
|                                SERVER (Node.js + Express)                         |
|  +-----------------------------------------------------------------------------+  |
|  |                             REST API & RBAC LAYER                           |  |
|  +-----------------------------------------------------------------------------+  |
|  |                     AGENTIC WORKFLOW ARCHITECTURE                           |  |
|  |  [Intake Agent] -> [Workflow Agent] -> [Validation Agent] -> [Routing Agent]  |  |
|  |  [Document Agent]->[Approval Agent] -> [Notification Agent]->[Escalation Agt]  |  |
|  |  * Agent Tool Registry (get_student_profile, create_request, approve, etc.) |  |
|  +-----------------------------------------------------------------------------+  |
|  |                             WORKFLOW ENGINE                                 |  |
|  |  State Transition Machine, Step Execution, Conditional Branching, Audit Log  |  |
|  +-----------------------------------------------------------------------------+  |
|  |                           DATABASE (Mongoose / MongoDB)                     |  |
|  |  users, departments, workflows, requests, documents, approvals,             |  |
|  |  notifications, audit_logs                                                  |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 🤖 Specialized Logical Agents & Application Tools

CampusOS AI separates AI reasoning from direct database access. Logical agents consume application tools with strict validation:

1. **Intake Agent**: Parses natural language inputs into structured JSON (`intent`, `request_type`, `priority`, `entities`).
2. **Workflow Agent**: Maps detected intents to registered workflow templates.
3. **Validation Agent**: Compares extracted parameters against mandatory fields and student profile data.
4. **Routing Agent**: Resolves target department codes and assigns authorized staff based on student department context.
5. **Approval Agent**: Enforces state machine progression without bypassing RBAC.
6. **Notification Agent**: Generates context-aware real-time user alerts.
7. **Escalation Agent**: Identifies delayed requests and escalates to department HODs.

### Authorized Application Tools
- `get_student_profile(userId)`
- `get_departments()`
- `get_workflows()`
- `check_required_information(workflowKey, data)`
- `create_request(userId, workflowKey, title, description, data)`
- `approve_request(requestId, user, comments)`
- `reject_request(requestId, user, comments)`
- `escalate_request(requestId, user, comments)`
- `create_notification(userId, title, message, type)`

---

## 🔄 Core MVP Workflows

1. **Certificate / Bonafide Request** (Primary Demo Flow):
   - `SUBMITTED` → `VALIDATION` → `DEPARTMENT_REVIEW` → `APPROVAL` → `COMPLETED`
   - Department: *Student Section / Academic Registrar*
2. **Leave / Permission Request**:
   - `SUBMITTED` → `VALIDATION` → `FACULTY_REVIEW` → `HOD_APPROVAL` → `COMPLETED`
   - Department: *Student's Academic Department (e.g. CSE)*
3. **Campus Infrastructure Complaint**:
   - `SUBMITTED` → `VALIDATION` → `MAINTENANCE_TRIAGE` → `RESOLUTION` → `VERIFICATION` → `CLOSED`
   - Department: *Campus Maintenance*
4. **Academic Grievance**:
   - `SUBMITTED` → `VALIDATION` → `DEAN_REVIEW` → `COMMITTEE_HEARING` → `RESOLUTION` → `CLOSED`
   - Department: *Examination & Evaluation*

---

## 🔐 Role-Based Access Control (RBAC) & Security

CampusOS AI enforces multi-tier authorization on all REST endpoints:

- **STUDENT**: Can submit requests, view personal requests, and track visual workflow timelines. Cannot view other students' requests or approve steps.
- **STAFF / FACULTY**: Can access department queue, review student requests, inspect AI-extracted parameters, approve/reject, or request more information.
- **HOD**: Can approve escalated requests, view department analytics, and manage department review rules.
- **ADMIN**: Global management over workflows, user directory, departments, audit trails, and system-wide metrics.

---

## 🔑 Demo Credentials (For Judging Evaluation)

| Role | Email | Password | Account Name |
|---|---|---|---|
| **Student** | `surya@campus.edu` | `password123` | Surya (CSE Student) |
| **Student 2** | `rahul@campus.edu` | `password123` | Rahul Sharma (CSE Student) |
| **Student Section Staff** | `staff.student@campus.edu` | `password123` | Vikram Singh |
| **Faculty Advisor** | `faculty.cse@campus.edu` | `password123` | Dr. Ramesh Kumar |
| **CSE HOD** | `hod.cse@campus.edu` | `password123` | Dr. A. K. Verma |
| **Administrator** | `admin@campus.edu` | `password123` | System Admin |

*Tip: Use the **Demo Role Switcher** in the top navigation bar to switch user accounts in 1-click during your presentation.*

---

## ⚡ Quick Start & Setup

### Prerequisites
- Node.js v18+
- npm v9+

### 1. Backend Server Setup
```bash
cd server
npm install
npm run seed     # Seeds realistic users, departments & workflows
npm start        # Starts Express server on http://localhost:5000
```
*Note: Includes an embedded `mongodb-memory-server` fallback. It connects out-of-the-box without requiring local MongoDB server setup.*

### 2. Frontend Client Setup
```bash
cd client
npm install
npm run dev      # Starts Vite dev server on http://localhost:3000
```

---

## 🎬 Live Hackathon Demo Walkthrough Scenario

1. **Login as Student (Surya)**:
   - Type `"I need a bonafide certificate for my internship."` in the AI Request Assistant.
   - Observe live AI reasoning steps: Intent (`certificate_request`), Workflow (`bonafide_certificate`), Target Dept (`Student Section`), Required Fields (`Student ID`, `Purpose`).
   - Click **Confirm & Create Request**.
2. **Switch Role to Staff (Vikram Singh — Student Section Staff)**:
   - Request appears immediately in the Staff Queue.
   - Click **Review & Action** → Inspect student profile, extracted parameters, and description.
   - Enter remark: *"Student registration verified. Approved."* → Click **Approve Request**.
3. **Switch Role back to Student (Surya)**:
   - Receive notification: *"Your bonafide certificate request has been approved and completed!"*
   - Open Request Timeline to view all green completed workflow steps (`SUBMITTED` → `VALIDATION` → `DEPARTMENT_REVIEW` → `APPROVAL` → `COMPLETED`).
