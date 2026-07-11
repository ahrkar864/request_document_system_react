import React, { useEffect, useState } from "react";
import type {
  HandoverDataType,
  RecipientData,
} from "../../utils/HandoverUtil/handovertype";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  dateFormat,
  dateTimeFormat,
  handleCopy,
} from "../../utils/requestDiscountUtil/helper";
import { Button, Loader } from "@mantine/core";
import dashboardPhoto from "../../assets/images/reqBa.png";

import NavPath from "../../components/NavPath";
import TsStatusBadge from "../../components/ui/TsStatusBadge";
import { FiCopy, FiUserCheck, FiUsers } from "react-icons/fi";

import { handoverDetailData } from "../../api/Handover/handover";
import HandoverTable from "./HandoverTable";
import HandoverApproveForm from "./HandoverApproveForm";
import HandoverRatingReview from "./HandoverRatingReview";
import RecipientSearch from "./RecipientSearch";

interface RecipientUser {
  id: number;
  name: string;
  emp_id: string;
  title?: string;
  department?: {
    name?: string;
  };
}

const getRecipientUser = (item: any) =>
  item?.user ??
  item?.users ??
  item?.recipient_user ??
  item?.recipientUser ??
  item?.approval_users ??
  item?.approval_user;

const getRecipientName = (recipient: RecipientUser) =>
  recipient.name?.trim() || `User #${recipient.id}`;

