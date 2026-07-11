import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavPath from "../../components/NavPath";
import { Button, Loader } from "@mantine/core";
import Swal from "sweetalert2";
import {
  editHandoverData,
  updateHandoverData,
} from "../../api/Handover/handover";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  value: string;
  name: string;
}

interface ModuleOption {
  value: string;
  name: string;
}

interface EditFormState {
  category_name: string;
  module_name: string;
  file: File | null;
  filePreview: string | null;
  existingFilePath: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
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
];

const MODULE_OPTIONS: Record<string, ModuleOption[]> = {
  cctv: [
    { value: "cctv_net_pa_sche", name: "CCTV, Net, PA Sche" },
    { value: "cctv_net_pa_lyt", name: "CCTV, Net, PA Lyt" },
    { value: "cctv_list", name: "CCTV List" },
  ],
};

function getModules(
  categoryValue: string,
  categoryName?: string,
): ModuleOption[] {
  if (MODULE_OPTIONS[categoryValue]) return MODULE_OPTIONS[categoryValue];
  if (categoryName)
    return [{ value: `${categoryValue}_list`, name: `${categoryName} List` }];
  return [];
}

const EMPTY_FORM: EditFormState = {
  category_name: "",
  module_name: "",
  file: null,
  filePreview: null,
  existingFilePath: null,
};

// ─── Component ────────────────────────────────────────────────────────────────

function HandoverEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // handover item id (URL ထဲက)

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>(EMPTY_FORM);

  // ── Fetch existing item data on mount ──────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    fetchEditData();
  }, [id]);

  const fetchEditData = async () => {
    setPageLoading(true);
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await editHandoverData(token, id!);
      const data = res?.data ?? res;
      console.log("Edit Data", data);
      setEditForm({
        category_name: data?.category_name ?? "",
        module_name: data?.module_name ?? "",
        file: null,
        filePreview: null,
        existingFilePath: data?.file?.file_url ?? null,
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load handover data.",
      });
    } finally {
      setPageLoading(false);
    }
  };

  // ── Form change handlers ───────────────────────────────────────────────────
  const handleFormChange = <K extends keyof EditFormState>(
    field: K,
    value: EditFormState[K],
  ) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file: File | null) => {
    setEditForm((prev) => ({
      ...prev,
      file,
      filePreview:
        file && file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
    }));
  };

  // ── Save (update) ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const missing: string[] = [];
    if (!editForm.category_name) missing.push("Category Name is required");
    if (!editForm.module_name) missing.push("Module Name is required");
    if (!editForm.file && !editForm.existingFilePath) {
      missing.push("Attach File is required");
    }

    if (missing.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Required Fields Missing",
        html: `<ul style="text-align:left">${missing.map((m) => `<li>• ${m}</li>`).join("")}</ul>`,
      });
      return;
    }

    const formData = new FormData();
    formData.append("category_name", editForm.category_name);
    formData.append("module_name", editForm.module_name);
    if (editForm.file) {
      formData.append("file", editForm.file);
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token") ?? "";
      await updateHandoverData(token, formData, id);

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Handover updated successfully.",
      });
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
            "Something went wrong while updating.",
          ),
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isImagePath = (path: string) =>
    /\.(jpg|jpeg|png|gif|webp)$/i.test(path);

  const inputClass = "border focus:outline-none p-3 w-full rounded-md";
  const inputStyle = { borderColor: "#d0d6d8" };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <NavPath
        segments={[
          { path: "/dashboard", label: "Dashboard" },
          { path: "/handover", label: "Handover" },
          { path: "#", label: "Edit" },
        ]}
      />

      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6 w-full">
        <h2 className="text-center text-lg sm:text-xl font-semibold mb-4">
          Handover Edit Form
        </h2>

        <form className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
            <div className="">
              <div>
                <div className="space-y-3 rounded-lg p-5 mb-3 relative shadow-lg">
                  {/* Category Name */}
                  <div>
                    <label className="block text-md font-medium mb-1">
                      Category Name{" "}
                      <span className="text-red-500 text-xl">*</span>
                    </label>
                    <select
                      name="category_name"
                      value={editForm.category_name}
                      onChange={(e) => {
                        handleFormChange("category_name", e.target.value);
                        handleFormChange("module_name", ""); // category ပြောင်းရင် module ပြန် reset
                      }}
                      className={inputClass}
                      required
                      style={inputStyle}
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Module Name */}
                  <div>
                    <label className="block text-md font-medium mb-1">
                      Module Name{" "}
                      <span className="text-red-500 text-xl">*</span>
                    </label>
                    <select
                      name="module_name"
                      value={editForm.module_name}
                      onChange={(e) =>
                        handleFormChange("module_name", e.target.value)
                      }
                      className={inputClass}
                      required
                      style={inputStyle}
                    >
                      <option value="" disabled>
                        Select module
                      </option>
                      {getModules(
                        editForm.category_name,
                        CATEGORIES.find(
                          (c) => c.value === editForm.category_name,
                        )?.name,
                      ).map((mod) => (
                        <option key={mod.value} value={mod.value}>
                          {mod.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Attach File */}
                  <div>
                    <label className="block text-md font-medium mb-1">
                      Attach File{" "}
                      {!editForm.existingFilePath && (
                        <span className="text-red-500 text-xl">*</span>
                      )}
                    </label>

                    {editForm.existingFilePath && !editForm.file && (
                      <div className="mb-2 flex items-center gap-2">
                        {isImagePath(editForm.existingFilePath) ? (
                          <img
                            src={editForm.existingFilePath}
                            alt="current"
                            className="w-20 h-20 object-cover rounded border"
                          />
                        ) : (
                          <a
                            href={editForm.existingFilePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                          >
                            📄 Current file
                          </a>
                        )}
                      </div>
                    )}

                    <input
                      type="file"
                      name="file"
                      onChange={(e) =>
                        handleFileChange(e.target.files?.[0] ?? null)
                      }
                      className={inputClass}
                      style={inputStyle}
                    />

                    {editForm.filePreview && (
                      <div className="mt-2">
                        <img
                          src={editForm.filePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-md border"
                          style={inputStyle}
                        />
                      </div>
                    )}

                    {editForm.file && !editForm.filePreview && (
                      <div className="mt-2 text-sm text-gray-600 flex items-center gap-1">
                        📄 {editForm.file.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex lg:justify-center md:justify-center gap-3 lg:gap-6 md:gap-6 flex-wrap mt-4">
                <Button
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={saving}
                  color="red"
                  radius="md"
                >
                  {saving ? "Processing..." : "Cancel"}
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  color="blue"
                  radius="md"
                >
                  {saving ? "Processing..." : "Update"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HandoverEdit;
