import { useState, useEffect } from "react";
import {
  Gauge,
  Save,
  RefreshCw,
  Clock,
  Calendar,
  CalendarDays,
  CalendarRange,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react";

const LimitCard = ({ 
  title, 
  description, 
  icon: Icon, 
  value, 
  onChange, 
  unit = "tickets",
  color = "maroon"
}) => {
  const colorClasses = {
    maroon: "from-maroon-100 to-maroon-200 text-maroon-700",
    blue: "from-blue-100 to-blue-200 text-blue-700",
    green: "from-green-100 to-green-200 text-green-700",
    orange: "from-orange-100 to-orange-200 text-orange-700",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-center text-xl font-bold text-gray-900 focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500"
        />
        <span className="text-sm text-gray-500 min-w-[60px]">{unit}</span>
      </div>
    </div>
  );
};

const RateLimitingSection = ({ rateLimits, onSaveRateLimits, loading }) => {
  const [localLimits, setLocalLimits] = useState({
    daily_limit: 5,
    weekly_limit: 15,
    monthly_limit: 30,
    yearly_limit: 100,
    cooldown_minutes: 30,
    max_per_session: 3,
    enabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (rateLimits) {
      setLocalLimits({
        daily_limit: rateLimits.daily_limit ?? 5,
        weekly_limit: rateLimits.weekly_limit ?? 15,
        monthly_limit: rateLimits.monthly_limit ?? 30,
        yearly_limit: rateLimits.yearly_limit ?? 100,
        cooldown_minutes: rateLimits.cooldown_minutes ?? 30,
        max_per_session: rateLimits.max_per_session ?? 3,
        enabled: rateLimits.enabled ?? true,
      });
    }
  }, [rateLimits]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveRateLimits(localLimits);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateLimit = (key, value) => {
    setLocalLimits((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-12 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-10 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rate Limiting</h1>
          <p className="text-gray-500 mt-1">Configure ticket submission limits per IP address</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-green-600 text-sm">
              <CheckCircle size={16} />
              Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-maroon-800 text-white rounded-lg hover:bg-maroon-900 transition-colors font-medium disabled:opacity-50"
          >
            {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            Save Settings
          </button>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${localLimits.enabled ? 'bg-green-100' : 'bg-gray-100'} flex items-center justify-center`}>
              <Gauge className={`w-6 h-6 ${localLimits.enabled ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Rate Limiting</h3>
              <p className="text-sm text-gray-500">
                {localLimits.enabled 
                  ? "Rate limiting is active - IP addresses are being monitored" 
                  : "Rate limiting is disabled - no restrictions applied"}
              </p>
            </div>
          </div>
          <button
            onClick={() => updateLimit("enabled", !localLimits.enabled)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
              localLimits.enabled ? "bg-green-500" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                localLimits.enabled ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800">
            <strong>How it works:</strong> When an IP address exceeds the configured limit for any time period, 
            they will be temporarily blocked from submitting new tickets. The limits stack, meaning all conditions 
            must be met for a submission to be allowed.
          </p>
        </div>
      </div>

      {/* Limit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LimitCard
          title="Daily Limit"
          description="Maximum tickets per IP address per day"
          icon={Clock}
          value={localLimits.daily_limit}
          onChange={(v) => updateLimit("daily_limit", v)}
          color="blue"
        />
        <LimitCard
          title="Weekly Limit"
          description="Maximum tickets per IP address per week"
          icon={Calendar}
          value={localLimits.weekly_limit}
          onChange={(v) => updateLimit("weekly_limit", v)}
          color="green"
        />
        <LimitCard
          title="Monthly Limit"
          description="Maximum tickets per IP address per month"
          icon={CalendarDays}
          value={localLimits.monthly_limit}
          onChange={(v) => updateLimit("monthly_limit", v)}
          color="orange"
        />
        <LimitCard
          title="Yearly Limit"
          description="Maximum tickets per IP address per year"
          icon={CalendarRange}
          value={localLimits.yearly_limit}
          onChange={(v) => updateLimit("yearly_limit", v)}
          color="maroon"
        />
      </div>

      {/* Additional Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Additional Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cooldown Period (minutes)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Time to wait between submissions from the same IP
            </p>
            <input
              type="number"
              min="0"
              value={localLimits.cooldown_minutes}
              onChange={(e) => updateLimit("cooldown_minutes", parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Per Session
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Maximum tickets allowed in a single browser session
            </p>
            <input
              type="number"
              min="1"
              value={localLimits.max_per_session}
              onChange={(e) => updateLimit("max_per_session", parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500"
            />
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Setting limits too low may prevent legitimate users from submitting tickets. 
            Consider your institution's typical usage patterns when configuring these values.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RateLimitingSection;
