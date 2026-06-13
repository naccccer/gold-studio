import fs from "node:fs";
import path from "node:path";
import * as mariadb from "mariadb";

function envValue(name) {
  if (process.env[name]) return process.env[name];

  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return null;

  const line = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((item) => item.trim().startsWith(`${name}=`));

  return line?.slice(name.length + 1).trim().replace(/^"|"$/g, "") ?? null;
}

const databaseUrl = envValue("DATABASE_URL");
const parsedUrl = databaseUrl ? new URL(databaseUrl) : null;

const pool = mariadb.createPool({
  host: process.env.DB_HOST || parsedUrl?.hostname || "127.0.0.1",
  port: Number(process.env.DB_PORT || parsedUrl?.port || "3307"),
  user: process.env.DB_USER || (parsedUrl ? decodeURIComponent(parsedUrl.username) : "root"),
  password: process.env.DB_PASSWORD || (parsedUrl ? decodeURIComponent(parsedUrl.password) : ""),
  database: process.env.DB_NAME || parsedUrl?.pathname.slice(1) || "gold_studio",
  charset: "utf8mb4",
});

const categories = [
  ["style_cat_model", "model", "با مدل", 10],
  ["style_cat_catalog", "catalog", "پس زمینه", 20],
  ["style_cat_social", "social", "با جای متن", 30],
  ["style_cat_editorial", "editorial", "با دکور", 40],
  ["style_cat_cinematic", "cinematic", "سینمایی", 50],
  ["style_cat_luxury", "luxury", "آرشیو", 90],
];

const styles = [
  [
    "style_with_model",
    "style_cat_model",
    "با مدل",
    "نمای محصول روی مدل با تنظیمات قابل انتخاب برای ظاهر، کادر، پوشش و فضای عکس.",
    "Act as a senior jewelry and fashion product photographer. Create a product-area image on an adult human model, generally 25 to 35 years old, using hands, wrist, neck, ears, or a portrait crop only as appropriate for the selected controls and product. The jewelry or accessory remains the commercial hero and must match the input product exactly in visible identity: shape, proportions, metal tone, stones, chain, watch face, engravings, material finish, and front-facing design details. Use natural skin texture with visible pores, subtle fine lines, realistic hands, neck, ears, and skin tone variation. Avoid waxy, porcelain, airbrushed, doll-like, plastic, or AI-smoothed skin. Keep the image tasteful, non-sexual, realistic, and product-first.",
    "/images/placeholders/jewelry/style-editorial.webp",
    10,
    true,
    true,
  ],
  [
    "style_clean_white",
    "style_cat_catalog",
    "پس زمینه",
    "خروجی تمیز و محصول محور با انتخاب نوع و رنگ پس زمینه برای فروشگاه و کاتالوگ.",
    "Act as a senior jewelry catalog photographer. Create a clean premium product photograph on a smooth, flat, seamless studio background selected by the user. The background must stay simple, even, and product-only: no visible folds, waves, draped fabric, cushions, props, decorative set design, steps, slabs, hard horizon lines, busy textures, or lifestyle styling. Use only subtle natural contact shadows under the product. Default to a simple soft white background when no background controls are provided. The input product is the absolute reference: preserve the exact shape, proportions, metal color, stone count and placement, chain or clasp design, engravings, texture, and visible imperfections. Use softbox studio lighting, realistic metal reflections, crisp but not over-sharpened detail, and true-to-life color. No CGI, no artificial sparkle, no plastic finish, no extra stones, no redesign, no AI-glossy look.",
    "/images/placeholders/jewelry/style-minimal.webp",
    20,
    true,
    true,
  ],
  [
    "style_social_media",
    "style_cat_social",
    "با جای متن",
    "تصویر واضح، جذاب و فروش محور برای پست و استوری.",
    "Act as a senior commercial art director for premium social commerce jewelry campaigns. Create a polished, high-impact social media product image for posts and stories, clearly distinct from a white catalog photo. Always reserve clean designed negative space for adding short text later: keep the product off-center on one side or lower corner, modest in scale, and leave the opposite side open and uncluttered. Use a designed tonal editorial background with refined lighting, subtle depth, tasteful shadow, and campaign-style atmosphere. The background must not be plain white, pure white, empty catalog white, or a generic e-commerce cutout unless the user explicitly selected a white-background style. Keep the product readable but not oversized: avoid a huge centered close-up, avoid edge-to-edge product crops, and generally keep the product closer to campaign scale than catalog hero scale so the composition has room to breathe. Keep the composition modern, sales-ready, and visually engaging, but still minimal and premium. Preserve the exact product from the input: shape, proportions, color, metal finish, stones, chain or clasp, watch face, engravings, and small details. Make it eye-catching without looking synthetic. No AI gloss, no fake sparkle, no over-saturated color, no distracting props, no perfume/fragrance styling, no redesign, no altered materials.",
    "/images/placeholders/jewelry/style-natural.webp",
    30,
    true,
    true,
  ],
  [
    "style_soft_editorial",
    "style_cat_editorial",
    "با دکور",
    "فضای مجله ای، خوش استایل و آرام برای تصویر برندمحور.",
    "Act as an editorial still-life jewelry photographer. Create a magazine-style product image with refined composition, considered styling, calm premium surfaces, gentle depth, and product-first luxury direction. Preserve the exact input product identity: shape, scale, material, metal color, stones, clasps, chain details, engravings, and visible craftsmanship. Use realistic reflections, tasteful negative space, and an understated editorial mood. No over-polished AI look, no creamy blur hiding details, no fake props overpowering the product, no redesign, no added or missing parts.",
    "/images/placeholders/jewelry/style-natural.webp",
    40,
    true,
    true,
  ],
  [
    "style_dramatic_dark",
    "style_cat_cinematic",
    "سینمایی",
    "نورپردازی نمایشی و لوکس با کنتراست کنترل شده و جزئیات واضح.",
    "Act as a professional jewelry advertising photographer. Create a cinematic premium product shot with controlled contrast, precise rim light, deep elegant shadows, atmospheric depth, and realistic highlights. The lighting may feel dramatic, but the product must stay readable and faithful to the input: preserve silhouette, proportions, metal color, gemstone layout, chain or clasp, watch face, engravings, surface texture, and small design details. Make the scene cinematic but physically believable. Avoid crushed details, exaggerated sparkle, CGI render style, plastic surfaces, distorted geometry, added parts, or any redesign.",
    "/images/placeholders/jewelry/style-dark.webp",
    50,
    true,
    true,
  ],
  [
    "style_sample_reference",
    "style_cat_editorial",
    "عکس نمونه",
    "جایگذاری محصول داخل چیدمان، نور و حال وهوای یک نمونه انتخاب شده.",
    "Create a premium product image by using the user product photo as the strict product identity and the selected sample/reference image only as the source for arrangement, lighting, color mood, product angle, camera perspective, surface styling, and background. Replace the subject/product in the sample with the user product. Match the sample product angle and perspective as closely as possible while preserving the user product form, metal, stones, engravings, details, proportions, silhouette, material finish, and identity exactly. Do not copy or retain the sample product identity. Keep the final image product-first, realistic, editorial, premium, and not a plain white catalog cutout unless the sample clearly requires that mood.",
    "/images/placeholders/jewelry/style-natural.webp",
    60,
    true,
    true,
  ],
  [
    "style_warm_luxury",
    "style_cat_luxury",
    "دکور انتزاعی",
    "سبک قدیمی آرشیوشده؛ در جریان کاربر نمایش داده نمی شود.",
    "Archived abstract decor style. Keep inactive for user-facing generation.",
    "/images/placeholders/jewelry/style-gold.webp",
    90,
    true,
    false,
  ],
];

