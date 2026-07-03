import React, { useEffect, useState } from "react";
import { Button, Loader, Menu } from "@mantine/core";
import { IconFile, IconFileText, IconX } from "@tabler/icons-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { v4 as uuidv4 } from "uuid";
import { FaStar } from "react-icons/fa";
import { Text } from "lucide-react";
import cctvPhoto from "../../../assets/images/ban1.png";
import NavPath from "../../../components/NavPath";
import {
  updateWaterTankData,
  waterTankEditData,
  waterTankFileDelete,
} from "../../../api/ME/WaterTank/watertank";
import type { FileItem, meWaterTankDataType } from "../../../utils/meDataUtil/metype";

const validators = {
  water_tank_date: "Date is required",
  water_tank_time: "Time is required",
  pump1_water_pressure: "Pump1 Water Pressure is required",
  pump2_water_pressure: "Pump2 Water Pressure is required",
  pressure_pump: "Pressure Pump is required",
  eva_pump1: "Evaporator Pump1 Water Pressure is required",
  eva_pump2: "Evaporator Pump2 Water Pressure is required",
  eva_water_pump: "Evaporator Water Pump is required",
  water_supply_pipe: "Water Supply Pipe is required",
  upper_tank_lower_tank: "Upper Tank Lower Tank is required",
  toilet_water_pressure: "Toilet Water Pressure is required",
};

const selectFields = [
  ["pump1_water_pressure", "Pump1 Water Pressure"],
  ["pump2_water_pressure", "Pump2 Water Pressure"],
  ["pressure_pump", "Pressure Pump"],
  ["eva_pump1", "Evaporator Pump1 Water Pressure"],
  ["eva_pump2", "Evaporator Pump2 Water Pressure"],
  ["eva_water_pump", "Evaporator Water Pump"],
  ["water_supply_pipe", "Water Supply Pipe"],
  ["upper_tank_lower_tank", "Upper Tank Lower Tank"],
  ["toilet_water_pressure", "Toilet Water Pressure"],
] as const;

const WaterTankEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const generalForm = location.state?.generalForm;

  const [existingFiles, setExistingFiles] = useState<FileItem[]>([]);
  const [invoiceFile, setInvoiceFile] = useState<FileItem[]>([
    { id: uuidv4(), file: null, preview: null, type: null, name: null },
  ]);
  const [form, setForm] = useState<meWaterTankDataType>({
    water_tank_date: "",
    water_tank_time: "",
    pump1_water_pressure: "",
    pump2_water_pressure: "",
    pressure_pump: "",
    eva_pump1: "",
    eva_pump2: "",
    eva_water_pump: "",
    water_supply_pipe: "",
    upper_tank_lower_tank: "",
    toilet_water_pressure: "",
    remark: "",
  });

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setLoading(true);
      try {
        const res = await waterTankEditData(token, id);
        const data = res?.editData ?? {};
        setForm({
          ...data,
          water_tank_time: data.water_tank_time?.slice(0, 5) ?? "",
        });
        setExistingFiles(res?.files ?? []);
      } catch (error) {
        console.error("WaterTankEdit error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addInvoiceFile = () => {
    setInvoiceFile((prev) => [
      ...prev,
      { id: uuidv4(), file: null, preview: null, type: null, name: null },
    ]);
  };

  const removeInvoiceFile = (fileId?: string | number) => {
    setInvoiceFile((prev) =>
      prev.filter((item) => {
        if (item.id === fileId && item.preview) {
          URL.revokeObjectURL(item.preview);
        }
        return item.id !== fileId;
      }),
    );
  };

  const updateFile = (fileId: string | number | undefined, file?: File) => {
    setInvoiceFile((prev) =>
      prev.map((item) => {
        if (item.id !== fileId) return item;
        if (item.preview) URL.revokeObjectURL(item.preview);
        if (!file) {
          return { ...item, file: null, preview: null, type: null, name: null };
        }

        const isImage = file.type.startsWith("image/");
        const isPdf = file.type === "application/pdf";

        return {
          ...item,
          file,
          name: file.name,
          type: isImage ? "image" : isPdf ? "pdf" : "other",
          preview: isImage || isPdf ? URL.createObjectURL(file) : null,
        };
      }),
    );
  };

  const handleCaptureChoice = (
    fileId: string | number | undefined,
    mode: "camera" | "gallery",
  ) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (mode === "camera") input.setAttribute("capture", "environment");
    input.onchange = (event: any) => {
      const file = event.target.files?.[0];
      if (file) updateFile(fileId, file);
    };
    input.click();
  };

  const deleteExistingFile = async (fileId?: string | number) => {
    if (!fileId) return;

    const confirm = await Swal.fire({
      title: "Delete file?",
      text: "Are you sure want to delete.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
    });
    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await waterTankFileDelete(token, fileId);
      setExistingFiles((prev) => prev.filter((file) => file.id !== fileId));
      Swal.fire({
        icon: "success",
        title: "Deleted",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire("Error", "Delete failed", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    const missingFields: string[] = [];
    const waterTankDate = formData.get("water_tank_date");

    if (waterTankDate && new Date(waterTankDate.toString()) > new Date()) {
      missingFields.push("Water Tank Date cannot be greater than today");
    }

    Object.entries(validators).forEach(([key, message]) => {
      const value = formData.get(key);
      if (!value || value.toString().trim() === "") {
        missingFields.push(message);
      }
    });

    if (!existingFiles.length && !invoiceFile.some((item) => item.file)) {
      missingFields.push("Upload file is required");
    }

    if (missingFields.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Required Fields Missing",
        html: `
          <ul style="text-align:left">
            ${missingFields.map((field) => `<li>• ${field}</li>`).join("")}
          </ul>
        `,
      });
      return;
    }

    invoiceFile.forEach((fileItem, index) => {
      if (fileItem.file) {
        formData.append(`file[${index}]`, fileItem.file);
      }
    });

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await updateWaterTankData(token, formData, id);
      sessionStorage.removeItem("watertank_cache");
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Water tank data updated successfully",
      });
      navigate(-1);
    } catch (error: any) {
      console.log("Full error:", error);
      Swal.fire({
        icon: "error",
        title: error?.response ? "Error" : "Network Error",
        text: error?.response
          ? "Something went wrong while saving data"
          : "Internet လိုင်းကိုတစ်ချက်လောက်ပြန်စစ်ပေးပါ။",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !form.id) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 relative">
      {loading && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
          <Loader size="xl" color="blue" />
        </div>
      )}

      <img
        src={cctvPhoto}
        className="w-full max-h-[260px] object-cover rounded-2xl shadow-lg"
        alt="Banner"
      />

      <NavPath
        segments={[
          { path: "/dashboard", label: "Home" },
          { path: "/dashboard", label: "Dashboard" },
          { path: "/water-tank/8", label: "Water Tank" },
        ]}
      />

      <form
        onSubmit={handleSubmit}
        className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-6"
      >
        <fieldset>
          <div className="absolute -inset-1 animate-liquid bg-gradient-to-r from-white/20 via-blue-200/20 to-purple-200/20 blur-2xl opacity-70" />
          <div className="absolute inset-0 rounded-3xl bg-white/5 pointer-events-none" />

          <div className="relative flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
              <div>
                <div className="flex items-center gap-2">
                  <label>Date</label>
                  <FaStar className="text-red-400" />
                </div>
                <input
                  required
                  name="water_tank_date"
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={form.water_tank_date ?? ""}
                  onChange={handleChange}
                  className="border focus:outline-blue p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                  style={{ borderColor: "rgb(29, 137, 225)" }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <label>Time</label>
                  <FaStar className="text-red-400" />
                </div>
                <input
                  type="time"
                  required
                  name="water_tank_time"
                  value={form.water_tank_time ?? ""}
                  onChange={handleChange}
                  className="border focus:outline-blue p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                  style={{ borderColor: "rgb(29, 137, 225)" }}
                />
              </div>
            </div>

                 <input
                type="hidden"
                name="general_form_id"
                id=""
                value={generalForm?.id}
              />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectFields.map(([name, label]) => (
                <div key={name}>
                  <div className="flex items-center gap-2">
                    <label>{label}</label>
                    <FaStar className="text-red-400" />
                  </div>
                  <select
                    name={name}
                    value={String(form[name] ?? "")}
                    onChange={handleChange}
                    className="border py-2 px-2 w-full rounded-md focus:outline-2 focus:outline-blue-400"
                    style={{ borderColor: "rgb(29, 137, 225)" }}
                  >
                    <option value="">Choose Option</option>
                    <option value="Checked">Check</option>
                    <option value="Not Check">Not Check</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <label>Remark</label>
                  <span className="text-xs font-mono text-gray-400">
                    {String(form.remark ?? "").length}/225
                  </span>
                </div>
                <textarea
                  name="remark"
                  value={form.remark ?? ""}
                  onChange={(e) => {
                    if (e.target.value.length <= 225) handleChange(e);
                  }}
                  maxLength={225}
                  rows={2}
                  className="border p-2 w-full rounded-md outline-none transition-all border-[rgb(29,137,225)] focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {existingFiles.length > 0 && (
              <div>
                <label className="font-medium">Existing Files</label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {existingFiles.map((file) => (
                    <div
                      key={file.id}
                      className="w-40 p-2 border rounded-md flex flex-col items-center gap-2"
                    >
                      {String(file.file_url).toLowerCase().endsWith(".pdf") ? (
                        <IconFile size={36} className="text-red-500" />
                      ) : (
                        <img
                          src={file.file_url}
                          alt={file.name ?? file.file_name ?? "Attached file"}
                          className="w-full h-24 object-cover rounded"
                        />
                      )}
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline truncate w-full text-center"
                      >
                        {file.name ?? file.file_name ?? "Open file"}
                      </a>
                      <Button
                        color="red"
                        size="xs"
                        onClick={() => deleteExistingFile(file.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="flex flex-col gap-2 w-full">
                {invoiceFile.map((fileField, index) => (
                  <div key={fileField.id} className="flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-2 min-h-6">
                      <label>
                        {index === 0 ? "Upload(Max uploads file 4)" : undefined}
                      </label>
                      {index === 0 && !existingFiles.length && (
                        <FaStar className="text-red-400" />
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        name="file[]"
                        onChange={(e) =>
                          updateFile(fileField.id, e.target.files?.[0])
                        }
                        className="hidden sm:hidden md:block flex-1 border p-2 w-full rounded-md focus:outline-2 focus:outline-blue-400"
                        style={{ borderColor: "rgb(29, 137, 225)" }}
                      />

                      <div className="flex-1 block md:hidden">
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <div
                              className="border p-2 w-full rounded-md cursor-pointer bg-white flex justify-between items-center text-sm"
                              style={{ borderColor: "rgb(29, 137, 225)" }}
                            >
                              {fileField.name ? (
                                <Text>{fileField.name}</Text>
                              ) : (
                                <Text color="dimmed">Tap to upload...</Text>
                              )}
                            </div>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Label>Choose Source</Menu.Label>
                            <Menu.Item
                              onClick={() =>
                                handleCaptureChoice(fileField.id, "camera")
                              }
                            >
                              Take Photo (Camera)
                            </Menu.Item>
                            <Menu.Item
                              onClick={() =>
                                handleCaptureChoice(fileField.id, "gallery")
                              }
                            >
                              Choose from Gallery
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </div>

                      {index === 0 && invoiceFile.length <= 3 ? (
                        <Button type="button" onClick={addInvoiceFile}>
                          Add
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          color="red"
                          onClick={() => removeInvoiceFile(fileField.id)}
                        >
                          <IconX size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap gap-3 mt-2">
                  {invoiceFile
                    .filter((file) => file.file)
                    .map((fileField) => (
                      <div
                        key={`preview-${fileField.id}`}
                        className="w-40 p-2 border rounded-md flex items-center justify-center"
                      >
                        {fileField.type === "image" && (
                          <a
                            href={fileField.preview ?? ""}
                            target="_blank"
                            rel="noreferrer"
                        >
                          <img
                            src={fileField.preview ?? ""}
                            alt="Preview"
                            className="w-40 object-cover rounded"
                          />
                        </a>
                      )}
                      {fileField.type === "pdf" && (
                        <a
                          href={fileField.preview ?? ""}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-1"
                        >
                          <IconFileText size={32} className="text-red-500" />
                          <span className="text-xs text-center break-all">
                            {fileField.name}
                          </span>
                        </a>
                      )}
                      {fileField.type === "other" && (
                        <div className="flex flex-col items-center gap-2 text-center">
                          <IconFile size={32} className="text-gray-500" />
                          <span className="text-xs break-all">
                            {fileField.name}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
            </div>

            <div className="flex lg:justify-center md:justify-center gap-4 lg:gap-12 md:gap-12 flex-wrap">
              <Button type="submit" disabled={loading} color="green" radius="md">
                {loading ? "Processing..." : "Update"}
              </Button>
              <Button
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading}
                color="red"
                radius="md"
              >
                {loading ? "Processing..." : "Cancel"}
              </Button>
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

export default WaterTankEdit;
