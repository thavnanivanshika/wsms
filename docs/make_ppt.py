#!/usr/bin/env python3
"""Generate the WSMS 'brief path' presentation (artefact 6)."""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

PRIMARY = RGBColor(0x2F, 0x6D, 0xF6)
PRIMARY_DK = RGBColor(0x24, 0x5A, 0xD6)
DARK = RGBColor(0x1B, 0x23, 0x30)
MUTED = RGBColor(0x6B, 0x76, 0x86)
LIGHT = RGBColor(0xF4, 0xF6, 0xFB)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
ROW_ALT = RGBColor(0xF2, 0xF5, 0xFB)
AMBER = RGBColor(0xC7, 0x77, 0x00)
FONT = "Calibri"

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]
SW, SH = prs.slide_width, prs.slide_height
PAGE = 0


def _set(run, size, color, bold=False, italic=False):
    run.font.name = FONT
    run.font.size = Pt(size)
    run.font.color.rgb = color
    run.font.bold = bold
    run.font.italic = italic


def rect(slide, x, y, w, h, color):
    shp = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    shp.fill.solid(); shp.fill.fore_color.rgb = color
    shp.line.fill.background(); shp.shadow.inherit = False
    return shp


def textbox(slide, x, y, w, h, lines, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame; tf.word_wrap = True; tf.vertical_anchor = anchor
    for i, (text, size, color, bold, italic, sa) in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align; p.space_after = Pt(sa)
        r = p.add_run(); r.text = text; _set(r, size, color, bold, italic)
    return tb


def header(slide, title, kicker):
    rect(slide, 0, 0, SW, Inches(1.15), WHITE)
    rect(slide, 0, Inches(1.15), SW, Pt(3), PRIMARY)
    rect(slide, 0, 0, Inches(0.22), Inches(1.15), PRIMARY)
    textbox(slide, Inches(0.55), Inches(0.12), Inches(12.2), Inches(1.0), [
        (kicker.upper(), 12, PRIMARY, True, False, 2),
        (title, 28, DARK, True, False, 0),
    ], anchor=MSO_ANCHOR.MIDDLE)


def footer(slide, page):
    textbox(slide, Inches(0.55), Inches(7.05), Inches(9), Inches(0.35),
            [("WSMS — Web Based Stationery Management System  ·  WSMS_013", 9, MUTED, False, False, 0)])
    textbox(slide, Inches(11.8), Inches(7.05), Inches(1.0), Inches(0.35),
            [(str(page), 9, MUTED, False, False, 0)], align=PP_ALIGN.RIGHT)


def new_slide(title=None, kicker=None, number=True):
    global PAGE
    s = prs.slides.add_slide(BLANK)
    rect(s, 0, 0, SW, SH, WHITE)
    if title:
        header(s, title, kicker)
    if number:
        PAGE += 1
        footer(s, PAGE)
    return s


def bullets(slide, items, x=Inches(0.6), y=Inches(1.5), w=Inches(12.1), h=Inches(5.2),
            size=17, gap=10):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame; tf.word_wrap = True
    for i, it in enumerate(items):
        level, text = it[0], it[1]
        bold = it[2] if len(it) > 2 else False
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.level = level; p.space_after = Pt(gap); p.space_before = Pt(2)
        r = p.add_run(); r.text = ("●  " if level == 0 else "–  ") + text
        _set(r, size if level == 0 else size - 2, DARK if level == 0 else MUTED, bold)
    return tb


def table_slide(slide, headers, rows, x=Inches(0.6), y=Inches(1.6), w=Inches(12.1),
                col_widths=None, fsize=13, row_h=0.6):
    nrows, ncols = len(rows) + 1, len(headers)
    t = slide.shapes.add_table(nrows, ncols, x, y, w, Inches(row_h * nrows)).table
    if col_widths:
        tot = sum(col_widths)
        for j, cw in enumerate(col_widths):
            t.columns[j].width = Emu(int(w * cw / tot))
    for j, h in enumerate(headers):
        c = t.cell(0, j); c.fill.solid(); c.fill.fore_color.rgb = PRIMARY
        c.vertical_anchor = MSO_ANCHOR.MIDDLE
        r = c.text_frame.paragraphs[0].add_run(); r.text = h; _set(r, fsize, WHITE, True)
    for i, row in enumerate(rows, 1):
        for j, val in enumerate(row):
            c = t.cell(i, j); c.fill.solid()
            c.fill.fore_color.rgb = ROW_ALT if i % 2 == 0 else WHITE
            c.vertical_anchor = MSO_ANCHOR.MIDDLE
            r = c.text_frame.paragraphs[0].add_run(); r.text = str(val); _set(r, fsize - 1, DARK)
    return t


# 1 TITLE
s = new_slide(number=False)
rect(s, 0, 0, SW, SH, DARK)
rect(s, 0, Inches(4.5), SW, Pt(4), PRIMARY)
rect(s, 0, Inches(2.0), Inches(0.35), Inches(2.3), PRIMARY)
textbox(s, Inches(0.9), Inches(1.9), Inches(11.5), Inches(2.6), [
    ("WEB BASED STATIONERY", 40, WHITE, True, False, 2),
    ("MANAGEMENT SYSTEM", 40, WHITE, True, False, 8),
    ("Project Presentation", 18, PRIMARY, False, False, 0),
])
textbox(s, Inches(0.9), Inches(4.9), Inches(11.5), Inches(1.8), [
    ("Problem · Objective · Solution · Modules · Architecture · Technologies", 15,
     RGBColor(0xC7, 0xD2, 0xE8), False, False, 6),
    ("Project Code: WSMS_013", 13, MUTED, False, False, 0),
])

# 2 PROBLEM
s = new_slide("Problem Statement", "Introduction")
bullets(s, [
    (0, "Stationery requests in most institutions are tracked via e-mail, Excel or registers.", True),
    (1, "Leads to tremendous wastage of resources and effort."),
    (1, "Over-stocking: quantity in the store is more than needed."),
    (1, "Stock-outs: supply of some items is less than needed."),
    (0, "No single, reliable view of who requested what, or its approval status.", True),
    (0, "Management lacks a consolidated, high-level view of stationery cost.", True),
], size=18, gap=12)

# 3 OBJECTIVE
s = new_slide("Objective", "Introduction")
bullets(s, [
    (0, "Build a web tool to track stationery requests for any institution, end-to-end.", True),
    (1, "Role-based registration, login and secure password management."),
    (1, "Check item availability and personal (role-based) eligibility."),
    (1, "Apply for, withdraw and cancel requests."),
    (1, "Manager approval / rejection workflow with automatic e-mail notifications."),
    (1, "Cost reporting for higher management."),
    (0, "Outcome: reduce wastage and give management a clear, real-time view.", True),
], size=18, gap=11)

# 4 SOLUTION
s = new_slide("Proposed Solution", "Overview")
bullets(s, [
    (0, "Full-stack web application: React SPA front-end + Spring Boot REST back-end (JWT-secured).", True),
    (1, "Users browse eligible items, check eligibility, and apply with quantity and from/to dates."),
    (1, "Managers review arrived requests and approve/reject; approval decrements stock."),
    (1, "Approved requests can be cancelled with manager confirmation (stock restored)."),
    (1, "Every state change e-mails the requestor and their superior."),
    (1, "Managers view a cost report: per-item cost, %, head count and cumulative total."),
], size=17, gap=11)

# 5 MODULES
s = new_slide("Modules", "Solution")
table_slide(s, ["#", "Module", "Responsibility"], [
    ["1", "Login / Registration", "Register, login, change password (JWT + BCrypt)"],
    ["2", "Availability / Eligibility", "Role-based item availability and purchase eligibility"],
    ["3", "Request / Cancellation", "Apply, withdraw pending, cancel approved"],
    ["4", "Managers Action", "View all requests, approve / reject, confirm cancellations"],
    ["5", "Help", "Usage guidance for users and managers"],
    ["6", "e-Mail", "Automatic notifications on every state change"],
    ["7", "Report", "Per-item cost, %, head count, cumulative total"],
], col_widths=[0.6, 3.2, 8.3], fsize=13, row_h=0.6)

# 6 USERS & ROLES
s = new_slide("Users & Roles", "Solution")
bullets(s, [
    (0, "Regular User (Requestor)", True),
    (1, "Register/login, view availability & eligibility, apply/withdraw/cancel, track status."),
    (0, "Manager (Approver)", True),
    (1, "All user actions, plus view all requests, approve/reject, confirm cancellations, view report."),
    (1, "A manager is an approver and can also be a requestor."),
    (0, "Superior", True),
    (1, "The approver named on a request; receives e-mail notifications about the requestor's activity."),
], size=17, gap=11)

# 7 ARCHITECTURE (embed image)
s = new_slide("High-Level Architecture", "Design")
img = "04_Architecture_Diagram.png"
if os.path.exists(img):
    s.shapes.add_picture(img, Inches(1.4), Inches(1.4), height=Inches(5.6))
else:
    bullets(s, [(0, "See 04_Architecture_Diagram.png")])

# 8 TECHNOLOGIES
s = new_slide("Technologies Involved", "Implementation")
table_slide(s, ["Layer", "Technology", "Purpose"], [
    ["Frontend", "React 18, Vite, React Router, Axios", "Single-page UI, routing, API calls"],
    ["Backend", "Spring Boot 3.5, Spring MVC", "REST API and application logic"],
    ["Security", "Spring Security, JWT, BCrypt", "Authentication & authorization"],
    ["Persistence", "Spring Data JPA, Hibernate", "ORM and repositories"],
    ["Database", "H2 (in-memory); MySQL-ready", "Relational storage"],
    ["Mail", "Spring Mail (JavaMail / SMTP)", "Notification e-mails"],
    ["Build / Test", "Maven, npm, JUnit 5, Mockito", "Build & testing"],
], col_widths=[2.0, 5.0, 5.1], fsize=13, row_h=0.6)

# 9 REQUEST FLOW
s = new_slide("Request Lifecycle", "Design")
def state(x, y, label, color, w=Inches(2.4), h=Inches(0.8)):
    rect(s, x, y, w, h, color)
    textbox(s, x, y, w, h, [(label, 12, WHITE, True, False, 0)],
            align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
state(Inches(0.7), Inches(1.9), "SUBMITTED", PRIMARY)
state(Inches(4.4), Inches(1.9), "APPROVED", RGBColor(0x1F, 0x9D, 0x55))
state(Inches(8.1), Inches(1.9), "CANCEL_REQUESTED", AMBER)
state(Inches(11.1), Inches(1.9), "CANCELLED", MUTED, w=Inches(1.9))
state(Inches(0.7), Inches(3.2), "WITHDRAWN", MUTED)
state(Inches(4.4), Inches(3.2), "REJECTED", RGBColor(0xD6, 0x45, 0x45))
for x, lbl in [(Inches(3.15), "approve"), (Inches(6.85), "cancel"), (Inches(10.1), "confirm")]:
    a = s.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, x, Inches(2.12), Inches(1.2), Inches(0.35))
    a.fill.solid(); a.fill.fore_color.rgb = RGBColor(0xB8, 0xC2, 0xD6)
    a.line.fill.background(); a.shadow.inherit = False
bullets(s, [
    (0, "SUBMITTED → APPROVED (stock −qty) | REJECTED | WITHDRAWN (by requestor)."),
    (0, "APPROVED → CANCEL_REQUESTED → CANCELLED (stock restored) on manager confirmation."),
    (0, "Every transition triggers an e-mail to the requestor and superior."),
], x=Inches(0.7), y=Inches(4.3), size=15, gap=10)

# 10 CONCLUSION
s = new_slide("Conclusion", "Wrap-up")
bullets(s, [
    (0, "WSMS replaces ad-hoc e-mail/Excel tracking with a structured, auditable workflow.", True),
    (0, "Role-based eligibility + approval lifecycle + notifications + cost reporting.", True),
    (0, "Gives management a clear, real-time view and reduces resource wastage.", True),
    (0, "Future: MySQL/PostgreSQL, multi-level approvals, procurement integration, dashboards.", True),
    (0, "Thank you.", True),
], size=18, gap=14)

prs.save("06_Project_Presentation.pptx")
print("Saved 06_Project_Presentation.pptx with", len(prs.slides._sldIdLst), "slides")
