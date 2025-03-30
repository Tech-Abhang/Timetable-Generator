import { useState, useMemo } from "react";
import { Timetable, TimetableEntry, Department } from "../types/timetable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, BookOpen, Filter } from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TimetableDisplayProps {
  timetables: Timetable[];
}

const TimetableDisplay = ({ timetables }: TimetableDisplayProps) => {
  const [selectedSemester, setSelectedSemester] = useState<string>(
    timetables.length > 0 ? timetables[0].semester.toString() : "1"
  );
  const [selectedDepartment, setSelectedDepartment] = useState<Department | "All">("All");
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '09:00-10:30', '10:30-12:00', '12:00-13:30', '13:30-14:30',
    '14:30-16:00', '16:00-17:30', '17:30-19:00'
  ];
  
  const activeTimetable = useMemo(() => {
    let filtered = timetables.filter(t => t.semester.toString() === selectedSemester);
    
    if (selectedDepartment !== "All") {
      filtered = filtered.filter(t => t.department === selectedDepartment);
    }
    
    // If we found a timetable matching both filters, return it
    if (filtered.length > 0) {
      return filtered[0];
    }
    
    // Otherwise, return an empty timetable
    return { semester: parseInt(selectedSemester), entries: [], department: selectedDepartment === "All" ? undefined : selectedDepartment };
  }, [timetables, selectedSemester, selectedDepartment]);
  
  // Get unique semesters and departments from timetables
  const uniqueSemesters = useMemo(() => {
    return [...new Set(timetables.map(t => t.semester))].sort((a, b) => a - b);
  }, [timetables]);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set<Department | undefined>();
    timetables.forEach(t => {
      if (t.department) depts.add(t.department);
    });
    return Array.from(depts);
  }, [timetables]);
  
  const getEntryForTimeSlot = (day: string, timeSlot: string): TimetableEntry | undefined => {
    const [startTime, endTime] = timeSlot.split('-');
    return activeTimetable.entries.find(entry => 
      entry.day === day && entry.startTime === startTime && entry.endTime === endTime
    );
  };
  
  const downloadPDF = () => {
    try {
      const doc = new jsPDF('landscape');
      
      // Add title with semester and department info
      doc.setFontSize(18);
      const titleText = `Timetable for Semester ${selectedSemester}${selectedDepartment !== "All" ? ` - ${selectedDepartment}` : ''}`;
      doc.text(titleText, 15, 15);
      
      // Add timestamp
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 22);
      
      // Set table header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      
      // Draw table
      let yPos = 30;
      const cellWidth = 37;
      const cellHeight = 15;
      const margin = 15;
      
      // Draw header row
      doc.setFillColor(44, 62, 80); // #2c3e50
      doc.setTextColor(255, 255, 255);
      doc.rect(margin, yPos, cellWidth, cellHeight, 'F');
      doc.text('Time/Day', margin + 5, yPos + 10);
      
      // Draw day headers
      for (let i = 0; i < days.length; i++) {
        doc.rect(margin + cellWidth * (i + 1), yPos, cellWidth, cellHeight, 'F');
        doc.text(days[i], margin + cellWidth * (i + 1) + 5, yPos + 10);
      }
      
      yPos += cellHeight;
      doc.setTextColor(0, 0, 0);
      
      // Draw time slots and entries
      for (const timeSlot of timeSlots) {
        // Time slot header
        doc.setFillColor(52, 73, 94); // #34495e
        doc.setTextColor(255, 255, 255);
        doc.rect(margin, yPos, cellWidth, cellHeight, 'F');
        doc.text(timeSlot, margin + 2, yPos + 10);
        
        // Reset text color for entries
        doc.setTextColor(0, 0, 0);
        
        // Draw entries for each day
        for (let i = 0; i < days.length; i++) {
          const entry = getEntryForTimeSlot(days[i], timeSlot);
          const xPos = margin + cellWidth * (i + 1);
          
          if (entry) {
            // Set colors based on entry type
            if (entry.type === 'Lunch') {
              doc.setFillColor(240, 240, 240);
            } else if (entry.type === 'Lecture') {
              doc.setFillColor(26, 188, 156); // #1abc9c
            } else if (entry.type === 'Tutorial') {
              doc.setFillColor(200, 230, 255);
            } else if (entry.type === 'Practical') {
              doc.setFillColor(200, 255, 200);
            } else if (entry.type === 'Elective') {
              doc.setFillColor(230, 126, 34); // #e67e22
            }
            
            doc.rect(xPos, yPos, cellWidth, cellHeight, 'F');
            
            // Add text
            doc.setFontSize(8);
            doc.text(entry.courseName.length > 20 
              ? entry.courseName.substring(0, 20) + '...' 
              : entry.courseName, 
              xPos + 2, yPos + 5);
            
            if (entry.faculty) {
              doc.text(entry.faculty.length > 20 
                ? entry.faculty.substring(0, 20) + '...' 
                : entry.faculty, 
                xPos + 2, yPos + 10);
            }
            
            if (entry.roomNumber) {
              doc.text(`Room: ${entry.roomNumber}`, xPos + 2, yPos + 15);
            }
            
            if (entry.classType) {
              doc.text(`Elective: ${entry.classType}`, xPos + 2, entry.roomNumber ? yPos + 20 : yPos + 15);
            }
          } else {
            // Empty cell
            doc.setFillColor(255, 255, 255);
            doc.rect(xPos, yPos, cellWidth, cellHeight, 'F');
          }
        }
        
        yPos += cellHeight;
      }
      
      const filename = `Timetable_Semester_${selectedSemester}${selectedDepartment !== "All" ? `_${selectedDepartment}` : ''}.pdf`;
      doc.save(filename);
      toast.success('Timetable downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download timetable. Please try again.');
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Generated Timetable</CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Select
              value={selectedSemester}
              onValueChange={setSelectedSemester}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                {uniqueSemesters.map((semester) => (
                  <SelectItem 
                    key={semester} 
                    value={semester.toString()}
                  >
                    Semester {semester}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={selectedDepartment}
              onValueChange={(value) => setSelectedDepartment(value as Department | "All")}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                {uniqueDepartments.map((dept) => dept && (
                  <SelectItem 
                    key={dept} 
                    value={dept}
                  >
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" className="ml-2" onClick={downloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="table" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="table">
              <BookOpen className="h-4 w-4 mr-2" />
              Timetable View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="table" className="w-full overflow-auto">
            {activeTimetable.entries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No timetable data available for Semester {selectedSemester} 
                {selectedDepartment !== "All" ? ` - ${selectedDepartment}` : ''}
              </div>
            ) : (
              <div className="min-w-[800px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="timetable-header">Time/Day</th>
                      {days.map(day => (
                        <th key={day} className="timetable-header">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map(timeSlot => (
                      <tr key={timeSlot}>
                        <td className="timetable-time">{timeSlot}</td>
                        {days.map(day => {
                          const entry = getEntryForTimeSlot(day, timeSlot);
                          return (
                            <td 
                              key={`${day}-${timeSlot}`} 
                              className={cn(
                                "timetable-cell",
                                entry?.type === 'Lunch' && "timetable-lunch",
                                !entry && "bg-white"
                              )}
                            >
                              {entry && (
                                <div className={cn(
                                  entry.type === 'Lecture' && "timetable-lecture",
                                  entry.type === 'Tutorial' && "timetable-tutorial",
                                  entry.type === 'Practical' && "timetable-practical",
                                  entry.type === 'Elective' && "timetable-elective",
                                  entry.type !== 'Lunch' && "p-1 rounded"
                                )}>
                                  {entry.type === 'Lunch' ? (
                                    <p className="font-medium">Lunch Break</p>
                                  ) : (
                                    <>
                                      <p className="font-medium">{entry.courseName}</p>
                                      {entry.faculty && <p className="text-xs mt-1">{entry.faculty}</p>}
                                      {entry.roomNumber && <p className="text-xs mt-1">Room: {entry.roomNumber}</p>}
                                      {entry.classType && <p className="text-xs mt-1">Elective: {entry.classType}</p>}
                                      {entry.department && <p className="text-xs mt-1">Dept: {entry.department}</p>}
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TimetableDisplay;
