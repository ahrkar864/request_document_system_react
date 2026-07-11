import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_NOTI_APPLICATION_SERVER_KEY;

// Get authenticated user from localStorage
function getAuthUser() {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("[Auth] Error getting user:", error);
    return null;
  }
}

// Convert base64 string to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getServiceWorkerRegistration() {
  const currentRegistration = await navigator.serviceWorker.getRegistration();
  if (currentRegistration) {
    return currentRegistration;
  }

  return navigator.serviceWorker.register("/sw.js");
}

export default function PushNotificationManager() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) {
      return;
    }

    // Check if browser supports notifications
    if (!("Notification" in window)) {
      console.log("[Push] Notifications not supported");
      return;
    }

    // Check if service worker is supported
    if (!("serviceWorker" in navigator)) {
      console.log("[Push] Service Worker not supported");
      return;
    }

    // Check current permission status
    if (Notification.permission === "denied") {
      setPermissionDenied(true);
      return;
    }

    // Check if already subscribed
    checkSubscriptionStatus();

    // Show prompt after 5 seconds if not subscribed
    const timer = setTimeout(() => {
      if (Notification.permission === "default" && !isSubscribed) {
        setShowPrompt(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await getServiceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      console.log("[Push] Subscription status:", !!subscription);
    } catch (error) {
      console.error("[Push] Error checking subscription:", error);
    }
  };

  const subscribeToPush = async () => {
    if (import.meta.env.DEV) {
      return;
    }

    try {
      console.log("[Push] Requesting notification permission...");

      const permission = await Notification.requestPermission();
      console.log("[Push] Permission result:", permission);

      if (permission !== "granted") {
        setPermissionDenied(true);
        setShowPrompt(false);
        return;
      }

      // Register service worker if not already registered
      const registration = await getServiceWorkerRegistration();

      console.log("[Push] Service worker ready, subscribing to push...");

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log("[Push] Subscription successful:", subscription);

      // Get user info
      const user = getAuthUser();
      if (!user) {
        console.error("[Push] No authenticated user found");
        return;
      }

      // Send subscription to backend
      const subscriptionJSON = subscription.toJSON();
      const response = await fetch("/api/notifications/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          endpoint: subscriptionJSON.endpoint,
          keys: subscriptionJSON.keys,
        }),
      });

      if (response.ok) {
        console.log("[Push] Subscription saved to server");
        setIsSubscribed(true);
        setShowPrompt(false);

        // Show test notification
        registration.showNotification("Notifications Enabled!", {
          body: "You will now receive push notifications even when the website is closed.",
          icon: "/PRO1logo.png",
          badge: "/PRO1logo.png",
          tag: "welcome-notification",
          requireInteraction: false,
        });
      } else {
        console.error(
          "[Push] Failed to save subscription:",
          await response.text(),
        );
      }
    } catch (error) {
      console.error("[Push] Error subscribing to push:", error);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    // Show again in 1 hour
    setTimeout(() => {
      if (!isSubscribed && Notification.permission === "default") {
        setShowPrompt(true);
      }
    }, 3600000);
  };

  if (permissionDenied) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md z-50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800 mb-1">
              Notifications Blocked
            </h3>
            <p className="text-sm text-red-700 mb-2">
              You have blocked notifications. To enable them, click the lock
              icon in your browser's address bar.
            </p>
            <button
              onClick={() => setPermissionDenied(false)}
              className="text-xs text-red-600 hover:text-red-800 font-medium underline"
            >
              Dismiss
            </button>
          </div>
          <button
            onClick={() => setPermissionDenied(false)}
            className="flex-shrink-0 text-red-400 hover:text-red-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-4 shadow-xl max-w-md z-50 animate-slideUp">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Enable Notifications
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Get instant notifications even when the website is closed. Stay
            updated on new forms and status changes.
          </p>
          <div className="flex gap-2">
            <button
              onClick={subscribeToPush}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enable
            </button>
            <button
              onClick={dismissPrompt}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={dismissPrompt}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