const controls = [
  ["control_model_gender", "style_with_model", "modelGender", "جنسیت مدل", "CHOICE", JSON.stringify([{ value: "woman", label: "زن" }, { value: "man", label: "مرد" }]), "woman", null, null, 10, true],
  ["control_model_nationality", "style_with_model", "modelNationality", "ملیت/ظاهر", "CHOICE", JSON.stringify([{ value: "iranian", label: "ایرانی" }, { value: "middleEastern", label: "خاورمیانه‌ای" }, { value: "european", label: "اروپایی" }]), "iranian", null, null, 20, true],
  ["control_face_framing", "style_with_model", "faceFraming", "کادر چهره", "CHOICE", JSON.stringify([{ value: "productArea", label: "ناحیه محصول" }, { value: "partialFace", label: "نیم‌چهره" }, { value: "fullFace", label: "چهره کامل" }]), "productArea", null, null, 30, true],
  ["control_model_scene_style", "style_with_model", "modelSceneStyle", "فضای عکس", "CHOICE", JSON.stringify([{ value: "amateurHome", label: "خانگی آماتور" }, { value: "studio", label: "استودیویی" }, { value: "outdoor", label: "فضای بیرون" }]), "studio", null, null, 40, true],
  ["control_full_hijab", "style_with_model", "fullHijab", "حجاب کامل", "BOOLEAN", null, "false", null, null, 50, true],
  ["control_background_type", "style_clean_white", "backgroundType", "نوع پس زمینه", "CHOICE", JSON.stringify([{ value: "simple", label: "ساده" }, { value: "fabric", label: "پارچه" }, { value: "leather", label: "چرم" }, { value: "stone", label: "سنگ" }, { value: "paper", label: "کاغذ استودیویی" }]), "simple", null, null, 10, true],
  ["control_background_color", "style_clean_white", "backgroundColor", "رنگ پس زمینه", "CHOICE", JSON.stringify([{ value: "white", label: "سفید نرم" }, { value: "cream", label: "کرم شامپاینی" }, { value: "lightGray", label: "طوسی روشن" }, { value: "blush", label: "رز خیلی ملایم" }, { value: "navy", label: "سرمه ای" }, { value: "charcoal", label: "ذغالی" }, { value: "softBlack", label: "مشکی نرم" }, { value: "forest", label: "سبز تیره" }, { value: "burgundy", label: "زرشکی تیره" }, { value: "espresso", label: "قهوه ای اسپرسو" }]), "white", null, null, 20, true],
  ["control_social_background_tone", "style_social_media", "socialBackgroundTone", "پس زمینه", "CHOICE", JSON.stringify([{ value: "light", label: "روشن" }, { value: "dark", label: "تیره" }]), "light", null, null, 10, true],
  ["control_social_text_placement", "style_social_media", "socialTextPlacement", "جای متن", "CHOICE", JSON.stringify([{ value: "right", label: "راست" }, { value: "left", label: "چپ" }, { value: "top", label: "بالا" }, { value: "bottom", label: "پایین" }]), "right", null, null, 20, true],
  ["control_editorial_mood", "style_soft_editorial", "editorialMood", "حال وهوای مجله ای", "CHOICE", JSON.stringify([{ value: "calm", label: "آرام" }, { value: "luxury", label: "لوکس" }, { value: "bold", label: "جسور" }]), "calm", null, null, 10, true],
  ["control_editorial_depth", "style_soft_editorial", "depthOfField", "عمق میدان", "RANGE", null, "45", 0, 100, 20, true],
  ["control_cinematic_contrast", "style_dramatic_dark", "contrastIntensity", "شدت کنتراست", "RANGE", null, "65", 0, 100, 10, true],
  ["control_cinematic_dark_background", "style_dramatic_dark", "darkBackground", "پس زمینه تیره", "BOOLEAN", null, "true", null, null, 20, true],
];

