import PendingTaskComponent from "@/components/timeSheet/PendingTaskComponent";
import TableComponent from "@/components/timeSheet/TableComponent";
import TimeSheetComponent from "@/components/timeSheet/TimeSheetComponent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import { callSoapService } from "@/api/callSoapService";
import { convertDataModelToStringData } from "@/utils/dataModelConverter";
import { AlertTriangleIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export const TimeSheetPage = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [selectedTask, setSelectedTask] = useState(null);
  const [timesheetsByDate, setTimesheetsByDate] = useState({});
  const [pendingChanges, setPendingChanges] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("timesheet-tab");
  const [showPopup, setShowPopup] = useState(false);
  const [activeUser, setActiveUser] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [nextTempRef, setNextTempRef] = useState(-1);
  const { userData } = useAuth();
  const { toast } = useToast();
  const datePickerRef = useRef(null);
  const timesheetScrollRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const rowHeight = 64;
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [resizingEvent, setResizingEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatDateKey = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const colorClasses = [
    "bg-blue-100 opacity-90",
    "bg-blue-200 opacity-90",
    "bg-blue-300 opacity-90",
    "bg-sky-100 opacity-90",
    "bg-sky-200 opacity-90",
    "bg-green-100 opacity-90",
    "bg-green-200 opacity-90",
    "bg-emerald-100 opacity-90",
    "bg-emerald-200 opacity-90",
    "bg-lime-100 opacity-90",
    "bg-yellow-100 opacity-90",
    "bg-amber-100 opacity-90",
    "bg-orange-100 opacity-90",
    "bg-red-100 opacity-90",
    "bg-rose-100 opacity-90",
    "bg-pink-100 opacity-90",
    "bg-purple-100 opacity-90",
    "bg-violet-100 opacity-90",
    "bg-indigo-100 opacity-90",
    "bg-fuchsia-100 opacity-90",
    "bg-teal-100 opacity-90",
    "bg-cyan-100 opacity-90",
    "bg-amber-50 opacity-95",
    "bg-rose-50 opacity-95",
    "bg-indigo-50 opacity-95",
    "bg-emerald-50 opacity-95",
    "bg-blue-400 opacity-70",
    "bg-green-400 opacity-70",
    "bg-purple-400 opacity-70",
    "bg-pink-400 opacity-70",
    "bg-gradient-to-br from-blue-100 to-blue-200 opacity-85",
    "bg-gradient-to-br from-green-100 to-teal-100 opacity-85",
    "bg-gradient-to-br from-purple-100 to-pink-100 opacity-85",
    "bg-gradient-to-br from-yellow-100 to-amber-100 opacity-85",
    "bg-cyan-200 opacity-85",
    "bg-lime-200 opacity-85",
    "bg-amber-200 opacity-85",
    "bg-violet-200 opacity-85",
    "bg-fuchsia-200 opacity-85",
    "bg-rose-200 opacity-85",
  ];

  const getRandomColor = () =>
    colorClasses[Math.floor(Math.random() * colorClasses.length)];

  const [taskDetails, setTaskDetails] = useState({
    REF_SERIAL_NO: -1,
    PROJECT_NO: "",
    dmsNo: "",
    EMP_NO: userData?.currentUserEmpNo || "",
    TASK_USER: selectedUser || userData?.userName || "",
    TASK_ID: "",
    TRANS_DATE: formatDateKey(new Date()),
    TASK_NAME: "",
    TOTAL_DURATION_MINUTES: null,
    TOTAL_DURATION_HOURS: null,
    TOTAL_HOURS: null,
    USER_NAME: userData?.userName || "",
    ENT_DATE: null,
    START_HOUR: 8,
    START_MINIUTE: 0,
    END_HOUR: 9,
    END_MINITUE: 0,
    NO_OF_HOURS: 0,
    NO_OF_MINUTES: 0,
    color: getRandomColor(),
    isCompleted: false,
    isNewBlock: false,
    isEditing: false,
  });

  useEffect(() => {
    setFilteredTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    fetchAllActiveUsers();
    fetchTasks();
    fetchTimeSheetData();
  }, [selectedDate, selectedUser]);

  useEffect(() => {
    if (activeTab === "timesheet-tab" && timesheetScrollRef.current) {
      timesheetScrollRef.current.scrollTop = 8 * rowHeight;
    }
  }, [activeTab, rowHeight]);

  useEffect(() => {
    setTaskDetails((prev) => ({
      ...prev,
      TASK_USER: selectedUser || userData?.userName || "",
    }));
  }, [selectedUser]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (pendingChanges.length > 0 && !loading) {
        // Only show alert if not saving
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pendingChanges, loading]); // Add loading to dependencies

  const fetchAllActiveUsers = async () => {
    try {
      if (!userData?.userName) return;

      const payload = {
        UserName: "",
      };
      const response = await callSoapService(
        userData.clientURL,
        "DMS_Get_All_ActiveUsers",
        payload
      );

      if (Array.isArray(response) && response.length > 0) {
        setActiveUser(response);
      } else {
        setActiveUser([]);
      }
    } catch (error) {
      console.error("Error fetching active users:", error);
      setActiveUser([]);
    }
  };

  const fetchTasks = async () => {
    try {
      if (!userData?.userName) return;

      const payload = {
        UserName: userData.userName,
      };
      const response = await callSoapService(
        userData.clientURL,
        "IM_Get_User_Tasks",
        payload
      );

      if (Array.isArray(response)) {
        // Initialize tasks with colors if they have matching events
        const updatedTasks = response.map((task) => {
          const matchingEvent = events.find(
            (ev) => ev.TASK_ID === task.TASK_ID
          );
          return matchingEvent ? { ...task, color: matchingEvent.color } : task;
        });
        setTasks(updatedTasks);
        setFilteredTasks(updatedTasks);
      } else {
        console.error("Expected array but got:", response);
        setTasks([]);
        setFilteredTasks([]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
      setFilteredTasks([]);
    }
  };

  const SaveServiceData = async (eventData) => {
    const newChange = {
      ...eventData,
      id: `${eventData.REF_SERIAL_NO}_${eventData.START_HOUR}_${eventData.START_MINIUTE}`,
      blockParentId: eventData.REF_SERIAL_NO,
      START_MINIUTE: Number(eventData.START_MINIUTE) || 0,
      END_MINITUE: Number(eventData.END_MINITUE) || 0,
      isNewBlock: eventData.isNewBlock || false,
      EMP_NO: userData?.userEmployeeNo || "",
    };

    setPendingChanges((prev) => {
      const filtered = prev.filter(
        (change) => change.REF_SERIAL_NO !== eventData.REF_SERIAL_NO
      );
      return [...filtered, newChange];
    });
    return newChange;
  };

  // helper to parse the .NET “/Date(…)/” format
  function parseDotNetDate(dotNetDate) {
    // extract the milliseconds
    const ms = parseInt(dotNetDate.match(/\d+/)[0], 10);
    const date = new Date(ms);

    // use local date components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`; // → "2025-06-23" in local time
  }

  const savePendingChanges = async () => {
    try {
      setLoading(true); // Set loading to true when saving starts
      const dateKey = formatDateKey(selectedDate);

      const changesToSave = [...pendingChanges];

      const changesByRef = changesToSave.reduce((acc, change) => {
        if (!acc[change.REF_SERIAL_NO]) {
          acc[change.REF_SERIAL_NO] = [];
        }
        acc[change.REF_SERIAL_NO].push(change);
        return acc;
      }, {});

      for (const refNo in changesByRef) {
        const changes = changesByRef[refNo];

        if (refNo > 0) {
          const deletePayload = {
            DataModelName: "TASK_TIME_SHEET",
            WhereCondition: `REF_SERIAL_NO=${refNo}`,
          };
          await callSoapService(
            userData.clientURL,
            "DataModel_DeleteData",
            deletePayload
          );
        }

        for (const change of changes) {
          if (
            typeof change.TRANS_DATE === "string" &&
            /^\/Date\(\d+\)\/$/.test(change.TRANS_DATE)
          ) {
            change.TRANS_DATE = parseDotNetDate(change.TRANS_DATE);
          }

          const convertedDataModel = convertDataModelToStringData(
            "TASK_TIME_SHEET",
            change
          );

          const payload = {
            UserName: userData.userName,
            DModelData: convertedDataModel,
          };

          const res = await callSoapService(
            userData.clientURL,
            "DataModel_SaveData",
            payload
          );

          if (change.REF_SERIAL_NO < 0) {
            const savedRefNo = parseInt(res);
            if (!isNaN(savedRefNo)) {
              setEvents((prev) =>
                prev.map((ev) =>
                  ev.REF_SERIAL_NO === change.REF_SERIAL_NO
                    ? { ...ev, REF_SERIAL_NO: savedRefNo }
                    : ev
                )
              );
              setTimesheetsByDate((prev) => ({
                ...prev,
                [dateKey]: prev[dateKey].map((ev) =>
                  ev.REF_SERIAL_NO === change.REF_SERIAL_NO
                    ? { ...ev, REF_SERIAL_NO: savedRefNo }
                    : ev
                ),
              }));
            }
          }
        }
      }

      toast({
        title: "Success",
        description: `Data saved successfully`,
      });

      setPendingChanges([]);
      return true;
    } catch (error) {
      console.error("Error saving pending changes:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSheetData = async () => {
    try {
      const payload = {
        DataModelName: "TASK_TIME_SHEET",
        WhereCondition: `TRANS_DATE='${formatDateKey(
          selectedDate
        )}' AND TASK_USER='${selectedUser || userData.userName}'`,
        Orderby: "",
      };

      const response = await callSoapService(
        userData.clientURL,
        "DataModel_GetData",
        payload
      );

      if (Array.isArray(response)) {
        const processedEvents = response.map((event) => {
          const durationMinutes = calculateDuration(
            parseInt(event.START_HOUR) || 8,
            Number(event.START_MINIUTE) || 0,
            parseInt(event.END_HOUR) || 9,
            Number(event.END_MINITUE) || 0
          );
          const durationHours = parseFloat((durationMinutes / 60).toFixed(2));

          return {
            ...event,
            id: event.REF_SERIAL_NO?.toString(),
            REF_SERIAL_NO: event.REF_SERIAL_NO || -1,
            START_HOUR: parseInt(event.START_HOUR) || 8,
            START_MINIUTE: Number(event.START_MINIUTE) || 0,
            END_HOUR: parseInt(event.END_HOUR) || 9,
            END_MINITUE: Number(event.END_MINITUE) || 0,
            color: getRandomColor(),
            isCompleted: false,
            TOTAL_DURATION_MINUTES: durationMinutes,
            TOTAL_DURATION_HOURS: durationHours,
            TOTAL_HOURS: durationHours,
            isNewBlock: false,
          };
        });

        setEvents(processedEvents);
        const dateKey = formatDateKey(selectedDate);
        setTimesheetsByDate((prev) => ({
          ...prev,
          [dateKey]: processedEvents,
        }));

        // Update tasks with colors from events
        const updatedTasks = tasks.map((task) => {
          const matchingEvent = processedEvents.find(
            (ev) => ev.TASK_ID === task.TASK_ID
          );
          return matchingEvent ? { ...task, color: matchingEvent.color } : task;
        });
        setTasks(updatedTasks);
        setFilteredTasks(updatedTasks);

        toast({
          title: "Success",
          description: "Timesheet data loaded successfully",
        });
      } else {
        console.error("Expected array but got:", response);
        setEvents([]);
        toast({
          title: "Warning",
          description: "No timesheet data found for selected date",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching timesheet data:", error);
      setEvents([]);
      toast({
        title: "Error",
        description: "Failed to fetch timesheet data",
        variant: "destructive",
      });
    }
  };

  const calculateDuration = (
    START_HOUR,
    START_MINIUTE,
    END_HOUR,
    END_MINITUE
  ) => {
    const startTotalMinutes =
      parseInt(START_HOUR, 10) * 60 + Number(START_MINIUTE);
    const endTotalMinutes = parseInt(END_HOUR, 10) * 60 + Number(END_MINITUE);
    const duration = endTotalMinutes - startTotalMinutes;
    return duration > 0 ? duration : 0;
  };

  const formatDuration = (durationInMinutes) => {
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    return `${hours} hr ${minutes} min`;
  };

  const formatTime = (hour, minute) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMinute = minute.toString().padStart(2, "0");
    return `${displayHour}:${displayMinute} ${ampm}`;
  };

  const handleDateSelect = async (date) => {
    if (isFutureDate(date)) {
      alert("You can only select today's date or earlier.");
      return;
    }

    if (pendingChanges.length > 0) {
      const confirmSave = window.confirm(
        "You have unsaved changes. Save before changing date?"
      );
      if (confirmSave) {
        const success = await savePendingChanges();
        if (!success) {
          alert("Failed to save changes. Please try again.");
          return;
        }
      }
    }

    setSelectedDate(date);
    if (datePickerRef.current) {
      datePickerRef.current.close();
    }
    fetchTimeSheetData();
  };

  const splitEventToHourBlocks = (event) => {
    if (!event) return [];
    const blocks = [];
    const startTotal =
      (event.START_HOUR || 0) * 60 + Number(event.START_MINIUTE || 0);
    const endTotal =
      (event.END_HOUR || 0) * 60 + Number(event.END_MINITUE || 0);

    let blockStart = startTotal;
    while (blockStart < endTotal) {
      const nextHour = Math.floor(blockStart / 60) + 1;
      const blockEnd = Math.min(nextHour * 60, endTotal);
      const startHour = Math.floor(blockStart / 60);
      const START_MINIUTE = blockStart % 60;
      const endHour =
        Math.floor((blockEnd - 1) / 60) + (blockEnd % 60 === 0 ? 0 : 1);
      const END_MINITUE =
        blockEnd === endTotal ? Number(event.END_MINITUE || 0) : 0;

      blocks.push({
        ...event,
        id: `${event.REF_SERIAL_NO}_${startHour}_${START_MINIUTE}`,
        blockParentId: event.REF_SERIAL_NO,
        blockStartHour: startHour,
        blockStartMinute: START_MINIUTE,
        blockEndHour:
          blockEnd === endTotal ? event.END_HOUR || 0 : startHour + 1,
        blockEndMinute: END_MINITUE,
        isNewBlock: false,
      });

      blockStart = blockEnd;
    }
    return blocks;
  };

  const handleEdit = (e, event) => {
    e.preventDefault();
    if (!event) return;

    setTaskDetails({
      ...event,
      START_HOUR: parseInt(event.START_HOUR) || 8,
      START_MINIUTE: Number(event.START_MINIUTE) || 0,
      END_HOUR: parseInt(event.END_HOUR) || 9,
      END_MINITUE: Number(event.END_MINITUE) || 0,
      TOTAL_DURATION_MINUTES: calculateDuration(
        parseInt(event.START_HOUR) || 8,
        Number(event.START_MINIUTE) || 0,
        parseInt(event.END_HOUR) || 9,
        Number(event.END_MINITUE) || 0
      ),
      TOTAL_DURATION_HOURS: parseFloat(
        (
          calculateDuration(
            parseInt(event.START_HOUR) || 8,
            Number(event.START_MINIUTE) || 0,
            parseInt(event.END_HOUR) || 9,
            Number(event.END_MINITUE) || 0
          ) / 60
        ).toFixed(2)
      ),
      REF_SERIAL_NO: event.REF_SERIAL_NO,
      isNewBlock: false,
      isEditing: true,
    });

    const foundTask = tasks.find((task) => task.TASK_NAME === event.TASK_NAME);
    setSelectedTask(foundTask || null);
    setShowPopup(true);
  };

  const handleSelectTask = (e, task) => {
    e.preventDefault();
    setSelectedTask(task);
    const currentRefNo = taskDetails.isEditing
      ? taskDetails.REF_SERIAL_NO
      : nextTempRef;

    setTaskDetails({
      ...taskDetails,
      TASK_NAME: task.TASK_NAME,
      TASK_ID: task.TASK_ID,
      PROJECT_NO: task.PROJECT_NO || "",
      dmsNo: task.dmsNo || "",
      REF_SERIAL_NO: currentRefNo,
      START_HOUR: taskDetails.START_HOUR || 8,
      END_HOUR: taskDetails.END_HOUR || 9,
      START_MINIUTE: Number(taskDetails.START_MINIUTE) || 0,
      END_MINITUE: Number(taskDetails.END_MINITUE) || 0,
      color: task.color || getRandomColor(),
      isNewBlock: !taskDetails.isEditing,
    });

    if (!taskDetails.isEditing) {
      setNextTempRef((prev) => prev - 1);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const startMins =
      parseInt(taskDetails.START_HOUR) * 60 +
      Number(taskDetails.START_MINIUTE || 0);
    const endMins =
      parseInt(taskDetails.END_HOUR) * 60 +
      Number(taskDetails.END_MINITUE || 0);

    if (startMins >= endMins) {
      alert("End time must be after start time.");
      return;
    }

    const totalDurationMinutes = endMins - startMins;
    const totalDurationHours = parseFloat(
      (totalDurationMinutes / 60).toFixed(2)
    );

    const hourBlocks = [];
    let currentStart = startMins;
    const endTime = endMins;

    while (currentStart < endTime) {
      const currentHour = Math.floor(currentStart / 60);
      const nextHourStart = (currentHour + 1) * 60;
      const blockEnd = Math.min(nextHourStart, endTime);

      hourBlocks.push({
        ...taskDetails,
        START_HOUR: Math.floor(currentStart / 60),
        START_MINIUTE: currentStart % 60,
        END_HOUR: Math.floor(blockEnd / 60),
        END_MINITUE: blockEnd % 60,
        NO_OF_MINUTES: blockEnd - currentStart,
        TRANS_DATE: taskDetails.TRANS_DATE || formatDateKey(selectedDate),
        NO_OF_HOURS: parseFloat(((blockEnd - currentStart) / 60).toFixed(2)),
        REF_SERIAL_NO:
          currentStart === startMins && !taskDetails.isNewBlock
            ? taskDetails.REF_SERIAL_NO
            : nextTempRef - hourBlocks.length,
        isNewBlock: currentStart !== startMins || taskDetails.isNewBlock,
      });

      currentStart = blockEnd;
    }

    const savedEvents = [];
    for (const block of hourBlocks) {
      const savedEvent = await SaveServiceData(block);
      savedEvents.push(savedEvent);
      if (block.isNewBlock) {
        setNextTempRef((prev) => prev - 1);
      }
    }

    const dateKey = formatDateKey(selectedDate);
    const existingEvents = (timesheetsByDate[dateKey] || []).filter(
      (e) => e.REF_SERIAL_NO !== taskDetails.REF_SERIAL_NO
    );

    setTimesheetsByDate((prev) => ({
      ...prev,
      [dateKey]: [...existingEvents, ...savedEvents],
    }));

    setEvents((prev) => [
      ...prev.filter((e) => e.REF_SERIAL_NO !== taskDetails.REF_SERIAL_NO),
      ...savedEvents,
    ]);

    // Update task color
    const savedEvent = savedEvents[0];
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.TASK_ID === taskDetails.TASK_ID
          ? { ...t, color: savedEvent.color }
          : t
      )
    );
    setFilteredTasks((prevFiltered) =>
      prevFiltered.map((t) =>
        t.TASK_ID === taskDetails.TASK_ID
          ? { ...t, color: savedEvent.color }
          : t
      )
    );

    handleClosePopup();
    setSelectedTask(null);
    toast({
      title: "Success",
      description: taskDetails.isEditing
        ? "Time entry updated successfully"
        : "Time entry saved successfully",
    });
  };

  const handleDrop = async (e, hour) => {
    e.preventDefault();

    const taskData = e.dataTransfer.getData("task");
    if (!taskData) return;

    const task = JSON.parse(taskData);

    const boundingRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - boundingRect.left;
    const width = boundingRect.width;

    const minuteOffset = Math.floor((mouseX / width) * 60);
    let START_MINIUTE = Math.floor(minuteOffset / 15) * 15;

    let START_HOUR = hour;
    let END_MINITUE = START_MINIUTE + 15;
    let END_HOUR = START_HOUR;

    if (END_MINITUE >= 60) {
      END_MINITUE = 0;
      END_HOUR += 1;
    }

    if (
      START_HOUR < 0 ||
      END_HOUR > 24 ||
      (END_HOUR === 24 && END_MINITUE > 0)
    ) {
      alert("Tasks can only be scheduled between 12 AM and 12 PM.");
      return;
    }

    const startTotalMinutes = START_HOUR * 60 + START_MINIUTE;
    const endTotalMinutes = END_HOUR * 60 + END_MINITUE;
    const NO_OF_MINUTES = endTotalMinutes - startTotalMinutes;
    const NO_OF_HOURS = parseFloat((NO_OF_MINUTES / 60).toFixed(2));

    const newEvent = {
      REF_SERIAL_NO: nextTempRef,
      TASK_ID: task.TASK_ID,
      TASK_NAME: task.TASK_NAME,
      PROJECT_NO: task.PROJECT_NO || "",
      dmsNo: task.dmsNo || "",
      EMP_NO: userData.currentUserEmpNo,
      TASK_USER: selectedUser || userData.userName,
      TRANS_DATE: formatDateKey(selectedDate),
      START_HOUR: START_HOUR,
      START_MINIUTE: START_MINIUTE,
      END_HOUR: END_HOUR,
      END_MINITUE: END_MINITUE,
      TOTAL_DURATION_MINUTES: NO_OF_MINUTES,
      TOTAL_DURATION_HOURS: NO_OF_HOURS,
      TOTAL_HOURS: NO_OF_HOURS,
      USER_NAME: userData.userName,
      ENT_DATE: new Date().toISOString(),
      NO_OF_MINUTES: NO_OF_MINUTES,
      NO_OF_HOURS: NO_OF_HOURS,
      color: getRandomColor(),
      isCompleted: false,
      isNewBlock: true,
      isEditing: false,
    };

    setNextTempRef((prev) => prev - 1);

    const overlappingEvent = events.some((event) => {
      const eventStart = event.START_HOUR * 60 + Number(event.START_MINIUTE);
      const eventEnd = event.END_HOUR * 60 + Number(event.END_MINITUE);
      return startTotalMinutes < eventEnd && endTotalMinutes > eventStart;
    });

    if (overlappingEvent) {
      alert("This time slot overlaps with another event.");
      return;
    }

    try {
      const savedEvent = await SaveServiceData(newEvent);

      // Update task color
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.TASK_ID === task.TASK_ID ? { ...t, color: savedEvent.color } : t
        )
      );

      setFilteredTasks((prevFiltered) =>
        prevFiltered.map((t) =>
          t.TASK_ID === task.TASK_ID ? { ...t, color: savedEvent.color } : t
        )
      );

      setTimesheetsByDate((prev) => ({
        ...prev,
        [savedEvent.TRANS_DATE]: [
          ...(prev[savedEvent.TRANS_DATE] || []),
          savedEvent,
        ],
      }));

      setEvents((prev) => [...prev, savedEvent]);
    } catch (error) {
      console.error("Error saving dropped task:", error);
      alert("Failed to save the task. Please try again.");
    }
  };

  const handleDeleteHourBlock = async (e, blockId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this hour block?")) {
      return;
    }

    let blockToDelete = null;
    let parentEvent = null;

    // Find the block and parent event to delete
    for (const event of events) {
      const blocks = splitEventToHourBlocks(event);
      const found = blocks.find((b) => b.id === blockId);
      if (found) {
        blockToDelete = found;
        parentEvent = event;
        break;
      }
    }

    if (!blockToDelete || !parentEvent) return;

    // Check if there are other events with the same TASK_ID
    const hasOtherEvents = events.some(
      (ev) =>
        ev.TASK_ID === parentEvent.TASK_ID &&
        ev.REF_SERIAL_NO !== parentEvent.REF_SERIAL_NO
    );

    if (parentEvent.REF_SERIAL_NO > 0) {
      const deletePayload = {
        DataModelName: "TASK_TIME_SHEET",
        WhereCondition: `REF_SERIAL_NO=${parentEvent.REF_SERIAL_NO}`,
      };

      try {
        await callSoapService(
          userData.clientURL,
          "DataModel_DeleteData",
          deletePayload
        );
      } catch (error) {
        console.error("Error deleting block:", error);
        toast({
          title: "Error",
          description: "Failed to delete the block from server",
          variant: "destructive",
        });
        return;
      }
    }

    // Remove the event from state
    setEvents((prev) =>
      prev.filter((ev) => ev.REF_SERIAL_NO !== parentEvent.REF_SERIAL_NO)
    );

    const dateKey = formatDateKey(selectedDate);
    setTimesheetsByDate((prev) => ({
      ...prev,
      [dateKey]: prev[dateKey].filter(
        (ev) => ev.REF_SERIAL_NO !== parentEvent.REF_SERIAL_NO
      ),
    }));

    // Update task color if there are no other events with the same TASK_ID
    if (!hasOtherEvents) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.TASK_ID === parentEvent.TASK_ID
            ? { ...task, color: undefined }
            : task
        )
      );
      setFilteredTasks((prevFiltered) =>
        prevFiltered.map((task) =>
          task.TASK_ID === parentEvent.TASK_ID
            ? { ...task, color: undefined }
            : task
        )
      );
    }

    toast({
      title: "Success",
      description: "Hour block deleted successfully",
    });
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setTaskDetails({
      REF_SERIAL_NO: nextTempRef,
      TASK_NAME: "",
      TASK_ID: "",
      PROJECT_NO: "",
      dmsNo: "",
      EMP_NO: userData.currentUserEmpNo,
      TASK_USER: userData.userName,
      TRANS_DATE: formatDateKey(new Date()),
      START_HOUR: 8,
      START_MINIUTE: 0,
      END_HOUR: 9,
      END_MINITUE: 0,
      NO_OF_HOURS: 0,
      NO_OF_MINUTES: 0,
      TOTAL_DURATION_MINUTES: null,
      TOTAL_DURATION_HOURS: null,
      TOTAL_HOURS: null,
      USER_NAME: userData.userName,
      ENT_DATE: null,
      color: getRandomColor(),
      isCompleted: false,
      isNewBlock: false,
      isEditing: false,
    });
    setSelectedTask(null);

    if (taskDetails.REF_SERIAL_NO <= 0) {
      setNextTempRef((prev) => prev - 1);
    }
  };

  const handleMouseDown = (hour) => {
    if (hour >= 24) return;
    setDragging(true);
    setDragStart(hour);
    setDragEnd(hour);
  };

  const handleMouseMove = (e, hour) => {
    if (!dragging) return;
    if (hour >= 24) return;
    if (hour !== dragEnd) setDragEnd(hour);
  };

  const handleMouseUp = () => {
    if (!dragging) return;
    setDragging(false);
    const start = Math.min(dragStart, dragEnd);
    const end = Math.max(dragStart, dragEnd) + 1;
    if (start >= 24 || end > 24) {
      alert("Tasks cannot start or end after 12 AM.");
      return;
    }
    setTaskDetails({
      REF_SERIAL_NO: nextTempRef,
      TASK_NAME: "",
      START_HOUR: start,
      START_MINIUTE: 0,
      END_HOUR: end,
      END_MINITUE: 0,
      color: getRandomColor(),
      isNewBlock: true,
      isEditing: false,
    });
    setNextTempRef((prev) => prev - 1);
    setShowPopup(true);
  };

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData("task", JSON.stringify(task));
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setDragImage(new Image(), 0, 0);
  };

  const checkOverlap = (newStartMinutes, newEndMinutes, currentRefNo) => {
    return events.some((event) => {
      if (event.REF_SERIAL_NO === currentRefNo) return false;
      const eventStart = event.START_HOUR * 60 + Number(event.START_MINIUTE);
      const eventEnd = event.END_HOUR * 60 + Number(event.END_MINITUE);
      return newStartMinutes < eventEnd && newEndMinutes > eventStart;
    });
  };

  const handleRightResizeMouseDown = (e, targetEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const initialX = e.clientX;
    const initialEndHour = targetEvent.END_HOUR;
    const initialEndMinute = Number(targetEvent.END_MINITUE) || 0;
    const initialStartHour = targetEvent.START_HOUR;
    const initialStartMinute = Number(targetEvent.START_MINIUTE) || 0;

    setResizingEvent({
      eventRefNo: targetEvent.REF_SERIAL_NO,
      direction: "right",
    });

    document.body.style.cursor = "e-resize";

    const onMouseMove = async (moveEvent) => {
      const deltaX = moveEvent.clientX - initialX;
      const sensitivity = Math.abs(deltaX) >= 60 ? 0.1 : 1;
      const pixelsPerMinute = 90 / 60;
      const movedMinutes = Math.round((deltaX * sensitivity) / pixelsPerMinute);
      const deltaStepMinutes = Math.round(movedMinutes / 15) * 15;

      const startTotalMinutes = initialStartHour * 60 + initialStartMinute;
      let newEndTotalMinutes =
        initialEndHour * 60 + initialEndMinute + deltaStepMinutes;

      if (newEndTotalMinutes <= startTotalMinutes + 15) {
        newEndTotalMinutes = startTotalMinutes + 15;
      }
      if (newEndTotalMinutes > 24 * 60) {
        newEndTotalMinutes = 24 * 60;
      }

      if (
        checkOverlap(
          startTotalMinutes,
          newEndTotalMinutes,
          targetEvent.REF_SERIAL_NO
        )
      ) {
        return;
      }

      // Split into hour blocks
      const hourBlocks = [];
      let currentStart = startTotalMinutes;
      const endTime = newEndTotalMinutes;

      while (currentStart < endTime) {
        const currentHour = Math.floor(currentStart / 60);
        const nextHourStart = (currentHour + 1) * 60;
        const blockEnd = Math.min(nextHourStart, endTime);

        hourBlocks.push({
          ...targetEvent,
          START_HOUR: Math.floor(currentStart / 60),
          START_MINIUTE: currentStart % 60,
          END_HOUR: Math.floor(blockEnd / 60),
          END_MINITUE: blockEnd % 60,
          NO_OF_MINUTES: blockEnd - currentStart,
          NO_OF_HOURS: parseFloat(((blockEnd - currentStart) / 60).toFixed(2)),
          REF_SERIAL_NO:
            currentStart === startTotalMinutes
              ? targetEvent.REF_SERIAL_NO
              : nextTempRef - hourBlocks.length,
          isNewBlock: currentStart !== startTotalMinutes,
        });

        currentStart = blockEnd;
      }

      // Save all hour blocks
      const savedEvents = [];
      for (const block of hourBlocks) {
        const savedEvent = await SaveServiceData(block);
        savedEvents.push(savedEvent);
        if (block.isNewBlock) {
          setNextTempRef((prev) => prev - 1);
        }
      }

      // Update state with the new blocks
      const dateKey = formatDateKey(selectedDate);
      const existingEvents = (timesheetsByDate[dateKey] || []).filter(
        (e) => e.REF_SERIAL_NO !== targetEvent.REF_SERIAL_NO
      );

      setTimesheetsByDate((prev) => ({
        ...prev,
        [dateKey]: [...existingEvents, ...savedEvents],
      }));

      setEvents((prev) => [
        ...prev.filter((e) => e.REF_SERIAL_NO !== targetEvent.REF_SERIAL_NO),
        ...savedEvents,
      ]);
    };

    const onMouseUp = () => {
      setResizingEvent(null);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "default";

      toast({
        title: "Changes made",
        description: "Don't forget to save your changes before switching dates",
        variant: "default",
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleLeftResizeMouseDown = (e, targetEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const initialX = e.clientX;
    const initialStartHour = targetEvent.START_HOUR;
    const initialStartMinute = Number(targetEvent.START_MINIUTE) || 0;
    const initialEndHour = targetEvent.END_HOUR;
    const initialEndMinute = Number(targetEvent.END_MINITUE) || 0;

    setResizingEvent({
      eventRefNo: targetEvent.REF_SERIAL_NO,
      direction: "left",
    });

    document.body.style.cursor = "w-resize";

    const onMouseMove = async (moveEvent) => {
      const deltaX = moveEvent.clientX - initialX;
      const sensitivity = Math.abs(deltaX) >= 60 ? 0.1 : 1;
      const pixelsPerMinute = 90 / 60;
      const movedMinutes = Math.round((deltaX * sensitivity) / pixelsPerMinute);
      const deltaStepMinutes = Math.round(movedMinutes / 15) * 15;

      const startTotalMinutes = initialStartHour * 60 + initialStartMinute;
      const endTotalMinutes = initialEndHour * 60 + initialEndMinute;
      let newStartTotalMinutes = startTotalMinutes + deltaStepMinutes;

      if (newStartTotalMinutes < 0) {
        newStartTotalMinutes = 0;
      }
      if (newStartTotalMinutes > endTotalMinutes - 15) {
        newStartTotalMinutes = endTotalMinutes - 15;
      }

      if (
        checkOverlap(
          newStartTotalMinutes,
          endTotalMinutes,
          targetEvent.REF_SERIAL_NO
        )
      ) {
        return;
      }

      // Split into hour blocks
      const hourBlocks = [];
      let currentStart = newStartTotalMinutes;
      const endTime = endTotalMinutes;

      while (currentStart < endTime) {
        const currentHour = Math.floor(currentStart / 60);
        const nextHourStart = (currentHour + 1) * 60;
        const blockEnd = Math.min(nextHourStart, endTime);

        hourBlocks.push({
          ...targetEvent,
          START_HOUR: Math.floor(currentStart / 60),
          START_MINIUTE: currentStart % 60,
          END_HOUR: Math.floor(blockEnd / 60),
          END_MINITUE: blockEnd % 60,
          NO_OF_MINUTES: blockEnd - currentStart,
          NO_OF_HOURS: parseFloat(((blockEnd - currentStart) / 60).toFixed(2)),
          REF_SERIAL_NO:
            currentStart === newStartTotalMinutes
              ? targetEvent.REF_SERIAL_NO
              : nextTempRef - hourBlocks.length,
          isNewBlock: currentStart !== newStartTotalMinutes,
        });

        currentStart = blockEnd;
      }

      // Save all hour blocks
      const savedEvents = [];
      for (const block of hourBlocks) {
        const savedEvent = await SaveServiceData(block);
        savedEvents.push(savedEvent);
        if (block.isNewBlock) {
          setNextTempRef((prev) => prev - 1);
        }
      }

      // Update state with the new blocks
      const dateKey = formatDateKey(selectedDate);
      const existingEvents = (timesheetsByDate[dateKey] || []).filter(
        (e) => e.REF_SERIAL_NO !== targetEvent.REF_SERIAL_NO
      );

      setTimesheetsByDate((prev) => ({
        ...prev,
        [dateKey]: [...existingEvents, ...savedEvents],
      }));

      setEvents((prev) => [
        ...prev.filter((e) => e.REF_SERIAL_NO !== targetEvent.REF_SERIAL_NO),
        ...savedEvents,
      ]);
    };

    const onMouseUp = () => {
      setResizingEvent(null);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "default";

      toast({
        title: "Changes made",
        description: "Don't forget to save your changes before switching dates",
        variant: "default",
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleDragMouseDown = (e, targetEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const initialY = e.clientY;
    const START_HOUR = targetEvent.START_HOUR;
    const START_MINIUTE = Number(targetEvent.START_MINIUTE);
    const END_HOUR = targetEvent.END_HOUR;
    const END_MINITUE = Number(targetEvent.END_MINITUE);
    const initialStartMinutes = START_HOUR * 60 + START_MINIUTE;
    const initialEndMinutes = END_HOUR * 60 + END_MINITUE;
    const duration = initialEndMinutes - initialStartMinutes;

    setResizingEvent({
      eventRefNo: targetEvent.REF_SERIAL_NO,
      direction: "move",
    });

    document.body.style.cursor = "grabbing";

    const onMouseMove = async (moveEvent) => {
      const deltaY = moveEvent.clientY - initialY;
      const pixelsPerMinute = rowHeight / 60;
      const movedMinutes = Math.round(deltaY / pixelsPerMinute);
      const deltaStepMinutes = Math.round(movedMinutes / 15) * 15;

      let newStartMinutes = initialStartMinutes + deltaStepMinutes;
      let newEndMinutes = newStartMinutes + duration;

      if (newStartMinutes < 0) {
        newStartMinutes = 0;
        newEndMinutes = duration;
      }
      if (newEndMinutes > 24 * 60) {
        newEndMinutes = 24 * 60;
        newStartMinutes = 24 * 60 - duration;
      }

      if (
        checkOverlap(newStartMinutes, newEndMinutes, targetEvent.REF_SERIAL_NO)
      ) {
        return;
      }

      // Split into hour blocks
      const hourBlocks = [];
      let currentStart = newStartMinutes;
      const endTime = newEndMinutes;

      while (currentStart < endTime) {
        const currentHour = Math.floor(currentStart / 60);
        const nextHourStart = (currentHour + 1) * 60;
        const blockEnd = Math.min(nextHourStart, endTime);

        hourBlocks.push({
          ...targetEvent,
          START_HOUR: Math.floor(currentStart / 60),
          START_MINIUTE: currentStart % 60,
          END_HOUR: Math.floor(blockEnd / 60),
          END_MINITUE: blockEnd % 60,
          NO_OF_MINUTES: blockEnd - currentStart,
          NO_OF_HOURS: parseFloat(((blockEnd - currentStart) / 60).toFixed(2)),
          REF_SERIAL_NO:
            currentStart === newStartMinutes
              ? targetEvent.REF_SERIAL_NO
              : nextTempRef - hourBlocks.length,
          isNewBlock: currentStart !== newStartMinutes,
        });

        currentStart = blockEnd;
      }

      // Save all hour blocks
      const savedEvents = [];
      for (const block of hourBlocks) {
        const savedEvent = await SaveServiceData(block);
        savedEvents.push(savedEvent);
        if (block.isNewBlock) {
          setNextTempRef((prev) => prev - 1);
        }
      }

      // Update state with the new blocks
      const dateKey = formatDateKey(selectedDate);
      const existingEvents = (timesheetsByDate[dateKey] || []).filter(
        (e) => e.REF_SERIAL_NO !== targetEvent.REF_SERIAL_NO
      );

      setTimesheetsByDate((prev) => ({
        ...prev,
        [dateKey]: [...existingEvents, ...savedEvents],
      }));

      setEvents((prev) => [
        ...prev.filter((e) => e.REF_SERIAL_NO !== targetEvent.REF_SERIAL_NO),
        ...savedEvents,
      ]);
    };

    const onMouseUp = () => {
      setResizingEvent(null);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "default";

      toast({
        title: "Changes made",
        description: "Don't forget to save your changes before switching dates",
        variant: "default",
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const handleFillHourRight = async (e, blockStartHour, blockStartMinute) => {
    e.preventDefault();
    e.stopPropagation();

    // Find all blocks that belong to the same parent event
    const parentBlocks = events.filter(
      (event) =>
        event.blockParentId &&
        event.START_HOUR === blockStartHour &&
        Number(event.START_MINIUTE) === Number(blockStartMinute)
    );

    if (!parentBlocks.length) return;

    // Get the parent ID (either REF_SERIAL_NO or blockParentId)
    const parentId =
      parentBlocks[0].blockParentId || parentBlocks[0].REF_SERIAL_NO;

    // Find the last block of this event
    const lastBlock = [...parentBlocks].sort((a, b) => {
      const aEnd = a.END_HOUR * 60 + Number(a.END_MINITUE);
      const bEnd = b.END_HOUR * 60 + Number(b.END_MINITUE);
      return bEnd - aEnd;
    })[0];

    // Calculate potential new end time (next hour mark)
    const potentialNewEndHour = lastBlock.END_HOUR + 1;
    const potentialNewEndMinute = 0;
    const potentialNewEndTotalMinutes =
      potentialNewEndHour * 60 + potentialNewEndMinute;

    // Find the earliest start time of any event that comes after our last block
    let earliestNextEventStart = 24 * 60; // Initialize with end of day

    events.forEach((event) => {
      if (event.REF_SERIAL_NO === parentId) return; // Skip our own event

      const eventStart = event.START_HOUR * 60 + Number(event.START_MINIUTE);
      const eventEnd = event.END_HOUR * 60 + Number(event.END_MINITUE);

      // If event is after our last block but starts before our potential new end
      if (
        eventStart >
        lastBlock.END_HOUR * 60 + Number(lastBlock.END_MINITUE)
      ) {
        if (eventStart < earliestNextEventStart) {
          earliestNextEventStart = eventStart;
        }
      }
    });

    // Determine the actual new end time - either the next hour mark or the start of the next event
    const newEndTotalMinutes = Math.min(
      potentialNewEndTotalMinutes,
      earliestNextEventStart
    );

    // If we can't extend at all (already at next event's start)
    if (
      newEndTotalMinutes <=
      lastBlock.END_HOUR * 60 + Number(lastBlock.END_MINITUE)
    ) {
      toast({
        title: "Cannot extend",
        description: "Event is already adjacent to another event",
        variant: "default",
      });
      return;
    }

    const newEndHour = Math.floor(newEndTotalMinutes / 60);
    const newEndMinute = newEndTotalMinutes % 60;

    // Update the last block
    const updatedLastBlock = {
      ...lastBlock,
      END_HOUR: newEndHour,
      END_MINITUE: newEndMinute,
      NO_OF_MINUTES:
        newEndTotalMinutes -
        (lastBlock.START_HOUR * 60 + Number(lastBlock.START_MINIUTE)),
      NO_OF_HOURS: parseFloat(
        (
          (newEndTotalMinutes -
            (lastBlock.START_HOUR * 60 + Number(lastBlock.START_MINIUTE))) /
          60
        ).toFixed(2)
      ),
      isNewBlock: false,
    };

    // Update state
    setEvents((prev) =>
      prev.map((ev) =>
        ev.REF_SERIAL_NO === lastBlock.REF_SERIAL_NO ? updatedLastBlock : ev
      )
    );

    const dateKey = formatDateKey(selectedDate);
    setTimesheetsByDate((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).map((ev) =>
        ev.REF_SERIAL_NO === lastBlock.REF_SERIAL_NO ? updatedLastBlock : ev
      ),
    }));

    await SaveServiceData(updatedLastBlock);

    toast({
      title: "Event extended",
      description: `Extended to ${formatTime(newEndHour, newEndMinute)}`,
      variant: "default",
    });
  };

  const handleFillHourLeft = async (e, blockStartHour, blockStartMinute) => {
    e.preventDefault();
    e.stopPropagation();

    // Find all blocks that belong to the same parent event
    const parentBlocks = events.filter(
      (event) =>
        event.blockParentId &&
        event.START_HOUR === blockStartHour &&
        Number(event.START_MINIUTE) === Number(blockStartMinute)
    );

    if (!parentBlocks.length) return;

    // Get the parent ID (either REF_SERIAL_NO or blockParentId)
    const parentId =
      parentBlocks[0].blockParentId || parentBlocks[0].REF_SERIAL_NO;

    // Find the first block of this event
    const firstBlock = [...parentBlocks].sort((a, b) => {
      const aStart = a.START_HOUR * 60 + Number(a.START_MINIUTE);
      const bStart = b.START_HOUR * 60 + Number(b.START_MINIUTE);
      return aStart - bStart;
    })[0];

    // Calculate potential new start time (previous hour mark)
    const potentialNewStartHour = firstBlock.START_HOUR;
    const potentialNewStartMinute = 0;
    const potentialNewStartTotalMinutes =
      potentialNewStartHour * 60 + potentialNewStartMinute;

    // Find the latest end time of any event that comes before our first block
    let latestPreviousEventEnd = 0; // Initialize with start of day

    events.forEach((event) => {
      if (event.REF_SERIAL_NO === parentId) return; // Skip our own event

      const eventStart = event.START_HOUR * 60 + Number(event.START_MINIUTE);
      const eventEnd = event.END_HOUR * 60 + Number(event.END_MINITUE);

      // If event is before our first block but ends after our potential new start
      if (
        eventEnd <
        firstBlock.START_HOUR * 60 + Number(firstBlock.START_MINIUTE)
      ) {
        if (eventEnd > latestPreviousEventEnd) {
          latestPreviousEventEnd = eventEnd;
        }
      }
    });

    // Determine the actual new start time - either the hour mark or the end of the previous event
    const newStartTotalMinutes = Math.max(
      potentialNewStartTotalMinutes,
      latestPreviousEventEnd
    );

    // If we can't extend at all (already at previous event's end)
    if (
      newStartTotalMinutes >=
      firstBlock.START_HOUR * 60 + Number(firstBlock.START_MINIUTE)
    ) {
      toast({
        title: "Cannot extend",
        description: "Event is already adjacent to another event",
        variant: "default",
      });
      return;
    }

    const newStartHour = Math.floor(newStartTotalMinutes / 60);
    const newStartMinute = newStartTotalMinutes % 60;

    // Update the first block
    const updatedFirstBlock = {
      ...firstBlock,
      START_HOUR: newStartHour,
      START_MINIUTE: newStartMinute,
      NO_OF_MINUTES:
        firstBlock.END_HOUR * 60 +
        Number(firstBlock.END_MINITUE) -
        newStartTotalMinutes,
      NO_OF_HOURS: parseFloat(
        (
          (firstBlock.END_HOUR * 60 +
            Number(firstBlock.END_MINITUE) -
            newStartTotalMinutes) /
          60
        ).toFixed(2)
      ),
      isNewBlock: false,
    };

    // Update state
    setEvents((prev) =>
      prev.map((ev) =>
        ev.REF_SERIAL_NO === firstBlock.REF_SERIAL_NO ? updatedFirstBlock : ev
      )
    );

    const dateKey = formatDateKey(selectedDate);
    setTimesheetsByDate((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).map((ev) =>
        ev.REF_SERIAL_NO === firstBlock.REF_SERIAL_NO ? updatedFirstBlock : ev
      ),
    }));

    await SaveServiceData(updatedFirstBlock);

    toast({
      title: "Event extended",
      description: `Extended to start at ${formatTime(
        newStartHour,
        newStartMinute
      )}`,
      variant: "default",
    });
  };

  const handleEditBlock = (e, block, parentEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const fullEvent = events.find(
      (ev) => ev.REF_SERIAL_NO === parentEvent.REF_SERIAL_NO
    );
    if (!fullEvent) return;

    setTaskDetails({
      ...fullEvent,
      START_HOUR: parseInt(fullEvent.START_HOUR) || 8,
      START_MINIUTE: Number(fullEvent.START_MINIUTE) || 0,
      END_HOUR: parseInt(fullEvent.END_HOUR) || 9,
      END_MINITUE: Number(fullEvent.END_MINITUE) || 0,
      TOTAL_DURATION_MINUTES: calculateDuration(
        parseInt(fullEvent.START_HOUR) || 8,
        Number(fullEvent.START_MINIUTE) || 0,
        parseInt(fullEvent.END_HOUR) || 9,
        Number(fullEvent.END_MINITUE) || 0
      ),
      TOTAL_DURATION_HOURS: parseFloat(
        (
          calculateDuration(
            parseInt(fullEvent.START_HOUR) || 8,
            Number(fullEvent.START_MINIUTE) || 0,
            parseInt(fullEvent.END_HOUR) || 9,
            Number(fullEvent.END_MINITUE) || 0
          ) / 60
        ).toFixed(2)
      ),
      REF_SERIAL_NO: fullEvent.REF_SERIAL_NO,
      isNewBlock: false,
      isEditing: true,
    });

    const foundTask = tasks.find(
      (task) => task.TASK_NAME === fullEvent.TASK_NAME
    );
    setSelectedTask(foundTask || null);
    setShowPopup(true);
  };

  const parseDateFromString = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) return date.toLocaleDateString();

    const match = dateString.match(/\/Date\((\d+)\)\//);
    if (match) {
      return new Date(parseInt(match[1])).toLocaleDateString();
    }

    return "N/A";
  };

  const updateEventInStorage = (updatedEvent) => {
    const dateKey = formatDateKey(selectedDate);

    setTimesheetsByDate((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).map((event) =>
        event.REF_SERIAL_NO === updatedEvent.REF_SERIAL_NO
          ? updatedEvent
          : event
      ),
    }));

    setEvents((prev) =>
      prev.map((event) =>
        event.REF_SERIAL_NO === updatedEvent.REF_SERIAL_NO
          ? updatedEvent
          : event
      )
    );
  };

  return (
    <form>
      <div className="flex flex-col md:flex-row w-[100%] h-full">
        <PendingTaskComponent
          tasks={tasks}
          selectedUser={selectedUser}
          activeUser={activeUser}
          setSelectedUser={setSelectedUser}
          handleDragStart={handleDragStart}
          handleSelectTask={handleSelectTask}
          events={events}
          formatDateKey={formatDateKey}
          selectedDate={selectedDate}
          userData={userData}
        />

        <div
          className="w-full md:w-[80%] bg-transparent h-full"
          style={{ minHeight: "400px" }}
        >
          <div className="flex border-b border-gray-300">
            <input
              type="radio"
              name="my_tabs_3"
              id="timesheet-tab"
              className="hidden"
              checked={activeTab === "timesheet-tab"}
              onChange={() => setActiveTab("timesheet-tab")}
            />
            <label
              htmlFor="timesheet-tab"
              className={`px-4 py-2 font-bold border-b-2 text-xs cursor-pointer ${
                activeTab === "timesheet-tab"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600"
              }`}
            >
              TimeSheet
            </label>

            <input
              type="radio"
              name="my_tabs_3"
              id="table-tab"
              className="hidden"
              checked={activeTab === "table-tab"}
              onChange={() => setActiveTab("table-tab")}
            />
            <label
              htmlFor="table-tab"
              className={`px-4 py-2 font-bold border-b-2 text-xs cursor-pointer ${
                activeTab === "table-tab"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600"
              }`}
            >
              Table
            </label>
          </div>

          {activeTab === "timesheet-tab" ? (
            <TimeSheetComponent
              selectedDate={selectedDate}
              events={events}
              tasks={tasks}
              rowHeight={rowHeight}
              handleDateSelect={handleDateSelect}
              handleDrop={handleDrop}
              handleMouseDown={handleMouseDown}
              handleMouseMove={handleMouseMove}
              handleMouseUp={handleMouseUp}
              dragging={dragging}
              dragStart={dragStart}
              dragEnd={dragEnd}
              handleEditBlock={handleEditBlock}
              handleDeleteHourBlock={handleDeleteHourBlock}
              handleRightResizeMouseDown={handleRightResizeMouseDown}
              handleLeftResizeMouseDown={handleLeftResizeMouseDown}
              handleDragMouseDown={handleDragMouseDown}
              handleFillHourRight={handleFillHourRight}
              handleFillHourLeft={handleFillHourLeft}
              datePickerRef={datePickerRef}
              isFutureDate={isFutureDate}
              pendingChanges={pendingChanges}
              savePendingChanges={savePendingChanges}
              fetchTimeSheetData={fetchTimeSheetData}
              formatTime={formatTime}
              calculateDuration={calculateDuration}
              formatDuration={formatDuration}
              splitEventToHourBlocks={splitEventToHourBlocks}
              timesheetScrollRef={timesheetScrollRef}
            />
          ) : (
            <TableComponent
              events={events}
              handleEdit={handleEdit}
              userData={userData}
              toast={toast}
              selectedDate={selectedDate}
              setEvents={setEvents}
              setTimesheetsByDate={setTimesheetsByDate}
              formatDateKey={formatDateKey}
              parseDateFromString={parseDateFromString}
              calculateDuration={calculateDuration}
              formatDuration={formatDuration}
              formatTime={formatTime}
            />
          )}
        </div>
      </div>

      {showPopup && (
        <Dialog open={showPopup} onOpenChange={setShowPopup}>
          <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {taskDetails.isEditing ? "Update Task" : "Add Task"}
                {taskDetails.REF_SERIAL_NO}
              </DialogTitle>
            </DialogHeader>
            <div className="">
              <div className="space-y-4 w-[80%] ">
                <Input
                  type="text"
                  value={taskDetails.TASK_NAME}
                  placeholder="Search For A Task..."
                  className=""
                  onChange={(e) => {
                    setTaskDetails({
                      ...taskDetails,
                      TASK_NAME: e.target.value,
                    });
                    const keyword = e.target.value.toLowerCase();
                    setFilteredTasks(
                      tasks.filter((task) =>
                        task.TASK_NAME?.toLowerCase().includes(keyword)
                      )
                    );
                  }}
                />
                {filteredTasks.filter((task) => task.STATUS === "NEW").length >
                0 ? (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 h-36 overflow-y-auto w-full space-y-2">
                    {filteredTasks
                      .filter((task) => task.STATUS === "NEW")
                      .map((task) => (
                        <Button
                          key={task.TASK_ID}
                          variant={
                            selectedTask?.TASK_ID === task.TASK_ID
                              ? "secondary"
                              : "ghost"
                          }
                          className={`w-full justify-between ${
                            selectedTask?.TASK_ID === task.TASK_ID
                              ? "bg-blue-100 dark:bg-blue-900"
                              : ""
                          }`}
                          onClick={(e) => handleSelectTask(e, task)}
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-semibold">
                              {task.TASK_NAME}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              TASK ID: {task.TASK_ID}
                            </span>
                          </div>
                          <Badge
                            variant={
                              task.STATUS === "Pending"
                                ? "warning"
                                : task.STATUS === "In Progress"
                                ? "default"
                                : "outline"
                            }
                            className="flex items-center gap-1"
                          >
                            <span>{task.STATUS}</span>
                            <AlertTriangleIcon className="w-3 h-3" />
                          </Badge>
                        </Button>
                      ))}
                  </div>
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-24 flex items-center justify-center text-muted-foreground">
                    No pending tasks available
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <div className="flex gap-2">
                    <Select
                      value={taskDetails.START_HOUR?.toString() ?? "8"}
                      onValueChange={(value) => {
                        const hour24 = Number(value);
                        const suffix = hour24 >= 12 ? "PM" : "AM";
                        const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

                        setTaskDetails((prev) => ({
                          ...prev,
                          START_HOUR: hour24,
                          timeSuffixStart: suffix,
                          formattedStartTime: `${hour12}:${
                            prev.START_MINIUTE?.toString().padStart(2, "0") ||
                            "00"
                          } ${suffix}`,
                        }));

                        if (
                          hour24 > (prev.END_HOUR ?? 17) ||
                          (hour24 === prev.END_HOUR &&
                            (prev.START_MINIUTE ?? 0) > (prev.END_MINITUE ?? 0))
                        ) {
                          const newEndTime = Math.min(hour24 + 1, 24);
                          setTaskDetails((prev) => ({
                            ...prev,
                            END_HOUR: newEndTime,
                            END_MINITUE:
                              newEndTime === 24 ? 0 : prev.END_MINITUE ?? 0,
                            timeSuffixEnd: newEndTime >= 12 ? "PM" : "AM",
                            formattedEndTime: `${
                              newEndTime % 12 === 0 ? 12 : newEndTime % 12
                            }:${
                              newEndTime === 24
                                ? "00"
                                : prev.END_MINITUE?.toString().padStart(
                                    2,
                                    "0"
                                  ) || "00"
                            } ${suffix}`,
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select start hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour12 = i % 12 === 0 ? 12 : i % 12;
                          return (
                            <SelectItem key={i} value={i.toString()}>
                              {hour12} {i >= 12 ? "PM" : "AM"}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-1">
                      {[0, 15, 30, 45].map((min) => (
                        <Button
                          type="button"
                          variant={
                            Number(taskDetails.START_MINIUTE) === min
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          key={min}
                          className="px-2"
                          onClick={() => {
                            const minuteValue = Number(min);
                            setTaskDetails((prev) => ({
                              ...prev,
                              START_MINIUTE: minuteValue,
                              formattedStartTime: `${
                                prev.START_HOUR % 12 === 0
                                  ? 12
                                  : prev.START_HOUR % 12
                              }:${min.toString().padStart(2, "0")} ${
                                prev.timeSuffixStart
                              }`,
                            }));

                            if (
                              prev.START_HOUR === prev.END_HOUR &&
                              minuteValue > (prev.END_MINITUE ?? 0)
                            ) {
                              setTaskDetails((prev) => ({
                                ...prev,
                                END_MINITUE: minuteValue,
                                formattedEndTime: `${
                                  prev.END_HOUR % 12 === 0
                                    ? 12
                                    : prev.END_HOUR % 12
                                }:${min.toString().padStart(2, "0")} ${
                                  prev.timeSuffixEnd
                                }`,
                              }));
                            }
                          }}
                        >
                          {min.toString().padStart(2, "0")}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>End Time</Label>
                  <div className="flex gap-2">
                    <Select
                      value={taskDetails.END_HOUR?.toString() ?? "17"}
                      onValueChange={(value) => {
                        const hour24 = Number(value);
                        const suffix = hour24 >= 12 ? "PM" : "AM";
                        const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

                        if (hour24 < taskDetails.START_HOUR) {
                          toast({
                            title: "Invalid Time",
                            description:
                              "End Time cannot be earlier than Start Time.",
                            variant: "destructive",
                          });
                          return;
                        }

                        setTaskDetails((prev) => ({
                          ...prev,
                          END_HOUR: hour24,
                          timeSuffixEnd: suffix,
                          END_MINITUE:
                            hour24 === 24 ? 0 : prev.END_MINITUE ?? 0,
                          formattedEndTime: `${hour12}:${
                            hour24 === 24
                              ? "00"
                              : prev.END_MINITUE?.toString().padStart(2, "0") ||
                                "00"
                          } ${suffix}`,
                        }));
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select end hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour12 = i % 12 === 0 ? 12 : i % 12;
                          return (
                            <SelectItem key={i} value={i.toString()}>
                              {hour12} {i >= 12 ? "PM" : "AM"}
                            </SelectItem>
                          );
                        })}
                        <SelectItem value="24">12 AM</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-1">
                      {[0, 15, 30, 45].map((min) => {
                        const minuteValue = Number(min);
                        const is12AM = taskDetails.END_HOUR === 24;
                        const isDisabled = is12AM && minuteValue !== 0;
                        const isSelected =
                          Number(taskDetails.END_MINITUE) === minuteValue;

                        return (
                          <Button
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            key={min}
                            className="px-2"
                            disabled={isDisabled}
                            onClick={() => {
                              if (
                                taskDetails.START_HOUR ===
                                  taskDetails.END_HOUR &&
                                minuteValue < (taskDetails.START_MINIUTE ?? 0)
                              ) {
                                toast({
                                  title: "Invalid Time",
                                  description:
                                    "End Time cannot be earlier than Start Time.",
                                  variant: "destructive",
                                });
                                return;
                              }

                              setTaskDetails((prev) => ({
                                ...prev,
                                END_MINITUE: minuteValue,
                                formattedEndTime: `${
                                  prev.END_HOUR % 12 === 0
                                    ? 12
                                    : prev.END_HOUR % 12
                                }:${min.toString().padStart(2, "0")} ${
                                  prev.timeSuffixEnd
                                }`,
                              }));
                            }}
                          >
                            {min.toString().padStart(2, "0")}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className={"w-[80%]"}>
              <Button variant="outline" onClick={handleClosePopup}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {taskDetails.isEditing ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </form>
  );
}
