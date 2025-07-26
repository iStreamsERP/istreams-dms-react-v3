import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { toTitleCase } from "../utils/stringUtils";

function TeamProfileCard({ user }) {
  // 1) Destructure every field you use
  const {
    user_name = "",
    overall_total_tasks = 0,
    overall_completed_tasks = 0,
    month_total_tasks = 0,
    month_completed_tasks = 0,
    designation = "",
    image = "",
  } = user || {};

  // 2) Derive displayName, titles, percentages
  const displayTitle = user_name ? toTitleCase(user_name) : "";
  const designationTitle = designation ? toTitleCase(designation) : "";
  const pendingTasks = overall_total_tasks - overall_completed_tasks;
  const progressPercent = overall_total_tasks
    ? Math.round((overall_completed_tasks / overall_total_tasks) * 100)
    : 0;
  const monthProgressPercent = month_total_tasks
    ? Math.round((month_completed_tasks / month_total_tasks) * 100)
    : 0;
  const strokeDasharray = `${monthProgressPercent} 100`;

  return (
    <Link to="/document-list" state={{ userName: displayTitle }}>
      <Card className="col-span-2 md:col-span-2 lg:col-span-1">
        <CardContent className="p-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-start space-x-3 flex-shrink-0">
              <div className="w-8 h-8 overflow-hidden rounded-full ring-2 ring-green-500 flex-shrink-0">
                <img
                  src={image}
                  alt={displayTitle}
                  title={displayTitle}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/placeholder-user.png";
                  }}
                  className="w-10 h-10 object-cover flex-shrink-0"
                />
              </div>
              <div className="flex flex-col items-start max-w-[100px]">
                {displayTitle && (
                  <p
                    className="text-sm font-semibold truncate whitespace-nowrap"
                    title={displayTitle}
                  >
                    {displayTitle}
                  </p>
                )}
                {designationTitle && (
                  <p
                    className="text-xs text-gray-500 truncate line-clamp-2"
                    title={designationTitle}
                  >
                    {designationTitle}
                  </p>
                )}
              </div>
            </div>

            <div className="text-center ml-auto">
              <div className="relative w-10 h-10 mx-auto rounded-full border">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeDasharray={strokeDasharray}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 ">
                  {monthProgressPercent}%
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-600 mb-4">
            <div>
              <p>Total</p>
              <p className="font-bold text-lg text-gray-800">
                {overall_total_tasks}
              </p>
            </div>
            <div>
              <p>Done</p>
              <p className="font-bold text-lg text-green-500">
                {overall_completed_tasks}
              </p>
            </div>
            <div>
              <p>Pending</p>
              <p className="font-bold text-lg text-amber-500">{pendingTasks}</p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-1 mb-1">
            <div
              className="h-1 rounded-full bg-green-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-right">
            {progressPercent}% Completed
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default TeamProfileCard;
