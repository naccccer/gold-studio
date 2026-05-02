# Gold Studio Product

## Purpose
Gold Studio turns ordinary jewelry, gold, watch, and luxury accessory photos into polished studio-quality product images.

## Product Model
- `گالری` owns uploaded source product photos.
- `پروژه‌ها` owns generated outputs and generation jobs.
- `+` starts the fastest generation path.
- `حساب` owns subscription/access, logout, and admin entry.

## Product Direction
- Farsi-first and RTL-first.
- Mobile-first.
- Image-led and low-friction.
- Premium, precise, calm, and minimal.
- Guided assistant, not a dashboard or prompt-heavy AI tool.

## Core Users
- Sellers who collect many raw product photos and generate polished outputs over time.
- Premium jewelry and accessory clients who expect a refined visual experience.
- Admin operators who support users, access, projects, and style curation.

## Core Journey
```text
گالری -> انتخاب تصویر یا چند تصویر -> انتخاب کادر خروجی -> انتخاب سبک -> تولید -> بررسی نتیجه -> دانلود
```

## User-Facing Rules
- Gallery is the source-photo library.
- Projects are generated outputs.
- No prompt typing in the normal creation flow.
- Text-to-image testing belongs in admin/internal tooling.
- Styles should be visual, curated, and easy to choose.
- Primary actions use clear Farsi labels plus icons.

## Near-Term Product Work
- Admin-manageable style library.
- DB-backed async generation.
- S3-compatible storage.
- Iran-friendly subscription/access groundwork.
