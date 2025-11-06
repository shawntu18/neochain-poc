"use client";

import { useEffect, useRef } from "react";

export const useAutoFocus = <T extends HTMLElement>(key: unknown) => {
  const inputRef = useRef<T>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [key]);

  return inputRef;
};

