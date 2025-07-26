import GlobalSearchInput from "@/components/GlobalSearchInput";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { callSoapService } from "@/api/callSoapService";
import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import TeamProfileCard from "../components/TeamProfileCard";
import { useAuth } from "../contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

export const TeamsPage = () => {
  const { userData } = useAuth();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  const [assignmentFilter, setAssignmentFilter] = useState("All");
  const [usersData, setUsersData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const canViewTeam = await hasPermission("VIEW_TEAMS_FULL");
      await fetchUsersAndImages(canViewTeam ? "Allowed" : "Denied");
    };

    if (userData?.userEmail) {
      fetchData();
    }
  }, [userData.userEmail]);

  const fetchUsersAndImages = async (rights) => {
    try {
      const payload = {
        UserName:
          userData.isAdmin || rights === "Allowed" ? "" : userData.userName,
      };

      const userDetails = await callSoapService(
        userData.clientURL,
        "DMS_Get_All_ActiveUsers",
        payload
      );

      let usersArray = [];

      if (rights === "Allowed") {
        usersArray = Array.isArray(userDetails) ? userDetails : [userDetails];
      } else {
        usersArray = (
          Array.isArray(userDetails) ? userDetails : [userDetails]
        ).filter((user) => user.user_name === userData.userName);
      }

      const usersWithImages = await Promise.all(
        usersArray.map(async (user) => {
          try {
            const payload = {
              EmpNo: user.emp_no,
            };

            const imageData = await callSoapService(
              userData.clientURL,
              "getpic_bytearray",
              payload
            );

            return {
              ...user,
              image: imageData
                ? `data:image/jpeg;base64,${imageData}`
                : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbBa24AAg4zVSuUsL4hJnMC9s3DguLgeQmZA&s",
            };
          } catch (error) {
            console.error(
              `Error fetching image for user ${user.emp_no}:`,
              error
            );
            return {
              ...user,
              image:
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbBa24AAg4zVSuUsL4hJnMC9s3DguLgeQmZA&s",
            };
          }
        })
      );

      setUsersData(usersWithImages);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        variant: "destructive",
        title: error,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsersData = usersData.filter((user) => {
    const search = globalFilter?.toLowerCase();
    const matchesSearch = user.user_name?.toLowerCase()?.includes(search);

    // Explicitly handle all filter cases
    switch (assignmentFilter) {
      case "Assigned":
        return matchesSearch && Number(user.overall_total_tasks) > 0;
      case "Unassigned":
        return matchesSearch && Number(user.overall_total_tasks) === 0;
      case "All":
      default:
        return matchesSearch;
    }
  });

  // Calculate if there are filtered results
  const hasFilteredResults = filteredUsersData.length > 0;
  const hasUsersData = usersData.length > 0;

  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="flex flex-col md:flex-row md:justify-between items-stretch gap-2">
        <div className="w-full lg:w-1/2">
          <GlobalSearchInput value={globalFilter} onChange={setGlobalFilter} />
        </div>

        <div className="flex-shrink-0">
          <div className="flex gap-2">
            {["All", "Assigned", "Unassigned"].map((filter) => (
              <Button
                key={filter}
                variant={filter === assignmentFilter ? "default" : "outline"}
                size="sm"
                onClick={() => setAssignmentFilter(filter)}
                aria-pressed={filter === assignmentFilter}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-start">
          <BarLoader color="#36d399" height={2} width="100%" />
        </div>
      ) : hasFilteredResults ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredUsersData.map((user) => (
            <TeamProfileCard
              key={`${user.emp_no}-${user.user_name}`}
              user={user}
            />
          ))}
        </div>
      ) : hasUsersData ? (
        <div className="flex justify-center items-center py-10">
          <p className="text-gray-400">No users match your filters</p>
        </div>
      ) : (
        <div className="flex justify-center items-center py-10">
          <p className="text-gray-400">No users found</p>
        </div>
      )}
    </div>
  );
};