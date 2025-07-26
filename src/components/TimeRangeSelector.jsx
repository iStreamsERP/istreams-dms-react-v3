import { Button } from "@/components/ui/button";
import { useState } from "react";


const TimeRangeSelector = ({ onFilterChange }) => {
  const [selectedFilter, setSelectedFilter] = useState("365");

  const filterOptions = [
    { label: "All", value: "365" },
    { label: "Past 7 Days", value: "7" },
    { label: "Past 30 Days", value: "30" },
    { label: "Past 90 Days", value: "90" },
  ];

  const handleClick = (value) => {
    if (value === selectedFilter) return;      // no operation if same clicked
    setSelectedFilter(value);
    onFilterChange(value);
  };

  return (
    <div className="flex gap-2">
      {filterOptions.map((opt) => (
        <Button
          key={opt.value}
          variant={opt.value === selectedFilter ? "default" : "outline"}
          size="sm"
          onClick={() => handleClick(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
};

export default TimeRangeSelector;
