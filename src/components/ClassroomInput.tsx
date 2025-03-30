
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash } from "lucide-react";
import { toast } from "sonner";
import { Classroom } from "../types/timetable";

interface ClassroomInputProps {
  classrooms: Classroom[];
  onClassroomsChange: (classrooms: Classroom[]) => void;
}

const ClassroomInput = ({ classrooms, onClassroomsChange }: ClassroomInputProps) => {
  const [roomNumber, setRoomNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [type, setType] = useState<"Lecture" | "Tutorial" | "Lab" | "All">("Lecture");
  
  const handleAddClassroom = () => {
    if (!roomNumber) {
      toast.error("Room number is required");
      return;
    }
    
    if (!capacity || isNaN(parseInt(capacity)) || parseInt(capacity) <= 0) {
      toast.error("Capacity must be a positive number");
      return;
    }
    
    const newClassroom: Classroom = {
      roomNumber,
      capacity: parseInt(capacity),
      type
    };
    
    const updatedClassrooms = [...classrooms, newClassroom];
    onClassroomsChange(updatedClassrooms);
    toast.success("Classroom added successfully");
    
    // Reset form
    setRoomNumber("");
    setCapacity("");
    setType("Lecture");
  };
  
  const handleRemoveClassroom = (index: number) => {
    const updatedClassrooms = [...classrooms];
    updatedClassrooms.splice(index, 1);
    onClassroomsChange(updatedClassrooms);
    toast.success("Classroom removed successfully");
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Manual Classroom Entry</CardTitle>
        <CardDescription>
          Add classrooms manually if you didn't upload a classroom CSV file
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="roomNumber">Room Number</Label>
              <Input
                id="roomNumber"
                placeholder="A101"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                placeholder="60"
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="type">Room Type</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as "Lecture" | "Tutorial" | "Lab" | "All")}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lecture">Lecture</SelectItem>
                  <SelectItem value="Tutorial">Tutorial</SelectItem>
                  <SelectItem value="Lab">Lab</SelectItem>
                  <SelectItem value="All">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddClassroom} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Classroom
              </Button>
            </div>
          </div>
          
          {classrooms.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Added Classrooms ({classrooms.length})</h3>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Room Number</th>
                      <th className="text-left p-2">Capacity</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-center p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classrooms.map((classroom, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{classroom.roomNumber}</td>
                        <td className="p-2">{classroom.capacity}</td>
                        <td className="p-2">{classroom.type}</td>
                        <td className="p-2 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveClassroom(index)}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassroomInput;
