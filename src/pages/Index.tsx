
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CalendarDays, FileSpreadsheet, School } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import TimetableDisplay from "@/components/TimetableDisplay";
import { Separator } from "@/components/ui/separator";
import { Course, Classroom, Timetable, Department } from "@/types/timetable";
import { parseCoursesCSV, parseClassroomsCSV } from "@/utils/csvParser";
import { generateTimetables } from "@/utils/timetableGenerator";

const Index = () => {
  const [dsaiCourses, setDsaiCourses] = useState<Course[]>([]);
  const [eceCourses, setEceCourses] = useState<Course[]>([]);
  const [cseCourses, setCseCourses] = useState<Course[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [activeTab, setActiveTab] = useState("setup");
  
  const handleCourseFileUpload = async (file: File, department: Department) => {
    try {
      const content = await file.text();
      const parsedCourses = parseCoursesCSV(content, department);
      
      // Set courses based on department
      switch (department) {
        case "DSAI":
          setDsaiCourses(parsedCourses);
          break;
        case "ECE":
          setEceCourses(parsedCourses);
          break;
        case "CSE":
          setCseCourses(parsedCourses);
          break;
      }
      
      toast.success(`Parsed ${parsedCourses.length} courses for ${department} successfully`);
    } catch (error) {
      console.error(`Error parsing ${department} courses file:`, error);
      toast.error(`Error parsing ${department} courses file. Please check the format.`);
    }
  };
  
  const handleClassroomFileUpload = async (file: File) => {
    try {
      const content = await file.text();
      const parsedClassrooms = parseClassroomsCSV(content);
      setClassrooms(parsedClassrooms);
      toast.success(`Parsed ${parsedClassrooms.length} classrooms successfully`);
    } catch (error) {
      console.error("Error parsing classrooms file:", error);
      toast.error("Error parsing classrooms file. Please check the format.");
    }
  };
  
  const handleGenerateTimetables = () => {
    try {
      const allCourses = [...dsaiCourses, ...eceCourses, ...cseCourses];
      
      if (allCourses.length === 0) {
        toast.error("Please upload course data for at least one department");
        return;
      }
      
      if (classrooms.length === 0) {
        toast.error("Please upload classroom data");
        return;
      }
      
      console.log("Generating timetables with:", { 
        dsaiCourses: dsaiCourses.length,
        eceCourses: eceCourses.length,
        cseCourses: cseCourses.length,
        totalCourses: allCourses.length,
        classrooms: classrooms.length 
      });
      
      // Generate timetables
      const generatedTimetables = generateTimetables(allCourses, classrooms);
      console.log("Generated timetables:", generatedTimetables);
      
      if (!generatedTimetables || generatedTimetables.length === 0) {
        toast.error("Failed to generate timetables. No timetables were created.");
        return;
      }
      
      setTimetables(generatedTimetables);
      toast.success(`Successfully generated ${generatedTimetables.length} timetables!`);
      setActiveTab("timetable");
    } catch (error) {
      console.error("Error generating timetables:", error);
      toast.error(`Error generating timetables: ${(error as Error).message || "Unknown error"}`);
    }
  };
  
  // Function to render a department's course data
  const renderDepartmentCourses = (courses: Course[], department: string) => {
    return courses.length === 0 ? (
      <p className="text-sm text-gray-500">No {department} courses uploaded yet</p>
    ) : (
      <div className="rounded-md border overflow-hidden">
        <div className="max-h-60 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="text-left p-2">Course Name</th>
                <th className="text-left p-2">Semester</th>
                <th className="text-left p-2">L-T-P-S-C</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2">{course.courseName}</td>
                  <td className="p-2">{course.semester}</td>
                  <td className="p-2">
                    {course.lectureHours}-{course.tutorialHours}-{course.practicalHours}-{course.seminarHours}-{course.totalCredits}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-muted p-2 text-xs">
          Total {department} Courses: {courses.length}
        </div>
      </div>
    );
  };
  
  return (
    <div className="container py-8 mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 text-timetable-primary">
          Academic Timetable Generator
        </h1>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Generate conflict-free timetables for all semesters and departments simultaneously, 
          following L-T-P-S-C structure and managing room assignments automatically.
        </p>
      </header>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mx-auto mb-8 grid grid-cols-2 max-w-md">
          <TabsTrigger value="setup">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Setup Data
          </TabsTrigger>
          <TabsTrigger value="timetable" disabled={timetables.length === 0}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Generated Timetables
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="setup">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Department Courses</CardTitle>
                <CardDescription>
                  Upload course data for each department
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">DSAI Courses</h3>
                  <FileUpload 
                    onFileUpload={(file) => handleCourseFileUpload(file, "DSAI")} 
                    fileType="courses" 
                    accept=".csv" 
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">ECE Courses</h3>
                  <FileUpload 
                    onFileUpload={(file) => handleCourseFileUpload(file, "ECE")} 
                    fileType="courses" 
                    accept=".csv" 
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">CSE Courses</h3>
                  <FileUpload 
                    onFileUpload={(file) => handleCourseFileUpload(file, "CSE")} 
                    fileType="courses" 
                    accept=".csv" 
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Classrooms</CardTitle>
                <CardDescription>
                  Upload classroom data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload 
                  onFileUpload={handleClassroomFileUpload} 
                  fileType="classrooms" 
                  accept=".csv" 
                />
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Data Summary</CardTitle>
              <CardDescription>
                Review your data before generating timetables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <School className="h-5 w-5 mr-1 text-blue-500" />
                    DSAI Courses
                  </h3>
                  {renderDepartmentCourses(dsaiCourses, "DSAI")}
                </div>
                
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <School className="h-5 w-5 mr-1 text-green-500" />
                    ECE Courses
                  </h3>
                  {renderDepartmentCourses(eceCourses, "ECE")}
                </div>
                
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <School className="h-5 w-5 mr-1 text-purple-500" />
                    CSE Courses
                  </h3>
                  {renderDepartmentCourses(cseCourses, "CSE")}
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium mb-2 flex items-center">
                  <CalendarDays className="h-5 w-5 mr-1 text-timetable-accent" />
                  Classrooms
                </h3>
                {classrooms.length === 0 ? (
                  <p className="text-sm text-gray-500">No classrooms uploaded yet</p>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <div className="max-h-60 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="text-left p-2">Room</th>
                            <th className="text-left p-2">Capacity</th>
                            <th className="text-left p-2">Type</th>
                            {classrooms[0]?.building && (
                              <th className="text-left p-2">Building</th>
                            )}
                            {classrooms[0]?.floor !== undefined && (
                              <th className="text-left p-2">Floor</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {classrooms.map((classroom, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-2">{classroom.roomNumber}</td>
                              <td className="p-2">{classroom.capacity}</td>
                              <td className="p-2">{classroom.type}</td>
                              {classroom.building && (
                                <td className="p-2">{classroom.building}</td>
                              )}
                              {classroom.floor !== undefined && (
                                <td className="p-2">{classroom.floor}</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-muted p-2 text-xs">
                      Total Classrooms: {classrooms.length}
                    </div>
                  </div>
                )}
              </div>
              
              <Separator className="my-6" />
              
              <div className="text-center">
                <Button 
                  size="lg"
                  onClick={handleGenerateTimetables}
                  disabled={(dsaiCourses.length === 0 && eceCourses.length === 0 && cseCourses.length === 0) || classrooms.length === 0}
                >
                  Generate Timetables
                </Button>
                {((dsaiCourses.length === 0 && eceCourses.length === 0 && cseCourses.length === 0) || classrooms.length === 0) && (
                  <p className="text-sm text-gray-500 mt-2">
                    Please upload at least one department's courses data and classrooms data to generate timetables
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timetable">
          {timetables.length > 0 ? (
            <TimetableDisplay timetables={timetables} />
          ) : (
            <div className="text-center py-12">
              <p>No timetables generated yet. Please go to Setup Data tab and generate timetables.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
