import React, { useEffect, useState } from "react";
import type { meGeneratorDataType } from "../../../utils/meDataUtil/metype";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  dateFormat,
  dateTimeFormat,
  handleCopy,
} from "../../../utils/requestDiscountUtil/helper";
import { Button, Loader } from "@mantine/core";
import dashboardPhoto from "../../../assets/images/reqBa.png";
import MeApproveForm from "../meApproveForm";
import NavPath from "../../../components/NavPath";
import TsStatusBadge from "../../../components/ui/TsStatusBadge";
import { FiCopy } from "react-icons/fi";

import { panelDetailData } from "../../../api/ME/panel/panel";
import PanelTableDetail from "./panelTableDetail";

const PanelDetail: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<meGeneratorDataType | null>();
  const [copied, setCopied] = useState<boolean>(false);
  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    if (!id) return;
    fetchData(id);
  }, [id]);
  const fetchData = async (id: string | number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const data = await panelDetailData(token, id);
      setDetailData(data);
    } catch (error) {
      console.error("PanelDetail error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onCopyClick = () => {
    handleCopy(
      detailData?.generalForm?.form_doc_no || "",
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.log("Copy Failed:", err);
      },
    );
  };
  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };
  if (!detailData || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="xl" />
      </div>
    );
  }

  return (
    <>
      {detailData == null ? (
        <div className="flex justify-center items-center min-h-screen"></div>
      ) : (
        <div className="">
          <div className="">
            <div
              className="h-30 w-full bg-cover bg-center  rounded-lg shadow-md mb-2 p-4 sm:p-6"
              style={{ backgroundImage: `url(${dashboardPhoto})` }}
            ></div>
            <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6 w-full ">
              {detailData?.generalForm?.remark && (
                <h1 className="text-red-700 font-bold  text-break italic  mt-1  w:[80px] whitespace-normal break-words ">
                  {detailData.generalForm.remark}
                </h1>
              )}

              <NavPath
                segments={[
                  { path: "/dashboard", label: "Dashboard" },
                  {
                    path: `/panel/${detailData?.subForm?.sub_form_id}`,
                    label: "Panel",
                  },
                  {
                    path: `/me_panel_detail/${id}`,
                    label: "Panel Detail",
                  },
                ]}
              />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                <h2 className="text-base sm:text-lg font-semibold">
                  M&E PanelForm(
                  {detailData?.generalForm?.form_doc_no
                    ? detailData?.generalForm?.form_doc_no
                    : ""}
                  )
                  <button
                    onClick={onCopyClick}
                    className={`ml-2 px-2 py-1 text-xs rounded transition-all ${
                      copied
                        ? "text-green-600 bg-green-50"
                        : "text-blue-500 mt-1 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                    }`}
                    title={copied ? "Copied!" : "Copy ID"}
                    disabled={copied}
                  >
                    {copied ? "Copied!" : <FiCopy className="w-4 h-4" />}
                  </button>
                  <TsStatusBadge
                    status={
                      detailData?.generalForm?.status
                        ? detailData?.generalForm?.status
                        : ""
                    }
                  />
                </h2>

                <div className="text-gray-600 text-sm sm:text-base">
                  {detailData?.generalForm?.created_at
                    ? dateFormat(detailData?.generalForm?.created_at)
                    : ""}
                </div>
                <div
                  className={
                    detailData?.generalForm?.status === "Default"
                      ? "block"
                      : "hidden"
                  }
                >
                  {detailData?.generalForm?.status === "Default" && (
                    <Button
                      component={Link}
                      state={{
                        reAdd: true,
                        formId: detailData?.subForm?.sub_form_id,
                        panelFormId: detailData?.generalForm?.id,
                      }}
                      to="/panel_create"
                    >
                      Add More
                    </Button>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <div className="bodyData">
                  <div className="tableData">
                    <PanelTableDetail
                      detailData={detailData}
                      onRefresh={() => fetchData(id!)}
                      loading={loading}
                      setLoading={setLoading}
                    />
                  </div>
                  <hr className="mt-8 mb-6" />
                  <div className="approve">
                    <MeApproveForm
                      detailData={detailData}
                      onRefresh={() => fetchData(id!)}
                      loading={loading ?? false}
                      setLoading={setLoading}
                    />
                  </div>
                  <div className="userData grid lg:grid-cols-5 md:grid-cols-4 grid-cols-2 items-start text-sm gap-6">
                    {/* Prepared By */}
                    <div className="flex flex-col">
                      <span className="font-medium ">Prepared By</span>
                      <span className="font-semibold text-blue-400 mt-1">
                        {detailData?.generalForm?.originators?.title}{" "}
                        {detailData?.generalForm?.originators?.name}
                      </span>
                      <span className="text-blue-500 mt-1">
                        (
                        {
                          detailData?.generalForm?.originators?.departments
                            ?.name
                        }
                        )
                      </span>
                      <span className="text-blue-500 mt-1">
                        {dateTimeFormat(
                          detailData?.generalForm?.ongoing_time ??
                            detailData?.generalForm?.created_at,
                        )}
                      </span>
                    </div>
                    {detailData?.getChecker &&
                    (detailData?.form_rejected == null ||
                      detailData?.form_rejected?.can_cel_u_ser?.name !==
                        "Yan Naing Soe") ? (
                      ["checked", "Completed", "Cancel"].includes(
                        detailData?.generalForm?.status ?? "",
                      ) ? (
                        <div>
                          {/* sdfnmdnsfm */}
                          <div className="font-medium ">Checked By</div>
                          <div className="font-semibold text-blue-400 mt-1">
                            {/* {detailData?.getChecker?.assigned_user?.title}{" "}
                            {detailData?.getChecker?.assigned_user?.name}  */}
                            {detailData?.getChecker?.approval_users?.title}{" "}
                            {detailData?.getChecker?.approval_users?.name}
                          </div>
                          <div className="text-blue-500 mt-1">
                            (
                            {
                              detailData?.getChecker?.approval_users?.department
                                ?.name
                            }
                            )
                          </div>
                          <div className="text-blue-500 mt-1">
                            {dateTimeFormat(detailData?.getChecker?.created_at)}
                          </div>
                          {detailData?.getChecker?.comment && (
                            <div className="text-info text-break italic text-blue-500 mt-1  w:[80px] whitespace-normal break-words ">
                              {detailData?.getChecker?.comment}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="opacity-40">Checked By</div>
                      )
                    ) : (
                      <div className="opacity-40">
                        <div>Checked By</div>
                        <div>-------------------</div>
                        {/* <div>Operation Analysis</div> */}
                        <div>
                          {/* {dateTimeFormat(detailData?.getChecker?.created_at)} */}
                        </div>
                      </div>
                    )}

                    {detailData?.getApprover &&
                    detailData?.form_rejected == null ? (
                      ["Completed", "Cancel"].includes(
                        detailData?.generalForm?.status ?? "",
                      ) ? (
                        <div>
                          {/* sdfnmdnsfm */}
                          <div className="font-medium ">Completed By</div>
                          <div className="font-semibold text-blue-400 mt-1">
                            {detailData?.getApprover?.approval_users?.title}{" "}
                            {detailData?.getApprover?.approval_users?.name}
                          </div>
                          <div className="text-blue-500 mt-1">
                            (
                            {
                              detailData?.getApprover?.approval_users
                                ?.department?.name
                            }
                            )
                          </div>
                          <div className="text-blue-500 mt-1">
                            {dateTimeFormat(
                              detailData?.getApprover?.created_at,
                            )}
                          </div>
                          {detailData?.getApprover?.comment && (
                            <div className="text-info text-break italic text-blue-500 mt-1  w:[80px] whitespace-normal break-words ">
                              {detailData?.getApprover?.comment}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="opacity-40">Completed By</div>
                      )
                    ) : (
                      <div className="opacity-40">
                        <div>Completed By</div>
                        <div>-------------------</div>
                        {/* <div>Operation Analysis</div> */}
                        <div>
                          {dateTimeFormat(detailData?.form?.created_at)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-6">
                    {detailData?.generalForm?.status === "Cancel" && (
                      <div className="col-12">
                        <div className="bg-red-300 p-4 rounded-lg" role="alert">
                          This form was rejected by{" "}
                          <span className="fw-bold">
                            {detailData?.form_rejected?.can_cel_u_ser?.name}
                          </span>
                          <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="alert"
                            aria-label="Close"
                          ></button>
                        </div>
                      </div>
                    )}
                    <div></div>
                  </div>
                </div>
              </div>
              <div className="">
                <Button onClick={handleBack}>Back</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PanelDetail;
