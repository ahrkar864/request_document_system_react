export interface meGeneratorDataType {
  id?: number;
  general_form_id?: number;
  generator_date?: string | undefined;
  generator_time_ampm?: string;
  generator_size?: string;
  generator_use?: string;
  cost: number | string;
  generator_time?: string;
  engine_oil_level?: number;
  fuel_level?: number;
  coolant_level?: number;
  battery_volt_level?: number;
  l1_level?: number;
  l2_level?: number;
  l3_level?: number;
  total_kw_level?: number;
  voltagel_l_level?: number;
  gen_kva_level?: number;
  running_hour?: number;
  generator_service_date?: string;
  generator_cleaning_level?: number;
  remark?: string;
  status?: string;
  generator_id: number;
  file_name: string;
  file_url: string;
  name?: string;
  generalForm?: {
    id?: number;
    form_doc_no?: string;
    asset_type?: string;
    form_branch?: number;
    form_department?: number;
    to_branch?: number;
    to_department?: number;
    user_id?: number;
    receiver_id?: number;
    form_id?: number;
    date?: string;
    g_remark?: string;
    requester_name?: string;
    total_amount?: number | null;
    created_at?: string | null;
    ongoing_time?: string | null;
    updated_at?: string | Date;
    reason?: string | number;
    osnb_doc_no?: string | null;
    remark?: string;
    status?: string;
    originators?: {
      title?: string;
      name?: string;
      departments?: {
        name?: string;
      };
    };
  };
  subForm?: {
    id?: number | string;
    general_form_id?: number | string;
    sub_form_id?: number | string;
  };
  getChecker?: {
    assigned_user?: {
      title?: string;
      name?: string;
      department?: {
        name?: string;
      };
    };
    approval_users?: {
      title?: string;
      name?: string;
      department?: {
        name?: string;
      };
    };
    created_at?: string;
    ongoing_time?: string | null;
    comment?: string;
  };
  getApprover?: {
    created_at?: string;
    ongoing_time?: string | null;
    comment?: string;
    approval_users?: {
      title?: string;
      name?: string;
      department?: {
        name?: string;
      };
    };
  };
  form?: {
    created_at?: string;
    ongoing_time?: string | null;
  };
  sendManagerAssettype?: {};
  checker?: {};
  approver?: {};

  form_rejected?: {
    can_cel_u_ser?: {
      name?: string;
    };
  };

  detailData?: {};

  files?: {};
  authUserId?: {};
}

export interface FileItem {
  id?: number | string;
  generator_id?: number;
  transformer_id?: number;
  solar_id?: number;
  panel_id?: number;
  water_tank_id?: number;
  file?: File | null;
  preview?: string | null;
  type?: "image" | "pdf" | "other" | null;
  name?: string | any;
  file_name?: string;
  file_url?: string | any;
  files?: {};
}

