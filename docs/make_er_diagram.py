#!/usr/bin/env python3
"""Rich 10-table ER diagram for WSMS with orthogonal crow's-foot routing."""

import math
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from matplotlib.lines import Line2D

INK = "#0f172a"
MUTED = "#64748b"
BG = "#f1f5fb"
WHITE = "#ffffff"

C_LOOKUP = "#d97706"
C_USER = "#4f46e5"
C_ITEM = "#0f9d8f"
C_REQ = "#7c3aed"
C_AUDIT = "#be123c"

TYPE_COLORS = {
    "BIGINT": ("#334155", "#e2e8f0"), "VARCHAR": ("#1d4ed8", "#e3edff"),
    "INT": ("#15803d", "#e1f6ea"), "DECIMAL": ("#c2410c", "#ffe7d6"),
    "DATE": ("#0f766e", "#d6f2ee"), "TIMESTAMP": ("#7c3aed", "#eee6ff"),
    "ENUM": ("#b45309", "#fdecc8"),
}
KEY = {"PK": ("#92610a", "#fde68a"), "FK": ("#6d28d9", "#e9d5ff"), "U": ("#15803d", "#bbf7d0")}

plt.rcParams["font.family"] = "DejaVu Sans"
fig, ax = plt.subplots(figsize=(19, 12))
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis("off")
ax.add_patch(FancyBboxPatch((-2, -2), 104, 104, boxstyle="square,pad=0", fc=BG, ec="none", zorder=0))

HEADER_H = 4.4
ROW_H = 2.25


def tx(x, y, s, size, color=INK, bold=False, ha="center", va="center", mono=False, z=5):
    ax.text(x, y, s, fontsize=size, color=color, ha=ha, va=va, zorder=z,
            fontweight="bold" if bold else "normal",
            family="DejaVu Sans Mono" if mono else "DejaVu Sans")


def lighten(hexc):
    r, g, b = int(hexc[1:3], 16), int(hexc[3:5], 16), int(hexc[5:7], 16)
    r, g, b = [int(c + (255 - c) * 0.90) for c in (r, g, b)]
    return f"#{r:02x}{g:02x}{b:02x}"


def shadowbox(x, y, w, h, ec, fill=WHITE):
    ax.add_patch(FancyBboxPatch((x + 0.4, y - 0.7), w, h, boxstyle="round,pad=0,rounding_size=0.5",
                 fc="#9aa6bd", ec="none", alpha=0.3, zorder=1))
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0,rounding_size=0.5",
                 fc=fill, ec=ec, lw=1.5, zorder=2))


def pill(right_x, y, text, size=6.3):
    base = text.split("(")[0]           # show the base type only (lengths live in the SRS)
    tcol, bg = TYPE_COLORS.get(base, ("#334155", "#e2e8f0"))
    w = len(base) * 0.55 + 2.0
    x0 = right_x - w
    ax.add_patch(FancyBboxPatch((x0, y - 1.0), w, 2.0, boxstyle="round,pad=0,rounding_size=1.0",
                 fc=bg, ec="none", zorder=6))
    tx(x0 + w / 2, y, base, size, color=tcol, bold=True, z=7)


def keybadge(x, y, kind):
    tcol, bg = KEY[kind]
    w = len(kind) * 0.7 + 1.3
    ax.add_patch(FancyBboxPatch((x, y - 0.95), w, 1.9, boxstyle="round,pad=0,rounding_size=0.9",
                 fc=bg, ec="none", zorder=6))
    tx(x + w / 2, y, kind, 6.2, color=tcol, bold=True, z=7)
    return w


def entity(x, top, w, title, accent, rows):
    h = HEADER_H + ROW_H * len(rows)
    shadowbox(x, top - h, w, h, accent)
    ax.add_patch(FancyBboxPatch((x, top - h), w, h - HEADER_H + 1.2,
                 boxstyle="round,pad=0,rounding_size=0.5", fc=lighten(accent), ec="none", zorder=2.4))
    ax.add_patch(FancyBboxPatch((x, top - HEADER_H), w, HEADER_H,
                 boxstyle="round,pad=0,rounding_size=0.5", fc=accent, ec="none", zorder=3))
    tx(x + w / 2, top - HEADER_H / 2, title, 9.5, color=WHITE, bold=True, z=5)
    row_y = {}
    for i, (name, typ, keys, nn) in enumerate(rows):
        ry = top - HEADER_H - ROW_H * (i + 0.5)
        row_y[name] = ry
        bx = x + 1.1
        for k in keys:
            bx += keybadge(bx, ry, k) + 0.4
        nfont = 6.6 if len(name) <= 14 else 5.4   # shrink long column names so they fit
        tx(x + 5.0, ry, name, nfont, color=INK if nn else MUTED, bold=("PK" in keys), ha="left", mono=True, z=5)
        pill(x + w - 1.0, ry, typ)
        if i < len(rows) - 1:
            ax.add_line(Line2D([x + 0.5, x + w - 0.5], [top - HEADER_H - ROW_H * (i + 1)] * 2,
                        color="#000000", lw=0.4, alpha=0.05, zorder=4))
    return {"x": x, "w": w, "top": top, "bot": top - h, "cx": x + w / 2, "rows": row_y, "accent": accent}


