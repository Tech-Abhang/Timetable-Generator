
export interface Course {
  courseName: string;
  faculty: string;
  credits: string; // Format: "L-T-P-S-C"
  semester: number;
  lectureHours: number; // L
  tutorialHours: number; // T
  practicalHours: number; // P
  seminarHours: number; // S
  totalCredits: number; // C
  elective: string; // "0", "B1", "B2", "B3", "B4"
}

export interface Classroom {
  roomNumber: string;
  capacity: number;
  type: "Lecture" | "Tutorial" | "Lab" | "All";
  building?: string;
  floor?: number;
}

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface TimetableEntry {
  day: string;
  startTime: string;
  endTime: string;
  courseCode?: string;
  courseName: string;
  faculty?: string;
  roomNumber?: string;
  type: "Lecture" | "Tutorial" | "Practical" | "Elective" | "Lunch";
  classType?: "B1" | "B2" | "B3" | "B4";
  semester: number;
}

export interface Timetable {
  semester: number;
  entries: TimetableEntry[];
}

// This is for the CSV parsing
export interface CourseCSVRow {
  "Course Name": string;
  Faculty: string;
  Credits: string;
  Semester: string;
  L: string;
  T: string;
  P: string;
  S: string; // Adding the S field for seminar hours
  C: string;
  Elective: string;
}

export interface ClassroomCSVRow {
  "Classroom Name": string;
  Capacity: string;
  "TYPE(Lecture/Lab/Seminar)": string;
  Building?: string;
  Floor?: string;
}
