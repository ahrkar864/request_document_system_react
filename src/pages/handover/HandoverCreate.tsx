import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavPath from "../../components/NavPath";
import { Button, Loader, Checkbox, Menu } from "@mantine/core";
import Swal from "sweetalert2";
import { storeHandoverData } from "../../api/Handover/handover";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";
interface Category {
  value: string;
  name: string;
}

interface ModuleOption {
  value: string;
  name: string;
}

interface FormEntry {
  category_name: string;
  module_name: string;
  file: File | null;
  filePreview: string | null;
}

export default function HandoverDetail() {
  const location = useLocation();
  const { reAdd = false, handoverFormId = null } = location.state || {};

  const navigate = useNavigate();

  const [categories] = useState<Category[]>([
    { value: "cover", name: "Cover" },
    { value: "cctv", name: "CCTV" },
    { value: "power_device", name: "Power Device" },
    { value: "walkie", name: "Walkie" },
    { value: "ph_and_sim", name: "Ph & Sim" },
    { value: "sop", name: "SOP" },
    { value: "suprise_check", name: "suprise_check_list" },
    { value: "supplier_cont", name: "Supplier Cont" },
    { value: "photo", name: "Photos" },
    { value: "all_password", name: "All Password" },
    { value: "remaining_stk", name: "Remaining Stk" },
    { value: "job", name: "Job" },
  ]);

  const [loading, setLoading] = useState<boolean>(false);

  const [forms, setForms] = useState<FormEntry[]>([
    {
      category_name: "",
      module_name: "",
      file: null,
      filePreview: null,
    },
  ]);

  const handleChange = <K extends keyof FormEntry>(
    index: number,
    field: K,
    value: FormEntry[K],
  ) => {
    const updated = [...forms];
    updated[index] = { ...updated[index], [field]: value };
    setForms(updated);
  };

  const handleFileChange = (index: number, file: File | null) => {
    const updated = forms.map((form, i) => {
      if (i !== index) return form;
      return {
        ...form,
        file: file,
        filePreview:
          file && file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : null,
      };
    });
    setForms(updated);
  };

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement>,
    btnStatus: string = "Default",
  ) => {
    e.preventDefault();

    console.log("Current forms state:", forms);
    forms.forEach((form, index) => {
      console.log(`Form ${index} file:`, form.file);
    });

    const missingFields: string[] = [];

    if (forms.length === 0) {
      missingFields.push("At least one form entry is required");
    }

    forms.forEach((form, index) => {
      if (!form.category_name || form.category_name.trim() === "") {
        missingFields.push(`Form #${index + 1}: Category Name is required`);
      }
      if (!form.module_name || form.module_name.trim() === "") {
        missingFields.push(`Form #${index + 1}: Module Name is required`);
      }

      if (!form.file) {
        missingFields.push(`Form #${index + 1}: File is required`);
      }
    });

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

    const formData = new FormData();
    formData.append("btn_status", btnStatus);
    formData.append("reAdd", reAdd ? "1" : "0");
    formData.append("handoverFormId", handoverFormId);
    forms.forEach((form, index) => {
      formData.append(`handovers[${index}][category_name]`, form.category_name);
      formData.append(`handovers[${index}][module_name]`, form.module_name);
      if (form.file) {
        formData.append(`handovers[${index}][file]`, form.file);
      }
    });

    console.log("Form Datta", formData);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await storeHandoverData(token, formData);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Handover data stored successfully",
      });

      setForms([
        { category_name: "", module_name: "", file: null, filePreview: null },
      ]);
      navigate(-1);
    } catch (error: any) {
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
          text: getApiErrorMessage(
            error,
            "Something went wrong while saving data",
          ),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const moduleOptions: Record<string, ModuleOption[]> = {
    cctv: [
      { value: "cctv_net_pa_sche", name: "CCTV, Net, PA Sche" },
      { value: "cctv_net_pa_lyt", name: "CCTV, Net, PA Lyt" },
      { value: "cctv_list", name: "CCTV List" },
    ],
  };

  const getModules = (
    categoryValue: string,
    categoryName?: string,
  ): ModuleOption[] => {
    if (moduleOptions[categoryValue]) {
      return moduleOptions[categoryValue];
    }
    if (categoryName) {
      return [{ value: `${categoryValue}_list`, name: `${categoryName} List` }];
    }
    return [];
  };

  const addForm = () => {
    setForms([
      ...forms,
      {
        category_name: "",
        module_name: "",
        file: null,
        filePreview: null,
      },
    ]);
  };

  const removeForm = (index: number) => {
    setForms(forms.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <NavPath
        segments={[
          { path: "/dashboard", label: "Home" },
          { path: "/dashboard", label: "Dashboard" },
          { path: "/handover", label: "Handover Request" },
        ]}
      />
      <div className="p-4 sm:p-6 bg-white-100 rounded-lg shadow-md w-full">
        <h2 className="text-center text-lg sm:text-xl font-semibold">
          Handover Request Form
        </h2>
        <div className="flex justify-end">
          <Button type="button" onClick={addForm} color="blue" radius="md">
            + Add
          </Button>
        </div>
        <form className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2">
            {forms.map((form, index) => (
              <div key={index}>
                <div className="space-y-3 rounded-lg p-5 mb-3 relative shadow-lg">
                  <div>
                    <label className="block text-md font-medium mb-1">
                      Category Name{" "}
                      <span className="text-red-500 text-xl">*</span>
                    </label>
                    <select
                      name="category_name"
                      value={form.category_name}
                      onChange={(e) =>
                        handleChange(index, "category_name", e.target.value)
                      }
                      className="border focus:outline-none p-3 w-full rounded-md"
                      required
                      style={{ borderColor: "#d0d6d8" }}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-md font-medium mb-1">
                      Module Name{" "}
                      <span className="text-red-500 text-xl">*</span>
                    </label>
                    <select
                      name="module_name"
                      value={form.module_name}
                      onChange={(e) =>
                        handleChange(index, "module_name", e.target.value)
                      }
                      className="border focus:outline-none p-3 w-full rounded-md"
                      required
                      style={{ borderColor: "#d0d6d8" }}
                    >
                      <option value="" disabled>
                        Select module
                      </option>
                      {getModules(
                        form.category_name,
                        categories.find((c) => c.value === form.category_name)
                          ?.name,
                      ).map((mod: ModuleOption) => (
                        <option key={mod.value} value={mod.value}>
                          {mod.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-md font-medium mb-1">
                      Attach File{" "}
                      <span className="text-red-500 text-xl">* </span>
                      <span className="block text-sm text-gray-500 font-normal mt-1">
                       File Type Accepts: (.xlsx, .xls, .csv, .pdf, .doc, .docx .jpg, .jpeg, .png,
                        .webp)
                      </span>
                    </label>
                    <input
                      type="file"
                      name={`file_${index}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        console.log("Selected file:", file);
                        handleFileChange(index, file);
                      }}
                      className="border focus:outline-none p-3 w-full rounded-md"
                      style={{ borderColor: "#d0d6d8" }}
                    />

                    {form.filePreview && (
                      <div className="mt-2">
                        <img
                          src={form.filePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-md border"
                          style={{ borderColor: "#d0d6d8" }}
                        />
                      </div>
                    )}

                    {form.file && !form.filePreview && (
                      <div className="mt-2 text-sm text-gray-600 flex items-center gap-1">
                        📄 {form.file.name}
                      </div>
                    )}
                  </div>

                  {forms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeForm(index)}
                      className="absolute top-2 right-2 text-red-500 text-md"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex lg:justify-center md:justify-center gap-3 lg:gap-6 md:gap-6 flex-wrap">
            <Button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              color="red"
              radius="md"
            >
              {loading ? "Processing..." : "Cancel"}
            </Button>

            <Button
              type="button"
              onClick={(e: any) => handleSubmit(e, "Default")}
              disabled={loading}
              color="blue"
              radius="md"
            >
              {loading ? "Processing..." : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
