import React from "react";

function SidebarFooter() {
  return (
    <div className="flex items-center text-xs gap-1 mt-4 border-t border-tertiary pt-2 text-muted-foreground">
      <a
        href="/frontend/privacy-policy"
        target="_blank"
        rel="noopener noreferrer"
      >
        Privacy Policy •
      </a>
      {/* VERSION NUMBER */}
      <p className="text-xs text-muted-foreground">v 0.4.1</p>
    </div>
  );
}

export default SidebarFooter;
