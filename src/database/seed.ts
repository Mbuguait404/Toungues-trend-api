/**
 * Tongues Trend — Database Seed Script
 *
 * Creates:
 *  - 1 Admin account
 *  - 1 Teacher account (sample)
 *  - 1 Learner account (sample)
 *  - 4 Courses (French, English, German, Kiswahili)
 *  - Modules for each course (A1, A2 levels)
 *  - Sample materials linked to modules
 *
 * Usage:
 *  npm run seed
 */

/* eslint-disable @typescript-eslint/no-require-imports */
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

// ─── SCHEMAS (plain mongoose, no NestJS DI needed) ──────────────────────────

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['LEARNER', 'TEACHER', 'ADMIN'], default: 'LEARNER' },
        avatarUrl: String,
        country: String,
        phone: String,
        refreshToken: String,
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true },
);

const CourseSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        language: { type: String, enum: ['french', 'english', 'german', 'kiswahili'], required: true },
        description: { type: String, required: true },
        levels: [{ type: String, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] }],
        teacherIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true },
);

// Prevent OverwriteModelError when re-running in watch mode
const UserModel = mongoose.models['User'] || mongoose.model('User', UserSchema);
const CourseModel = mongoose.models['Course'] || mongoose.model('Course', CourseSchema);

const CourseModuleSchema = new mongoose.Schema(
    {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
        title: { type: String, required: true },
        level: { type: String, enum: ['A1','A2','B1','B2','C1','C2'], required: true },
        order: { type: Number, required: true, default: 0 },
        description: String,
        content: String,
        objectives: [{ type: String }],
        estimatedDuration: { type: Number, default: 0 },
        prerequisiteModuleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CourseModule' }],
        coverImageUrl: String,
        notes: String,
        isPublished: { type: Boolean, default: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true },
);

const MaterialSchema = new mongoose.Schema(
    {
        moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseModule', required: false },
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: false },
        title: { type: String, required: true },
        type: { type: String, enum: ['pdf','audio','video','quiz','youtube'] },
        fileUrl: { type: String, required: true },
        fileType: String,
        fileSize: Number,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        viewCount: { type: Number, default: 0 },
    },
    { timestamps: true },
);

const ModuleModel = mongoose.models['CourseModule'] || mongoose.model('CourseModule', CourseModuleSchema);
const MaterialModel = mongoose.models['Material'] || mongoose.model('Material', MaterialSchema);

// ─── SEED DATA ──────────────────────────────────────────────────────────────

interface SeedUser {
    name: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'TEACHER' | 'LEARNER';
    country: string;
    isActive: boolean;
}

const USERS: SeedUser[] = [
    {
        name: 'Tongues Trend Admin',
        email: 'admin@tonguestrend.com',
        password: 'Admin@TT2026!',
        role: 'ADMIN',
        country: 'KE',
        isActive: true,
    },
    {
        name: 'Sarah Müller',
        email: 'teacher@tonguestrend.com',
        password: 'Teacher@TT2026!',
        role: 'TEACHER',
        country: 'DE',
        isActive: true,
    },
    {
        name: 'Amara Kimani',
        email: 'learner@tonguestrend.com',
        password: 'Learner@TT2026!',
        role: 'LEARNER',
        country: 'KE',
        isActive: true,
    },
];

interface SeedCourse {
    title: string;
    language: 'french' | 'english' | 'german' | 'kiswahili';
    description: string;
    levels: Array<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>;
    isActive: boolean;
}

