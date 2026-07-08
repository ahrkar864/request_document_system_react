import { Button, Loader, Checkbox, Menu } from "@mantine/core";
import {
  IconCalendar,
  IconCamera,
  IconClock,
  IconFile,
  IconFileText,
  IconPhoto,
  IconX,
} from "@tabler/icons-react";
import React, { useEffect, useRef, useState } from "react";
import cctvPhoto from "../../../assets/images/ban1.png";
import NavPath from "../../../components/NavPath";
import { Text } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import type { FileItem } from "../../../utils/meDataUtil/metype";
import Swal from "sweetalert2";
import { useLocation, useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import { getPanelData, storePanelData } from "../../../api/ME/panel/panel";

const panelCreate: React.FC = () => {
  type LevelType = {
    l1Value: number | "";
    l2Value: number | "";
    l3Value: number | "";
  };
  const location = useLocation();
  const { formId } = location.state || "";
  const { reAdd } = location.state || "";
  const { panelFormId } = location.state || "";
  const [panelUse, setPanelUse] = useState<string>("use");
  const [levelValue, setLevelValue] = useState<LevelType>({
    l1Value: "",
    l2Value: "",
    l3Value: "",
  });

  const [remark, setRemark] = useState<string>("");
  const [invoiceFile, setInvoiceFile] = useState<FileItem[]>([
    { id: uuidv4(), file: null },
  ]);
  const [loading, setLoading] = useState<boolean>(false);

  const addInvoiceFile = () => {
    setInvoiceFile((prev) => [
      ...prev,
      {
        id: Date.now(),
        file: null,
        preview: null,
        type: null,
        name: null,
      },
    ]);
  };
  const removeInvoiceFile = (id: any) => {
    setInvoiceFile((prev) =>
      prev.filter((item) => {
        if (item.id === id && item.preview) {
          URL.revokeObjectURL(item.preview);
        }
        return item.id !== id;
      }),
    );
  };
  const updateFile = (id: any, file: File | null): void => {
    setInvoiceFile((prev: FileItem[]) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (item.preview) URL.revokeObjectURL(item.preview);

        if (!file) {
          return { ...item, file: null, preview: null, type: null, name: null };
        }

        const fileType = file.type;
        const isImage = fileType.startsWith("image/");
        const isPdf = fileType === "application/pdf";

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

  const validators = {
    panel_date: "Date is required",
    panel_time: "Time is required",
    l1_level: "L1 is required",
    l2_level: "L2 is required",
    l3_level: "L3 is required",
    breaker_temperature: "Breaker Temperature is required",
    total_load_kw_use: "Total Load Kw Use is required",
    voltagel_l_level: "Voltage l-L is required",
    panel_cleaning_maintenance: "Panel Cleaning Maintenance is required",
    breaker_maintenance: "Breaker Maintenance is required",
    lighting_maintenance: "Lighting Power Source Maintenance is required",
    led_light_box_power: "LED Light Box Power is required",
  };

  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };
  const isAtLimit = remark.length === 225;
  const handleRemarkChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 225) {
      setRemark(e.target.value);
    }
  };
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    btnStatus: string,
  ) => {
    e.preventDefault();
    if (btnStatus == "Ongoing") {
      const confirmBox = await Swal.fire({
        title: "Are you sure",
        text: "Sent To Manager?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "rgb(29, 95, 219)",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      });
      if (!confirmBox.isConfirmed) return;
    }
    const formElement = document.querySelector("form") as HTMLFormElement;
    const formData = new FormData(formElement);
    const missingFields: string[] = [];
    formData.append("btn_status", btnStatus);

    const l1 = Number(formData.get("l1_level") || 0);
    const l2 = Number(formData.get("l2_level") || 0);
    const l3 = Number(formData.get("l3_level") || 0);
    const breakerTemperature = Number(formData.get("breaker_temperature") || 0);
    const totalLoadKwUse = Number(formData.get("total_load_kw_use") || 0);
    const voltageLL = Number(formData.get("voltagel_l_level") || 0);
    if (panelUse === "use") {
      if (l1 === 0) missingFields.push("L1 must be greater than 0");
      if (l2 === 0) missingFields.push("L2 must be greater than 0");
      if (l3 === 0) missingFields.push("L3 must be greater than 0");
      if (breakerTemperature === 0)
        missingFields.push("Breaker Temperature must be greater than 0");

      if (totalLoadKwUse === 0)
        missingFields.push("total load kw use must be greater than 0");

      if (voltageLL === 0)
        missingFields.push("Voltage L-L must be greater than 0");
    }

    const panelDate = formData.get("panel_date");

    if (panelDate) {
      const selectedDate = new Date(panelDate.toString());
      const today = new Date();

      if (selectedDate > today) {
        missingFields.push("Panel Date cannot be greater than today");
      }
    }
    Object.entries(validators).forEach(([key, message]) => {
      if (
        panelUse === "no_use" &&
        ["l1_level", "l2_level", "l3_level"].includes(key)
      ) {
        return;
      }

      const value = formData.get(key);

      if (!value || value.toString().trim() === "") {
        missingFields.push(message);
      }
    });
    if (!invoiceFile[0]?.file) {
      missingFields.push("Upload file is required");
    }

    const remarkValue = formData.get("remark");

    if (missingFields.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Required Fields Missing",
        html: `
        <ul style="text-align:left">
          ${missingFields.map((f) => `<li>• ${f}</li>`).join("")}
        </ul>
      `,
      });
      return;
    }

    const rangeErrors: string[] = [];

    if (rangeErrors.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Value",
        html: `
      <ul style="text-align:left">
        ${rangeErrors.map((e) => `<li>• ${e}</li>`).join("")}
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
    console.log("Form Data123445", formData);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      await storePanelData(token, formData);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: " data stored successfully",
      });

      formElement.reset();
      navigate(-1);
    } catch (error: any) {
      console.log("Full error:", error);

      if (!error?.response) {
        Swal.fire({
          icon: "error",
          title: "Network Error",
          text: "Internet လိုင်းကိုတစ်ချက်လောက်ပြန်စစ်ပေးပါ။",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            "Something went wrong while saving data",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureChoice = (id: any, mode: "camera" | "gallery") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    if (mode === "camera") {
      // This attribute forces mobile browsers to open the camera app
      input.setAttribute("capture", "environment");
    }

    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        updateFile(id, file);
      }
    };

    input.click();
  };

  const FullPageLoader = () => (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
      <Loader size="xl" color="blue" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 relative">
      {loading && <FullPageLoader />}
      {/* Header Image */}
      <img
        src={cctvPhoto}
        className="w-full max-h-[260px] object-cover rounded-2xl shadow-lg"
        alt="Banner"
      />

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <NavPath
          segments={[
            { path: "/dashboard", label: "Home" },
            { path: "/dashboard", label: "Dashboard" },
            { path: `/panel/${formId}`, label: "Panel" },
          ]}
        />
      </div>
      {/* <div className="flex items-center gap-6 p-4 rounded-xl">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="use"
            checked={panelUse === "use"}
            onChange={(e) => setPanelUse(e.target.value)}
          />
          Panel Run
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="no_use"
            checked={panelUse === "no_use"}
            onChange={(e) => setPanelUse(e.target.value)}
          />
          Panel Not Run
        </label>
      </div> */}

      <form
        onSubmit={(e) => handleSubmit(e, "Default")}
        className=" 
          relative
          overflow-hidden
          rounded-3xl
          border border-white/20
          bg-white/10
          backdrop-blur-xl
          shadow-[0_20px_60px_rgba(0,0,0,0.15)]
          p-6
        "
      >
        <fieldset disabled={!panelUse}>
          {/* Liquid light flow */}
          <div className="absolute -inset-1 animate-liquid bg-gradient-to-r from-white/20 via-blue-200/20 to-purple-200/20 blur-2xl opacity-70" />

          {/* Glass noise layer */}
          <div className="absolute inset-0 rounded-3xl bg-white/5 pointer-events-none" />

          <div className="flex flex-justify flex-col gap-4">
            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
              <div className="">
                <div className="flex items-center gap-2">
                  <label htmlFor="">Date</label>
                  <span>
                    <FaStar className="text-red-400" />
                  </span>
                </div>
                <input
                  required
                  name="panel_date"
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                  style={{ borderColor: "rgb(29, 137, 225)" }}
                />
                <input type="hidden" name="sub_form_id" value={formId} />
                <input
                  type="hidden"
                  name="reAdd"
                  value={reAdd == true ? "reAdd" : ""}
                />
                <input type="hidden" name="panelFormId" value={panelFormId} />
                <input
                  type="hidden"
                  name="panel_use"
                  value={panelUse == "use" ? "use" : "no_use"}
                />
              </div>

              <div className="panel-time">
                <div className="flex items-center gap-2">
                  <label htmlFor="">Time</label>
                  <span>
                    <FaStar className="text-red-400" />
                  </span>
                </div>
                <input
                  type="time"
                  required
                  name="panel_time"
                  className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                  style={{ borderColor: "rgb(29, 137, 225)" }}
                />
              </div>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
              <div className="l1-level">
                <div className="flex items-center gap-2">
                  <label htmlFor="">L1</label>
                  <span>
                    <FaStar className="text-red-400" />
                  </span>
                </div>
                <input
                  type="number"
                  name="l1_level"
                  min="1"
                  max="9999"
                  value={panelUse === "no_use" ? 0 : levelValue.l1Value}
                  disabled={panelUse === "no_use"}
                  required={panelUse == "use"}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val.length > 1 && val.startsWith("0")) {
                      val = val.replace(/^0+/, "");
                    }
                    if (val.length <= 6) {
                      setLevelValue((prev) => ({
                        ...prev,
                        l1Value: val === "" ? "" : Number(val),
                      }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e") {
                      e.preventDefault();
                    }
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                  style={{
                    borderColor:
                      panelUse === "use"
                        ? "rgb(29, 137, 225)"
                        : "rgb(207, 209, 197)",
                  }}
                />
              </div>
              <div className="l2-level">
                <div className="flex items-center gap-2">
                  <label htmlFor="">L2</label>
                  <span>
                    <FaStar className="text-red-400" />
                  </span>
                </div>
                <input
                  type="number"
                  name="l2_level"
                  min="0"
                  max="9999"
                  value={panelUse === "no_use" ? 0 : levelValue.l2Value}
                  disabled={panelUse === "no_use"}
                  required={panelUse == "use"}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val.length > 1 && val.startsWith("0")) {
                      val = val.replace(/^0+/, "");
                    }
                    if (val.length <= 6) {
                      setLevelValue((prev) => ({
                        ...prev,
                        l2Value: val === "" ? "" : Number(val),
                      }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e") {
                      e.preventDefault();
                    }
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                  style={{
                    borderColor:
                      panelUse === "use"
                        ? "rgb(29, 137, 225)"
                        : "rgb(207, 209, 197)",
                  }}
                />
              </div>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                <div className="l3-level">
                  <div className="flex items-center gap-2">
                    <label htmlFor="">L3</label>
                    <span>
                      <FaStar className="text-red-400" />
                    </span>
                  </div>
                  <input
                    type="number"
                    name="l3_level"
                    min="0"
                    max="9999"
                    value={panelUse === "no_use" ? 0 : levelValue.l3Value}
                    disabled={panelUse === "no_use"}
                    required={panelUse == "use"}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val.length > 1 && val.startsWith("0")) {
                        val = val.replace(/^0+/, "");
                      }
                      if (val.length <= 6) {
                        setLevelValue((prev) => ({
                          ...prev,
                          l3Value: val === "" ? "" : Number(val),
                        }));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e") {
                        e.preventDefault();
                      }
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                    style={{
                      borderColor:
                        panelUse === "use"
                          ? "rgb(29, 137, 225)"
                          : "rgb(207, 209, 197)",
                    }}
                  />
                </div>

                <div className="breaker-temperature">
                  <div className="flex items-center gap-2">
                    <label htmlFor="">Breaker Tempeature</label>
                    <span>
                      <FaStar className="text-red-400" />
                    </span>
                  </div>
                  <input
                    type="number"
                    name="breaker_temperature"
                    required
                    min="0"
                    max="9999"
                    onInput={(e: any) => {
                      if (e.target.value.length > 6) {
                        e.target.value = e.target.value.slice(0, 6);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e") {
                        e.preventDefault();
                      }
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                    style={{ borderColor: "rgb(29, 137, 225)" }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                <div className="">
                  <div className="flex items-center gap-2">
                    <label htmlFor="">Total Load Kw Use</label>
                    <span>
                      <FaStar className="text-red-400" />
                    </span>
                  </div>
                  <input
                    type="number"
                    name="total_load_kw_use"
                    placeholder="Enter total load Kw use for 1 day "
                    required
                    min="0"
                    max="9999"
                    onInput={(e: any) => {
                      if (e.target.value.length > 6) {
                        e.target.value = e.target.value.slice(0, 6);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e") {
                        e.preventDefault();
                      }
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                    style={{ borderColor: "rgb(29, 137, 225)" }}
                  />
                </div>

                <div className="voltage-l-l">
                  <div className="flex items-center gap-2">
                    <label htmlFor="">VoltageL-L</label>
                    <span>
                      <FaStar className="text-red-400" />
                    </span>
                  </div>
                  <input
                    type="number"
                    name="voltagel_l_level"
                    placeholder="Enter VoltageL"
                    required
                    min="0"
                    max="9999"
                    onInput={(e: any) => {
                      if (e.target.value.length > 6) {
                        e.target.value = e.target.value.slice(0, 6);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e") {
                        e.preventDefault();
                      }
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                    style={{ borderColor: "rgb(29, 137, 225)" }}
                  />
                </div>
              </div>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                <div className="panel-cleaning-maintenance">
                  <div className="flex items-center gap-2">
                    <label htmlFor="">Panel Cleaning Maintenance</label>
                    <span>
                      <FaStar className="text-red-400" />
                    </span>
                  </div>

                  <select
                    name="panel_cleaning_maintenance"
                    id=""
                    className="border py-2 px-2 w-full rounded-md focus:outline-2 focus:outline-blue-400"
                    style={{ borderColor: "rgb(29, 137, 225)" }}
                  >
                    <option value="">Choose Option</option>
                    <option value="Checked">Check</option>
                    <option value="Not Check">Not Check</option>
                  </select>
                </div>

                <div className="breaker-maintenance">
                  <div className="flex items-center gap-2">
                    <label htmlFor="">Breaker Maintenance</label>
                    <span>
                      <FaStar className="text-red-400" />
                    </span>
                  </div>
                  <select
                    name="breaker_maintenance"
                    id=""
                    className="border py-2 px-2 w-full rounded-md focus:outline-2 focus:outline-blue-400"
                    style={{ borderColor: "rgb(29, 137, 225)" }}
                  >
                    <option value="">Choose Option</option>
                    <option value="Checked">Check</option>
                    <option value="Not Check">Not Check</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                <div className="lighting-power-source-maintenance">
                  <div className="flex items-center gap-2">
                    <label htmlFor="">
                      Lighting & Power Source Maintenance
                    </label>
                    <span>
                      <FaStar className="text-red-400" />
                    </span>
                  </div>
                  <select
                    name="lighting_maintenance"
                    id=""
                    className="border py-2 px-2 w-full rounded-md focus:outline-2 focus:outline-blue-400"
                    style={{ borderColor: "rgb(29, 137, 225)" }}
                  >
                    <option value="">Choose Option</option>
                    <option value="Checked">Check</option>
                    <option value="Not Check">Not Check</option>
                  </select>
                </div>

                <div className="led-light-box-power">
                  <div className="flex items-center gap-2">
                    <label htmlFor="">LED Light Box Power</label>
                    <span>
                      <FaStar className="text-red-400" />
                    </span>
                  </div>
                  <select
                    name="led_light_box_power"
                    id=""
                    className="border py-2 px-2 w-full rounded-md focus:outline-2 focus:outline-blue-400"
                    style={{ borderColor: "rgb(29, 137, 225)" }}
                  >
                    <option value="">Choose Option</option>
                    <option value="Checked">Check</option>
                    <option value="Not Check">Not Check</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
              <div className="remark">
                <div className="flex items-center gap-2">
                  <label htmlFor=""> Remark</label>
                  <span
                    className={`text-xs font-mono ${isAtLimit ? "text-orange-600 font-bold" : "text-gray-400"}`}
                  >
                    {remark.length}/{225}
                  </span>
                </div>

                <textarea
                  name="remark"
                  value={remark}
                  onChange={handleRemarkChange}
                  maxLength={225}
                  rows={1}
                  className={`border p-2 w-full rounded-md outline-none transition-all 
                      ${
                        isAtLimit
                          ? "border-orange-500 focus:ring-1 focus:ring-orange-500"
                          : "border-[rgb(29,137,225)] focus:ring-2 focus:ring-blue-400"
                      }`}
                ></textarea>
                {isAtLimit && (
                  <span className="text-orange-600 text-xs font-semibold">
                    Maximum limit of {225} characters reached.
                  </span>
                )}
                {/* <div className="flex justify-between mt-1 px-1">
                  <div className="h-4">
                    {isAtLimit && (
                      <span className="text-orange-600 text-xs font-semibold">
                        Maximum limit of {225} characters reached.
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-xs font-mono ${isAtLimit ? "text-orange-600 font-bold" : "text-gray-400"}`}
                  >
                    {remark.length}/{225}
                  </span>
                </div> */}
              </div>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
              <div className="">
                {invoiceFile.map((fileField: FileItem, index: number) => (
                  <div
                    key={fileField.id}
                    className="flex flex-col gap-2 w-full"
                  >
                    <div className="flex items-center gap-2">
                      <label>
                        {index === 0 ? "Upload(Max uploads file 4)" : undefined}
                      </label>
                      <span>
                        {index === 0 && <FaStar className="text-red-400" />}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* MD + LG FILE INPUT */}
                      <input
                        type="file"
                        name="file[]"
                        required
                        onChange={(e: any) =>
                          updateFile(fileField.id, e.target.files?.[0] || null)
                        }
                        className="hidden sm:hidden md:block flex-1 border p-2 w-full rounded-md focus:outline-2 focus:outline-blue-400"
                        style={{ borderColor: "rgb(29, 137, 225)" }}
                      />

                      {/* SM MENU UPLOAD */}
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
                              // icon={<IconCamera size={16} />}
                              onClick={() =>
                                handleCaptureChoice(fileField.id, "camera")
                              }
                            >
                              Take Photo (Camera)
                            </Menu.Item>

                            <Menu.Item
                              // icon={<IconPhoto size={16} />}
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
                        <Button onClick={addInvoiceFile}>Add</Button>
                      ) : (
                        <Button
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
                    .filter((f) => f.file)
                    .map((fileField: any) => (
                      <div
                        key={`preview-${fileField.id}`}
                        className="w-40 p-2 border rounded-md flex items-center justify-center"
                      >
                        {/* IMAGE */}
                        {fileField.type === "image" && (
                          <a
                            href={fileField.preview}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img
                              src={fileField.preview}
                              alt="Preview"
                              className="w-40  object-cover rounded"
                            />
                          </a>
                        )}

                        {/* PDF */}
                        {fileField.type === "pdf" && (
                          <a
                            href={fileField.preview}
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

                        {/* OTHER FILE */}
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

            {reAdd == true ? (
              <div className="flex lg:justify-center md:justify-center  gap-4 lg:gap-12 md:gap-12 flex-wrap">
                <Button
                  type="button"
                  onClick={(e: any) => handleSubmit(e, "Default")}
                  disabled={loading}
                  color="green"
                  radius="md"
                >
                  {loading ? "Processing..." : "Submit"}
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
            ) : (
              <div className="flex lg:justify-center md:justify-center  gap-4 lg:gap-12 md:gap-12 flex-wrap">
                <Button
                  type="button"
                  onClick={(e: any) => handleSubmit(e, "Default")}
                  disabled={loading}
                  color="green"
                  radius="md"
                >
                  {loading ? "Processing..." : "Save as Draft"}
                </Button>

                <Button
                  type="button"
                  onClick={(e: any) => handleSubmit(e, "Ongoing")}
                  disabled={loading}
                  color="blue"
                  radius="md"
                >
                  {loading ? "Processing..." : "Send to Manager"}
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
            )}
          </div>
        </fieldset>
      </form>
    </div>
  );
};

export default panelCreate;
