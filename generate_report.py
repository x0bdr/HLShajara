#!/usr/bin/env python3
"""Generate HLShajara UI Audit + v1.2 Fixing Plan PDF report."""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, ListFlowable, ListItem
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

# Register fonts
pdfmetrics.registerFont(TTFont('Kufam', '/Users/x0bdr/Library/Fonts/Kufam-Medium.ttf'))
pdfmetrics.registerFont(TTFont('KufamBold', '/Users/x0bdr/Library/Fonts/Kufam-ExtraBold.ttf'))

# Page setup
PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 2 * cm

# Colors from HLShajara design system
GREEN_700 = colors.HexColor('#264D2E')
GREEN_900 = colors.HexColor('#16301E')
STONE_950 = colors.HexColor('#1B1A16')
STONE_600 = colors.HexColor('#6B6457')
STONE_200 = colors.HexColor('#E1DBCC')
PAPER = colors.HexColor('#F7F3EA')
BRASS_500 = colors.HexColor('#9A6B2B')
BRICK_500 = colors.HexColor('#8C3A2E')
WHITE = colors.white

def build_styles():
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        name='ReportTitle',
        fontName='Helvetica-Bold',
        fontSize=28,
        textColor=GREEN_900,
        spaceAfter=8,
        leading=32,
        alignment=TA_LEFT,
    ))
    
    styles.add(ParagraphStyle(
        name='ReportSubtitle',
        fontName='Helvetica',
        fontSize=12,
        textColor=STONE_600,
        spaceAfter=24,
        leading=16,
        alignment=TA_LEFT,
    ))
    
    styles.add(ParagraphStyle(
        name='ReportH1',
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=GREEN_700,
        spaceBefore=24,
        spaceAfter=10,
        leading=22,
        borderWidth=0,
        borderColor=STONE_200,
        borderPadding=4,
        leftIndent=0,
    ))
    
    styles.add(ParagraphStyle(
        name='ReportH2',
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=STONE_950,
        spaceBefore=16,
        spaceAfter=8,
        leading=18,
    ))
    
    styles.add(ParagraphStyle(
        name='ReportH3',
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=STONE_950,
        spaceBefore=12,
        spaceAfter=6,
        leading=14,
    ))
    
    styles.add(ParagraphStyle(
        name='ReportBody',
        fontName='Helvetica',
        fontSize=10,
        textColor=STONE_950,
        leading=14,
        spaceAfter=8,
    ))
    
    styles.add(ParagraphStyle(
        name='ReportBodyBold',
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=STONE_950,
        leading=14,
        spaceAfter=8,
    ))
    
    styles.add(ParagraphStyle(
        name='ScoreGood',
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=GREEN_700,
        leading=14,
    ))
    
    styles.add(ParagraphStyle(
        name='ScoreBad',
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=BRICK_500,
        leading=14,
    ))
    
    styles.add(ParagraphStyle(
        name='ScoreMedium',
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=BRASS_500,
        leading=14,
    ))
    
    styles.add(ParagraphStyle(
        name='ReportMeta',
        fontName='Helvetica',
        fontSize=9,
        textColor=STONE_600,
        leading=12,
        spaceAfter=4,
    ))
    
    styles.add(ParagraphStyle(
        name='ReportFixItem',
        fontName='Helvetica',
        fontSize=9.5,
        textColor=STONE_950,
        leading=13,
        leftIndent=12,
        spaceAfter=4,
        bulletIndent=4,
    ))
    
    return styles

