import { NextRequest, NextResponse } from 'next/server'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, LevelFormat,
} from 'docx'

// ─── Constants ────────────────────────────────────────────────────────────────

// A4 page: 11906 x 16838 DXA; margins: top/bottom 720 (0.5in), left/right 720
const PAGE_W = 11906
const MARGIN = 720
const CONTENT_W = PAGE_W - MARGIN * 2  // 10466

// Two-column layout: left sidebar 2800, right content 7386 (gap via cell margins)
const COL_LEFT = 2800
const COL_RIGHT = CONTENT_W - COL_LEFT  // 7666

// Brand colors
const NAVY = '1A237E'       // sidebar bg
const NAVY_LIGHT = '283593' // slightly lighter for accents
const WHITE = 'FFFFFF'
const CHARCOAL = '212121'
const GRAY = '616161'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _LIGHT_GRAY = 'F5F5F5'
const ACCENT = 'FFA000'     // amber accent for section titles on right

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER }

// ─── Text helpers ─────────────────────────────────────────────────────────────

function run(text: string, opts: {
  bold?: boolean; color?: string; size?: number; font?: string; italic?: boolean
} = {}) {
  return new TextRun({
    text,
    bold: opts.bold,
    color: opts.color ?? CHARCOAL,
    size: opts.size ?? 20,       // half-points (20 = 10pt)
    font: opts.font ?? 'Calibri',
    italics: opts.italic,
  })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _para(children: TextRun[], opts: {
  align?: (typeof AlignmentType)[keyof typeof AlignmentType]
  spaceBefore?: number
  spaceAfter?: number
  bullet?: boolean
} = {}) {
  return new Paragraph({
    alignment: opts.align,
    spacing: { before: opts.spaceBefore ?? 0, after: opts.spaceAfter ?? 40 },
    children,
  })
}

function emptyPara(space = 40) {
  return new Paragraph({ children: [new TextRun('')], spacing: { before: 0, after: space } })
}

// ─── Sidebar helpers ──────────────────────────────────────────────────────────

function sidebarHeading(text: string) {
  return new Paragraph({
    children: [run(text.toUpperCase(), { bold: true, color: ACCENT, size: 18 })],
    spacing: { before: 200, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT } },
  })
}

function sidebarText(text: string, bold = false) {
  return new Paragraph({
    children: [run(text, { color: 'E8EAF6', size: 18, bold })],
    spacing: { before: 0, after: 60 },
  })
}

function sidebarBullet(text: string) {
  return new Paragraph({
    children: [run('• ' + text, { color: 'E8EAF6', size: 18 })],
    spacing: { before: 0, after: 50 },
  })
}

// ─── Right-column helpers ─────────────────────────────────────────────────────

function sectionTitle(text: string) {
  return new Paragraph({
    children: [run(text.toUpperCase(), { bold: true, color: NAVY, size: 22 })],
    spacing: { before: 240, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY } },
  })
}

function jobTitle(role: string, company: string, location: string) {
  return new Paragraph({
    children: [
      run(role, { bold: true, color: CHARCOAL, size: 22 }),
      run('  |  ', { color: GRAY, size: 20 }),
      run(company, { color: NAVY_LIGHT, size: 20, bold: true }),
      location ? run('  ·  ' + location, { color: GRAY, size: 18, italic: true }) : new TextRun(''),
    ],
    spacing: { before: 140, after: 40 },
  })
}

function dateRange(start: string, end: string, current: boolean) {
  const endStr = current ? 'Present' : end
  return new Paragraph({
    children: [run(`${start}${endStr ? ' – ' + endStr : ''}`, { color: GRAY, size: 18, italic: true })],
    spacing: { before: 0, after: 60 },
  })
}

function bulletPoint(text: string) {
  return new Paragraph({
    children: [run(text, { color: CHARCOAL, size: 20 })],
    spacing: { before: 0, after: 50 },
    numbering: { reference: 'resume-bullets', level: 0 },
  })
}

function bodyText(text: string, spaceAfter = 80) {
  return new Paragraph({
    children: [run(text, { color: CHARCOAL, size: 20 })],
    spacing: { before: 0, after: spaceAfter },
  })
}

// ─── Sidebar cell builder ─────────────────────────────────────────────────────

