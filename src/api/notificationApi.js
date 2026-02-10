import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  tagTypes: ["Notifications"],
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/api/notifications`,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = getState()?.user?.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getTodayNotifications: builder.query({
      query: () => "/today",
      providesTags: [{ type: "Notifications", id: "TODAY" }],
    }),
    getTodayNotificationCount: builder.query({
      query: () => "/today/count",
      providesTags: [{ type: "Notifications", id: "COUNT" }],
    }),
  }),
});

export const {
  useGetTodayNotificationsQuery,
  useGetTodayNotificationCountQuery,
} = notificationApi;
