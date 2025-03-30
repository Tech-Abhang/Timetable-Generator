
import { Course, Classroom, Timetable, TimetableEntry } from '../types/timetable';

// Days and time slots
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '09:00-10:30', '10:30-12:00', '12:00-13:30', '13:30-14:30', // Lunch break
  '14:30-16:00', '16:00-17:30', '17:30-19:00'
];

// Helper function to check if a time slot is a lunch break
const isLunchBreak = (timeSlot: string) => timeSlot === '13:30-14:30';

// Helper function to get suitable classrooms for a course type
const getSuitableClassrooms = (
  classrooms: Classroom[], 
  type: "Lecture" | "Tutorial" | "Lab"
): Classroom[] => {
  return classrooms.filter(room => 
    room.type === type || room.type === "All"
  );
};

// Helper function to check if a room is available at a given time slot
const isRoomAvailable = (
  roomNumber: string, 
  day: string, 
  timeSlot: string,
  bookedRooms: Map<string, Set<string>>
): boolean => {
  const key = `${day}-${timeSlot}`;
  if (!bookedRooms.has(key)) return true;
  return !bookedRooms.get(key)?.has(roomNumber);
};

// Helper function to check if a faculty is available at a given time slot
const isFacultyAvailable = (
  faculty: string, 
  day: string, 
  timeSlot: string,
  bookedFaculty: Map<string, Set<string>>
): boolean => {
  const key = `${day}-${timeSlot}`;
  if (!bookedFaculty.has(key)) return true;
  return !bookedFaculty.get(key)?.has(faculty);
};

