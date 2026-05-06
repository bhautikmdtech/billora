import QRCode from "qrcode";

export function generateQrData(
  shopCode: string,
  skuCode: string,
  category: string,
  color: string
) {
  return JSON.stringify({
    s: shopCode,
    k: skuCode,
    c: category,
    col: color,
  });
}

export async function generateQrImage(qrData: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(qrData, {
      margin: 1,
      width: 200,
    });
    return dataUrl;
  } catch (err) {
    console.error("QR Generation Error:", err);
    throw new Error("Failed to generate QR image");
  }
}
