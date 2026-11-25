#!/usr/bin/env python3
"""Generate WSMS diagrams as standalone PNG + PDF: ER, Architecture, UI Flow."""

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle, FancyArrowPatch
from matplotlib.lines import Line2D

PRIMARY = "#2f6df6"
PRIMARY_DK = "#245ad6"
DARK = "#1b2330"
MUTED = "#6b7686"
LINE = "#c3ccdd"
GREEN = "#1f9d55"
AMBER = "#c77700"
RED = "#d64545"
PURPLE = "#7a5bd6"
LIGHT = "#eef2fb"

plt.rcParams["font.family"] = "DejaVu Sans"


def save(fig, name):
    fig.savefig(f"{name}.png", dpi=200, bbox_inches="tight", facecolor="white", pad_inches=0.25)
    fig.savefig(f"{name}.pdf", bbox_inches="tight", facecolor="white", pad_inches=0.25)
    plt.close(fig)
    print("Saved", name + ".png /", name + ".pdf")


def box(ax, x, y, w, h, fc="white", ec=LINE, lw=1.3, rounded=0.03, z=2):
    p = FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad=0,rounding_size={rounded}",
                       fc=fc, ec=ec, lw=lw, mutation_aspect=1, zorder=z)
    ax.add_patch(p)
    return p


def text(ax, x, y, s, size=10, color=DARK, bold=False, ha="center", va="center", z=5, mono=False):
    ax.text(x, y, s, fontsize=size, color=color, ha=ha, va=va, zorder=z,
            fontweight="bold" if bold else "normal",
            family="DejaVu Sans Mono" if mono else "DejaVu Sans")


