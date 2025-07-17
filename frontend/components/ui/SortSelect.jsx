'use client';
import * as Select from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils"; // if using shadcn
import { useTheme } from "@/app/context/ThemeContext";

const SortSelect = ({ value, onChange }) => {
  const { darkMode } = useTheme();

  const baseTriggerClasses = cn(
    "inline-flex items-center justify-between w-full sm:w-48 px-4 py-3 rounded-full shadow-md transition text-sm font-medium",
    darkMode
      ? "bg-white text-gray-900"
      : "bg-gray-800 text-white hover:bg-gray-700"
  );

  const contentClasses = cn(
    "z-50 mt-1 rounded-lg shadow-lg p-1",
    darkMode ? "bg-white text-gray-900" : "bg-gray-800 text-white"
  );

  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className={baseTriggerClasses}>
        <Select.Value placeholder="Sort by" />
        <Select.Icon>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className={contentClasses}>
          <Select.Viewport className="p-1">
            {[
              { label: "Newest Borrowed", value: "dateBorrowed" },
              { label: "Title", value: "title" },
            ].map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="flex items-center justify-between px-4 py-2 text-sm rounded-md cursor-pointer hover:bg-[rgba(255,255,255,0.5)] focus:bg-[rgba(255,255,255,0.2)]"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check className="w-4 h-4 ml-2" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

export default SortSelect;
