export function extractSensitiveFields(obj: any) {
  let results: any = [];

  function recurse(current: any, path: string) {
    // Check for content-desc field
    if (
      current["content-desc"] &&
      current["content-desc"] !== "none" &&
      current["content-desc"].trim() !== ""
    ) {
      results.push({
        path: `${path}/content-desc`,
        value: current["content-desc"],
      });
    }

    // Check for text_field field
    if (
      current["text_field"] &&
      current["text_field"] !== "none" &&
      current["text_field"].trim() !== ""
    ) {
      results.push({
        path: `${path}/text_field`,
        value: current["text_field"],
      });
    }

    // Recurse if children exist
    if (current.children && Array.isArray(current.children)) {
      current.children.forEach((child: any, index: any) =>
        recurse(child, `${path}/children[${index}]`)
      );
    }
  }

  recurse(obj, "");
  return results;
}

export function redactByKeyword(
  obj: any,
  keyword: string,
  replacement: string = "Text redacted"
) {
  function recurse(current: any) {
    // Check for content-desc field
    if (
      current["content-desc"] &&
      current["content-desc"].toLowerCase().includes(keyword.toLowerCase())
    ) {
      current["content-desc"] = replacement;
    }

    // Check for text_field field
    if (
      current["text_field"] &&
      current["text_field"].toLowerCase().includes(keyword.toLowerCase())
    ) {
      current["text_field"] = replacement;
    }

    // Recurse if children exist
    if (current.children && Array.isArray(current.children)) {
      current.children.forEach((child: any) => recurse(child));
    }
  }

  recurse(obj);
  return obj;
}

export function redactByPath(
  obj: any,
  path: string,
  replacement: string = "Text redacted"
) {
  const pathParts = path.split("/").filter((part) => part !== "");
  let current = obj;

  // Traverse through all but the last part of the path
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];

    if (part.startsWith("children[")) {
      const index = parseInt(part.substring(9, part.length - 1));

      if (!current.children || !current.children[index]) {
        console.error("Invalid path: children index out of bounds");
        return obj; // Return the original object if path is invalid
      }

      current = current.children[index];
    } else {
      // Navigate to the next property if it exists
      if (!(part in current)) {
        console.error(
          `Invalid path: property "${part}" does not exist on object`
        );
        return obj; // Return the original object if path is invalid
      }

      current = current[part];
    }
  }

  // Get the last part of the path, which should be the field to redact
  const lastPart = pathParts[pathParts.length - 1];

  // Redact the specified field if it exists
  if (lastPart in current) {
    current[lastPart] = replacement;
  } else {
    console.error(
      `Invalid path: property "${lastPart}" does not exist on object`
    );
  }

  return obj;
}
