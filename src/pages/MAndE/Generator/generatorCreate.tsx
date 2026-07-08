import { DateInput, TimeInput } from "@mantine/dates";
import {
  ActionIcon,
  Button,
  Input,
  NumberInput,
  TextInput,
  Loader,
  Checkbox,
  Menu,
} from "@mantine/core";
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
import { Check, FilesIcon, Text } from "lucide-react";
import type { InvoiceFile } from "../../../utils/requestDiscountUtil/create";
import { v4 as uuidv4 } from "uuid";
import type {
  kvaData,
  meGeneratorDataType,
} from "../../../utils/meDataUtil/metype";
import Swal from "sweetalert2";
import { m } from "framer-motion";
import { getStoreGeneratorData } from "../../../api/ME/Generator/generatos";
import { useLocation, useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import { getCommonData } from "../../../api/ME/meData";

const GeneratorCreate: React.FC = () => {
  type LevelType = {
    l1Value: number | "";
    l2Value: number | "";
    l3Value: number | "";
  };
  const location = useLocation();
  const { formId } = location.state || "";
  const { reAdd } = location.state || "";
  const { generalFormId } = location.state || "";
  const [generatorUse, setGeneratorUse] = useState<string>("use");
  const [serviceDate, setServiceDate] = useState<string>("");
  const [levelValue, setLevelValue] = useState<LevelType>({
    l1Value: "",
    l2Value: "",
    l3Value: "",
  });
  const [remark, setRemark] = useState<string>("");

  const [invoiceFile, setInvoiceFile] = useState<InvoiceFile[]>([
    { id: uuidv4(), file: null, preview: null, type: null, name: null },
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [kva, setKva] = useState<kvaData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setLoading(true);

      try {
        const commonData = await getCommonData(token);
        setKva(commonData?.data);
      } catch (error) {
        console.error("Error fetching check item data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const kvaOptions = kva.map((item) => ({
    value: String(item.kva),
    label: String(item.kva),
  }));

  const addInvoiceFile = () => {
    setInvoiceFile((prev) => [
      ...prev,
      {
        id: uuidv4(),
        file: null,
        preview: null,
        type: null,
        name: null,
      },
    ]);
  };
  const removeInvoiceFile = (id: string | number) => {
    setInvoiceFile((prev) =>
      prev.filter((item) => {
        if (item.id === id && item.preview) {
          URL.revokeObjectURL(item.preview);
        }
        return item.id !== id;
      }),
    );
  };
  const updateFile = (id: string | number, file: File | null) => {
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
  const validators = {
    generator_date: "Date is required",
    generator_time: "Time is required",
    coolant_level: "Coolant % is required",
    battery_volt_level: "Battery Volt is required",
    l1_level: "L1 is required",
    l2_level: "L2 is required",
    l3_level: "L3 is required",
    // total_kw_level: "Total KW is required",
    voltagel_l_level: "Voltage L-L is required",
    // load_level: "Load % is required",
    running_hour: "Running Hour is required",
    // generator_service_date: "Service Date is required",
    generator_cleaning_level: "Cleaning Level is required",
    cost: "Cost is required",
    gen_kva_level: "KVA Level is required",
    generator_size: "Generator size is required",
    engine_oil_level: "Engine Oil Level is required",
    // remark: "Remark is required",
  };
  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
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
    // validation
    const l1 = Number(formData.get("l1_level") || 0);
    const l2 = Number(formData.get("l2_level") || 0);
    const l3 = Number(formData.get("l3_level") || 0);
    if (generatorUse === "use") {
      if (l1 === 0) missingFields.push("L1 must be greater than 0");
      if (l2 === 0) missingFields.push("L2 must be greater than 0");
      if (l3 === 0) missingFields.push("L3 must be greater than 0");
    }
    Object.entries(validators).forEach(([key, message]) => {
      if (
        generatorUse === "no_use" &&
        ["l1_level", "l2_level", "l3_level"].includes(key)
      ) {
        return;
      }
      if ((!serviceDate || serviceDate.trim() === "") && key === "cost") {
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
    const percentFields = [
      "coolant_level",
      "generator_cleaning_level",

      // "load_level",
    ];

    const rangeErrors: string[] = [];

    percentFields.forEach((field) => {
      const value = Number(formData.get(field));

      if (isNaN(value) || value < 1 || value > 100) {
        rangeErrors.push(
          `${field.replaceAll("_", " ")} must be between 1 and 100`,
        );
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

    // 🔥 append files
    invoiceFile.forEach((fileItem, index) => {
      if (fileItem.file) {
        formData.append(`file[${index}]`, fileItem.file);
      }
    });
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      await getStoreGeneratorData(token, formData);

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
  // Add a function to trigger the specific type of upload
  // const handleUploadChoice = (choice, fileFieldId) => {
  //   const input = document.createElement("input");
  //   input.type = "file";
  //   input.accept = "image/*";

  //   // If user chooses camera, we add the capture attribute
  //   if (choice === "camera") {
  //     input.setAttribute("capture", "environment"); // 'user' for front cam, 'environment' for back
  //   }

  //   input.onchange = (e) => {
  //     updateFile(fileFieldId, e.target.files?.[0] || null);
  //   };

  //   input.click();
  // };
  const handleUploadChoice = (
    choice: "camera" | "gallery",
    fileFieldId: string,
  ) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    if (choice === "camera") {
      input.setAttribute("capture", "environment");
    }

    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0] || null;

      updateFile(fileFieldId, file);
    };

    input.click();
  };
  const triggerUploadDialog = (id: string) => {
    Swal.fire({
      title: "Select Image Source",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Camera",
      denyButtonText: "Gallery",
      confirmButtonColor: "#3085d6",
      denyButtonColor: "#29e129",
    }).then((result) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      if (result.isConfirmed) {
        // User chose Camera
        input.setAttribute("capture", "environment");
        input.click();
      } else if (result.isDenied) {
        // User chose Gallery
        input.click();
      }

      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          updateFile(id, file);
        }
      };
    });
  };
  const handleCaptureChoice = (id: string, mode: "camera" | "gallery") => {
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

  const handleRemarkChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // setRemark(e.target.value);
    if (e.target.value.length <= 225) {
      setRemark(e.target.value);
    }
  };
  const isAtLimit = remark.length === 225;
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
            { path: `/generator/${formId}`, label: "Generator" },
          ]}
        />
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="use"
            checked={generatorUse === "use"}
            onChange={(e) => setGeneratorUse(e.target.value)}
          />
          Generator Run
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="no_use"
            checked={generatorUse === "no_use"}
            onChange={(e) => setGeneratorUse(e.target.value)}
          />
          Generator Not Run
        </label>
      </div>

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
        <fieldset disabled={!generatorUse}>
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
                <input
                  type="hidden"
                  name="generalFormID"
                  value={generalFormId}
                />
                <input
                  type="hidden"
                  name="generator_use"
                  value={generatorUse == "use" ? "use" : "no_use"}
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
                  className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                  style={{ borderColor: "rgb(29, 137, 225)" }}
                />
              </div>
            </div>
            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <label>Engine Oil Level</label>
                    <span>
                      <FaStar className="text-red-400" />
                    </span>
                  </div>
                  <select
                    name="engine_oil_level"
                    id=""
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
                  </div>
                  <input
                    type="number"
                    name="fuel_level"
                    required
                    min="1"
                    max="100"
                    defaultValue={100}
                    onInput={(e: any) => {
                      let value = e.target.value;

                      if (value > 100) e.target.value = 100;
                      if (value < 1 && value !== "") e.target.value = 1;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e") {
                        e.preventDefault();
                      }
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
                      if (value < 1 && e.target.value !== "")
                        e.target.value = 1;
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="border p-2 w-full rounded-md focus:outline-2 focus:outline-blue-400"
                    style={{ borderColor: "rgb(29, 137, 225)" }}
                  />
                </div>

                {/* Coolant */}
                <div>
                  <div className="flex items-center gap-2">
                    <label>Generator Size</label>
                    <FaStar className="text-red-400" />
                  </div>
                  <select
                    name="generator_size"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <label>KVA Level</label>
                    <FaStar className="text-red-400" />
                  </div>
                  <select
                    name="gen_kva_level"
                    id=""
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
                    {kvaOptions &&
                      kvaOptions.map((item) => (
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
                    type="number"
                    name="battery_volt_level"
                    required
                    step="0.01"
                    inputMode="decimal"
                    onChange={(e: any) => {
                      let value = e.target.value;

                      value = value.replace(/[^0-9.]/g, "");

                      const parts = value.split(".");
                      if (parts.length > 2) {
                        value = parts[0] + "." + parts[1];
                      }

                      if (parts[0].length > 6) {
                        parts[0] = parts[0].slice(0, 6);
                      }

                      if (parts[1]) {
                        parts[1] = parts[1].slice(0, 2);
                      }

                      value = parts.join(".");

                      e.target.value = value;
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
                  value={generatorUse === "no_use" ? 0 : levelValue.l1Value}
                  disabled={generatorUse === "no_use"}
                  required={generatorUse == "use"}
                  min={0}
                  max={9999999}
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
                    if (["-", "e", "E"].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="border p-2 w-full rounded-md focus:outline-2 focus:outline-blue-400"
                  style={{
                    borderColor:
                      generatorUse === "use"
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
                  min="0"
                  max="9999999"
                  value={generatorUse === "no_use" ? 0 : levelValue.l2Value}
                  disabled={generatorUse === "no_use"}
                  required={generatorUse == "use"}
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
                      generatorUse === "use"
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
                  min="0"
                  max="9999999"
                  value={generatorUse === "no_use" ? 0 : levelValue.l3Value}
                  disabled={generatorUse === "no_use"}
                  required={generatorUse == "use"}
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
                      generatorUse === "use"
                        ? "rgb(29, 137, 225)"
                        : "rgb(207, 209, 197)",
                  }}
                />
              </div>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
              {/* <div className="">
              <div className="flex items-center gap-2">
                <label htmlFor="">Total KW</label>
                <span>
                  <FaStar className="text-red-400" />
                </span>
              </div>
              <input
                type="number"
                name="total_kw_level"
                required
                min="0"
                max="9999"
                onInput={(e) => {
                  if (e.target.value.length > 4) {
                    e.target.value = e.target.value.slice(0, 4);
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
            </div> */}

              <div className="">
                <div className="flex items-center gap-2">
                  <label htmlFor="">VoltageL-L</label>
                  <span>
                    <FaStar className="text-red-400" />
                  </span>
                </div>
                <input
                  type="number"
                  name="voltagel_l_level"
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
                  inputMode="decimal"
                  onChange={(e: any) => {
                    let value = e.target.value;

                    value = value.replace(/[^0-9.]/g, "");

                    const parts = value.split(".");
                    if (parts.length > 2) {
                      value = parts[0] + "." + parts[1];
                    }

                    if (parts[0].length > 6) {
                      parts[0] = parts[0].slice(0, 6);
                    }

                    if (parts[1]) {
                      parts[1] = parts[1].slice(0, 2);
                    }

                    value = parts.join(".");

                    e.target.value = value;
                  }}
                  required
                  min="0"
                  max="9999999"
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
                  min="0"
                  max="100"
                  onKeyDown={(e) => {
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
                  serviceDate
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 items-center"
                    : ""
                }
              >
                <div className="">
                  <label htmlFor=""> Service Date</label>
                  <input
                    type="date"
                    name="generator_service_date"
                    onChange={(e) => setServiceDate(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                    style={{ borderColor: "rgb(29, 137, 225)" }}
                  />
                </div>
                {serviceDate && (
                  <div>
                    <div className="flex items-center gap-2">
                      <label htmlFor=""> Cost</label>
                      <span>
                        <FaStar className="text-red-400" />
                      </span>
                    </div>
                    <input
                      type="text"
                      name="cost"
                      required
                      inputMode="decimal"
                      onChange={(e: any) => {
                        let value = e.target.value;

                        value = value.replace(/[^0-9.]/g, "");

                        const parts = value.split(".");
                        if (parts.length > 2) {
                          value = parts[0] + "." + parts[1];
                        }

                        if (parts[0].length > 8) {
                          parts[0] = parts[0].slice(0, 8);
                        }

                        if (parts[1]) {
                          parts[1] = parts[1].slice(0, 2);
                        }

                        value = parts.join(".");

                        e.target.value = value;
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
                {serviceDate ? (
                  <div className="flex items-center gap-2">
                    <label htmlFor=""> Remark</label>
                    <span>
                      <FaStar className="text-red-400" />
                    </span>
                  </div>
                ) : (
                  <label htmlFor=""> Remark</label>
                )}

                <textarea
                  name="remark"
                  value={remark}
                  onChange={handleRemarkChange}
                  maxLength={225}
                  rows={2}
                  className={`border p-2 w-full rounded-md outline-none transition-all 
          ${
            isAtLimit
              ? "border-orange-500 focus:ring-1 focus:ring-orange-500"
              : "border-[rgb(29,137,225)] focus:ring-2 focus:ring-blue-400"
          }`}
                ></textarea>
                <div className="flex justify-between mt-1 px-1">
                  <div className="h-4">
                    {" "}
                    {/* Fixed height prevents layout jump */}
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
                </div>
              </div>
              <div className="">
                {invoiceFile.map((fileField, index) => (
                  <div
                    key={fileField.id}
                    className="flex flex-col gap-2 w-full"
                  >
                    <div className="flex items-center gap-2">
                      <label>
                        {index === 0 ? "Upload(Max uploads file 4)" : undefined}
                      </label>
                      <span>
                        <FaStar className="text-red-400" />
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* MD + LG FILE INPUT */}
                      <input
                        type="file"
                        name="file[]"
                        required
                        onChange={(e) =>
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

export default GeneratorCreate;
