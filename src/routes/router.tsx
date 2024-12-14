import { createBrowserRouter } from "react-router-dom";
import Login from "./Login";
import React from "react";

export const router = createBrowserRouter([
    {
      path: "/",
      Component: Login,
    },
    {
      path: "/chat",
      Component: React.lazy(() => import("./Chat")),
    },
    {
      path: "/settings",
      Component: React.lazy(() => import("./Settings")),
    },
  ]);