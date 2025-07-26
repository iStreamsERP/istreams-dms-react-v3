// components/dialog/HistoryDialog.jsx
import { FileText, X, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getFileIcon } from "../../utils/getFileIcon";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/useToast";

const HistoryDialog = ({ historyRef, recentUploads, setRecentUploads }) => {
    const { toast } = useToast();

    const handleClearHistory = () => {
        if (recentUploads.length === 0) return;

        if (!window.confirm("Are you sure you want to clear all recent upload history?")) {
            return;
        }

        localStorage.removeItem('recentUploads');
        setRecentUploads([]);

        toast({
            title: "History Cleared",
            description: "All recent upload history has been removed.",
            variant: "default",
        });
    };

    return (
        <dialog
            ref={historyRef}
            className="relative"
        >
            <div className="fixed inset-0 bg-black/50 flex items-end justify-end">
                <div className="bg-white dark:bg-slate-900 shadow-xl w-full max-w-md h-[95vh] flex flex-col">
                    {/* Header with clear button */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-semibold text-black dark:text-gray-200">Recent Uploads</h3>
                            {recentUploads.length > 0 && (
                                <span className="text-xs bg-gray-500 dark:bg-gray-100 text-white dark:text-black px-2 py-1 rounded-full">
                                    {recentUploads.length} items
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {recentUploads.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearHistory}
                                    className="text-red-500 hover:text-red-600 dark:hover:text-red-400"
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Clear
                                </Button>
                            )}
                            <button
                                onClick={() => historyRef.current?.close()}
                                className="text-gray-600 dark:text-gray-300 hover:text-gray-300 dark:hover:text-gray-700 p-1"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {recentUploads.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                <p>No recent uploads found</p>
                                <p className="text-xs mt-2 text-gray-400">
                                    Uploaded files will appear here
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentUploads.map((upload, index) => (
                                    <div
                                        key={index}
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex-shrink-0">
                                                <img
                                                    src={getFileIcon(upload.fileExtension)}
                                                    alt={upload.fileName}
                                                    className="h-6 w-6"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm text-black dark:text-gray-200 font-medium truncate">
                                                    {upload.fileName}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    <span>Ref: {upload.refNo}</span>
                                                    <span>•</span>
                                                    <span>{upload.fileExtension?.toUpperCase()}</span>
                                                    <span>•</span>
                                                    <span>{formatDistanceToNow(new Date(upload.timestamp), { addSuffix: true })}</span>
                                                    {upload.isPrimary && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-blue-500">Primary</span>
                                                        </>
                                                    )}
                                                </div>
                                                {upload.description && (
                                                    <div className="text-xs mt-1 text-gray-500 dark:text-gray-400 truncate">
                                                        {upload.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </dialog>
    );
};

export default HistoryDialog;