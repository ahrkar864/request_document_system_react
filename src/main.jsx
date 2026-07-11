import React from "react";
import ReactDOM from "react-dom/client";
import './App.css';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import './assets/css/style.css';


// Initialize i18n
import './i18n/config';
import AppProvider from "./context/AppProvider";

if (import.meta.env.DEV && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    })
    .catch(() => {});

  if ("caches" in window) {
    caches
      .keys()
      .then((cacheNames) => {
        cacheNames.forEach((cacheName) => caches.delete(cacheName));
      })
      .catch(() => {});
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
    // <React.StrictMode>       
    <AppProvider>
    <RouterProvider router={router} />
  </AppProvider>
    // </React.StrictMode>
);
