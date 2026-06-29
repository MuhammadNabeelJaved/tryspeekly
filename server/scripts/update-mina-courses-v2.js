import dns from 'dns'
import 'dotenv/config'
import mongoose from 'mongoose'

dns.setServers(['8.8.8.8', '8.8.4.4'])
import connectDB from '../src/database/db.js'
import User from '../src/models/user.model.js'
import Course from '../src/models/course.model.js'

const TEACHER_EMAIL = 'manokhannn39@gmail.com'

// description = short overview paragraph shown at top of course details page
// learningOutcomes = "What you'll learn" bullet points (key highlights)
const UPDATES = [
  {
    title: 'IELTS Preparation Mastery',
    description: 'IELTS Mastery is a 1-solution course that not only prepares you for IELTS but also guarantees high bands without typical hard work.',
    learningOutcomes: [
      'Non-AI Materials: Updated IELTS exam law detects AI and fails all AI template answers — this course provides non-AI answers for tension-free prep',
      'High-scoring Writing Task 1 and Task 2 human-curated templates',
      'Speaking cue cards with human-curated templates',
      'Reading and listening fool-proof practical tricks and techniques',
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
    description: 'Ace the AI-scored PTE exam with this course that enables you to learn easy, quick and practical strategies.',
    learningOutcomes: [
      "Non-AI Materials: Don't risk your PTE exam with commercial AI materials — PTE AI examiner detects AI templates",
      'Master all question types',
      'Learn PTE-specific collocations for blanks and MCQs exercises',
      'Learn pronunciation tricks',
      'Human-curated templates for rewrite, retell and picture description',
    ],
  },
  {
    title: 'TOEFL Excellence Program',
    description: 'TOEFL Mastery is a perfect course plan that covers all TOEFL sections with easy and effective strategies for guaranteed success in the exam.',
    learningOutcomes: [
      'Detailed overview of the TOEFL',
      'Clear elaboration of the Test Format and Sections',
      'Guaranteed strategies for Effective Reading',
      'Reading Comprehension Questions easy breakdown',
      'Pro tips for Listening Skills',
      'Tricks to identify Key Information in Audio Passages',
      'How to Deal with Accents and Fast Speech',
      'Learn Speaking Section Structure',
      'Pronunciation guidance',
      'How to curate Clear and Coherent Responses',
      'Best human-curated templates for the Writing Section',
      'Highest overall exam pass rate',
      'Excellent overall student satisfaction',
      'Outstanding responsiveness to student queries',
      'Best value for money in terms of courses offered',
    ],
  },
  {
    title: 'OET Healthcare English Pro',
    description: 'The course is specially designed for an international medical English test, such as the Occupational English Test (OET) for doctors. It covers all the practical strategies that claim guaranteed results.',
    learningOutcomes: [
      'Familiarises you with each of the four skill sections of the OET exam (speaking, listening, reading and writing)',
      'Effective strategies for each part',
      'In-depth feedback on mock writing and speaking tests',
      'Pro OET resources and strategies',
    ],
  },
  {
    title: 'LangCert English Achievement Program',
    description: 'LangCert Mastery is a comprehensive course that uses clever and useful techniques to help you perform well in the LangCert exam.',
    learningOutcomes: [
      'Non-AI Resources: Our course uses natural and exam-safe answers while adhering to updated exam standards, avoiding AI-generated templates',
      'Writing Templates with High Scores: Human-curated writing task structures to assist you in producing succinct and understandable answers',
      'Templates for Speaking Practice: Speaking formats that are ready to use',
      'Strategies for Reading and Listening: Easy-to-follow, useful advice to increase comprehension and response accuracy',
    ],
  },
  {
    title: 'GCSE English Masterclass',
    description: 'GCSE English Mastery is a proactive and result-oriented course that helps you gain thorough understanding of exam patterns and improve English skills with simple and pragmatic methods.',
    learningOutcomes: [
      'Clear Exam Structure Understanding: Full breakdown of GCSE English exam sections',
      'Writing Skill Enhancement: Proper guidance on how to structure essays, letters, and creative writing tasks effectively',
      'Reading & Analysis Skills: Useable techniques to understand texts, extract information, and answer accurately',
      'Language Improvement: Strengthen grammar, sentence structure, and vocabulary building',
      'Human-Curated Practice Material: Perfect and ready-to-use templates and practice questions designed for better performance',
    ],
  },
  {
    title: 'IGCSE English Excellence',
    description: 'IGCSE English Mastery is a well-structured course that uses simple techniques, lucid explanations, and goal-oriented practice to help you master IGCSE English.',
    learningOutcomes: [
      'Overview of the entire exam: Clear explanation of the requirements and format of the IGCSE English exam',
      'Development of Writing Skills: Simple instructions for structured writing assignments, reports, and essays',
      'Techniques for Reading Comprehension: Learn how to handle difficult comprehension tasks',
      'Enhancement of Grammar and Vocabulary: Develop sharp attention on linguistic accuracy using sophisticated vocabulary',
      'Templates without AI: Practice materials and writing formats created by humans for improved outcomes',
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