def enum_box(x, top, w, title, values):
    h = HEADER_H + ROW_H * len(values)
    shadowbox(x, top - h, w, h, C_LOOKUP)
    ax.add_patch(FancyBboxPatch((x, top - HEADER_H), w, HEADER_H,
                 boxstyle="round,pad=0,rounding_size=0.5", fc=C_LOOKUP, ec="none", zorder=3))
    tx(x + w / 2, top - HEADER_H / 2 + 0.5, title, 9, color=WHITE, bold=True, z=5)
    tx(x + w / 2, top - HEADER_H + 0.95, "«enumeration»", 6, color="#fde8c6", z=5)
    for i, v in enumerate(values):
        ry = top - HEADER_H - ROW_H * (i + 0.5)
        ax.add_patch(FancyBboxPatch((x + 1.1, ry - 0.8), 1.5, 1.6, boxstyle="round,pad=0,rounding_size=0.8",
                     fc=C_LOOKUP, ec="none", zorder=6))
        tx(x + 3.6, ry, v, 6.2, color=INK, ha="left", mono=True, z=5)
    return {"x": x, "w": w, "top": top, "bot": top - h, "cx": x + w / 2}


def crows_foot(tip, frm, color, size=1.7, spread=1.25):
    dx, dy = tip[0] - frm[0], tip[1] - frm[1]
    d = math.hypot(dx, dy) or 1
    ux, uy = dx / d, dy / d
    px, py = -uy, ux
    apex = (tip[0] - ux * size, tip[1] - uy * size)
    for e in (tip, (tip[0] + px * spread, tip[1] + py * spread), (tip[0] - px * spread, tip[1] - py * spread)):
        ax.add_line(Line2D([apex[0], e[0]], [apex[1], e[1]], color=color, lw=1.3, zorder=8))


def one_tick(tip, frm, color, size=1.2, back=2.0):
    dx, dy = tip[0] - frm[0], tip[1] - frm[1]
    d = math.hypot(dx, dy) or 1
    ux, uy = dx / d, dy / d
    px, py = -uy, ux
    c = (tip[0] - ux * back, tip[1] - uy * back)
    ax.add_line(Line2D([c[0] + px * size, c[0] - px * size], [c[1] + py * size, c[1] - py * size],
                color=color, lw=1.6, zorder=8))


def poly(pts, color):
    """Orthogonal/zig connector; crow's foot at pts[0] (child FK), bar at pts[-1] (parent PK)."""
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    ax.add_line(Line2D(xs, ys, color=color, lw=1.3, zorder=4, solid_capstyle="round"))
    crows_foot(pts[0], pts[1], color)
    one_tick(pts[-1], pts[-2], color)


def dashed(p1, p2, color):
    ax.add_line(Line2D([p1[0], p2[0]], [p1[1], p2[1]], color=color, lw=1.2, linestyle=(0, (4, 3)), zorder=4))


# ================= Title =================
ax.add_patch(FancyBboxPatch((3, 93.2), 94, 5.6, boxstyle="round,pad=0,rounding_size=1.0", fc="#0f172a", ec="none", zorder=3))
ax.add_patch(FancyBboxPatch((3, 93.2), 2.0, 5.6, boxstyle="round,pad=0,rounding_size=1.0", fc=C_REQ, ec="none", zorder=4))
tx(6.5, 96.8, "WSMS — Entity Relationship Diagram", 15, color=WHITE, bold=True, ha="left", z=5)
tx(6.5, 94.4, "Normalized relational schema · 10 tables + 1 enumeration · crow's-foot notation", 8.5, color="#a9b4cc", ha="left", z=5)

# ================= Lookups =================
departments = entity(2, 92, 16, "departments", C_LOOKUP, [
    ("id", "BIGINT", ["PK"], True), ("name", "VARCHAR(80)", ["U"], True), ("code", "VARCHAR(10)", ["U"], True)])
