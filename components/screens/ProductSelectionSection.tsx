"use client";

import React from "react";

export type ProductCandidate = {
  id: string;
  maker: string;
  name: string;
  size: string;
  spec: string;
  price: number;
  image?: string;
  note?: string;
};

type Props = {
  title: string;
  candidates: ProductCandidate[];
  selectedProduct: string;
  photos: Record<string, string>;
  onSelect: (candidate: ProductCandidate) => void;
  onPhotoChange: (photos: Record<string, string>) => void;
};

export function ProductSelectionSection({ title, candidates, selectedProduct, photos, onSelect, onPhotoChange }: Props) {
  const sorted = [...candidates].sort((a, b) => a.price - b.price);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="grid gap-3">
        {sorted.map((candidate) => (
          <div
            key={candidate.id}
            onClick={() => onSelect(candidate)}
            className={`rounded-lg border p-3 cursor-pointer transition-colors ${
              selectedProduct === candidate.id ? "border-primary bg-primary/5" : "border-input hover:bg-accent/50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{candidate.maker}</p>
                <p className="text-xs text-muted-foreground">{candidate.name}</p>
                <p className="text-xs text-muted-foreground">{candidate.size}</p>
                <p className="text-xs text-muted-foreground">{candidate.spec}</p>
                {candidate.note && <p className="text-xs text-muted-foreground mt-1">{candidate.note}</p>}
              </div>
              <span className="text-sm font-semibold text-foreground whitespace-nowrap">¥{candidate.price.toLocaleString()}</span>
            </div>
            <div className="mt-3 block border border-dashed border-input rounded-lg p-4 text-center" onClick={(event) => event.stopPropagation()}>
              {candidate.image || photos[candidate.id] ? (
                <img src={candidate.image || photos[candidate.id]} alt={`${candidate.maker} ${candidate.name}`} className="mx-auto max-h-32 w-full rounded object-contain" />
              ) : (
                <p className="text-xs text-muted-foreground">商品写真を挿入するエリア</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
