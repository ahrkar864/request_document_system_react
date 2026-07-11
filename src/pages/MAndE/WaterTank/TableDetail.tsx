import React, { useContext, useEffect, useState } from "react";
import type {
  FileItem,
  meWaterTankDataType,
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
import { waterTankDelete } from "../../../api/ME/WaterTank/watertank";

const TableDetail: React.FC<TableDetailProps> = ({
  detailData,
  onRefresh,
  loading,
  setLoading,
}) => {
  const { refreshNotifications } = useContext(NotificationContext);
  const [activeWaterTankId, setActiveWaterTankId] = useState<number | string | null>();
  const waterTankList = detailData?.detailData;
  const navigate = useNavigate();
  const safeWaterTankList = Array.isArray(waterTankList)
    ? (waterTankList as meWaterTankDataType[])
    : [];

  console.log("Water Tank List>>", waterTankList);
  const files = detailData?.files;
  const generalForm = detailData?.generalForm;
  const authUserId = detailData?.authUserId;
  const [fileOpened, { open: openFileModal, close: closeFileModal }] =
    useDisclosure(false);


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
      const res = await waterTankDelete(token, generalFormID, formId);

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        timer: 1200,
        showConfirmButton: false,
      });
      console.log("Water Tank List after deletion>>", waterTankList);
      sessionStorage.removeItem("watertank_cache");
      await refreshNotifications();
      navigate(`/water-tank/${detailData?.subForm?.sub_form_id ?? 8}`, {
        replace: true,
        state: { refresh: true },
      });
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
      "Pump1 Water Pressure",
      "Pump2 Water Pressure",
      "Pressure Pump",
      <div className="whitespace-nowrap">Eva Pump1</div>,
      <div className="whitespace-nowrap">Eva Pump2</div>,
      <div className="whitespace-nowrap">Eva Water Pump</div>,
      <div className="whitespace-nowrap">Water Supply Pipe</div>,
      <div className="whitespace-nowrap">Upper Tank Lower Tank</div>,
      <div className="whitespace-nowrap">Toilet Water Pressure</div>,
      "Remark",
      "Image",
    ],

    body: safeWaterTankList.length
      ? safeWaterTankList.map((element, index) => [
          index + 1,
          <Group gap="xs" key={`action-${element.id}`}>
            {generalForm?.status == "Default" &&
              authUserId == generalForm?.user_id && (
                <div className="flex gap-2 flex-nowrap">
                  <Link
                    to={`/water-tank/edit/${element.id}`}
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
            {dateFormat(element.water_tank_date)}
          </div>,
          <div className=" whitespace-nowrap">{element.water_tank_time}</div>,
          <div className=" whitespace-nowrap">
            {element.pump1_water_pressure}
          </div>,

          <div className=" whitespace-nowrap">
            {element.pump2_water_pressure}
          </div>,

          <div className=" whitespace-nowrap">{element.pressure_pump}</div>,

          <div className="flex items-end justify-center w-full whitespace-nowrap">
            {element.eva_pump1}
          </div>,
          <div className="flex items-end justify-center w-full whitespace-nowrap">
            {element.eva_pump2}
          </div>,
          <div className="flex items-end justify-center w-full whitespace-nowrap">
            {element.eva_water_pump}
          </div>,
          <div className="flex items-end justify-center w-full whitespace-nowrap">
            {element.water_supply_pipe}
          </div>,
          <div className="flex items-end justify-center w-full whitespace-nowrap">
            {element.upper_tank_lower_tank}
          </div>,
          <div className="flex items-end justify-center w-full whitespace-nowrap">
            {element.toilet_water_pressure}
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
                  setActiveWaterTankId(element?.id);
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
    (file) => file.water_tank_id === activeWaterTankId,
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
          setActiveWaterTankId(null);
        }}
        title="Attached Files"
        size="lg"
        centered
      >
        {filteredFiles?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(filteredFiles as FileItem[]).map((file, i) => {
              const fileUrl = String(file.file_url ?? "");
              const fileName = String(
                file.name ?? file.file_name ?? "Download file",
              );
              const filePath = (`${fileUrl} ${fileName}`.split("?")[0] ?? "")
                .toLowerCase();
              const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(filePath);
              const isPdf = /\.pdf$/.test(filePath);

              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 border rounded-lg p-2"
                >
                  {isImage ? (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={fileUrl}
                        alt={fileName}
                        className="w-full h-32 object-cover rounded"
                      />
                    </a>
                  ) : (
                    <div className="flex h-32 w-full flex-col items-center justify-center rounded bg-gray-50 text-gray-500">
                      <IconFile
                        size={48}
                        className={isPdf ? "text-red-500" : "text-green-600"}
                      />
                      <span className="mt-2 text-xs">
                        {isPdf ? "PDF File" : "Attachment"}
                      </span>
                    </div>
                  )}

                  <a
                    href={fileUrl}
                    download={!isImage ? fileName : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 underline truncate w-full text-center"
                  >
                    {fileName}
                  </a>
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

export default TableDetail;
