import React, { useEffect, useState } from "react";
import { getCheckItems } from "../../api/ME/meData";
import { Link } from "react-router-dom";
import { subFormCountNoti } from "../../api/commonApi";
import dashboardPhoto from "../../assets/images/reqBa.png";
import NavPath from "../../components/NavPath";

const MAndE: React.FC = () => {
  const [subForms, setSubForms] = useState<{ id: number; name: string }[]>([]);
  const [subFormCounts, setSubFormCounts] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchSubForms = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setLoading(true);

      try {
        const items = await getCheckItems(token);
        setSubForms(items); // ✅ array stays array

        const counts: Record<string, number> = {};

        await Promise.all(
          items.map(async (form: any) => {
            const count = await subFormCountNoti(token, 20, form.id);
            counts[`20_${form.id}`] = count;
          }),
        );

        setSubFormCounts(counts); // ✅ store counts separately
      } catch (error) {
        console.error("Error fetching check items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubForms();
  }, []);

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
        {subForms.map((form) => {
          const isDisabled = ![1, 2, 3, 4, 5].includes(form.id);
          return (
            <Link
              key={form.id}
              to={
                isDisabled
                  ? "#"
                  : `/${form.name.toLowerCase().replace(/\s+/g, "-")}/${form.id}`
              }
              onClick={(e) => {
                if (isDisabled) e.preventDefault();
              }}
              className={`relative m-2 border rounded-lg shadow-md p-4 flex items-center space-x-3 transition
        ${
          isDisabled
            ? "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed pointer-events-none"
            : "bg-white border-blue-300 hover:shadow-lg cursor-pointer"
        }
      `}
            >
              <span className="font-semibold">{form.name}</span>

              {!isDisabled && subFormCounts[`20_${form.id}`] > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  {subFormCounts[`20_${form.id}`]}+
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MAndE;
