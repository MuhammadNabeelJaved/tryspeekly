import dns from 'dns'
import 'dotenv/config'
import mongoose from 'mongoose'

dns.setServers(['8.8.8.8', '8.8.4.4'])
import connectDB from '../src/database/db.js'
import User from '../src/models/user.model.js'
import Course from '../src/models/course.model.js'

const TEACHER_EMAIL = 'manokhannn39@gmail.com'

const COURSES = [
  {
    title: 'IELTS Preparation Mastery',
    description: 'IELTS Mastery is a 1-solution course that not only prepares you for IELTS but also guarantees high bands without typical hard work.',
    type: 'hybrid',
    level: 'intermediate',
    focus: 'ielts',
    pricingType: 'monthly',
    totalSessions: 12,
    sessionDuration: 60,
    status: 'published',
    maxStudents: 12,
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&w=800&q=80',
    meetLink: 'https://zoom.us/j/speekly-ielts',
    syllabus: [
      { week: 1, title: 'Diagnostic Assessment & Goal Setting', description: 'Evaluate current level and set personalized target band score goals.' },
      { week: 2, title: 'IELTS Listening Strategies', description: 'Master note-taking, prediction, and answer-matching techniques for all four sections.' },
      { week: 3, title: 'IELTS Reading Techniques', description: 'Learn skimming, scanning, and time management strategies for academic reading.' },
      { week: 4, title: 'Academic Vocabulary & Collocations', description: 'Build advanced vocabulary, collocations, idioms, and phrases for all modules.' },
      { week: 5, title: 'Writing Task 1 Mastery', description: 'Structure and write high-scoring Academic Writing Task 1 reports.' },
      { week: 6, title: 'Writing Task 2 Mastery', description: 'Master essay types, argument development, and coherence for Task 2.' },
      { week: 7, title: 'Speaking Part 1', description: 'Fluency, grammar, and vocabulary practice for the introduction section.' },
      { week: 8, title: 'Speaking Part 2', description: 'Cue card strategies with model answers and delivery techniques.' },
      { week: 9, title: 'Speaking Part 3', description: 'Develop abstract discussion skills and extended responses.' },
      { week: 10, title: 'Mock Test Practice', description: 'Full timed mock test simulating real exam conditions.' },
      { week: 11, title: 'Error Analysis & Personalized Feedback', description: 'Detailed review of mock test results with targeted improvement strategies.' },
      { week: 12, title: 'Final Assessment & Improvement Plan', description: 'Final mock exam and personalized road map to target score.' },
    ],
  },
  {
    title: 'IELTS General Training Success',
    description: `Prepare confidently for immigration, work permits, residency applications, and employment opportunities with our IELTS General Training program. Learn practical English skills and exam-focused techniques to maximize your score.

What You'll Get:
• Complete Human-Written Study Material
• Letter Writing Templates
• Essay Writing Structures
• Predicted Topics & Practice Sets
• Vocabulary for Daily and Workplace Communication
• Speaking Practice Sessions
• Mock Tests & Performance Reports
• Personalized Feedback

Learning Outcomes:
• Meet immigration language requirements
• Write effective formal and informal letters
• Improve workplace communication skills
• Build confidence in speaking English
• Increase Reading and Listening performance
• Improve overall band score`,
    type: 'hybrid',
    level: 'beginner',
    focus: 'ielts',
    pricingType: 'monthly',
    totalSessions: 12,
    sessionDuration: 60,
    status: 'published',
    maxStudents: 12,
    thumbnail: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&w=800&q=80',
    meetLink: 'https://zoom.us/j/speekly-ielts-gt',
    syllabus: [
      { week: 1, title: 'Orientation & Diagnostic Test', description: 'Understand the General Training format and assess starting level.' },
      { week: 2, title: 'Listening Skills — Sections 1 & 2', description: 'Practice social and community-based listening tasks.' },
      { week: 3, title: 'Listening Skills — Sections 3 & 4', description: 'Work on academic and monologue listening tasks.' },
      { week: 4, title: 'Reading — Section 1 & 2', description: 'Master everyday and workplace reading passages.' },
      { week: 5, title: 'Reading — Section 3', description: 'Tackle complex general interest texts with speed and accuracy.' },
      { week: 6, title: 'Writing Task 1 — Informal & Formal Letters', description: 'Write high-scoring letters with correct tone and structure.' },
      { week: 7, title: 'Writing Task 2 — Essay Types', description: 'Develop opinion, discussion, and problem-solution essays.' },
      { week: 8, title: 'Speaking Part 1 & 2', description: 'Build fluency with personal topics and cue card practice.' },
      { week: 9, title: 'Speaking Part 3 & Advanced Vocabulary', description: 'Improve abstract discussion and vocabulary range.' },
      { week: 10, title: 'Full Mock Exam', description: 'Timed practice test for all four modules.' },
      { week: 11, title: 'Feedback & Error Correction', description: 'Personalized analysis and targeted practice.' },
      { week: 12, title: 'Final Revision & Exam Strategy', description: 'Consolidate skills and plan your exam-day approach.' },
    ],
  },
  {
    title: 'PTE Academic Accelerator',
    description: 'Ace the AI-scored PTE exam with this course that enables you to learn easy, quick and practical strategies.',
    type: 'hybrid',
    level: 'intermediate',
    focus: 'general',
    pricingType: 'monthly',
    totalSessions: 12,
    sessionDuration: 60,
    status: 'published',
    maxStudents: 12,
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&w=800&q=80',
    meetLink: 'https://zoom.us/j/speekly-pte',
    syllabus: [
      { week: 1, title: 'PTE Format & Diagnostic Assessment', description: 'Understand the AI scoring system and benchmark your current level.' },
      { week: 2, title: 'Speaking — Read Aloud & Repeat Sentence', description: 'Pronunciation, fluency, and memory strategies.' },
      { week: 3, title: 'Speaking — Describe Image & Retell Lecture', description: 'Templates and frameworks for structured responses.' },
      { week: 4, title: 'Speaking — Short Answer Questions', description: 'Quick response accuracy and vocabulary.' },
      { week: 5, title: 'Writing — Summarize Written Text', description: 'One-sentence summary technique for complex passages.' },
      { week: 6, title: 'Writing — Essay', description: 'Argumentative essay structure and time management.' },
      { week: 7, title: 'Reading — All Question Types', description: 'Multiple choice, re-order, fill in the blanks strategies.' },
      { week: 8, title: 'Listening — Summarize Spoken Text', description: 'Note-taking and summary writing from audio.' },
      { week: 9, title: 'Listening — All Question Types', description: 'Fill blanks, highlight answer, select missing word.' },
      { week: 10, title: 'Full PTE Mock Exam', description: 'Complete timed PTE practice test.' },
      { week: 11, title: 'Score Analysis & Targeted Practice', description: 'Review AI-style scoring and fix weaknesses.' },
      { week: 12, title: 'Final Revision & Test Strategy', description: 'Consolidate all skills and plan exam day.' },
    ],
  },
  {
    title: 'TOEFL Excellence Program',
    description: 'TOEFL Mastery is a perfect course plan that covers all TOEFL sections with easy and effective strategies for guaranteed success in the exam.',
    type: 'hybrid',
    level: 'intermediate',
    focus: 'general',
    pricingType: 'monthly',
    totalSessions: 12,
    sessionDuration: 60,
    status: 'published',
    maxStudents: 12,
    thumbnail: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&w=800&q=80',
    meetLink: 'https://zoom.us/j/speekly-toefl',
    syllabus: [
      { week: 1, title: 'TOEFL Format & Diagnostic', description: 'Overview of iBT structure and baseline assessment.' },
      { week: 2, title: 'Reading — Academic Passages', description: 'Inference, vocabulary, and prose summary strategies.' },
      { week: 3, title: 'Reading — Complex Question Types', description: 'Table completion, category charts, factual information.' },
      { week: 4, title: 'Listening — Lectures', description: 'Note-taking strategies for academic lectures.' },
      { week: 5, title: 'Listening — Conversations', description: 'Campus conversations and understanding attitude.' },
      { week: 6, title: 'Speaking — Independent Tasks', description: 'Opinion and preference responses with strong structure.' },
      { week: 7, title: 'Speaking — Integrated Tasks', description: 'Campus reading + conversation and lecture-based tasks.' },
      { week: 8, title: 'Writing — Integrated Task', description: 'Synthesize reading and lecture content accurately.' },
      { week: 9, title: 'Writing — Academic Discussion', description: 'Build arguments and extend responses in discussions.' },
      { week: 10, title: 'Academic Vocabulary & Note-Taking', description: 'Domain-specific vocabulary and efficient note methods.' },
      { week: 11, title: 'Full Mock Test', description: 'Complete TOEFL iBT simulation with timing.' },
      { week: 12, title: 'Error Review & Final Strategy', description: 'Personalized corrections and exam-day plan.' },
    ],
  },
  {
    title: 'OET Healthcare English Pro',
    description: 'The course is specially designed for an international medical English test, such as the Occupational English Test (OET) for doctors. It covers all the practical strategies that claim guaranteed results.',
    type: 'hybrid',
    level: 'advanced',
    focus: 'general',
    pricingType: 'monthly',
    totalSessions: 12,
    sessionDuration: 60,
    status: 'published',
    maxStudents: 12,
    thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&w=800&q=80',
    meetLink: 'https://zoom.us/j/speekly-oet',
    syllabus: [
      { week: 1, title: 'OET Structure & Healthcare Orientation', description: 'Understand OET sub-test format and medical communication norms.' },
      { week: 2, title: 'Listening — Healthcare Consultation', description: 'Note-taking from patient consultations and lectures.' },
      { week: 3, title: 'Listening — Presentations & Interviews', description: 'Comprehension of medical presentations and interviews.' },
      { week: 4, title: 'Reading — Healthcare Texts', description: 'Speed reading and comprehension of clinical texts.' },
      { week: 5, title: 'Reading — Complex Case Materials', description: 'Detailed reading of patient case notes and guidelines.' },
      { week: 6, title: 'Writing — Referral Letters', description: 'Write accurate, professional referral letters using templates.' },
      { week: 7, title: 'Writing — Discharge & Transfer Letters', description: 'Structure discharge summaries and inter-ward transfers.' },
      { week: 8, title: 'Speaking — Role-Play Introduction', description: 'Simulate patient communication scenarios with confidence.' },
      { week: 9, title: 'Speaking — Complex Role-Plays', description: 'Manage difficult patient interactions, explanations, and advice.' },
      { week: 10, title: 'Medical Vocabulary & Case Studies', description: 'Domain vocabulary practice with real healthcare cases.' },
      { week: 11, title: 'Full Mock OET Exam', description: 'Timed practice across all four sub-tests.' },
      { week: 12, title: 'Feedback & Registration Preparation', description: 'Targeted corrections and career pathway advice.' },
    ],
  },
  {
    title: 'LangCert English Achievement Program',
    description: 'LangCert Mastery is a comprehensive course that uses clever and useful techniques to help you perform well in the LangCert exam.',
    type: 'hybrid',
    level: 'intermediate',
    focus: 'general',
    pricingType: 'monthly',
    totalSessions: 12,
    sessionDuration: 60,
    status: 'published',
    maxStudents: 12,
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&w=800&q=80',
    meetLink: 'https://zoom.us/j/speekly-langcert',
    syllabus: [
      { week: 1, title: 'LangCert Format & Level Assessment', description: 'Understand exam levels and identify your current proficiency.' },
      { week: 2, title: 'Listening Comprehension', description: 'Practice understanding natural spoken English in varied contexts.' },
      { week: 3, title: 'Reading Skills', description: 'Develop reading fluency and comprehension strategies.' },
      { week: 4, title: 'Grammar Foundations', description: 'Review and strengthen core grammar structures.' },
      { week: 5, title: 'Vocabulary Building', description: 'Expand topic-based vocabulary and word formation skills.' },
      { week: 6, title: 'Writing — Short Texts', description: 'Produce clear, accurate short written texts and messages.' },
      { week: 7, title: 'Writing — Extended Tasks', description: 'Develop essays and structured written responses.' },
      { week: 8, title: 'Speaking — Individual Response', description: 'Fluent and accurate responses to prompts and questions.' },
      { week: 9, title: 'Speaking — Interaction', description: 'Conversational exchange and discussion practice.' },
      { week: 10, title: 'Mock Assessment', description: 'Full exam simulation under timed conditions.' },
      { week: 11, title: 'Targeted Practice & Feedback', description: 'Focus on individual weak areas with personalized exercises.' },
      { week: 12, title: 'Final Revision & Certification Prep', description: 'Review all skills and finalize exam-day strategy.' },
    ],
  },
  {
    title: 'GCSE English Masterclass',
    description: 'GCSE English Mastery is a proactive and result-oriented course that helps you gain thorough understanding of exam patterns and improve English skills with simple and pragmatic methods.',
    type: 'hybrid',
    level: 'beginner',
    focus: 'grammar',
    pricingType: 'monthly',
    totalSessions: 12,
    sessionDuration: 60,
    status: 'published',
    maxStudents: 12,
    thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&w=800&q=80',
    meetLink: 'https://zoom.us/j/speekly-gcse',
    syllabus: [
      { week: 1, title: 'GCSE Overview & Diagnostic Test', description: 'Understand exam structure (Language & Literature) and identify gaps.' },
      { week: 2, title: 'Reading — Comprehension Skills', description: 'Inference, language analysis, and structural commentary.' },
      { week: 3, title: 'Reading — Comparison & Evaluation', description: 'Compare texts and evaluate writer perspectives.' },
      { week: 4, title: 'Grammar & Punctuation', description: 'Sentence structures, punctuation rules, and common errors.' },
      { week: 5, title: 'Creative Writing', description: 'Descriptive and narrative writing with high-impact techniques.' },
      { week: 6, title: 'Transactional Writing', description: 'Letters, speeches, articles, and reports for exam tasks.' },
      { week: 7, title: 'Literature — Poetry Analysis', description: 'Analyze themes, language, and structure in poems.' },
      { week: 8, title: 'Literature — Prose & Drama', description: 'Character, theme, and context in fiction and plays.' },
      { week: 9, title: 'Literature — Essay Writing', description: 'PEE/PEEL structure for high-band literature essays.' },
      { week: 10, title: 'Past Paper Practice', description: 'Timed past paper practice for both Language and Literature.' },
      { week: 11, title: 'Mark Scheme Review & Feedback', description: 'Self-assessment against mark schemes and teacher corrections.' },
      { week: 12, title: 'Final Exam Strategy', description: 'Revision techniques, time planning, and exam-day confidence.' },
    ],
  },
  {
    title: 'IGCSE English Excellence',
    description: 'IGCSE English Mastery is a well-structured course that uses simple techniques, lucid explanations, and goal-oriented practice to help you master IGCSE English.',
    type: 'hybrid',
    level: 'intermediate',
    focus: 'grammar',
    pricingType: 'monthly',
    totalSessions: 12,
    sessionDuration: 60,
    status: 'published',
    maxStudents: 12,
    thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&w=800&q=80',
    meetLink: 'https://zoom.us/j/speekly-igcse',
    syllabus: [
      { week: 1, title: 'IGCSE Format & Initial Assessment', description: 'Understand Cambridge IGCSE structure and target grades.' },
      { week: 2, title: 'Reading Comprehension — Section A', description: 'Directed writing, matching, note-making and summary.' },
      { week: 3, title: 'Reading Comprehension — Section B', description: 'Longer comprehension with structured question types.' },
      { week: 4, title: 'Writing — Directed Writing Tasks', description: 'Letters, interviews, and articles for transactional tasks.' },
      { week: 5, title: 'Writing — Continuous Writing', description: 'Narrative, descriptive, and argumentative compositions.' },
      { week: 6, title: 'Vocabulary & Language Techniques', description: 'Figurative language, tone, and writer effect analysis.' },
      { week: 7, title: 'Grammar & Sentence Structures', description: 'Accuracy, variety, and complexity in writing.' },
      { week: 8, title: 'Literature — Poetry', description: 'Analyze unseen and set poems for language and theme.' },
      { week: 9, title: 'Literature — Prose & Drama', description: 'Character, theme, and writer intention in set texts.' },
      { week: 10, title: 'Literature Essay Writing', description: 'Structure and develop high-scoring literature essays.' },
      { week: 11, title: 'Full Mock Paper', description: 'Timed examination under real IGCSE conditions.' },
      { week: 12, title: 'Feedback, Revision & Exam Confidence', description: 'Targeted corrections and final grade-improvement strategies.' },
    ],
  },
]

async function seedMinaCourses() {
  await connectDB()

  const teacher = await User.findOne({ email: TEACHER_EMAIL })
  if (!teacher) {
    console.error(`Teacher not found: ${TEACHER_EMAIL}`)
    await mongoose.disconnect()
    process.exit(1)
  }

  console.log(`Found teacher: ${teacher.name} (${teacher._id})`)

  let created = 0
  let skipped = 0

  for (const courseData of COURSES) {
    const existing = await Course.findOne({ title: courseData.title, teacher: teacher._id })
    if (existing) {
      console.log(`⏭  Skipped (already exists): ${courseData.title}`)
      skipped++
      continue
    }

    const { syllabus, ...rest } = courseData
    const course = new Course({ ...rest, teacher: teacher._id })

    if (syllabus?.length) {
      for (const topic of syllabus) {
        course.syllabus.push(topic)
      }
    }

    await course.save()
    console.log(`✓ Created: ${courseData.title}`)
    created++
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped.`)
  await mongoose.disconnect()
}

seedMinaCourses().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
