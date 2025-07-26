import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

const ConfirmationTaskModal = ({ isOpen, onAction, onClose }) => {
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

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg bg-slate-100 transition-colors dark:bg-slate-950 text-black dark:text-white p-6 w-full max-w-md"
    >
      <div className="modal-box">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Confirm Action</h3>
          <Button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            <X />
          </Button>
        </div>
        <p className="py-4 text-sm">Do you want to accept this task?</p>
        <div className="flex w-full justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onAction({ status: "REJECTED" })}
          >
            Decline
          </Button>
          <Button onClick={() => onAction({ status: "ACCEPTED" })}>
            Accept
          </Button>
        </div>
      </div>
    </dialog>
  );
};

export default ConfirmationTaskModal;
