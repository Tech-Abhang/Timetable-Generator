
import Papa from 'papaparse';
import { Course, Classroom, CourseCSVRow, ClassroomCSVRow } from '../types/timetable';

export const parseCoursesCSV = (csvData: string): Course[] => {
  const result = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
  });
  
  if (result.errors.length > 0) {
    console.error('CSV parsing errors:', result.errors);
    throw new Error('Error parsing courses CSV file');
  }
  
  return (result.data as CourseCSVRow[]).map((row: CourseCSVRow) => {
    // Parse credits string (e.g., "3-1-0-0-4")
    const creditsMatch = row.Credits?.match(/(\d+)-(\d+)-(\d+)-(\d+)-?(\d+)?/) || 
                         row.Credits?.match(/(\d+)-(\d+)-(\d+)-(\d+)/);
    
    let lectureHours = 0;
    let tutorialHours = 0; 
    let practicalHours = 0;
    let seminarHours = 0;
    let totalCredits = 0;
    
    if (creditsMatch) {
      lectureHours = parseInt(creditsMatch[1]) || 0;
      tutorialHours = parseInt(creditsMatch[2]) || 0;
      practicalHours = parseInt(creditsMatch[3]) || 0;
      seminarHours = parseInt(creditsMatch[4]) || 0;
      totalCredits = parseInt(creditsMatch[5] || row.C) || 0;
    }
    
    return {
      courseName: row["Course Name"],
      faculty: row.Faculty,
      credits: row.Credits,
      semester: parseInt(row.Semester) || 0,
      lectureHours: parseInt(row.L) || lectureHours,
      tutorialHours: parseInt(row.T) || tutorialHours,
      practicalHours: parseInt(row.P) || practicalHours,
      seminarHours: seminarHours,
      totalCredits: parseInt(row.C) || totalCredits,
      elective: row.Elective || "0"
    };
  });
};

export const parseClassroomsCSV = (csvData: string): Classroom[] => {
  const result = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
  });
  
  if (result.errors.length > 0) {
    console.error('CSV parsing errors:', result.errors);
    throw new Error('Error parsing classrooms CSV file');
  }
  
  return (result.data as ClassroomCSVRow[]).map((row: ClassroomCSVRow) => {
    const typeValue = row["TYPE(Lecture/Lab/Seminar)"];
    
    // Map the type values to our expected format
    let roomType: "Lecture" | "Tutorial" | "Lab" | "All" = "All";
    
    if (typeValue.toLowerCase().includes("lecture")) {
      roomType = "Lecture";
    } else if (typeValue.toLowerCase().includes("lab")) {
      roomType = "Lab";
    } else if (typeValue.toLowerCase().includes("tutorial")) {
      roomType = "Tutorial";
    } else if (typeValue.toLowerCase().includes("seminar")) {
      roomType = "All";
    }
    
    return {
      roomNumber: row["Classroom Name"],
      capacity: parseInt(row.Capacity) || 0,
      type: roomType,
      building: row.Building,
      floor: row.Floor ? parseInt(row.Floor) : undefined
    };
  });
};
