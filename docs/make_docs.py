#!/usr/bin/env python3
"""Generate WSMS Word documents: Project Abstract and SRS."""

from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

PRIMARY = RGBColor(0x2F, 0x6D, 0xF6)
DARK = RGBColor(0x1B, 0x23, 0x30)
MUTED = RGBColor(0x6B, 0x76, 0x86)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)


def shade(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)


def base_styles(doc):
    st = doc.styles["Normal"]
    st.font.name = "Calibri"
    st.font.size = Pt(11)
    st.font.color.rgb = DARK


def title_block(doc, title, subtitle, code):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(title)
    r.font.size = Pt(24)
    r.font.bold = True
    r.font.color.rgb = PRIMARY
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r2 = p2.add_run(subtitle)
    r2.font.size = Pt(13)
    r2.font.color.rgb = MUTED
    p3 = doc.add_paragraph()
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r3 = p3.add_run(code)
    r3.font.size = Pt(11)
    r3.font.bold = True
    r3.font.color.rgb = DARK
    # divider
    pd = doc.add_paragraph()
    pbdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "12")
    bottom.set(qn("w:color"), "2F6DF6")
    bottom.set(qn("w:space"), "1")
    pbdr.append(bottom)
    pd.paragraph_format.element.get_or_add_pPr().append(pbdr)


def h1(doc, text):
    p = doc.add_paragraph()
    p.space_before = Pt(10)
    r = p.add_run(text)
    r.font.size = Pt(15)
    r.font.bold = True
    r.font.color.rgb = PRIMARY
    return p