const getInitials = (name: string) => {
  const cleanName = name.trim();
  if (!cleanName) return "U";

  return cleanName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const getRecipientsFromReviews = (data: any): RecipientUser[] => {
  const reviews = Array.isArray(data?.handoverReview)
    ? data.handoverReview
    : Array.isArray(data?.recipientData)
      ? data.recipientData
      : data?.handoverReview
        ? [data.handoverReview]
        : data?.recipientData
          ? [data.recipientData]
          : [];

  return reviews
    .filter((item: any) => item?.user_id || getRecipientUser(item)?.id)
    .map((item: any) => ({
      id: Number(item.user_id ?? getRecipientUser(item)?.id),
      name: getRecipientUser(item)?.name ?? item.name ?? "",
      emp_id: getRecipientUser(item)?.emp_id ?? item.emp_id ?? "",
      title: getRecipientUser(item)?.title,
      department: getRecipientUser(item)?.department,
    }));
};

const HandoverDetail: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<HandoverDataType | null>();
  const [recipients, setRecipients] = useState<RecipientUser[]>([]);
  const [checkedHandoverIds, setCheckedHandoverIds] = useState<
    Array<number | string>
  >([]);

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
      const data = await handoverDetailData(token, id);
      setDetailData(data);
      setRecipients(getRecipientsFromReviews(data));
      setCheckedHandoverIds(
        Array.isArray(data?.handoverData)
          ? data.handoverData
              .filter(
                (handover: HandoverDataType) =>
                  handover.id != null && Boolean(handover.is_checked),
              )
              .map((handover: HandoverDataType) => handover.id!)
          : [],
      );
    } catch (error) {
      console.error("handover Detail error:", error);
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
  const refreshDetail = () => {
    if (!id) return;
    setCheckedHandoverIds([]);
    fetchData(id);
  };
  const handleCheckedHandoverChange = (
    handoverId: number | string,
    checked: boolean,
  ) => {
    setCheckedHandoverIds((prev) =>
      checked
        ? prev.includes(handoverId)
          ? prev
          : [...prev, handoverId]
        : prev.filter((id) => id !== handoverId),
    );
  };

  if (!detailData || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="xl" />
      </div>
    );
  }

  console.log("Detail Data", detailData);
  const recipientReviews: RecipientData[] = Array.isArray(
    detailData?.recipientData,
  )
    ? detailData.recipientData
    : detailData?.recipientData
      ? [detailData.recipientData]
      : [];
  const receivedRecipients = recipientReviews.filter(
    (recipient) => recipient.rating != null,
  );
  const canShowReceivedBy = [
    "Checked",
    "Recipient Received",
    "Approved",
    "Completed",
    "Cancel",
  ].includes(detailData?.generalForm?.status ?? "");
  const isOriginator =
    detailData?.authUserId != null &&
    detailData?.generalForm?.user_id != null &&
    String(detailData.authUserId) === String(detailData.generalForm.user_id);
  const canAddRecipients =
    detailData?.generalForm?.status === "Default" && isOriginator;

  return (
    <>
      {detailData == null ? (
        <div className="flex justify-center items-center min-h-screen"></div>
      ) : (
        <div className="">
          <div className="">
            <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6 w-full ">
              {detailData?.generalForm?.remark && (
                <h1 className="text-red-700 font-bold text-break italic mt-1 w:[80px] whitespace-normal break-words ">
                  {detailData.generalForm.remark}
                </h1>
              )}

              <NavPath
                segments={[
                  { path: "/dashboard", label: "Dashboard" },
                  {
                    path: `/handover/${detailData?.generalForm?.id}`,
                    label: "Handover",
                  },
                  {
                    path: `/handover_detail/${id}`,
                    label: "Handover Detail",
                  },
                ]}
              />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                <h2 className="text-base sm:text-lg font-semibold">
                  Handover Form(
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
                <div className={canAddRecipients ? "block" : "hidden"}>
                  {canAddRecipients && (
                    <Button
                      component={Link}
                      state={{
                        reAdd: true,
                        handoverFormId: detailData?.generalForm?.id,
                      }}
                      to="/handover/create"
                    >
                      Add More
                    </Button>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <div className="bodyData">
                  <div className="tableData">
                    <HandoverTable
                      detailData={detailData}
                      onRefresh={refreshDetail}
                      loading={loading}
                      setLoading={setLoading}
                      checkedHandoverIds={checkedHandoverIds}
                      onCheckedHandoverChange={handleCheckedHandoverChange}
                    />
                  </div>

                  {recipients.length > 0 && detailData?.recipient === false && (
                    <div className="mt-6 rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                            <FiUsers className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              Recipients
                            </div>
                            <div className="text-xs text-gray-500">
                              {recipients.length} user
                              {recipients.length > 1 ? "s" : ""} selected for
                              this handover
                            </div>
                          </div>
                        </div>
                        <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-600">
                          <FiUserCheck className="h-3.5 w-3.5" />
                          Added
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {recipients.map((recipient) => {
                          const recipientName = getRecipientName(recipient);
                          const departmentName = recipient.department?.name;

                          return (
                            <div
                              key={recipient.id}
                              className="flex min-w-0 items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-3 shadow-sm"
                            >
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                                {getInitials(recipientName)}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-gray-900">
                                  {recipient.title
                                    ? `${recipient.title} ${recipientName}`
                                    : recipientName}
                                </div>
                                <div className="mt-0.5 truncate text-xs text-gray-500">
                                  {recipient.emp_id
                                    ? `Emp ID: ${recipient.emp_id}`
                                    : `User ID: ${recipient.id}`}
                                </div>
                                {departmentName && (
                                  <div className="mt-0.5 truncate text-xs text-blue-500">
                                    {departmentName}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <hr className="mt-8 mb-6" />

                  {/* Search Recipient */}

                  <div>
                    {canAddRecipients && (
                      <>
                        <RecipientSearch
                          initialRecipients={recipients}
                          onSelect={setRecipients}
                        />
                        <hr className="mt-8 mb-6" />
                      </>
                    )}
                  </div>

                  {/* Rating & Review */}
                  <HandoverRatingReview detailData={detailData} />

                  <div className="approve">
                    <HandoverApproveForm
                      recipients={recipients}
                      detailData={detailData}
                      canAddRecipients={canAddRecipients}
                      checkedHandoverIds={checkedHandoverIds}
                      onRefresh={refreshDetail}
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
                    {detailData?.getSupervisor &&
                    (detailData?.form_rejected == null ||
                      detailData?.form_rejected?.can_cel_u_ser?.name !==
                        "Wai Min Maung" ||
                      "Mg Mg Myat Thin") ? (
                      [
                        "Checked",
                        "Recipient Received",
                        "Approved",
                        "Completed",
                        "Cancel",
                      ].includes(detailData?.generalForm?.status ?? "") ? (
                        <div>
                          <div className="font-medium ">Checked By</div>
                          <div className="font-semibold text-blue-400 mt-1">
                            {detailData?.getSupervisor?.approval_users?.title}{" "}
                            {detailData?.getSupervisor?.approval_users?.name}
                          </div>
                          <div className="text-blue-500 mt-1">
                            (
                            {
                              detailData?.getSupervisor?.approval_users
                                ?.department?.name
                            }
                            )
                          </div>
                          <div className="text-blue-500 mt-1">
                            {dateTimeFormat(
                              detailData?.getSupervisor?.created_at,
                            )}
                          </div>
                          {detailData?.getSupervisor?.comment && (
                            <div className="text-info text-break italic text-blue-500 mt-1  w:[80px] whitespace-normal break-words ">
                              {detailData?.getSupervisor?.comment}
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
                        <div></div>
                      </div>
                    )}
                    {receivedRecipients.length > 0 &&
                    detailData?.form_rejected == null ? (
                      canShowReceivedBy ? (
                        <div className="space-y-2">
                          <div className="font-medium">Received By</div>
                          <div className="space-y-2">
                            {receivedRecipients.map((recipient, index) => (
                              <div
                                key={recipient.id ?? index}
                                className="rounded-md border border-blue-100 bg-blue-50/50 px-3 py-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="font-semibold text-blue-500 break-words">
                                      {recipient.user?.title}{" "}
                                      {recipient.user?.name}
                                    </div>
                                    {recipient.user?.department?.name && (
                                      <div className="text-blue-500 mt-1 break-words">
                                        ({recipient.user.department.name})
                                      </div>
                                    )}
                                  </div>
                                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-amber-500 border border-amber-100">
                                    {recipient.rating.toFixed(1)}
                                  </span>
                                </div>
                                <div className="text-blue-500 mt-1">
                                  {dateTimeFormat(recipient.created_at)}
                                </div>
                                {recipient.review && (
                                  <div className="text-info text-break italic text-blue-500 mt-1 whitespace-normal break-words">
                                    {recipient.review}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="opacity-40">Received By</div>
                      )
                    ) : (
                      <div className="opacity-40">
                        <div>Received By</div>
                        <div>-------------------</div>
                        <div></div>
                      </div>
                    )}

                    {detailData?.getApprover &&
                    detailData?.form_rejected == null ? (
                      ["Approved", "Completed", "Cancel"].includes(
                        detailData?.generalForm?.status ?? "",
                      ) ? (
                        <div>
                          <div className="font-medium ">Approved By</div>
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
                        <div className="opacity-40">Approved By</div>
                      )
                    ) : (
                      <div className="opacity-40">
                        <div>Approved By</div>
                        <div>-------------------</div>
                        <div>
                          {dateTimeFormat(detailData?.form?.created_at)}
                        </div>
                      </div>
                    )}

                    {detailData?.getManager &&
                    detailData?.form_rejected == null ? (
                      ["Completed", "Cancel"].includes(
                        detailData?.generalForm?.status ?? "",
                      ) ? (
                        <div>
                          <div className="font-medium ">Completed By</div>
                          <div className="font-semibold text-blue-400 mt-1">
                            {detailData?.getManager?.approval_users?.title}{" "}
                            {detailData?.getManager?.approval_users?.name}
                          </div>
                          <div className="text-blue-500 mt-1">
                            (
                            {
                              detailData?.getManager?.approval_users?.department
                                ?.name
                            }
                            )
                          </div>
                          <div className="text-blue-500 mt-1">
                            {dateTimeFormat(detailData?.getManager?.created_at)}
                          </div>
                          {detailData?.getManager?.comment && (
                            <div className="text-info text-break italic text-blue-500 mt-1  w:[80px] whitespace-normal break-words ">
                              {detailData?.getManager?.comment}
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

export default HandoverDetail;
