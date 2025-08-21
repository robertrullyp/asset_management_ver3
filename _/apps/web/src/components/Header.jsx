"use client";

import {
  Home,
  Settings,
  Building2,
  Users,
  CheckSquare,
  Calendar,
  Plus,
  ChevronDown,
} from "lucide-react";
import UserProfile from "./UserProfile";
import { useEffect, useState } from "react";
import useUser from "@/utils/useUser";

export default function Header() {
  const [pathname, setPathname] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const { data: currentUser } = useUser();

  useEffect(() => {
    setMounted(true);
    setPathname(window.location.pathname);
  }, []);

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  // Don't show header on auth pages
  if (pathname?.startsWith("/account/")) {
    return null;
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
    },
    {
      name: "Units",
      href: "/units",
      icon: Settings,
    },
    {
      name: "Companies",
      href: "/companies",
      icon: Building2,
    },
    {
      name: "Users",
      href: "/users",
      icon: Users,
    },
    {
      name: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
    },
    {
      name: "Assignments",
      href: "/assignments",
      icon: Calendar,
    },
  ];

  if (currentUser?.role === "sales") {
    navItems.push({
      name: "Sales Dashboard",
      href: "/sales/dashboard",
      icon: Calendar,
    });
  }

  const canCreate =
    currentUser?.role === "admin" || currentUser?.role === "supervisor";

  const createMenuItems = [
    {
      name: "New Unit",
      href: "/units/new",
      icon: Settings,
      description: "Add a new generator unit",
    },
    {
      name: "New Company",
      href: "/companies/new",
      icon: Building2,
      description: "Add a new company",
    },
    {
      name: "New User",
      href: "/users/new",
      icon: Users,
      description: "Add a new user",
    },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <a href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                GenSet Manager
              </h1>
            </a>
          </div>

          {/* Navigation - Hidden on small screens */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));

              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Create Menu + Mobile menu button + User Profile */}
          <div className="flex items-center space-x-4">
            {/* Create Dropdown - Only for admins/supervisors */}
            {canCreate && (
              <div className="relative">
                <button
                  onClick={() => setShowCreateMenu(!showCreateMenu)}
                  className="hidden md:flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                {showCreateMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-2">
                      {createMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <a
                            key={item.name}
                            href={item.href}
                            className="flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowCreateMenu(false)}
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.description}
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Navigation Menu */}
            <div className="md:hidden relative">
              <select
                className="appearance-none bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={pathname}
                onChange={(e) => (window.location.href = e.target.value)}
              >
                {navItems.map((item) => (
                  <option key={item.name} value={item.href}>
                    {item.name}
                  </option>
                ))}
                {canCreate && (
                  <optgroup label="Create">
                    {createMenuItems.map((item) => (
                      <option key={item.name} value={item.href}>
                        + {item.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* User Profile */}
            <UserProfile />
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showCreateMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowCreateMenu(false)}
        />
      )}
    </header>
  );
}
