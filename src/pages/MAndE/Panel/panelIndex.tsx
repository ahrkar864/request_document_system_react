import React, { useEffect, useState, useMemo } from "react";
import NavPath from "../../../components/NavPath";
import { Link, useNavigate } from "react-router-dom";
import { MultiSelect, Pagination, Select, Table, Loader } from "@mantine/core";
import type { indexData, metaData } from "../../../utils/requestDiscountUtil";

import { FiCopy } from "react-icons/fi";
import { AiFillMessage } from "react-icons/ai";
import {
  dateFormat,
  dateTimeFormat,
  handleCopy,
} from "../../../utils/requestDiscountUtil/helper";
import Swal from "sweetalert2";
import TsStatusBadge from "../../../components/ui/TsStatusBadge";
import { getPanelData, searchPanelData } from "../../../api/ME/panel/panel";

const panelIndex: React.FC = () => {
  const formId = 5;

  const [panelData, setPanelData] = useState<{
    meta?: metaData;
    data: indexData[];
  }>({ data: [] });
  const [copied, setCopied] = useState<any>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<number>(1);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState({
    form_doc_no: "",
    from_date: null as string | null,
    to_date: null as string | null,
    status: [] as string[],
    branch_id: null as string | null,
  });
  const formatDisplay = (val: string | null) => {
    if (!val) return "DD-MM-YYYY";
    const [y, m, d] = val.split("-");
    return `${d}-${m}-${y}`;
  };
  console.log("PanelData", panelData);
  useEffect(() => {
    const cached = sessionStorage.getItem("panel_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      parsed.activePage = activePage;
      sessionStorage.setItem("panel_cache", JSON.stringify(parsed));
    }
  }, [activePage]);
  useEffect(() => {
    const cached = sessionStorage.getItem("panel_cache");
    const token = localStorage.getItem("token");
    if (!token) return;
    if (cached) {
      const parsed = JSON.parse(cached);
      getPanelData(token)
        .then((data) => {
          setPanelData({
            meta: {
              authenticatedUser: data?.authenticatedUser,
              branch: data?.branch,
              user_branches: data?.user_branches,
              noti_data: data?.noti_data,
              authBranch: data?.authBranch,
              createdUser: data?.createdUser,
            },
            data: parsed.data,
          });
          setSearchTerm(parsed.searchTerm);
          setActivePage(parsed.activePage);
          setLoading(false);
        })
        .catch(console.error);
    } else {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const data = await getPanelData(token);
      setPanelData({
        meta: {
          authenticatedUser: data?.authenticatedUser,
          branch: data?.branch,
          user_branches: data?.user_branches,
          noti_data: data?.noti_data,
          authBranch: data?.authBranch,
          createdUser: data?.createdUser,
        },
        data: data?.data,
      });
      setActivePage(1);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  console.log("SearchTerm>>", panelData);
  console.log("createdUser>>", panelData?.meta?.createdUser);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchTerm((prev) => ({ ...prev, [name]: value }));
  };
  const handleDateChange = (
    name: "from_date" | "to_date",
    value: string | null,
  ) => {
    setSearchTerm((prev) => ({ ...prev, [name]: value }));
  };
  const handleStatusChange = (value: string[]) => {
    if (value.includes("All")) {
      setSearchTerm((prev) => ({ ...prev, status: ["All"] }));
    } else {
      setSearchTerm((prev) => ({ ...prev, status: value }));
    }
  };
  const handleBranchChange = (value: any) => {
    setSearchTerm((prev: any) => ({ ...prev, branch_id: value }));
  };
  const navigate = useNavigate();
  const handleSearch = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // if(searchTerm == null)
    const isEmptySearch = (searchTerm: any) => {
      return (
        !searchTerm.form_doc_no &&
        !searchTerm.branch_id &&
        !searchTerm.from_date &&
        !searchTerm.to_date &&
        (!searchTerm.status || searchTerm.status.length === 0)
      );
    };
    if (isEmptySearch(searchTerm)) {
      Swal.fire({
        icon: "warning",
        title: "Search required",
        text: "Please fill at least one field to search",
        confirmButtonText: "OK",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    setLoading(true);
    // console.log("SeaarchTerm>>", searchTerm) ;
    try {
      const results = await searchPanelData(token, searchTerm);

      // Store cache only when user searches
      sessionStorage.setItem(
        "panel_cache",
        JSON.stringify({
          data: results.data,
          searchTerm,
          activePage: 1,
        }),
      );

      setPanelData((prev) => ({ ...prev, data: results.data }));

      setActivePage(1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const handleRestart = async () => {
    sessionStorage.removeItem("panel_cache");

    setSearchTerm({
      form_doc_no: "",

      from_date: null,
      to_date: null,
      status: [],
      branch_id: null,
    });

    setActivePage(1);

    setLoading(true);
    await fetchData();

    navigate(`/panel/${formId}`, { replace: true });
  };
  const pageSize: number = 15;
  const start = (activePage - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return Array.isArray(panelData?.data)
      ? panelData.data.slice(start, start + pageSize)
      : [];
  }, [panelData, activePage]);
  const rows = useMemo(() => {
    return paginatedData?.map((element: indexData, index: number) => {
      const isCopied = copied === element.id;

      const hasUnreadNotification = panelData?.meta?.noti_data?.some(
        (item: indexData) =>
          element.id === item?.specific_form_id &&
          element.form_id === item?.form_id &&
          element.form_doc_no === item?.form_doc_no,
      );

      return (
        <Table.Tr
          key={element.id ?? index}
          style={{
            backgroundColor:
              element.id && selectedRows.includes(element.id)
                ? "var(--mantine-color-blue-light)"
                : undefined,
          }}
        >
          <Table.Td>{start + index + 1}</Table.Td>
          <Table.Td>
            <TsStatusBadge status={element.status ?? ""} />
          </Table.Td>
          <Table.Td className="flex flex-justify gap-3 items-center">
            <Link
              to={`/me_panel_detail/${element.id ?? ""}`}
              className="contents"
            >
              {element.form_doc_no ?? "-"}
            </Link>

            <button
              onClick={() => {
                if (!element.form_doc_no) return;
                handleCopy(
                  element.form_doc_no,
                  () => {
                    if (element.id) setCopied(element.id);
                    setTimeout(() => setCopied(null), 2000);
                  },
                  (err) => console.log("Copy Failed:", err),
                );
              }}
              className={`ml-2 px-2 py-1 text-xs rounded transition-all ${
                isCopied
                  ? "text-green-600 bg-green-50"
                  : "text-blue-500 mt-1 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              }`}
              title={isCopied ? "Copied!" : "Copy ID"}
              disabled={isCopied}
            >
              {isCopied ? "Copied!" : <FiCopy className="w-4 h-4" />}
            </button>
            {hasUnreadNotification && (
              <AiFillMessage className="text-red-400 w-4 h-4" />
            )}
          </Table.Td>

          <Link
            to={`/me_panel_detail/${element.id ?? ""}`}
            className="contents"
          >
            <Table.Td>{element.from_branches?.branch_name ?? "-"}</Table.Td>
            <Table.Td>{element.originators?.name ?? "-"}</Table.Td>
            <Table.Td>{dateFormat(element.created_at)}</Table.Td>
            <Table.Td>{dateTimeFormat(element.updated_at)}</Table.Td>
            <Table.Td className="text-blue-600 font-medium underline">
              View
            </Table.Td>
          </Link>
        </Table.Tr>
      );
    });
  }, [paginatedData, selectedRows, copied]);
  const showLoading = loading || !panelData;
  if (showLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader size="xl" color="blue" />
          <div className="text-lg font-semibold text-gray-700 animate-pulse">
            Loading Detail Data...
          </div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="p-6 bg-white">
        <NavPath
          segments={[
            { path: "/dashboard", label: "Home" },
            { path: "/dashboard", label: "Dashboard" },
            { path: "/m_and_e", label: "M And E" },
            { path: `/panel/${formId}`, label: "Panel" },
          ]}
        />
        <div className="flex justify-between mr-4">
          <h2 className="text-xl font-semibold">Panel Form</h2>
          {panelData?.meta?.createdUser === true && (
            <Link
              to="/panel_create"
              state={{ formId: formId }}
              className="text-white fonr-bold py-2 px-4 rounded cursor-pointer text-sm"
              style={{ background: "#2ea2d1" }}
              onMouseEnter={(e: any) =>
                (e.target.style.backgroundColor = "#6fc3df")
              }
              onMouseLeave={(e: any) => {
                e.target.style.backgroundColor = "#2ea2d1";
              }}
            >
              Add
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6 text-sm mt-4 items-center">
          <div className="flex flex-col">
            <label
              htmlFor="formDocNo"
              className="mb-1 font-medium text-gray-700"
            >
              Form Doc No
            </label>

            <input
              id="formDocNo"
              type="text"
              placeholder="Enter Form Doc No"
              className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
              name="form_doc_no"
              value={searchTerm.form_doc_no}
              onChange={handleInputChange}
            />
          </div>
          {/* <div className="flex flex-col">
            <label
              htmlFor="formDocNo"
              className="mb-1 font-medium text-gray-700"
            >
              From Date
            </label>
            <input
              id="formDocNo"
              type="date"
              placeholder="Enter Date"
              className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
              name="from_date"
              value={searchTerm.from_date}
              onChange={handleInputChange}
            />
          </div> */}
          <div className="flex flex-col">
            <label
              htmlFor="from_date"
              className="mb-1 font-medium text-gray-700"
            >
              From Date
            </label>
            <div className="date-container" style={{ position: "relative" }}>
              {/* This layer shows the user the DD-MM-YYYY format */}
              <div
                className="date-overlay"
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  backgroundColor: "white",
                  pointerEvents: "none",
                  zIndex: 1,
                  fontSize: "14px",
                }}
              >
                {formatDisplay(searchTerm.from_date)}
              </div>

              <input
                id="from_date"
                type="date"
                name="from_date"
                /* IMPORTANT: Value MUST be yyyy-MM-dd (searchTerm.from_date) */
                value={searchTerm.from_date || ""}
                onChange={handleInputChange}
                className="native-date-input border border-blue-500 focus:outline-none p-2 w-full rounded-md"
              />
            </div>
          </div>
          {/* <div className="flex flex-col">
            <label
              htmlFor="formDocNo"
              className="mb-1 font-medium text-gray-700"
            >
              To Date
            </label>
            <input
              id="formDocNo"
              type="date"
              placeholder="Enter Date"
              className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
              name="to_date"
              value={searchTerm.to_date}
              onChange={handleInputChange}
            />
          </div> */}
          <div className="flex flex-col">
            <label
              htmlFor="from_date"
              className="mb-1 font-medium text-gray-700"
            >
              To Date
            </label>
            <div className="date-container" style={{ position: "relative" }}>
              {/* This layer shows the user the DD-MM-YYYY format */}
              <div
                className="date-overlay"
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  backgroundColor: "white",
                  pointerEvents: "none",
                  zIndex: 1,
                  fontSize: "14px",
                }}
              >
                {formatDisplay(searchTerm.to_date)}
              </div>

              <input
                id="formDocNo"
                type="date"
                placeholder="Enter Date"
                className="native-date-input border border-blue-500 focus:outline-none p-2 w-full rounded-md"
                name="to_date"
                value={searchTerm.to_date || ""}
                onChange={handleInputChange}
              />
            </div>
          </div>
          {panelData?.meta?.authenticatedUser?.role_id == 1 ? (
            <div className="flex flex-col">
              <label
                htmlFor="status"
                className="mb-1 font-medium text-gray-700"
              >
                Status
              </label>
              <MultiSelect
                id="status"
                placeholder={
                  searchTerm.status.length > 0 ? "" : "Select Status"
                }
                data={["All", "Default", "Ongoing", "Completed", "Cancel"]}
                className="border border-blue-500 focus:outline-none w-full rounded-md"
                value={searchTerm.status}
                onChange={handleStatusChange}
              />
            </div>
          ) : (
            <div className="flex flex-col">
              <label
                htmlFor="status"
                className="mb-1 font-medium text-gray-700"
              >
                Status
              </label>
              <MultiSelect
                id="status"
                placeholder={
                  searchTerm.status.length > 0 ? "" : "Select Status"
                }
                data={["All", "Ongoing", "Completed", "Cancel"]}
                className="border border-blue-500 focus:outline-none w-full rounded-md"
                value={searchTerm.status}
                onChange={handleStatusChange}
              />
            </div>
          )}

          <div className="flex flex-col">
            <label htmlFor="status" className="mb-1 font-medium text-gray-700">
              Branch
            </label>
            {panelData?.meta?.authenticatedUser?.emp_id == "000-000046" ||
            panelData?.meta?.authenticatedUser?.emp_id == "000-000071" ||
            panelData?.meta?.authenticatedUser?.emp_id == "000-000024" ||
            panelData?.meta?.authenticatedUser?.emp_id == "000-000067" ? (
              <Select
                id="branch_id"
                searchable
                clearable
                value={searchTerm.branch_id}
                data={panelData?.meta?.branch?.map((item: indexData) => ({
                  value: String(item.id),
                  label: item.branch_name,
                }))}
                onChange={handleBranchChange}
                placeholder="Select Branch"
                className="border border-blue-500 focus:outline-none w-full rounded-md"
              />
            ) : (
              <Select
                id="branch_id"
                name="branch_id"
                searchable
                clearable
                value={searchTerm.branch_id}
                data={panelData?.meta?.user_branches?.map(
                  (item: indexData) => ({
                    value: String(item.branch_id),
                    label: item.branches?.branch_name || "",
                  }),
                )}
                onChange={handleBranchChange}
                placeholder="Select Branch"
                className="border border-blue-500 focus:outline-none w-full rounded-md"
              />
            )}
          </div>
          <div className="flex items-center mt-3">
            <button
              className="text-white px-4 py-2 rounded w-full cursor-pointer"
              style={{
                backgroundColor: "#2ea2d1",
              }}
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
          <div className="flex items-center mt-3">
            <button
              className="text-white px-4 py-2 rounded w-full cursor-pointer"
              style={{
                backgroundColor: "#2ea2d1",
              }}
              onClick={handleRestart}
            >
              Clear
            </button>
          </div>
        </div>
        <div className="overflow-x-auto mt-4">
          <Table className="min-w-[700px]">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>No</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Form No</Table.Th>
                <Table.Th>Form Branch</Table.Th>
                <Table.Th>Requested By</Table.Th>
                <Table.Th>Created Date</Table.Th>
                <Table.Th>Modified</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {panelData?.data?.length > 0 ? (
                rows
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-10">
                      {/* <Loader size="xl" color="blue" /> */}
                      <p className="mt-4 text-lg font-semibold text-gray-700 animate-pulse">
                        There has no data
                      </p>
                    </div>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </div>
      </div>
      <div className="mx-auto mt-6  items-center  px-4">
        <Pagination
          total={Math.ceil((panelData?.data?.length ?? 0) / pageSize)}
          value={activePage}
          onChange={setActivePage}
          boundaries={1}
        />
        <div className="flex justify-center items-center gap-2 text-sm text-gray-600 font-bold">
          <span>Total</span>
          <span className="text-red-700 fw-bold">
            {panelData?.data?.length ?? 0}
          </span>
          <span>Rows</span>
        </div>
      </div>
    </div>
  );
};

export default panelIndex;
