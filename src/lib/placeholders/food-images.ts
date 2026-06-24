const foodPlaceholderBasePath = "/images/placeholders/food";

export type FoodPlaceholderImage = {
  src: string;
  alt: string;
  id?: string;
  title?: string;
  styleLabel?: string;
};

const image = (fileName: string, metadata: Omit<FoodPlaceholderImage, "src">): FoodPlaceholderImage => ({
  src: `${foodPlaceholderBasePath}/${fileName}`,
  ...metadata,
});

export const foodMenuCatalog = image("food-menu-catalog.webp", {
  alt: "عکس استودیویی پاستا برای منو و کاتالوگ غذا",
  title: "منو و کاتالوگ",
  styleLabel: "منو / کاتالوگ",
});

export const foodDrinkSocial = image("food-drink-social.webp", {
  alt: "عکس نوشیدنی قرمز با نور طبیعی برای شبکه اجتماعی",
  title: "نوشیدنی شبکه اجتماعی",
  styleLabel: "اینستاگرام",
});

export const foodDessertChocolate = image("food-dessert-chocolate.webp", {
  alt: "عکس دسر شکلاتی با تمشک و نور استودیویی",
  title: "دسر شکلاتی",
});

export const foodCafeItem = image("food-cafe-item.webp", {
  alt: "عکس کروسان و قهوه در فضای کافه",
  title: "آیتم کافه",
});

export const foodDishNatural = image("food-dish-natural.webp", {
  alt: "عکس بشقاب غذای سالم با نور طبیعی",
  title: "غذای طبیعی",
  styleLabel: "طبیعی / UGC",
});

export const foodPackaged = image("food-packaged.webp", {
  alt: "عکس غذای بسته‌بندی‌شده آماده فروش",
  title: "بسته‌بندی غذا",
});

export const foodMinimal = image("food-style-minimal.webp", {
  alt: "عکس مینیمال بشقاب غذا روی سطح روشن",
  title: "مینیمال",
  styleLabel: "مینیمال",
});

export const foodLuxury = image("food-style-luxury.webp", {
  alt: "عکس لوکس بشقاب رستورانی روی ظرف تیره",
  title: "لوکس",
  styleLabel: "لوکس",
});

export const foodHomeUgc = image("food-home-ugc.webp", {
  alt: "عکس صبحانه و قهوه روی میز کافه",
  title: "کافه طبیعی",
});

export const foodRestaurantPlate = image("food-restaurant-plate.webp", {
  alt: "عکس بشقاب رستورانی با چیدمان حرفه‌ای",
  title: "بشقاب رستورانی",
});

export const foodDessertStrawberry = image("food-dessert-strawberry.webp", {
  alt: "عکس چیزکیک توت‌فرنگی برای منوی دسر",
  title: "دسر توت‌فرنگی",
});

export const foodStyleSamples = [
  foodMenuCatalog,
  foodDrinkSocial,
  foodMinimal,
  foodLuxury,
  foodDishNatural,
];

export const foodReferenceSamples = [
  foodCafeItem,
  foodDessertChocolate,
  foodPackaged,
  foodRestaurantPlate,
  foodDessertStrawberry,
  foodDrinkSocial,
];

export const foodArchiveItems = [
  foodMenuCatalog,
  foodDishNatural,
  foodPackaged,
  foodRestaurantPlate,
  foodHomeUgc,
  foodDessertStrawberry,
];

export const foodPlaceholderImages = {
  homeHero: foodMenuCatalog,
  uploadPreview: foodPackaged,
  resultHeroDark: foodLuxury,
  styleSamples: foodStyleSamples,
  styleReferenceSamples: foodReferenceSamples,
  archiveItems: foodArchiveItems,
  extras: [foodCafeItem, foodDessertChocolate, foodDrinkSocial],
};

