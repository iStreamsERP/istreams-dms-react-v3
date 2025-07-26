import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { convertDataModelToStringData } from "@/utils/dataModelConverter";
import { callSoapService } from "@/api/callSoapService";

const services = [
  {
    name: "AWS",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSoIIjGsTkIXHdPitYpJ8d6vixJGpBYeNRp1g&s",
    description: "Authorize AWS to post alert notifications.",
    fields: [
      { label: "Access Key", key: "AccessKey" },
      { label: "Secret Key", key: "SecretKey" },
      { label: "Region", key: "Region" },
      { label: "Bucket Name", key: "BucketName" },
    ],
  },
  {
    name: "MegaCloud",
    logo: "https://www.cbackup.com/screenshot/en/others/mega/megacloud-icon.png",
    description: "Authorize Mega Cloud to post alert notifications.",
    fields: [
      { label: "Email", key: "Email" },
      { label: "Password", key: "Password" },
    ],
  },
  {
    name: "GoogleDrive",
    logo: "https://mailmeteor.com/logos/assets/PNG/Google_Drive_Logo_256px.png",
    description: "Authorize Google Drive to post alert notifications.",
    fields: [
      { label: "Credentials Path", key: "CredentialsPath" },
      { label: "Application Name", key: "ApplicationName" },
    ],
  },
  {
    name: "DropBox",
    logo: "https://icons.iconarchive.com/icons/papirus-team/papirus-apps/256/dropbox-icon.png",
    description: "Authorize Dropbox to post alert notifications.",
    fields: [{ label: "Access Token", key: "AccessToken" }],
  },
];

export const UserPreferences = () => {
  const { userData } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeServiceName, setActiveServiceName] = useState(null);
  const [savedSettings, setSavedSettings] = useState({});

  if (!userData) return <div>Loading user information…</div>;

  const { clientURL, userEmail, userName } = userData;

  useEffect(() => {
    const fetchExistingSettings = async () => {
      try {
        const payload = {
          DataModelName: "SYNM_DMS_SETTINGS",
          WhereCondition: `USER_NAME = '${userName}'`,
          Orderby: "",
        };

        const response = await callSoapService(
          clientURL,
          "DataModel_GetData",
          payload
        );

        if (response?.length > 0) {
          const settings = {};
          const firstService = response[0].KEY_FOR;

          response.forEach((item) => {
            const serviceName = item.KEY_FOR;
            const key = item.REF_KEY.replace(`${serviceName}_`, "");
            if (!settings[serviceName]) settings[serviceName] = {};
            settings[serviceName][key] = item.REF_VALUE;
          });

          setSavedSettings(settings);
          setActiveServiceName(firstService);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };

    fetchExistingSettings();
  }, [clientURL, userName]);

  const openModal = (service) => {
    setSelectedService(service);
    setFormData(savedSettings[service.name] || {});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  const handleInputChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const confirmConnection = async () => {
    const payloadData = Object.entries(formData).map(([key, value]) => ({
      REF_KEY: `${selectedService.name}_${key}`,
      REF_VALUE: value,
      KEY_FOR: selectedService.name,
      REMARKS: selectedService.description,
      USER_NAME: userName,
      ENT_DATE: new Date().toISOString(),
    }));

    setIsSaving(true);

    try {
      for (const data of payloadData) {
        const convertedDataModel = convertDataModelToStringData(
          "SYNM_DMS_SETTINGS",
          data
        );

        const payload = {
          UserName: userEmail,
          DModelData: convertedDataModel,
        };

        await callSoapService(clientURL, "DataModel_SaveData", payload);

        console.log(`Saved setting for ${data.REF_KEY}`);
      }

      setSavedSettings((prev) => ({
        ...prev,
        [selectedService.name]: formData,
      }));
      setActiveServiceName(selectedService.name);

      alert(`Settings for ${selectedService.name} saved successfully!`);
      closeModal();
    } catch (err) {
      console.error(err);
      alert(
        `Failed to save settings for ${selectedService.name}: ${err.message}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;

    const confirm = window.confirm(
      `Are you sure you want to delete all settings for ${selectedService.name}? This cannot be undone.`
    );

    if (!confirm) return;

    setIsDeleting(true);

    try {
      const payload = {
        UserName: userEmail,
        DataModelName: "SYNM_DMS_SETTINGS",
        WhereCondition: `KEY_FOR = '${selectedService.name}'`,
      };

      await callSoapService(clientURL, "DataModel_DeleteData", payload);

      alert(`Settings for ${selectedService.name} deleted successfully!`);

      setSavedSettings((prev) => {
        const updated = { ...prev };
        delete updated[selectedService.name];
        return updated;
      });

      if (activeServiceName === selectedService.name) {
        setActiveServiceName(null);
      }

      closeModal();
    } catch (err) {
      console.error(err);
      alert(
        `Failed to delete settings for ${selectedService.name}: ${err.message}`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-4xl font-bold mb-1">Settings</h1>
        <p className="text-sm text-gray-500">
          Manage your account settings and cloud preferences.
        </p>
      </header>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-4 h-[calc(100vh-156px)] gap-x-4">
        <aside className="flex flex-col gap-2 h-full">
          <Link to="/settings" className="hover:underline">
            <div className="px-4 py-2 text-sm leading-none rounded-lg">
              Account
            </div>
          </Link>
          <Link to="/cloud-services" className="hover:underline">
            <div className="px-4 py-2 text-sm bg-gray-300 text-slate-950 dark:bg-gray-800 dark:text-slate-50 leading-none rounded-lg">
              Cloud Services
            </div>
          </Link>
          <Link to="/integration" className="hover:underline">
            <div className="px-4 py-2 text-sm leading-none rounded-lg">
              Integration
            </div>
          </Link>
        </aside>

        <main className="overflow-y-auto col-span-3 space-y-2">
          {services.map((service) => {
            const disabled =
              activeServiceName && activeServiceName !== service.name;

            return (
              <div
                key={service.name}
                className={`flex items-center justify-between p-2 shadow-lg rounded-lg ${
                  disabled
                    ? "bg-gray-200 dark:bg-gray-700 opacity-50 pointer-events-none"
                    : "bg-white dark:bg-gray-900"
                }`}
              >
                <div className="flex items-center gap-x-4">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-slate-800">
                    <img
                      src={service.logo}
                      alt={`${service.name} Logo`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {service.description}
                    </p>
                  </div>
                </div>
                <div>
                  <Button
                    onClick={() => openModal(service)}
                    disabled={disabled}
                  >
                    {activeServiceName === service.name ? "Edit" : "Connect"}
                  </Button>
                </div>
              </div>
            );
          })}

          {isModalOpen && selectedService && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {activeServiceName === selectedService.name
                    ? `Edit ${selectedService.name} Settings`
                    : `Connect to ${selectedService.name}`}
                </h2>

                <form className="space-y-4">
                  {selectedService.fields.map((field) => (
                    <div className="w-full" key={field.key}>
                      <Label>{field.label}</Label>
                      <Input
                        type="text"
                        value={formData[field.key] || ""}
                        onChange={(e) =>
                          handleInputChange(field.key, e.target.value)
                        }
                        placeholder={field.label}
                      />
                    </div>
                  ))}
                </form>

                <div className="flex justify-between gap-2 mt-6">
                  <Button
                    onClick={closeModal}
                    variant={"secondary"}
                    disabled={isSaving || isDeleting}
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={handleDeleteService}
                    variant={"destructive"}
                    disabled={isSaving || isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>

                  <Button
                    onClick={confirmConnection}
                    disabled={isSaving || isDeleting}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};