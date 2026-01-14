import { createContext, useContext, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, PanelLeft } from "lucide-react";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_COLLAPSED = "4.5rem";

const SidebarContext = createContext(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({ children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const [openMobile, setOpenMobile] = useState(false);

  const toggleSidebar = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const toggleMobile = useCallback(() => {
    setOpenMobile((prev) => !prev);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        toggleSidebar,
        toggleMobile,
        state: open ? "expanded" : "collapsed",
      }}
    >
      <div className="flex min-h-screen w-full">{children}</div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ children, className = "", side = "left", collapsible = "icon" }) {
  const { open, openMobile, setOpenMobile } = useSidebar();

  return (
    <>
      {/* Mobile Overlay */}
      {openMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpenMobile(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        data-state={open ? "expanded" : "collapsed"}
        data-side={side}
        className={`
          fixed lg:sticky top-0 ${side === "left" ? "left-0" : "right-0"} z-50 lg:z-30
          h-screen flex flex-col
          bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          ${openMobile ? "translate-x-0" : side === "left" ? "-translate-x-full lg:translate-x-0" : "translate-x-full lg:translate-x-0"}
          ${open ? "w-64" : "w-[4.5rem]"}
          ${className}
        `}
        style={{
          "--sidebar-width": open ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_COLLAPSED,
        }}
      >
        {children}
      </aside>
    </>
  );
}

export function SidebarHeader({ children, className = "" }) {
  return (
    <div className={`flex-shrink-0 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function SidebarContent({ children, className = "" }) {
  return (
    <div className={`flex-1 overflow-y-auto overflow-x-hidden ${className}`}>
      {children}
    </div>
  );
}

export function SidebarFooter({ children, className = "" }) {
  return (
    <div className={`flex-shrink-0 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function SidebarGroup({ children, className = "" }) {
  return <div className={`px-3 py-2 ${className}`}>{children}</div>;
}

export function SidebarGroupLabel({ children, className = "" }) {
  const { open } = useSidebar();
  return (
    <div
      className={`
        px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider
        transition-opacity duration-200
        ${open ? "opacity-100" : "opacity-0 lg:hidden"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function SidebarGroupContent({ children, className = "" }) {
  return <div className={`space-y-1 ${className}`}>{children}</div>;
}

export function SidebarMenu({ children, className = "" }) {
  return <nav className={`space-y-1 ${className}`}>{children}</nav>;
}

export function SidebarMenuItem({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

export function SidebarMenuButton({
  children,
  isActive = false,
  onClick,
  className = "",
  tooltip = "",
}) {
  const { open } = useSidebar();

  return (
    <button
      onClick={onClick}
      title={!open ? tooltip : ""}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
        text-sm font-medium transition-all duration-200
        ${isActive
          ? "bg-maroon-800 text-white shadow-sm"
          : "text-gray-700 hover:bg-gray-100 hover:text-maroon-800"
        }
        ${!open ? "justify-center" : ""}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export function SidebarMenuButtonIcon({ children, className = "" }) {
  return (
    <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center ${className}`}>
      {children}
    </span>
  );
}

export function SidebarMenuButtonLabel({ children, className = "" }) {
  const { open } = useSidebar();
  return (
    <span
      className={`
        truncate transition-all duration-200
        ${open ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

export function SidebarTrigger({ className = "" }) {
  const { toggleSidebar, open } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className={`
        hidden lg:flex items-center justify-center
        w-8 h-8 rounded-lg border border-gray-200
        text-gray-500 hover:text-maroon-800 hover:bg-gray-50
        transition-colors duration-200
        ${className}
      `}
    >
      {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    </button>
  );
}

export function SidebarMobileTrigger({ className = "" }) {
  const { toggleMobile } = useSidebar();

  return (
    <button
      onClick={toggleMobile}
      className={`
        lg:hidden flex items-center justify-center
        w-10 h-10 rounded-lg border border-gray-200
        text-gray-600 hover:text-maroon-800 hover:bg-gray-50
        transition-colors duration-200
        ${className}
      `}
    >
      <PanelLeft size={20} />
    </button>
  );
}

export function SidebarRail({ className = "" }) {
  const { toggleSidebar, open } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className={`
        hidden lg:block absolute top-1/2 -translate-y-1/2 -right-3
        w-6 h-12 bg-white border border-gray-200 rounded-full
        text-gray-400 hover:text-maroon-800 hover:border-maroon-300
        transition-all duration-200 shadow-sm
        ${className}
      `}
    >
      {open ? <ChevronLeft size={14} className="mx-auto" /> : <ChevronRight size={14} className="mx-auto" />}
    </button>
  );
}

export function SidebarInset({ children, className = "" }) {
  const { open } = useSidebar();

  return (
    <main
      className={`
        flex-1 min-h-screen transition-all duration-300
        ${className}
      `}
    >
      {children}
    </main>
  );
}

export function SidebarSeparator({ className = "" }) {
  return <div className={`h-px bg-gray-200 my-2 mx-3 ${className}`} />;
}
