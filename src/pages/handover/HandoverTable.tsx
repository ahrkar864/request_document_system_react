import React, { useContext, useState } from "react";
import type {
  FileItem,
  HandoverDataType,
  TableDetailProps,
} from "../../utils/HandoverUtil/handovertype";
import { NotificationContext } from "../../context/NotificationContext";
import { useDisclosure } from "@mantine/hooks";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Button, Group, Modal, Table, type TableData } from "@mantine/core";
import {
  IconEdit,
  IconFile,
  IconTrash,
  IconDownload,
  IconFileTypePdf,
  IconFileTypeXls,
} from "@tabler/icons-react";

import { handoverDelete } from "../../api/Handover/handover";

const HandoverTable: React.FC<TableDetailProps> = ({
  detailData,
  onRefresh,
  loading,
  setLoading,
  checkedHandoverIds = [],
  onCheckedHandoverChange,
}) => {
  const { refreshNotifications } = useContext(NotificationContext);
  const [activeHandoverId, setActiveHandoverId] = useState<
    number | string | null
  >();
  const HandoverList = detailData?.handoverData;
  const files = detailData?.files;
  console.log("Handover Files", files);
  const generalForm = detailData?.generalForm;
  const authUserId = detailData?.authUserId;
  const recipientReviews = Array.isArray(detailData?.recipientData)
    ? detailData.recipientData
    : detailData?.recipientData
      ? [detailData.recipientData]
      : [];
  const hasSubmittedRecipientReview = recipientReviews.some(
    (item) =>
      String(item.user_id) === String(authUserId) && item.rating != null,
  );
  const canEditChecked =
    (generalForm?.status === "Ongoing" && detailData?.supervisor === true) ||
    (generalForm?.status === "Checked" &&
      detailData?.recipient === true &&
      !hasSubmittedRecipientReview);

  const [fileOpened, { open: openFileModal, close: closeFileModal }] =
    useDisclosure(false);
  const navigate = useNavigate();
  const handleDelete = async (
    generalFormID?: string | number,
    formId?: string | number,
  ) => {
    if (!generalFormID || !formId) return;

    const token = localStorage.getItem("token");
    console.log("Token", token);
    if (!token) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This record will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;
    setLoading(true);

    try {
      const res = await handoverDelete(token, generalFormID, formId);

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        timer: 1200,
        showConfirmButton: false,
      });
      if ((HandoverList as number[]).length <= 1) {
        await refreshNotifications();
        navigate(`/handover/${formId}`);
      } else {
        onRefresh();
      }
    } catch {
      Swal.fire("Error", "Delete failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const tableData: TableData = {
    head: [
      "No",
      generalForm?.status == "Default" &&
        authUserId == generalForm?.user_id && (
          <div className="items-center">Action</div>
        ),
      (generalForm?.status === "Default" ||
        generalForm?.status === "Ongoing" ||
        generalForm?.status === "Checked") && (
        <div className="whitespace-nowrap">Checked</div>
      ),
      <div className="whitespace-nowrap">Category Name</div>,
      <div className="whitespace-nowrap">Module Name</div>,
      "File",
    ],

    body: (HandoverList as HandoverDataType[]).length
      ? (HandoverList as HandoverDataType[]).map((element, index) => [
          index + 1,
          <Group gap="xs" key={`action-${element.id}`}>
            {generalForm?.status == "Default" &&
              authUserId == generalForm?.user_id && (
                <div className="flex gap-2 flex-nowrap">
                  <Link
                    to={`/handover_edit/${element.id}`}
                    state={{ generalForm }}
                    className="contents"
                  >
                    <Button size="xs" variant="light" color="blue">
                      <IconEdit size={16} />
                    </Button>
                  </Link>

                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    loading={loading}
                    onClick={() => handleDelete(generalForm?.id, element.id)}
                  >
                    <IconTrash size={16} />
                  </Button>
                </div>
              )}
          </Group>,

          (generalForm?.status === "Default" ||
            generalForm?.status === "Ongoing" ||
            generalForm?.status === "Checked") && (
            <div className="whitespace-nowrap">
              <input
                type="checkbox"
                checked={
                  element.id != null && checkedHandoverIds.includes(element.id)
                }
                disabled={!canEditChecked || loading}
                onChange={(event) => {
                  if (element.id == null) return;
                  onCheckedHandoverChange?.(
                    element.id,
                    event.currentTarget.checked,
                  );
                }}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </div>
          ),

          <div className="whitespace-nowrap">
            {element.category_name?.toUpperCase()}
          </div>,
          <div className=" whitespace-nowrap">
            {element.module_name?.toUpperCase()}
          </div>,

          <span
            key={`file-${element.id}`}
            className="inline-flex items-center justify-center text-blue-700"
          >
            {(files as FileItem[])?.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setActiveHandoverId(element?.id);
                  openFileModal();
                }}
                className="hover:text-blue-900 transition"
              >
                <IconFile size={18} />
              </button>
            ) : (
              <span className="text-sm text-gray-400">No file</span>
            )}
          </span>,

        ])
      : [],
  };
  const filteredFiles = (files as FileItem[])?.filter(
    (file) => file.handover_id === activeHandoverId,
  );
  return (
    <div className="relative mt-6 overflow-x-auto">
      <Table
        data={tableData}
        styles={{
          thead: { backgroundColor: "#A9D8E9" },
          th: { backgroundColor: "inherit" },
        }}
      />
      <Modal
        opened={fileOpened}
        onClose={() => {
          closeFileModal();
          setActiveHandoverId(null);
        }}
        title="Attached Files"
        size="lg"
        centered
      >
        {filteredFiles?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(filteredFiles as FileItem[]).map((file, i) => {
              const url = file.file_url.toLowerCase();
              const isPdf = url.endsWith(".pdf");
              const isExcel = [".xls", ".xlsx", ".xlsm", ".csv"].some((ext) =>
                url.endsWith(ext),
              );
              const isImage = [".png", ".jpg", ".jpeg", ".gif", ".webp"].some(
                (ext) => url.endsWith(ext),
              );

              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 border rounded-lg p-2"
                >
                  {isPdf ? (
                    <IconFileTypePdf size={48} className="text-red-500" />
                  ) : isExcel ? (
                    <IconFileTypeXls size={48} className="text-green-600" />
                  ) : isImage ? (
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      className="w-full h-32 object-cover rounded"
                    />
                  ) : (
                    <IconFile size={48} className="text-gray-400" />
                  )}

                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 underline truncate w-full text-center"
                  >
                    {file.name}
                  </a>

                  {isExcel && (
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      component="a"
                      href={file.file_url}
                      download
                      leftSection={<IconDownload size={16} />}
                    >
                      Download Excel File
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-sm">
            No files for this record
          </p>
        )}
      </Modal>
    </div>
  );
};

export default HandoverTable;
