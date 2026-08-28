import mongoose from 'mongoose';
import User from '../models/User.js';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import Notification from '../models/Notification.js';
import aiProviderFactory from '../ai/aiProviderFactory.js';
import { chunkTextWithOverlap } from '../queues/ingestionQueue.js';

export async function seedDemoData() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('ℹ️  Database already contains users. Skipping initial seed.');
      return;
    }

    console.log('🌱 Seeding default users and sample college documents...');

    // 1. Create Admin & Student Users
    const adminPassword = await User.hashPassword('CampusAdmin#Secure2026!');
    const studentPassword = await User.hashPassword('CampusStudent#Secure2026!');

    const admin = await User.create({
      name: 'Campus Administrator',
      email: 'admin.dev@campusmind.internal',
      passwordHash: adminPassword,
      role: 'admin'
    });

    const student = await User.create({
      name: 'Alex Student',
      email: 'student.dev@campusmind.internal',
      passwordHash: studentPassword,
      role: 'student'
    });

    console.log('👤 Default evaluation accounts created:');
    console.log('   Admin:   admin.dev@campusmind.internal / CampusAdmin#Secure2026!');
    console.log('   Student: student.dev@campusmind.internal / CampusStudent#Secure2026!');

    // 2. Create Sample College Documents
    const sampleDocuments = [
      {
        filename: 'Academic_HandBook_2026.pdf',
        originalName: 'Academic_HandBook_2026.pdf',
        topicCategory: 'Academic Calendar',
        uploadedBy: admin._id,
        status: 'indexed',
        fileSize: 1048576,
        text: `CAMPUSMIND INSTITUTE OF TECHNOLOGY & SCIENCE
OFFICIAL ACADEMIC HANDBOOK & REGULATIONS (2025-2026)

CHAPTER 1: ATTENDANCE & EXAMINATION REGULATIONS
1.1 Minimum Attendance Requirement:
All undergraduate (B.Tech) and postgraduate (M.Tech, MBA) students are strictly required to maintain a minimum aggregate attendance of 75% in every registered subject during the semester. Students having attendance between 65% and 74% due to medical emergencies or approved institutional sports representation may apply for attendance condonation by submitting medical certificates to the Dean of Academic Affairs within 7 days of recovery. Students with attendance below 65% will not be permitted to appear for the End-Semester Examinations and must re-register for the course.

1.2 Grading System and CGPA Calculation:
The institute follows a 10-point relative grading scale:
- Grade 'O' (Outstanding): 10 grade points (Marks >= 90%)
- Grade 'A+' (Excellent): 9 grade points (Marks 80-89%)
- Grade 'A' (Very Good): 8 grade points (Marks 70-79%)
- Grade 'B+' (Good): 7 grade points (Marks 60-69%)
- Grade 'B' (Above Average): 6 grade points (Marks 50-59%)
- Grade 'C' (Pass): 5 grade points (Marks 40-49%)
- Grade 'F' (Fail): 0 grade points (Marks < 40%)
Semester Grade Point Average (SGPA) is calculated as Sum(Credits * Grade Points) / Sum(Credits). Cumulative Grade Point Average (CGPA) is the weighted average across all completed semesters.

1.3 Supplementary and Backlog Examinations:
Supplementary examinations for odd and even semester backlogs are conducted during the summer term in July. A maximum of 4 backlogs are allowed for promotion to the 3rd year.`
      },
      {
        filename: 'Fees_and_Scholarships_Policy.pdf',
        originalName: 'Fees_and_Scholarships_Policy.pdf',
        topicCategory: 'Fees',
        uploadedBy: admin._id,
        status: 'indexed',
        fileSize: 524288,
        text: `CAMPUSMIND ACADEMIC FEES AND SCHOLARSHIP NOTIFICATION

SECTION A: TUITION AND HOSTEL FEES (2025-2026)
- B.Tech Annual Tuition Fee: $4,500 (or INR 1,80,000) payable in two equal semester installments.
- First semester fee deadline: August 15.
- Second semester fee deadline: January 10.
- Late payment fee: A fine of $20 per week is levied after the due date up to 30 days.
- Hostel Accommodation Fee: Single AC Room: $1,200/semester; Double Non-AC Room: $750/semester.
- Mess Fee: $400/semester (includes breakfast, lunch, high tea, and dinner).
- Hostel Caution Deposit: $200 (100% refundable upon room vacation and clearance certificate).

SECTION B: MERIT AND NEED-BASED SCHOLARSHIPS
1. Chairman's Merit Scholarship: 100% tuition waiver awarded to students scoring above 95% in high school board exams or top 500 ranks in the National Entrance Test.
2. Dean's Academic Excellence Award: 50% tuition waiver for the top 3 CGPA holders in each department (minimum CGPA 9.2 required).
3. Women in Tech Fellowship: $1,000 one-time annual stipend for meritorious female engineering students.`
      },
      {
        filename: 'Hostel_and_Campus_Facilities_Guide.pdf',
        originalName: 'Hostel_and_Campus_Facilities_Guide.pdf',
        topicCategory: 'Hostel',
        uploadedBy: admin._id,
        status: 'indexed',
        fileSize: 786432,
        text: `CAMPUSMIND HOSTEL CODE OF CONDUCT & CAMPUS FACILITIES

1. Hostel Timings and Curfew:
The main campus gates close at 10:00 PM for all resident students. Freshers (1st-year students) must report to their respective hostel blocks by 9:00 PM. Night out passes must be requested at least 24 hours in advance through the CampusMind Student ERP portal and approved by the Chief Warden.

2. Central Library Working Hours:
The Dr. A.P.J. Abdul Kalam Central Library operates from 8:00 AM to 11:00 PM on all weekdays, and 9:00 AM to 6:00 PM on weekends. During mid-term and end-term exam periods, the 2nd-floor 24-hour reading hall remains open continuously.

3. Health and Medical Center:
A 24/7 on-campus health clinic with two resident physicians, an ambulance service, and pharmacy is located adjacent to Hostel Block C. Emergency helpline: +1 (555) 019-9999.

4. Anti-Ragging & Grievance Cell:
CampusMind maintains a zero-tolerance policy against ragging. Any act of physical or psychological harassment will lead to immediate expulsion. Grievance redressal email: antiragging@campusmind.edu.`
      },
      {
        filename: 'Campus_Placement_and_Internship_Rules.pdf',
        originalName: 'Campus_Placement_and_Internship_Rules.pdf',
        topicCategory: 'Placements',
        uploadedBy: admin._id,
        status: 'indexed',
        fileSize: 629145,
        text: `CAMPUS PLACEMENT AND CAREER SERVICES GUIDELINES

1. Eligibility for Campus Placements:
- Students entering their 7th semester with a minimum cumulative CGPA of 6.5 and no active backlogs are eligible to register for on-campus placement drives.
- A minimum 80% attendance in placement training workshops (Aptitude, Soft Skills, Mock Coding) is mandatory.

2. Dream Offer Policy:
Once a student secures an offer with a compensation package between $10,000 - $18,000 (Tier 2), they are permitted to attempt one additional "Super Dream" company offering greater than $25,000 CTC.

3. Mandatory 8th Semester Internship:
All final year B.Tech students must complete a mandatory 6-month industrial internship starting January. Companies must provide official offer letters and designated mentor details to the Placement Cell by December 1.`
      }
    ];

    const provider = aiProviderFactory.getProvider();

    for (const docData of sampleDocuments) {
      const doc = await Document.create({
        filename: docData.filename,
        originalName: docData.originalName,
        topicCategory: docData.topicCategory,
        uploadedBy: docData.uploadedBy,
        status: 'indexed',
        fileSize: docData.fileSize
      });

      const extractedChunks = chunkTextWithOverlap(docData.text, 1, 300, 40);
      const chunkDocs = [];

      for (let i = 0; i < extractedChunks.length; i++) {
        const item = extractedChunks[i];
        let embedding = [];
        try {
          embedding = await provider.generateEmbedding(item.text);
        } catch {
          embedding = await aiProviderFactory.fallback.generateEmbedding(item.text);
        }

        chunkDocs.push({
          docId: doc._id,
          text: item.text,
          pageNumber: item.pageNumber,
          chunkIndex: i,
          embedding,
          tokenCount: item.tokenCount
        });
      }

      await Chunk.insertMany(chunkDocs);
      doc.numChunks = chunkDocs.length;
      await doc.save();
      console.log(`📄 Seeded document "${doc.originalName}" with ${chunkDocs.length} chunks.`);
    }

    // 3. Seed initial admin notification
    await Notification.create({
      type: 'system',
      title: 'Welcome to CampusMind RAG System',
      message: 'CampusMind knowledge base initialized with 4 official college documents and active guardrails.'
    });

    console.log('✅ Seed completed successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

export default seedDemoData;