async function main() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("ALTER TABLE `StyleControl` MODIFY `type` ENUM('CHOICE', 'RANGE', 'BOOLEAN') NOT NULL");

    for (const row of categories) {
      await connection.query(
        "INSERT INTO `StyleCategory` (`id`, `slug`, `name`, `sortOrder`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE `slug` = VALUES(`slug`), `name` = VALUES(`name`), `sortOrder` = VALUES(`sortOrder`), `updatedAt` = NOW(3)",
        row,
      );
    }

    for (const row of styles) {
      await connection.query(
        "INSERT INTO `CreativeStyle` (`id`, `categoryId`, `name`, `description`, `prompt`, `previewImageUrl`, `previewSource`, `sortOrder`, `isActive`, `isUserVisible`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, ?, 'placeholder', ?, ?, ?, NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE `categoryId` = VALUES(`categoryId`), `name` = VALUES(`name`), `description` = VALUES(`description`), `prompt` = VALUES(`prompt`), `previewImageUrl` = VALUES(`previewImageUrl`), `previewSource` = VALUES(`previewSource`), `sortOrder` = VALUES(`sortOrder`), `isActive` = VALUES(`isActive`), `isUserVisible` = VALUES(`isUserVisible`), `updatedAt` = NOW(3)",
        row,
      );
    }

    await connection.query(
      "UPDATE `CreativeStyle` SET `isUserVisible` = false, `sortOrder` = 90, `updatedAt` = NOW(3) WHERE `id` NOT IN (?, ?, ?, ?, ?, ?, ?)",
      ["style_with_model", "style_clean_white", "style_social_media", "style_soft_editorial", "style_dramatic_dark", "style_sample_reference", "style_warm_luxury"],
    );
    await connection.query("UPDATE `StyleControl` SET `isActive` = false, `updatedAt` = NOW(3)");

    for (const row of controls) {
      await connection.query(
        "INSERT INTO `StyleControl` (`id`, `styleId`, `key`, `label`, `type`, `optionsJson`, `defaultValue`, `minValue`, `maxValue`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `type` = VALUES(`type`), `optionsJson` = VALUES(`optionsJson`), `defaultValue` = VALUES(`defaultValue`), `minValue` = VALUES(`minValue`), `maxValue` = VALUES(`maxValue`), `sortOrder` = VALUES(`sortOrder`), `isActive` = VALUES(`isActive`), `updatedAt` = NOW(3)",
        row,
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
