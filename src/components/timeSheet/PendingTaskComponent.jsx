import { AlertTriangleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PendingTaskComponent({
  tasks,
  selectedUser,
  activeUser,
  setSelectedUser,
  handleDragStart,
  handleSelectTask,
  userData
}) {
  return (
    <div className="w-full md:w-[20%] h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between gap-2 pr-3">
        <img
          src="https://img.freepik.com/premium-vector/user-circle-with-blue-gradient-circle_78370-4727.jpg?semt=ais_hybrid&w=740"
          alt="logo"
          className="w-10 h-10 border object-cover border-gray-300 rounded-full"
        />
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="w-full truncate">
            <SelectValue placeholder="Select User" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Array.isArray(activeUser) &&
                activeUser.map((user) => {
                  const username =
                    user.domain_user_name || user.user_name || "Unknown";
                  const empNo = user.emp_no || "N/A";
                  return (
                    <SelectItem key={username + empNo} value={username}>
                      {username} ({empNo})
                    </SelectItem>
                  );
                })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="pending" className="w-full mt-2">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent
          value="pending"
          className="mt-2"
          disabled={activeUser.domain_user_name === userData.currentUser}
        >
          {Array.isArray(tasks) &&
          tasks.filter((task) => task.STATUS === "NEW").length === 0 ? (
            <div className="p-4 text-xs text-center text-gray-500">
              No pending tasks
            </div>
          ) : (
            Array.isArray(tasks) &&
            tasks
              .filter((task) => task.STATUS === "NEW")
              .map((task) => (
                <div
                  key={task.TASK_ID}
                  className={`
                    ${task.color || "bg-transparent"}
                    flex items-center mb-1 justify-between text-black dark:text-white dark:hover:bg-gray-800 px-4 py-2 border border-gray-400
                    hover:bg-blue-100 transition-all duration-300 rounded shadow-sm hover:shadow-md cursor-pointer
                  `}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onClick={(e) => handleSelectTask(e, task)}
                >
                  <div className="flex text-xs text-gray-500 dark:text-gray-600 items-center gap-2">
                    <div className="w-3 h-3 rounded-full text-xs animate-pulse bg-blue-500" />
                    <p className="font-medium">{task.TASK_NAME}</p>
                  </div>
                </div>
              ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-2">
          {Array.isArray(tasks) &&
          tasks.filter((task) => task.STATUS !== "NEW").length === 0 ? (
            <div className="p-4 text-xs text-center text-gray-500">
              No completed tasks
            </div>
          ) : (
            Array.isArray(tasks) &&
            tasks
              .filter((task) => task.STATUS !== "NEW")
              .map((task) => (
                <div
                  key={task.TASK_ID}
                  className="flex items-center text-xs mb-1 justify-between px-4 py-2 border border-gray-400 hover:bg-green-50 transition-all duration-300 rounded-md shadow-sm hover:shadow-md cursor-pointer"
                >
                  <div className="flex items-center text-gray-500 items-center justify-center dark:text-gray-600 text-xs gap-2">
                    <div className="w-3 h-3 rounded-full text-xs bg-green-500 animate-pulse" />
                    <p className="font-medium">{task.TASK_NAME}</p>
                  </div>
                </div>
              ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}