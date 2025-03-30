
import { Course, Classroom } from '../types/timetable';

export const sampleCourses: Course[] = [
  {
    courseName: "Linear Algebra",
    faculty: "Dr. Sibasankar Padhy",
    credits: "3-1-0-0-2",
    semester: 2,
    lectureHours: 3,
    tutorialHours: 1,
    practicalHours: 0,
    seminarHours: 0,
    totalCredits: 2,
    elective: "0"
  },
  {
    courseName: "Data Structures & Algorithms",
    faculty: "Dr. C. B. Akki",
    credits: "3-0-2-0-4",
    semester: 2,
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 2,
    seminarHours: 0,
    totalCredits: 4,
    elective: "0"
  },
  {
    courseName: "Data Science with Python",
    faculty: "Dr. Abdul Wahid",
    credits: "3-1-0-0-2",
    semester: 2,
    lectureHours: 3,
    tutorialHours: 1,
    practicalHours: 0,
    seminarHours: 0,
    totalCredits: 2,
    elective: "B4"
  },
  {
    courseName: "Theory of Computation",
    faculty: "Dr. Pavan",
    credits: "3-1-0-0-4",
    semester: 4,
    lectureHours: 3,
    tutorialHours: 1,
    practicalHours: 0,
    seminarHours: 0,
    totalCredits: 4,
    elective: "0"
  },
  {
    courseName: "Machine Learning",
    faculty: "Dr. Girish G N",
    credits: "3-0-2-0-4",
    semester: 6,
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 2,
    seminarHours: 0,
    totalCredits: 4,
    elective: "0"
  },
  {
    courseName: "Deep Computer Vision",
    faculty: "Dr. Chinmayanand",
    credits: "3-1-0-0-4",
    semester: 6,
    lectureHours: 3,
    tutorialHours: 1,
    practicalHours: 0,
    seminarHours: 0,
    totalCredits: 4,
    elective: "B1"
  }
];

export const sampleClassrooms: Classroom[] = [
  {
    roomNumber: "A101",
    capacity: 60,
    type: "Lecture"
  },
  {
    roomNumber: "A102",
    capacity: 40,
    type: "Tutorial"
  },
  {
    roomNumber: "L1",
    capacity: 30,
    type: "Lab"
  },
  {
    roomNumber: "L2",
    capacity: 30,
    type: "Lab"
  },
  {
    roomNumber: "SR1",
    capacity: 40,
    type: "All"
  }
];

export const generateSampleCSV = () => {
  let coursesCSV = "Course Name,Faculty,Credits,Semester,L,T,P,C,Elective\n";
  for (const course of sampleCourses) {
    coursesCSV += `${course.courseName},${course.faculty},${course.credits},${course.semester},${course.lectureHours},${course.tutorialHours},${course.practicalHours},${course.totalCredits},${course.elective}\n`;
  }
  
  let classroomsCSV = "Room Number,Capacity,Type\n";
  for (const classroom of sampleClassrooms) {
    classroomsCSV += `${classroom.roomNumber},${classroom.capacity},${classroom.type}\n`;
  }
  
  return {
    coursesCSV,
    classroomsCSV
  };
};