def score_table(styles):
    data = [
        [Paragraph('<b>Pillar</b>', styles['ReportBodyBold']), 
         Paragraph('<b>Score</b>', styles['ReportBodyBold']),
         Paragraph('<b>Key Issue</b>', styles['ReportBodyBold'])],
        [Paragraph('Copywriting', styles['ReportBody']), 
         Paragraph('3/4', styles['ScoreGood']),
         Paragraph('Translation gaps: status_confirmed/disputed do not match real statuses', styles['ReportBody'])],
        [Paragraph('Visuals', styles['ReportBody']), 
         Paragraph('3/4', styles['ScoreGood']),
         Paragraph('Record/Submit/Entity/Login/Dashboard pages have NO Header or Footer', styles['ReportBody'])],
        [Paragraph('Color', styles['ReportBody']), 
         Paragraph('2/4', styles['ScoreBad']),
         Paragraph('Dashboard uses bright traffic-light colors (#16a34a, #dc2626, #2563eb) — violates spec', styles['ReportBody'])],
        [Paragraph('Typography', styles['ReportBody']), 
         Paragraph('3/4', styles['ScoreGood']),
         Paragraph('Many client pages use inline styles instead of .ds-* token classes', styles['ReportBody'])],
        [Paragraph('Spacing', styles['ReportBody']), 
         Paragraph('3/4', styles['ScoreGood']),
         Paragraph('Inconsistent max-width (920px vs 1080px) across pages', styles['ReportBody'])],
        [Paragraph('Experience Design', styles['ReportBody']), 
         Paragraph('2/4', styles['ScoreBad']),
         Paragraph('Cards not clickable, no pagination, no skeletons, no error states', styles['ReportBody'])],
    ]
    
    t = Table(data, colWidths=[4*cm, 2.5*cm, 8.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GREEN_700),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('LEFTPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, STONE_200),
        ('BACKGROUND', (0, 1), (-1, -1), WHITE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 1), (-1, -1), 8),
        ('RIGHTPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))
    return t

def fix_priority_table(styles):
    data = [
        [Paragraph('<b>#</b>', styles['ReportBodyBold']),
         Paragraph('<b>Fix</b>', styles['ReportBodyBold']),
         Paragraph('<b>Severity</b>', styles['ReportBodyBold']),
         Paragraph('<b>Effort</b>', styles['ReportBodyBold'])],
        [Paragraph('1', styles['ReportBody']),
         Paragraph('Add Header + Footer to ALL pages', styles['ReportBody']),
         Paragraph('HIGH', styles['ScoreBad']),
         Paragraph('1 day', styles['ReportBody'])],
        [Paragraph('2', styles['ReportBody']),
         Paragraph('Wire up evidence card click-through', styles['ReportBody']),
         Paragraph('HIGH', styles['ScoreBad']),
         Paragraph('2 hrs', styles['ReportBody'])],
        [Paragraph('3', styles['ReportBody']),
         Paragraph('Redesign Dashboard with design tokens', styles['ReportBody']),
         Paragraph('HIGH', styles['ScoreBad']),
         Paragraph('4 hrs', styles['ReportBody'])],
        [Paragraph('4', styles['ReportBody']),
         Paragraph('Add pagination to archive views', styles['ReportBody']),
         Paragraph('HIGH', styles['ScoreBad']),
         Paragraph('4 hrs', styles['ReportBody'])],
        [Paragraph('5', styles['ReportBody']),
         Paragraph('Add loading skeletons + error states', styles['ReportBody']),
         Paragraph('Medium', styles['ScoreMedium']),
         Paragraph('6 hrs', styles['ReportBody'])],
        [Paragraph('6', styles['ReportBody']),
         Paragraph('Extract shared FilterPanel component', styles['ReportBody']),
         Paragraph('Medium', styles['ScoreMedium']),
         Paragraph('4 hrs', styles['ReportBody'])],
        [Paragraph('7', styles['ReportBody']),
         Paragraph('Mobile filter UX (collapsible)', styles['ReportBody']),
         Paragraph('Medium', styles['ScoreMedium']),
         Paragraph('3 hrs', styles['ReportBody'])],
        [Paragraph('8', styles['ReportBody']),
         Paragraph('Fix translation gaps + add missing keys', styles['ReportBody']),
         Paragraph('Low', styles['ScoreGood']),
         Paragraph('2 hrs', styles['ReportBody'])],
    ]
    
    t = Table(data, colWidths=[1*cm, 7.5*cm, 3*cm, 3.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GREEN_700),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('LEFTPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, STONE_200),
        ('BACKGROUND', (0, 1), (-1, -1), WHITE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 1), (-1, -1), 8),
        ('RIGHTPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))
    return t

def v12_req_table(styles):
    data = [
        [Paragraph('<b>Req</b>', styles['ReportBodyBold']),
         Paragraph('<b>Description</b>', styles['ReportBodyBold']),
         Paragraph('<b>Phase</b>', styles['ReportBodyBold'])],
        [Paragraph('UI-01', styles['ReportBody']),
         Paragraph('Shared page shell (Header + Footer on all pages)', styles['ReportBody']),
         Paragraph('16', styles['ReportBody'])],
        [Paragraph('UI-02', styles['ReportBody']),
         Paragraph('Dashboard redesign using design tokens only', styles['ReportBody']),
         Paragraph('16', styles['ReportBody'])],
        [Paragraph('UI-03', styles['ReportBody']),
         Paragraph('Evidence card click-through to entity detail', styles['ReportBody']),
         Paragraph('17', styles['ReportBody'])],
        [Paragraph('UI-04', styles['ReportBody']),
         Paragraph('Pagination for archive views', styles['ReportBody']),
         Paragraph('17', styles['ReportBody'])],
        [Paragraph('UI-05', styles['ReportBody']),
         Paragraph('Loading skeletons and error states', styles['ReportBody']),
         Paragraph('17', styles['ReportBody'])],
        [Paragraph('UI-06', styles['ReportBody']),
         Paragraph('Unified search/filter component', styles['ReportBody']),
         Paragraph('18', styles['ReportBody'])],
        [Paragraph('UI-07', styles['ReportBody']),
         Paragraph('Mobile filter UX (collapsible sidebar)', styles['ReportBody']),
         Paragraph('18', styles['ReportBody'])],
        [Paragraph('UI-08', styles['ReportBody']),
         Paragraph('Translation gap fixes', styles['ReportBody']),
         Paragraph('18', styles['ReportBody'])],
        [Paragraph('UI-09', styles['ReportBody']),
         Paragraph('Typography consistency (remove inline styles)', styles['ReportBody']),
         Paragraph('19', styles['ReportBody'])],
        [Paragraph('UI-10', styles['ReportBody']),
         Paragraph('Empty state design with CTA', styles['ReportBody']),
         Paragraph('19', styles['ReportBody'])],
        [Paragraph('UI-11', styles['ReportBody']),
         Paragraph('Stats bar empty state', styles['ReportBody']),
         Paragraph('19', styles['ReportBody'])],
        [Paragraph('UI-12', styles['ReportBody']),
         Paragraph('Login UX improvements', styles['ReportBody']),
         Paragraph('19', styles['ReportBody'])],
    ]
    
    t = Table(data, colWidths=[2*cm, 9.5*cm, 3.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GREEN_700),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('LEFTPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, STONE_200),
        ('BACKGROUND', (0, 1), (-1, -1), WHITE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 1), (-1, -1), 8),
        ('RIGHTPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
    ]))
    return t

def build_pdf():
    doc = SimpleDocTemplate(
        "HLShajara-UI-Audit-v1.2-Plan.pdf",
        pagesize=A4,
        rightMargin=MARGIN,
        leftMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
    )
    
    styles = build_styles()
    story = []
    
    # === COVER ===
    story.append(Spacer(1, 4*cm))
    story.append(Paragraph("HLShajara", styles['ReportTitle']))
    story.append(Paragraph("حملة لستَ شجرة", ParagraphStyle(
        name='ArabicTitle',
        fontName='KufamBold',
        fontSize=24,
        textColor=GREEN_700,
        spaceAfter=16,
        alignment=TA_LEFT,
    )))
    story.append(Paragraph("UI Audit Report & v1.2 Fixing Plan", styles['ReportSubtitle']))
    story.append(Spacer(1, 1*cm))
    
    # Score box
    score_data = [
        [Paragraph('<b>Overall Score</b>', styles['ReportBodyBold']),
         Paragraph('<b>16 / 24</b>', ParagraphStyle(
             name='BigScore',
             fontName='Helvetica-Bold',
             fontSize=24,
             textColor=BRASS_500,
             alignment=TA_CENTER,
         ))],
        [Paragraph('Target for v1.2', styles['ReportMeta']),
         Paragraph('22 / 24', styles['ScoreGood'])],
        [Paragraph('Audit date', styles['ReportMeta']),
         Paragraph('2026-05-31', styles['ReportMeta'])],
        [Paragraph('Staging', styles['ReportMeta']),
         Paragraph('staging.hlshajara.com', styles['ReportMeta'])],
    ]
    score_box = Table(score_data, colWidths=[5*cm, 5*cm])
    score_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GREEN_700),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, STONE_200),
        ('BACKGROUND', (0, 1), (-1, -1), PAPER),
    ]))
    story.append(score_box)
    story.append(PageBreak())
    
    # === SECTION 1: SCORE SUMMARY ===
    story.append(Paragraph("1. Six-Pillar Score Summary", styles['ReportH1']))
    story.append(Spacer(1, 0.3*cm))
    story.append(score_table(styles))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(
        "The audit evaluated the frontend against the DESIGN ASSETS design system spec "
        "(README.md, colors_and_type.css, ICONOGRAPHY.md) and the interactive UI kit "
        "(ui_kits/archive/). All user-facing pages and components were reviewed.",
        styles['ReportBody']
    ))
    story.append(PageBreak())
    
    # === SECTION 2: CRITICAL FINDINGS ===
    story.append(Paragraph("2. Critical Findings", styles['ReportH1']))
    
    story.append(Paragraph("2.1 Pages Without Header or Footer", styles['ReportH2']))
    story.append(Paragraph(
        "Every page except the homepage is missing the sticky Header and dark-green Footer. "
        "Users who navigate to /record, /submit, /entity/[id], /login, /dashboard, /reviewer, "
        "or any policy page lose all navigation context. They cannot switch language, submit a report, "
        "or return to the archive without the browser back button.",
        styles['ReportBody']
    ))
    story.append(Paragraph(
        "<b>Affected pages:</b> /record, /submit, /entity/[id], /login, /dashboard, /reviewer, "
        "/mission, /faq, /policy, /terms, /privacy, /reply",
        styles['ReportBody']
    ))
    
    story.append(Paragraph("2.2 Dashboard Uses Rainbow Colors", styles['ReportH2']))
    story.append(Paragraph(
        "The dashboard page uses hardcoded bright colors: #16a34a (green), #dc2626 (red), "
        "#2563eb (blue), #ca8a04 (yellow), #7c3aed (purple). The design spec explicitly forbids this: "
        "\"No saturated UI colors. Status uses muted dots, never a traffic-light palette.\" "
        "The dashboard looks like a different product entirely.",
        styles['ReportBody']
    ))
    
    story.append(Paragraph("2.3 Evidence Cards Are Not Clickable", styles['ReportH2']))
    story.append(Paragraph(
        "The EvidenceCard component supports an onOpen prop, but ArchiveHome and RecordClient "
        "never pass it. Cards have hover styling (.interactive:hover) that suggests clickability, "
        "but clicking does nothing. Users expect to navigate to the entity detail page from any card.",
        styles['ReportBody']
    ))
    
    story.append(Paragraph("2.4 No Pagination — Silent Truncation", styles['ReportH2']))
    story.append(Paragraph(
        "Both the homepage and /record page fetch entities with LIMIT 50. If more than 50 "
        "entities exist, they are silently hidden. There is no pagination UI, no \"Load more\" button, "
        "and no indication that results are truncated.",
        styles['ReportBody']
    ))
    
    story.append(Paragraph("2.5 No Loading Skeletons or Error States", styles['ReportH2']))
    story.append(Paragraph(
        "RecordClient, EntityDetailClient, and Dashboard show plain text (\"Loading...\" / \"جارِ التحميل...\") "
        "while fetching data. If the fetch fails, the text stays forever. There are no skeleton placeholders, "
        "no error messages, and no retry buttons.",
        styles['ReportBody']
    ))
    story.append(PageBreak())
    
    # === SECTION 3: TOP PRIORITY FIXES ===
    story.append(Paragraph("3. Top Priority Fixes", styles['ReportH1']))
    story.append(Spacer(1, 0.3*cm))
    story.append(fix_priority_table(styles))
    story.append(PageBreak())
    
    # === SECTION 4: v1.2 FIXING PLAN ===
    story.append(Paragraph("4. v1.2 Fixing Plan — Frontend Polish", styles['ReportH1']))
    story.append(Paragraph(
        "Milestone: v1.2 Frontend Polish | Goal: Score 22/24 | Estimated: 3–4 days",
        styles['ReportMeta']
    ))
    story.append(Spacer(1, 0.3*cm))
    
    story.append(Paragraph("Phase 16: Page Shell & Dashboard Redesign", styles['ReportH2']))
    story.append(Paragraph(
        "• Create PageShell layout wrapper (Header + Footer + consistent max-width)<br/>"
        "• Wrap all 12 user-facing pages in PageShell<br/>"
        "• Remove all inline main wrapper styles from client pages<br/>"
        "• Redesign Dashboard: replace rainbow colors with design tokens<br/>"
        "• Dashboard uses .card, .ds-h1, .ds-lead classes<br/>"
        "• Remove all inline styles from Dashboard",
        styles['ReportBody']
    ))
    
    story.append(Paragraph("Phase 17: Interactions & Pagination", styles['ReportH2']))
    story.append(Paragraph(
        "• Wire onOpen handler in ArchiveHome → route to entity detail<br/>"
        "• Same for RecordClient<br/>"
        "• Backend: add page + limit params to GET /api/entity<br/>"
        "• Frontend: pagination controls (Prev/Next + page numbers)<br/>"
        "• Default limit: 12 (fits 2×6 grid)<br/>"
        "• Create SkeletonCard component with pulse animation<br/>"
        "• Add skeleton states to RecordClient, EntityDetailClient, Dashboard<br/>"
        "• Add error states with retry button to all data-fetching pages",
        styles['ReportBody']
    ))
    
    story.append(Paragraph("Phase 18: Filter UX & Mobile", styles['ReportH2']))
    story.append(Paragraph(
        "• Extract FilterPanel component from ArchiveHome<br/>"
        "• Replace RecordClient native selects with FilterPanel chips<br/>"
        "• Mobile (<860px): collapsible filter sidebar with toggle button<br/>"
        "• Toggle button shows active filter count badge<br/>"
        "• Smooth expand/collapse animation (200ms)<br/>"
        "• Fix translation gaps: add status labels, filter notice, creeds to messages",
        styles['ReportBody']
    ))
    
    story.append(Paragraph("Phase 19: Copy & Polish", styles['ReportH2']))
    story.append(Paragraph(
        "• Replace inline styles with .ds-* classes on all client pages<br/>"
        "• Design empty states: seal icon + message + CTA button<br/>"
        "• Stats bar: show \"—\" instead of 0 when no data<br/>"
        "• Login: add show-password toggle, visible labels, styled errors<br/>"
        "• Fix [dir=rtl] filter-group-label uppercase issue<br/>"
        "• Final build verification: next build with zero TS errors<br/>"
        "• Re-run UI audit: target score ≥ 22/24",
        styles['ReportBody']
    ))
    
    story.append(Spacer(1, 0.5*cm))
    story.append(v12_req_table(styles))
    story.append(PageBreak())
    
    # === SECTION 5: SUCCESS CRITERIA ===
    story.append(Paragraph("5. v1.2 Success Criteria", styles['ReportH1']))
    items = [
        "All 12 requirements (UI-01 through UI-12) implemented and deployed to staging",
        "UI audit re-run: score ≥ 22/24",
        "Every page has Header + Footer",
        "Dashboard uses only design tokens (zero hardcoded hex colors)",
        "Evidence cards are clickable and route to detail",
        "All loading states show skeletons, not plain text",
        "All error states show retry buttons, not infinite spinners",
        "Mobile filter UX is usable (<860px)",
        "No inline styles remain on any client page",
        "Build passes (next build) with zero TypeScript errors",
    ]
    for item in items:
        story.append(Paragraph(f"• {item}", styles['ReportBody']))
    
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(
        "Generated: 2026-05-31 | HLShajara (لست شجرة) | staging.hlshajara.com",
        ParagraphStyle(
            name='Footer',
            fontName='Helvetica',
            fontSize=8,
            textColor=STONE_600,
            alignment=TA_CENTER,
        )
    ))
    
    doc.build(story)
    print("PDF generated: HLShajara-UI-Audit-v1.2-Plan.pdf")

if __name__ == "__main__":
    build_pdf()