# =====================================================================
# 2. ARCHITECTURE DIAGRAM (HIGH LEVEL)
# =====================================================================
def architecture_diagram():
    fig, ax = plt.subplots(figsize=(13, 8.5))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    text(ax, 50, 97, "WSMS — High-Level Architecture", size=18, bold=True)
    text(ax, 50, 93.3, "3-tier web application  ·  REST + JWT  ·  Spring Boot + React", size=11, color=MUTED)

    def tier(x, w, title, color):
        box(ax, x, 8, w, 78, fc=LIGHT, ec=color, lw=1.6, rounded=0.015, z=1)
        tp = FancyBboxPatch((x, 80), w, 6, boxstyle="round,pad=0,rounding_size=0.01",
                            fc=color, ec=color, zorder=2)
        ax.add_patch(tp)
        text(ax, x + w / 2, 83, title, size=12, color="white", bold=True, z=3)

    tier(3, 26, "CLIENT TIER", PRIMARY)
    tier(37, 30, "APPLICATION TIER", PRIMARY_DK)
    tier(72, 25, "DATA / EXTERNAL TIER", DARK)

    def comp(x, y, w, h, title, subs, fc="white", ec=PRIMARY, tc=DARK):
        box(ax, x, y, w, h, fc=fc, ec=ec, lw=1.5, z=4)
        text(ax, x + w / 2, y + h - 2.6, title, size=10.5, bold=True, color=tc, z=5)
        for i, sline in enumerate(subs):
            text(ax, x + w / 2, y + h - 5.4 - i * 2.6, sline, size=8.5, color=MUTED, z=5)

    # Client
    comp(6, 60, 20, 16, "Web Browser", ["React 18 SPA (Vite)", "React Router", "Axios HTTP client"], ec=PRIMARY)
    comp(6, 40, 20, 13, "UI Pages", ["Login / Register", "Dashboard, Requests", "Approvals, Report"], ec=PRIMARY)
    text(ax, 16, 31, "Stores JWT in\nbrowser localStorage", size=8.5, color=MUTED, z=5)

    # App
    comp(40, 64, 24, 12, "REST Controllers", ["/api/auth  /api/items", "/api/requests", "/api/manager"], ec=PRIMARY_DK)
    comp(40, 49, 24, 12, "Security (JWT Filter)", ["Spring Security", "BCrypt passwords", "Role-based access"], ec=RED, tc=DARK)
    comp(40, 32, 24, 14, "Service Layer", ["Auth, Request, Item", "Report, Email services", "Business rules & eligibility"], ec=PRIMARY_DK)
    comp(40, 17, 24, 11, "Repositories (JPA)", ["Spring Data JPA", "Hibernate ORM"], ec=PRIMARY_DK)

    # Data / external
    # database cylinder-ish
    box(ax, 75, 55, 19, 16, fc="white", ec=DARK, lw=1.5, z=4)
    text(ax, 84.5, 67.8, "H2 Database", size=10.5, bold=True, z=5)
    text(ax, 84.5, 65.0, "(in-memory)", size=8, color=MUTED, z=5)
    text(ax, 84.5, 61.8, "10 tables, normalized", size=8, color=DARK, z=5)
    text(ax, 84.5, 59.4, "users · roles · depts", size=7, color=MUTED, z=5, mono=True)
    text(ax, 84.5, 57.6, "designations · items", size=7, color=MUTED, z=5, mono=True)
    text(ax, 84.5, 55.8, "requests · lines · audit", size=7, color=MUTED, z=5, mono=True)

    comp(75, 34, 19, 12, "SMTP Server", ["JavaMail / Spring Mail", "Notification e-mails", "to user + superior"], ec=AMBER, tc=DARK)

    def arrow(x1, y1, x2, y2, label="", color=DARK, dashed=False, off=1.2):
        a = FancyArrowPatch((x1, y1), (x2, y2), arrowstyle="-|>", mutation_scale=16,
                            color=color, lw=1.8, zorder=6,
                            linestyle="--" if dashed else "-")
        ax.add_patch(a)
        if label:
            ax.text((x1 + x2) / 2, (y1 + y2) / 2 + off, label, fontsize=8, color=color,
                    ha="center", va="bottom", zorder=7,
                    bbox=dict(boxstyle="round,pad=0.2", fc="white", ec="none"))

    arrow(26, 64, 40, 70, "HTTPS / JSON\n+ Bearer JWT", PRIMARY)
    arrow(52, 64, 52, 61, color=PRIMARY_DK)
    arrow(52, 49, 52, 46, color=PRIMARY_DK)
    arrow(52, 32, 52, 28, color=PRIMARY_DK)
    arrow(64, 22, 75, 60, "JDBC / SQL", DARK)
    arrow(64, 38, 75, 40, "SMTP", AMBER)

    text(ax, 50, 4.5, "Flow:  Browser → REST API (JWT-authenticated) → Service layer (rules) → JPA → Database;  "
                      "e-mail notifications emitted on each state change.",
         size=9.5, color=MUTED)

    save(fig, "04_Architecture_Diagram")


