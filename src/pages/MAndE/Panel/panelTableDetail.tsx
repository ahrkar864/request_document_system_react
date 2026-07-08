import React, { useContext, useState } from "react";
import type {
  FileItem,
  mePanelDataType,
  TableDetailProps,
} from "../../../utils/meDataUtil/metype";
import { NotificationContext } from "../../../context/NotificationContext";
import { useDisclosure } from "@mantine/hooks";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Button, Group, Modal, Table, type TableData } from "@mantine/core";
import { IconEdit, IconFile, IconTrash } from "@tabler/icons-react";
import {
  dateFormat,
  numberFormat,
} from "../../../utils/requestDiscountUtil/helper";
import { panelDelete } from "../../../api/ME/panel/panel";

const PanelTableDetail: React.FC<TableDetailProps> = ({
  detailData,
  onRefresh,
  loading,
  setLoading,
}) => {
  const { refreshNotifications } = useContext(NotificationContext);
  const [activePanelId, setActivePanelId] = useState<number | string | null>();
  const panelList = detailData?.detailData;
  console.log("Panel List>>", panelList);
  const files = detailData?.files;
  const generalForm = detailData?.generalForm;
  const authUserId = detailData?.authUserId;
  const [fileOpened, { open: openFileModal, close: closeFileModal }] =
    useDisclosure(false);
  const navigate = useNavigate();
  const handleDelete = async (
    generalFormID?: string | number,
    formId?: string | number,
  ) => {
    if (!generalFormID || !formId) return;

    const token = localStorage.getItem("token");
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
      const res = await panelDelete(token, generalFormID, formId);

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        timer: 1200,
        showConfirmButton: false,
      });
      console.log("Panel List after deletion>>", panelList);
      if ((panelList as number[]).length <= 1) {
        await refreshNotifications();
        navigate(`/panel/${formId}`);
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
      "Date",
      "Time",
      "L1",
      "L2",
      "L3",
      <div className="whitespace-nowrap">Breaker Temperature</div>,
      <div className="whitespace-nowrap">Total Load KW Use</div>,
      <div className="whitespace-nowrap">Voltage L-L</div>,
      <div className="whitespace-nowrap">Panel Cleaning Maintenance</div>,
      <div className="whitespace-nowrap">Breaker Maintenance</div>,
      <div className="whitespace-nowrap">
        Lighting & Power Source Maintenance
      </div>,
      <div className="whitespace-nowrap">LED Light Box Power</div>,
      "Remark",
      "Image",
    ],

    body: (panelList as mePanelDataType[]).length
      ? (panelList as mePanelDataType[]).map((element, index) => [
          index + 1,
          <Group gap="xs" key={`action-${element.id}`}>
            {generalForm?.status == "Default" &&
              authUserId == generalForm?.user_id && (
                <div className="flex gap-2 flex-nowrap">
                  <Link
                    to={`/panel_edit/${element.id}`}
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
          <div className="whitespace-nowrap">
            {dateFormat(element.panel_date)}
          </div>,
          <div className=" whitespace-nowrap">{element.panel_time}</div>,
          numberFormat(element.l1_level),
          numberFormat(element.l2_level),
          numberFormat(element.l3_level),
          <div className="flex items-end justify-center w-full whitespace-nowrap">
            {numberFormat(element.breaker_temperature)}
          </div>,
          <div className="flex items-end justify-center w-full whitespace-nowrap">
            {numberFormat(element.total_load_kw_use)}
          </div>,
          <div className="flex items-end justify-center w-full whitespace-nowrap">
            {numberFormat(element.voltagel_l_level)}
          </div>,
          <div className="flex items-end justify-center w-full whitespace-nowrap">
            {element.panel_cleaning_maintenance}
          </div>,
          <div className="flex items-end justify-center w-full whitespace-nowrap">
            {element.breaker_maintenance}
          </div>,
          <div className="flex items-end justify-center w-full whitespace-nowrap">
            {element.lighting_maintenance}
          </div>,

          <div className="flex items-end justify-center w-full whitespace-nowrap">
            {element.led_light_box_power}
          </div>,

          <div
            className={`
  ${
    (element.remark?.length ?? 0) > 120
      ? "min-w-[500px]"
      : (element.remark?.length ?? 0) > 13
        ? "min-w-[300px]"
        : "min-w-[80px]"
  } 
  max-w-[600px] whitespace-normal break-words
`}
          >
            {element.remark ? element.remark : "-"}
          </div>,
          <span
            key={`file-${element.id}`}
            className="inline-flex items-center justify-center text-blue-700"
          >
            {(files as FileItem[])?.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setActivePanelId(element?.id);
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
    (file) => file.panel_id === activePanelId,
  );
  console.log("panelList>>", panelList);
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
          setActivePanelId(null);
        }}
        title="Attached Files"
        size="lg"
        centered
      >
        {filteredFiles?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(filteredFiles as FileItem[]).map((file, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 border rounded-lg p-2"
              >
                {file.file_url.toLowerCase().endsWith(".pdf") ? (
                  <IconFile size={48} className="text-red-500" />
                ) : (
                  <img
                    src={file.file_url}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded"
                  />
                )}

                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline truncate w-full text-center"
                >
                  {file.name}
                </a>
              </div>
            ))}
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

export default PanelTableDetail;
