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
  if (type === "Lab") {
    return classrooms.filter(room => 
      room.type === "Lab" || room.type === "All"
    );
  }
  
  if (type === "Tutorial") {
    return classrooms.filter(room => 
      room.type === "Tutorial" || room.type === "Lecture" || room.type === "All"
    );
  }
  
  // For lectures
  return classrooms.filter(room => 
    room.type === "Lecture" || room.type === "All"
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
  console.log("Starting timetable generation with:", {
    coursesCount: courses.length,
    classroomsCount: classrooms.length
  });
  
  // Validate input
  if (!courses || courses.length === 0) {
    console.error("No courses provided for timetable generation");
    return [];
  }
  
  if (!classrooms || classrooms.length === 0) {
    console.error("No classrooms provided for timetable generation");
    return [];
  }
  
  // Group courses by department
  const departments = [...new Set(courses.map(course => course.department || 'Default'))];
  console.log("Detected departments:", departments);
  
  // Create a timetable for each semester within each department
  const timetables: Timetable[] = [];
  
  // Process each department separately
  for (const department of departments) {
    const departmentCourses = courses.filter(course => (course.department || 'Default') === department);
    const semesters = [...new Set(departmentCourses.map(course => course.semester))];
    console.log(`Detected semesters for department ${department}:`, semesters);
    
    if (semesters.length === 0) {
      console.error(`No valid semesters found for department ${department}`);
      continue;
    }
    
    // Track booked rooms and faculty
    const bookedRooms = new Map<string, Set<string>>();
    const bookedFaculty = new Map<string, Set<string>>();
    const bookedSemesters = new Map<string, Map<string, Set<string>>>(); // key: department-semester
    
    // Add lunch breaks for all semesters in this department
    for (const semester of semesters) {
      const timetable: Timetable = {
        semester,
        department,
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
          semester,
          department
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
      const semesterKey = `${department}-${semester}`;
      if (!bookedSemesters.has(semesterKey)) {
        bookedSemesters.set(semesterKey, new Map<string, Set<string>>());
      }
      
      let semesterMap = bookedSemesters.get(semesterKey);
      if (semesterMap === undefined) {
        bookedSemesters.set(semesterKey, new Map<string, Set<string>>());
        semesterMap = bookedSemesters.get(semesterKey)!;
      }
      
      if (!semesterMap.has(roomKey)) {
        semesterMap.set(roomKey, new Set());
      }
      semesterMap.get(roomKey)?.add('booked');
    };
    
    // Process elective courses for this department
    const electiveCourses = departmentCourses.filter(course => course.elective !== "0");
    const regularCourses = departmentCourses.filter(course => course.elective === "0");
    
    console.log(`Department ${department} courses breakdown:`, {
      electiveCourses: electiveCourses.length,
      regularCourses: regularCourses.length
    });
    
    // Group electives by their code (B1, B2, etc.)
    const electiveGroups = new Map<string, Course[]>();
    for (const course of electiveCourses) {
      if (!electiveGroups.has(course.elective)) {
        electiveGroups.set(course.elective, []);
      }
      electiveGroups.get(course.elective)?.push(course);
    }
    
    console.log(`Department ${department} elective groups:`, Array.from(electiveGroups.keys()));

    // Schedule each elective group
    for (const [groupCode, groupCourses] of electiveGroups.entries()) {
      console.log(`Processing elective group ${groupCode} with ${groupCourses.length} courses for department ${department}`);
      
      // Find common semester(s) for this elective group
      const electiveSemesters = [...new Set(groupCourses.map(c => c.semester))];
      
      // For each lecture hour required
      const maxLectureHours = Math.max(...groupCourses.map(c => c.lectureHours));
      const maxTutorialHours = Math.max(...groupCourses.map(c => c.tutorialHours));
      const maxPracticalHours = Math.max(...groupCourses.map(c => c.practicalHours));
      
      // Schedule lectures, tutorials, practicals
      let lecturesScheduled = 0;
      let tutorialsScheduled = 0;
      let practicalsScheduled = 0;

      // Try to schedule until all required sessions are scheduled
      while (
        lecturesScheduled < maxLectureHours || 
        tutorialsScheduled < maxTutorialHours || 
        practicalsScheduled < maxPracticalHours
      ) {
        // Similar to the existing logic, but checking/adding department information
        dayLoop: for (const day of DAYS) {
          for (const timeSlotStr of TIME_SLOTS) {
            if (isLunchBreak(timeSlotStr)) continue;
            
            const [startTime, endTime] = timeSlotStr.split('-');
            
            // Check if any semester in this elective group is already booked
            let semesterAvailable = true;
            for (const semester of electiveSemesters) {
              const semesterKey = `${department}-${semester}`;
              const semesterMap = bookedSemesters.get(semesterKey);
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
                const timetable = timetables.find(t => 
                  t.semester === course.semester && 
                  t.department === department
                );
                if (!timetable) continue;

                timetable.entries.push({
                  day,
                  startTime,
                  endTime,
                  courseName: course.courseName,
                  faculty: course.faculty,
                  type: 'Elective',
                  classType: groupCode as any,
                  semester: course.semester,
                  department
                });
                
                // Mark this semester's timeslot as booked
                const semesterKey = `${department}-${course.semester}`;
                if (!bookedSemesters.has(semesterKey)) {
                  bookedSemesters.set(semesterKey, new Map());
                }
                const semesterMap = bookedSemesters.get(semesterKey);
                if (semesterMap && !semesterMap.has(`${day}-${timeSlotStr}`)) {
                  semesterMap.set(`${day}-${timeSlotStr}`, new Set());
                }
                semesterMap?.get(`${day}-${timeSlotStr}`)?.add('booked');
              }
              
              lecturesScheduled++;
              break dayLoop;
            }
            // Then tutorials (similar to lectures but for tutorials)
            else if (tutorialsScheduled < maxTutorialHours) {
              // Similar logic as lectures with tutorial specific naming
              for (const course of groupCourses) {
                if (course.tutorialHours > 0) {
                  const timetable = timetables.find(t => 
                    t.semester === course.semester && 
                    t.department === department
                  );
                  if (!timetable) continue;

                  // Add tutorial entry
                  timetable.entries.push({
                    day,
                    startTime,
                    endTime,
                    courseName: `${course.courseName} (Tutorial)`,
                    faculty: course.faculty,
                    type: 'Elective',
                    classType: groupCode as any,
                    semester: course.semester,
                    department
                  });
                  
                  // Mark as booked
                  const semesterKey = `${department}-${course.semester}`;
                  if (!bookedSemesters.has(semesterKey)) {
                    bookedSemesters.set(semesterKey, new Map());
                  }
                  const semesterMap = bookedSemesters.get(semesterKey);
                  if (semesterMap && !semesterMap.has(`${day}-${timeSlotStr}`)) {
                    semesterMap.set(`${day}-${timeSlotStr}`, new Set());
                  }
                  semesterMap?.get(`${day}-${timeSlotStr}`)?.add('booked');
                }
              }
              
              tutorialsScheduled++;
              break dayLoop;
            }
            // Finally practicals (similar logic as above)
            else if (practicalsScheduled < maxPracticalHours) {
              // continue with practical scheduling with department information
              for (const course of groupCourses) {
                if (course.practicalHours > 0) {
                  const timetable = timetables.find(t => 
                    t.semester === course.semester && 
                    t.department === department
                  );
                  if (!timetable) continue;

                  // Add practical entry
                  timetable.entries.push({
                    day,
                    startTime,
                    endTime,
                    courseName: `${course.courseName} (Lab)`,
                    faculty: course.faculty,
                    type: 'Elective',
                    classType: groupCode as any,
                    semester: course.semester,
                    department
                  });
                  
                  // Mark as booked
                  const semesterKey = `${department}-${course.semester}`;
                  if (!bookedSemesters.has(semesterKey)) {
                    bookedSemesters.set(semesterKey, new Map());
                  }
                  const semesterMap = bookedSemesters.get(semesterKey);
                  if (semesterMap && !semesterMap.has(`${day}-${timeSlotStr}`)) {
                    semesterMap.set(`${day}-${timeSlotStr}`, new Set());
                  }
                  semesterMap?.get(`${day}-${timeSlotStr}`)?.add('booked');
                }
              }
              
              practicalsScheduled++;
              break dayLoop;
            }
          }
        }
        
        // Check for infinite loops - if we can't schedule anymore, break out
        if (
          (lecturesScheduled === 0 && maxLectureHours > 0) ||
          (tutorialsScheduled === 0 && maxTutorialHours > 0) ||
          (practicalsScheduled === 0 && maxPracticalHours > 0)
        ) {
          console.error(`Could not schedule all required sessions for elective group ${groupCode} in department ${department}`);
          break;
        }
      }
    }

    console.log(`Starting to schedule regular courses for department ${department}...`);
    
    // Now schedule regular courses
    for (const course of regularCourses) {
      const timetable = timetables.find(t => 
        t.semester === course.semester && 
        t.department === department
      );
      
      if (!timetable) {
        console.error(`No timetable found for semester ${course.semester} in department ${department}`);
        continue;
      }
      
      // Schedule lectures, tutorials, and practicals for regular courses
      
      // Schedule lectures
      let lecturesScheduled = 0;
      while (lecturesScheduled < course.lectureHours) {
        let scheduled = false;
        
        dayLoop: for (const day of DAYS) {
          for (const timeSlotStr of TIME_SLOTS) {
            if (isLunchBreak(timeSlotStr)) continue;
            
            const [startTime, endTime] = timeSlotStr.split('-');
            
            // Check if this semester already has a class at this time
            const semesterKey = `${department}-${course.semester}`;
            const semesterMap = bookedSemesters.get(semesterKey);
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
              semester: course.semester,
              department
            });
            
            lecturesScheduled++;
            scheduled = true;
            break dayLoop;
          }
        }
        
        // If we couldn't schedule this lecture, break to avoid infinite loop
        if (!scheduled) {
          console.error(`Could not schedule lecture ${lecturesScheduled + 1}/${course.lectureHours} for ${course.courseName} in department ${department}`);
          break;
        }
      }
      
      // Schedule tutorials
      let tutorialsScheduled = 0;
      while (tutorialsScheduled < course.tutorialHours) {
        // tutorial scheduling logic with department information
        let scheduled = false;
        
        dayLoop: for (const day of DAYS) {
          for (const timeSlotStr of TIME_SLOTS) {
            if (isLunchBreak(timeSlotStr)) continue;
            
            const [startTime, endTime] = timeSlotStr.split('-');
            
            // Check if this semester already has a class at this time
            const semesterKey = `${department}-${course.semester}`;
            const semesterMap = bookedSemesters.get(semesterKey);
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
              semester: course.semester,
              department
            });
            
            tutorialsScheduled++;
            scheduled = true;
            break dayLoop;
          }
        }
        
        // If we couldn't schedule this tutorial, break to avoid infinite loop
        if (!scheduled) {
          console.error(`Could not schedule tutorial ${tutorialsScheduled + 1}/${course.tutorialHours} for ${course.courseName} in department ${department}`);
          break;
        }
      }
      
      // Schedule practicals
      let practicalsScheduled = 0;
      while (practicalsScheduled < course.practicalHours) {
        // practical scheduling logic with department information
        let scheduled = false;
        
        dayLoop: for (const day of DAYS) {
          for (const timeSlotStr of TIME_SLOTS) {
            if (isLunchBreak(timeSlotStr)) continue;
            
            const [startTime, endTime] = timeSlotStr.split('-');
            
            // Check if this semester already has a class at this time
            const semesterKey = `${department}-${course.semester}`;
            const semesterMap = bookedSemesters.get(semesterKey);
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
              semester: course.semester,
              department
            });
            
            practicalsScheduled++;
            scheduled = true;
            break dayLoop;
          }
        }
        
        // If we couldn't schedule this practical, break to avoid infinite loop
        if (!scheduled) {
          console.error(`Could not schedule practical ${practicalsScheduled + 1}/${course.practicalHours} for ${course.courseName} in department ${department}`);
          break;
        }
      }
    }
  }

  console.log(`Timetable generation complete. Created ${timetables.length} timetables with a total of ${timetables.reduce((sum, t) => sum + t.entries.length, 0)} entries`);
  return timetables;
};