def h2(doc, text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.font.size = Pt(12.5)
    r.font.bold = True
    r.font.color.rgb = DARK
    return p


def para(doc, text, size=11):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.font.size = Pt(size)
    return p


def bullet(doc, text, bold_lead=None):
    p = doc.add_paragraph(style="List Bullet")
    if bold_lead:
        r = p.add_run(bold_lead)
        r.font.bold = True
        r.font.size = Pt(11)
        r2 = p.add_run(text)
        r2.font.size = Pt(11)
    else:
        r = p.add_run(text)
        r.font.size = Pt(11)
    return p


def table(doc, headers, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.style = "Table Grid"
    hdr = t.rows[0].cells
    for i, h in enumerate(headers):
        shade(hdr[i], "2F6DF6")
        pr = hdr[i].paragraphs[0]
        run = pr.add_run(h)
        run.font.bold = True
        run.font.color.rgb = WHITE
        run.font.size = Pt(10.5)
    for ri, row in enumerate(rows):
        cells = t.add_row().cells
        for ci, val in enumerate(row):
            if ri % 2 == 1:
                shade(cells[ci], "F2F5FB")
            pr = cells[ci].paragraphs[0]
            run = pr.add_run(str(val))
            run.font.size = Pt(10)
    if widths:
        for ci, w in enumerate(widths):
            for cell in t.columns[ci].cells:
                cell.width = Inches(w)
    return t


# =====================================================================
# DOCUMENT 1 — PROJECT ABSTRACT
# =====================================================================
def build_abstract():
    doc = Document()
    base_styles(doc)
    title_block(doc, "Project Abstract",
                "Web Based Stationery Management System", "Project Code: WSMS_013")

    h1(doc, "1. Problem Statement")
    para(doc, "In most institutions the request for stationery is tracked informally through "
              "e-mail, Excel sheets or paper registers. This leads to tremendous wastage of "
              "resources and effort: the quantity kept in the store may be more than needed "
              "(over-stocking), the supply of some items may be less than needed (stock-outs), "
              "and there is no single, reliable view of who requested what and the approval status "
              "of each request. Management has no consolidated, high-level view of stationery cost.")

    h1(doc, "2. Objective")
    para(doc, "To develop a web-based tool that tracks stationery requests for any institution "
              "(college, organization, etc.) end-to-end — from raising a request, through "
              "role-based eligibility checks and manager approval, to automatic notifications and "
              "management cost reporting — thereby reducing wastage and giving higher management a "
              "clear, real-time view of consumption and cost.")

    h1(doc, "3. Proposed Solution")
    para(doc, "WSMS is a full-stack web application. A React single-page front-end communicates "
              "with a Spring Boot REST back-end secured with JWT. Each user belongs to a department "
              "and holds a designation in the institutional hierarchy (Lecturer → Professor → HoD → "
              "Dean → Principal), which determines their purchase eligibility. Registered users browse "
              "the items they are eligible for (grouped into categories), check their remaining "
              "eligibility, and apply for stationery as a single request containing one or more line "
              "items with a from/to date range. Managers review the requests "
              "that arrive and approve or reject them; approval decrements stock and an approved "
              "request may later be cancelled (with manager confirmation, which restores stock). "
              "Every state change triggers an automatic e-mail to the requestor and their superior. "
              "Managers can view a cost report showing per-item cost, percentage of the total, "
              "head count and the cumulative cost.")

    h1(doc, "4. Modules")
    table(doc, ["#", "Module", "Responsibility"], [
        ["1", "Login / Registration", "Register, login, change password (JWT + BCrypt)"],
        ["2", "Stationery Availability / Eligibility", "Role-based item availability and purchase eligibility"],
        ["3", "Stationery Request / Cancellation", "Apply, withdraw pending, cancel approved"],
        ["4", "Managers Action", "View all requests, approve / reject, confirm cancellations"],
        ["5", "Help", "Usage guidance for users and managers"],
        ["6", "e-Mail", "Automatic notifications on every state change"],
        ["7", "Report", "Per-item cost, %, head count, cumulative total"],
    ], widths=[0.4, 2.6, 4.0])

    h1(doc, "5. Users and Roles")
    bullet(doc, "Register/login, view availability and eligibility, apply/withdraw/cancel requests, "
                "track status, change password.", "Regular User (Requestor): ")
    bullet(doc, "All of the above, plus view all arrived requests, approve/reject, confirm "
                "cancellations and view the cost report. A manager is an approver and can also be a "
                "requestor.", "Manager (Approver): ")
    bullet(doc, "The approver named on a request; receives e-mail notifications about the "
                "requestor's activity.", "Superior: ")
    bullet(doc, "Each user has a department and a designation; the designation (Lecturer, Professor, "
                "HoD, Dean, Principal) sets the purchase-eligibility cap.", "Hierarchy: ")

    h1(doc, "6. Data Model (normalized)")
    para(doc, "The schema is normalized into 10 tables: roles, departments, designations, "
              "stationery_categories, users, stationery_items, stationery_requests, request_items "
              "(line items), request_status_history (audit trail) and email_notifications (sent log); "
              "request status is an enumeration. See the separate ER Diagram artefact for details.")

    h1(doc, "7. Technologies")
    table(doc, ["Layer", "Technology"], [
        ["Frontend", "React 18, Vite, React Router, Axios"],
        ["Backend", "Spring Boot 3.5, Spring MVC (REST)"],
        ["Security", "Spring Security, JWT (jjwt), BCrypt"],
        ["Persistence", "Spring Data JPA, Hibernate ORM"],
        ["Database", "H2 (in-memory); MySQL-ready"],
        ["Mail", "Spring Mail (JavaMail / SMTP)"],
        ["Build & Test", "Maven, Node/npm, JUnit 5, Mockito"],
    ], widths=[1.8, 4.6])

    h1(doc, "8. Expected Outcome")
    para(doc, "A working, auditable stationery request system that replaces ad-hoc tracking, "
              "enforces eligibility and stock rules, keeps requestors and superiors informed by "
              "e-mail, and provides management with consolidated cost reporting to reduce resource "
              "wastage.")

    doc.save("01_Project_Abstract.docx")
    print("Saved 01_Project_Abstract.docx")


# =====================================================================
# DOCUMENT 2 — SRS
# =====================================================================
def build_srs():
    doc = Document()
    base_styles(doc)
    title_block(doc, "Software Requirements Specification",
                "Web Based Stationery Management System", "Project Code: WSMS_013")

    h1(doc, "1. Introduction")
    h2(doc, "1.1 Purpose")
    para(doc, "This document specifies the functional and non-functional requirements of the Web "
              "Based Stationery Management System (WSMS). It is intended for developers, testers, "
              "evaluators and project stakeholders.")
    h2(doc, "1.2 Scope")
    para(doc, "WSMS tracks stationery requests for an institution. It supports two roles — Regular "
              "User and Manager — with role-based eligibility, an approval and cancellation "
              "workflow, automatic e-mail notifications, and management cost reporting. Procurement, "
              "payments and multi-level approval chains are out of scope.")
    h2(doc, "1.3 Definitions, Acronyms and Abbreviations")
    table(doc, ["Term", "Meaning"], [
        ["Requestor", "A user who raises a stationery request"],
        ["Approver / Manager", "A user who approves or rejects requests"],
        ["Superior", "The approver notified on a request"],
        ["Eligibility", "Role-based maximum purchase value a user may commit"],
        ["JWT", "JSON Web Token used for stateless authentication"],
        ["SRS", "Software Requirements Specification"],
    ], widths=[1.8, 4.6])
    h2(doc, "1.4 Overview")
    para(doc, "Section 2 gives the overall description; Section 3 lists specific requirements — "
              "functional, interface and non-functional; Section 4 contains the request lifecycle "
              "appendix.")

    h1(doc, "2. Overall Description")
    h2(doc, "2.1 Product Perspective")
    para(doc, "A self-contained web application: a React single-page front-end and a Spring Boot "
              "REST back-end communicating over HTTPS/JSON, persisting to a normalized relational "
              "database of 10 tables (H2 in-memory for the demo) and sending e-mail via SMTP.")
    h2(doc, "2.2 Product Functions (summary)")
    bullet(doc, "Registration (with department & designation), login and password change.")
    bullet(doc, "Role-based stationery availability and designation-based eligibility display.")
    bullet(doc, "Multi-item request application, withdrawal and cancellation.")
    bullet(doc, "Manager approval / rejection and cancellation confirmation.")
    bullet(doc, "Automatic e-mail notifications, full status-history audit, and management cost reporting.")
    h2(doc, "2.3 User Classes and Characteristics")
    table(doc, ["User Class", "Characteristics"], [
        ["Regular User", "Basic computer literacy; raises and tracks own requests"],
        ["Manager", "Approver; reviews requests and reads cost reports"],
    ], widths=[1.8, 4.6])
    h2(doc, "2.4 Operating Environment")
    bullet(doc, "Server: JVM 21+ (Spring Boot). Client: any modern web browser.")
    bullet(doc, "Database: H2 in-memory (demo); portable to MySQL/PostgreSQL.")
    bullet(doc, "Mail: an SMTP server for outbound notifications.")
    h2(doc, "2.5 Design and Implementation Constraints")
    bullet(doc, "Designation-based purchase cap — e.g. Lecturer 5000 … Principal 50000 (configurable).")
    bullet(doc, "A request cannot exceed available stock or the user's remaining eligibility.")
    bullet(doc, "Passwords stored only as BCrypt hashes; access controlled by role.")
    h2(doc, "2.7 Data Model (10 tables)")
    table(doc, ["Table", "Purpose", "Key references"], [
        ["roles", "Access role (USER/MANAGER)", "—"],
        ["departments", "Institutional department", "—"],
        ["designations", "Hierarchy level + eligibility cap", "—"],
        ["stationery_categories", "Item grouping", "—"],
        ["users", "Accounts", "role, designation, department, superior(self)"],
        ["stationery_items", "Catalogue + stock", "category, min_role"],
        ["stationery_requests", "Request header", "requestor, approver"],
        ["request_items", "Request line items", "request, item"],
        ["request_status_history", "Status-change audit", "request, changed_by"],
        ["email_notifications", "Sent e-mail log", "request"],
    ], widths=[1.9, 2.5, 2.0])
    h2(doc, "2.6 Assumptions and Dependencies")
    bullet(doc, "Each user knows and provides their superior's e-mail address.")
    bullet(doc, "Stock is decremented on approval and restored when an approved request is cancelled.")
    bullet(doc, "An SMTP server is reachable; if not, notifications are logged and the workflow still completes.")

    h1(doc, "3. Specific Requirements")
    h2(doc, "3.1 Functional Requirements")
    para(doc, "All functional requirements are listed below, grouped by module. Priority: "
              "H = High, M = Medium.")

    # Module 1
    h2(doc, "Module 1 — Login / Registration")
    table(doc, ["ID", "Requirement", "Pri"], [
        ["FR-1.1", "The system shall allow a person to register with username, email, password, department, designation and (optionally) a superior.", "H"],
        ["FR-1.2", "The system shall allow a person to register either as a Regular User or as a Manager.", "H"],
        ["FR-1.3", "The system shall allow a registered person to log in from the first page of the application.", "H"],
        ["FR-1.4", "The system shall allow a logged-in user to change their password.", "H"],
        ["FR-1.5", "The system shall reject duplicate usernames or e-mail addresses on registration.", "M"],
    ], widths=[0.8, 5.2, 0.5])

    # Module 2
    h2(doc, "Module 2 — Stationery Availability / Eligibility")
    table(doc, ["ID", "Requirement", "Pri"], [
        ["FR-2.1", "The system shall display stationery items with name, description, available quantity and unit cost.", "H"],
        ["FR-2.2", "The system shall filter item availability by the user's role (manager-only items hidden from regular users).", "H"],
        ["FR-2.3", "The system shall display the user's eligibility: designation-based maximum value, committed value and remaining value.", "H"],
    ], widths=[0.8, 5.2, 0.5])

    # Module 3
    h2(doc, "Module 3 — Stationery Request / Cancellation")
    table(doc, ["ID", "Requirement", "Pri"], [
        ["FR-3.1", "The system shall allow a user to apply for a request containing one or more line items (item + quantity) with a from/to date range.", "H"],
        ["FR-3.2", "The system shall record the requestor's superior e-mail on each request.", "H"],
        ["FR-3.3", "The system shall reject a request whose quantity exceeds available stock.", "H"],
        ["FR-3.4", "The system shall reject a request whose cost exceeds the user's remaining eligibility.", "H"],
        ["FR-3.5", "The system shall let a user view their current requests and the status of each.", "H"],
        ["FR-3.6", "The system shall let a user withdraw a request that has not yet been approved.", "M"],
        ["FR-3.7", "The system shall let a user request cancellation of an already-approved request.", "M"],
    ], widths=[0.8, 5.2, 0.5])

    # Module 4
    h2(doc, "Module 4 — Managers Action")
    table(doc, ["ID", "Requirement", "Pri"], [
        ["FR-4.1", "The system shall let a manager view all stationery requests that have arrived.", "H"],
        ["FR-4.2", "The system shall let a manager approve or reject a submitted request, with optional comments.", "H"],
        ["FR-4.3", "The system shall decrement item stock when a request is approved.", "H"],
        ["FR-4.4", "The system shall let a manager confirm a cancellation and restore stock accordingly.", "M"],
        ["FR-4.5", "The system shall restrict manager actions to users with the Manager role.", "H"],
    ], widths=[0.8, 5.2, 0.5])

    # Module 5
    h2(doc, "Module 5 — Help")
    table(doc, ["ID", "Requirement", "Pri"], [
        ["FR-5.1", "The system shall provide help describing how to use the system for both users and managers.", "M"],
    ], widths=[0.8, 5.2, 0.5])

    # Module 6
    h2(doc, "Module 6 — e-Mail")
    table(doc, ["ID", "Requirement", "Pri"], [
        ["FR-6.1", "The system shall send an e-mail to the requestor and superior when a request is submitted.", "H"],
        ["FR-6.2", "The system shall send an e-mail when a request is approved, rejected, withdrawn or cancelled.", "H"],
        ["FR-6.3", "The system shall send an e-mail to the user when their password is changed.", "H"],
    ], widths=[0.8, 5.2, 0.5])

    # Module 7
    h2(doc, "Module 7 — Report")
    table(doc, ["ID", "Requirement", "Pri"], [
        ["FR-7.1", "The system shall produce a report of cost incurred per item over approved requests.", "H"],
        ["FR-7.2", "The report shall show the percentage of total cost and the head count per item.", "H"],
        ["FR-7.3", "The report shall show the cumulative cost across all items.", "H"],
    ], widths=[0.8, 5.2, 0.5])

    h2(doc, "3.2 External Interface Requirements")
    para(doc, "User interfaces — web pages: Login, Register, Dashboard, Availability, Eligibility, "
              "New Request, My Requests, Approvals, Report, Help, Change Password.")
    para(doc, "Software (API) interfaces — REST endpoints (JSON over HTTP, JWT bearer auth):")
    table(doc, ["Method & Path", "Purpose"], [
        ["POST /api/auth/register", "Register a new user"],
        ["POST /api/auth/login", "Authenticate and obtain a JWT"],
        ["POST /api/auth/change-password", "Change own password"],
        ["GET /api/items", "List items (role-filtered)"],
        ["GET /api/eligibility", "Get caller's eligibility"],
        ["POST /api/requests", "Apply for a request"],
        ["GET /api/requests/my", "List own requests"],
        ["POST /api/requests/{id}/withdraw", "Withdraw a pending request"],
        ["POST /api/requests/{id}/cancel", "Request cancellation of an approved request"],
        ["GET /api/manager/requests", "List all / pending requests (manager)"],
        ["POST /api/manager/requests/{id}/approve", "Approve (manager)"],
        ["POST /api/manager/requests/{id}/reject", "Reject (manager)"],
        ["POST /api/manager/requests/{id}/confirm-cancel", "Confirm a cancellation (manager)"],
        ["GET /api/manager/report", "Cost report (manager)"],
    ], widths=[3.6, 2.8])
    para(doc, "Communication interfaces — SMTP (STARTTLS) for outbound notification e-mails.")

    h2(doc, "3.3 Non-Functional Requirements")
    bullet(doc, "JWT authentication, BCrypt password hashing, role-based authorization.", "Security: ")
    bullet(doc, "Simple, responsive single-page UI with inline validation and clear statuses.", "Usability: ")
    bullet(doc, "E-mail failures are non-fatal; the business workflow always completes.", "Reliability: ")
    bullet(doc, "Lightweight REST API; stateless (horizontally scalable); indexed primary keys.", "Performance: ")
    bullet(doc, "Layered architecture; database swappable via configuration.", "Maintainability / Portability: ")
    bullet(doc, "Every request records requestor, approver, timestamps and status.", "Auditability: ")

    h1(doc, "4. Appendix — Request Lifecycle")
    para(doc, "SUBMITTED → APPROVED (stock decremented) | REJECTED | WITHDRAWN (by requestor). "
              "APPROVED → CANCEL_REQUESTED → CANCELLED (stock restored) on manager confirmation. "
              "Every transition triggers an e-mail to the requestor and their superior.")

    doc.save("02_SRS_Document.docx")
    print("Saved 02_SRS_Document.docx")


if __name__ == "__main__":
    build_abstract()
    build_srs()
