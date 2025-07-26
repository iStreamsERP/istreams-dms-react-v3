import { useEffect, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useAuth } from "../../contexts/AuthContext";
import { callSoapService } from "@/api/callSoapService";
import { MoonLoader } from "react-spinners";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088FE",
  "#00C49F",
];

const ChannelPerformanceChart = ({ daysCount = 30 }) => {
  const [channelData, setChannelData] = useState([]);
  const [userRights, setUserRights] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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
    setIsLoading(true);
    try {
      const hasAccess = userData?.isAdmin || userRights === "Allowed";
      const payloadForTheUser = hasAccess ? "" : userData.userName;

      const payload = {
        NoOfDays: daysCount,
        ForTheUser: payloadForTheUser,
      };

      const response = await callSoapService(
        userData.clientURL,
        "DMS_GetDashboard_ChannelSummary",
        payload
      );

      // Step 1: Calculate total of all counts
      const totalCount = response.reduce(
        (sum, item) => sum + (Number(item.total_count) || 0),
        0
      );

      // Step 2: Map data with percentage calculation
      const formattedData = response.map((item) => {
        const value = Number(item.total_count) || 0;
        const percentage = totalCount > 0 ? (value / totalCount) * 100 : 0;
        const label =
          item.CHANNEL_SOURCE === " "
            ? userData.companyName
            : item.CHANNEL_SOURCE;

        return {
          name: `${label} (${percentage.toFixed(0)}%)`,
          value,
          percentage: Number(percentage.toFixed(0)), // Round to 2 decimals
        };
      });

      setChannelData(formattedData);
    } catch (error) {
      console.error("Error fetching channel summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch dashboard summary data
  useEffect(() => {
    const initialize = async () => {
      await fetchUserRights(); // Only sets userRights, not summary
    };
    initialize();
  }, [userData]);

  useEffect(() => {
    if (userRights !== "") {
      fetchData();
    }
  }, [userRights, daysCount]);

  const showNoDataMessage =
    !isLoading &&
    (channelData.length === 0 || channelData.every((item) => item.value === 0));

  return (
    <div style={{ width: "100%", height: 300 }}>
      {isLoading ? (
        <div className="h-full flex items-center justify-center">
          <MoonLoader color="#36d399" height={2} width="100%" />
        </div>
      ) : showNoDataMessage ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-4">
          <span className="text-lg font-semibold">
            No data available for the selected period
          </span>
          <span className="text-gray-400 text-xs">
            Try selecting a different time range
          </span>
        </div>
      ) : (
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={channelData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              style={{ cursor: "pointer", margin: "auto" }}
              fontSize={14}
              dataKey="value"
            >
              {channelData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              wrapperStyle={{ outline: "none" }}
              contentStyle={{
                backgroundColor: "#1F2937", // slate-800
                border: "1px solid #374151", // slate-700
                borderRadius: "0.5rem",
                padding: "0.5rem 0.75rem",
                color: "#F9FAFB", // text-white
                fontSize: "0.875rem", // text-sm
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
              itemStyle={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                color: "#E5E7EB", // slate-200
              }}
              labelStyle={{
                fontWeight: 600,
                fontSize: "0.875rem",
                color: "#93C5FD", // blue-300
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="circle"
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ChannelPerformanceChart;
