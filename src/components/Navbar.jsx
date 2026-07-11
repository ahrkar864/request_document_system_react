import React, { useState, useRef, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AiOutlineMenu } from "react-icons/ai";
import finalLogo from "../assets/images/finallogo.png";
import { useTranslation } from "react-i18next";

import NotificationIcon from "./Notification";
import { NotificationContext } from "../context/NotificationContext"; // ✅
import LanguageSwitcher from "./LanguageSwitcher";
import { useDispatch, useSelector } from "react-redux";

import { logout as logoutThunk } from "../store/authSlice";

export default function Navbar({ toggleSidebar }) {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  const { t } = useTranslation();
  const { notifications } = useContext(NotificationContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const subscribeToPush = async () => {
    if (import.meta.env.DEV) {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return;
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: import.meta.env.VITE_NOTI_APPLICATION_SERVER_KEY,
    });

    await fetch("/api/notifications/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subscription),
    });
  };

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (!menuOpen) return;

    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [menuOpen]);

  return (
    <nav className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 backdrop-blur-sm border-b border-blue-100/50 text-gray-800 py-3 sm:py-4 px-4 sm:px-6 flex items-center gap-2 sm:gap-3 relative shadow-sm z-50">
      {/* Logo Section */}
      <Link
        to="/dashboard"
        className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0"
      >
        <div className="relative">
          <img
            src={finalLogo}
            alt="homepage"
            className="h-7 w-auto sm:h-9 md:h-11 object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <span className="hidden lg:block text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent sm:pl-2">
          {t("navbar.requestDocumentSystem")}
        </span>
      </Link>

      {/* Right Side Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-shrink-0 ml-auto">
        <LanguageSwitcher />
        <NotificationIcon notifications={notifications} />
        <div className="relative z-50" ref={dropdownRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-sm hover:bg-white hover:shadow-md transition-all duration-200 text-sm cursor-pointer border border-gray-100/50"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 lg:hidden bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <svg
              className="hidden sm:block w-5 h-5 lg:hidden text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="hidden lg:inline font-semibold text-gray-700">
              {user?.name || t("navbar.user")}
            </span>
            <svg
              className="w-4 h-4 text-gray-500 transition-transform duration-200"
              style={{
                transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </button>

          {menuOpen && (
            <>
              {/* Backdrop overlay for mobile */}
              <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] lg:hidden"
                onClick={() => setMenuOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-64 sm:w-80 max-w-sm bg-white/95 backdrop-blur-lg border border-gray-200/50 rounded-lg sm:rounded-xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-6rem)] overflow-y-auto">
                {/* User Info Header */}
                <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 px-3 py-3 sm:px-5 sm:py-5 border-b border-blue-400/20">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-base sm:text-xl shadow-lg ring-2 ring-white/30">
                        {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.name || t("navbar.user")}
                      </p>
                      {user?.emp_id && (
                        <p className="text-[10px] sm:text-xs text-blue-100 truncate mt-0.5">
                          ID: {user.emp_id}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Details Section */}
                <div className="px-3 py-2.5 sm:px-5 sm:py-4 bg-white/50 backdrop-blur-sm border-b border-gray-100">
                  <div className="space-y-2 sm:space-y-3">
                    {/* Role - Always displayed */}
                    <div className="flex items-start space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-white/60 transition-colors">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                          <svg
                            className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Role
                        </p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user?.role_name ||
                            user?.role?.name ||
                            user?.roleName ||
                            user?.role?.user_type ||
                            (user?.role_id ? `${user.role_id}` : "N/A")}
                        </p>
                      </div>
                      {/* <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Branch</p>
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                               {user?.user_branch_name || "HEllo"}
                                            </p>
                                        </div> */}
                    </div>

                    {/* Branch */}
                    {/* {(branchName || user?.from_branch_name || user?.branch_name || user?.from_branch?.branch_name || user?.branch?.branch_name) && ( */}
                    <div className="flex items-start space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-white/60 transition-colors">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                          <svg
                            className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                          Branch
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                          {/* {branchName || user?.from_branch_name || user?.branch_name || user?.from_branch?.branch_name || user?.branch?.branch_name || 'N/A'} */}
                          {user?.user_branch_name ||
                            user?.from_branch_name ||
                            "N/A"}
                        </p>
                      </div>
                    </div>
                    {/* )} */}

                    {/* Department */}
                    {(user?.department?.name ||
                      user?.departments?.name ||
                      user?.department_name ||
                      user?.department_id) && (
                      <div className="flex items-start space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-white/60 transition-colors">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                            <svg
                              className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                            Department
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                            {user?.department_name ||
                              user?.department?.name ||
                              user?.departments?.name ||
                              (user?.department_id
                                ? ` ${user.department_id}`
                                : "N/A")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Menu Items */}
                <ul className="text-sm text-gray-700 bg-white/50 backdrop-blur-sm">
                  <li>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 sm:px-5 sm:py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 text-red-600 font-semibold transition-all duration-200 flex items-center space-x-2 sm:space-x-3 group text-xs sm:text-sm"
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>{t("navbar.signOut")}</span>
                    </button>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className="block lg:hidden p-2 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-md transition-all duration-200 text-gray-700 border border-gray-100/50"
        >
          <AiOutlineMenu size={24} />
        </button>
      </div>
    </nav>
  );
}