function sidebarCell(children: Paragraph[], hasPhoto: boolean, photoData?: Buffer) {
  const photoRows: Paragraph[] = []

  if (hasPhoto && photoData) {
    photoRows.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: 'jpg',
            data: photoData,
            transformation: { width: 100, height: 120 },
            altText: { title: 'Profile photo', description: 'Candidate passport photo', name: 'photo' },
          }),
        ],
        spacing: { before: 0, after: 120 },
      })
    )
  }

  return new TableCell({
    width: { size: COL_LEFT, type: WidthType.DXA },
    shading: { fill: NAVY, type: ShadingType.CLEAR },
    borders: NO_BORDERS,
    margins: { top: 300, bottom: 300, left: 300, right: 300 },
    verticalAlign: VerticalAlign.TOP,
    children: [...photoRows, ...children],
  })
}

function contentCell(children: Paragraph[]) {
  return new TableCell({
    width: { size: COL_RIGHT, type: WidthType.DXA },
    shading: { fill: WHITE, type: ShadingType.CLEAR },
    borders: NO_BORDERS,
    margins: { top: 300, bottom: 300, left: 400, right: 200 },
    verticalAlign: VerticalAlign.TOP,
    children,
  })
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const raw = formData.get('data')
    if (!raw || typeof raw !== 'string') {
      return NextResponse.json({ error: 'Missing form data' }, { status: 400 })
    }

    const data = JSON.parse(raw)
    const photoFile = formData.get('photo') as File | null

    let photoBuffer: Buffer | undefined
    if (photoFile) {
      const ab = await photoFile.arrayBuffer()
      photoBuffer = Buffer.from(ab)
    }

    // ── Build sidebar content ──────────────────────────────────────────────

    const sidebarContent: Paragraph[] = []

    // Contact section
    sidebarContent.push(sidebarHeading('Contact'))
    if (data.phone)    sidebarContent.push(sidebarText(data.phone))
    if (data.email)    sidebarContent.push(sidebarText(data.email))
    if (data.location) sidebarContent.push(sidebarText(data.location))
    if (data.linkedin) sidebarContent.push(sidebarText(data.linkedin))
    if (data.portfolio) sidebarContent.push(sidebarText(data.portfolio))

    // Technical skills
    if (data.technicalSkills?.trim()) {
      sidebarContent.push(sidebarHeading('Technical Skills'))
      const skills = data.technicalSkills.split(',').map((s: string) => s.trim()).filter(Boolean)
      skills.forEach((s: string) => sidebarContent.push(sidebarBullet(s)))
    }

    // Soft skills
    if (data.softSkills?.trim()) {
      sidebarContent.push(sidebarHeading('Soft Skills'))
      const skills = data.softSkills.split(',').map((s: string) => s.trim()).filter(Boolean)
      skills.forEach((s: string) => sidebarContent.push(sidebarBullet(s)))
    }

    // Languages
    if (data.languages?.trim()) {
      sidebarContent.push(sidebarHeading('Languages'))
      const langs = data.languages.split(',').map((s: string) => s.trim()).filter(Boolean)
      langs.forEach((s: string) => sidebarContent.push(sidebarBullet(s)))
    }

    // Education (in sidebar)
    if (data.education?.length) {
      sidebarContent.push(sidebarHeading('Education'))
      data.education.forEach((edu: {
        degree: string; field: string; institution: string;
        startYear: string; endYear: string; score: string; scoreType: string
      }) => {
        if (!edu.institution && !edu.degree) return
        sidebarContent.push(sidebarText(`${edu.degree}${edu.field ? ' in ' + edu.field : ''}`, true))
        sidebarContent.push(sidebarText(edu.institution))
        if (edu.startYear || edu.endYear) {
          sidebarContent.push(sidebarText(`${edu.startYear}${edu.endYear ? ' – ' + edu.endYear : ''}`))
        }
        if (edu.score) {
          sidebarContent.push(sidebarText(
            `${edu.scoreType === 'cgpa' ? 'CGPA' : 'Score'}: ${edu.score}`
          ))
        }
        sidebarContent.push(emptyPara(60))
      })
    }

    // Certifications (in sidebar)
    if (data.certifications?.some((c: { name: string }) => c.name.trim())) {
      sidebarContent.push(sidebarHeading('Certifications'))
      data.certifications.forEach((c: { name: string; issuer: string; year: string }) => {
        if (!c.name.trim()) return
        sidebarContent.push(sidebarText(c.name, true))
        if (c.issuer) sidebarContent.push(sidebarText(c.issuer))
        if (c.year)   sidebarContent.push(sidebarText(c.year))
        sidebarContent.push(emptyPara(40))
      })
    }

    // ── Build right column content ─────────────────────────────────────────

    const rightContent: Paragraph[] = []

    // Name + title header
    rightContent.push(
      new Paragraph({
        children: [run(data.fullName || 'Your Name', { bold: true, color: NAVY, size: 52, font: 'Calibri' })],
        spacing: { before: 0, after: 60 },
      })
    )

    // Separator line under name
    rightContent.push(
      new Paragraph({
        children: [new TextRun('')],
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY } },
        spacing: { before: 0, after: 160 },
      })
    )

    // Summary
    if (data.summary?.trim()) {
      rightContent.push(sectionTitle('Professional Summary'))
      rightContent.push(bodyText(data.summary, 100))
    }

    // Work experience
    const validExp = (data.experience ?? []).filter((e: { company: string; role: string }) => e.company || e.role)
    if (validExp.length) {
      rightContent.push(sectionTitle('Work Experience'))
      validExp.forEach((exp: {
        role: string; company: string; location: string;
        startDate: string; endDate: string; current: boolean; bullets: string[]
      }) => {
        rightContent.push(jobTitle(exp.role, exp.company, exp.location))
        if (exp.startDate) rightContent.push(dateRange(exp.startDate, exp.endDate, exp.current))
        const validBullets = (exp.bullets ?? []).filter((b: string) => b.trim())
        validBullets.forEach((b: string) => rightContent.push(bulletPoint(b)))
        rightContent.push(emptyPara(60))
      })
    }

    // Projects
    const validProj = (data.projects ?? []).filter((p: { name: string }) => p.name.trim())
    if (validProj.length) {
      rightContent.push(sectionTitle('Projects'))
      validProj.forEach((p: { name: string; techStack: string; description: string; link: string }) => {
        rightContent.push(
          new Paragraph({
            children: [
              run(p.name, { bold: true, color: CHARCOAL, size: 22 }),
              p.techStack ? run('  ·  ' + p.techStack, { color: GRAY, size: 18, italic: true }) : new TextRun(''),
            ],
            spacing: { before: 140, after: 40 },
          })
        )
        if (p.description) rightContent.push(bodyText(p.description))
        if (p.link) {
          rightContent.push(
            new Paragraph({
              children: [run(p.link, { color: NAVY_LIGHT, size: 18, italic: true })],
              spacing: { before: 0, after: 80 },
            })
          )
        }
        rightContent.push(emptyPara(40))
      })
    }

    // Achievements
    if (data.achievements?.trim()) {
      rightContent.push(sectionTitle('Achievements & Extra-Curriculars'))
      const lines = data.achievements.split('\n').map((l: string) => l.trim()).filter(Boolean)
      lines.forEach((line: string) => {
        const text = line.replace(/^[•\-\*]\s*/, '')
        rightContent.push(bulletPoint(text))
      })
    }

    // ── Assemble document ──────────────────────────────────────────────────

    const doc = new Document({
      numbering: {
        config: [
          {
            reference: 'resume-bullets',
            levels: [{
              level: 0,
              format: LevelFormat.BULLET,
              text: '▸',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 260 } } },
            }],
          },
        ],
      },
      sections: [{
        properties: {
          page: {
            size: { width: PAGE_W, height: 16838 },
            margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
          },
        },
        children: [
          new Table({
            width: { size: CONTENT_W, type: WidthType.DXA },
            columnWidths: [COL_LEFT, COL_RIGHT],
            borders: {
              top: NO_BORDER, bottom: NO_BORDER,
              left: NO_BORDER, right: NO_BORDER,
            },
            rows: [
              new TableRow({
                children: [
                  sidebarCell(sidebarContent, !!photoBuffer, photoBuffer),
                  contentCell(rightContent),
                ],
              }),
            ],
          }),
        ],
      }],
    })

    const buffer = await Packer.toBuffer(doc)
    const uint8 = new Uint8Array(buffer)

    return new NextResponse(uint8, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="resume.docx"`,
      },
    })
  } catch (err) {
    console.error('Resume generation error:', err)
    return NextResponse.json({ error: 'Failed to generate resume' }, { status: 500 })
  }
}
