export interface HandoverDataType {
  // combine data
  id?: number;
  category_name?: string;
  module_name?: string;
  is_checked?: boolean;
  remark?: string;
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
  getSupervisor?: {
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

  getManager?: {
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
  form?: {
    created_at?: string;
    ongoing_time?: string | null;
  };
  sendManagerAssettype?: {};
  supervisor?: {};
  approver?: {};
  recipient?: {};
  manager?: {};
  form_rejected?: {
    can_cel_u_ser?: {
      name?: string;
    };
  };

  handoverData?: {};
  recipientData?: RecipientData | RecipientData[] | null;
  files?: {};
  authUserId?: {};
}

export interface ReviewAttachment {
  id: number;
  file_url: string;
  file_name: string;
}

export interface RecipientData {
  id: number;
  general_form_id: number;
  user_id: number;
  rating: number;
  review: string;
  created_at: string;
  updated_at: string;
  files: ReviewAttachment[];
  user?: {
    title?: string;
    name?: string;
    emp_id?: string;
    department?: {
      name?: string;
    };
  };
  users?: RecipientData["user"];
  recipient_user?: RecipientData["user"];
  recipientUser?: RecipientData["user"];
}

export interface FileItem {
  id?: number | string;
  handover_id?: number;
  file?: File | null;
  preview?: string | null;
  type?: "image" | "pdf" | "other" | null;
  name?: string | any;
  file_name?: string;
  file_url?: string | any;
  files?: {};
}

export interface TableDetailProps {
  detailData?: HandoverDataType;
  onRefresh: () => void;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  checkedHandoverIds?: Array<number | string>;
  onCheckedHandoverChange?: (
    handoverId: number | string,
    checked: boolean,
  ) => void;
}

export interface handoverDataType {
  // modal data from backend
  id?: number;
  category_name?: string;
  module_name?: string;
  remark?: string;
}
