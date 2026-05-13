"use client";

import { updateAssetProductTypeAction } from "@/features/gallery/actions";
import { normalizeProductType, PRODUCT_TYPES } from "@/lib/product-types";

type AssetProductTypeFormProps = {
  assetId: string;
  productType: string | null;
};

export function AssetProductTypeForm({ assetId, productType }: AssetProductTypeFormProps) {
  return (
    <form action={updateAssetProductTypeAction} className="flex items-center gap-3 rounded-[1rem] border border-border/70 bg-surface-soft px-3 py-2">
      <input type="hidden" name="assetId" value={assetId} />
      <label htmlFor={`asset-product-type-${assetId}`} className="shrink-0 text-xs font-medium text-muted">
        نوع محصول
      </label>
      <select
        id={`asset-product-type-${assetId}`}
        name="productType"
        defaultValue={normalizeProductType(productType)}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="min-h-9 flex-1 rounded-full border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-border-strong"
      >
        {PRODUCT_TYPES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </form>
  );
}
