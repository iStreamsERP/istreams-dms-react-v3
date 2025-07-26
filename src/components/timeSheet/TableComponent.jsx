import { callSoapService } from "@/api/callSoapService";
import { Trash2Icon } from "lucide-react";

export default function TableComponent({
  events,
  handleEdit,
  userData,
  toast,
  selectedDate,
  setEvents,
  setTimesheetsByDate,
  formatDateKey,
  parseDateFromString,
  calculateDuration,
  formatDuration,
  formatTime
}) {
  // First ensure all time values are numbers
  const normalizedEvents = events.map(event => ({
    ...event,
    START_HOUR: Number(event.START_HOUR) || 0,
    START_MINIUTE: Number(event.START_MINIUTE) || 0,
    END_HOUR: Number(event.END_HOUR) || 0,
    END_MINITUE: Number(event.END_MINITUE) || 0
  }));

  // Group events by REF_SERIAL_NO
  const groupedEvents = normalizedEvents.reduce((acc, event) => {
    const refNo = event.REF_SERIAL_NO;
    if (!acc[refNo]) {
      acc[refNo] = [];
    }
    acc[refNo].push(event);
    return acc;
  }, {});

  // Process grouped events to create combined rows
  const combinedRows = Object.entries(groupedEvents).map(([refNo, events]) => {
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => {
      const aStart = a.START_HOUR * 60 + a.START_MINIUTE;
      const bStart = b.START_HOUR * 60 + b.START_MINIUTE;
      return aStart - bStart;
    });

    const firstEvent = sortedEvents[0];
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    
    // Calculate total duration by summing each individual event's duration
    const totalMinutes = sortedEvents.reduce((sum, event) => {
      const start = event.START_HOUR * 60 + event.START_MINIUTE;
      const end = event.END_HOUR * 60 + event.END_MINITUE;
      // Ensure duration is never negative
      const duration = Math.max(0, end - start);
      return sum + duration;
    }, 0);

    return {
      ...firstEvent,
      REF_SERIAL_NO: refNo,
      START_HOUR: firstEvent.START_HOUR,
      START_MINIUTE: firstEvent.START_MINIUTE,
      END_HOUR: lastEvent.END_HOUR,
      END_MINITUE: lastEvent.END_MINITUE,
      TOTAL_DURATION_MINUTES: totalMinutes,
      TOTAL_HOURS: parseFloat((totalMinutes / 60).toFixed(2)),
      childEvents: sortedEvents,
      isCombined: sortedEvents.length > 1
    };
  });

  // Helper function to calculate accurate duration for display
  const getAccurateDuration = (startHour, startMinute, endHour, endMinute) => {
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    return Math.max(0, end - start); // Ensure duration is never negative
  };

const handleDelete = async (e, event) => {
  e.preventDefault();
  e.stopPropagation();

  if (!confirm("Are you sure you want to delete this entry?")) {
    return;
  }

  try {
    // Create an array of all REF_SERIAL_NOs to delete (including all child events)
    const refNosToDelete = event.childEvents.map(child => child.REF_SERIAL_NO);

    // First delete from server (only positive REF_SERIAL_NOs)
    const serverDeletes = refNosToDelete
      .filter(refNo => refNo > 0)
      .map(refNo => {
        const payload = {
          DataModelName: "TASK_TIME_SHEET",
          WhereCondition: `REF_SERIAL_NO=${refNo}`,
        };
        return callSoapService(
          userData.clientURL,
          "DataModel_DeleteData",
          payload
        );
      });

    await Promise.all(serverDeletes);

    // Then update state
    setEvents(prevEvents => 
      prevEvents.filter(ev => !refNosToDelete.includes(ev.REF_SERIAL_NO))
    );

    const dateKey = formatDateKey(selectedDate);
    setTimesheetsByDate(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter(
        ev => !refNosToDelete.includes(ev.REF_SERIAL_NO)
      ),
    }));

    toast({
      title: "Success",
      description: "Entry deleted successfully",
      variant: "default",
    });
  } catch (error) {
    console.error("Delete error:", error);
    toast({
      title: "Error",
      description: "Failed to delete entry",
      variant: "destructive",
    });
  }
};

  return (
    <div className="h-full overflow-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ref No
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trans Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Task ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Task Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Project No
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Employee No
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Task User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Start Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              End Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Duration
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hours
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Entry Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {combinedRows.map((event) => (
            <>
              <tr
                key={event.REF_SERIAL_NO}
                className={`hover:bg-gray-100 text-gray-700 dark:text-white dark:hover:bg-gray-800 ${
                  event.isCombined ? "bg-blue-50 dark:bg-blue-900/30" : ""
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {event.REF_SERIAL_NO || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {parseDateFromString(event.TRANS_DATE)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {event.TASK_ID || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {event.TASK_NAME || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {event.PROJECT_NO || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {event.EMP_NO || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {event.TASK_USER || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatTime(event.START_HOUR, event.START_MINIUTE)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatTime(event.END_HOUR, event.END_MINITUE)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatDuration(event.TOTAL_DURATION_MINUTES)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {event.TOTAL_HOURS || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {event.USER_NAME || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {parseDateFromString(event.ENT_DATE)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
        <button
  onClick={(e) => handleDelete(e, event)}
  className="text-red-600 hover:text-red-900"
  title="Delete entry"
>
  <Trash2Icon className="h-4 w-4" />
</button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleEdit(e, event);
                    }}
                    className="text-blue-600 hover:text-blue-900 ml-2"
                  >
                    Edit
                  </button>
                </td>
              </tr>
              
           
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}