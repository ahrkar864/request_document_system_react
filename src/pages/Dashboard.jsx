import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import dashboardPhoto from "../assets/images/reqBa.png";
import companyLogo from "../assets/images/finallogo.png";
import NavPath from "../components/NavPath";
import { countFormNoti, getFormsList } from "../api/commonApi";
import { useSelector } from "react-redux";

// Animated Loading Component with Company Logo
const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center">
      {/* Blur backdrop background - frosted glass effect */}
      <div className="absolute inset-0 backdrop-blur-xl bg-gray-100/50"></div>

      {/* Logo container with animations */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with animation */}
        <div className="relative animate-float">
          <img
            src={companyLogo}
            alt="Pro1 Global Home Center"
            className="w-72 h-auto object-contain animate-logo-pulse"
          />
        </div>

        {/* Tagline */}
        <div className="mt-4 animate-fade-in">
          <p className="text-red-500 text-xl italic font-semibold tracking-wide">
            "One Place, Get All."
          </p>
        </div>

        {/* Loading text with animated dots */}
        <div className="mt-8 flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-700">Loading</span>
            <span className="flex gap-1.5 ml-1">
              <span
                className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce-dot"
                style={{ animationDelay: "0ms" }}
              ></span>
              <span
                className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce-dot"
                style={{ animationDelay: "150ms" }}
              ></span>
              <span
                className="w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce-dot"
                style={{ animationDelay: "300ms" }}
              ></span>
            </span>
          </div>
          <p className="mt-3 text-gray-500 text-sm animate-fade-in-up tracking-wider">
            Preparing your dashboard
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-8 w-72 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-red-500 rounded-full animate-progress-bar"></div>
        </div>
      </div>

      {/* Custom styles for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes logo-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes progress-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-logo-pulse { animation: logo-pulse 2.5s ease-in-out infinite; }
        .animate-bounce-dot { animation: bounce-dot 1.4s infinite ease-in-out both; }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; animation-delay: 0.3s; opacity: 0; }
        .animate-progress-bar { animation: progress-bar 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

const Dashboard = () => {
  const [allForm, setAllForm] = useState([]);
  const [formCounts, setFormCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchAllForms = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        setLoading(false);
        return;
      }

      try {
        const getAllForms = await getFormsList(token);
        const formsData = getAllForms.data.forms || [];
        setAllForm(formsData);

        const counts = {};
        await Promise.all(
          formsData.map(async (form) => {
            try {
              const count = await countFormNoti(token, form.id);
              console.log('Count mtk noti', count)
              counts[form.id] = count;
              // console.log(`[MAIN_DASHBOARD_DEBUG] Form ${form.id} (${form.name}): count = ${count}`);
            } catch (error) {
              console.error(
                `[MAIN_DASHBOARD_DEBUG] Error getting count for form ${form.id}:`,
                error,
              );
              counts[form.id] = 0;
            }
          }),
        );
        // console.log(counts);

        // console.log('[MAIN_DASHBOARD_DEBUG] Final formCounts:', counts);
        setFormCounts(counts);
      } catch (error) {
        console.error("Error fetching forms or counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllForms();
  }, []);

  // console.log("Forms>>" , allForm) ;
  const formIcons = {
    "Asset Transfer Form": "📂",
    "Office Use Form": "💼",
    "Asset Damage / Lost Form": "📋",
    "Purchase Request Form": "🛒",
    "Big Damage Issue Form": "📝",
    "Master Data Product Change Form": "📊",
    "Request Discount Form": "💯",
    "New Vendor Create Form": "🆕",
    "Monthly Rotate Form": "📆",
    "Supplier Agreement Form": "📜",
    "Member Issue Form": "🆔",
    "CCTV Request Form": "📹",
    "M&E Form": "⚙️",
    "Handover Form" : "🤝",
    "Coupon Voucher": "📑",
    "Price Change Form": "💲",
    "Promotion Job Form": "🚀"
    }
  const requests = allForm.map((form) => ({
    title: form?.name || "",
    icon: formIcons[form?.name] || "",
    route: form.route || "",
    count: 0,
  }));
  // console.log("Request Data>>", allForm);
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="p-6">
      <div
        className="h-48 w-full bg-cover bg-center rounded-lg shadow-md mb-6"
        style={{ backgroundImage: `url(${dashboardPhoto})` }}
      ></div>

      <NavPath
        segments={[
          { path: "/dashboard", label: "Home" },
          { path: "/dashboard", label: "Dashboard" },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allForm.map((form, index) => {
          // Only get count if it exists in formCounts (don't default to 0)
          const count =
            formCounts[form.id] !== undefined ? formCounts[form.id] : null;
          const icon = formIcons[form.name] || "";

          const runner = user.from_branch_id == 1 && (user.department_id == 6 || user.department_id == 11 || user.department_id == 10); 
          // && user.role_name == "Approver";
          if (form.id== 22 && !runner) {
              return null;
          }
          return (
            <Link
              key={index}
              to={`/${form.route?.toLowerCase().replace(/\s+/g, "-")}`}
              className={`relative m-2 border rounded-lg shadow-md p-4 flex items-center space-x-3 transition 
                bg-gray-100 border-blue-200 hover:shadow-lg cursor-pointer
              `}
            >
              <span className="text-xl">{icon}</span>
              <span className="font-semibold">{form.name}</span>

              {/* Only show badge if count is a valid number and greater than 0 */}
              {count !== null && count > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  {count}+
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
