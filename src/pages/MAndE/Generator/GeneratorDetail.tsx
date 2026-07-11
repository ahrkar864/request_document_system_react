import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { meDataDetail } from "../../../api/ME/meData";
import type { meGeneratorDataType } from "../../../utils/meDataUtil/metype";
import { Button, Loader } from "@mantine/core";
import dashboardPhoto from "../../../assets/images/reqBa.png";
import NavPath from "../../../components/NavPath";
import { FiCopy } from "react-icons/fi";
import StatusBadge from "../../../components/ui/StatusBadge";
import {
  dateFormat,
  dateTimeFormat,
  handleCopy,
} from "../../../utils/requestDiscountUtil/helper";
import ApproveForm from "../../requestDiscount/approveForm";
import TableDetail from "./tableDetail";
import MeApproveForm from "../meApproveForm";
import TsStatusBadge from "../../../components/ui/TsStatusBadge";

const GeneratorDetail: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<meGeneratorDataType | null>(
    null,
  );
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
      const data = await meDataDetail(token, id);
      setDetailData(data);
    } catch (error) {
      console.error("GeneratorDetail error:", error);
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
    // detailData(null);
  };
  const FullPageLoader = () => (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
      <Loader size="xl" color="blue" />
    </div>
  );

  if (loading)
    return (
      <>
        {/* {loading && <FullPageLoader />} */}

        {!detailData || loading ? (
          <div className="flex justify-center items-center min-h-screen">
            <Loader size="xl" />
          </div>
        ) : (
          <div>{/* your existing content */}</div>
        )}
      </>
    );

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
            <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6 w-full">
              {detailData?.generalForm?.remark && (
                <h1 className="text-red-700 font-bold">
                  [ {detailData.generalForm.remark}]
                </h1>
              )}

              <NavPath
                segments={[
                  { path: "/dashboard", label: "Dashboard" },
                  {
                    path: `/generator/${detailData?.subForm?.sub_form_id}`,
                    label: "generaor",
                  },
                  {
                    path: `/me_generator_detail/${id}`,
                    label: "Generator Detail",
                  },
                ]}
              />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                <h2 className="text-base sm:text-lg font-semibold">
                  M&E Generator Form(
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
                        generalFormId: detailData?.generalForm?.id,
                      }}
                      to="/generator_create"
                    >
                      Add More
                    </Button>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <div className="bodyData">
                  <div className="tableData">
                    <TableDetail
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
                  <div className="userData grid lg:grid-cols-6 md:grid-cols-6 grid-cols-3 items-start text-sm">
                    {/* Prepared By */}
                    <div className="flex flex-col">
                      <span className="font-medium ">Prepared By</span>
                      <span className="font-semibold text-blue-400 mt-1">
                        {detailData?.generalForm?.originators?.title} {detailData?.generalForm?.originators?.name}
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
                        {dateTimeFormat(detailData?.generalForm?.created_at)}
                      </span>
                    </div>
                    {detailData?.getChecker &&
                    (detailData?.form_rejected == null ||
                      detailData?.form_rejected?.can_cel_u_ser?.name !==
                        "Yan Naing Soe") ? (
                      ["Checked", "Completed", "Cancel"].includes(
                        detailData?.generalForm?.status ?? "",
                      ) ? (
                        <div>
                          {/* sdfnmdnsfm */}
                          <div className="font-medium ">Checked By</div>
                          <div className="font-semibold text-blue-400 mt-1">
                            {detailData?.getChecker?.approval_users?.title}{" "}
                            {detailData?.getChecker?.approval_users?.name}
                          </div>
                          <div className="text-blue-500 mt-1">
                            (
                            {
                              // detailData?.getChecker?.assigned_user?.department
                              //   ?.name
                              detailData?.getChecker?.approval_users?.department
                                ?.name
                            }
                            )
                          </div>
                          <div className="text-blue-500 mt-1">
                            {dateTimeFormat(detailData?.getChecker?.created_at)}
                          </div>
                          {detailData?.getChecker?.comment && (
                            <div className="text-info text-break italic text-blue-500 mt-1">
                              “{detailData?.getChecker?.comment}”
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
                        <div>Operation Analysis</div>
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
                            <div className="text-info text-break italic text-blue-500 mt-1">
                              “{detailData?.getApprover?.comment}”
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
                        <div>Operation Analysis</div>
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

export default GeneratorDetail;
