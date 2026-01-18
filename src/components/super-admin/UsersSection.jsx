import { useState } from "react";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  MoreVertical,
  Key,
  Loader2,
} from "lucide-react";

const roleColors = {
  super_admin: "bg-purple-100 text-purple-800",
  admin: "bg-blue-100 text-blue-800",
  department: "bg-green-100 text-green-800",
  faculty: "bg-teal-100 text-teal-800",
  employee: "bg-orange-100 text-orange-800",
  student: "bg-yellow-100 text-yellow-800",
};

const roleLabels = {
  super_admin: "Super Admin",
  admin: "Admin",
  department: "Department Staff",
  faculty: "Faculty",
  employee: "Employee",
  student: "Student",
};

const roleOptions = [
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "employee", label: "Employee" },
  { value: "department", label: "Department Staff" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const UsersSection = ({
  users,
  departments,
  loading,
  searchQuery,
  setSearchQuery,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onToggleStatus,
  onUpdateUser,
  onChangePassword,
}) => {
  const [selectedRole, setSelectedRole] = useState("all");
  const [updatingUser, setUpdatingUser] = useState(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">
            Manage system users and their roles
          </p>
        </div>
        <button
          onClick={onAddUser}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-maroon-800 text-white rounded-lg hover:bg-maroon-900 transition-colors font-medium"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500"
            />
          </div>
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="department">Department Staff</option>
            <option value="faculty">Faculty</option>
            <option value="employee">Employee</option>
            <option value="student">Student</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-maroon-500 to-maroon-700 flex items-center justify-center text-white font-medium">
                          {user.full_name?.charAt(0) ||
                            user.email?.charAt(0) ||
                            "U"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.full_name || "No name"}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role || "student"}
                        onChange={async (e) => {
                          setUpdatingUser(user.id);
                          await onUpdateUser(user.id, { role: e.target.value });
                          setUpdatingUser(null);
                        }}
                        disabled={updatingUser === user.id}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-maroon-500 ${
                          roleColors[user.role] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {roleOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.department || ""}
                        onChange={async (e) => {
                          setUpdatingUser(user.id);
                          await onUpdateUser(user.id, {
                            department: e.target.value,
                          });
                          setUpdatingUser(null);
                        }}
                        disabled={
                          updatingUser === user.id || user.role === "student"
                        }
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 focus:ring-2 focus:ring-maroon-500 bg-white min-w-[140px] ${
                          user.role === "student"
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer"
                        }`}
                      >
                        <option value="">No Department</option>
                        {departments?.map((dept) => (
                          <option key={dept.id || dept.code} value={dept.code}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.is_active !== false ? "active" : "inactive"}
                        onChange={async (e) => {
                          setUpdatingUser(user.id);
                          await onUpdateUser(user.id, {
                            is_active: e.target.value === "active",
                          });
                          setUpdatingUser(null);
                        }}
                        disabled={updatingUser === user.id}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-maroon-500 ${
                          user.is_active !== false
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onChangePassword(user)}
                          className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Change password"
                        >
                          <Key size={16} />
                        </button>
                        <button
                          onClick={() => onEditUser(user)}
                          className="p-2 text-gray-500 hover:text-maroon-800 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => onDeleteUser(user)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersSection;
