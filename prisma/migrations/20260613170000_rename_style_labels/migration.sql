UPDATE `StyleCategory`
SET `name` = 'با جای متن',
    `updatedAt` = NOW(3)
WHERE `id` = 'style_cat_social';

UPDATE `StyleCategory`
SET `name` = 'با دکور',
    `updatedAt` = NOW(3)
WHERE `id` = 'style_cat_editorial';

UPDATE `StyleCategory`
SET `name` = 'سینمایی',
    `updatedAt` = NOW(3)
WHERE `id` = 'style_cat_cinematic';

UPDATE `CreativeStyle`
SET `name` = 'با جای متن',
    `updatedAt` = NOW(3)
WHERE `id` = 'style_social_media';

UPDATE `CreativeStyle`
SET `name` = 'با دکور',
    `updatedAt` = NOW(3)
WHERE `id` = 'style_soft_editorial';

UPDATE `CreativeStyle`
SET `name` = 'سینمایی',
    `updatedAt` = NOW(3)
WHERE `id` = 'style_dramatic_dark';
