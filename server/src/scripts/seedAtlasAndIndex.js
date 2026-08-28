import mongoose from 'mongoose';
import config from '../config/env.js';
import User from '../models/User.js';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import Notification from '../models/Notification.js';
import aiProviderFactory from '../ai/aiProviderFactory.js';
import { chunkTextWithOverlap } from '../queues/ingestionQueue.js';

async function seedAtlasAndCreateIndex() {
  console.log('Connecting to Atlas DB at:', config.mongodbUri.replace(/:([^@]+)@/, ':****@'));
  await mongoose.connect(config.mongodbUri);

  console.log('Connected to Atlas DB:', mongoose.connection.name);

  // Clear existing collections for a clean run if requested
  const userCount = await User.countDocuments();
  console.log('Current User count in Atlas:', userCount);

  if (userCount === 0) {
    console.log('Seeding demo users on Atlas...');
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

    console.log('Seeded Users:');
    console.log(' - Admin:', admin.email);
    console.log(' - Student:', student.email);

    // Seed sample college document with real Gemini embeddings
    const sampleDocs = [
      {
        filename: 'Academic_HandBook_2026.pdf',
        originalName: 'Academic_HandBook_2026.pdf',
        topicCategory: 'Academic Calendar',
        uploadedBy: admin._id,
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
Semester Grade Point Average (SGPA) is calculated as Sum(Credits * Grade Points) / Sum(Credits). Cumulative Grade Point Average (CGPA) is the weighted average across all completed semesters.`
      },
      {
        filename: 'Hostel_and_Campus_Facilities_Guide.pdf',
        originalName: 'Hostel_and_Campus_Facilities_Guide.pdf',
        topicCategory: 'Hostel',
        uploadedBy: admin._id,
        fileSize: 786432,
        text: `CAMPUSMIND HOSTEL CODE OF CONDUCT & CAMPUS FACILITIES

1. Hostel Timings and Curfew:
The main campus gates close at 10:00 PM for all resident students. Freshers (1st-year students) must report to their respective hostel blocks by 9:00 PM. Night out passes must be requested at least 24 hours in advance through the CampusMind Student ERP portal and approved by the Chief Warden.

2. Central Library Working Hours:
The Dr. A.P.J. Abdul Kalam Central Library operates from 8:00 AM to 11:00 PM on all weekdays, and 9:00 AM to 6:00 PM on weekends. During mid-term and end-term exam periods, the 2nd-floor 24-hour reading hall remains open continuously.

3. Health and Medical Center:
A 24/7 on-campus health clinic with two resident physicians, an ambulance service, and pharmacy is located adjacent to Hostel Block C. Emergency helpline: +1 (555) 019-9999.`
      }
    ];

    const provider = aiProviderFactory.getProvider();
    console.log(`Active Provider for seeding: ${provider.providerName}`);

    for (const docData of sampleDocs) {
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
        console.log(`Generating Gemini embedding for "${doc.originalName}" chunk ${i + 1}...`);
        const embedding = await provider.generateEmbedding(item.text);
        console.log(` -> Embedding generated with ${embedding.length} dimensions.`);

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
      console.log(`✅ Document "${doc.originalName}" seeded with ${chunkDocs.length} vector chunks.`);
    }

    await Notification.create({
      type: 'system',
      title: 'MongoDB Atlas Knowledge Base Initialized',
      message: 'CampusMind initialized on persistent MongoDB Atlas cluster with active Gemini embeddings.'
    });
  }

  // Now create the Atlas Vector Search Index on chunks collection
  const chunksCollection = mongoose.connection.db.collection('chunks');
  const indexDefinition = {
    name: 'vector_index',
    type: 'vectorSearch',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: 3072,
          similarity: 'cosine'
        },
        {
          type: 'filter',
          path: 'docId'
        }
      ]
    }
  };

  try {
    console.log('\nCreating Atlas Vector Search Index on chunks collection...');
    const indexResult = await chunksCollection.createSearchIndex(indexDefinition);
    console.log('✅ Atlas Vector Index create result:', indexResult);
  } catch (err) {
    console.log('ℹ️ Search index creation message:', err.message);
  }

  try {
    const indexes = await chunksCollection.listSearchIndexes().toArray();
    console.log('📋 Current Atlas Search Indexes:', indexes);
  } catch (err) {
    console.log('ℹ️ List search index message:', err.message);
  }

  await mongoose.disconnect();
  console.log('✅ Atlas Database Seed & Vector Index Complete!');
}

seedAtlasAndCreateIndex();
