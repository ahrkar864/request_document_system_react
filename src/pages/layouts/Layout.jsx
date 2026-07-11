import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Siderbar";
import Navbar from "../../components/Navbar";
import PushNotificationManager from "../../components/common/PushNotificationManager";

export const subscribeUser = async (registration) => {
  console.log("Subscribing user to push notifications...");
  if (!registration || !registration.pushManager) {
    console.error("Push manager not available.");
    return;
  }
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: import.meta.env.VITE_NOTI_APPLICATION_SERVER_KEY,
  });

  console.log("User subscribed:", subscription);
  return subscription;
};

export const requestNotificationPermission = async () => {
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    console.log("Notification permission granted.");
  } else {
    console.log("Notification permission denied.");
  }
};

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="h-screen flex flex-col">
      {/* Navbar at top */}
      <Navbar toggleSidebar={toggleSidebar} />

      {/* Sidebar + Page content */}
      <div className="flex flex-1 overflow-hidden">
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          />
        )}
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className="flex-1 overflow-y-auto p-3 bg-gray-100">
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-100 text-gray text-center py-2">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Pro1 Global Home Center. All rights
          reserved.
        </p>
      </footer>

      {/* Push Notification Manager */}
      <PushNotificationManager />
    </div>
  );
}
