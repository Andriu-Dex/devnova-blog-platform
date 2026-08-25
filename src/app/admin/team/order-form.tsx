"use client";

import { useTransition } from "react";
import { updateOrderAction } from "./quick-actions";

export function OrderForm({ memberId, currentOrder }: { memberId: string; currentOrder: number }) {
  const [isPending, startTransition] = useTransition();

  const handleOrderChange = (e: React.FocusEvent<HTMLInputElement>) => {
    const newVal = parseInt(e.target.value, 10);
    if (isNaN(newVal) || newVal === currentOrder) return;
    
    startTransition(() => {
      updateOrderAction(memberId, newVal);
    });
  };

  return (
    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      Orden:
      <input
        type="number"
        defaultValue={currentOrder}
        onBlur={handleOrderChange}
        disabled={isPending}
        style={{
          width: "50px",
          padding: "2px 4px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          fontSize: "0.85rem",
          fontFamily: "inherit",
          textAlign: "center"
        }}
        title="Cambiar orden"
      />
      {isPending && <span style={{ fontSize: "0.7rem", color: "#666" }}>...</span>}
    </span>
  );
}
