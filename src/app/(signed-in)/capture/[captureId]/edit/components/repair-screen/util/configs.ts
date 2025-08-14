import { ListedFiles } from "@/lib/actions";
import { SWRConfiguration } from "swr";
import { isCloudfrontUrlExpired } from "@/lib/aws";
import { Variants } from "motion/react";

export const card = {
  initial: {
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "spring",
      bounce: 0.125,
      duration: 0.5,
    },
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      bounce: 0.125,
      duration: 0.5,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "spring",
      bounce: 0.125,
      duration: 0.5,
    },
  },
} as Variants;

export const getSWRConfig = (
  captureId: string
): SWRConfiguration<ListedFiles[]> => ({
  refreshInterval: 5000,
  compare: (prevFiles, currFiles) => {
    if (!prevFiles || !currFiles) {
      // if one is undefined and the other is not, return false
      if (!prevFiles && currFiles) {
        return false;
      }
      if (prevFiles && !currFiles) {
        return false;
      }
      return true;
    }
    // if both are defined, check if the file keys are the same
    if (prevFiles.length !== currFiles.length) {
      return false;
    }
    // check if file keys are the same
    const prevFileKeys = prevFiles.map((file) => file.fileKey);
    const currFileKeys = currFiles.map((file) => file.fileKey);
    if (prevFileKeys.every((key, index) => key === currFileKeys[index])) {
      // check if any file urls are expired
      if (prevFiles.some((file) => isCloudfrontUrlExpired(file.fileUrl))) {
        return false;
      }
      return true;
    }
    return false;
  },
});
