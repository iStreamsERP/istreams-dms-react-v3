import { Rotate3DIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function TimeSheetComponent({
  selectedDate,
  events,
  tasks,
  rowHeight = 64,
  handleDateSelect,
  handleDrop,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleEditBlock,
  handleDeleteHourBlock,
  handleRightResizeMouseDown,
  handleLeftResizeMouseDown,
  handleDragMouseDown,
  handleFillHourRight,
  handleFillHourLeft,
  datePickerRef,
  isFutureDate,
  pendingChanges,
  savePendingChanges,
  fetchTimeSheetData,
  formatTime,
  calculateDuration,
  formatDuration,
  splitEventToHourBlocks,
  timesheetScrollRef,
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];
  const [resizingEvent, setResizingEvent] = useState(null);


  const openDatePicker = async () => {
    if (pendingChanges.length > 0) {
      const confirmSave = confirm(
        "You have unsaved changes. Save before changing date?"
      );
      if (confirmSave) {
        const success = await savePendingChanges();
        
      fetchTimeSheetData();
        if (!success) {
          alert("Failed to save changes. Please try again.");
          return;
        }

        
      }
    }
   
    if (datePickerRef.current) {
      datePickerRef.current.showModal();
    }
  };
  const handleSaveService = async (e) => {
    e.preventDefault();
  const success = await savePendingChanges();
  if (success) {
    fetchTimeSheetData();
  }
};

  return (
    <div
      className="w-full overflow-hidden"
      style={{ minHeight: "400px", height: "100%" }}
    >
      <div className="rounded-xl p-2 relative w-full h-full">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h2 className="text-xl tracking-wider font-bold truncate">
            Time Sheet -{" "}
            {selectedDate?.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <div className="flex gap-2">
          <button onClick={  handleSaveService}
           className="mt-1 text-xs shadow-lg border border-gray-300 rounded px-3 py-1 dark:hover:bg-gray-800 hover:bg-gray-100 whitespace-nowrap">
              Save 
          </button>
          <button
            type="button"
            className="mt-1 text-xs shadow-lg border border-gray-300 rounded px-3 py-1 dark:hover:bg-gray-800 hover:bg-gray-100 whitespace-nowrap"
            onClick={openDatePicker}
          >
            Change Date <Rotate3DIcon className="w-3 h-3 inline ml-1" />
          </button>
        </div>
          <dialog
            ref={datePickerRef}
            className="fixed z-10 inset-0 overflow-y-auto"
          >
            <div className="flex items-center  justify-center p-2 text-center">
              <div
                className="fixed inset-0 transition-opacity"
                onClick={() => datePickerRef.current.close()}
              >
                <div className="absolute inset-0 bg-gray-900 dark:bg-gray-900 opacity-75"></div>
              </div>
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white dark:bg-gray-800 text-black dark:text-gray-100 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex bg-white dark:bg-gray-800 sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-500"
                          onClick={() => datePickerRef.current.close()}
                        >
                          <span className="sr-only">Close</span>
                          <XIcon className="h-6 w-6" />
                        </button>
                      </div>
                      <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={isFutureDate}
                        className="rounded-lg mt-2 text-xs"
                        classNames={{
                          selected: "bg-blue-500 text-white rounded",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </dialog>
        </div>

        <div className="flex mb-2 w-full">
          <p className="w-[10%] text-center bg-gradient-to-r from-cyan-400 to-blue-600 text-white border border-blue-300 font-semibold text-xs p-1 rounded">
            Time
          </p>
          <div className="w-[90%] grid grid-cols-4 gap-1 me-3">
            {["00", "15", "30", "45"].map((min, index) => {
              const nextMin = ["15", "30", "45", "60"][index];
              return (
                <div
                  key={min}
                  className="text-center border border-gray-400 font-semibold text-xs p-1 rounded truncate"
                >
                  {min}m - {nextMin}m
                </div>
              );
            })}
          </div>
        </div>

        <div
          ref={timesheetScrollRef}
          className="relative rounded-xl p-1 overflow-y-auto w-full"
          style={{
            maxHeight: "calc(80vh - 120px)",
            minHeight: "100px",
            height: "100%",
            scrollBehavior: "smooth",
          }}
        >
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex border-t border-gray-200 relative w-full"
              style={{ height: `${rowHeight}px` }}
              onMouseDown={() => handleMouseDown(hour)}
              onMouseMove={(e) => handleMouseMove(e, hour)}
              onMouseUp={handleMouseUp}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, hour)}
            >
              <div className="w-[10%] flex items-center justify-center text-sm font-semibold text-gray-600">
                {formatTime(hour, 0)}
              </div>
              <div className="w-[90%] grid grid-cols-4 gap-1">
                {minutes.map((minute) => (
                  <div
                    key={`${hour}-${minute}`}
                    className="h-full w-full transition hover:bg-blue-100 dark:hover:bg-blue-800/20 rounded cursor-pointer relative"
                  />
                ))}
              </div>
            </div>
          ))}

          {Array.isArray(events) &&
            events.flatMap((event, index) => {
              const blocks = splitEventToHourBlocks(event);
              return blocks.map((block, blockIndex) => {
                const startTotalMinutes =
                  block.blockStartHour * 60 + Number(block.blockStartMinute);
                const endTotalMinutes =
                  block.blockEndHour * 60 + Number(block.blockEndMinute);
                const minuteInHour = startTotalMinutes % 60;
                const durationInThisBlock = endTotalMinutes - startTotalMinutes;

                const shortFormatTime = durationInThisBlock === 15;

                const leftPercent = (minuteInHour / 60) * 90;
                const widthPercent = (durationInThisBlock / 60) * 90;

                return (
                  <div
                    key={block.id}
                    className={`
                            absolute p-2 rounded-lg shadow-sm  flex justify-between items-start text-sm overflow-hidden
                            border border-transparent
                            ${block.color}
                            group
                            will-change-[top,left,width,height,transform,opacity]
                            transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]
                            hover:shadow-md
                          `}
                    style={{
                      top: `calc(${
                        Math.floor(startTotalMinutes / 60) * rowHeight + 8
                      }px)`,
                      left: `calc(10% + ${leftPercent}%)`,
                      width: `calc(${widthPercent}% - 0.4px)`,
                      height: `${rowHeight - 8}px`,
                      transform: "translateZ(0)",
                    }}
                    onMouseDown={(e) => handleDragMouseDown(e, event)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleEditBlock(e, block, event);
                    }}
                    title="Double click to edit"
                  >
                    <div className="flex-1 pr-2 cursor-pointer relative z-10 transition-opacity duration-150 hover:opacity-90">
                      <div className="flex items-center whitespace-wrap gap-1">
                        <span className="text-xs font-semibold text-gray-900 truncate transition-all duration-200 hover:text-gray-700">
                          {block.TASK_NAME}
                        </span>
                        {!shortFormatTime && (
                          <span className="text-xs text-gray-700 whitespace-nowrap transition-opacity duration-200 group-hover:opacity-90">
                            (
                            {formatTime(
                              block.blockStartHour,
                              block.blockStartMinute
                            )}{" "}
                            -{" "}
                            {formatTime(
                              block.blockEndHour,
                              block.blockEndMinute
                            )}
                            )
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-black transition-opacity duration-200 group-hover:opacity-90">
                        Duration:{" "}
                        {formatDuration(
                          calculateDuration(
                            event.START_HOUR,
                            event.START_MINIUTE,
                            event.END_HOUR,
                            event.END_MINITUE
                          )
                        )}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 relative z-10">
                      <button
                        className="text-gray-700 hover:text-red-600 mt-2 transition-colors duration-200 ease-out text-xs transform hover:scale-110 active:scale-95"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHourBlock(e, block.id);
                        }}
                      >
                        <XIcon
                          size={18}
                          className="hover:bg-red-100 rounded-full p-0.5 transition-all duration-150"
                        />
                      </button>
                    </div>

                    {/* Left resize handle */}
                    <div
                      className="absolute top-0 bottom-0 left-0 w-2 bg-transparent hover:bg-white/30 cursor-w-resize transition-all duration-200 z-20 opacity-0 group-hover:opacity-100"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleLeftResizeMouseDown(e, event);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleFillHourLeft(
                          e,
                          block.blockStartHour,
                          block.blockStartMinute
                        );  
                      }}
                      title="Double click to fill hour"
                    >
                      <div className="absolute top-1/2 left-0.5 w-1 h-6 bg-gray-400 rounded-full transform -translate-y-1/2 transition-all duration-300 group-hover:bg-gray-500" />
                    </div>

                    {/* Right resize handle with dedicated tooltip */}
                    <div
                      className="absolute top-0 bottom-0 right-0 w-2 bg-transparent hover:bg-white/30 cursor-e-resize transition-all duration-200 z-20 opacity-0 group-hover:opacity-100"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleRightResizeMouseDown(e, event);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleFillHourRight(
                          e,
                          block.blockStartHour,
                          block.blockStartMinute
                        );
                      }}
                      title="Double click to fill hour"
                    >
                      <div className="absolute top-1/2 right-0.5 w-1 h-6 bg-gray-400 rounded-full transform -translate-y-1/2 transition-all duration-300 group-hover:bg-gray-500" />
                    </div>

                    {/* Tooltips */}
                    <div className="absolute -top-8 -right-2 text-gray-800 text-xs px-2 py-1 rounded-md pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out bg-white shadow-md border border-gray-200 whitespace-nowrap transform group-hover:translate-y-0 translate-y-1">
                      Double click to fill hour
                    </div>

                    <div className="absolute -top-8 left-1/2 transform-translate-x-1/2 text-gray-800 text-xs px-2 py-1 rounded-md pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out bg-white shadow-md border border-gray-200 whitespace-nowrap transform group-hover:translate-y-0 translate-y-1">
                      Double click to edit • Drag to move
                    </div>
                  </div>
                );
              });
            })}
        </div>
      </div>
    </div>
  );
}