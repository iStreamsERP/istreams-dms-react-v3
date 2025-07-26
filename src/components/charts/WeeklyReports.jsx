import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "A line chart with labels";

const chartData = [
  { month: "Mon", documents: 186 },
  { month: "Tue", documents: 305 },
  { month: "Wed", documents: 237 },
  { month: "Thur", documents: 73 },
  { month: "Fri", documents: 209 },
  { month: "Sat", documents: 214 },
];

const chartConfig = {
  documents: {
    label: "Documents Uploaded",
    color: "var(--chart-1)",
  },
};

// Custom label component
const CustomLabel = (props) => {
  const { x, y, value } = props;
  return (
    <text
      x={x}
      y={y - 10} // Position above the point
      textAnchor="middle"
      fill="#000"
      fontSize={12}
      fontWeight={500}
    >
      {value}
    </text>
  );
};

export function WeeklyReports() {
  return (
    <ChartContainer config={chartConfig}>
      <LineChart
        data={chartData}
        margin={{ top: 40, right: 20, bottom: 40, left: 20 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
        />
        <YAxis
          hide // Hide YAxis if not needed
          domain={[0, "dataMax + 50"]} // Add padding to top
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Line
          dataKey="documents"
          type="natural"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{
            fill: "#3b82f6",
            r: 4,
            strokeWidth: 2,
            stroke: "#fff",
          }}
          activeDot={{
            r: 6,
            fill: "#3b82f6",
            stroke: "#fff",
            strokeWidth: 2,
          }}
        >
          {/* Custom labels above each point */}
          <LabelList dataKey="documents" content={<CustomLabel />} />
        </Line>
      </LineChart>
    </ChartContainer>
  );
}
