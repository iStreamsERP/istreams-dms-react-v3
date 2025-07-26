import { callSoapService } from "@/api/callSoapService";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { Skeleton } from "../ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

// Updated chart configuration
const chartConfig = {
  documents: {
    label: "Document Count",
  },
};

// Fixed XAxis tick component with proper rotation and positioning
const CustomizedXAxisTick = (props) => {
  const { x, y, payload, truncateLength = 12 } = props;
  const value = payload.value;
  const truncatedValue =
    value.length > truncateLength
      ? `${value.substring(0, truncateLength)}...`
      : value;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <g transform={`translate(${x},${y})`}>
          <text
            x={0}
            y={0}
            textAnchor="end"
            fill="#666"
            fontSize={12}
            transform="rotate(-90)"
          >
            {truncatedValue}
          </text>
        </g>
      </TooltipTrigger>
      {value.length > truncateLength && (
        <TooltipContent className="z-50 max-w-xs break-words">
          <p>{value}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
};

// Custom label component for top values
const CustomTopLabel = (props) => {
  const { x, y, value, width } = props;
  return (
    <text
      x={Number(x) + Number(width) / 2}
      y={Number(y) - 5} // Position above the bar
      textAnchor="middle"
      fill="#000"
      fontSize={12}
      fontWeight={500}
    >
      {value}
    </text>
  );
};

export function CategoryWiseBarChart({ daysCount = 30 }) {
  const { userData } = useAuth();
  const [channelData, setChannelData] = useState([]);
  const [userRights, setUserRights] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserRights = useCallback(async () => {
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
      setError("Failed to load user permissions");
    }
  }, [userData]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const hasAccess = userData?.isAdmin || userRights === "Allowed";
      const payload = {
        NoOfDays: daysCount,
        ForTheUser: hasAccess ? "" : userData.userName,
      };

      const response = await callSoapService(
        userData.clientURL,
        "DMS_GetDashboard_CategoriesSummary",
        payload
      );

      // Handle empty response
      if (!response || !Array.isArray(response)) {
        setChannelData([]);
        return;
      }

      const totalCount = response.reduce(
        (sum, item) => sum + (Number(item.total_count) || 0),
        0
      );

      const formattedData = response.map((item) => {
        const value = Number(item.total_count) || 0;
        const percentage = totalCount > 0 ? (value / totalCount) * 100 : 0;

        return {
          category: item.DOC_RELATED_CATEGORY,
          value,
          percentage: Number(percentage.toFixed(0)),
        };
      });

      setChannelData(formattedData);
    } catch (error) {
      console.error("Error fetching channel summary:", error);
      setError("Failed to load document data");
    } finally {
      setIsLoading(false);
    }
  }, [userData, userRights, daysCount]);

  useEffect(() => {
    if (userData) {
      fetchUserRights();
    }
  }, [userData, fetchUserRights]);

  useEffect(() => {
    if (userRights !== "" && userData) {
      fetchData();
    }
  }, [userRights, userData, daysCount, fetchData]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  // Handle errors
  if (error) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Handle empty data
  if (!channelData || channelData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p>No document data available</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <ResponsiveContainer width="100%" height={300}>
        <ChartContainer config={chartConfig}>
          <BarChart
            data={channelData}
            margin={{ top: 20, bottom: 70 }}
            barCategoryGap="20%"
          >
            <XAxis
              dataKey="category"
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={<CustomizedXAxisTick />}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="value" name="Documents" radius={[4, 4, 0, 0]}>
              {channelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#3b82f6" />
              ))}
              {/* Add count labels on top */}
              {/* <LabelList
                dataKey="value"
                content={<CustomTopLabel />}
                position="top"
              /> */}
              <LabelList
                dataKey="value"
                position="top"
                className="font-bold text-xs"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </ResponsiveContainer>
    </TooltipProvider>
  );
}
