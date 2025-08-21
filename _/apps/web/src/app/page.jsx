"use client";

import { useState } from "react";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  Search,
  Plus,
  Settings,
  Calendar,
  AlertTriangle,
  Users,
  CheckSquare,
  Building2,
  User,
  Key,
  Info,
} from "lucide-react";
import useUser from "@/utils/useUser";
import Header from "@/components/Header";

// Create a stable query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: currentUser, loading: userLoading } = useUser();

  const {
    data: unitsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["units", searchTerm],
    queryFn: async () => {
      const url = new URL("/api/units", window.location.origin);
      if (searchTerm) url.searchParams.set("search", searchTerm);

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        throw new Error(
          errorText ||
            `Unexpected response format: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error ||
            `Failed to fetch units: ${response.status} ${response.statusText}`
        );
      }
      return data;
    },
  });

  const units = unitsData?.units || [];

  // Test accounts info
  const testAccounts = [
    {
      email: "admin@test.com",
      role: "Admin",
      description: "Full access to all features",
    },
    {
      email: "supervisor@test.com",
      role: "Supervisor",
      description: "Can manage units and assign tasks",
    },
    {
      email: "teknisi@test.com",
      role: "Teknisi",
      description: "Can view units and complete tasks",
    },
    {
      email: "sales@test.com",
      role: "Sales",
      description: "Can view units and companies",
    },
  ];

  const getStatusColor = (unit) => {
    const now = new Date();
    const warrantyEnd = unit.warranty_end ? new Date(unit.warranty_end) : null;

    if (warrantyEnd && warrantyEnd < now) {
      return "bg-red-100 border-red-300 text-red-800";
    }

    return "bg-green-100 border-green-300 text-green-800";
  };

  const getStatusText = (unit) => {
    const now = new Date();
    const warrantyEnd = unit.warranty_end ? new Date(unit.warranty_end) : null;

    if (warrantyEnd && warrantyEnd < now) {
      return "Warranty Expired";
    }

    return "Active";
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Units
          </h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Login Instructions for Non-Authenticated Users */}
          {!userLoading && !currentUser && (
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Info className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-lg font-semibold text-blue-900">
                  Welcome to Generator Set Management System
                </h2>
              </div>
              <p className="text-blue-800 mb-4">
                Please sign in to access the system. You can use one of these
                test accounts:
              </p>

              {/* Login Credentials Box */}
              <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">
                  📧 Email & Password Login:
                </h3>
                <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                  <p>
                    <strong>Email:</strong> Any of the emails below
                  </p>
                  <p>
                    <strong>Password:</strong>{" "}
                    <span className="bg-yellow-200 px-2 py-1 rounded">
                      password123
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {testAccounts.map((account) => (
                  <div
                    key={account.email}
                    className="bg-white rounded-lg p-4 border border-blue-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="font-medium text-gray-900">
                          {account.role}
                        </span>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {account.role.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center mb-1">
                      <Key className="h-3 w-3 text-gray-400 mr-2" />
                      <code className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {account.email}
                      </code>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {account.description}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <a
                  href="/account/signin"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In to Get Started
                </a>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Generator Set Management
            </h1>
            <p className="text-gray-600">
              Manage and monitor your generator units
            </p>
            {currentUser && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <User className="h-4 w-4 mr-1" />
                Logged in as:{" "}
                <span className="font-medium ml-1">{currentUser.name}</span>
                <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  {currentUser.role?.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Search and Actions */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search units by name, model, serial number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {currentUser && (
              <div className="flex gap-2">
                <a
                  href="/units"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Units
                </a>
                <a
                  href="/companies"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Companies
                </a>
                <a
                  href="/assignments"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Assignments
                </a>
                <a
                  href="/tasks"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Manage Tasks
                </a>
                <a
                  href="/users"
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </a>
                {(currentUser?.role === "admin" ||
                  currentUser?.role === "supervisor") && (
                  <a
                    href="/units/new"
                    className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Unit
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Units Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : units.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Units Found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? "No units match your search criteria."
                  : "Get started by adding your first generator unit."}
              </p>
              {currentUser &&
                (currentUser.role === "admin" ||
                  currentUser.role === "supervisor") &&
                !searchTerm && (
                  <a
                    href="/units/new"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Unit
                  </a>
                )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {units.map((unit) => (
                <a
                  key={unit.id}
                  href={`/units/${unit.id}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer block"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {unit.unit_name}
                      </h3>
                      <p className="text-sm text-gray-600">{unit.model}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        unit
                      )}`}
                    >
                      {getStatusText(unit)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Serial Number:</span>
                      <span className="font-medium">
                        {unit.serial_number || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Company:</span>
                      <span className="font-medium">
                        {unit.company_name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frequency:</span>
                      <span className="font-medium">
                        {unit.frequency_hz ? `${unit.frequency_hz} Hz` : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operation Mode:</span>
                      <span className="font-medium capitalize">
                        {unit.operation_mode?.replace("_", " ") || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      Registered:{" "}
                      {unit.register_date
                        ? new Date(unit.register_date).toLocaleDateString()
                        : "N/A"}
                    </div>
                    <div className="text-blue-600 text-sm font-medium">
                      View Details →
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>
  );
}