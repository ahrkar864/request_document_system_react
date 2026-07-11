import React, { useEffect, useState } from "react";
import { searchRecipient } from "../../api/Handover/handover";
import Swal from "sweetalert2";

interface RecipientUser {
  id: number;
  name: string;
  emp_id: string;
}

interface Props {
  onSelect: (users: RecipientUser[]) => void;
  initialRecipients?: RecipientUser[];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function RecipientSearch({
  onSelect,
  initialRecipients = [],
}: Props) {
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<RecipientUser | null>(null);
  const [recipients, setRecipients] =
    useState<RecipientUser[]>(initialRecipients);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setRecipients(initialRecipients);
  }, [initialRecipients]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const data = await searchRecipient(token, query);
      const rawResult = data?.data;
      const result = rawResult
        ? {
            ...rawResult,
            id: Number(rawResult.id ?? rawResult.user_id),
            name: rawResult.name ?? rawResult.user?.name ?? "",
            emp_id: rawResult.emp_id ?? rawResult.user?.emp_id ?? "",
          }
        : null;
      if (data?.status !== 200) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data?.message,
        });
        return;
      }

      if (!result?.id) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Recipient user data is missing.",
        });
        return;
      }

      setSearchResult(result);
      setQuery("");
      setShowDropdown(true);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Something went wrong";

      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
      });
    }
  };

  const handleAdd = (user: RecipientUser) => {
    if (recipients.find((r) => String(r.id) === String(user.id))) return;
    const updated = [...recipients, user];
    setRecipients(updated);
    onSelect(updated);
  };

  const handleRemove = (id: number) => {
    const updated = recipients.filter((r) => r.id !== id);
    setRecipients(updated);
    onSelect(updated);
  };

  return (
    <div className="font-sans">
      <p className="text-xs font-medium text-gray-500 mb-1.5 tracking-wide">
        Search recipient
      </p>
      <div className="relative flex gap-2">
        <input
          type="text"
          value={query}
          placeholder="Enter name or employee ID..."
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          onFocus={() => searchResult && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          className="flex-1 h-10 border border-gray-200 rounded-lg px-3 text-sm bg-white text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
        />
        <button
          onClick={handleSearch}
          className="h-10 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          Search
        </button>

        {/* Dropdown */}
        {showDropdown && searchResult && (
          <div className="absolute top-[calc(100%+6px)] left-0 right-[4.5rem] bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
            {(() => {
              const user = searchResult;
              const already = !!recipients.find((r) => r.id === user.id);
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 px-3.5 py-2.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center justify-center flex-shrink-0">
                    {initials(user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-400">{user.emp_id}</p>
                  </div>
                  {already ? (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3.5 h-3.5 text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Added
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdd(user)}
                      className="h-7 px-3 rounded-full border border-blue-400 text-blue-600 text-xs font-medium flex items-center gap-1 hover:bg-blue-50 transition"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <div className="my-4 border-t border-gray-100" />

      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">
          Selected recipients
        </p>
        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-medium flex items-center justify-center">
          {recipients.length}
        </span>
      </div>

      {recipients.length === 0 ? (
        <p className="text-sm text-gray-400">No recipients added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {recipients.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full pl-2 pr-3 py-1.5"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-medium flex items-center justify-center flex-shrink-0">
                {initials(user.name)}
              </div>
              <div>
                <p className="text-[13px] font-medium text-blue-900 leading-tight">
                  {user.name}
                </p>
                <p className="text-[11px] text-blue-500 leading-tight">
                  {user.emp_id}
                </p>
              </div>
              <button
                onClick={() => handleRemove(user.id)}
                aria-label={`Remove ${user.name}`}
                className="w-4 h-4 rounded-full flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-700 transition ml-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
