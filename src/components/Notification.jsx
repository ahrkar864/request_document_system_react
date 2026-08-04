import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { badgeNoti } from "../api/badgeNoti";
import finalLogo from "../assets/images/finallogo.png";
import { FaBell, FaCheckDouble } from "react-icons/fa";
import { NotificationContext } from "../context/NotificationContext";

const Notification = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { notifications } = useContext(NotificationContext);
  // const [upperNoti, setUpperNoti] = useState([]);
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };
  const formDataUpperNoti = notifications?.formData ?? [];
  const unreadNotiUpperNoti = notifications?.getUnreadNoti ?? [];
  const countNotiUpperNoti = unreadNotiUpperNoti.length;
  const subFormData = notifications?.subFormData ?? [];

  const handleNotiClick = (path) => {
    setIsDropdownOpen(false); // close dropdown
    navigate(path); // navigate
  };

  // console.log("FormUpperNoti>>" , formDataUpperNoti);
  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <div className="relative cursor-pointer group" onClick={toggleDropdown}>
        <div className="p-2 rounded-full transition-all duration-200 group-hover:bg-blue-50">
          <FaBell className="text-2xl text-gray-700 group-hover:text-blue-600 transition-colors" />
        </div>
        {countNotiUpperNoti > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center 
                                        min-w-[20px] h-5 px-1.5 bg-gradient-to-br from-red-500 to-red-600 
                                        rounded-full border-2 border-white shadow-lg animate-pulse text-white text-xs font-bold"
          >
            {countNotiUpperNoti > 99 ? "99+" : countNotiUpperNoti}
          </span>
        )}
      </div>
      {isDropdownOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/20 z-[9998]"
            onClick={toggleDropdown}
          />

          {/* Dropdown */}
          <div className="fixed top-16 right-4 w-[360px] bg-white rounded-xl shadow-xl border z-[9999]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-blue-50 rounded-t-xl">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              <FaCheckDouble className="text-blue-600" />
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto">
              {countNotiUpperNoti > 0 ? (
                unreadNotiUpperNoti.map((noti, index) => {
                  const matchedForm = formDataUpperNoti.find(
                    (form) => form.id === noti.data.form_id,
                  );

                 
                  if (!matchedForm) return null;
                  // const routeName = {

                  let path = "";

                  if (matchedForm.route === "m_and_e") {
                    // const matchedSubForm = subFormData.find(
                    //   (sub) => sub.id === noti.data.sub_form_id,
                    // );
                    const matchedSubForm = subFormData.find(
                      (sub) => Number(sub.id) === Number(noti.data.sub_form_id),
                    );

                    if (!matchedSubForm) return null;
                    const slug = matchedSubForm.name
                      .toLowerCase()
                      .replace(/\s+/g, "_");
                    // /m_and_e/panel_board/123
                    path = `/me_${slug}_detail/${noti.data.specific_form_id}`;
                  } else {
                    // /leave_detail/123
                    path = `/${matchedForm.route}_detail/${noti.data.specific_form_id}`;
                  }

                  return (
                    <div
                      key={index}
                      onClick={() => handleNotiClick(path)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b"
                    >
                      {/* Icon */}
                      <img
                        src={finalLogo}
                        alt="logo"
                        className="w-9 h-9 rounded-full object-contain"
                      />

                      {/* Content */}
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-800">
                          {matchedForm.name}
                        </p>

                        <p className="text-xs text-gray-600 mt-0.5">
                          {noti.data.form_doc_no}
                        </p>

                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {new Date(noti.created_at).toLocaleDateString()}
                          </span>

                          {/* Status badge */}
                          <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-600 font-medium">
                            {noti.general_status ?? "Checked"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-gray-500 text-sm">
                  No notifications
                </div>
              )}
            </div>

            {/* Footer */}
            <button
              onClick={toggleDropdown}
              className="w-full py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-b-xl"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Notification;
