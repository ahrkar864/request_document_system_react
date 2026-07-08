import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
  type kvaData,
  type FileItem,
  type meTransDataType,
  type TransformerEditResponse,
} from "../../../utils/meDataUtil/metype";
import {
  getUpdateTransformerData,
  transformerDelete,
  transformerEditData,
  transformerFileDelete,
} from "../../../api/ME/Transformer/transformer";
import Swal from "sweetalert2";
import FullPageLoader from "../../../components/FullPageLoader";
import { Button, Menu, Text } from "@mantine/core";
import { FaStar } from "react-icons/fa";
import cctvPhoto from "../../../assets/images/ban1.png";
import NavPath from "../../../components/NavPath";
import { fetchData } from "../../../api/FetchApi";
import { IconFile, IconFileText, IconX } from "@tabler/icons-react";

const TransformerEdit: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const generalForm = location.state?.generalForm;
  const [invoiceFile, setInvoiceFile] = useState<FileItem[]>([
    { id: uuidv4(), file: null },
  ]);
  const [kva, setKva] = useState<kvaData>();
  const [loading, setLoading] = useState<boolean>(false);
  const [form, setForm] = useState<meTransDataType>({
    trans_date: "",
    trans_time: "",
    meter_unit: "",
    tran_kva_level: 0,
    voltagel_l_level: 0,
    tran_size: "",
    l1_level: 0,
    l2_level: 0,
    l3_level: 0,
    oltc_tapping: 0,
    cost: 0,
    trans_service_date: "",
    remark: "",
  });
  const [remark, setRemark] = useState<string>("");
  const [existingFiles, setExistingFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      setLoading(true);
      try {
        const res = await transformerEditData(token, id);
        console.log("ExistingFiles>>", res);
        const data = res?.editData;
        setForm({
          ...data,
          trans_time: data?.trans_time ? data.trans_time.slice(0, 5) : "",
          trans_use: data?.trans_use ?? "use",
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
  }, []);

  const kvaData = (kva as kvaData[])?.map((item) => ({
    value: String(item.kva),
    label: String(item.kva),
  }));
  const navigate = useNavigate();

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

  const removeInvoiceFile = (id: string | number | undefined) => {
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
      input.setAttribute("capture", "environment");
    }
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        updateFile(id, file);
      }
    };
    input.click();
  };
  const deleteExistingFile = async (fileId: number | string | undefined) => {
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
      await transformerFileDelete(token, fileId);
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
    trans_date: "Date is required",
    trans_time: "Time is required",
    meter_unit: "Meter Unit is required",
    tran_kva_level: "KVA Level is required",
    voltagel_l_level: "Voltage l-L is required",
    tran_size: "Transformer Size is required",
    l1_level: "L1 is required",
    l2_level: "L2 is required",
    l3_level: "L3 is required",

    oltc_tapping: "OLTC Tapping is required",
    cost: "Cost is required",
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    const missingFields: string[] = [];
    const meterUnit = Number(formData.get("meter_unit") || 0);
    const OLTCTipping = Number(formData.get("oltc_tapping") || 0);
    const l1 = Number(formData.get("l1_level") || 0);
    const l2 = Number(formData.get("l2_level") || 0);
    const l3 = Number(formData.get("l3_level") || 0);
    if (form.trans_use === "use") {
      if (meterUnit === 0)
        missingFields.push("Meter Units must be greater than 0");

      if (l1 === 0) missingFields.push("L1 must be greater than 0");
      if (l2 === 0) missingFields.push("L2 must be greater than 0");
      if (l3 === 0) missingFields.push("L3 must be greater than 0");
      if (OLTCTipping === 0)
        missingFields.push("OLTC Tapping must be greater than 0");
    }
    const transDate = form.trans_date;

    if (transDate) {
      const selectedDate = new Date(transDate.toString());
      const today = new Date();
      // today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        missingFields.push("Transformer Date cannot be greater than today");
      }
    }
    Object.entries(validators).forEach(([key, message]) => {
      if (
        form.trans_use === "no_use" &&
        ["l1_level", "l2_level", "l3_level"].includes(key)
      ) {
        return;
      }
      if (
        (!form.trans_service_date || form.trans_service_date.trim() == "") &&
        key === "cost"
      ) {
        return;
      }
      const value = formData.get(key);
      if (key === "cost") {
        if (!value || value.toString().trim() === "") {
          missingFields.push("Cost is required");
        } else {
          const cost = Number(value);
          if (cost === 0) {
            missingFields.push("Cost must be greater than 0");
          }
        }
        return;
      }
      if (!value || value.toString().trim() === "") {
        missingFields.push(message);
      }
    });
    const serviceDateValue = formData.get("trans_service_date");
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
    invoiceFile.forEach((fileItem, index) => {
      if (fileItem.file) {
        formData.append(`file[${index}]`, fileItem.file);
      }
    });
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await getUpdateTransformerData(token, formData, id);
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
            name="trans_use"
            value="use"
            checked={form.trans_use === "use"}
            onChange={handleChange}
          />
          Transformer Run
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="trans_use"
            value="no_use"
            checked={form.trans_use === "no_use"}
            onChange={handleChange}
          />
          Transformer Not Run
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
                name="trans_date"
                value={form.trans_date}
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
                name="trans_use"
                value={form.trans_use == "use" ? "use" : "no_use"}
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
                name="trans_time"
                onChange={handleChange}
                value={form.trans_time}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(29, 137, 225)" }}
              />
            </div>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
              <div className="">
                <div className="flex items-center gap-2">
                  <label htmlFor="">Meter Units</label>
                  <span>
                    <FaStar className="text-red-400" />
                  </span>
                </div>
                <input
                  type="text"
                  name="meter_unit"
                  value={form.meter_unit}
                  required
                  min="0"
                  max="999999"
                  inputMode="decimal"
                  onChange={(e: any) => {
                    let value = e.target.value;
                    value = value.replace(/[^0-9.]/g, "");

                    const parts = value.split(".");
                    if (parts.length > 2) return;
                    if (parts[0].length > 8) {
                      parts[0] = parts[0].slice(0, 8);
                    }
                    if (parts[1]) {
                      parts[1] = parts[1].slice(0, 2);
                    }

                    setForm((prev: any) => ({
                      ...prev,
                      meter_unit: parts.join("."),
                    }));
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
              <div>
                <div className="flex items-center gap-2">
                  <label>KVA Level</label>
                  <FaStar className="text-red-400" />
                </div>
                <select
                  name="tran_kva_level"
                  value={form?.tran_kva_level}
                  id=""
                  onChange={(e: any) => handleChange(e)}
                  className="border px-2 py-3 w-full rounded-md focus:outline-2 focus:outline-blue-400"
                  style={{ borderColor: "rgb(29, 137, 225)" }}
                >
                  <option value="">Choose Kva</option>
                  {kvaData?.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
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
                  value={form?.voltagel_l_level}
                  required
                  min="0"
                  max="999999"
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
              <div>
                <div className="flex items-center gap-2">
                  <label>Transformer Size</label>
                  <FaStar className="text-red-400" />
                </div>
                <select
                  name="tran_size"
                  value={form?.tran_size}
                  onChange={(e: any) => handleChange(e)}
                  id=""
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
                min="0"
                max="999999"
                value={form.trans_use === "no_use" ? 0 : form.l1_level}
                disabled={form.trans_use === "no_use"}
                required={form.trans_use == "use"}
                onChange={handleLLevelChange}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e") {
                    e.preventDefault();
                  }
                }}
                onInput={(e: any) => {
                  if (e.target.value.length > 6) {
                    e.target.value = e.target.value.slice(0, 6);
                  }
                }}
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{
                  borderColor:
                    form.trans_use === "use"
                      ? "rgb(29, 137, 225)"
                      : "rgb(207, 209, 197)",
                }}
              />
            </div>
            <div className="">
              <div className="flex items-center gap-2">
                <label htmlFor="">L2</label>
                <span>
                  <FaStar className="text-red-ူ" />
                </span>
              </div>
              <input
                type="number"
                name="l2_level"
                min="0"
                max="999999"
                value={form.trans_use === "no_use" ? 0 : form.l2_level}
                disabled={form.trans_use === "no_use"}
                required={form.trans_use == "use"}
                onChange={handleLLevelChange}
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
                    form.trans_use === "use"
                      ? "rgb(29, 137, 225)"
                      : "rgb(207, 209, 197)",
                }}
              />
            </div>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
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
                min="0"
                max="999999"
                onInput={(e: any) => {
                  if (e.target.value.length > 6) {
                    e.target.value = e.target.value.slice(0, 6);
                  }
                }}
                value={form.trans_use === "no_use" ? 0 : form.l3_level}
                disabled={form.trans_use === "no_use"}
                required={form.trans_use == "use"}
                onChange={handleLLevelChange}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e") {
                    e.preventDefault();
                  }
                }}
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{
                  borderColor:
                    form.trans_use === "use"
                      ? "rgb(29, 137, 225)"
                      : "rgb(207, 209, 197)",
                }}
              />
            </div>
            <div className="">
              <div className="flex items-center gap-2">
                <label htmlFor="">OLTC Tapping</label>
                <span>
                  <FaStar className="text-red-400" />
                </span>
              </div>
              <input
                type="number"
                name="oltc_tapping"
                required
                min="0"
                max="999999"
                onChange={handleChange}
                value={form.oltc_tapping}
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
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <div
              className={
                form.trans_service_date
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 items-center"
                  : ""
              }
            >
              <div className="">
                <label htmlFor=""> Service Date</label>
                <input
                  type="date"
                  name="trans_service_date"
                  value={form.trans_service_date}
                  onChange={handleChange}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                  style={{ borderColor: "rgb(29, 137, 225)" }}
                />
              </div>
              {form.trans_service_date && (
                <div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="">Cost</label>
                    <span>
                      <FaStar className="text-red-400" />
                    </span>
                  </div>
                  <input
                    type="text"
                    name="cost"
                    value={form.cost}
                    inputMode="decimal"
                    onChange={(e: any) => {
                      let value = e.target.value;
                      value = value.replace(/[^0-9.]/g, "");

                      const parts = value.split(".");
                      if (parts.length > 2) return;
                      if (parts[0].length > 8) {
                        parts[0] = parts[0].slice(0, 8);
                      }
                      if (parts[1]) {
                        parts[1] = parts[1].slice(0, 2);
                      }

                      setForm((prev: any) => ({
                        ...prev,
                        cost: parts.join("."),
                      }));
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="border focus:outline-blue p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                    style={{ borderColor: "rgb(29, 137, 225)" }}
                  />
                </div>
              )}
            </div>
            <div className="">
              {form.trans_service_date ? (
                <div className="flex items-center gap-2">
                  <label htmlFor=""> Remark</label>
                  <span>
                    <FaStar className="text-red-400" />
                  </span>
                  <span
                    className={`text-xs font-mono ${isAtLimit ? "text-orange-600 font-bold" : "text-gray-400"}`}
                  >
                    {remark.length}/{225}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <label htmlFor=""> Remark</label>
                  <span
                    className={`text-xs font-mono ${isAtLimit ? "text-orange-600 font-bold" : "text-gray-400"}`}
                  >
                    {remark.length}/{225}
                  </span>
                </div>
              )}

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
              >
                {form.remark}
              </textarea>
              {isAtLimit && (
                <span className="text-orange-600 text-xs font-semibold">
                  Maximum limit of {225} characters reached.
                </span>
              )}
            </div>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6 ">
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
                        updateFile(fileField.id, e.target.files?.[0] || null)
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
              <div className="flex flex-wrap gap-3 mt-2 items-center">
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

export default TransformerEdit;
