import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  CheckCircle,
  ClipboardCheck,
  FileQuestion,
  FileText,
  Loader,
} from "lucide-react";
import { useEffect, useState } from "react";
import { callSoapService } from "../api/callSoapService";

const SalesSummaryCard = ({ daysCount = 30 }) => {
  const [summaryData, setSummaryData] = useState(null);
  const [userRights, setUserRights] = useState("");
  const { userData } = useAuth();

  const fetchUserRights = async () => {
    try {
      const userType = userData.isAdmin ? "ADMINISTRATOR" : "USER";
      const payload = {
        UserName: userData.userName,
        FormName: "DMS-DASHBOARDADMIN",
        FormDescription: "Dashboard Full View",
        UserType: userType,
      };

      const response = await callSoapService(
        userData.clientURL,
        "DMS_CheckRights_ForTheUser",
        payload
      );

      setUserRights(response);
    } catch (error) {
      console.error("Failed to fetch user rights:", error);
    }
  };

  const fetchData = async () => {
    try {
      const hasAccess = userData?.isAdmin || userRights === "Allowed";

      const payloadForTheUser = hasAccess ? "" : userData.userName;

      const payload = {
        NoOfDays: daysCount,
        ForTheUser: payloadForTheUser,
        FilterCond: "",
      };

      const response = await callSoapService(
        userData.clientURL,
        "DMS_GetDashboard_OverallSummary",
        payload
      );

      const summaryObj = response.reduce((acc, item) => {
        acc[item.CATEGORY] = Number(item.total_count);
        return acc;
      }, {});

      setSummaryData(summaryObj);
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
    }
  };

  // Fetch dashboard summary data
  useEffect(() => {
    const initialize = async () => {
      await fetchUserRights(); // Only sets userRights, not summary
    };
    initialize();
  }, [daysCount, userData]);

  useEffect(() => {
    if (userRights !== "") {
      fetchData(); // This now runs *after* userRights is updated
    }
  }, [userRights, daysCount]);

  const safePct = (value, total) => {
    if (typeof value !== "number" || typeof total !== "number" || total <= 0)
      return 0;
    const pct = (value / total) * 100;
    return isNaN(pct) ? 0 : +pct.toFixed(1);
  };

  const stats = summaryData
    ? [
        {
          title: "Total Documents",
          count: summaryData["Total Documents"] || 0,
          icon: FileText,
          color: "#6366F1",
          percentage: null,
        },
        {
          title: "Verified Documents",
          count: summaryData["Verified Documents"] || 0,
          icon: CheckCircle,
          color: "#22C55E",
          percentage: safePct(
            summaryData["Verified Documents"],
            summaryData["Total Documents"]
          ),
          name: "Total Documents",
        },
        {
          title: "Assigned Documents",
          count: summaryData["Assigned Documents"] || 0,
          icon: FileQuestion,
          color: "#EF4444",
          percentage: safePct(
            summaryData["Assigned Documents"],
            summaryData["Verified Documents"]
          ),
          name: "Verified Documents",
        },
        {
          title: "In-progress Documents",
          count: summaryData["In-progress Documents"] || 0,
          icon: Loader,
          color: "#3B82F6",
          percentage: safePct(
            summaryData["In-progress Documents"],
            summaryData["Verified Documents"]
          ),
          name: "Verified Documents",
        },
        {
          title: "Completed Documents",
          count: summaryData["Completed Documents"] || 0,
          icon: ClipboardCheck,
          color: "#F59E0B",
          percentage: safePct(
            summaryData["Completed Documents"],
            summaryData["Verified Documents"]
          ),
          name: "Verified Documents",
        },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
      {stats.map((stat, idx) => (
        <Card
          key={idx}
          className="bg-gradient-to-br from-slate-800 to-blue-900 text-white p-4"
        >
          <div className="flex flex-col gap-0">
            {/* Top section - Heading + Icon */}
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium">{stat.title}</h3>
              <div className="p-2 bg-white/20 rounded-lg">
                <stat.icon className="h-5 w-5" color="white" />
              </div>
            </div>

            {/* Bottom section - Count + Percentage */}
            <div className="flex gap-2 items-baseline">
              <div className="text-5xl font-bold tracking-tight">
                {stat.count}
              </div>

              {stat.percentage != null && (
                <div
                  className="text-xs flex items-center gap-1 leading-none"
                  style={{ color: stat.color }}
                >
                  <span>
                    {typeof stat.percentage === "number"
                      ? stat.percentage.toFixed(1)
                      : stat.percentage}
                    %
                  </span>
                  <span>of {stat.name}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SalesSummaryCard;
