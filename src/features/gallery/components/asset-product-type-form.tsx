"use client";

import { updateAssetProductTypeAction } from "@/features/gallery/actions";
import { getProductTypes, normalizeProductType, productTypeLabel } from "@/lib/product-types";
import type { VerticalId } from "@/lib/verticals";

type AssetProductTypeFormProps = {
  assetId: string;
  productType: string | null;
  vertical?: VerticalId;
};

export function AssetProductTypeForm({ assetId, productType, vertical = "jewelry" }: AssetProductTypeFormProps) {
  const productTypes = getProductTypes(vertical);

  return (
    <form action={updateAssetProductTypeAction} className="flex items-center gap-3 rounded-[1rem] border border-border/70 bg-surface-soft px-3 py-2">
      <input type="hidden" name="assetId" value={assetId} />
      <label htmlFor={`asset-product-type-${assetId}`} className="shrink-0 text-xs font-medium text-muted">
        نوع محصول
      </label>
      <select
        id={`asset-product-type-${assetId}`}
        name="productType"
        defaultValue={normalizeProductType(productType, vertical)}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="min-h-9 flex-1 rounded-full border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-border-strong"
      >
        {productTypes.map((item) => (
          <option key={item} value={item}>
            {productTypeLabel(item, vertical)}
          </option>
        ))}
      </select>
    </form>
  );
}
