import { callSoapService } from "@/api/callSoapService";
import { CalendarDays, MessageSquare, User2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const TransferTaskModal = ({ isOpen, onTransfer, onClose }) => {
  const { userData } = useAuth();
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    NotCompletionReason: "",
    NewUser: "",
    StartDate: "",
    CompDate: "",
    RemindTheUserOn: "",
    CreatorReminderOn: "",
  });

  const fetchUsers = useCallback(async () => {
    try {
      const payload = {
        UserName: userData.userName,
      };

      const response = await callSoapService(
        userData.clientURL,
        "DMS_Get_All_ActiveUsers",
        payload
      );

      setUsers(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Error fetching all active users:", err);
      setUsers([]);
    }
  }, [userData.userName, userData.userEmail, userData.clientURL]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (e.target.type === "datetime-local" && value.length === 16) {
      const now = new Date();
      const seconds = String(now.getSeconds()).padStart(2, "0");
      formattedValue = `${value}:${seconds}`;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  console.table("formData", formData);

  const handleTransferClick = () => {
    onTransfer(formData);
    onClose();
  };

  return (
    <div
      id="transfer-task-modal"
      className="modal modal-open modal-bottom sm:modal-middle"
    >
      <div className="modal-box">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Transfer Task to Another User</h3>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Remarks Field */}
          <div className="flex flex-col gap-2 col-span-2">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <label htmlFor="NotCompletionReason" className="text-xs">
                Remarks
              </label>
            </div>
            <textarea
              name="NotCompletionReason"
              id="NotCompletionReason"
              placeholder="Add remarks for not able to complete task"
              value={formData.NotCompletionReason}
              onChange={handleChange}
              className="textarea textarea-bordered textarea-xs w-full"
            ></textarea>
          </div>

          {/* Transfer To Field */}
          <div className="flex flex-col gap-2 col-span-2">
            <div className="flex items-center gap-1">
              <User2 className="h-4 w-4" />
              <label htmlFor="NewUser" className="text-xs">
                Transfer to
              </label>
            </div>
            <select
              name="NewUser"
              id="NewUser"
              value={formData.NewUser}
              onChange={handleChange}
              className="select select-bordered select-sm w-full"
            >
              <option value="" disabled>
                Select Person
              </option>
              {users.map((user, index) => (
                <option key={index} value={user.user_name}>
                  {user.user_name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              <label htmlFor="StartDate" className="text-xs">
                Start Date
              </label>
            </div>
            <input
              type="datetime-local"
              name="StartDate"
              id="StartDate"
              value={formData.StartDate}
              onChange={handleChange}
              className="input input-bordered input-sm w-full"
            />
          </div>

          {/* Completion Date */}
          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              <label htmlFor="CompDate" className="text-xs">
                Completion Date
              </label>
            </div>
            <input
              type="datetime-local"
              name="CompDate"
              id="CompDate"
              value={formData.CompDate}
              onChange={handleChange}
              className="input input-bordered input-sm w-full"
            />
          </div>

          {/* Reminder User On */}
          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              <label htmlFor="RemindTheUserOn" className="text-xs">
                Reminder User On
              </label>
            </div>
            <input
              type="datetime-local"
              name="RemindTheUserOn"
              id="RemindTheUserOn"
              value={formData.RemindTheUserOn}
              onChange={handleChange}
              className="input input-bordered input-sm w-full"
            />
          </div>

          {/* Remind Me On */}
          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              <label htmlFor="CreatorReminderOn" className="text-xs">
                Remind me on
              </label>
            </div>
            <input
              type="datetime-local"
              name="CreatorReminderOn"
              id="CreatorReminderOn"
              value={formData.CreatorReminderOn}
              onChange={handleChange}
              className="input input-bordered input-sm w-full"
            />
          </div>
        </div>

        <div className="modal-action mt-4">
          <button className="btn btn-neutral" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-success" onClick={handleTransferClick}>
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferTaskModal;