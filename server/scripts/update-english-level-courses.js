import dns from 'dns'
import 'dotenv/config'
import mongoose from 'mongoose'

dns.setServers(['8.8.8.8', '8.8.4.4'])
import connectDB from '../src/database/db.js'
import Course from '../src/models/course.model.js'

// Matches by case-insensitive regex on title so it works regardless of exact naming
const UPDATES = [
  {
    titlePattern: /easy english|spoken english.*beginner|english.*beginner|beginner.*english|basic english/i,
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
    label: 'Easy English for Beginners',
  },
  {
    titlePattern: /elementary english/i,
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
    label: 'Elementary English',
  },
  {
    titlePattern: /intermediate.*english|english.*intermediate/i,
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
    label: 'Intermediate English',
  },
  {
    titlePattern: /advanced english|english.*advanced/i,
    description: 'Our Advanced English course is for people who are proficient users of English — including all the tenses, a wide range of diverse vocabulary, and fluent speaking. This course sharpens critical-thinking so you can use the English language more effectively. Suitable for learners who wish to study at university, do business, or want to be more proficient for any specific reason.',
    learningOutcomes: [
      'Discuss formal topics at length and make professional conversations without errors or hesitation',
      'Give presentations confidently',
      'Understand varieties of English accents effortlessly',
      'Curate a report, write a blog article and effective formal and informal e-mails',
      'Use native-level collocations, phrasal verbs, idioms and expressions',
    ],
    label: 'Advanced English',
  },
]

async function updateEnglishLevelCourses() {
  await connectDB()

  let updated = 0

  for (const update of UPDATES) {
    const result = await Course.updateMany(
      { title: { $regex: update.titlePattern } },
      { $set: { description: update.description, learningOutcomes: update.learningOutcomes } }
    )
    if (result.modifiedCount > 0) {
      console.log(`✓ Updated ${result.modifiedCount} course(s) matching: ${update.label}`)
      updated += result.modifiedCount
    } else {
      console.log(`⚠ No course found matching: ${update.label}`)
    }
  }

  console.log(`\nDone — ${updated} total courses updated.`)
  await mongoose.disconnect()
}

updateEnglishLevelCourses().catch((err) => {
  console.error('Update failed:', err.message)
  process.exit(1)
})
