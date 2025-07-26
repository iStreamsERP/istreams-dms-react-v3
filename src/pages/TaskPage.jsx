import {
  ArrowUp,
  Briefcase,
  Trash2
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useAuth } from "../contexts/AuthContext";

export const TaskPage = () => {
  const { userData } = useAuth();

  // Filter state
  const [tasks, setTasks] = useState([]);
  const [location, setLocation] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [dateRange] = useState("01.01.2023 - 31.12.2023");
  const [activeTab, setActiveTab] = useState(0);

  // Stats for Total Tasks
  const total = 190000;
  const completed = 173372;
  const percent = Math.min(100, Math.round((completed / total) * 100));
  const delta = 2.6;
  const deltaLabel = "since last year";

  // Chart data
  const doughnutData = [
    { name: "Management", value: 23 },
    { name: "Service", value: 19 },
    { name: "Küche", value: 30 },
    { name: "Housekeeping", value: 28 },
  ];
  const COLORS = ["#10B981", "#EF4444", "#3B82F6", "#A855F7"];

  const barData = [
    {
      month: "Jan",
      Management: 4000,
      Service: 2000,
      Küche: 1000,
      Housekeeping: 1500,
    },
    {
      month: "Feb",
      Management: 3000,
      Service: 1800,
      Küche: 1200,
      Housekeeping: 1300,
    },
    {
      month: "Mar",
      Management: 3500,
      Service: 2200,
      Küche: 1400,
      Housekeeping: 1600,
    },
    {
      month: "Apr",
      Management: 3800,
      Service: 2400,
      Küche: 1600,
      Housekeeping: 1800,
    },
    {
      month: "May",
      Management: 4200,
      Service: 2600,
      Küche: 1800,
      Housekeeping: 2000,
    },
    {
      month: "Jun",
      Management: 4500,
      Service: 2800,
      Küche: 2000,
      Housekeeping: 2200,
    },
  ];

  // Task list
  // const tasks = [
  //     { datetime: 'Mon, 25.09.2023 17:00', name: 'Task Name', desc: 'Task Description', employee: 'Floyd Miles', role: 'Plumber, 80%', type: 'Personal', status: 'Completed' },
  //     { datetime: 'Tue, 26.09.2023 10:30', name: 'Task Name', desc: 'Task Description', employee: 'Jenny Wilson', role: 'Chef, 80%', type: 'Shift', status: 'Pending' },
  //     { datetime: 'Wed, 27.09.2023 14:15', name: 'Task Name', desc: 'Task Description', employee: 'Esther Howard', role: 'Housekeeper, 100%', type: 'Shift', status: 'Pending' },
  // ];

  const tabLabels = ["All Tasks", "Completed", "Pending"];
  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 1) return t.status === "Completed";
    if (activeTab === 2) return t.status !== "Completed";
    return true;
  });

  useEffect(() => {
    fetchTasksList();
  }, []);

  const fetchTasksList = async () => {
    try {
      const payload = {
        SQLQuery: `SELECT * FROM TASK_LIST`,
      };

      const response = await callSoapService(
        userData.clientURL,
        "DataModel_GetDataFrom_Query",
        payload
      );

      setTasks(response);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end flex-wrap gap-3">
          <select
            className="select select-bordered select-sm text-gray-900 dark:text-gray-200 p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-900 w-full md:w-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">All Locations</option>
            <option>Location A</option>
            <option>Location B</option>
          </select>
          <select
            className="select select-bordered select-sm text-gray-900 dark:text-gray-200 p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-900 w-full md:w-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            <option>Dept 1</option>
          </select>
          <select
            className="select select-bordered select-sm text-gray-900 dark:text-gray-200 p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-900 w-full md:w-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">Year</option>
            <option>2023</option>
            <option>2024</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Tasks
              </p>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {completed.toLocaleString()}
                </span>
                <span className="text-lg text-gray-400">
                  / {total.toLocaleString()}
                </span>
              </div>
              <div className="mt-3 flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    delta >= 0
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {delta >= 0 ? (
                    <ArrowUp className="-ml-0.5 mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDown className="-ml-0.5 mr-1 h-3 w-3" />
                  )}
                  {delta}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {deltaLabel}
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Briefcase className="h-8 w-8 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Task Distribution
          </h2>
          <div className="flex items-center">
            <div className="w-1/2 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={doughnutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {doughnutData.map((entry, idx) => (
                      <Cell key={idx} fill={COLORS[idx]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Percentage"]}
                    contentStyle={{
                      backgroundColor: "rgba(12, 14, 16, 0.8)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      padding: "0.5rem",
                    }}
                    itemStyle={{ fontSize: "12px", color: "#e5e7eb" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 pl-4 space-y-3">
              {doughnutData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i] }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {d.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {d.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Tasks Completed
          </h2>
          <div className="flex space-x-4">
            {["Management", "Service", "Küche", "Housekeeping"].map(
              (key, idx) => (
                <div key={key} className="flex items-center space-x-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[idx] }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {key}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
        <div className="w-full h-80">
          {" "}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
              barSize={90} /* Increased bar size */
              barGap={4} /* Adjusted gap between bars */
              barCategoryGap={12} /* Adjusted gap between categories */
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(12, 14, 16, 0.8)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  padding: "0.5rem",
                }}
                itemStyle={{
                  fontSize: "20px",
                }}
              />
              {["Management", "Service", "Küche", "Housekeeping"].map(
                (key, idx) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={COLORS[idx]}
                    radius={[4, 4, 0, 0]} /* Slightly larger radius */
                  />
                )
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            {tabLabels.map((label, idx) => (
              <button
                key={idx}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === idx
                    ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
                onClick={() => setActiveTab(idx)}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Date & Time
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Task
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Employee
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTasks.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {r.datetime}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {r.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {r.desc}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {r.employee}
                    </div>
                    <div className="mt-1">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                        {r.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {r.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        r.status === "Completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
