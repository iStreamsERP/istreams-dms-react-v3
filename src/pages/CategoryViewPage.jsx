import GlobalSearchInput from "@/components/GlobalSearchInput";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { callSoapService } from "@/api/callSoapService";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarLoader } from "react-spinners";
import TimeRangeSelector from "../components/TimeRangeSelector";
import { useAuth } from "../contexts/AuthContext";
import AccessDenied from "@/components/AccessDenied";
import { useToast } from "@/hooks/useToast";

export const CategoryViewPage = () => {
  const { userData } = useAuth();
  const { toast } = useToast();

  const [userRights, setUserRights] = useState("");
  const [userViewRights, setUserViewRights] = useState("");
  const [rightsChecked, setRightsChecked] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [filterDays, setFilterDays] = useState("365");
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filterField, setFilterField] = useState("All");

  const buildFilterCond = useCallback(() => {
    if (filterField === "All" || globalFilter.trim() === "") {
      return ""; // No filtering
    }
    return `${filterField} LIKE '%${globalFilter}%'`;
  }, [filterField, globalFilter]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const payload = {
        NoOfDays: filterDays,
        ForTheUser: `${
          userData.isAdmin ||
          userViewRights === "Allowed" ||
          categoryList.length > 0
            ? ""
            : userData.userName
        }`,
        FilterCond: buildFilterCond(),
      };

      const response = await callSoapService(
        userData.clientURL,
        "DMS_GetDashboard_CategoriesSummary",
        payload
      );

      setCategories(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
      toast({
        variant: "destructive",
        title: "Data Fetch Error",
        description: error.message || "Failed to fetch categories",
      });
    } finally {
      setLoading(false);
    }
  }, [filterDays, userViewRights, userData, buildFilterCond, toast]);

  const fetchCategoryList = useCallback(async () => {
    try {
      const payload = {
        UserName: userData.userName,
      };

      const response = await callSoapService(
        userData.clientURL,
        "DMS_Get_Allowed_DocCategories",
        payload
      );

      setCategoryList(Array.isArray(response) ? response : []);
    } catch (err) {
      toast({
        title: "Failed to load categories.",
        description: err.message || "Error",
        variant: "destructive",
      });
    }
  }, [userData, toast]);

  // First Category View or admin to all this page || View rights all docs not true check category list to get docs

  // Fetch user permissions
  const fetchPermissions = useCallback(async () => {
    try {
      const userType = userData.isAdmin ? "ADMINISTRATOR" : "USER";

      // Fetch both permissions in parallel
      const [rightsResponse, viewRightsResponse] = await Promise.all([
        callSoapService(userData.clientURL, "DMS_CheckRights_ForTheUser", {
          UserName: userData.userName,
          FormName: "DMS-CATEGORIESFORM",
          FormDescription: "Categories View",
          UserType: userType,
        }),
        callSoapService(userData.clientURL, "DMS_CheckRights_ForTheUser", {
          UserName: userData.userName,
          FormName: "DMS-DOCUMENTLISTVIEWALL",
          FormDescription: "View Rights For All Documents",
          UserType: userType,
        }),
      ]);

      setUserRights(rightsResponse);
      setUserViewRights(viewRightsResponse);
    } catch (error) {
      console.error("Failed to fetch user rights:", error);
      toast({
        variant: "destructive",
        title: "Permission Error",
        description: error.message || "Failed to load permissions",
      });
    } finally {
      setRightsChecked(true);
    }
  }, [userData, userRights, userViewRights, toast]);

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      await fetchCategoryList();
      await fetchPermissions();
      await fetchData();
    };

    loadData();
  }, [fetchPermissions, fetchData, fetchCategoryList]);

  // Refresh data when filters change
  useEffect(() => {
    if (rightsChecked) {
      fetchData();
    }
  }, [filterField, globalFilter, filterDays, rightsChecked, fetchData]);

  const categoriesToDisplay = useMemo(() => {
    if (userData.isAdmin) {
      return categories;
    }

    if (categoryList.length > 0) {
      return categories.filter((cat) =>
        categoryList.some((c) => c.CATEGORY_NAME === cat.DOC_RELATED_CATEGORY)
      );
    }

    // If user has no allowed categories, show nothing
    return [];
  }, [categories, categoryList]);

  // const fetchUserViewRights = async () => {
  //   try {
  //     const userType = userData.isAdmin ? "ADMINISTRATOR" : "USER";
  //     const payload = {
  //       UserName: userData.userName,
  //       FormName: "DMS-DOCUMENTLISTVIEWALL",
  //       FormDescription: "View Rights For All Documents",
  //       UserType: userType,
  //     };

  //     const response = await callSoapService(
  //       userData.clientURL,
  //       "DMS_CheckRights_ForTheUser",
  //       payload
  //     );

  //     setUserViewRights(response);
  //   } catch (error) {
  //     console.error("Failed to fetch user rights:", error);
  //     toast({
  //       variant: "destructive",
  //       title: error,
  //     });
  //   }
  // };

  // const fetchUserRights = async () => {
  //   try {
  //     const userType = userData.isAdmin ? "ADMINISTRATOR" : "USER";
  //     const payload = {
  //       UserName: userData.userName,
  //       FormName: "DMS-CATEGORIESFORM",
  //       FormDescription: "Categories View",
  //       UserType: userType,
  //     };

  //     const response = await callSoapService(
  //       userData.clientURL,
  //       "DMS_CheckRights_ForTheUser",
  //       payload
  //     );

  //     setUserRights(response);
  //   } catch (error) {
  //     console.error("Failed to fetch user rights:", error);
  //     toast({
  //       variant: "destructive",
  //       title: error,
  //     });
  //   } finally {
  //     setRightsChecked(true);
  //   }
  // };

  return (
    <div className="space-y-2">
      {/* CONTROLS ROW */}
      <div className="flex flex-col md:flex-row md:justify-between items-stretch gap-2">
        {/* Search */}
        <div className="flex items-center gap-2 w-full">
          <Select value={filterField} onValueChange={setFilterField}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="X_CLIENT_NAME">Client</SelectItem>
                <SelectItem value="X_VENDOR_NAME">Supplier</SelectItem>
                <SelectItem value="DOC_REF_VALUE">Doc Ref for</SelectItem>
                <SelectItem value="DOC_TAGS">Tags</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <div className="w-full lg:w-1/2">
            <GlobalSearchInput
              value={globalFilter}
              onChange={setGlobalFilter}
            />
          </div>
        </div>

        {/* Filter dropdown */}
        <div className="flex-shrink-0">
          <TimeRangeSelector onFilterChange={setFilterDays} />
        </div>
      </div>

      {!rightsChecked || loading ? (
        <div className="flex justify-center items-center">
          <BarLoader color="#36d399" height={2} width="100%" />
        </div>
      ) : userRights !== "Allowed" ? (
        <AccessDenied />
      ) : categoriesToDisplay.length === 0 ? (
        <p className="text-center text-sm">
          {" "}
          {categoryList.length === 0 &&
          !(userData.isAdmin || userViewRights === "Allowed")
            ? "No categories assigned to you."
            : "No data found..."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {categoriesToDisplay.map((category) => (
            <Link
              to="/document-view"
              state={{ categoryName: category.DOC_RELATED_CATEGORY }}
              key={category.DOC_RELATED_CATEGORY}
              className="hover:scale-[1.01] transition-transform"
            >
              <Card className="h-20 flex items-center px-4 py-1 rounded-xl shadow-sm hover:shadow-md transition">
                <div className="flex items-center w-full gap-3">
                  <div className="bg-blue-100 text-blue-600 p-1 rounded-md">
                    📁
                  </div>

                  {/* Text Content */}
                  <div className="flex flex-col justify-center w-full overflow-hidden">
                    <h3
                      className="text-sm font-semibold truncate w-full
                      "
                      title={category.DOC_RELATED_CATEGORY}
                    >
                      {category.DOC_RELATED_CATEGORY}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {category.total_count}{" "}
                      {category.total_count === 1 ? "document" : "documents"}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
