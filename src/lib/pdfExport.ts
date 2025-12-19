import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatGPA, getClassStanding, GRADE_SCALE } from './calculations';
import { Colors } from '../constants/colors';
import type { SemesterWithCourses, Profile } from '../types';

interface ExportData {
  profile: Profile | null;
  semesters: SemesterWithCourses[];
  cgpa: number | null;
}

function getGradeColorHex(grade: string): string {
  const gradeMap: Record<string, string> = {
    A: '#10B981',
    B: '#0891B2',
    C: '#F59E0B',
    D: '#F97316',
    E: '#EF4444',
    F: '#DC2626',
  };
  const baseGrade = grade.replace('+', '');
  return gradeMap[baseGrade] || '#94A3B8';
}

function generateHTML(data: ExportData): string {
  const { profile, semesters, cgpa } = data;
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalCredits = semesters.reduce((sum, sem) => sum + sem.total_credits, 0);
  const totalCourses = semesters.reduce((sum, sem) => sum + sem.courses.length, 0);

  const semestersHTML = semesters
    .sort((a, b) => a.semester_number - b.semester_number)
    .map((semester) => {
      const coursesHTML = semester.courses
        .map((course) => `
          <tr>
            <td>${course.name}</td>
            <td style="text-align: center;">${course.credit_hours}</td>
            <td style="text-align: center;">${course.ia_score ?? '-'}/${course.ia_max}</td>
            <td style="text-align: center;">${course.ue_score ?? '-'}/${course.ue_max}</td>
            <td style="text-align: center;">${course.percentage?.toFixed(1) ?? '-'}%</td>
            <td style="text-align: center; color: ${getGradeColorHex(course.grade || 'F')}; font-weight: bold;">
              ${course.grade || '-'}
            </td>
            <td style="text-align: center;">${course.grade_points?.toFixed(1) ?? '-'}</td>
          </tr>
        `)
        .join('');

      return `
        <div class="semester">
          <div class="semester-header">
            <h3>Semester ${semester.semester_number}${semester.name ? ` - ${semester.name}` : ''}</h3>
            <div class="semester-stats">
              <span class="gpa" style="color: ${semester.gpa ? (semester.gpa >= 4 ? '#10B981' : semester.gpa >= 3 ? '#0891B2' : '#F59E0B') : '#94A3B8'};">
                GPA: ${semester.gpa ? formatGPA(semester.gpa) : 'N/A'}
              </span>
              <span>Credits: ${semester.total_credits}</span>
            </div>
          </div>
          ${semester.courses.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th style="width: 60px;">Credits</th>
                  <th style="width: 80px;">IA</th>
                  <th style="width: 80px;">UE</th>
                  <th style="width: 70px;">%</th>
                  <th style="width: 50px;">Grade</th>
                  <th style="width: 60px;">Points</th>
                </tr>
              </thead>
              <tbody>
                ${coursesHTML}
              </tbody>
            </table>
          ` : '<p class="no-courses">No courses added</p>'}
        </div>
      `;
    })
    .join('');

  const gradeScaleHTML = GRADE_SCALE.map((g) => `
    <tr>
      <td style="color: ${getGradeColorHex(g.grade)}; font-weight: bold;">${g.grade}</td>
      <td>${g.min}-${g.max}%</td>
      <td>${g.points.toFixed(1)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Academic Transcript</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #1E293B;
          background: #FFFFFF;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #0891B2;
        }
        .header h1 {
          font-size: 24px;
          color: #0891B2;
          margin-bottom: 5px;
        }
        .header p {
          color: #64748B;
          font-size: 11px;
        }
        .student-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 15px;
          background: #F8FAFC;
          border-radius: 8px;
        }
        .student-info .left, .student-info .right {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .student-info strong {
          color: #0891B2;
        }
        .cgpa-box {
          text-align: center;
          padding: 20px;
          background: linear-gradient(135deg, #0891B2 0%, #0E7490 100%);
          color: white;
          border-radius: 12px;
          margin-bottom: 25px;
        }
        .cgpa-box h2 {
          font-size: 14px;
          font-weight: normal;
          opacity: 0.9;
          margin-bottom: 5px;
        }
        .cgpa-box .cgpa-value {
          font-size: 48px;
          font-weight: bold;
        }
        .cgpa-box .standing {
          font-size: 16px;
          margin-top: 5px;
          opacity: 0.95;
        }
        .stats-row {
          display: flex;
          justify-content: space-around;
          margin-bottom: 25px;
          text-align: center;
        }
        .stat-item {
          padding: 15px;
          background: #F8FAFC;
          border-radius: 8px;
          min-width: 100px;
        }
        .stat-item .value {
          font-size: 24px;
          font-weight: bold;
          color: #0891B2;
        }
        .stat-item .label {
          font-size: 11px;
          color: #64748B;
        }
        .semester {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        .semester-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #0F172A;
          color: white;
          padding: 12px 15px;
          border-radius: 8px 8px 0 0;
        }
        .semester-header h3 {
          font-size: 14px;
        }
        .semester-stats {
          display: flex;
          gap: 15px;
          font-size: 12px;
        }
        .semester-stats .gpa {
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #E2E8F0;
        }
        th {
          background: #F1F5F9;
          font-weight: 600;
          font-size: 11px;
          color: #64748B;
          text-transform: uppercase;
        }
        tbody tr:hover {
          background: #F8FAFC;
        }
        .no-courses {
          padding: 20px;
          text-align: center;
          color: #94A3B8;
          background: white;
          border: 1px solid #E2E8F0;
          border-top: none;
        }
        .grade-scale {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #E2E8F0;
        }
        .grade-scale h4 {
          font-size: 14px;
          margin-bottom: 10px;
          color: #0891B2;
        }
        .grade-scale table {
          width: auto;
        }
        .grade-scale td {
          padding: 5px 20px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #E2E8F0;
          text-align: center;
          font-size: 10px;
          color: #94A3B8;
        }
        @media print {
          body { padding: 0; }
          .semester { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Academic Transcript</h1>
        <p>Generated on ${currentDate}</p>
      </div>

      <div class="student-info">
        <div class="left">
          <div><strong>Name:</strong> ${profile?.full_name || 'Student'}</div>
          <div><strong>University:</strong> ${profile?.university || 'ISBAT University'}</div>
          <div><strong>Program:</strong> ${profile?.program || 'Not specified'}</div>
        </div>
        <div class="right">
          <div><strong>Student ID:</strong> ${profile?.student_id || 'N/A'}</div>
          <div><strong>Start Year:</strong> ${profile?.start_year || 'N/A'}</div>
          <div><strong>Country:</strong> ${profile?.country || 'Uganda'}</div>
        </div>
      </div>

      <div class="cgpa-box">
        <h2>Cumulative Grade Point Average</h2>
        <div class="cgpa-value">${cgpa ? formatGPA(cgpa) : 'N/A'}</div>
        <div class="standing">${cgpa ? getClassStanding(cgpa) : 'No grades yet'}</div>
      </div>

      <div class="stats-row">
        <div class="stat-item">
          <div class="value">${semesters.length}</div>
          <div class="label">Semesters</div>
        </div>
        <div class="stat-item">
          <div class="value">${totalCourses}</div>
          <div class="label">Courses</div>
        </div>
        <div class="stat-item">
          <div class="value">${totalCredits}</div>
          <div class="label">Total Credits</div>
        </div>
      </div>

      ${semestersHTML}

      <div class="grade-scale">
        <h4>Grading Scale (Ugandan System)</h4>
        <table>
          <thead>
            <tr>
              <th>Grade</th>
              <th>Percentage</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            ${gradeScaleHTML}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>This transcript was generated by CGPA Tracker App</p>
        <p>ISBAT University - Uganda</p>
      </div>
    </body>
    </html>
  `;
}

export async function generatePDF(data: ExportData): Promise<string> {
  const html = generateHTML(data);
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });
  return uri;
}

export async function sharePDF(data: ExportData): Promise<void> {
  const uri = await generatePDF(data);
  const isAvailable = await Sharing.isAvailableAsync();

  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Academic Transcript',
      UTI: 'com.adobe.pdf',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}

export async function printPDF(data: ExportData): Promise<void> {
  const html = generateHTML(data);
  await Print.printAsync({ html });
}
