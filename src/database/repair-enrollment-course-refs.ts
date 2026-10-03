/**
 * Repairs enrollment rows whose `courseId` was stored as a language slug
 * (e.g. "english") instead of a Course ObjectId. Legacy `enrol()` calls saved the
 * raw string; current code resolves the language to a course first.
 *
 *   npx ts-node src/database/repair-enrollment-course-refs.ts          # dry run
 *   npx ts-node src/database/repair-enrollment-course-refs.ts --apply  # write
 */
import 'dotenv/config';
import mongoose, { Types } from 'mongoose';

const apply = process.argv.includes('--apply');

const isObjectId = (v: unknown) =>
  v instanceof Types.ObjectId || (typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v));

const raw = (v: any) => (v && typeof v === 'object' && '$oid' in v ? v.$oid : v);

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db!;

  const rows = await db.collection('enrollments').find({}).toArray();
  const broken = rows.filter((r) => r.courseId != null && !isObjectId(raw(r.courseId)));

  console.log(`${rows.length} enrollments scanned, ${broken.length} broken\n`);
  if (broken.length === 0) {
    await mongoose.disconnect();
    return;
  }

  for (const row of broken) {
    const slug = String(raw(row.courseId)).toLowerCase();
    const course = await db.collection('courses').findOne({ language: slug });

    if (!course) {
      console.log(`  SKIP  ${row._id}: courseId="${slug}" has no matching course`);
      continue;
    }

    const target = course._id.toString();
    if (!apply) {
      console.log(`  WOULD FIX  ${row._id}: "${slug}" -> ${target} (${course.title})`);
      continue;
    }

    await db
      .collection('enrollments')
      .updateOne({ _id: row._id }, { $set: { courseId: new Types.ObjectId(target) } });
    console.log(`  FIXED  ${row._id}: "${slug}" -> ${target} (${course.title})`);
  }

  if (!apply) console.log('\nDry run only. Re-run with --apply to write changes.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});