import * as https from "node:https";

export async function downloadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }

        const contentType = response.headers["content-type"] || "image/jpeg";
        const chunks: Buffer[] = [];

        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const buffer = Buffer.concat(chunks);
          const base64Image = buffer.toString("base64");
          resolve(`data:${contentType};base64,${base64Image}`);
        });
      })
      .on("error", reject);
  });
}
