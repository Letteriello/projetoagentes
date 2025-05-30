"use client";

import { InterfaceSelector } from "../interface-selector";

export default function InterfaceSelectorPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <div className="max-w-3xl w-full">
        <InterfaceSelector />
      </div>
    </div>
  );
}