import { clientEnv } from "./client";

export const envConfig = {
    app: {
        name: "ShopFlow ERP",
        url: clientEnv.NEXT_PUBLIC_APP_URL,
        timezone: "Asia/Kolkata",
    },

    pagination: {
        defaultLimit: 20,
        maxLimit: 100,
    },

    logging: {
        level: "info" as const,
    },

    notifications: {
        resendFromName: "ShopFlow ERP",
    },

} as const;

export type AppEnvConfig = typeof envConfig;