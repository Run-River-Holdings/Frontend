import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AiOutlineHome } from "react-icons/ai";
import { useGetTodayNotificationsQuery } from "../api/notificationApi";

const formatLKR = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (d) => {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "-";
  return x.toLocaleString();
};

const NotificationPage = () => {
  const { data, isLoading, isFetching } = useGetTodayNotificationsQuery();
  const list = useMemo(() => (Array.isArray(data?.data) ? data.data : []), [data]);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const openDetails = (item) => {
    setSelected(item || null);
    setOpen(true);
  };

  const closeDetails = () => {
    setOpen(false);
    setSelected(null);
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-10">
      {/* ✅ TOP BAR */}
      <div className="relative mb-6">
        {/* Center title */}
        <h1 className="text-center text-blue-800 text-2xl sm:text-3xl md:text-4xl font-extrabold">
          Notification
        </h1>

        {/* Home icon right */}
        <Link
          to="/home"
          aria-label="Home"
          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 transition"
        >
          <AiOutlineHome className="text-2xl sm:text-3xl text-gray-700" />
        </Link>
      </div>

      {/* ✅ LOADING */}
      {isLoading || isFetching ? (
        <div className="text-center text-blue-800 font-semibold">Loading...</div>
      ) : list.length === 0 ? (
        <div className="text-center text-gray-600 font-semibold">
          No notifications for today.
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((n) => (
            <div
              key={String(n?.investmentId || n?._id)}
              className="bg-gray-200 rounded-2xl shadow-md px-4 sm:px-6 py-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Left */}
                <h1 className="text-blue-800 font-extrabold text-base sm:text-lg">
                  {n?.customer?.name || "Customer"}
                </h1>

                {/* Middle */}
                <h2 className="text-blue-700 font-semibold text-sm sm:text-base sm:text-center">
                  {n?.expireLabel || "Expire Today"}
                </h2>

                {/* Right */}
                <div className="sm:flex sm:justify-end">
                  <button
                    type="button"
                    onClick={() => openDetails(n)}
                    className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-xl transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ DETAILS MODAL (does not change your bar design) */}
      {open && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-3">
          <div className="absolute inset-0 bg-black/40" onClick={closeDetails} />
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-blue-800 font-extrabold text-lg sm:text-xl">
                Notification Details
              </h2>
              <button
                onClick={closeDetails}
                className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold"
              >
                Close
              </button>
            </div>

            <div className="mt-4 bg-gray-200 rounded-2xl p-4">
              <div className="space-y-2">
                <div className="text-gray-800 font-semibold">
                  Customer:{" "}
                  <span className="font-bold text-blue-800">
                    {selected?.customer?.name || "-"}
                  </span>
                </div>

                <div className="text-gray-800 font-semibold">
                  Broker:{" "}
                  <span className="font-bold text-blue-800">
                    {selected?.broker?.name || "-"}
                  </span>
                </div>

                <div className="text-gray-800 font-semibold">
                  Arrears Months:{" "}
                  <span className="font-bold text-blue-800">
                    {selected?.arrearsMonthsCount ?? 0}
                  </span>
                </div>

                <div className="text-gray-800 font-semibold">
                  Arrears Amount:{" "}
                  <span className="font-bold text-blue-800">
                    {formatLKR(selected?.arrearsAmount)}
                  </span>
                </div>

                <div className="text-gray-800 font-semibold">
                  Monthly Interest:{" "}
                  <span className="font-bold text-blue-800">
                    {formatLKR(selected?.monthlyInterest)}
                  </span>
                </div>

                <div className="text-gray-800 font-semibold">
                  Investment:{" "}
                  <span className="font-bold text-blue-800">
                    {selected?.investmentName || "-"}
                  </span>
                </div>

                <div className="text-gray-800 font-semibold">
                  Start Date:{" "}
                  <span className="font-bold text-blue-800">
                    {formatDate(selected?.startDate)}
                  </span>
                </div>

                <div className="text-gray-800 font-semibold">
                  Due Date (Today):{" "}
                  <span className="font-bold text-blue-800">
                    {formatDate(selected?.dueDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-600 font-semibold">
              Rule: startDate + 1 month → notification at 12:00 AM (Sri Lanka time) if arrears exists.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default NotificationPage;
