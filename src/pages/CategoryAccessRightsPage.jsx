import AccessDenied from "@/components/AccessDenied";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { convertDataModelToStringData } from "@/utils/dataModelConverter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import {
  Check,
  CheckSquare,
  ChevronsUpDown,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { callSoapService } from "../api/callSoapService";

export const CategoryAccessRightsPage = () => {
  const [roleDetails, setRoleDetails] = useState({
    ROLE_NAME: "",
    ROLE_ID: "",
    ROLE_DESCRIPTION: "",
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [rolesList, setRolesList] = useState([]);
  const [tableSearchInput, setTableSearchInput] = useState("");
  const [categoriesList, setCategoriesList] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);

  const [openRolePopover, setOpenRolePopover] = useState(false);
  const [openDisplayNamePopover, setOpenDisplayNamePopover] = useState(false);

  const [roleSearchInput, setRoleSearchInput] = useState("");
  const [displayNameSearchInput, setDisplayNameSearchInput] = useState("");

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasFetchedData, setHasFetchedData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedCategoryItems, setSelectedCategoryItems] = useState([]);

  const { toast } = useToast();
  const { userData } = useAuth();

  useEffect(() => {
    if (!hasFetchedData && userData.clientURL) {
      fetchRolesData();
      fetchCategoriesData();
      setHasFetchedData(true);
    }
  }, [, userData.clientURL, hasFetchedData]);

  const fetchRolesData = async () => {
    setLoadingRoles(true);
    try {
      const payload = {
        DataModelName: "general_roles_master",
        WhereCondition: "",
        Orderby: "ROLE_ID",
      };

      const response = await callSoapService(
        userData.clientURL,
        "DataModel_GetData",
        payload
      );

      const formattedRoles = response.map((role) => ({
        ROLE_NAME: role.ROLE_NAME?.trim(),
        ROLE_ID: role.ROLE_ID.toString(),
        ROLE_DESCRIPTION: role.ROLE_DESCRIPTION || "",
      }));

      setRolesList(formattedRoles);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching roles",
        description: error.message,
      });
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchCategoriesData = async () => {
    setLoadingCategories(true);
    try {
      const payload = {
        DataModelName: "SYNM_DMS_DOC_CATEGORIES",
        WhereCondition: "",
        Orderby: "CATEGORY_NAME",
      };

      const response = await callSoapService(
        userData.clientURL,
        "DataModel_GetData",
        payload
      );

      const categoriesArray = Array.isArray(response)
        ? response
        : response?.data || [];
      const formattedCategories = categoriesArray.map((category) => ({
        CATEGORY_ID: category.CATEGORY_ID,
        name: category.CATEGORY_NAME,
        DISPLAY_NAME: category.DISPLAY_NAME,
        MODULE_NAME: category.MODULE_NAME,
      }));

      setCategoriesList(formattedCategories);
      setFilteredCategories(formattedCategories);
    } catch (error) {
      setCategoriesList([]);
      setFilteredCategories([]);
      toast({
        variant: "destructive",
        title: "Error fetching categories",
        description: error.message || "Failed to fetch categories",
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchRoleCategoryData = async (ROLE_ID) => {
    setLoading(true);
    try {
      const payload = {
        DataModelName: "synm_dms_doc_catg_roles",
        WhereCondition: `ROLE_ID = '${ROLE_ID}'`,
        Orderby: "CATEGORY_NAME",
      };

      const response = await callSoapService(
        userData.clientURL,
        "DataModel_GetData",
        payload
      );

      if (Array.isArray(response) && response.length > 0) {
        const categoryItems = response.map((item) => {
          const matchingCategory = categoriesList.find(
            (cat) => cat.name === item.CATEGORY_NAME
          );

          return {
            CATEGORY_ID: matchingCategory?.CATEGORY_ID || null,
            CATEGORY_NAME: item.CATEGORY_NAME,
            DISPLAY_NAME: matchingCategory?.DISPLAY_NAME || "",
            MODULE_NAME: matchingCategory?.MODULE_NAME || "",
          };
        });

        setSelectedCategoryItems(categoryItems);
        setSelectedCategory(null);
      } else {
        setSelectedCategoryItems([]);
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error("Error fetching role categories:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch category assignments for this role",
      });
      setSelectedCategoryItems([]);
      setSelectedCategory(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role) => {
    setRoleDetails({
      ROLE_NAME: role.ROLE_NAME,
      ROLE_ID: role.ROLE_ID,
      ROLE_DESCRIPTION: role.ROLE_DESCRIPTION || "",
    });
    setOpenRolePopover(false);

    fetchRoleCategoryData(role.ROLE_ID);
  };

  const handleDisplayNameSelect = (DISPLAY_NAME) => {
    setOpenDisplayNamePopover(false);

    const matchingCategories = categoriesList.filter(
      (c) => c.DISPLAY_NAME === DISPLAY_NAME
    );

    if (matchingCategories.length > 0) {
      setSelectedCategory({ DISPLAY_NAME: DISPLAY_NAME });

      const existingItemsMap = {};
      selectedCategoryItems.forEach((item) => {
        const key = `${item.CATEGORY_NAME}-${item.MODULE_NAME}`;
        existingItemsMap[key] = item;
      });

      const newItems = [...selectedCategoryItems];
      let addedCount = 0;

      matchingCategories.forEach((category) => {
        const key = `${category.name}-${category.MODULE_NAME}`;
        if (!existingItemsMap[key]) {
          newItems.push({
            CATEGORY_ID: category.CATEGORY_ID,
            CATEGORY_NAME: category.name,
            DISPLAY_NAME: category.DISPLAY_NAME,
            MODULE_NAME: category.MODULE_NAME,
          });
          addedCount++;
        }
      });

      if (addedCount > 0) {
        setSelectedCategoryItems(newItems);
        toast({
          title: "Categories Added",
          description: `Added ${addedCount} new categories to the selection`,
          duration: 2000,
        });
      } else {
        toast({
          variant: "default",
          title: "Info",
          description: "These categories are already selected",
          duration: 2000,
        });
      }
    }
  };

  // New function to handle "Select All" option
  const handleSelectAll = () => {
    setOpenDisplayNamePopover(false);

    if (categoriesList.length === 0) {
      toast({
        variant: "destructive",
        title: "No Categories",
        description: "No categories available to select",
      });
      return;
    }

    // Create a map of existing items to avoid duplicates
    const existingItemsMap = {};
    selectedCategoryItems.forEach((item) => {
      const key = `${item.CATEGORY_NAME}-${item.MODULE_NAME}`;
      existingItemsMap[key] = item;
    });

    const newItems = [...selectedCategoryItems];
    let addedCount = 0;

    // Add all categories that aren't already selected
    categoriesList.forEach((category) => {
      const key = `${category.name}-${category.MODULE_NAME}`;
      if (!existingItemsMap[key]) {
        newItems.push({
          CATEGORY_ID: category.CATEGORY_ID,
          CATEGORY_NAME: category.name,
          DISPLAY_NAME: category.DISPLAY_NAME,
          MODULE_NAME: category.MODULE_NAME,
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setSelectedCategoryItems(newItems);
      setSelectedCategory({ DISPLAY_NAME: "All Categories" });
      toast({
        title: "All Categories Added",
        description: `Added All categories to the selection`,
        duration: 3000,
      });
    } else {
      toast({
        variant: "default",
        title: "Info",
        description: "All categories are already selected",
        duration: 2000,
      });
    }
  };

  const handleCategoryDelete = async (CATEGORY_ID, CATEGORY_NAME) => {
    if (deleting) return;
    setDeleting(true);

    try {
      if (!roleDetails.ROLE_ID || !CATEGORY_NAME) {
        throw new Error("Role ID or Category Name not found");
      }

      const payload = {
        UserName: userData.userEmail,
        DataModelName: "synm_dms_doc_catg_roles",
        WhereCondition: `ROLE_ID = '${roleDetails.ROLE_ID}' AND CATEGORY_NAME = '${CATEGORY_NAME}'`,
      };

      const response = await callSoapService(
        userData.clientURL,
        "DataModel_DeleteData",
        payload
      );

      setSelectedCategoryItems((prev) =>
        prev.filter((item) => item.CATEGORY_NAME !== CATEGORY_NAME)
      );

      toast({
        title: "Category removed",
        description: `${CATEGORY_NAME} has been removed successfully`,
        duration: 2000,
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        variant: "destructive",
        title: "Error removing category",
        description: error.message || "Failed to remove category",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getAllUniqueDisplayNames = () => {
    const uniqueDisplayNames = categoriesList
      .map((cat) => cat.DISPLAY_NAME)
      .filter((value, index, self) => self.indexOf(value) === index && value);

    return uniqueDisplayNames;
  };

  const handleSave = async () => {
    if (!roleDetails.ROLE_ID || selectedCategoryItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select both a role and at least one category item",
      });
      return;
    }

    setSaving(true);
    try {
      // First, check which categories already exist to avoid duplicates
      const existingCategoriesPayload = {
        DataModelName: "synm_dms_doc_catg_roles",
        WhereCondition: `ROLE_ID = '${roleDetails.ROLE_ID}'`,
        Orderby: "CATEGORY_NAME",
      };

      let existingCategories = [];
      try {
        const existingResponse = await callSoapService(
          userData.clientURL,
          "DataModel_GetData",
          existingCategoriesPayload
        );
        existingCategories = Array.isArray(existingResponse)
          ? existingResponse
          : [];
      } catch (error) {
        console.log("No existing categories found or error fetching:", error);
      }

      // Create a set of existing category names for quick lookup
      const existingCategoryNames = new Set(
        existingCategories.map((cat) => cat.CATEGORY_NAME)
      );

      // Filter out categories that already exist
      const categoriesToSave = selectedCategoryItems.filter(
        (item) => !existingCategoryNames.has(item.CATEGORY_NAME)
      );

      if (categoriesToSave.length === 0) {
        toast({
          variant: "default",
          title: "Info",
          description:
            "All selected categories are already assigned to this role",
          duration: 2000,
        });
        return;
      }

      let savedCount = 0;
      let failedCount = 0;

      // Save categories one by one with delay to prevent overwhelming the API
      for (const item of categoriesToSave) {
        try {
          const categoryRoleData = {
            ROLE_ID: roleDetails.ROLE_ID,
            CATEGORY_ID: item.CATEGORY_ID,
            CATEGORY_NAME: item.CATEGORY_NAME,
            MODULE_NAME: item.MODULE_NAME,
            DISPLAY_NAME: item.DISPLAY_NAME,
          };

          const data = convertDataModelToStringData(
            "synm_dms_doc_catg_roles",
            categoryRoleData
          );

          const payload = {
            UserName: userData.userEmail,
            DModelData: data,
          };

          const response = await callSoapService(
            userData.clientURL,
            "DataModel_SaveData",
            payload
          );

          // Check if the response indicates success
          if (
            response !== null &&
            response !== undefined &&
            !(typeof response === "object" && response.error)
          ) {
            savedCount++;
          } else {
            console.error(
              `Failed to save category ${item.CATEGORY_NAME}:`,
              response
            );
            failedCount++;
          }

          // Small delay between each save to prevent overwhelming the server
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Error saving category ${item.CATEGORY_NAME}:`, error);
          failedCount++;
        }
      }

      // Reset form only if at least some categories were saved successfully
      if (savedCount > 0) {
        setRoleDetails({ ROLE_NAME: "", ROLE_ID: "", ROLE_DESCRIPTION: "" });
        setSelectedCategory(null);
        setSelectedCategoryItems([]);

        if (failedCount > 0) {
          toast({
            variant: "default",
            title: "Partial Success",
            description: `Saved ${savedCount} categories successfully, ${failedCount} failed`,
            duration: 3000,
          });
        } else {
          toast({
            variant: "default",
            title: "Success",
            description: `Successfully saved ${savedCount} category items to role ${roleDetails.ROLE_NAME}`,
            duration: 3000,
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Save failed",
          description: `Failed to save any categories. ${failedCount} categories failed to save.`,
        });
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error.message || "Failed to save category access rights",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setRoleDetails({ ROLE_NAME: "", ROLE_ID: "", ROLE_DESCRIPTION: "" });
    setSelectedCategory(null);
    setSelectedCategoryItems([]);
  };

  if (!userData?.isAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* <h1 className="text-2xl font-semibold">Category Form</h1> */}

      {/* Role Details Card */}
      <div className="flex flex-col items-start gap-4 md:flex-row">
        {/* Role Details */}
        <div className="flex-grow">
          <div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              {/* Role Selector - Full width on mobile, 40% on desktop */}
              <div className="md:col-span-2">
                <Label>Select Role Name</Label>
                <Popover
                  open={openRolePopover}
                  onOpenChange={setOpenRolePopover}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between text-left font-normal"
                    >
                      {roleDetails.ROLE_NAME || "Select role name"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="z-50 h-[200px] w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search role name"
                        value={roleSearchInput}
                        onValueChange={setRoleSearchInput}
                      />
                      <CommandList>
                        <CommandEmpty>No roles found.</CommandEmpty>
                        <CommandGroup>
                          {loadingRoles ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Loading roles...
                            </div>
                          ) : (
                            rolesList
                              .filter((role) =>
                                role.ROLE_NAME.toLowerCase().includes(
                                  roleSearchInput.toLowerCase()
                                )
                              )
                              .map((role) => (
                                <CommandItem
                                  key={`role-${role.ROLE_ID}`}
                                  value={role.ROLE_NAME}
                                  onSelect={() => handleRoleSelect(role)}
                                >
                                  {role.ROLE_NAME}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      roleDetails.ROLE_ID === role.ROLE_ID
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="mt-2 flex items-center text-left md:col-span-3 md:mt-7">
                <Label className="text-gray-500 md:ml-3">
                  <span className="truncate font-medium">Description:</span>{" "}
                  {roleDetails.ROLE_DESCRIPTION || "-"}
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Selection Card */}
      <Card
        className={cn(
          "border",
          !roleDetails.ROLE_ID && "pointer-events-none opacity-50"
        )}
      >
        <div className="p-2">
          {/* Title on left, Dropdown and Search on right */}
          <div className="mb-2 flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left side - Title */}
            <div className="flex-shrink-0">
              <Label className="text-sm font-semibold">
                Category Selection
              </Label>
            </div>

            {/* Right side - Dropdown and Search */}
            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
              {/* Display Name Dropdown */}
              <div className="w-full sm:w-[200px] md:w-[220px]">
                <Popover
                  open={openDisplayNamePopover}
                  onOpenChange={setOpenDisplayNamePopover}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left"
                    >
                      <span className="truncate pr-2">
                        {selectedCategory?.DISPLAY_NAME ||
                          "Select Display Name"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="z-50 h-[200px] w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search Display Name..."
                        value={displayNameSearchInput}
                        onValueChange={setDisplayNameSearchInput}
                      />
                      <CommandList>
                        <CommandGroup>
                          {loadingCategories ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Loading display names...
                            </div>
                          ) : (
                            <>
                              <CommandItem
                                key="select-all"
                                value="select-all-categories"
                                onSelect={handleSelectAll}
                                className="font-medium text-primary"
                              >
                                <span>Select All Categories</span>
                              </CommandItem>
                              {getAllUniqueDisplayNames()
                                .filter((DISPLAY_NAME) =>
                                  DISPLAY_NAME.toLowerCase().includes(
                                    displayNameSearchInput.toLowerCase()
                                  )
                                )
                                .map((DISPLAY_NAME) => (
                                  <CommandItem
                                    key={`display-name-${DISPLAY_NAME}`}
                                    value={DISPLAY_NAME}
                                    onSelect={() =>
                                      handleDisplayNameSelect(DISPLAY_NAME)
                                    }
                                  >
                                    <div className="flex w-full items-center justify-between">
                                      <span>{DISPLAY_NAME}</span>
                                      {selectedCategory?.DISPLAY_NAME ===
                                        DISPLAY_NAME && (
                                        <Check className="h-4 w-4 text-primary" />
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                            </>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-[200px] md:w-[220px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search Categories.."
                  value={tableSearchInput}
                  onChange={(e) => setTableSearchInput(e.target.value)}
                  className="w-full pl-9 font-medium text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Categories Table */}
          <div className="rounded-md border dark:border-gray-800">
            <ScrollArea className="h-[41vh]">
              {loading ? (
                <div className="py-4 text-center text-sm">
                  Loading assigned categories...
                </div>
              ) : selectedCategoryItems.length > 0 ? (
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow className="text-sm font-medium dark:border-gray-800">
                      <TableHead>Category Name</TableHead>
                      <TableHead>Module Name</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCategoryItems
                      .filter((item) =>
                        item.CATEGORY_NAME.toLowerCase().includes(
                          tableSearchInput.toLowerCase()
                        )
                      )
                      .map((item) => (
                        <TableRow
                          key={`selected-${item.CATEGORY_ID}-${item.CATEGORY_NAME}`}
                          className="text-sm dark:border-gray-800"
                        >
                          <TableCell>{item.CATEGORY_NAME}</TableCell>
                          <TableCell>{item.MODULE_NAME}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleCategoryDelete(
                                  item.CATEGORY_ID,
                                  item.CATEGORY_NAME
                                )
                              }
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              disabled={deleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-4 text-center text-sm">
                  {roleDetails.ROLE_ID
                    ? "No categories assigned to this role"
                    : "Select a role to view or add categories"}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 md:self-end">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={
            !roleDetails.ROLE_ID || saving || selectedCategoryItems.length === 0
          }
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};