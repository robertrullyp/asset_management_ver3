"use client";

import { useState } from "react";
import {
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  Settings,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Calendar,
  Building2,
  Hash,
  Zap,
  Wrench,
} from "lucide-react";
import useUser from "@/utils/useUser";
import useUnits from "@/utils/useUnits";
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

function UnitsPageContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: currentUser } = useUser();
  const queryClient = useQueryClient();

  const { data: unitsData, isLoading, error } = useUnits(searchTerm);

  const deleteUnitMutation = useMutation({
    mutationFn: async (unitId) => {
      const response = await fetch(`/api/units/${unitId}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete unit");
        }
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete unit");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["units"]);
    },
    onError: (error) => {
      alert(`Error deleting unit: ${error.message}`);
    },
  });

  const handleDeleteUnit = async (unit) => {
    const confirmMessage = `Are you sure you want to delete "${unit.unit_name}"? This action cannot be undone.`;

    if (confirm(confirmMessage)) {
      try {
        await deleteUnitMutation.mutateAsync(unit.id);
        alert(`Unit "${unit.unit_name}" has been deleted successfully.`);
      } catch (error) {
        // Error is already handled in mutation onError
      }
    }
  };

  const units = unitsData?.units || [];

  const canEdit =
    currentUser?.role === "admin" || currentUser?.role === "supervisor";

  const getStatusColor = (unit) => {
    const now = new Date();
    const warrantyEnd = unit.warranty_end ? new Date(unit.warranty_end) : null;

    if (!unit.is_active) {
      return "bg-gray-100 border-gray-300 text-gray-600";
    }

    if (warrantyEnd && warrantyEnd < now) {
      return "bg-red-100 border-red-300 text-red-800";
    }

    return "bg-green-100 border-green-300 text-green-800";
  };

  const getStatusText = (unit) => {
    if (!unit.is_active) {
      return "Inactive";
    }

    const now = new Date();
    const warrantyEnd = unit.warranty_end ? new Date(unit.warranty_end) : null;

    if (warrantyEnd && warrantyEnd < now) {
      return "Warranty Expired";
    }

    return "Active";
  };

  if (error && !error.message.toLowerCase().includes("unauthorized")) {
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
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Generator Units
                </h1>
                <p className="mt-2 text-gray-600">
                  Manage and monitor your generator units
                </p>
              </div>
              {canEdit && (
                <div className="mt-4 sm:mt-0">
                  <a
                    href="/units/new"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Unit
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="unit-search"
                name="search"
                type="text"
                placeholder="Search units by name, model, serial number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? "No units match your search criteria"
                  : "Get started by adding your first generator unit"}
              </p>
              {canEdit && !searchTerm && (
                <a
                  href="/units/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Unit
                </a>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* Unit Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Settings className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {unit.unit_name}
                          </h3>
                          {unit.model && (
                            <p className="text-sm text-gray-600">
                              {unit.model}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(unit)}`}
                      >
                        {getStatusText(unit)}
                      </span>
                    </div>

                    {/* Unit Details */}
                    <div className="space-y-2 mb-4">
                      {unit.serial_number && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Hash className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{unit.serial_number}</span>
                        </div>
                      )}

                      {unit.company_name && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{unit.company_name}</span>
                        </div>
                      )}

                      {unit.frequency_hz && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Zap className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{unit.frequency_hz} Hz</span>
                        </div>
                      )}

                      {unit.operation_mode && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Wrench className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="capitalize">
                            {unit.operation_mode.replace("_", " ")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Registration Info */}
                    <div className="text-xs text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Registered:{" "}
                        {unit.register_date
                          ? new Date(unit.register_date).toLocaleDateString()
                          : "N/A"}
                      </div>
                      {unit.warranty_end && (
                        <p className="mt-1">
                          Warranty ends:{" "}
                          {new Date(unit.warranty_end).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-2">
                      <a
                        href={`/units/${unit.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </a>

                      {canEdit && (
                        <>
                          <a
                            href={`/units/${unit.id}/edit`}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </a>

                          <button
                            onClick={() => handleDeleteUnit(unit)}
                            disabled={deleteUnitMutation.isPending}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {deleteUnitMutation.isPending
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {!isLoading && units.length > 0 && (
            <div className="mt-8 text-center text-sm text-gray-600">
              Showing {units.length} units
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UnitsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <UnitsPageContent />
    </QueryClientProvider>
  );
}