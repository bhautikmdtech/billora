import pino, { type LoggerOptions } from "pino";

import { envConfig } from "@/lib/env/config";

const options: LoggerOptions = {
  level: envConfig.logging.level,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
};

export const logger = pino(options);

export function createRouteLogger(bindings: Record<string, string | number>) {
  return logger.child(bindings);
}