# =====================================================================
# 3. UI FLOW DIAGRAM
# =====================================================================
def ui_flow_diagram():
    fig, ax = plt.subplots(figsize=(13, 9))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    text(ax, 50, 97.5, "WSMS — UI Flow Diagram (Screen Navigation)", size=18, bold=True)
    text(ax, 50, 94, "Planned screens and navigation paths  ·  role-aware", size=11, color=MUTED)

    def screen(x, y, w, h, title, color=PRIMARY, fc="white"):
        box(ax, x, y, w, h, fc=fc, ec=color, lw=1.6, z=3)
        text(ax, x + w / 2, y + h / 2, title, size=10, bold=True, color=DARK, z=5)
        return (x, y, w, h)

    def entry(x, y, w, h, title, color=PURPLE):
        p = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0,rounding_size=2.2",
                           fc="#efe9fb", ec=color, lw=1.6, zorder=3)
        ax.add_patch(p)
        text(ax, x + w / 2, y + h / 2, title, size=10, bold=True, color=DARK, z=5)
        return (x, y, w, h)

    def anchor(r, side):
        x, y, w, h = r
        return {"t": (x + w / 2, y + h), "b": (x + w / 2, y),
                "l": (x, y + h / 2), "r": (x + w, y + h / 2)}[side]

    def arrow(a, b, side_a, side_b, label="", color=MUTED, rad=0.0, dashed=False):
        p1, p2 = anchor(a, side_a), anchor(b, side_b)
        ax.add_patch(FancyArrowPatch(p1, p2, arrowstyle="-|>", mutation_scale=13, color=color,
                                     lw=1.5, zorder=2, connectionstyle=f"arc3,rad={rad}",
                                     linestyle="--" if dashed else "-"))
        if label:
            ax.text((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, label, fontsize=7.5,
                    color=color, ha="center", va="center", zorder=7,
                    bbox=dict(boxstyle="round,pad=0.18", fc="white", ec="none"))

    # Entry column
    login = entry(4, 74, 18, 7, "Login")
    register = entry(4, 60, 18, 7, "Register")

    # Hub
    dash = screen(33, 67, 22, 9, "Dashboard", PRIMARY)

    # Common screens (right column)
    rx, rw, rh = 72, 24, 6.3
    items = screen(rx, 88, rw, rh, "Stationery Availability")
    elig = screen(rx, 80, rw, rh, "My Eligibility")
    newreq = screen(rx, 72, rw, rh, "New Request")
    myreq = screen(rx, 64, rw, rh, "My Requests")
    chpwd = screen(rx, 56, rw, rh, "Change Password")
    helpscr = screen(rx, 48, rw, rh, "Help")

    # Manager-only region
    box(ax, 30, 12, 66, 26, fc="#fff8ec", ec=AMBER, lw=1.4, rounded=0.02, z=1)
    text(ax, 63, 35, "MANAGER-ONLY SCREENS", size=10.5, bold=True, color=AMBER, z=2)
    approvals = screen(37, 22, 24, 7, "Approvals (Queue)", AMBER)
    report = screen(67, 22, 24, 7, "Cost Report", AMBER)
    text(ax, 49, 17.5, "Approve / Reject /\nConfirm cancellation", size=8, color=MUTED, z=5)
    text(ax, 79, 17.5, "Per-item cost, %,\nhead count, total", size=8, color=MUTED, z=5)

    # Flows
    arrow(login, register, "b", "t", "no account?", MUTED, rad=0.0, dashed=True)
    arrow(register, login, "r", "b", "registered", MUTED, rad=-0.4, dashed=True)
    arrow(login, dash, "r", "l", "authenticate", GREEN, rad=0.05)
    arrow(register, dash, "r", "l", "auto-login", GREEN, rad=0.15)

    for scr in (items, elig, newreq, myreq, chpwd, helpscr):
        arrow(dash, scr, "r", "l", "", PRIMARY, rad=0.0)

    arrow(newreq, myreq, "r", "r", "submit", PRIMARY, rad=-0.6)
    # My Requests self-actions
    ax.text(rx + rw + 1.5, 64 + rh / 2, "withdraw /\ncancel", fontsize=7.5, color=PRIMARY,
            ha="left", va="center", zorder=7)
    ax.add_patch(FancyArrowPatch((rx + rw, 64 + rh - 1), (rx + rw, 64 + 1),
                                 arrowstyle="-|>", mutation_scale=11, color=PRIMARY, lw=1.3,
                                 connectionstyle="arc3,rad=-1.2", zorder=2))

    arrow(dash, approvals, "b", "t", "manager", AMBER, rad=0.0)
    arrow(dash, report, "b", "t", "manager", AMBER, rad=-0.2)

    # Legend
    ax.add_patch(FancyBboxPatch((4, 5.5), 2.6, 2.6, boxstyle="round,pad=0,rounding_size=1.0",
                                fc="#efe9fb", ec=PURPLE, lw=1.4))
    text(ax, 7.5, 6.8, "Entry screen", size=8.5, color=MUTED, ha="left")
    ax.add_patch(Rectangle((26, 5.5), 2.6, 2.6, fc="white", ec=PRIMARY, lw=1.4))
    text(ax, 29.5, 6.8, "Common screen", size=8.5, color=MUTED, ha="left")
    ax.add_patch(Rectangle((50, 5.5), 2.6, 2.6, fc="white", ec=AMBER, lw=1.4))
    text(ax, 53.5, 6.8, "Manager-only screen", size=8.5, color=MUTED, ha="left")

    save(fig, "05_UI_Flow_Diagram")


if __name__ == "__main__":
    # NOTE: the ER diagram (03) is generated by make_er_diagram.py, not here.
    architecture_diagram()
    ui_flow_diagram()
