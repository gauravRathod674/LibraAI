"use client";
import React, { useState, createContext, useContext } from "react";
import { cn } from "@/lib/utils"; // If you don't have this utility, just use string templates instead

const TabsContext = createContext();

export function Tabs({ value, onValueChange, children, darkMode, className }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("tabs-container", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, darkMode, className }) {
  return <div className={cn("tabs-list", className)}>{children}</div>;
}

export function TabsTrigger({ value, children,darkMode, className }) {
  const context = useContext(TabsContext);
  const isActive = context.value === value;

  return (
    <button
  type="button"
  role="tab"
  aria-selected={isActive}
  onClick={() => context.onValueChange(value)}
  className={cn(
    "px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200",
    isActive
      ? "bg-gradient-to-br from-[#BB8BFF] to-[#75F6FF] text-black shadow"
      : darkMode
        ? "text-black hover:bg-[#d6e6fb]"
        : "text-white hover:bg-[#2c2c2c]",
    className
  )}
>
  {children}
</button>

  );
}

export function TabsContent({ value, children, className }) {
  const context = useContext(TabsContext);

  if (context.value !== value) return null;

  return (
    <div
      role="tabpanel"
      aria-labelledby={value}
      className={cn("tabs-content w-full", className)}
    >
      {children}
    </div>
  );
}
