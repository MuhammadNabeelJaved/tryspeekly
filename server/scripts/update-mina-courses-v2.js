import dns from 'dns'
import 'dotenv/config'
import mongoose from 'mongoose'

dns.setServers(['8.8.8.8', '8.8.4.4'])
import connectDB from '../src/database/db.js'
import User from '../src/models/user.model.js'
import Course from '../src/models/course.model.js'

const TEACHER_EMAIL = 'manokhannn39@gmail.com'

// Only the overview paragraph as description (no What You'll Get / Learning Outcomes)
// learningOutcomes = What You'll Get items (renamed to "What you'll learn" on frontend)
const UPDATES = [
  {
    title: 'IELTS Preparation Mastery',
    description: 'Achieve your target IELTS score with our comprehensive, instructor-led preparation program. Whether you are applying for university admission, immigration, professional registration, or career advancement, this course equips you with the skills, strategies, and confidence needed to succeed in all four IELTS modules.',
    learningOutcomes: [
      'Complete instructor-created study material (No AI-generated content)',
      'Original essay templates and writing frameworks',
      'High-scoring Writing Task 1 & Task 2 strategies',
      'Speaking cue cards with model answers',
      'Predicted and frequently repeated topics',
      'Advanced vocabulary, collocations, idioms, and phrases',
      'Reading and Listening shortcuts and techniques',
      'Mock tests with detailed feedback',
      'Personalized corrections and performance tracking',
      'Exam-day strategies and time-management techniques',
    ],
  },
  {
    title: 'IELTS General Training Success',
    description: 'Prepare confidently for immigration, work permits, residency applications, and employment opportunities with our IELTS General Training program. Learn practical English skills and exam-focused techniques to maximize your score.',
    learningOutcomes: [
      'Complete Human-Written Study Material',
      'Letter Writing Templates',
      'Essay Writing Structures',
      'Predicted Topics & Practice Sets',
      'Vocabulary for Daily and Workplace Communication',
      'Speaking Practice Sessions',
      'Mock Tests & Performance Reports',
      'Personalized Feedback',
      'Meet immigration language requirements',
      'Write effective formal and informal letters',
      'Improve workplace communication skills',
      'Build confidence in speaking English',
      'Increase Reading and Listening performance',
      'Improve overall band score',
    ],
  },
  {
    title: 'PTE Academic Accelerator',
    description: 'Master the AI-scored PTE Academic exam through targeted preparation, proven strategies, and intensive practice. Ideal for university admissions, work visas, and migration pathways.',
    learningOutcomes: [
      'Complete PTE Preparation Material',
      'Templates for All Writing Tasks',
      'Repeat Sentence Strategies',
      'Retell Lecture Frameworks',
      'Reading & Listening Techniques',
      'Frequently Repeated Question Types',
      'Mock Exams & Score Analysis',
      'Personalized Feedback',
      'Improve overall PTE score',
      'Master all question types',
      'Increase speaking fluency and improve pronunciation',
      'Enhance writing accuracy and develop rapid reading skills',
      'Improve listening performance',
      'Achieve study, work, and migration goals',
    ],
  },
  {
    title: 'TOEFL Excellence Program',
    description: 'Build the academic English skills required for international university admissions. Learn proven TOEFL strategies and gain confidence in every section of the test.',
    learningOutcomes: [
      'Complete TOEFL Study Resources',
      'Academic Writing Templates',
      'Integrated Task Strategies',
      'Academic Vocabulary Lists',
      'Note-Taking Techniques',
      'Mock Tests and Personalized Evaluation',
      'Improve TOEFL performance',
      'Strengthen academic reading skills',
      'Develop note-taking abilities',
      'Master integrated writing tasks',
      'Improve lecture comprehension',
      'Expand academic vocabulary',
      'Increase speaking confidence',
      'Prepare for international university admissions',
    ],
  },
  {
    title: 'OET Healthcare English Pro',
    description: 'Designed specifically for healthcare professionals seeking international registration and employment opportunities. Master the language skills required to succeed in the Occupational English Test (OET).',
    learningOutcomes: [
      'Profession-Specific OET Preparation',
      'Medical English Resources',
      'OET Writing Templates',
      'Role-Play Speaking Practice',
      'Healthcare Case Studies',
      'Medical Vocabulary Training',
      'Mock Examinations and Detailed Feedback',
      'Communicate effectively in healthcare environments',
      'Write professional healthcare correspondence',
      'Improve patient communication',
      'Master OET exam requirements',
      'Enhance profession-specific vocabulary',
      'Achieve required OET scores',
      'Prepare for international registration',
    ],
  },
  {
    title: 'LangCert English Achievement Program',
    description: 'Prepare effectively for LangCert examinations with structured lessons, targeted practice, and expert guidance designed to improve overall English proficiency and exam performance.',
    learningOutcomes: [
      'Complete LangCert Preparation Resources',
      'Speaking Practice Sessions',
      'Writing Templates',
      'Grammar Enhancement Lessons',
      'Vocabulary Development Exercises',
      'Mock Assessments and Personalized Feedback',
      'Improve overall English proficiency',
      'Master the LangCert exam format',
      'Strengthen speaking skills',
      'Improve writing accuracy',
      'Expand vocabulary range and enhance grammar usage',
      'Increase reading comprehension',
      'Achieve certification goals confidently',
    ],
  },
  {
    title: 'GCSE English Masterclass',
    description: 'Build the reading, writing, analytical, and critical-thinking skills needed to excel in GCSE English examinations and academic studies.',
    learningOutcomes: [
      'Exam-Focused Notes',
      'Essay Writing Frameworks',
      'Literature Analysis Techniques',
      'Grammar & Punctuation Workshops',
      'Past Paper Practice',
      'Exam Strategies and Personalized Feedback',
      'Improve examination performance',
      'Develop advanced essay-writing skills',
      'Analyze texts effectively',
      'Strengthen reading comprehension',
      'Improve grammar and punctuation',
      'Build critical-thinking abilities',
      'Expand vocabulary',
      'Gain confidence in assessments',
    ],
  },
  {
    title: 'IGCSE English Excellence',
    description: 'A comprehensive course designed to help students excel in IGCSE English Language and Literature through structured learning, intensive practice, and expert guidance.',
    learningOutcomes: [
      'Comprehensive IGCSE Resources',
      'Language & Literature Support',
      'Writing Templates',
      'Text Analysis Strategies',
      'Vocabulary Development',
      'Mock Assessments and Personalized Corrections',
      'Master IGCSE requirements',
      'Improve academic writing',
      'Analyze literary texts confidently',
      'Strengthen comprehension skills',
      'Enhance grammar accuracy',
      'Build advanced vocabulary',
      'Improve presentation of ideas',
      'Achieve higher examination grades',
    ],
  },
]

async function updateMinaCourses() {
  await connectDB()

  const teacher = await User.findOne({ email: TEACHER_EMAIL })
  if (!teacher) {
    console.error(`Teacher not found: ${TEACHER_EMAIL}`)
    await mongoose.disconnect()
    process.exit(1)
  }

  console.log(`Found teacher: ${teacher.name}`)
  let updated = 0

  for (const update of UPDATES) {
    const result = await Course.updateOne(
      { title: update.title, teacher: teacher._id },
      { $set: { description: update.description, learningOutcomes: update.learningOutcomes } }
    )
    if (result.modifiedCount > 0) {
      console.log(`✓ Updated: ${update.title}`)
      updated++
    } else {
      console.log(`⚠ Not found or unchanged: ${update.title}`)
    }
  }

  console.log(`\nDone — ${updated} courses updated.`)
  await mongoose.disconnect()
}

updateMinaCourses().catch((err) => {
  console.error('Update failed:', err.message)
  process.exit(1)
})