const COURSES: SeedCourse[] = [
    {
        title: 'French Tutoring',
        language: 'french',
        description: 'Dive into our structured French courses tailored to your proficiency level. Learn conversation skills, grammar, and cultural nuances with clear learning outcomes.',
        levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
        isActive: true,
    },
    {
        title: 'English Tutoring',
        language: 'english',
        description: 'Enhance your English with our detailed course structure. From beginner to advanced, achieve fluency with our focused learning outcomes.',
        levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
        isActive: true,
    },
    {
        title: 'German Tutoring',
        language: 'german',
        description: 'Master German through our comprehensive courses designed for all levels. Understand the language structure and achieve your learning goals.',
        levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
        isActive: true,
    },
    {
        title: 'Kiswahili Tutoring',
        language: 'kiswahili',
        description: 'Embark on your Kiswahili learning journey with our structured courses. From basic to advanced levels, reach your desired proficiency with clear outcomes.',
        levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
        isActive: true,
    },
];

interface SeedModule {
    title: string;
    level: string;
    order: number;
    description: string;
    content: string;
    objectives: string[];
    estimatedDuration: number;
    materials?: { title: string; type: string; fileUrl: string }[];
}

const MODULE_TEMPLATES: Record<string, Record<string, SeedModule[]>> = {
    french: {
        A1: [
            {
                title: 'French Alphabet & Pronunciation',
                level: 'A1', order: 1,
                description: 'Master the French alphabet and essential pronunciation rules.',
                content: 'In this module, you will learn the 26 letters of the French alphabet, including accented characters (é, è, ê, ë, à, â, ç, ô, û). You will practice correct pronunciation through audio exercises and discover how French sounds differ from English.',
                objectives: ['Recognize and pronounce all French letters', 'Understand French accent marks', 'Practice basic phonetics'],
                estimatedDuration: 45,
                materials: [{ title: 'French Alphabet Chart', type: 'pdf', fileUrl: 'https://picsum.photos/seed/fr-a1-1/800/600' }],
            },
            {
                title: 'Greetings & Introductions',
                level: 'A1', order: 2,
                description: 'Learn common greetings and how to introduce yourself in French.',
                content: 'From "Bonjour" to "Au revoir," this module covers essential greetings, self-introductions, and polite expressions. You will learn to say your name, ask how someone is doing, and respond appropriately.',
                objectives: ['Greet people formally and informally', 'Introduce yourself and others', 'Ask and answer basic personal questions'],
                estimatedDuration: 60,
                materials: [{ title: 'Greetings Practice Audio', type: 'audio', fileUrl: 'https://picsum.photos/seed/fr-a1-2/800/600' }],
            },
            {
                title: 'Numbers, Days & Months',
                level: 'A1', order: 3,
                description: 'Learn French numbers, days of the week, and months.',
                content: 'This module introduces numbers 0-100, days of the week, months, and how to tell the date in French. You will practice counting, scheduling, and understanding calendars.',
                objectives: ['Count from 0 to 100 in French', 'Name all days of the week', 'Name all months and express dates'],
                estimatedDuration: 50,
                materials: [{ title: 'Numbers Reference Sheet', type: 'pdf', fileUrl: 'https://picsum.photos/seed/fr-a1-3/800/600' }],
            },
            {
                title: 'Articles & Gender',
                level: 'A1', order: 4,
                description: 'Understand French articles (le, la, les) and noun gender.',
                content: 'Every French noun has a gender. This module teaches definite articles (le, la, les), indefinite articles (un, une, des), and tricks to identify masculine and feminine nouns.',
                objectives: ['Use definite articles correctly', 'Use indefinite articles correctly', 'Identify common noun gender patterns'],
                estimatedDuration: 55,
                materials: [{ title: 'Gender Cheat Sheet', type: 'pdf', fileUrl: 'https://picsum.photos/seed/fr-a1-4/800/600' }],
            },
            {
                title: 'Present Tense: Être & Avoir',
                level: 'A1', order: 5,
                description: 'Master the two most important French verbs: être (to be) and avoir (to have).',
                content: 'Être and avoir are the foundation of French grammar. This module covers their full conjugation, common expressions, and usage as auxiliary verbs.',
                objectives: ['Conjugate être in present tense', 'Conjugate avoir in present tense', 'Use être and avoir in common expressions'],
                estimatedDuration: 60,
                materials: [{ title: 'Verb Conjugation Table', type: 'pdf', fileUrl: 'https://picsum.photos/seed/fr-a1-5/800/600' }],
            },
        ],
        A2: [
            {
                title: 'Past Tense: Passé Composé',
                level: 'A2', order: 1,
                description: 'Learn to talk about past events using the passé composé.',
                content: 'The passé composé is the most common French past tense. You will learn its formation with être and avoir, past participle agreements, and when to use it in everyday conversation.',
                objectives: ['Form the passé composé with avoir', 'Form the passé composé with être', 'Apply past participle agreement rules'],
                estimatedDuration: 60,
                materials: [{ title: 'Passé Composé Workbook', type: 'pdf', fileUrl: 'https://picsum.photos/seed/fr-a2-1/800/600' }],
            },
            {
                title: 'Food, Shopping & Restaurants',
                level: 'A2', order: 2,
                description: 'Build vocabulary for ordering food, shopping, and dining out.',
                content: 'Learn essential vocabulary for grocery shopping, ordering at restaurants, and discussing food preferences. Practice real-life scenarios with dialogues and role-plays.',
                objectives: ['Order food in a restaurant', 'Shop for groceries in French', 'Describe food preferences and dietary needs'],
                estimatedDuration: 50,
                materials: [{ title: 'Restaurant Dialogue Video', type: 'video', fileUrl: 'https://picsum.photos/seed/fr-a2-2/800/600' }],
            },
            {
                title: 'Future Tense & Plans',
                level: 'A2', order: 3,
                description: 'Express future plans using futur proche and futur simple.',
                content: 'Learn two ways to talk about the future: the near future (aller + infinitive) for immediate plans and the futur simple for more formal or distant events.',
                objectives: ['Form the futur proche correctly', 'Conjugate regular futur simple verbs', 'Discuss future plans and intentions'],
                estimatedDuration: 55,
                materials: [{ title: 'Future Tense Practice Quiz', type: 'pdf', fileUrl: 'https://picsum.photos/seed/fr-a2-3/800/600' }],
            },
        ],
    },
    english: {
        A1: [
            {
                title: 'The English Alphabet & Sounds',
                level: 'A1', order: 1,
                description: 'Learn the English alphabet and basic phonics.',
                content: 'Start with the 26 letters of the English alphabet, including vowel and consonant sounds. Practice phonetics through listening exercises and tongue twisters.',
                objectives: ['Pronounce all 26 English letters', 'Distinguish short and long vowel sounds', 'Read simple words phonetically'],
                estimatedDuration: 40,
                materials: [{ title: 'Phonics Reference Chart', type: 'pdf', fileUrl: 'https://picsum.photos/seed/en-a1-1/800/600' }],
            },
            {
                title: 'Greetings & Personal Information',
                level: 'A1', order: 2,
                description: 'Master greetings, introductions, and sharing personal details.',
                content: 'Learn formal and informal greetings, how to introduce yourself, and how to ask and answer basic questions about name, age, nationality, and occupation.',
                objectives: ['Use formal and informal greetings', 'Introduce yourself confidently', 'Ask and answer basic personal questions'],
                estimatedDuration: 50,
                materials: [{ title: 'Greetings Audio Practice', type: 'audio', fileUrl: 'https://picsum.photos/seed/en-a1-2/800/600' }],
            },
            {
                title: 'Numbers, Time & Dates',
                level: 'A1', order: 3,
                description: 'Learn English numbers, telling time, and expressing dates.',
                content: 'Master cardinal and ordinal numbers, how to tell time on analog and digital clocks, and how to read and write dates in British and American formats.',
                objectives: ['Count from 0 to 1000', 'Tell time in different formats', 'Read and write dates correctly'],
                estimatedDuration: 45,
                materials: [{ title: 'Time Practice Worksheet', type: 'pdf', fileUrl: 'https://picsum.photos/seed/en-a1-3/800/600' }],
            },
            {
                title: 'Present Simple: To Be',
                level: 'A1', order: 4,
                description: 'Master the verb "to be" in the present simple tense.',
                content: 'The verb "to be" is the most fundamental English verb. Learn its full conjugation, contractions, negatives, and question forms with plenty of practice exercises.',
                objectives: ['Conjugate "to be" in all persons', 'Form negative sentences with "to be"', 'Ask questions using "to be"'],
                estimatedDuration: 50,
                materials: [{ title: 'To Be Conjugation Chart', type: 'pdf', fileUrl: 'https://picsum.photos/seed/en-a1-4/800/600' }],
            },
            {
                title: 'Everyday Objects & Colors',
                level: 'A1', order: 5,
                description: 'Build vocabulary for common objects, colors, and descriptions.',
                content: 'Learn the names of everyday objects around the house, at work, and in town. Practice colors, sizes, and basic adjectives to describe things around you.',
                objectives: ['Name 50+ everyday objects', 'Identify and name colors', 'Use basic adjectives for descriptions'],
                estimatedDuration: 45,
                materials: [{ title: 'Vocabulary Flashcards', type: 'pdf', fileUrl: 'https://picsum.photos/seed/en-a1-5/800/600' }],
            },
        ],
        A2: [
            {
                title: 'Past Simple Tense',
                level: 'A2', order: 1,
                description: 'Learn to talk about completed past events.',
                content: 'Master the past simple tense including regular -ed endings and common irregular verbs. Practice telling stories and describing past experiences.',
                objectives: ['Form regular past simple verbs', 'Memorize 20+ irregular past forms', 'Tell a short story about past events'],
                estimatedDuration: 60,
                materials: [{ title: 'Past Simple Workbook', type: 'pdf', fileUrl: 'https://picsum.photos/seed/en-a2-1/800/600' }],
            },
            {
                title: 'Travel & Directions',
                level: 'A2', order: 2,
                description: 'Learn vocabulary for travel and giving/receiving directions.',
                content: 'Build essential travel vocabulary including transportation, accommodation, and asking for directions. Practice real-world dialogues for airports, hotels, and city navigation.',
                objectives: ['Ask for and give directions', 'Navigate transportation systems', 'Handle hotel and airport conversations'],
                estimatedDuration: 50,
                materials: [{ title: 'Directions Practice Video', type: 'video', fileUrl: 'https://picsum.photos/seed/en-a2-2/800/600' }],
            },
        ],
    },
    german: {
        A1: [
            {
                title: 'German Alphabet & Pronunciation',
                level: 'A1', order: 1,
                description: 'Learn the German alphabet including umlauts and special sounds.',
                content: 'The German alphabet has 30 letters including ä, ö, ü, and ß. This module covers pronunciation of all letters, common letter combinations, and basic phonetics.',
                objectives: ['Pronounce all German letters including umlauts', 'Master the ß (Eszett) sound', 'Read German words with correct pronunciation'],
                estimatedDuration: 45,
                materials: [{ title: 'German Alphabet Chart', type: 'pdf', fileUrl: 'https://picsum.photos/seed/de-a1-1/800/600' }],
            },
            {
                title: 'Greetings & Introductions',
                level: 'A1', order: 2,
                description: 'Learn formal and informal German greetings.',
                content: 'From "Guten Tag" to "Tschüss," learn when to use formal (Sie) vs informal (du) greetings, how to introduce yourself, and basic polite expressions.',
                objectives: ['Distinguish formal and informal address', 'Introduce yourself in German', 'Use common polite expressions'],
                estimatedDuration: 50,
                materials: [{ title: 'Greetings Audio Practice', type: 'audio', fileUrl: 'https://picsum.photos/seed/de-a1-2/800/600' }],
            },
            {
                title: 'Numbers, Days & Time',
                level: 'A1', order: 3,
                description: 'Master German numbers, days, months, and telling time.',
                content: 'Learn numbers 0-100, days of the week, months, and the 24-hour clock system commonly used in German-speaking countries.',
                objectives: ['Count 0-100 in German', 'Name all days and months', 'Tell time in 12h and 24h formats'],
                estimatedDuration: 50,
                materials: [{ title: 'Numbers Reference Sheet', type: 'pdf', fileUrl: 'https://picsum.photos/seed/de-a1-3/800/600' }],
            },
            {
                title: 'Articles & Noun Gender',
                level: 'A1', order: 4,
                description: 'Understand der, die, das and German noun genders.',
                content: 'German has three genders: masculine (der), feminine (die), and neuter (das). Learn the definite and indefinite articles, and discover patterns to help memorize noun genders.',
                objectives: ['Use der, die, das correctly', 'Use ein, eine correctly', 'Identify gender patterns in German nouns'],
                estimatedDuration: 55,
                materials: [{ title: 'Gender Rules Guide', type: 'pdf', fileUrl: 'https://picsum.photos/seed/de-a1-4/800/600' }],
            },
            {
                title: 'Present Tense: Sein & Haben',
                level: 'A1', order: 5,
                description: 'Master the essential verbs sein (to be) and haben (to have).',
                content: 'Sein and haben are the most important German verbs. Learn their full conjugation in present tense and common expressions using both verbs.',
                objectives: ['Conjugate sein in present tense', 'Conjugate haben in present tense', 'Use sein and haben in everyday sentences'],
                estimatedDuration: 60,
                materials: [{ title: 'Verb Conjugation Table', type: 'pdf', fileUrl: 'https://picsum.photos/seed/de-a1-5/800/600' }],
            },
        ],
        A2: [
            {
                title: 'Perfekt Tense',
                level: 'A2', order: 1,
                description: 'Learn the German Perfekt tense for past events.',
                content: 'The Perfekt is the most common spoken past tense in German. Learn how to form it with haben and sein, and memorize common past participles.',
                objectives: ['Form the Perfekt with haben', 'Form the Perfekt with sein', 'Use the Perfekt in conversation'],
                estimatedDuration: 60,
                materials: [{ title: 'Perfekt Workbook', type: 'pdf', fileUrl: 'https://picsum.photos/seed/de-a2-1/800/600' }],
            },
            {
                title: 'Shopping & Ordering',
                level: 'A2', order: 2,
                description: 'Build vocabulary for shopping, restaurants, and transactions.',
                content: 'Learn essential vocabulary for department stores, grocery shopping, ordering in cafes and restaurants, and handling money transactions in German-speaking countries.',
                objectives: ['Shop and ask for items in stores', 'Order food and drinks at restaurants', 'Handle payment and prices'],
                estimatedDuration: 50,
                materials: [{ title: 'Shopping Dialogue Video', type: 'video', fileUrl: 'https://picsum.photos/seed/de-a2-2/800/600' }],
            },
        ],
    },
    kiswahili: {
        A1: [
            {
                title: 'Kiswahili Alphabet & Sounds',
                level: 'A1', order: 1,
                description: 'Learn the Kiswahili alphabet and phonetic system.',
                content: 'Kiswahili uses the Latin alphabet with a highly phonetic spelling system. Learn all consonants and vowels, syllable patterns, and stress rules.',
                objectives: ['Pronounce all Kiswahili letters', 'Understand syllable patterns', 'Read Kiswahili words phonetically'],
                estimatedDuration: 40,
                materials: [{ title: 'Kiswahili Alphabet Chart', type: 'pdf', fileUrl: 'https://picsum.photos/seed/sw-a1-1/800/600' }],
            },
            {
                title: 'Greetings & Respect',
                level: 'A1', order: 2,
                description: 'Master Kiswahili greetings and cultural respect forms.',
                content: 'Greetings are central to Kiswahili culture. Learn "Habari," "Jambo," "Shikamoo" (respect greeting for elders), and the proper response patterns for various times of day and situations.',
                objectives: ['Use time-appropriate greetings', 'Show respect with Shikamoo/Marahaba', 'Engage in extended greeting exchanges'],
                estimatedDuration: 50,
                materials: [{ title: 'Greetings Audio Practice', type: 'audio', fileUrl: 'https://picsum.photos/seed/sw-a1-2/800/600' }],
            },
            {
                title: 'Numbers & Counting',
                level: 'A1', order: 3,
                description: 'Learn Kiswahili numbers and counting systems.',
                content: 'Master numbers 1-100, ordinal numbers, and the noun class system that affects number agreement. Practice counting everyday items and telling time.',
                objectives: ['Count 1-100 in Kiswahili', 'Use ordinal numbers correctly', 'Tell time in Kiswahili'],
                estimatedDuration: 45,
                materials: [{ title: 'Numbers Reference Sheet', type: 'pdf', fileUrl: 'https://picsum.photos/seed/sw-a1-3/800/600' }],
            },
            {
                title: 'Noun Classes (M/Wa & Ki/Vi)',
                level: 'A1', order: 4,
                description: 'Introduction to Kiswahili noun classes.',
                content: 'Kiswahili nouns are organized into classes that affect how verbs, adjectives, and numbers agree. Start with the M/Wa class (people) and Ki/Vi class (things).',
                objectives: ['Identify M/Wa class nouns', 'Identify Ki/Vi class nouns', 'Apply correct subject prefixes for these classes'],
                estimatedDuration: 60,
                materials: [{ title: 'Noun Class Guide', type: 'pdf', fileUrl: 'https://picsum.photos/seed/sw-a1-4/800/600' }],
            },
            {
                title: 'Present Tense & Basic Verbs',
                level: 'A1', order: 5,
                description: 'Learn present tense conjugation with common verbs.',
                content: 'Form present tense sentences with the subject prefix + tense marker (na) + verb root pattern. Practice with common verbs like kula (eat), kunywa (drink), kulala (sleep).',
                objectives: ['Form present tense sentences', 'Conjugate 10+ common verbs', 'Build simple everyday sentences'],
                estimatedDuration: 55,
                materials: [{ title: 'Verb Conjugation Table', type: 'pdf', fileUrl: 'https://picsum.photos/seed/sw-a1-5/800/600' }],
            },
        ],
        A2: [
            {
                title: 'Past & Future Tenses',
                level: 'A2', order: 1,
                description: 'Learn past (li) and future (ta) tense markers.',
                content: 'Expand your tense knowledge with the past tense marker "li" and future tense marker "ta." Practice narrating past events and describing future plans.',
                objectives: ['Form past tense sentences', 'Form future tense sentences', 'Switch between tenses in conversation'],
                estimatedDuration: 60,
                materials: [{ title: 'Tense Practice Workbook', type: 'pdf', fileUrl: 'https://picsum.photos/seed/sw-a2-1/800/600' }],
            },
            {
                title: 'Food, Market & Bargaining',
                level: 'A2', order: 2,
                description: 'Learn vocabulary for food, markets, and price negotiation.',
                content: 'Master vocabulary for buying food at local markets, ordering at restaurants, and bargaining. Practice real market scenarios with authentic dialogues.',
                objectives: ['Buy items at a local market', 'Bargain for prices politely', 'Order food at restaurants'],
                estimatedDuration: 50,
                materials: [{ title: 'Market Dialogue Video', type: 'video', fileUrl: 'https://picsum.photos/seed/sw-a2-2/800/600' }],
            },
        ],
    },
};

