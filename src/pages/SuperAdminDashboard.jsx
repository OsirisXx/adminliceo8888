import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  SuperAdminSidebar,
  OverviewSection,
  UsersSection,
  DepartmentsSection,
  IPTrackingSection,
  RateLimitingSection,
  BlockedIPsSection,
  AuditLogsSection,
  SettingsSection,
  UserModal,
  DepartmentModal,
  ConfirmModal,
} from "../components/super-admin";

const departments = [
  { value: "academic", label: "Academic Affairs" },
  { value: "facilities", label: "Facilities Management" },
  { value: "finance", label: "Finance Office" },
  { value: "hr", label: "Human Resources" },
  { value: "security", label: "Security Office" },
  { value: "registrar", label: "Registrar" },
  { value: "student_affairs", label: "Student Affairs" },
];

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // UI State
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data State
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [settings, setSettings] = useState({});
  const [loginSessions, setLoginSessions] = useState([]);
  const [rateLimits, setRateLimits] = useState({});
  const [blockedIPs, setBlockedIPs] = useState([]);

  // Modal State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  // Search State
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [departmentSearchQuery, setDepartmentSearchQuery] = useState("");

  // Fetch departments from database
  const fetchDepartments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      setDepartmentsList(data || []);
      return data || [];
    } catch (err) {
      console.error("Error fetching departments:", err);
      return [];
    }
  }, []);

  // Fetch stats for overview
  const fetchStats = useCallback(async () => {
    try {
      const [usersResult, complaintsResult, deptsResult] = await Promise.all([
        supabase.from("admin_users").select("*", { count: "exact" }),
        supabase.from("complaints").select("*", { count: "exact" }),
        supabase
          .from("departments")
          .select("*", { count: "exact" })
          .eq("is_active", true),
      ]);

      const pendingResult = await supabase
        .from("complaints")
        .select("*", { count: "exact" })
        .in("status", ["submitted", "verified", "in_progress"]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalDepartments: deptsResult.count || 0,
        totalComplaints: complaintsResult.count || 0,
        pendingComplaints: pendingResult.count || 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }, []);

  // Fetch complaints for departments
  const fetchComplaints = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (err) {
      console.error("Error fetching complaints:", err);
    }
  }, []);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("audit_trail")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
      setRecentActivity(data?.slice(0, 5) || []);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    }
  }, []);

  // Fetch IP submissions for IP tracking (real data from complaint_submissions)
  const fetchLoginSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("complaint_submissions")
        .select("*, complaints(reference_number, category, status)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.log(
          "complaint_submissions table may not exist, fetching from complaints"
        );
        // Fallback: get IP data from complaints table
        const { data: complaintsData } = await supabase
          .from("complaints")
          .select("id, reference_number, created_at, ip_address, user_agent")
          .order("created_at", { ascending: false })
          .limit(200);

        setLoginSessions(complaintsData || []);
        return;
      }
      setLoginSessions(data || []);
    } catch (err) {
      console.error("Error fetching IP submissions:", err);
      setLoginSessions([]);
    }
  }, []);

  // Fetch rate limits
  const fetchRateLimits = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("rate_limits")
        .select("*")
        .single();

      if (error) {
        // Use default values
        setRateLimits({
          daily_limit: 5,
          weekly_limit: 15,
          monthly_limit: 30,
          yearly_limit: 100,
          cooldown_minutes: 30,
          max_per_session: 3,
          enabled: true,
        });
        return;
      }
      setRateLimits(data || {});
    } catch (err) {
      console.error("Error fetching rate limits:", err);
    }
  }, []);

  // Fetch blocked IPs
  const fetchBlockedIPs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("blocked_ips")
        .select("*")
        .order("blocked_at", { ascending: false });

      if (error) {
        console.log("Using mock blocked IPs data");
        setBlockedIPs([]);
        return;
      }
      setBlockedIPs(data || []);
    } catch (err) {
      console.error("Error fetching blocked IPs:", err);
      setBlockedIPs([]);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchDepartments(),
        fetchComplaints(),
        fetchAuditLogs(),
        fetchLoginSessions(),
        fetchRateLimits(),
        fetchBlockedIPs(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [
    fetchStats,
    fetchUsers,
    fetchDepartments,
    fetchComplaints,
    fetchAuditLogs,
    fetchLoginSessions,
    fetchRateLimits,
    fetchBlockedIPs,
  ]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // User CRUD operations
  const handleSaveUser = async (formData, userId) => {
    if (userId) {
      // Update existing user
      const { error } = await supabase
        .from("admin_users")
        .update({
          full_name: formData.full_name,
          role: formData.role,
          department: formData.department,
          is_active: formData.is_active,
        })
        .eq("id", userId);

      if (error) throw error;
    } else {
      // Create new user - in real app, this would create auth user too
      const { error } = await supabase.from("admin_users").insert({
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        department: formData.department,
        is_active: formData.is_active,
      });

      if (error) throw error;
    }

    await fetchUsers();
    await fetchStats();
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    const { error } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", selectedUser.id);

    if (error) throw error;

    setConfirmModalOpen(false);
    setSelectedUser(null);
    await fetchUsers();
    await fetchStats();
  };

  const handleToggleUserStatus = async (user) => {
    const { error } = await supabase
      .from("admin_users")
      .update({ is_active: user.is_active === false })
      .eq("id", user.id);

    if (error) {
      console.error("Error toggling user status:", error);
      return;
    }
    await fetchUsers();
  };

  // Department CRUD operations
  const handleSaveDepartment = async (formData, deptId) => {
    try {
      if (deptId) {
        // Update existing department
        const { error } = await supabase
          .from("departments")
          .update({
            name: formData.name,
            code: formData.code,
            description: formData.description,
            updated_at: new Date().toISOString(),
          })
          .eq("id", deptId);

        if (error) throw error;
      } else {
        // Create new department
        const { error } = await supabase.from("departments").insert({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          is_active: true,
        });

        if (error) throw error;
      }

      await fetchDepartments();
      await fetchStats();
    } catch (err) {
      console.error("Error saving department:", err);
      throw err;
    }
  };

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;

    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from("departments")
        .update({ is_active: false })
        .eq("id", selectedDepartment.id);

      if (error) throw error;

      await fetchDepartments();
      await fetchStats();
    } catch (err) {
      console.error("Error deleting department:", err);
    }

    setConfirmModalOpen(false);
    setSelectedDepartment(null);
  };

  // Settings save
  const handleSaveSettings = async (newSettings) => {
    setSettings(newSettings);
    // In real app, save to database
    console.log("Settings saved:", newSettings);
  };

  // Rate limits save
  const handleSaveRateLimits = async (newLimits) => {
    try {
      const { error } = await supabase
        .from("rate_limits")
        .upsert({ id: 1, ...newLimits });

      if (error) {
        console.log("Rate limits table may not exist, saving locally");
      }
      setRateLimits(newLimits);
    } catch (err) {
      console.error("Error saving rate limits:", err);
      setRateLimits(newLimits);
    }
  };

  // Block IP
  const handleBlockIP = async (ipAddress) => {
    const newBlockedIP = {
      id: Date.now(),
      ip_address: ipAddress,
      reason: "Blocked from IP tracking",
      duration: "permanent",
      blocked_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from("blocked_ips").insert(newBlockedIP);
      if (error) {
        console.log("Blocked IPs table may not exist, saving locally");
      }
    } catch (err) {
      console.error("Error blocking IP:", err);
    }

    setBlockedIPs((prev) => [newBlockedIP, ...prev]);
  };

  // Add blocked IP
  const handleAddBlockedIP = async (ipData) => {
    const newBlockedIP = {
      id: Date.now(),
      ...ipData,
    };

    try {
      const { error } = await supabase.from("blocked_ips").insert(newBlockedIP);
      if (error) {
        console.log("Blocked IPs table may not exist, saving locally");
      }
    } catch (err) {
      console.error("Error adding blocked IP:", err);
    }

    setBlockedIPs((prev) => [newBlockedIP, ...prev]);
  };

  // Unblock IP
  const handleUnblockIP = async (ip) => {
    try {
      const { error } = await supabase
        .from("blocked_ips")
        .delete()
        .eq("id", ip.id);

      if (error) {
        console.log("Error removing from database, removing locally");
      }
    } catch (err) {
      console.error("Error unblocking IP:", err);
    }

    setBlockedIPs((prev) => prev.filter((b) => b.id !== ip.id));
  };

  // Render active section
  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <OverviewSection
            stats={stats}
            recentActivity={recentActivity}
            loading={loading}
          />
        );
      case "users":
        return (
          <UsersSection
            users={users}
            loading={loading}
            searchQuery={userSearchQuery}
            setSearchQuery={setUserSearchQuery}
            onAddUser={() => {
              setSelectedUser(null);
              setUserModalOpen(true);
            }}
            onEditUser={(user) => {
              setSelectedUser(user);
              setUserModalOpen(true);
            }}
            onDeleteUser={(user) => {
              setSelectedUser(user);
              setConfirmAction("deleteUser");
              setConfirmModalOpen(true);
            }}
            onToggleStatus={handleToggleUserStatus}
          />
        );
      case "departments":
        return (
          <DepartmentsSection
            departments={departmentsList}
            complaints={complaints}
            loading={loading}
            searchQuery={departmentSearchQuery}
            setSearchQuery={setDepartmentSearchQuery}
            onAddDepartment={() => {
              setSelectedDepartment(null);
              setDepartmentModalOpen(true);
            }}
            onEditDepartment={(dept) => {
              setSelectedDepartment(dept);
              setDepartmentModalOpen(true);
            }}
            onDeleteDepartment={(dept) => {
              setSelectedDepartment(dept);
              setConfirmAction("deleteDepartment");
              setConfirmModalOpen(true);
            }}
          />
        );
      case "ip-tracking":
        return (
          <IPTrackingSection
            submissions={loginSessions}
            loading={loading}
            onRefresh={fetchLoginSessions}
            onBlockIP={handleBlockIP}
          />
        );
      case "rate-limiting":
        return (
          <RateLimitingSection
            rateLimits={rateLimits}
            onSaveRateLimits={handleSaveRateLimits}
            loading={loading}
          />
        );
      case "blocked-ips":
        return (
          <BlockedIPsSection
            blockedIPs={blockedIPs}
            loading={loading}
            onBlockIP={handleBlockIP}
            onUnblockIP={handleUnblockIP}
            onAddBlockedIP={handleAddBlockedIP}
          />
        );
      case "audit":
        return (
          <AuditLogsSection
            auditLogs={auditLogs}
            loading={loading}
            onRefresh={fetchAuditLogs}
          />
        );
      case "settings":
        return (
          <SettingsSection
            settings={settings}
            onSaveSettings={handleSaveSettings}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <SuperAdminSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main
        className={`flex-1 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-0" : "lg:ml-0"
        }`}
      >
        <div className="p-6 lg:p-8">{renderSection()}</div>
      </main>

      {/* Modals */}
      <UserModal
        isOpen={userModalOpen}
        onClose={() => {
          setUserModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSave={handleSaveUser}
        departments={departments}
      />

      <DepartmentModal
        isOpen={departmentModalOpen}
        onClose={() => {
          setDepartmentModalOpen(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
        onSave={handleSaveDepartment}
      />

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setSelectedUser(null);
          setSelectedDepartment(null);
        }}
        onConfirm={
          confirmAction === "deleteUser"
            ? handleDeleteUser
            : handleDeleteDepartment
        }
        title={
          confirmAction === "deleteUser" ? "Delete User" : "Delete Department"
        }
        message={
          confirmAction === "deleteUser"
            ? `Are you sure you want to delete "${
                selectedUser?.full_name || selectedUser?.email
              }"? This action cannot be undone.`
            : `Are you sure you want to delete "${selectedDepartment?.name}"? This action cannot be undone.`
        }
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default SuperAdminDashboard;
