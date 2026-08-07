"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getMyPreferredDeviceVersions,
  updateMyPreferredDeviceVersions,
} from "@/lib/actions";
import { iosOptions, iphoneOptions } from "@/lib/utils/ios-options";

const NO_DEFAULT_VALUE = "__NONE__";

type DevicePreferences = {
  preferredIOSVersion: string;
  preferredIPhoneVersion: string;
};

const emptyPreferences: DevicePreferences = {
  preferredIOSVersion: "",
  preferredIPhoneVersion: "",
};

export function DevicePreferenceControl() {
  const [isPending, startTransition] = useTransition();
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [savedPreferences, setSavedPreferences] =
    useState<DevicePreferences>(emptyPreferences);
  const [selectedPreferences, setSelectedPreferences] =
    useState<DevicePreferences>(emptyPreferences);

  useEffect(() => {
    let isCancelled = false;
    const loadPreference = async () => {
      const res = await getMyPreferredDeviceVersions();
      if (isCancelled) return;
      const nextPreferences: DevicePreferences = {
        preferredIOSVersion: res.ok ? (res.data.preferredIOSVersion ?? "") : "",
        preferredIPhoneVersion: res.ok
          ? (res.data.preferredIPhoneVersion ?? "")
          : "",
      };
      setSavedPreferences(nextPreferences);
      setSelectedPreferences(nextPreferences);
      setIsBootstrapping(false);
    };
    loadPreference();

    return () => {
      isCancelled = true;
    };
  }, []);

  const iPhoneSelectOptions = useMemo(() => {
    if (!selectedPreferences.preferredIPhoneVersion) {
      return iphoneOptions;
    }
    if (
      iphoneOptions.some(
        (option) => option.value === selectedPreferences.preferredIPhoneVersion,
      )
    ) {
      return iphoneOptions;
    }
    return [
      {
        value: selectedPreferences.preferredIPhoneVersion,
        label: selectedPreferences.preferredIPhoneVersion,
      },
      ...iphoneOptions,
    ];
  }, [selectedPreferences.preferredIPhoneVersion]);

  const iOSSelectOptions = useMemo(() => {
    if (!selectedPreferences.preferredIOSVersion) {
      return iosOptions;
    }
    if (
      iosOptions.some(
        (option) => option.value === selectedPreferences.preferredIOSVersion,
      )
    ) {
      return iosOptions;
    }
    return [
      {
        value: selectedPreferences.preferredIOSVersion,
        label: selectedPreferences.preferredIOSVersion,
      },
      ...iosOptions,
    ];
  }, [selectedPreferences.preferredIOSVersion]);

  const hasUnsavedChanges =
    selectedPreferences.preferredIOSVersion !==
      savedPreferences.preferredIOSVersion ||
    selectedPreferences.preferredIPhoneVersion !==
      savedPreferences.preferredIPhoneVersion;

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateMyPreferredDeviceVersions({
        preferredIOSVersion: selectedPreferences.preferredIOSVersion.trim()
          ? selectedPreferences.preferredIOSVersion
          : null,
        preferredIPhoneVersion:
          selectedPreferences.preferredIPhoneVersion.trim()
            ? selectedPreferences.preferredIPhoneVersion
            : null,
      });
      if (!res.ok) {
        toast.error(res.message || "Failed to save iOS defaults.");
        return;
      }
      const nextPreferences: DevicePreferences = {
        preferredIOSVersion: res.data.preferredIOSVersion ?? "",
        preferredIPhoneVersion: res.data.preferredIPhoneVersion ?? "",
      };
      setSavedPreferences(nextPreferences);
      setSelectedPreferences(nextPreferences);
      toast.success("Saved iOS defaults.");
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-muted-background p-3">
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">
          Default iPhone (iOS tasks)
        </Label>
        <Select
          value={selectedPreferences.preferredIPhoneVersion || NO_DEFAULT_VALUE}
          onValueChange={(value) => {
            setSelectedPreferences((previous) => ({
              ...previous,
              preferredIPhoneVersion: value === NO_DEFAULT_VALUE ? "" : value,
            }));
          }}
          disabled={isPending || isBootstrapping}
        >
          <SelectTrigger>
            <SelectValue placeholder="No default selected" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_DEFAULT_VALUE}>No default</SelectItem>
            {iPhoneSelectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Default iOS Version</Label>
        <Select
          value={selectedPreferences.preferredIOSVersion || NO_DEFAULT_VALUE}
          onValueChange={(value) => {
            setSelectedPreferences((previous) => ({
              ...previous,
              preferredIOSVersion: value === NO_DEFAULT_VALUE ? "" : value,
            }));
          }}
          disabled={isPending || isBootstrapping}
        >
          <SelectTrigger>
            <SelectValue placeholder="No default selected" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_DEFAULT_VALUE}>No default</SelectItem>
            {iOSSelectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={handleSave}
        disabled={!hasUnsavedChanges || isPending || isBootstrapping}
      >
        {isPending ? "Saving..." : "Save default"}
      </Button>
    </div>
  );
}
