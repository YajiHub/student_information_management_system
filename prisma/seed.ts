import { PrismaClient, Role, Semester, StudentStatus, StudentType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding clean demo database for Student Information Management System...');

  // 1. Clean existing records in reverse dependency order
  await prisma.grade.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.courseOffering.deleteMany();
  await prisma.student.deleteMany();
  await prisma.course.deleteMany();
  await prisma.academicTerm.deleteMany();
  await prisma.program.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash('Password123!', 10);

  // 2. Create the 5 Exact Demo Evaluator Users
  console.log('Creating demo users...');
  const usersData = [
    {
      name: 'System Administrator',
      email: 'admin@sims.edu',
      password_hash: defaultPassword,
      role: Role.ADMIN,
    },
    {
      name: 'Registrar Staff',
      email: 'registrar@sims.edu',
      password_hash: defaultPassword,
      role: Role.REGISTRAR,
    },
    {
      name: 'Prof. Juan Cruz',
      email: 'prof.cruz@sims.edu',
      password_hash: defaultPassword,
      role: Role.INSTRUCTOR,
    },
    {
      name: 'Juan Dela Cruz',
      email: 'student1@sims.edu',
      password_hash: defaultPassword,
      role: Role.STUDENT,
    },
    {
      name: 'Maria Santos',
      email: 'student2@sims.edu',
      password_hash: defaultPassword,
      role: Role.STUDENT,
    },
  ];

  const createdUsers: any[] = [];
  for (const u of usersData) {
    const user = await prisma.user.create({ data: u });
    createdUsers.push(user);
  }
  const adminUser = createdUsers[0];
  const registrarUser = createdUsers[1];
  const instructorUser = createdUsers[2];
  const studentUser1 = createdUsers[3];
  const studentUser2 = createdUsers[4];

  // 3. Create Programs
  console.log('Creating degree programs...');
  const programsData = [
    {
      code: 'BSIT',
      name: 'Bachelor of Science in Information Technology',
      description: 'Prepares students for web, cloud, cybersecurity, and enterprise systems engineering.',
    },
    {
      code: 'BSCS',
      name: 'Bachelor of Science in Computer Science',
      description: 'Focuses on algorithms, software architecture, artificial intelligence, and theoretical foundations.',
    },
    {
      code: 'BSIS',
      name: 'Bachelor of Science in Information Systems',
      description: 'Integrates business analytics, enterprise resource planning, and IT governance.',
    },
  ];

  const createdPrograms: any[] = [];
  for (const p of programsData) {
    const program = await prisma.program.create({ data: p });
    createdPrograms.push(program);
  }

  // 4. Create Core Courses (Clean 5 core courses for demo)
  console.log('Creating course catalog (5 core courses)...');
  const coursesData = [
    { course_code: 'IT111', course_title: 'Introduction to Computing', units: 3 },
    { course_code: 'IT112', course_title: 'Computer Programming 1', units: 3 },
    { course_code: 'IT121', course_title: 'Computer Programming 2', units: 3 },
    { course_code: 'IT122', course_title: 'Data Structures and Algorithms', units: 3 },
    { course_code: 'IT211', course_title: 'Discrete Mathematics for IT', units: 3 },
  ];

  const createdCourses: any[] = [];
  for (const c of coursesData) {
    const course = await prisma.course.create({ data: c });
    createdCourses.push(course);
  }

  // 5. Create Academic Terms
  console.log('Creating academic terms...');
  const termsData = [
    {
      academic_year: '2026-2027',
      semester: Semester.FIRST_SEMESTER,
      start_date: new Date('2026-08-15'),
      end_date: new Date('2026-12-20'),
    },
    {
      academic_year: '2026-2027',
      semester: Semester.SECOND_SEMESTER,
      start_date: new Date('2027-01-15'),
      end_date: new Date('2027-05-30'),
    },
  ];

  const createdTerms: any[] = [];
  for (const t of termsData) {
    const term = await prisma.academicTerm.create({ data: t });
    createdTerms.push(term);
  }

  // 6. Create Course Offerings (5 core offerings for demo)
  console.log('Creating course offerings (5 core demo sections)...');
  const sections = ['1A', '1B', '2A', '2B', '3A'];
  const createdOfferings: any[] = [];

  for (let i = 0; i < 5; i++) {
    const course = createdCourses[i];
    const term = createdTerms[0];
    const section = sections[i];

    const offering = await prisma.courseOffering.create({
      data: {
        course_id: course.id,
        academic_term_id: term.id,
        instructor_id: instructorUser.id,
        section,
        schedule: i % 2 === 0 ? 'MW 09:00 - 10:30 AM' : 'TTH 13:00 - 14:30 PM',
        room: `Lab Room ${101 + i}`,
        capacity: 40,
      },
    });
    createdOfferings.push(offering);
  }

  // 7. Create Demo Students (Student 1 & Student 2)
  console.log('Creating demo student records synchronized with user logins...');

  // Student 1: Regular Student (24 max units, BSIT Year 4)
  const student1 = await prisma.student.create({
    data: {
      student_number: '2026-00001',
      first_name: 'Juan',
      middle_name: 'Protacio',
      last_name: 'Dela Cruz',
      birth_date: new Date('2003-06-19'),
      email: 'student1@sims.edu',
      contact_number: '+639171234567',
      address: 'Manila, Philippines',
      program_id: createdPrograms[0].id, // BSIT
      user_id: studentUser1.id,
      year_level: 4,
      student_type: StudentType.REGULAR,
      max_allowed_units: 24,
      status: StudentStatus.ACTIVE,
    },
  });

  // Student 2: Irregular Student (18 max units, BSIT Year 2)
  const student2 = await prisma.student.create({
    data: {
      student_number: '2026-00002',
      first_name: 'Maria',
      middle_name: 'Clara',
      last_name: 'Santos',
      birth_date: new Date('2004-09-12'),
      email: 'student2@sims.edu',
      contact_number: '+639181234567',
      address: 'Quezon City, Philippines',
      program_id: createdPrograms[0].id, // BSIT
      user_id: studentUser2.id,
      year_level: 2,
      student_type: StudentType.IRREGULAR,
      max_allowed_units: 18,
      status: StudentStatus.ACTIVE,
    },
  });

  // 8. Create Enrollments and Grades
  console.log('Creating demo enrollments and grades...');

  // Student 1 (Juan Dela Cruz) Enrollments:
  // Offering 0: IT111 (Term 1) -> Grade 1.25
  const enr1_1 = await prisma.enrollment.create({
    data: { student_id: student1.id, course_offering_id: createdOfferings[0].id },
  });
  await prisma.grade.create({
    data: { enrollment_id: enr1_1.id, midterm_grade: 1.25, final_grade: 1.25, remarks: 'PASSED' },
  });

  // Offering 1: IT112 (Term 1) -> Grade 1.50
  const enr1_2 = await prisma.enrollment.create({
    data: { student_id: student1.id, course_offering_id: createdOfferings[1].id },
  });
  await prisma.grade.create({
    data: { enrollment_id: enr1_2.id, midterm_grade: 1.50, final_grade: 1.50, remarks: 'PASSED' },
  });

  // Offering 2: IT121 (Term 1) -> Active (no final grade yet, Midterm 1.25)
  const enr1_3 = await prisma.enrollment.create({
    data: { student_id: student1.id, course_offering_id: createdOfferings[2].id },
  });
  await prisma.grade.create({
    data: { enrollment_id: enr1_3.id, midterm_grade: 1.25, final_grade: null, remarks: null },
  });

  // Offering 3: IT122 (Term 1) -> Active
  await prisma.enrollment.create({
    data: { student_id: student1.id, course_offering_id: createdOfferings[3].id },
  });

  // Student 2 (Maria Santos - Irregular) Enrollments:
  // Offering 0: IT111 (Term 1) -> Grade 1.75
  const enr2_1 = await prisma.enrollment.create({
    data: { student_id: student2.id, course_offering_id: createdOfferings[0].id },
  });
  await prisma.grade.create({
    data: { enrollment_id: enr2_1.id, midterm_grade: 1.75, final_grade: 1.75, remarks: 'PASSED' },
  });

  // Offering 1: IT112 (Term 1) -> Active (Midterm 2.00)
  const enr2_2 = await prisma.enrollment.create({
    data: { student_id: student2.id, course_offering_id: createdOfferings[1].id },
  });
  await prisma.grade.create({
    data: { enrollment_id: enr2_2.id, midterm_grade: 2.00, final_grade: null, remarks: null },
  });

  // Offering 4: IT211 (Term 1) -> Active
  await prisma.enrollment.create({
    data: { student_id: student2.id, course_offering_id: createdOfferings[4].id },
  });

  console.log('\n========================================');
  console.log('✅ CLEAN DEMO SEEDING COMPLETE');
  console.log('========================================');
  console.log('Demo Test Accounts:');
  console.log('  Admin:               admin@sims.edu     / Password123!');
  console.log('  Registrar:           registrar@sims.edu / Password123!');
  console.log('  Instructor:          prof.cruz@sims.edu / Password123!');
  console.log('  Student (Regular):   student1@sims.edu  / Password123! (#2026-00001, Juan Dela Cruz)');
  console.log('  Student (Irregular): student2@sims.edu  / Password123! (#2026-00002, Maria Santos)');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
