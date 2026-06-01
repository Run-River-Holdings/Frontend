import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  useLazyGetCustomerInvestmentsQuery,
  useCreateCustomerPaymentMutation,
} from "../api/customerpayApi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const money = (n) => Number(n || 0).toLocaleString("en-LK");
const safe = (v) => (v === undefined || v === null || v === "" ? "-" : v);

// ✅ Convert Sri Lankan phone number display from 94 to 0
// Examples:
// 94771234567  -> 0771234567
// +94771234567 -> 0771234567
// 0094771234567 -> 0771234567
const localPhone = (phone) => {
  const raw = String(phone || "").trim();

  if (!raw) return "-";

  let cleaned = raw.replace(/\s+/g, "").replace(/-/g, "");

  if (cleaned.startsWith("+94")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("0094")) {
    cleaned = "0" + cleaned.slice(4);
  } else if (cleaned.startsWith("94") && cleaned.length === 11) {
    cleaned = "0" + cleaned.slice(2);
  }

  return cleaned;
};

function SearchableDropdown({
  label,
  value,
  options,
  onChange,
  getOptionValue,
  getOptionLabel,
  getOptionSearchText,
  placeholder,
  disabled = false,
  loading = false,
  loadingText = "Loading...",
  emptyText = "No records found",
  helpText = "",
  zIndex = 50,
}) {
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const selectedOption = useMemo(() => {
    return (
      options.find((item) => String(getOptionValue(item)) === String(value)) ||
      null
    );
  }, [options, value, getOptionValue]);

  useEffect(() => {
    if (selectedOption) {
      setSearchText(getOptionLabel(selectedOption));
    }

    if (!value && !open) {
      setSearchText("");
    }
  }, [selectedOption, value, open, getOptionLabel]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);

        if (selectedOption) {
          setSearchText(getOptionLabel(selectedOption));
        }

        if (!selectedOption) {
          setSearchText("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedOption, getOptionLabel]);

  const filteredOptions = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    if (!q) return options;

    return options.filter((item) => {
      const labelText = getOptionLabel(item).toLowerCase();
      const searchExtraText = getOptionSearchText
        ? getOptionSearchText(item).toLowerCase()
        : "";

      return labelText.includes(q) || searchExtraText.includes(q);
    });
  }, [options, searchText, getOptionLabel, getOptionSearchText]);

  const handleInputChange = (e) => {
    const text = e.target.value;

    setSearchText(text);
    setOpen(true);

    if (value) {
      onChange("");
    }
  };

  const handleSelect = (item) => {
    const newValue = getOptionValue(item);
    const newLabel = getOptionLabel(item);

    onChange(newValue);
    setSearchText(newLabel);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef} style={{ zIndex }}>
      <label className="block text-gray-700 mb-1 text-sm font-semibold">
        {label}
      </label>

      <input
        type="text"
        value={searchText}
        onChange={handleInputChange}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        placeholder={loading ? loadingText : placeholder}
        disabled={disabled || loading}
        className="w-full bg-white text-gray-800 px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />

      {helpText && (
        <div className="text-[11px] text-gray-600 mt-1">{helpText}</div>
      )}

      {open && !disabled && !loading && (
        <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-xl shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((item) => (
              <button
                key={getOptionValue(item)}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
              >
                {getOptionLabel(item)}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">{emptyText}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CustomerPaymantPage() {
  const [customers, setCustomers] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [relatedBrokers, setRelatedBrokers] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [brokerId, setBrokerId] = useState("");
  const [selectedInvestmentId, setSelectedInvestmentId] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [payFor, setPayFor] = useState("interest");
  const [payAmount, setPayAmount] = useState("");
  const [note, setNote] = useState("");

  const [loadingRelatedBrokers, setLoadingRelatedBrokers] = useState(false);
  const [relatedBrokerError, setRelatedBrokerError] = useState("");

  const [loadInvs, { data: invRes, isFetching: loadingInv, error: invErr }] =
    useLazyGetCustomerInvestmentsQuery();

  const [createPay, { isLoading: paying }] = useCreateCustomerPaymentMutation();

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, bRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/customer`, { credentials: "include" }),
          fetch(`${BACKEND_URL}/api/broker`, { credentials: "include" }),
        ]);

        const cJson = await cRes.json();
        const bJson = await bRes.json();

        setCustomers(Array.isArray(cJson?.data) ? cJson.data : []);
        setBrokers(Array.isArray(bJson?.data) ? bJson.data : []);
      } catch {
        setCustomers([]);
        setBrokers([]);
      }
    };

    load();
  }, []);

  const selectedCustomer = useMemo(
    () => customers.find((c) => String(c._id) === String(customerId)) || null,
    [customers, customerId]
  );

  const selectedBroker = useMemo(
    () =>
      relatedBrokers.find((b) => String(b._id) === String(brokerId)) ||
      brokers.find((b) => String(b._id) === String(brokerId)) ||
      null,
    [relatedBrokers, brokers, brokerId]
  );

  useEffect(() => {
    setBrokerId("");
    setSelectedInvestmentId("");
    setPayAmount("");
    setRelatedBrokers([]);
    setRelatedBrokerError("");

    if (!selectedCustomer?.nic) return;
    if (!brokers.length) return;

    const controller = new AbortController();

    const loadRelatedBrokers = async () => {
      try {
        setLoadingRelatedBrokers(true);
        setRelatedBrokerError("");

        const nic = String(selectedCustomer.nic).trim();

        const results = await Promise.allSettled(
          brokers.map(async (broker) => {
            const url = `${BACKEND_URL}/api/customer/payments/customer/${encodeURIComponent(
              nic
            )}/investments?brokerId=${encodeURIComponent(broker._id)}`;

            const res = await fetch(url, {
              credentials: "include",
              signal: controller.signal,
            });

            if (!res.ok) return null;

            const json = await res.json();
            const invs = Array.isArray(json?.data) ? json.data : [];

            return invs.length > 0 ? broker : null;
          })
        );

        if (controller.signal.aborted) return;

        const onlyRelated = results
          .filter((r) => r.status === "fulfilled" && r.value)
          .map((r) => r.value);

        setRelatedBrokers(onlyRelated);
      } catch {
        if (!controller.signal.aborted) {
          setRelatedBrokers([]);
          setRelatedBrokerError("Failed to load related brokers");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingRelatedBrokers(false);
        }
      }
    };

    loadRelatedBrokers();

    return () => controller.abort();
  }, [selectedCustomer?.nic, brokers]);

  useEffect(() => {
    setSelectedInvestmentId("");
    setPayAmount("");

    if (!selectedCustomer?.nic) return;
    if (!brokerId) return;

    loadInvs({
      nic: String(selectedCustomer.nic).trim(),
      brokerId,
    });
  }, [selectedCustomer?.nic, brokerId, loadInvs]);

  const investments =
    selectedCustomer?.nic && brokerId && Array.isArray(invRes?.data)
      ? invRes.data
      : [];

  const selectedInvestment = useMemo(() => {
    if (!selectedInvestmentId) return null;

    return (
      investments.find((x) => String(x._id) === String(selectedInvestmentId)) ||
      null
    );
  }, [investments, selectedInvestmentId]);

  const totals = useMemo(() => {
    if (!selectedInvestment) {
      return {
        investAmount: 0,
        thisMonthInterest: 0,
        arrearsInterest: 0,
        principalPending: 0,
      };
    }

    return {
      investAmount: Number(selectedInvestment.investmentAmount || 0),
      thisMonthInterest: Number(selectedInvestment.thisMonthInterest || 0),
      arrearsInterest: Number(selectedInvestment.arrearsInterest || 0),
      principalPending: Number(selectedInvestment.principalPending || 0),
    };
  }, [selectedInvestment]);

  useEffect(() => {
    if (!selectedInvestment) {
      setPayAmount("");
      return;
    }

    const arrears = Number(selectedInvestment.arrearsInterest || 0);
    const principal = Number(selectedInvestment.principalPending || 0);

    let auto = 0;

    if (payFor === "interest") auto = arrears;
    if (payFor === "principal") auto = principal;
    if (payFor === "interest+principal") auto = arrears + principal;

    setPayAmount(auto > 0 ? String(auto) : "");
  }, [payFor, selectedInvestment]);

  const submitPayment = async (e) => {
    e.preventDefault();

    if (!selectedCustomer?.nic) return alert("Select customer");
    if (!brokerId) return alert("Select broker");
    if (!selectedInvestment?._id) return alert("Select investment");

    const amount = Number(payAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return alert("Enter valid amount");
    }

    try {
      const res = await createPay({
        customerNic: String(selectedCustomer.nic).trim(),
        brokerId,
        investmentId: selectedInvestment._id,
        payAmount: amount,
        paymentType: paymentMethod,
        payFor,
        note,
      }).unwrap();

      if (!res?.success) {
        return alert(res?.message || "Payment failed");
      }

      const excess = Number(res?.data?.summary?.excessAmount || 0);

      alert(
        excess > 0
          ? `Saved. Excess recorded: Rs. ${money(excess)}`
          : "Payment saved."
      );

      setNote("");

      await loadInvs({
        nic: String(selectedCustomer.nic).trim(),
        brokerId,
      }).unwrap();
    } catch (err) {
      alert(err?.data?.message || "Payment failed");
    }
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-10 bg-white">
      <h1 className="text-center text-blue-800 text-2xl sm:text-3xl font-extrabold mb-6">
        Customer Payment
      </h1>

      <div className="w-full flex justify-center">
        <div className="w-full max-w-3xl bg-gray-100 rounded-2xl shadow-sm p-5 sm:p-7 border border-gray-200">
          <div className="mb-4">
            <SearchableDropdown
              label="Customer"
              value={customerId}
              options={customers}
              onChange={(id) => {
                setCustomerId(id);
                setBrokerId("");
                setSelectedInvestmentId("");
                setPayAmount("");
              }}
              getOptionValue={(c) => c._id}
              getOptionLabel={(c) =>
                `${safe(c.name)} - ${safe(c.nic)} - ${localPhone(c.tpNumber)}`
              }
              getOptionSearchText={(c) =>
                `${safe(c.name)} ${safe(c.nic)} ${safe(c.tpNumber)} ${localPhone(
                  c.tpNumber
                )}`
              }
              placeholder="Type customer NIC, name, or phone number..."
              emptyText="No customer found"
              helpText="Phone numbers display as local format. Example: 9477 becomes 077."
              zIndex={80}
            />
          </div>

          <div className="mb-4">
            <SearchableDropdown
              label="Broker Related to Selected Customer"
              value={brokerId}
              options={relatedBrokers}
              onChange={(id) => {
                setBrokerId(id);
                setSelectedInvestmentId("");
                setPayAmount("");
              }}
              getOptionValue={(b) => b._id}
              getOptionLabel={(b) =>
                `${safe(b.name)} - ${safe(b.nic)} - ${localPhone(b.tpNumber)}`
              }
              getOptionSearchText={(b) =>
                `${safe(b.name)} ${safe(b.nic)} ${safe(b.tpNumber)} ${localPhone(
                  b.tpNumber
                )}`
              }
              placeholder={
                customerId
                  ? "Type broker name, NIC, or phone number..."
                  : "Select customer first"
              }
              disabled={!customerId}
              loading={loadingRelatedBrokers}
              loadingText="Loading related brokers..."
              emptyText="No related broker found"
              helpText="This list shows only brokers connected to the selected customer."
              zIndex={70}
            />

            <div className="mt-2 text-xs text-gray-600">
              Selected Broker: <b>{safe(selectedBroker?.name)}</b>
            </div>

            {relatedBrokerError && (
              <div className="mt-2 text-xs text-red-600">
                {relatedBrokerError}
              </div>
            )}

            {!loadingRelatedBrokers &&
              customerId &&
              relatedBrokers.length === 0 &&
              !relatedBrokerError && (
                <div className="mt-2 text-xs text-gray-600">
                  No broker found for this customer.
                </div>
              )}
          </div>

          <div className="mb-4">
            <SearchableDropdown
              label="Investment"
              value={selectedInvestmentId}
              options={investments}
              onChange={(id) => {
                setSelectedInvestmentId(id);
                setPayAmount("");
              }}
              getOptionValue={(inv) => inv._id}
              getOptionLabel={(inv) =>
                `${safe(inv.investmentName)} | Pending Principal: Rs.${money(
                  inv.principalPending
                )} | Arrears Interest: Rs.${money(inv.arrearsInterest)}`
              }
              getOptionSearchText={(inv) =>
                `${safe(inv.investmentName)} ${safe(inv.principalPending)} ${safe(
                  inv.arrearsInterest
                )} ${safe(inv.investmentAmount)}`
              }
              placeholder={
                brokerId
                  ? "Type investment name, principal, or interest..."
                  : "Select broker first"
              }
              disabled={!selectedCustomer?.nic || !brokerId}
              loading={loadingInv}
              loadingText="Loading investments..."
              emptyText="No investment found"
              helpText="Type letter or number to filter investment list."
              zIndex={60}
            />

            {invErr && (
              <div className="mt-2 text-xs text-red-600">
                Failed to load investments
              </div>
            )}

            {!loadingInv &&
              brokerId &&
              selectedCustomer?.nic &&
              investments.length === 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  No investments found.
                </div>
              )}
          </div>

          <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-white p-3">
              <div className="text-xs text-gray-500">Investment Amount</div>
              <div className="text-sm text-gray-900">
                Rs. {money(totals.investAmount)}
              </div>
            </div>

            <div className="rounded-xl bg-white p-3">
              <div className="text-xs text-gray-500">This Month Interest</div>
              <div className="text-sm text-gray-900">
                Rs. {money(totals.thisMonthInterest)}
              </div>
            </div>

            <div className="rounded-xl bg-white p-3">
              <div className="text-xs text-gray-500">Arrears Interest</div>
              <div className="text-sm text-gray-900">
                Rs. {money(totals.arrearsInterest)}
              </div>
            </div>

            <div className="rounded-xl bg-white p-3">
              <div className="text-xs text-gray-500">Pending Principal</div>
              <div className="text-sm text-gray-900">
                Rs. {money(totals.principalPending)}
              </div>
            </div>
          </div>

          <form onSubmit={submitPayment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-semibold">
                  Payment Method
                </label>

                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-white text-gray-800 px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-1 text-sm font-semibold">
                  Payment Type
                </label>

                <select
                  value={payFor}
                  onChange={(e) => setPayFor(e.target.value)}
                  className="w-full bg-white text-gray-800 px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedInvestmentId}
                >
                  <option value="interest">Interest only</option>
                  <option value="interest+principal">
                    Investment amount + Interest
                  </option>
                  <option value="principal">Investment amount only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-1 text-sm font-semibold">
                Amount
              </label>

              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-white text-gray-800 px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />

              <div className="text-[11px] text-gray-600 mt-1">
                Auto-filled based on payment type. You can edit the amount.
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-1 text-sm font-semibold">
                Note
              </label>

              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note..."
                className="w-full bg-white text-gray-800 px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={paying || !selectedInvestmentId || !brokerId}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl transition disabled:opacity-60 font-bold"
            >
              {paying ? "Saving..." : "Submit Payment"}
            </button>

            {!selectedInvestmentId && (
              <div className="text-xs text-gray-600">
                Select one investment to pay.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}