type GenerateImageInput = {
  sourceBuffer: Buffer;
  mimeType: string;
  stylePrompt: string;
};

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY تنظیم نشده است.");
  }

  return {
    apiKey,
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash-preview-image-generation",
  };
}

export async function generateStyledImageWithGemini({
  sourceBuffer,
  mimeType,
  stylePrompt,
}: GenerateImageInput): Promise<Buffer> {
  const { apiKey, model } = getGeminiConfig();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${stylePrompt}\n\nReturn only one final generated image with the same product and realistic quality suitable for e-commerce.`,
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: sourceBuffer.toString("base64"),
                },
              },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { data?: string };
          inline_data?: { data?: string };
        }>;
      };
    }>;
  };

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const binary = parts.find((part) => part.inlineData?.data || part.inline_data?.data);
  const base64 = binary?.inlineData?.data || binary?.inline_data?.data;

  if (!base64) {
    throw new Error("Gemini image output not found.");
  }

  return Buffer.from(base64, "base64");
}
