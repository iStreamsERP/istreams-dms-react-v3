import { CalendarDays, MessageSquare, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

const UpdateTaskModal = ({ isOpen, onAction, onClose }) => {
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.showModal();
      const handleClose = () => onClose();
      dialog.addEventListener("close", handleClose);
      return () => {
        dialog.removeEventListener("close", handleClose);
        dialog.close();
      };
    }
  }, [onClose]);

  if (!isOpen) return null;

  // Determine whether the current option requires date.
  const requiresDate = ["REMIND ME LATER", "POSTPONED", "COMPLETED"].includes(
    status
  );

  // Determine whether the current option requires remarks.
  const requiresRemarks = [
    "POSTPONED",
    "UNABLE TO COMPLETE",
    "COMPLETED",
    "CANCELLED",
  ].includes(status);

  // Validate inputs and pass the data to the parent.
  const handleUpdateClick = () => {
    if (requiresDate && !date) {
      alert("Please enter a date.");
      return;
    }

    if (requiresRemarks && remarks.trim().length < 10) {
      alert("Remarks are mandatory and must be at least 10 characters.");
      return;
    }

    // Pass the data to the parent. For options that don't need remarks, pass an empty string.
    onAction({ status, date, remarks: requiresRemarks ? remarks : "" });
    onClose();
  };

  // Render the dynamic content based on the selected option.
  const renderContent = () => {
    switch (status) {
      case "REMIND ME LATER":
        return (
          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              <Label className="text-xs">Reminder Date</Label>
            </div>
            <Input
              type="datetime-local"
              name="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input input-bordered input-sm w-full"
            />
          </div>
        );
      case "POSTPONED":
        return (
          <>
            <div className="flex flex-wrap items-center gap-3 w-full">
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                <Label className="text-xs">Postponed on</Label>
              </div>
              <Input
                type="datetime-local"
                name="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input input-bordered input-sm w-full"
              />
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <Label htmlFor="COMMENTS" className="text-xs">
                  Remarks
                </Label>
              </div>
              <Textarea
                name="COMMENTS"
                id="COMMENTS"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add remarks for postponement"
                className="textarea textarea-bordered textarea-xs w-full"
              />
            </div>
          </>
        );
      case "UNABLE TO COMPLETE":
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <Label htmlFor="COMMENTS" className="text-xs">
                Remarks
              </Label>
            </div>
            <Textarea
              name="COMMENTS"
              id="COMMENTS"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add remarks for unable to complete"
              className="textarea textarea-bordered textarea-xs w-full"
            />
          </div>
        );
      case "COMPLETED":
        return (
          <>
            <div className="flex flex-wrap items-center gap-3 w-full">
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                <Label className="text-xs">Completed on</Label>
              </div>
              <Input
                type="datetime-local"
                name="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input input-bordered input-sm w-full"
              />
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <Label htmlFor="COMMENTS" className="text-xs">
                  Remarks
                </Label>
              </div>
              <Textarea
                name="COMMENTS"
                id="COMMENTS"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add remarks for action has been taken"
                className="textarea textarea-bordered textarea-xs w-full"
              />
            </div>
          </>
        );
      case "CANCELLED":
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <Label htmlFor="COMMENTS" className="text-xs">
                Remarks
              </Label>
            </div>
            <Textarea
              name="COMMENTS"
              id="COMMENTS"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add remarks for cancellation"
              className="textarea textarea-bordered textarea-xs w-full"
            />
          </div>
        );
      default:
        return null;
    }
  };

  // Reset date and remarks when the option changes.
  const handleOptionChange = (value) => {
    setStatus(value);
    setDate("");
    setRemarks("");
  };

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg bg-slate-100 transition-colors dark:bg-slate-950 text-black dark:text-white p-6 w-full max-w-md"
    >
      <div className="flex flex-col justify-between items-center mb-4">
        {/* Modal Header */}
        <div className="flex justify-between items-center w-full">
          <h3 className="font-bold text-lg">Update Task Details</h3>
          <Button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            <X />
          </Button>
        </div>

        {/* Radio Options */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {[
            { value: "REMIND ME LATER", label: "Remind me later" },
            { value: "POSTPONED", label: "Postponed" },
            { value: "UNABLE TO COMPLETE", label: "Unable to complete" },
            { value: "COMPLETED", label: "Completed" },
            { value: "CANCELLED", label: "Cancelled" },
          ].map(({ value, label }) => (
            <label key={value} className="relative cursor-pointer">
              <input
                type="radio"
                name="options"
                value={value}
                onChange={(e) => handleOptionChange(e.target.value)}
                className="sr-only peer"
                aria-label={label}
              />
              <span
                className="
          inline-block
          px-4 py-2
          text-sm font-medium
          border border-gray-300 rounded
          transition
          peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-checked:text-white
          hover:bg-gray-100
        "
              >
                {label}
              </span>
            </label>
          ))}
        </div>

        {/* Dynamic Content */}
        <div className="w-full mt-4">{renderContent()}</div>

        {/* Modal Actions */}
        <div className="flex justify-end w-full gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleUpdateClick}>Update</Button>
        </div>
      </div>
    </dialog>
  );
};

export default UpdateTaskModal;