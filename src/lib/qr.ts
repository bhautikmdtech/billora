import QRCode from "qrcode";

export interface QrRenderOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
}

export async function generateQrDataUrl(
  value: string,
  options: QrRenderOptions = {}
) {
  return QRCode.toDataURL(value, {
    width: options.width ?? 320,
    margin: options.margin ?? 1,
    color: {
      dark: options.darkColor ?? "#111111",
      light: options.lightColor ?? "#FFFFFF",
    },
  });
}

export function encodeQrPayload(payload: Record<string, unknown>) {
  return JSON.stringify(payload);
}

