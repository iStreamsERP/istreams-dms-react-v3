import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const dailyOrdersData = [
  { date: "07/01", Documents: 45 },
  { date: "07/02", Documents: 52 },
  { date: "07/03", Documents: 49 },
  { date: "07/04", Documents: 60 },
  { date: "07/05", Documents: 55 },
  { date: "07/06", Documents: 58 },
  { date: "07/07", Documents: 62 },
];

const DailyReportsChart = () => {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={dailyOrdersData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={14}  />
          <YAxis stroke="#9CA3AF" fontSize={14} />
         <Tooltip
          contentStyle={{
                backgroundColor: "rgba(12, 14, 16, 0.8)",
                borderColor: "#4B5563",
                borderRadius: "8px",
                padding: "6px",
                fontSize: "12px",
              }}
            itemStyle={{ fontSize: 12, color: "#E5E7EB" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Documents"
            stroke="#8B5CF6"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
export default DailyReportsChart;
