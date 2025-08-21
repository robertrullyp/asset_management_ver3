"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Settings,
  Calendar,
  AlertTriangle,
  Camera,
  Building2,
  History,
  User,
  Clock,
  Play,
  Square,
  MapPin,
  Wrench,
  Eye,
  LogIn,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import useUser from "@/utils/useUser";

export default function PublicUnitPage({ params }) {
  const { serial } = params;
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const { data: user, loading: userLoading } = useUser();

  const token =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("token")
      : null;

  // Log access when page loads
  useEffect(() => {
    const logAccess = async () => {
      try {
        await fetch('/api/units/access-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serial_number_engine: serial,
            access_type: 'qr_scan',
            user_agent: navigator.userAgent
          }),
        });
      } catch (error) {
        console.error('Failed to log access:', error);
      }
    };

    logAccess();
  }, [serial]);

  const {
    data: unitData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-unit", serial, token],
    queryFn: async () => {
      const response = await fetch(
        `/api/units/serial/${serial}?token=${token}`,
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch unit: ${response.status} ${response.statusText}`,
        );
      }
      return response.json();
    },
  });

  const unit = unitData?.unit;

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setLocationError(null);
      },
      (error) => {
        setLocationError(`Location error: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Start work session (for teknisi only)
  const startWorkSession = async () => {
    if (!user || user.role !== 'teknisi') {
      alert("Only teknisi can start work sessions. Please login first.");
      return;
    }

    if (!location) {
      alert("Please allow location access to start work session");
      getCurrentLocation();
      return;
    }

    try {
      const response = await fetch('/api/work-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unit.id,
          session_type: 'work_start',
          gps_latitude: location.latitude,
          gps_longitude: location.longitude,
          notes: `Started via QR scan - Engine Serial: ${serial}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start work session');
      }

      alert("Work session started successfully!");
      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Error starting work session:', error);
      alert("Failed to start work session: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unit Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            No unit found with engine serial number: {serial}
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    const now = new Date();
    const warrantyEnd = unit.warranty_end ? new Date(unit.warranty_end) : null;

    if (warrantyEnd && warrantyEnd < now) {
      return "bg-red-100 border-red-300 text-red-800";
    }

    return "bg-green-100 border-green-300 text-green-800";
  };

  const getStatusText = () => {
    const now = new Date();
    const warrantyEnd = unit.warranty_end ? new Date(unit.warranty_end) : null;

    if (warrantyEnd && warrantyEnd < now) {
      return "Warranty Expired";
    }

    return "Active";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Settings className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              {unit.unit_name}
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            {unit.model} • {unit.company_name}
          </p>
          <div className="flex justify-center mt-4">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor()}`}
            >
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Authentication Status */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">
                {userLoading ? "Checking authentication..." : 
                 user ? `Logged in as: ${user.name} (${user.role})` : "Not logged in"}
              </span>
            </div>
            {!user && (
              <a
                href="/account/signin"
                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <LogIn className="h-4 w-4 mr-1" />
                Login
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Unit Info */}
          <div className="space-y-6">
            {/* Unit Photos */}
            {unit.unit_photos && unit.unit_photos.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Unit Photos
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  {unit.unit_photos.slice(0, 4).map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Unit photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Unit Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Engine Serial Number
                  </label>
                  <p className="text-gray-900 font-semibold">
                    {unit.serial_number_engine}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Unit Name
                  </label>
                  <p className="text-gray-900">{unit.unit_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Model
                  </label>
                  <p className="text-gray-900">{unit.model}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Install Date
                  </label>
                  <p className="text-gray-900">
                    {unit.install_date
                      ? new Date(unit.install_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Register Date
                  </label>
                  <p className="text-gray-900">
                    {unit.register_date
                      ? new Date(unit.register_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Specs (Limited) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Technical Specifications
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Frequency
                  </label>
                  <p className="text-gray-900">
                    {unit.frequency_hz ? `${unit.frequency_hz} Hz` : "N/A"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    RPM
                  </label>
                  <p className="text-gray-900">{unit.rpm || "N/A"}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Operation Mode
                  </label>
                  <p className="text-gray-900 capitalize">
                    {unit.operation_mode?.replace("_", " ") || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Transfer System
                  </label>
                  <p className="text-gray-900 capitalize">
                    {unit.transfer_system || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-6">
            {/* Work Session Actions (for Teknisi) */}
            {user && user.role === 'teknisi' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Wrench className="h-5 w-5 mr-2" />
                  Work Session
                </h3>

                <div className="space-y-4">
                  {location ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center text-green-800 text-sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Location obtained ({location.accuracy}m accuracy)
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center text-yellow-800 text-sm mb-2">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Location required for work sessions
                      </div>
                      <button
                        onClick={getCurrentLocation}
                        className="w-full px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                      >
                        <MapPin className="h-4 w-4 mr-2 inline" />
                        Get Current Location
                      </button>
                    </div>
                  )}

                  {locationError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center text-red-800 text-sm">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        {locationError}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={startWorkSession}
                    disabled={!location}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="h-4 w-4 mr-2 inline" />
                    Start Work Session
                  </button>
                </div>
              </div>
            )}

            {/* Company Info (Limited) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Customer Information
              </h3>

              {/* Customer Photo */}
              {unit.customer_photo && (
                <div className="mb-4 text-center">
                  <img
                    src={unit.customer_photo}
                    alt="Customer"
                    className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-gray-200"
                  />
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Company Name
                  </label>
                  <p className="text-gray-900">{unit.company_name}</p>
                </div>

                {unit.industry && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Industry
                    </label>
                    <p className="text-gray-900 capitalize">{unit.industry}</p>
                  </div>
                )}

                {/* Note: PIC, phone, email are hidden as requested */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">
                    Contact information is available to authorized personnel only.
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Maintenance History (Limited to 5) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <History className="h-5 w-5 mr-2" />
                Recent Maintenance
              </h3>

              <div className="space-y-3">
                {unit.recent_maintenance && unit.recent_maintenance.length > 0 ? (
                  unit.recent_maintenance.slice(0, 5).map((maintenance, index) => (
                    <div key={index} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-b-0">
                      <Clock className="h-4 w-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {maintenance.description || 'Maintenance performed'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {maintenance.work_date ? new Date(maintenance.work_date).toLocaleDateString() : 'Date not recorded'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">No maintenance records available</p>
                  </div>
                )}
              </div>

              {unit.recent_maintenance && unit.recent_maintenance.length > 5 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600 text-center">
                    Showing 5 most recent entries. {unit.recent_maintenance.length - 5} more entries available to authorized personnel.
                  </p>
                </div>
              )}
            </div>

            {/* Access Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Eye className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Public Access Information
                  </p>
                  <p className="text-xs text-blue-800">
                    This page shows limited unit information accessible via QR code. 
                    Teknisi can start work sessions after logging in. 
                    Full details available to authorized personnel only.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}