designations = entity(20, 92, 24, "designations", C_LOOKUP, [
    ("id", "BIGINT", ["PK"], True), ("title", "VARCHAR(60)", ["U"], True),
    ("rank", "INT", [], True), ("max_purchase_value", "DECIMAL(12,2)", [], True)])
roles = entity(46, 92, 15, "roles", C_LOOKUP, [
    ("id", "BIGINT", ["PK"], True), ("name", "VARCHAR(20)", ["U"], True), ("description", "VARCHAR(100)", [], False)])
categories = entity(63, 92, 16, "stationery_categories", C_LOOKUP, [
    ("id", "BIGINT", ["PK"], True), ("name", "VARCHAR(60)", ["U"], True), ("description", "VARCHAR(255)", [], False)])
status_enum = enum_box(81, 92, 17, "RequestStatus",
                       ["SUBMITTED", "APPROVED", "REJECTED", "WITHDRAWN", "CANCEL_REQ", "CANCELLED"])

# ================= Core =================
users = entity(2, 73, 28, "users", C_USER, [
    ("id", "BIGINT", ["PK"], True), ("username", "VARCHAR(50)", ["U"], True),
    ("email", "VARCHAR(120)", ["U"], True), ("password_hash", "VARCHAR(100)", [], True),
    ("role_id", "BIGINT", ["FK"], True), ("designation_id", "BIGINT", ["FK"], True),
    ("department_id", "BIGINT", ["FK"], True), ("superior_id", "BIGINT", ["FK"], False)])
items = entity(36, 73, 28, "stationery_items", C_ITEM, [
    ("id", "BIGINT", ["PK"], True), ("name", "VARCHAR(100)", ["U"], True),
    ("description", "VARCHAR(255)", [], False), ("available_quantity", "INT", [], True),
    ("unit_cost", "DECIMAL(12,2)", [], True), ("category_id", "BIGINT", ["FK"], True),
    ("min_role_id", "BIGINT", ["FK"], True)])
requests = entity(68, 73, 30, "stationery_requests", C_REQ, [
    ("id", "BIGINT", ["PK"], True), ("requestor_id", "BIGINT", ["FK"], True),
    ("approver_id", "BIGINT", ["FK"], False), ("status", "ENUM", [], True),
    ("total_cost", "DECIMAL(12,2)", [], True), ("from_date", "DATE", [], True),
    ("to_date", "DATE", [], True), ("superior_email", "VARCHAR(120)", [], True),
    ("comments", "VARCHAR(255)", [], False), ("created_at", "TIMESTAMP", [], True),
    ("decided_at", "TIMESTAMP", [], False)])

# ================= Audit / lines =================
history = entity(2, 37, 28, "request_status_history", C_AUDIT, [
    ("id", "BIGINT", ["PK"], True), ("request_id", "BIGINT", ["FK"], True),
    ("old_status", "ENUM", [], False), ("new_status", "ENUM", [], True),
    ("changed_by", "BIGINT", ["FK"], False), ("changed_at", "TIMESTAMP", [], True),
    ("note", "VARCHAR(255)", [], False)])
reqitems = entity(36, 37, 28, "request_items", C_REQ, [
    ("id", "BIGINT", ["PK"], True), ("request_id", "BIGINT", ["FK"], True),
    ("item_id", "BIGINT", ["FK"], True), ("quantity", "INT", [], True),
    ("unit_cost", "DECIMAL(12,2)", [], True), ("line_total", "DECIMAL(12,2)", [], True)])
emails = entity(68, 37, 30, "email_notifications", C_AUDIT, [
    ("id", "BIGINT", ["PK"], True), ("request_id", "BIGINT", ["FK"], False),
    ("recipient", "VARCHAR(120)", [], True), ("subject", "VARCHAR(500)", [], True),
    ("send_status", "VARCHAR(10)", [], True), ("sent_at", "TIMESTAMP", [], True)])

# ================= Relationships (orthogonal, corridor-routed) =================
UP = 76.5   # corridor between lookups and core rows
# users -> lookups
poly([(10, users["top"]), (10, UP), (departments["cx"], UP), (departments["cx"], departments["bot"])], C_LOOKUP)
poly([(16, users["top"]), (16, UP + 0.8), (designations["cx"], UP + 0.8), (designations["cx"], designations["bot"])], C_LOOKUP)
poly([(24, users["top"]), (24, UP), (roles["x"] + roles["w"] - 3, UP), (roles["x"] + roles["w"] - 3, roles["bot"])], C_LOOKUP)
# items -> lookups
poly([(58, items["top"]), (58, UP), (categories["cx"], UP), (categories["cx"], categories["bot"])], C_ITEM)
poly([(42, items["top"]), (42, UP + 0.8), (roles["x"] + 3, UP + 0.8), (roles["x"] + 3, roles["bot"])], C_ITEM)
# users.superior_id -> users (self)
sp = (users["x"], users["rows"]["superior_id"])
ax.add_patch(FancyArrowPatch(sp, (users["x"], users["top"] - 1.6), connectionstyle="arc3,rad=-0.6",
             arrowstyle="-", color=C_USER, lw=1.3, zorder=4))