// Main function to generate timetables
export const generateTimetables = (
  courses: Course[], 
  classrooms: Classroom[]
): Timetable[] => {
  // Create a timetable for each semester
  const semesters = [...new Set(courses.map(course => course.semester))];
  const timetables: Timetable[] = [];
  
  // Track booked rooms and faculty
  const bookedRooms = new Map<string, Set<string>>();
  const bookedFaculty = new Map<string, Set<string>>();
  const bookedSemesters = new Map<number, Map<string, Set<string>>>();
  
  // Add lunch breaks for all semesters
  for (const semester of semesters) {
    const timetable: Timetable = {
      semester,
      entries: []
    };
    
    // Add lunch breaks
    for (const day of DAYS) {
      timetable.entries.push({
        day,
        startTime: '13:30',
        endTime: '14:30',
        courseName: 'Lunch Break',
        type: 'Lunch',
        semester
      });
    }
    
    timetables.push(timetable);
  }

  // Function to book a timeslot
  const bookTimeSlot = (
    day: string, 
    timeSlot: string, 
    roomNumber: string, 
    faculty: string,
    semester: number
  ) => {
    // Book the room
    const roomKey = `${day}-${timeSlot}`;
    if (!bookedRooms.has(roomKey)) {
      bookedRooms.set(roomKey, new Set());
    }
    bookedRooms.get(roomKey)?.add(roomNumber);
    
    // Book the faculty
    const facultyKey = `${day}-${timeSlot}`;
    if (!bookedFaculty.has(facultyKey)) {
      bookedFaculty.set(facultyKey, new Set());
    }
    bookedFaculty.get(facultyKey)?.add(faculty);
    
    // Book the semester
    if (!bookedSemesters.has(semester)) {
      bookedSemesters.set(semester, new Map());
    }
    const semesterMap = bookedSemesters.get(semester);
    if (!semesterMap.has(roomKey)) {
      semesterMap.set(roomKey, new Set());
    }
    semesterMap.get(roomKey)?.add('booked');
  };
  
  // Process elective courses - we need to schedule these first as they have more constraints
  const electiveCourses = courses.filter(course => course.elective !== "0");
  const regularCourses = courses.filter(course => course.elective === "0");
  
  // Group electives by their code (B1, B2, etc.)
  const electiveGroups = new Map<string, Course[]>();
  for (const course of electiveCourses) {
    if (!electiveGroups.has(course.elective)) {
      electiveGroups.set(course.elective, []);
    }
    electiveGroups.get(course.elective)?.push(course);
  }

  // Schedule each elective group together in the same time slots
  for (const [groupCode, groupCourses] of electiveGroups.entries()) {
    // Find common semester(s) for this elective group
    const electiveSemesters = [...new Set(groupCourses.map(c => c.semester))];
    
    // For each lecture hour required
    const maxLectureHours = Math.max(...groupCourses.map(c => c.lectureHours));
    const maxTutorialHours = Math.max(...groupCourses.map(c => c.tutorialHours));
    const maxPracticalHours = Math.max(...groupCourses.map(c => c.practicalHours));

    // Schedule lectures
    let lecturesScheduled = 0;
    let tutorialsScheduled = 0;
    let practicalsScheduled = 0;

    // Try to schedule until all required sessions are scheduled
    while (
      lecturesScheduled < maxLectureHours || 
      tutorialsScheduled < maxTutorialHours || 
      practicalsScheduled < maxPracticalHours
    ) {
      dayLoop: for (const day of DAYS) {
        for (const timeSlotStr of TIME_SLOTS) {
          if (isLunchBreak(timeSlotStr)) continue;
          
          const [startTime, endTime] = timeSlotStr.split('-');
          
          // Check if any semester in this elective group is already booked
          let semesterAvailable = true;
          for (const semester of electiveSemesters) {
            const semesterMap = bookedSemesters.get(semester);
            if (semesterMap?.get(`${day}-${timeSlotStr}`)?.has('booked')) {
              semesterAvailable = false;
              break;
            }
          }
          
          if (!semesterAvailable) continue;

          // Schedule lectures first
          if (lecturesScheduled < maxLectureHours) {
            // Add entries for all courses in this elective group
            for (const course of groupCourses) {
              const timetable = timetables.find(t => t.semester === course.semester);
              if (!timetable) continue;

              timetable.entries.push({
                day,
                startTime,
                endTime,
                courseName: course.courseName,
                faculty: course.faculty,
                type: 'Elective',
                classType: groupCode as any,
                semester: course.semester
              });
              
              // Mark this semester's timeslot as booked
              if (!bookedSemesters.has(course.semester)) {
                bookedSemesters.set(course.semester, new Map());
              }
              const semesterMap = bookedSemesters.get(course.semester);
              if (!semesterMap.has(`${day}-${timeSlotStr}`)) {
                semesterMap.set(`${day}-${timeSlotStr}`, new Set());
              }
              semesterMap.get(`${day}-${timeSlotStr}`)?.add('booked');
            }
            
            lecturesScheduled++;
            break dayLoop;
          }
          // Then tutorials
          else if (tutorialsScheduled < maxTutorialHours) {
            // Similar to lectures
            for (const course of groupCourses) {
              if (course.tutorialHours > 0) {
                const timetable = timetables.find(t => t.semester === course.semester);
                if (!timetable) continue;

                timetable.entries.push({
                  day,
                  startTime,
                  endTime,
                  courseName: `${course.courseName} (Tutorial)`,
                  faculty: course.faculty,
                  type: 'Elective',
                  classType: groupCode as any,
                  semester: course.semester
                });
                
                // Mark as booked
                if (!bookedSemesters.has(course.semester)) {
                  bookedSemesters.set(course.semester, new Map());
                }
                const semesterMap = bookedSemesters.get(course.semester);
                if (!semesterMap.has(`${day}-${timeSlotStr}`)) {
                  semesterMap.set(`${day}-${timeSlotStr}`, new Set());
                }
                semesterMap.get(`${day}-${timeSlotStr}`)?.add('booked');
              }
            }
            
            tutorialsScheduled++;
            break dayLoop;
          }
          // Finally practicals
          else if (practicalsScheduled < maxPracticalHours) {
            // Similar to tutorials and lectures
            for (const course of groupCourses) {
              if (course.practicalHours > 0) {
                const timetable = timetables.find(t => t.semester === course.semester);
                if (!timetable) continue;

                timetable.entries.push({
                  day,
                  startTime,
                  endTime,
                  courseName: `${course.courseName} (Lab)`,
                  faculty: course.faculty,
                  type: 'Elective',
                  classType: groupCode as any,
                  semester: course.semester
                });
                
                // Mark as booked
                if (!bookedSemesters.has(course.semester)) {
                  bookedSemesters.set(course.semester, new Map());
                }
                const semesterMap = bookedSemesters.get(course.semester);
                if (!semesterMap.has(`${day}-${timeSlotStr}`)) {
                  semesterMap.set(`${day}-${timeSlotStr}`, new Set());
                }
                semesterMap.get(`${day}-${timeSlotStr}`)?.add('booked');
              }
            }
            
            practicalsScheduled++;
            break dayLoop;
          }
        }
      }
    }
  }

  // Now schedule regular courses
  for (const course of regularCourses) {
    const timetable = timetables.find(t => t.semester === course.semester);
    if (!timetable) continue;
    
    // Schedule lectures
    let lecturesScheduled = 0;
    while (lecturesScheduled < course.lectureHours) {
      dayLoop: for (const day of DAYS) {
        for (const timeSlotStr of TIME_SLOTS) {
          if (isLunchBreak(timeSlotStr)) continue;
          
          const [startTime, endTime] = timeSlotStr.split('-');
          
          // Check if this semester already has a class at this time
          const semesterMap = bookedSemesters.get(course.semester);
          if (semesterMap?.get(`${day}-${timeSlotStr}`)?.has('booked')) {
            continue;
          }
          
          // Check if faculty is available
          if (!isFacultyAvailable(course.faculty, day, timeSlotStr, bookedFaculty)) {
            continue;
          }
          
          // Find available room
          const lectureRooms = getSuitableClassrooms(classrooms, "Lecture");
          const availableRoom = lectureRooms.find(room => 
            isRoomAvailable(room.roomNumber, day, timeSlotStr, bookedRooms)
          );
          
          if (!availableRoom) continue; // No room available
          
          // Book the time slot
          bookTimeSlot(day, timeSlotStr, availableRoom.roomNumber, course.faculty, course.semester);
          
          // Add to timetable
          timetable.entries.push({
            day,
            startTime,
            endTime,
            courseName: course.courseName,
            faculty: course.faculty,
            roomNumber: availableRoom.roomNumber,
            type: 'Lecture',
            semester: course.semester
          });
          
          lecturesScheduled++;
          break dayLoop;
        }
      }
    }
    
    // Schedule tutorials
    let tutorialsScheduled = 0;
    while (tutorialsScheduled < course.tutorialHours) {
      dayLoop: for (const day of DAYS) {
        for (const timeSlotStr of TIME_SLOTS) {
          if (isLunchBreak(timeSlotStr)) continue;
          
          const [startTime, endTime] = timeSlotStr.split('-');
          
          // Check if this semester already has a class at this time
          const semesterMap = bookedSemesters.get(course.semester);
          if (semesterMap?.get(`${day}-${timeSlotStr}`)?.has('booked')) {
            continue;
          }
          
          // Check if faculty is available
          if (!isFacultyAvailable(course.faculty, day, timeSlotStr, bookedFaculty)) {
            continue;
          }
          
          // Find available room
          const tutorialRooms = getSuitableClassrooms(classrooms, "Tutorial");
          const availableRoom = tutorialRooms.find(room => 
            isRoomAvailable(room.roomNumber, day, timeSlotStr, bookedRooms)
          );
          
          if (!availableRoom) continue; // No room available
          
          // Book the time slot
          bookTimeSlot(day, timeSlotStr, availableRoom.roomNumber, course.faculty, course.semester);
          
          // Add to timetable
          timetable.entries.push({
            day,
            startTime,
            endTime,
            courseName: `${course.courseName} (Tutorial)`,
            faculty: course.faculty,
            roomNumber: availableRoom.roomNumber,
            type: 'Tutorial',
            semester: course.semester
          });
          
          tutorialsScheduled++;
          break dayLoop;
        }
      }
    }
    
    // Schedule practicals
    let practicalsScheduled = 0;
    while (practicalsScheduled < course.practicalHours) {
      dayLoop: for (const day of DAYS) {
        for (const timeSlotStr of TIME_SLOTS) {
          if (isLunchBreak(timeSlotStr)) continue;
          
          const [startTime, endTime] = timeSlotStr.split('-');
          
          // Check if this semester already has a class at this time
          const semesterMap = bookedSemesters.get(course.semester);
          if (semesterMap?.get(`${day}-${timeSlotStr}`)?.has('booked')) {
            continue;
          }
          
          // Check if faculty is available
          if (!isFacultyAvailable(course.faculty, day, timeSlotStr, bookedFaculty)) {
            continue;
          }
          
          // Find available room
          const labRooms = getSuitableClassrooms(classrooms, "Lab");
          const availableRoom = labRooms.find(room => 
            isRoomAvailable(room.roomNumber, day, timeSlotStr, bookedRooms)
          );
          
          if (!availableRoom) continue; // No room available
          
          // Book the time slot
          bookTimeSlot(day, timeSlotStr, availableRoom.roomNumber, course.faculty, course.semester);
          
          // Add to timetable
          timetable.entries.push({
            day,
            startTime,
            endTime,
            courseName: `${course.courseName} (Lab)`,
            faculty: course.faculty,
            roomNumber: availableRoom.roomNumber,
            type: 'Practical',
            semester: course.semester
          });
          
          practicalsScheduled++;
          break dayLoop;
        }
      }
    }
  }

  return timetables;
};
