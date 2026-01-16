import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { AlertCircle, ShieldX } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        if (session?.user) {
          // Fetch user role and department from users table
          let { data: userData } = await supabase
            .from("users")
            .select("role, department")
            .eq("id", session.user.id)
            .single();

          // If no user record exists, create one with default 'student' role
          if (!userData) {
            const { data: newUser } = await supabase
              .from("users")
              .insert({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "User",
                role: "student", // Default role for first-time login
              })
              .select("role, department")
              .single();
            userData = newUser;
          }

          const userRole = userData?.role || "student";
          const userDepartment = userData?.department;

          // BLOCK students from accessing admin panel
          if (userRole === "student") {
            setAccessDenied(true);
            await supabase.auth.signOut();
            return;
          }

          // BLOCK unverified users (employees without department assignment)
          // These are users who logged in via Gmail but haven't been verified by super admin
          if ((userRole === "employee" || userRole === "faculty" || userRole === "department") && !userDepartment) {
            setAccessDenied(true);
            await supabase.auth.signOut();
            return;
          }

          // Redirect based on role (only verified users reach here)
          if (userRole === "super_admin") {
            navigate("/super-admin", { replace: true });
          } else if (userRole === "admin") {
            navigate("/admin", { replace: true });
          } else if (userRole === "department" || userRole === "faculty" || userRole === "employee") {
            navigate("/department", { replace: true });
          } else {
            // Unknown role - block access
            setAccessDenied(true);
            await supabase.auth.signOut();
          }
        } else {
          navigate("/login", { replace: true });
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("An error occurred during authentication. Please try again.");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  // Access Denied Screen for Students
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldX size={40} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              Your account has not been verified for admin access.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Students cannot access this portal.</strong><br />
                If you are a faculty, employee, or staff member, please contact the administrator to verify your account.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-maroon-800 text-white py-3 px-4 rounded-xl font-semibold hover:bg-maroon-700 transition-all duration-200"
              >
                Back to Login
              </button>
              <p className="text-xs text-gray-500">
                Need help? Contact: admin@liceo.edu.ph
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Authentication Error
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-maroon-800 text-white py-3 px-4 rounded-xl font-semibold hover:bg-maroon-700 transition-all duration-200"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-maroon-800 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
