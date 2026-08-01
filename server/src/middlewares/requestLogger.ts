import type { NextFunction, Request, Response } from "express";

interface DeviceInfo {
  browser: string;
  device: string;
}

const detectDevice = (userAgent: string): DeviceInfo => {
  let browser = "Unknown";
  let device = "Desktop";

  if (/firefox|fxios/i.test(userAgent)) browser = "Firefox";
  else if (/edg|edge/i.test(userAgent)) browser = "Edge";
  else if (/opr|opera|opera mini/i.test(userAgent)) browser = "Opera";
  else if (/criOS|crios/i.test(userAgent)) browser = "Chrome (iOS)";
  else if (/chrome|chromium|crmo/i.test(userAgent)) browser = "Chrome";
  else if (/safari/i.test(userAgent)) browser = "Safari";

  if (/iphone|ipod|android.*mobile/i.test(userAgent)) device = "Mobile";
  else if (/ipad|tablet|playbook|silk/i.test(userAgent)) device = "Tablet";

  return { browser, device };
};

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { method, originalUrl, ip } = req;
  const { browser, device } = detectDevice(req.headers["user-agent"] || "");

  const log = () => {
    const time = new Date().toLocaleTimeString("en-US", {
      hour12: false,
    });
    console.log(
      `${method} ${originalUrl} | ${browser} | ${device} | IP: ${ip} | ${time}`,
    );
  };

  res.on("finish", () => {
    if (method !== "OPTIONS") {
      log();
    }
  });

  next();
};
