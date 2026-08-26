import sharp from "sharp";

const EXPECTED_2K_DIMENSIONS: Record<string, readonly [number, number]> = {
  "1:1": [2048, 2048],
  "9:16": [1536, 2752],
  "16:9": [2752, 1536],
};

export async function assertTwoKImageDimensions({
  imageBuffer,
  imageSize,
  aspectRatio,
  model,
  makeError,
}: {
  imageBuffer: Buffer;
  imageSize: string;
  aspectRatio: string;
  model: string;
  makeError: (message: string) => Error;
}) {
  if (imageSize !== "2K") return;

  const expected = EXPECTED_2K_DIMENSIONS[aspectRatio];
  if (!expected) {
    throw makeError(`2K validation is not configured for aspect ratio ${aspectRatio}.`);
  }

  const metadata = await sharp(imageBuffer).metadata();
  if (metadata.width !== expected[0] || metadata.height !== expected[1]) {
    throw makeError(
      `${model} returned ${metadata.width ?? "unknown"}x${metadata.height ?? "unknown"}; expected 2K ${expected[0]}x${expected[1]}.`,
    );
  }
}
