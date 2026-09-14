import { PrismaClient, Role, Semester, StudentStatus, StudentType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database for Student Information Management System...');

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

  // 2. Create Users (5 minimum required)
  console.log('Creating users...');
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
      name: 'Prof. Maria Reyes',
      email: 'prof.reyes@sims.edu',
      password_hash: defaultPassword,
      role: Role.INSTRUCTOR,
    },
    {
      name: 'Juan Dela Cruz (Student)',
      email: 'student.juan@sims.edu',
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
  const instructor1 = createdUsers[2];
  const instructor2 = createdUsers[3];
  const studentUser = createdUsers[4];

  // 3. Create Programs (3 minimum required)
  console.log('Creating programs...');
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

  // 4. Create Courses (20 minimum required)
  console.log('Creating courses...');
  const coursesData = [
    { course_code: 'IT111', course_title: 'Introduction to Computing', units: 3 },
    { course_code: 'IT112', course_title: 'Computer Programming 1', units: 3 },
    { course_code: 'IT121', course_title: 'Computer Programming 2', units: 3 },
    { course_code: 'IT122', course_title: 'Data Structures and Algorithms', units: 3 },
    { course_code: 'IT211', course_title: 'Discrete Mathematics for IT', units: 3 },
    { course_code: 'IT212', course_title: 'Object-Oriented Programming', units: 3 },
    { course_code: 'IT221', course_title: 'Database Management Systems 1', units: 3 },
    { course_code: 'IT222', course_title: 'Networking 1 (Fundamentals)', units: 3 },
    { course_code: 'IT311', course_title: 'Web Systems and Technologies 1', units: 3 },
    { course_code: 'IT312', course_title: 'Web Systems and Technologies 2', units: 3 },
    { course_code: 'IT321', course_title: 'Information Assurance and Security', units: 3 },
    { course_code: 'IT322', course_title: 'Mobile Application Development', units: 3 },
    { course_code: 'IT411', course_title: 'Cloud Computing and DevOps', units: 3 },
    { course_code: 'IT412', course_title: 'Capstone Project 1', units: 3 },
    { course_code: 'IT421', course_title: 'Capstone Project 2', units: 3 },
    { course_code: 'GE101', course_title: 'Understanding the Self', units: 3 },
    { course_code: 'GE102', course_title: 'Purposive Communication', units: 3 },
    { course_code: 'GE103', course_title: 'Mathematics in the Modern World', units: 3 },
    { course_code: 'GE104', course_title: 'Ethics', units: 3 },
    { course_code: 'GE105', course_title: 'The Contemporary World', units: 3 },
  ];

  const createdCourses: any[] = [];
  for (const c of coursesData) {
    const course = await prisma.course.create({ data: c });
    createdCourses.push(course);
  }

  // 5. Create Academic Terms (2 minimum required)
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

  // 6. Create Course Offerings (20 minimum required)
  console.log('Creating course offerings...');
  const sections = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B'];
  const createdOfferings: any[] = [];

  for (let i = 0; i < 20; i++) {
    const course = createdCourses[i % createdCourses.length];
    const term = createdTerms[i % createdTerms.length];
    const instructor = i % 2 === 0 ? instructor1 : instructor2;
    const section = sections[i % sections.length];

    const offering = await prisma.courseOffering.create({
      data: {
        course_id: course.id,
        academic_term_id: term.id,
        instructor_id: instructor.id,
        section,
        schedule: i % 2 === 0 ? 'MW 09:00 - 10:30' : 'TTH 13:00 - 14:30',
        room: `Lab Room ${101 + (i % 5)}`,
        capacity: 45,
      },
    });
    createdOfferings.push(offering);
  }

  // 7. Create Students (100 minimum required: 80 Regular, 20 Irregular)
  console.log('Creating students (100 total: regular & irregular)...');
  const createdStudents: any[] = [];

  // Seed primary demo student linked to student user
  const primaryStudent = await prisma.student.create({
    data: {
      student_number: '2026-00001',
      first_name: 'Juan',
      middle_name: 'Protacio',
      last_name: 'Dela Cruz',
      suffix: 'Jr.',
      birth_date: new Date('2003-06-19'),
      email: 'student.juan@sims.edu',
      contact_number: '+639171234567',
      address: 'Manila, Philippines',
      program_id: createdPrograms[0].id,
      user_id: studentUser.id,
      year_level: 4,
      student_type: StudentType.REGULAR,
      max_allowed_units: 24,
      status: StudentStatus.ACTIVE,
    },
  });
  createdStudents.push(primaryStudent);

  // Seed remaining 99 students
  for (let i = 2; i <= 100; i++) {
    const studentNumber = `2026-${String(i).padStart(5, '0')}`;
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = `student.${studentNumber.toLowerCase().replace('-', '')}@sims.edu`;
    const program = createdPrograms[i % createdPrograms.length];
    const yearLevel = (i % 4) + 1;
    const isIrregular = i > 80; // 20 irregular students
    const maxUnits = isIrregular ? (i % 2 === 0 ? 18 : 27) : 24;

    const student = await prisma.student.create({
      data: {
        student_number: studentNumber,
        first_name: firstName,
        middle_name: faker.person.middleName(),
        last_name: lastName,
        birth_date: faker.date.birthdate({ min: 18, max: 24, mode: 'age' }),
        email,
        contact_number: faker.phone.number({ style: 'international' }),
        address: `${faker.location.streetAddress()}, ${faker.location.city()}`,
        program_id: program.id,
        year_level: yearLevel,
        student_type: isIrregular ? StudentType.IRREGULAR : StudentType.REGULAR,
        max_allowed_units: maxUnits,
        status: StudentStatus.ACTIVE,
      },
    });
    createdStudents.push(student);
  }

  // 8. Create Enrollments (200 minimum required)
  console.log('Creating enrollments (200 total, zero duplicates)...');
  const createdEnrollments: any[] = [];
  const enrolledPairs = new Set<string>();

  // Ensure primary student has 5 enrollments across both terms
  for (let j = 0; j < 5; j++) {
    const offering = createdOfferings[j];
    const key = `${primaryStudent.id}_${offering.id}`;
    enrolledPairs.add(key);

    const enrollment = await prisma.enrollment.create({
      data: {
        student_id: primaryStudent.id,
        course_offering_id: offering.id,
      },
    });
    createdEnrollments.push(enrollment);
  }

  // Distribute enrollments among students
  let studentIdx = 1;
  while (createdEnrollments.length < 200) {
    const student = createdStudents[studentIdx % createdStudents.length];
    const offeringIdx = Math.floor(Math.random() * createdOfferings.length);
    const offering = createdOfferings[offeringIdx];

    const key = `${student.id}_${offering.id}`;
    if (!enrolledPairs.has(key)) {
      enrolledPairs.add(key);
      const enrollment = await prisma.enrollment.create({
        data: {
          student_id: student.id,
          course_offering_id: offering.id,
        },
      });
      createdEnrollments.push(enrollment);
    }
    studentIdx++;
  }

  // 9. Create Grades (100 minimum required)
  console.log('Creating grades (100 total with realistic grade scale)...');
  const gradeScale = [1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 5.0];

  for (let k = 0; k < 100; k++) {
    const enrollment = createdEnrollments[k];
    const finalGrade = gradeScale[k % gradeScale.length];
    const midtermGrade = gradeScale[(k + 1) % gradeScale.length];
    const remarks = finalGrade <= 3.0 ? 'PASSED' : 'FAILED';

    await prisma.grade.create({
      data: {
        enrollment_id: enrollment.id,
        midterm_grade: midtermGrade,
        final_grade: finalGrade,
        remarks,
      },
    });
  }

  // 10. Summary Verification
  const [uCount, pCount, cCount, tCount, oCount, sCount, eCount, gCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.program.count(),
      prisma.course.count(),
      prisma.academicTerm.count(),
      prisma.courseOffering.count(),
      prisma.student.count(),
      prisma.enrollment.count(),
      prisma.grade.count(),
    ]);

  console.log('\n========================================');
  console.log('✅ DATABASE SEEDING COMPLETE');
  console.log('========================================');
  console.log(`Users:            ${uCount} (Minimum required: 5)`);
  console.log(`Programs:         ${pCount} (Minimum required: 3)`);
  console.log(`Courses:          ${cCount} (Minimum required: 20)`);
  console.log(`Academic Terms:   ${tCount} (Minimum required: 2)`);
  console.log(`Course Offerings: ${oCount} (Minimum required: 20)`);
  console.log(`Students:         ${sCount} (Minimum required: 100)`);
  console.log(`Enrollments:      ${eCount} (Minimum required: 200)`);
  console.log(`Grades:           ${gCount} (Minimum required: 100)`);
  console.log('========================================');
  console.log('Demo Test Accounts:');
  console.log('  Admin:       admin@sims.edu / Password123!');
  console.log('  Registrar:   registrar@sims.edu / Password123!');
  console.log('  Instructor:  prof.cruz@sims.edu / Password123!');
  console.log('  Student:     student.juan@sims.edu / Password123!');
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