crows_foot(sp, (sp[0] - 3, sp[1] - 1), C_USER)
tx(users["x"] - 3.0, (sp[1] + users["top"]) / 2, "superior", 6, color=C_USER, bold=True)
# requests -> users (requestor, approver) via middle gap
poly([(requests["x"], requests["rows"]["requestor_id"]), (66, requests["rows"]["requestor_id"]),
      (66, 46.5), (33, 46.5), (33, 56), (users["x"] + users["w"], 56)], C_REQ)
poly([(requests["x"], requests["rows"]["approver_id"]), (65, requests["rows"]["approver_id"]),
      (65, 44.5), (34, 44.5), (34, 50), (users["x"] + users["w"], 50)], C_USER)
# status enum (dashed)
dashed((requests["x"] + requests["w"] - 6, requests["top"]), (status_enum["cx"], status_enum["bot"]), C_LOOKUP)
# request_items -> requests, items
poly([(58, reqitems["top"]), (58, 41), (84, 41), (84, requests["bot"])], C_REQ)
poly([(44, reqitems["top"]), (44, items["bot"])], C_ITEM)
# history -> requests, users
poly([(18, history["top"]), (18, 39.5), (80, 39.5), (80, requests["bot"])], C_REQ)
poly([(25, history["top"]), (25, users["bot"])], C_USER)
# emails -> requests
poly([(88, emails["top"]), (88, requests["bot"])], C_REQ)

# ================= Legend =================
lx, ly, lw, lh = 3, 2, 94, 8
ax.add_patch(FancyBboxPatch((lx, ly), lw, lh, boxstyle="round,pad=0,rounding_size=0.6", fc=WHITE, ec="#cbd5e1", lw=1.1, zorder=3))
tx(lx + 2, ly + lh - 1.8, "LEGEND", 8.5, color=INK, bold=True, ha="left")
bx = lx + 2.5
for kind, desc in [("PK", "Primary Key"), ("FK", "Foreign Key"), ("U", "Unique")]:
    w = keybadge(bx, ly + lh - 4.5, kind)
    tx(bx + w + 1, ly + lh - 4.5, desc, 7.5, color=MUTED, ha="left")
    bx += w + len(desc) * 0.6 + 4
ax.add_line(Line2D([lx + 2.5, lx + 8], [ly + 1.9, ly + 1.9], color=C_REQ, lw=1.3, zorder=6))
one_tick((lx + 2.5, ly + 1.9), (lx + 8, ly + 1.9), C_REQ)
crows_foot((lx + 8, ly + 1.9), (lx + 2.5, ly + 1.9), C_REQ)
tx(lx + 10, ly + 1.9, "One-to-many (1 : N)", 7.5, color=MUTED, ha="left")
tx(lx + 34, ly + 1.9, "Dashed = enumeration reference", 7.5, color=MUTED, ha="left")
tx(lx + 63, ly + 1.9, "Table groups:", 7.5, color=INK, bold=True, ha="left")
groups = [("People", C_USER), ("Catalogue", C_ITEM), ("Request", C_REQ), ("Lookup/Enum", C_LOOKUP), ("Audit", C_AUDIT)]
gx = lx + 73
for name, col in groups:
    ax.add_patch(FancyBboxPatch((gx, ly + 1.1), 1.5, 1.5, boxstyle="round,pad=0,rounding_size=0.4", fc=col, ec="none", zorder=6))
    tx(gx + 2.2, ly + 1.9, name, 6.6, color=MUTED, ha="left")
    gx += 2.2 + len(name) * 0.52 + 2.5

fig.savefig("03_ER_Diagram.png", dpi=170, bbox_inches="tight", facecolor=BG, pad_inches=0.2)
fig.savefig("03_ER_Diagram.pdf", bbox_inches="tight", facecolor=BG, pad_inches=0.2)
plt.close(fig)
print("Saved 03_ER_Diagram.png / .pdf  (10 tables + 1 enum, orthogonal routing)")
