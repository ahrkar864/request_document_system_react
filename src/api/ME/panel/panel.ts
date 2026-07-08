import axios from "axios";
import type { editDataResponse, FileItem, meGeneratorDataType } from "../../../utils/meDataUtil/metype";

const API = axios.create({
    baseURL: "/api" ,
    withCredentials: true ,
})

export const getPanelData = async(token:string) => {
    try {
      const response = await API.get('/me/panel/' , {
        headers: {Authorization: `Bearer ${token}`} ,
      }) ;
      return response.data;
    } catch (error) {
        console.error("Error fetching check item data:" , error) ;
        throw error ;
    }
}

export const storePanelData = async (token:string | null , formData:FormData)=>{
  return API.post(`/me/panel/store` , formData , {
    headers: {
      Authorization: `Bearer ${token}` ,
      "Content-Type" : "multipart/form-data" ,
    },
  });
};

export const panelDetailData = async (token: string, id: string | number): Promise<meGeneratorDataType> => {
  try {
    const response = await API.get(`/me/panel/detail/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("REsponse panel:", response.data);
    return response.data;
  } catch (error) {
    console.error("transformerDetail error:", error);
    throw error;
  }
}


export const updatePanelData = async (token:string | null , formData:FormData , id:string | undefined)=>{
  return API.post(`/me/panel/update/${id}` , formData , {
    headers: {
      Authorization: `Bearer ${token}` ,
      "Content-Type" : "multipart/form-data" ,
    },
  });
};

export const editPanelData = async(token:string , id:string) : Promise<editDataResponse >=> {
  try {
    const response = await API.get(`/me/panel/edit/${id}` , {
      headers : {Authorization: `Bearer ${token}`} ,
    });
    return response.data;
  } catch (error) {
    console.error("meDataDetail error:", error);
    throw error;
  }
}


export const panelFileDelete = async(token:string , id:string|number) : Promise<FileItem >=> {
  try {
    const response = await API.get(`/me/panel/deleteFile/${id}` , {
      headers : {Authorization: `Bearer ${token}`} ,
    });
    // console.log("ResponseData>>" , response.data);

    return response.data;
  } catch (error) {
    console.error("panel delete error:", error);
    throw error;
  }
}

export const panelDelete = async (
  token: string,
  generalFormId: string | number,
  formId: string | number,
) => {
  const response = await API.get(
    `/me/panel/delete/${generalFormId}/${formId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
};

export const searchPanelData = async (
  token: string,
  params: {
    form_doc_no?: string;
    from_date?: string | null;
    to_date?: string | null;
    status?: string[];
  }
) => {
  try {
    const response = await API.get("me/panel/searchNotification", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Search results >>", response.data);
    return response.data ?? [];
  } catch (error) {
    console.log("Error at search Generator", error);
    throw error;
  }
};
