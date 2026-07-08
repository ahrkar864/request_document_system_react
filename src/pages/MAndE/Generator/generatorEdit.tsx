import React, { useEffect, useState } from "react";
import { Button, Menu } from "@mantine/core";
import {
  IconFileText,
  IconFile,
  IconX,
  IconPhoto,
  IconCamera,
} from "@tabler/icons-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import cctvPhoto from "../../../assets/images/ban1.png";
import NavPath from "../../../components/NavPath";
import axios from "axios";
import {
  generatorDataDetail,
  generatorFileDelete,
  getUpdateGeneratorData,
} from "../../../api/ME/Generator/generatos";
import type { InvoiceFile } from "../../../utils/requestDiscountUtil/create";
import { v4 as uuidv4 } from "uuid";
import { FaStar } from "react-icons/fa";
import FullPageLoader from "../../../components/FullPageLoader";
import { Check, FilesIcon, Text, Loader } from "lucide-react";
import type { FileItem, kvaData } from "../../../utils/meDataUtil/metype";

const GeneratorEdit: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const generalForm = location.state?.generalForm; // general_form_id
  // console.log("id>>", generalForm);
  const navigate = useNavigate();
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [invoiceFile, setInvoiceFile] = useState<FileItem[]>([
    { id: uuidv4(), file: null },
  ]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({
    generator_date: "",
    generator_time: "",
    // engine_oil_level: "",
    fuel_level: "",
    coolant_level: "",
    battery_volt_level: "",
    l1_level: "",
    l2_level: "",
    l3_level: "",
    // total_kw_level: "",
    voltagel_l_level: "",
    // load_level: "",
    running_hour: "",
    generator_service_date: "",
    generator_cleaning_level: "",
    remark: "",
    cost: "",
    generator_use: "",
  });
  const [remark, setRemark] = useState<string>("");
  const [kva, setKva] = useState<kvaData>();

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setLoading(true);
      try {
        const res = await generatorDataDetail(token, id);
        const data = res?.editData;
        setForm({
          ...data,
          generator_time: data.generator_time?.slice(0, 5),
          generator_use: data.generator_use || "use",
        });
        setRemark(data.remark || "");
        setExistingFiles(res?.files || []);
        setKva(res?.kvaData || "");
      } catch (error) {
        console.error("GeneratorDetail error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);
  const kvaData = (kva as kvaData[])?.map((item) => ({
    value: String(item.kva),
    label: String(item.kva),
  }));
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleLLevelChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    let newValue = value;

    // remove leading zeros (but allow single 0)
    if (value.length > 1 && value.startsWith("0")) {
      newValue = value.replace(/^0+/, "");
    }

    setForm((prev: any) => ({
      ...prev,
      [name]: newValue,
    }));
  };

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
  const removeInvoiceFile = (d: string | number | undefined) => {
    setInvoiceFile((prev) =>
      prev.filter((item) => {
        if (item.id === id && item.preview) {
          URL.revokeObjectURL(item.preview);
        }
        return item.id !== id;
      }),
    );
  };
  const updateFile = (
    id: string | number | undefined,
    file: File | undefined,
  ) => {
    setInvoiceFile((prev) =>
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
  const handleCaptureChoice = (
    id: string | number | undefined,
    mode: "camera" | "gallery",
  ) => {
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
  const deleteExistingFile = async (fileId: number) => {
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

      if (!token) throw new Error("No token");

      await generatorFileDelete(token, fileId);

      // remove from UI immediately
      setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));

      Swal.fire({
        icon: "success",
        title: "Deleted",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: "Something went wrong",
      });
    }
  };

  const validators = {
    generator_date: "Date is required",
    generator_time: "Time is required",
    // engine_oil_level: "Engine Oil % is required",
    // fuel_level: "Fuel % is required",
    coolant_level: "Coolant % is required",
    battery_volt_level: "Battery Volt is required",
    l1_level: "L1 is required",
    l2_level: "L2 is required",
    l3_level: "L3 is required",
    // total_kw_level: "Total KW is required",
    voltagel_l_level: "Voltagel-L is required",
    // load_level: "Load % is required",
    running_hour: "Running Hour is required",
    // generator_service_date: "Service Date is required",
    generator_cleaning_level: "Cleaning Level is required",
    gen_kva_level: "KVA Level is required",
    generator_size: "Generator size is required",
    engine_oil_level: "Engine Oil Level is required",
    // remark: "Remark is required",
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    const missingFields: string[] = [];
    const l1 = Number(formData.get("l1_level") || 0);
    const l2 = Number(formData.get("l2_level") || 0);
    const l3 = Number(formData.get("l3_level") || 0);
    if (form.generator_use === "use") {
      if (l1 === 0) missingFields.push("L1 must be greater than 0");
      if (l2 === 0) missingFields.push("L2 must be greater than 0");
      if (l3 === 0) missingFields.push("L3 must be greater than 0");
    }
    Object.entries(validators).forEach(([key, message]) => {
      if (
        form.generator_use === "no_use" &&
        ["l1_level", "l2_level", "l3_level"].includes(key)
      ) {
        return;
      }
      if (
        (!form.generator_service_date ||
          form.generator_service_date.trim() === "") &&
        key === "cost"
      ) {
        return;
      }

      const value = formData.get(key);
      if (!value || value.toString().trim() === "") {
        missingFields.push(message);
      }
    });
    const serviceDateValue = formData.get("generator_service_date");
    const remarkValue = formData.get("remark");

    if (
      serviceDateValue &&
      serviceDateValue.toString().trim() !== "" &&
      (!remarkValue || remarkValue.toString().trim() === "")
    ) {
      missingFields.push("Remark is required when Service Date is filled");
    }

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
    const percentFields: Record<string, string> = {
      // engine_oil_level: "Engine Oil %",
      // fuel_level: "Fuel %",
      coolant_level: "Coolant %",
      generator_cleaning_level: "Generator Cleaning",
      // load_level: "Load%",
    };

    const rangeErrors: string[] = [];

    Object.entries(percentFields).forEach(([field, label]) => {
      const value = Number(formData.get(field));

      if (isNaN(value) || value < 1 || value > 100) {
        rangeErrors.push(`${label} must be between 1 and 100`);
      }
    });

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
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      await getUpdateGeneratorData(token, formData, id);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Generator data stored successfully",
      });

      formElement.reset(); // optional
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
  const isAtLimit = remark.length === 225;

  const handleRemarkChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // setRemark(e.target.value);
    if (e.target.value.length <= 225) {
      setRemark(value);
      setForm((prev: any) => ({ ...prev, remark: value }));
    }
  };
  if (loading) return <>{loading && <FullPageLoader />}</>;

  return (
    <div className="p-6 space-y-6">
      <img
        src={cctvPhoto}
        className="w-full max-h-[260px] object-cover rounded-2xl shadow-lg"
        alt="Banner"
      />

      <NavPath
        segments={[
          { path: "/dashboard", label: "Home" },
          { path: "/generator", label: "Generator" },
          { path: `/me_generator_detail/${generalForm?.id}`, label: "Edit" },
        ]}
      />
      <div className="flex items-center gap-6 p-4 rounded-xl">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="generator_use"
            value="use"
            checked={form.generator_use === "use"}
            onChange={handleChange}
          />
          Generator Run
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="generator_use"
            value="no_use"
            checked={form.generator_use === "no_use"}
            onChange={handleChange}
          />
          Generator Not Run
        </label>
      </div>
      <form
        onSubmit={handleSubmit}
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
                name="generator_date"
                value={form.generator_date}
                type="date"
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(29, 137, 225)" }}
              />
              <input
                type="hidden"
                name="form_doc_no"
                id=""
                value={generalForm?.form_doc_no}
              />
              <input
                type="hidden"
                name="general_form_id"
                id=""
                value={generalForm?.id}
              />
              <input
                type="hidden"
                name="generator_use"
                value={form.generator_use == "use" ? "use" : "no_use"}
              />
            </div>

            <div className="">
              <div className="flex items-center gap-2">
                <label htmlFor="">Time</label>
                <span>
                  <FaStar className="text-red-400" />
                </span>
              </div>
              <input
                type="time"
                required
                name="generator_time"
                value={form.generator_time}
                onChange={handleChange}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(29, 137, 225)" }}
              />
            </div>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
            {/* Left Side Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
              {/* Engine Oil */}
              <div>
                <div className="flex items-center gap-2">
                  <label>Engine Oil Level</label>
                  <FaStar className="text-red-400" />
                </div>
                <select
                  name="engine_oil_level"
                  id=""
                  value={form.engine_oil_level}
                  onChange={(e: any) => handleChange(e)}
                  className="border py-3 px-2 w-full rounded-md focus:outline-2 focus:outline-blue-400"
                  style={{ borderColor: "rgb(29, 137, 225)" }}
                >
                  <option value="">Choose Level</option>
                  <option value="Good">Good</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Fuel */}
              <div>
                <div className="flex items-center gap-2">
                  <label>Fuel %</label>
                  {/* <FaStar className="text-red-400" /> */}
                </div>
                <input
                  type="number"
                  name="fuel_level"
                  required
                  min="1"
                  max="100"
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e") {
                      e.preventDefault();
                    }
                  }}
                  value={form.fuel_level}
                  onInput={(e: any) => {
                    let value = e.target.value;

                    if (value > 100) e.target.value = 100;
                    if (value < 1 && value !== "") e.target.value = 1;
                  }}
                  className="border p-2 w-full rounded-md focus:outline-2 focus:outline-blue-400"
                  style={{ borderColor: "rgb(29, 137, 225)" }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
              {/* Coolant */}
              <div>
                <div className="flex items-center gap-2">
                  <label>Coolant %</label>
                  <FaStar className="text-red-400" />
                </div>
                <input
                  type="number"
                  name="coolant_level"
                  value={form.coolant_level}
                  onChange={handleChange}
                  required
                  min="1"
                  max="100"
                  onKeyDown={(e) => {
                    if (["-", "e", "+"]?.includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onInput={(e: any) => {
                    let value = Number(e.target.value);
                    if (value > 100) e.target.value = 100;
                    if (value < 1 && e.target.value !== "") e.target.value = 1;
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="border p-2 w-full rounded-md focus:outline-2 focus:outline-blue-400"
                  style={{ borderColor: "rgb(29, 137, 225)" }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <label>Generator Size</label>
                  <FaStar className="text-red-400" />
                </div>
                <select
                  name="generator_size"
                  id=""
                  value={form.generator_size}
                  onChange={(e: any) => handleChange(e)}
                  className="border px-2 py-3 w-full rounded-md focus:outline-2 focus:outline-blue-400"
                  style={{ borderColor: "rgb(29, 137, 225)" }}
                >
                  <option value="">Choose Size</option>
                  <option value="Big">Big</option>
                  <option value="Small">Small</option>
                </select>
              </div>
            </div>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <label>KVA Level</label>
                  <FaStar className="text-red-400" />
                </div>
                <select
                  name="gen_kva_level"
                  id=""
                  value={form.gen_kva_level}
                  onChange={(e: any) => handleChange(e)}
                  className="border px-2 py-3 w-full rounded-md focus:outline-2 focus:outline-blue-400"
                  style={{ borderColor: "rgb(29, 137, 225)" }}
                >
                  <option value="">Choose Kva</option>
                  {/* <option value="550">550</option>
                  <option value="400">400</option>
                  <option value="375">375</option>
                  <option value="165">165</option>
                  <option value="150">150</option>
                  <option value="100">100</option>
                  <option value="80">80</option>
                  <option value="60">60</option>
                  <option value="30">30</option>
                  <option value="25">25</option> */}
                  {kvaData?.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="">
                <div className="flex items-center gap-2">
                  <label htmlFor="">Battery Volt</label>
                  <span>
                    <FaStar className="text-red-400" />
                  </span>
                </div>
                <input
                  type="text"
                  name="battery_volt_level"
                  value={form.battery_volt_level}
                  required
                  inputMode="decimal"
                  onChange={(e: any) => {
                    let value = e.target.value;

                    // Allow only numbers and dot
                    value = value.replace(/[^0-9.]/g, "");

                    // Split decimal
                    let parts = value.split(".");

                    // Prevent multiple decimals
                    if (parts.length > 2) {
                      parts = [parts[0], parts[1]];
                    }

                    // Limit 4 digits before decimal
                    if (parts[0].length > 6) {
                      parts[0] = parts[0].slice(0, 6);
                    }

                    // Limit 2 digits after decimal
                    if (parts[1]) {
                      parts[1] = parts[1].slice(0, 2);
                    }

                    const formattedValue = parts.join(".");

                    setForm((prev: any) => ({
                      ...prev,
                      battery_volt_level: formattedValue,
                    }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e") {
                      e.preventDefault();
                    }
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="border focus:outline-blue p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                  style={{ borderColor: "rgb(29, 137, 225)" }}
                />
              </div>
            </div>

            <div className="">
              <div className="flex items-center gap-2">
                <label htmlFor="">L1</label>
                <span>
                  <FaStar className="text-red-400" />
                </span>
              </div>
              <input
                type="number"
                name="l1_level"
                value={form.generator_use === "no_use" ? 0 : form.l1_level}
                disabled={form.generator_use === "no_use"}
                onChange={handleLLevelChange}
                required
                min="0"
                max="9999999"
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
                style={{
                  borderColor:
                    form.generator_use === "use"
                      ? "rgb(29, 137, 225)"
                      : "rgb(207, 209, 197)",
                }}
              />
            </div>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <div className="">
              <div className="flex items-center gap-2">
                <label htmlFor="">L2</label>
                <span>
                  <FaStar className="text-red-400" />
                </span>
              </div>
              <input
                type="number"
                name="l2_level"
                value={form.generator_use === "no_use" ? 0 : form.l2_level}
                disabled={form.generator_use === "no_use"}
                onChange={handleLLevelChange}
                min="0"
                max="9999999"
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
                required
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{
                  borderColor:
                    form.generator_use === "use"
                      ? "rgb(29, 137, 225)"
                      : "rgb(207, 209, 197)",
                }}
              />
            </div>
            <div className="">
              <div className="flex items-center gap-2">
                <label htmlFor="">L3</label>
                <span>
                  <FaStar className="text-red-400" />
                </span>
              </div>
              <input
                type="number"
                name="l3_level"
                value={form.generator_use === "no_use" ? 0 : form.l3_level}
                disabled={form.generator_use === "no_use"}
                onChange={handleLLevelChange}
                min="0"
                max="9999999"
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
                required
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{
                  borderColor:
                    form.generator_use === "use"
                      ? "rgb(29, 137, 225)"
                      : "rgb(207, 209, 197)",
                }}
              />
            </div>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <div className="">
              <div className="flex items-center gap-2">
                <label htmlFor="">VoltageL-L</label>
                <span>
                  <FaStar className="text-red-400" />
                </span>
              </div>
              <input
                type="text"
                name="voltagel_l_level"
                value={form.voltagel_l_level}
                required
                min="0"
                max="9999999"
                inputMode="decimal"
                onChange={(e: any) => {
                  let value = e.target.value;
                  value = value.replace(/[^0-9.]/g, "");

                  const parts = value.split(".");
                  if (parts.length > 2) return;
                  if (parts[0].length > 6) {
                    parts[0] = parts[0].slice(0, 6);
                  }
                  if (parts[1]) {
                    parts[1] = parts[1].slice(0, 2);
                  }

                  setForm((prev: any) => ({
                    ...prev,
                    voltagel_l_level: parts.join("."),
                  }));
                }}
                onKeyDown={(e: any) => {
                  if (e.key === "-" || e.key === "e") {
                    e.preventDefault();
                  }
                }}
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(29, 137, 225)" }}
              />
            </div>
            <div className="">
              <div className="flex items-center gap-2">
                <label htmlFor="">Running Hour</label>
                <span>
                  <FaStar className="text-red-400" />
                </span>
              </div>
              <input
                type="text"
                name="running_hour"
                required
                value={form.running_hour}
                inputMode="decimal"
                onChange={(e: any) => {
                  let value = e.target.value;

                  // Allow only numbers and dot
                  value = value.replace(/[^0-9.]/g, "");

                  const parts = value.split(".");

                  // Prevent multiple decimals
                  if (parts.length > 2) return;

                  // Limit 8 digits before decimal
                  if (parts[0].length > 6) {
                    parts[0] = parts[0].slice(0, 6);
                  }

                  // Limit 2 digits after decimal
                  if (parts[1]) {
                    parts[1] = parts[1].slice(0, 2);
                  }

                  setForm((prev: any) => ({
                    ...prev,
                    running_hour: parts.join("."),
                  }));
                }}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e") {
                    e.preventDefault();
                  }
                }}
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(29, 137, 225)" }}
              />
            </div>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <div className="">
              <div className="flex items-center gap-2">
                <label htmlFor="">Generator Cleaning%</label>
                <span>
                  <FaStar className="text-red-400" />
                </span>
              </div>
              <input
                type="number"
                name="generator_cleaning_level"
                value={form.generator_cleaning_level}
                onChange={handleChange}
                min="0"
                max="100"
                onKeyDown={(e: any) => {
                  if (e.key === "-" || e.key === "e") {
                    e.preventDefault();
                  }
                }}
                onInput={(e: any) => {
                  let value = e.target.value;

                  if (value > 100) e.target.value = 100;
                  if (value < 1 && value !== "") e.target.value = 1;
                }}
                required
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(29, 137, 225)" }}
              />
            </div>
            <div
              className={
                form.generator_service_date
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 items-center"
                  : ""
              }
            >
              <div className="">
                <label htmlFor=""> Service Date</label>
                <input
                  type="date"
                  name="generator_service_date"
                  onChange={handleChange}
                  value={form.generator_service_date}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                  style={{ borderColor: "rgb(29, 137, 225)" }}
                />
              </div>
              {form.generator_service_date && (
                <div className="">
                  <label htmlFor=""> Cost</label>
                  <input
                    type="text"
                    name="cost"
                    required
                    value={form.cost}
                    inputMode="decimal"
                    onChange={(e: any) => {
                      let value = e.target.value;

                      // Allow only numbers and dot
                      value = value.replace(/[^0-9.]/g, "");

                      const parts = value.split(".");

                      // Prevent multiple decimals
                      if (parts.length > 2) return;

                      // Limit 8 digits before decimal
                      if (parts[0].length > 8) {
                        parts[0] = parts[0].slice(0, 8);
                      }

                      // Limit 2 digits after decimal
                      if (parts[1]) {
                        parts[1] = parts[1].slice(0, 2);
                      }

                      setForm((prev: any) => ({
                        ...prev,
                        cost: parts.join("."),
                      }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e") {
                        e.preventDefault();
                      }
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="border focus:outline-blue p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                    style={{ borderColor: "rgb(29, 137, 225)" }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <div className="">
              <label htmlFor=""> Remark</label>
              <textarea
                name="remark"
                value={form.value}
                onChange={handleRemarkChange}
                id=""
                // cols="3"
                // rows="2"
                maxLength={225}
                className={`border p-2 w-full rounded-md outline-none transition-all 
      ${
        isAtLimit
          ? "border-orange-500 focus:ring-1 focus:ring-orange-500"
          : "border-[rgb(29,137,225)] focus:ring-2 focus:ring-blue-400"
      }`}
                style={{ borderColor: "rgb(29, 137, 225)" }}
              >
                {form.remark}
              </textarea>
              <div className="flex justify-between mt-1 px-1">
                <div className="h-4">
                  {isAtLimit && (
                    <span className="text-orange-600 text-xs font-semibold animate-pulse">
                      Maximum limit of 225 characters reached.
                    </span>
                  )}
                </div>

                <span
                  className={`text-xs font-mono ${remark?.length === 225 ? "text-orange-600 font-bold" : "text-gray-400"}`}
                >
                  {remark?.length}/225
                </span>
              </div>
            </div>
            <div className="">
              {invoiceFile.map((fileField, index) => (
                <div key={fileField.id} className="flex flex-col gap-2 w-full">
                  <label>
                    {index === 0 ? "Upload(Max uploads file 4)" : undefined}
                  </label>

                  <div className="flex items-center gap-3">
                    {/* MD + LG INPUT */}
                    <input
                      type="file"
                      name="file[]"
                      onChange={(e: any) =>
                        updateFile(fileField?.id, e.target.files?.[0] || null)
                      }
                      className="hidden md:block flex-1 border p-2 w-full rounded-md focus:outline-2 focus:outline-blue-400"
                      style={{ borderColor: "rgb(213, 216, 221)" }}
                    />

                    {/* SM MENU SELECTOR */}
                    <div className="flex-1 md:hidden">
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <div
                            className="border p-2 w-full rounded-md cursor-pointer bg-white flex justify-between items-center text-sm"
                            style={{ borderColor: "rgb(213, 216, 221)" }}
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

                    {/* ADD / REMOVE BUTTON */}
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
                  .map((fileField) => (
                    <div
                      key={`preview-${fileField.id}`}
                      className="w-40 p-2 border rounded-md flex items-center justify-center"
                    >
                      {/* IMAGE */}
                      {fileField.type === "image" && (
                        <a
                          href={fileField.preview ?? ""}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={fileField.preview ?? ""}
                            alt="Preview"
                            className="w-40  object-cover rounded"
                          />
                        </a>
                      )}

                      {/* PDF */}
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
            {existingFiles.length > 0 && (
              <div className="mt-8">
                <h4 className="font-semibold text-gray-700 mb-4">
                  Existing Files
                </h4>

                <div className="flex flex-justify flex-wrap items-center gap-4">
                  {existingFiles.map((file, i) => {
                    const isPDF = file.file_url.toLowerCase().endsWith(".pdf");

                    return (
                      <div
                        key={i}
                        className=" w-36 relative border rounded-xl overflow-hidden bg-white shadow-sm"
                      >
                        {/* Delete Button (ALWAYS VISIBLE) */}
                        <button
                          type="button"
                          onClick={() => deleteExistingFile(file.id)}
                          className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm shadow"
                        >
                          ✕
                        </button>

                        {/* Preview */}
                        <div className="w-36 h-36 flex items-center justify-center bg-gray-50">
                          {isPDF ? (
                            <IconFile size={50} className="text-red-500" />
                          ) : (
                            <img
                              src={file.file_url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        {/* File Name */}
                        <div className="p-2 text-center">
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 truncate block"
                            title={file.name}
                          >
                            {file.name}
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex lg:justify-center md:justify-center  gap-4 lg:gap-12 md:gap-12 flex-wrap">
            <Button
              type="submit"
              loading={loading}
              // variant="gradient"
              // gradient={{ from: "green", to: "violet", deg: 90 }}
              color="blue"
              radius="md"
              size="md"
            >
              Update
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
      </form>
    </div>
  );
};

export default GeneratorEdit;
