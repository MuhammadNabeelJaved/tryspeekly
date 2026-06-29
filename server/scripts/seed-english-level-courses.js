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
    title: 'Easy English for Beginners',
    description: 'This English course is a must-have for basic students who want to achieve an intermediate level of English in a quick and hassle-free way. It is perfect for you if you are learning English for the first time.',
    learningOutcomes: [
      'Self intro and greetings',
      'Answering questions',
      'Question construction',
      'Useful vocabulary on topics such as foods, clothes and weather',
      'Useful grammar, including the present and past simple, prepositions, possessive adjectives',
      'Exercises for listening power building',
      'English for different situations',
      'Daily dialogues',
      'Basic punctuation',
      'Spellings of common words',
    ],
    type: 'hybrid',
    level: 'beginner',
    focus: 'speaking',
    pricingType: 'monthly',
    totalSessions: 12,
    sessionDuration: 60,
    status: 'published',
    maxStudents: 15,
    thumbnail: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&w=800&q=80',
    meetLink: 'https://zoom.us/j/speekly-easy-english',
    syllabus: [
      { week: 1, title: 'Self Introduction & Greetings', description: 'Learn to introduce yourself, greet others, and use basic everyday expressions.' },
      { week: 2, title: 'Answering Common Questions', description: 'Practice answering simple questions about yourself, your family, and your daily routine.' },
      { week: 3, title: 'Question Construction', description: 'Learn how to form questions using who, what, where, when, why, and how.' },
      { week: 4, title: 'Everyday Vocabulary — Food & Clothes', description: 'Build practical vocabulary around food, clothing, and shopping situations.' },
      { week: 5, title: 'Everyday Vocabulary — Weather & Places', description: 'Learn to talk about weather conditions and describe places around you.' },
      { week: 6, title: 'Basic Grammar — Present Simple', description: 'Understand and practise the present simple tense for daily routines and facts.' },
      { week: 7, title: 'Basic Grammar — Past Simple & Prepositions', description: 'Describe past events and use common prepositions accurately.' },
      { week: 8, title: 'Listening Skills Power Building', description: 'Develop listening comprehension through audio exercises and guided listening tasks.' },
      { week: 9, title: 'English for Different Situations', description: 'Practice English for real-life settings such as shops, travel, and social gatherings.' },
      { week: 10, title: 'Daily Dialogues', description: 'Role-play common daily conversations to build confidence and natural fluency.' },
      { week: 11, title: 'Basic Punctuation & Spelling', description: 'Learn essential punctuation rules and correct spelling of common words.' },
      { week: 12, title: 'Review & Confidence Building', description: 'Consolidate all topics through fun activities, mini-tests, and spoken practice.' },
    ],
  },
  {
    title: 'Elementary English',
    description: 'Elementary English course is perfect for you if you have a basic knowledge of English. If you have basic vocabulary and can make small sentences, this course will give you more structure and practice for error-free sentences with better fluency.',
    learningOutcomes: [
      'How to place an order, make a complaint or inquiry in English',
      'How to make requests, ask for permission and ask for action',
      'Learn how to ask for directions',
      'Learn to describe people',
      'How to understand important information',
      'How to understand feelings and emotions',
      'Extensive vocabulary (sports, education, music, the family, holidays and trips)',
      'Grammar including adverbs of frequency, quantifiers, comparative adjectives — no tough grammar books required',
      'How to fill a form',
      'Writing an email',
    ],
    type: 'hybrid',
    level: 'beginner',
    focus: 'general',
    pricingType: 'monthly',
    totalSessions: 12,
    sessionDuration: 60,
    status: 'published',
    maxStudents: 15,
    thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&w=800&q=80',
    meetLink: 'https://zoom.us/j/speekly-elementary',
    syllabus: [
      { week: 1, title: 'Placing Orders & Making Inquiries', description: 'Learn how to order food, ask about products, and make inquiries in English.' },
      { week: 2, title: 'Requests, Permission & Asking for Action', description: 'Use polite language to make requests and ask for permission correctly.' },
      { week: 3, title: 'Asking for & Giving Directions', description: 'Learn vocabulary and phrases to navigate and help others find their way.' },
      { week: 4, title: 'Describing People', description: 'Build vocabulary to describe appearance, personality, and characteristics.' },
      { week: 5, title: 'Understanding Important Information', description: 'Develop comprehension skills for notices, signs, instructions, and announcements.' },
      { week: 6, title: 'Feelings & Emotions', description: 'Express and understand feelings and emotional states in everyday conversations.' },
      { week: 7, title: 'Vocabulary — Sports, Music & Education', description: 'Expand topic vocabulary across popular everyday subjects.' },
      { week: 8, title: 'Vocabulary — Family, Holidays & Trips', description: 'Talk about family, travel plans, and past holiday experiences.' },
      { week: 9, title: 'Grammar — Adverbs, Quantifiers & Comparatives', description: 'Learn practical grammar in context without complicated rules.' },
      { week: 10, title: 'Filling in Forms', description: 'Practise completing forms for common situations such as registration and applications.' },
      { week: 11, title: 'Writing an Email', description: 'Write clear and correct basic emails for everyday purposes.' },
      { week: 12, title: 'Review & Fluency Practice', description: 'Consolidate all skills through conversation practice and written exercises.' },
    ],
  },
  {
    title: 'Intermediate English',
    description: 'Our Intermediate level course focuses on helping you keep conversations on a wide range of familiar topics without any hesitation. Your listening skills will be polished and you will feel confident with grammatical structures. This level will make you comfortable with English.',
    learningOutcomes: [
      'How to give suggestions, offers and polite requests, express opinions, agree and disagree with decent manners and proper vocabulary',
      "How to differentiate between confusing topics like 'must' and 'have to'",
      'Ask more difficult and complex questions',
      'Talk about the future and make plans',
      'Listen and understand specific information in different contexts — podcasts, TV, lectures or conversations',
      'Use formal and informal English in appropriate settings, including over the phone',
      'Vocabulary on topics such as leisure, studies, work and life',
      'Polish reading skills and understand unfamiliar words then use them in your own sentences',
    ],
    type: 'hybrid',
    level: 'intermediate',
    focus: 'general',
    pricingType: 'monthly',
    totalSessions: 12,
    sessionDuration: 60,
    status: 'published',
    maxStudents: 15,
    thumbnail: 'https://images.unsplash.com/photo-1543165796-5426273eaab3?auto=format&w=800&q=80',
    meetLink: 'https://zoom.us/j/speekly-intermediate',
    syllabus: [
      { week: 1, title: 'Expressing Opinions & Polite Disagreement', description: 'Share your views, agree and disagree confidently using appropriate vocabulary.' },
      { week: 2, title: 'Suggestions, Offers & Polite Requests', description: 'Make natural suggestions and offers in both formal and informal contexts.' },
      { week: 3, title: 'Modal Verbs — Must, Have to, Should', description: "Master the difference between 'must', 'have to', 'should' and similar confusing modals." },
      { week: 4, title: 'Complex Questions', description: 'Form indirect, embedded, and tag questions for more sophisticated conversation.' },
      { week: 5, title: 'Talking About the Future & Making Plans', description: 'Use will, going to, and present continuous to discuss future intentions and arrangements.' },
      { week: 6, title: 'Listening — Podcasts, Lectures & TV', description: 'Develop listening strategies for different contexts and speaker styles.' },
      { week: 7, title: 'Formal & Informal English', description: 'Switch between formal and informal registers in writing and speaking, including phone calls.' },
      { week: 8, title: 'Vocabulary — Leisure & Lifestyle', description: 'Build rich vocabulary around hobbies, sports, and daily life topics.' },
      { week: 9, title: 'Vocabulary — Work & Studies', description: 'Expand professional and academic vocabulary for workplace and study environments.' },
      { week: 10, title: 'Reading Skills — Unfamiliar Words in Context', description: 'Use context clues to understand new vocabulary and apply it in your own sentences.' },
      { week: 11, title: 'Grammar Consolidation', description: 'Review and practise key intermediate grammar structures for accuracy and confidence.' },
      { week: 12, title: 'Mock Conversations & Review', description: 'Apply all skills in real conversation scenarios and receive targeted feedback.' },
    ],
  },
  {
    title: 'Advanced English',
    description: 'Our Advanced English course is for people who are proficient users of English — including all the tenses, a wide range of diverse vocabulary, and fluent speaking. This course sharpens critical-thinking so you can use the English language more effectively. Suitable for learners who wish to study at university, do business, or want to be more proficient for any specific reason.',
    learningOutcomes: [
      'Discuss formal topics at length and make professional conversations without errors or hesitation',
      'Give presentations confidently',
      'Understand varieties of English accents effortlessly',
      'Curate a report, write a blog article and effective formal and informal e-mails',
      'Use native-level collocations, phrasal verbs, idioms and expressions',
    ],
    type: 'hybrid',
    level: 'advanced',
    focus: 'general',
    pricingType: 'monthly',
    totalSessions: 12,
    sessionDuration: 60,
    status: 'published',
    maxStudents: 15,
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&w=800&q=80',
    meetLink: 'https://zoom.us/j/speekly-advanced',
    syllabus: [
      { week: 1, title: 'Advanced Formal Discussion', description: 'Discuss complex and abstract topics at length with accuracy and depth.' },
      { week: 2, title: 'Professional Conversations Without Hesitation', description: 'Handle business meetings, negotiations, and professional exchanges fluently.' },
      { week: 3, title: 'Confident Presentations', description: 'Structure and deliver compelling presentations with advanced signposting language.' },
      { week: 4, title: 'Understanding Different English Accents', description: 'Train your ear to understand British, American, Australian, and other English accents.' },
      { week: 5, title: 'Native-Level Collocations', description: 'Master high-frequency word combinations used by native speakers across different contexts.' },
      { week: 6, title: 'Phrasal Verbs in Context', description: 'Learn and actively use the most important phrasal verbs in natural conversation and writing.' },
      { week: 7, title: 'Idioms & Expressions', description: 'Understand and use common idiomatic expressions to sound more natural and fluent.' },
      { week: 8, title: 'Report Writing', description: 'Write structured, formal reports with clear analysis, recommendations, and professional tone.' },
      { week: 9, title: 'Blog Articles & Opinion Pieces', description: 'Write engaging blog articles with strong introductions, arguments, and conclusions.' },
      { week: 10, title: 'Formal & Informal Emails at Native Level', description: 'Write polished emails for all professional and personal contexts.' },
      { week: 11, title: 'Critical Thinking Through English', description: 'Analyse texts, form arguments, and express nuanced ideas with precision.' },
      { week: 12, title: 'Final Assessment & Fluency Refinement', description: 'Full-round review with feedback, advanced conversation practice, and next steps.' },
    ],
  },
]

async function seedEnglishLevelCourses() {
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

    const { syllabus, learningOutcomes, ...rest } = courseData
    const course = new Course({ ...rest, teacher: teacher._id, learningOutcomes })

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

seedEnglishLevelCourses().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
