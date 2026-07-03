import axios from "axios";
import type {
  FileItem,
  meGeneratorDataType,
  WaterTankDetailDataType,
  WaterTankEditResponse,
} from "../../../utils/meDataUtil/metype";

const API = axios.create({
    baseURL: "/api" ,
    withCredentials: true ,
})

export const getWaterTankData = async (token: string) => {
  try {
    const response = await API.get('/me/water-tank/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching general water tank data:", error);
    throw error;
  }
} 

export const storeWaterTankData = async (token: string | null, formData: FormData) => {
    return API.post(`/me/water-tank/store`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
} 

export const waterTankDetailData = async (token: string, id: string | number): Promise<meGeneratorDataType> => {
  try {
    const response = await API.get(`/me/water-tank/show/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Response water tank:", response.data);
    return response.data;
  } catch (error) {
    console.error("waterTankDetail error:", error);
    throw error;
  }
}
export const waterTankEditData = async (token: string, id: string): Promise<WaterTankEditResponse> => {
  try {
    const response = await API.get(`/me/water-tank/edit/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Response water tank edit:", response.data);
    return response.data;
  } catch (error) {
    console.error("waterTankEdit error:", error);
    throw error;
  }
};
export const updateWaterTankData = async (
  token: string | null,
  formData: FormData,
  id: string | number | undefined
) => {
  return API.post(`me/water-tank/update/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const searchWaterTankData = async (
  token: string,
  params: {
    form_doc_no?: string;
    from_date?: string | null;
    to_date?: string | null;
    status?: string[];
  }
) => {
  try {
    const response = await API.get("me/water-tank/search", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Search results >>", response.data);
    return response.data ?? [];
  } catch (error) {
    console.log("Error at search WaterTank", error);
    throw error;
  }
};

export const waterTankDelete = async (
  token: string,
  generalFormId: string | number,
  formId: string | number,
) => {
  const response = await API.get(
    `/me/water-tank/delete/${generalFormId}/${formId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
}; 

export const waterTankFileDelete = async (token: string, id: string | number | undefined): Promise<FileItem> => {
  try {
    const response = await API.get(`/me/water-tank/deleteFile/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // console.log("ResponseData>>" , response.data);
    return response.data;
  } catch (error) {
    console.error("water tank file delete error:", error);
    throw error;
  }
}
