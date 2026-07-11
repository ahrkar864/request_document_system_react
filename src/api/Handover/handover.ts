import axios from "axios";
import type { HandoverDataType } from "../../utils/HandoverUtil/handovertype";

interface editDataResponse {
  data: any;
  [key: string]: any;
}

const API = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export const getHandoverData = async (token: string) => {
  try {
    const response = await API.get("/handover", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching check item data:", error);
    throw error;
  }
};

export const storeHandoverData = async (
  token: string | null,
  formData: FormData,
) => {
  return API.post("/handover", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const handoverDetailData = async (
  token: string,
  id: string | number,
) => {
  try {
    const response = await API.get(`/handover/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Handover error:", error);
    throw error;
  }
};

export const updateHandoverData = async (
  token: string | null,
  formData: FormData,
  id: string | undefined,
) => {
  return API.post(`/handover/${id}/update`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const editHandoverData = async (
  token: string,
  id: string,
): Promise<editDataResponse> => {
  try {
    const response = await API.get(`/handover/${id}/edit`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("handover edit error:", error);
    throw error;
  }
};

export const handoverDelete = async (
  token: string,
  generalFormId: string | number,
  formId: string | number,
) => {
  const response = await API.delete(`/handover/${generalFormId}/${formId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const searchHandoverData = async (
  token: string,
  params: {
    form_doc_no?: string;
    from_date?: string | null;
    to_date?: string | null;
    status?: string[];
  },
) => {
  try {
    const response = await API.get("/handover/searchData", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data ?? [];
  } catch (error) {
    console.log("Error at search Handover", error);
    throw error;
  }
};

export const searchRecipient = async (token: string | null, query: string) => {
  try {
    const response = await API.get("/handover/searchRecipient", {
      params: { q: query },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data ?? [];
  } catch (error) {
    console.log("Error at search Recipient", error);
    throw error;
  }
};



type approveFormHandover = {
  status: string;
  comment: string;
} & Partial<HandoverDataType>;
export const approveFormHandover = async (
  token: string,
  formData: FormData | { status: string; comment: string },
  form_id: string | number,
  general_form_id: string | number,
) => {
  const isFormData = formData instanceof FormData;

  return API.post(
    `/handover/approve/${form_id}/${general_form_id}/`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
      },
    },
  );
};
