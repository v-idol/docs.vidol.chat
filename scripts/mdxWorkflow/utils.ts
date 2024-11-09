import { globSync } from "glob";
import { resolve } from "node:path";

import { opimized, opimizedGif } from "./optimized";

export const fixWinPath = (path: string) => path.replace(/\\/g, "/");

export const root = resolve(__dirname, "../..");

export const posts = globSync(fixWinPath(resolve(root, "**/*.mdx")));

export const extractHttpsLinks = (text: string) => {
  const regex = /https:\/\/[^\s"')>]+/g;
  const links = text.match(regex);
  return links || [];
};

export const mergeAndDeduplicateArrays = (...arrays: string[][]) => {
  const combinedArray = arrays.flat();
  const uniqueSet = new Set(combinedArray);
  return Array.from(uniqueSet);
};

const mimeToExtensions = {
  "image/gif": ".gif",
  // 图片类型
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/svg+xml": ".svg",
  "image/webp": ".webp",
  // 视频类型
  "video/mp4": ".mp4",
  "video/mpeg": ".mpeg",
  "video/ogg": ".ogv",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  "video/x-flv": ".flv",
  "video/x-matroska": ".mkv",
  "video/x-ms-wmv": ".wmv",
  "video/x-msvideo": ".avi",
};

// @ts-ignore
const getExtension = (type: string) => mimeToExtensions?.[type] || ".png";

export const fetchImageAsFile = async (url: string, width: number) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Step 2: Create a blob from the response data
    const blob = await response.blob();
    let buffer = await blob.arrayBuffer();
    let type = getExtension(blob.type);
    if (type === ".gif") {
      buffer = await opimizedGif(buffer);
      type = ".webp";
    } else if (type === ".png" || type === ".jpg") {
      buffer = await opimized(buffer, width);
      type = ".webp";
    }

    const filename = Date.now().toString() + type;

    // Step 3: Create a file from the blob
    const file: File = new File([buffer], filename, {
      lastModified: Date.now(),
      type: type === ".webp" ? "image/webp" : blob.type,
    });

    return file;
  } catch (error) {
    console.error("Error fetching image as file:", error);
  }
};