// ─── SEED FUNCTION ──────────────────────────────────────────────────────────

async function seed() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌  MONGODB_URI is not set in your .env file');
        process.exit(1);
    }

    console.log('\n🔌  Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅  Connected\n');

    // ── Users ──────────────────────────────────────────────────────────────
    console.log('👤  Seeding users...');
    let teacherId: mongoose.Types.ObjectId | null = null;

    for (const userData of USERS) {
        const existing = await UserModel.findOne({ email: userData.email });

        if (existing) {
            console.log(`   ⏭️   ${userData.email} already exists — skipping`);
            if (userData.role === 'TEACHER') teacherId = existing._id as mongoose.Types.ObjectId;
            continue;
        }

        const hash = await bcrypt.hash(userData.password, 12);
        const created = await UserModel.create({ ...userData, password: hash });
        console.log(`   ✅  Created [${userData.role}] ${userData.email}`);
        if (userData.role === 'TEACHER') teacherId = created._id as mongoose.Types.ObjectId;
    }

    // ── Courses ────────────────────────────────────────────────────────────
    console.log('\n📚  Seeding courses...');

    const createdCourses: Record<string, mongoose.Types.ObjectId> = {};

    for (const courseData of COURSES) {
        let course = await CourseModel.findOne({ language: courseData.language });

        if (course) {
            console.log(`   ⏭️   ${courseData.title} already exists — skipping`);
        } else {
            course = await CourseModel.create({
                ...courseData,
                teacherIds: teacherId ? [teacherId] : [],
            });
            console.log(`   ✅  Created course: ${courseData.title}`);
        }
        createdCourses[courseData.language] = course._id;
    }

    // ── Modules & Materials ────────────────────────────────────────────────
    console.log('\n📦  Seeding modules & materials...');

    for (const [language, levels] of Object.entries(MODULE_TEMPLATES)) {
        const courseId = createdCourses[language];
        if (!courseId) continue;

        for (const [level, modules] of Object.entries(levels)) {
            for (const modData of modules) {
                let existing = await ModuleModel.findOne({ courseId, title: modData.title, level });
                if (existing) {
                    console.log(`   ⏭️   [${language} ${level}] ${modData.title} — skipping`);
                    continue;
                }

                if (!teacherId) break;

                const created = await ModuleModel.create({
                    ...modData,
                    courseId,
                    createdBy: teacherId,
                });
                console.log(`   ✅  [${language} ${level}] ${modData.title}`);

                if (modData.materials) {
                    for (const matData of modData.materials) {
                        await MaterialModel.create({
                            ...matData,
                            courseId,
                            moduleId: created._id,
                            uploadedBy: teacherId,
                        });
                    }
                }
            }
        }
    }

    const totalModules = await ModuleModel.countDocuments();
    const totalMaterials = await MaterialModel.countDocuments();
    console.log(`\n   📊  Total: ${totalModules} modules, ${totalMaterials} materials`);

    // ── Summary ────────────────────────────────────────────────────────────
    console.log('\n═════════════════════════════════════════');
    console.log('🌍  Tongues Trend — Seed Complete!\n');

    console.log('🔑  LOGIN CREDENTIALS\n');

    console.log('  👑  ADMIN');
    console.log('      Email   : admin@tonguestrend.com');
    console.log('      Password: Admin@TT2026!\n');

    console.log('  🎓  TEACHER (sample)');
    console.log('      Email   : teacher@tonguestrend.com');
    console.log('      Password: Teacher@TT2026!\n');

    console.log('  📖  LEARNER (sample)');
    console.log('      Email   : learner@tonguestrend.com');
    console.log('      Password: Learner@TT2026!\n');

    console.log('  📚  COURSES');
    COURSES.forEach(c => console.log(`      ✅  ${c.title} (A1 → C2)`));

    console.log('\n⚠️   IMPORTANT: Change all passwords after first login!');
    console.log('═════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err: Error) => {
    console.error('\n❌  Seed failed:', err.message);
    process.exit(1);
});