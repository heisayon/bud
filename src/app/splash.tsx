"use client";

import { useEffect, useState } from "react";

export default function AppSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 900);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="splash-screen">
      <div className="splash-orbit" />
      <img src="/icon.svg" alt="Bud" className="splash-logo" />
    </div>
  );
}
