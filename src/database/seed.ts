/**
 * Tongues Trend — Database Seed Script
 *
 * Creates:
 *  - 1 Admin account
 *  - 1 Teacher account (sample)
 *  - 1 Learner account (sample)
 *  - 4 Courses (French, English, German, Kiswahili)
 *
 * Usage:
 *  npm run seed
 *
 * Add to package.json scripts:
 *  "seed": "ts-node src/database/seed.ts"
 *
 * Drop this file into: src/database/seed.ts
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

    for (const courseData of COURSES) {
        const existing = await CourseModel.findOne({ language: courseData.language });

        if (existing) {
            console.log(`   ⏭️   ${courseData.title} already exists — skipping`);
            continue;
        }

        await CourseModel.create({
            ...courseData,
            teacherIds: teacherId ? [teacherId] : [],
        });
        console.log(`   ✅  Created course: ${courseData.title}`);
    }

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