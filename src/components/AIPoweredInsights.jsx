import { CheckCircle, Clock, FileText, Trash2 } from "lucide-react";

const INSIGHTS = [
  {
    icon: FileText,
    color: "text-green-500",
    insight: "Total documents in the system have increased by 12% this month.",
  },
  {
    icon: CheckCircle,
    color: "text-blue-500",
    insight: "85% of documents have been reviewed and approved successfully.",
  },
  {
    icon: Clock,
    color: "text-yellow-500",
    insight:
      "Pending document approvals have decreased by 10% compared to last month.",
  },
  {
    icon: Trash2,
    color: "text-red-500",
    insight:
      "10 documents were deleted in the last week for better data management.",
  },
];

const AIPoweredInsights = () => {
  return (
    <div className="space-y-4">
      {INSIGHTS.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${item.color} bg-opacity-20`}>
            <item.icon className={`size-4 ${item.color}`} />
          </div>
          <p className="text-sm">{item.insight}</p>
        </div>
      ))}
    </div>
  );
};
export default AIPoweredInsights;