export interface TableDetailProps {
  detailData?: meGeneratorDataType; // make optional
  onRefresh: () => void;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface meTransDataType {
  id?: number;
  trans_date?: string;
  trans_time?: string;
  transformer_time_ampm?: string;
  meter_unit?: number | string;
  tran_kva_level?: number;
  voltagel_l_level?: number;
  tran_size?: string;
  l1_level?: number;
  l2_level?: number;
  l3_level?: number;
  oltc_tapping?: number;
  trans_service_date?: string;
  remark?: string;
  cost?: number;
  total_kw_level?: number;
  trans_use?: string;
}

export interface meSolarDataType {
  id?: number;
  solar_date?: string;
  solar_time?: string;
  solar_time_ampm?: string;
  solar_unit?: number | string;
  total_solar_output_Kw?: number;
  avg_battery_percentage?: number;
  voltagel_l_level?: number;
  solar_size?: string;
  l1_level?: number;
  l2_level?: number;
  l3_level?: number;
  oltc_tapping?: number;
  panel_cleaning_date?: string;
  remark?: string;
  check_inverter?: string;
  check_battery?: string;
  check_panel_temperature?: string;
  total_kw_level?: number;
  solar_use?: string;
  total_load_kw_use?: number;
  grid_kw_use?: number;
}

export interface meEvaDataType {
  id?: number;
  eva_date?: string;
  eva_time?: string;
  eva_time_ampm?: string;
  pump1_water_pressure?: string;
  pump2_water_pressure?: string;
  pump_air_check?: string;
  pipe_leak_check?: string;
  water_level_check?: string;
  filter_wet_check?: string;
  remark?: string;
  eva_use?: string;
}

export interface meWaterTankDataType {
  id?: number;
  water_tank_date?: string;
  water_tank_time?: string;
  pump1_water_pressure?: string | number;
  pump2_water_pressure?: string | number;
  pressure_pump?: string;
  eva_pump1?: string;
  eva_pump2?: string;
  eva_water_pump?: string;
  water_supply_pipe?: string;
  upper_tank_lower_tank?: string;
  toilet_water_pressure?: string;
  remark?: string;
}

export interface mePanelDataType {
  id?: number;
  panel_date?: string;
  panel_time?: string;
  panel_time_ampm?: string;
  l1_level?: number;
  l2_level?: number;
  l3_level?: number;
  breaker_temperature?: number;
  total_load_kw_use?: number;
  voltagel_l_level?: number;
  panel_cleaning_maintenance?: string;
  breaker_maintenance?: string;
  lighting_maintenance?: string;
  led_light_box_power?: string;
  remark?: string;
  panel_use?: string;
}

export interface kvaData {
  id?: number | string;
  kva?: string | number;
}

export interface editDataResponse {
  editData: meGeneratorDataType; // Or just meTransDataType if it's a single object
  files: FileItem[];
  kvaData: kvaData;
}

export interface TransformerEditResponse {
  editData: meTransDataType;
  files: FileItem[];
  kvaData: kvaData;
}

export interface SolarEditResponse {
  editData: meSolarDataType;
  files: FileItem[];
}

export interface EvaEditResponse {
  editData: meEvaDataType;
  files: FileItem[];
}

export interface WaterTankDetailDataType {
  id?: number;
  general_form_id?: number;
  name?: string;
  generalForm?: {
    id?: number;
    form_doc_no?: string;
    asset_type?: string;
    form_branch?: number;
    form_department?: number;
    to_branch?: number;
    to_department?: number;
    user_id?: number;
    receiver_id?: number;
    form_id?: number;
    date?: string;
    g_remark?: string;
    requester_name?: string;
    total_amount?: number | null;
    created_at?: string | null;
    ongoing_time?: string | null;
    updated_at?: string | Date;
    reason?: string | number;
    osnb_doc_no?: string | null;
    remark?: string;
    status?: string;
    originators?: {
      title?: string;
      name?: string;
      departments?: {
        name?: string;
      };
    };
  };
  subForm?: {
    id?: number | string;
    general_form_id?: number | string;
    sub_form_id?: number | string;
  };
  getChecker?: {
    assigned_user?: {
      title?: string;
      name?: string;
      department?: {
        name?: string;
      };
    };
    approval_users?: {
      title?: string;
      name?: string;
      department?: {
        name?: string;
      };
    };
    created_at?: string;
    ongoing_time?: string | null;
    comment?: string;
  };
  getApprover?: {
    created_at?: string;
    ongoing_time?: string | null;
    comment?: string;
    approval_users?: {
      title?: string;
      name?: string;
      department?: {
        name?: string;
      };
    };
  };
  form?: {
    created_at?: string;
    ongoing_time?: string | null;
  };
  sendManagerAssettype?: {};
  checker?: {};
  approver?: {};
  form_rejected?: {
    can_cel_u_ser?: {
      name?: string;
    };
  };
  detailData?: meWaterTankDataType[];
  files?: FileItem[];
  authUserId?: {};
}

export interface WaterTankEditResponse {
  editData: meWaterTankDataType;
  files: FileItem[];
}

export interface PanelEditResponse {
  editData: mePanelDataType;
  files: FileItem[];
}
