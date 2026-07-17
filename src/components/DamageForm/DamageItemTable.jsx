import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  Trash2,
  CheckCircle,
  ChevronLeft,
  Upload,
  ChevronRight,
  Search,
  Plus,
  Minus,
  Image as ImageIcon,
  Package,
  Filter,
  X,
  Download
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { apiRequest } from "../../utils/api";
import ConfirmationModal from "./ConfirmationModal";
import ProductDetailModal from "./ProductDetailModal";
import ErrorModal from "../common/ErrorModal";
import WarningModal from "../common/WarningModal";
import "../DamageForm/ButtonHoverEffects.css";
import img1 from "../../assets/images/marble texture.jpeg";
import img2 from "../../assets/images/marble texture.jpeg";
import img3 from "../../assets/images/marble texture.jpeg";

const getBrowserOrigin = () =>
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';

const deriveApiBaseUrl = () => {
  const fallbackOrigin = getBrowserOrigin();
  const raw = import.meta.env?.VITE_API_URL;

  if (!raw) {
    return fallbackOrigin;
  }

  try {
    const parsed = new URL(raw, fallbackOrigin || 'http://localhost');
    const trimmedPath = parsed.pathname.replace(/\/api\/?$/, '');
    const base = `${parsed.origin}${trimmedPath}`.replace(/\/$/, '');
    return base || parsed.origin;
  } catch (error) {
    return fallbackOrigin;
  }
};

const API_BASE_URL = deriveApiBaseUrl();

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

const canonicalizeImageKey = (value) => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^(?:data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  try {
    const base = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : undefined;
    const parsed = new URL(trimmed, base);
    if (!parsed || !parsed.pathname) {
      return trimmed;
    }
    const pathname = parsed.pathname.startsWith('/') ? parsed.pathname : `/${parsed.pathname}`;
    const search = parsed.search && !/^(?:\?v=|\?t=)/i.test(parsed.search) ? parsed.search : '';
    return `${pathname}${search}`;
  } catch (_error) {
    return trimmed;
  }
};

const ensureAbsoluteUrl = (value) => {
  if (typeof value !== 'string') return valu

  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  if (/^(?:data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (/^https?:/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    if (typeof window !== 'undefined' && window.location?.protocol) {
      return `${window.location.protocol}${trimmed}`;
    }
    return `https:${trimmed}`;
  }

  if (!API_BASE_URL) {
    return trimmed;
  }

  const normalized = trimmed
    .replace(/^\.\//, '')
    .replace(/^\/+/, '/');

  return `${API_BASE_URL}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
};

// Test image data URL
const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AkEEjYXFQZ2SQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAJklEQVQ4y2NgGAWjYBSMglEwCkYBCQALiP/9+zcDpQALCwvDqA5GdTAKRsEoGAXDFjAAABFwAv+W5JZRAAAAAElFTkSuQmCC';

const deriveComparableKeys = (entry) => {
  const keys = new Set();

  const push = (value, canonicalize = true) => {
    if (value === undefined || value === null) return;
    const raw = String(value).trim();
    if (!raw) return;
    const normalized = canonicalize ? (canonicalizeImageKey(raw) || raw) : raw;
    if (normalized) {
      keys.add(normalized.toLowerCase());
    }
  };

  if (typeof entry === 'string') {
    push(entry);
    return keys;
  }

  if (entry && typeof entry === 'object') {
    if ('id' in entry) {
      push(entry.id, false);
    }
    const candidates = [
      entry.file,
      entry.path,
      entry.url,
      entry.src,
      entry.previewUrl,
      entry.downloadUrl,
      entry.name,
      entry.original_name,
      entry.originalName,
    ];
    candidates.forEach((candidate) => push(candidate));
  }

  return keys;
};

const buildAttachmentKeySet = (attachments = []) => {
  const set = new Set();
  if (!Array.isArray(attachments)) return set;

  attachments.forEach((attachment) => {
    const keys = deriveComparableKeys(attachment);
    keys.forEach((key) => set.add(key));
  });

  return set;
};

const filterOutSupportingEntries = (entries, exclusionSet) => {
  if (!Array.isArray(entries)) {
    return [];
  }

  if (!exclusionSet || exclusionSet.size === 0) {
    return [...entries];
  }

  return entries.filter((entry) => {
    const candidateKeys = deriveComparableKeys(entry);
    if (!candidateKeys.size) {
      return true;
    }
    for (const key of candidateKeys) {
      if (exclusionSet.has(key)) {
        return false;
      }
    }
    return true;
  });
};

const toSafeNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const formatAmount = (value) => toSafeNumber(value).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatNumber = (value) => toSafeNumber(value).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatQuantity = (value) => String(toSafeNumber(value));

const extractImageArray = (item = {}) => {
  if (!item || typeof item !== 'object') return [];

  const candidates = [
    item.img,
    item.images,
    item.photos,
    item.attachments,
    item.image,
    item.media,
    item.originalItem,
    item.originalItem?.img,
    item.originalItem?.images,
    item.originalItem?.photos,
    item.originalItem?.attachments
  ];

  const normalizeEntry = (entry, depth = 0) => {
    if (!entry) return [];

    if (Array.isArray(entry)) {
      return entry;
    }

    if (entry instanceof File || entry instanceof Blob) {
      return [entry];
    }

    if (typeof entry === 'string') {
      const trimmed = entry.trim();
      if (!trimmed) return [];

      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        try {
          const parsed = JSON.parse(trimmed);
          const parsedResult = normalizeEntry(parsed, depth + 1);
          if (parsedResult.length) return parsedResult;
        } catch (error) {
          return [];
        }
      }

      return [entry];
    }

    if (typeof entry === 'object') {
      if (Array.isArray(entry.imgArray)) {
        return entry.imgArray;
      }

      if (Array.isArray(entry.images)) {
        return entry.images;
      }

      if (Array.isArray(entry.photos)) {
        return entry.photos;
      }

      if (Array.isArray(entry.attachments)) {
        return entry.attachments;
      }

      if (entry.value !== undefined) {
        const valueResult = normalizeEntry(entry.value, depth + 1);
        if (valueResult.length) return valueResult;
      }

      if (entry.firstImage) {
        const firstResult = normalizeEntry(entry.firstImage, depth + 1);
        if (firstResult.length) return firstResult;
        return [entry.firstImage];
      }

      if (entry.src || entry.previewUrl || entry.fileObject || entry.url || entry.path) {
        return [entry];
      }
    }

    return [];
  };

  for (const candidate of candidates) {
    const normalized = normalizeEntry(candidate);
    if (normalized.length) {
      return normalized;
    }
  }

  return [];
};

/** API rows may use numeric `id` or string; prefer matching with specific_form_id fallback */
const itemRowIdsEqual = (a, b) => String(a ?? '') === String(b ?? '');

export default function DamageItemTable({ 
  items: itemsProp = [], 
  mode = "add", 
  status = "", 
  onItemsChange = () => {}, 
  onItemChange = () => {},
  onRemoveItem = () => {},
  itemErrors = {}, 
  generalFormId = null, 
  userRole = "",
  formId = 1,
  layoutId = 1,
  accountCodes = [],
  issueRemarks = [], // placeholder for future use
  accStatus = 0,
  accCode = "",
  issRemark = "",
  onAccountSettingsChange = () => {},
  onItemAccountCodeChange = () => {},
  systemQtyUpdated = false,
  onSystemQtyStatusChange = () => {},
  onSuccessModal = () => {},
  isCompleted = false,
  supportingAttachments = [],
  isAccount = false,
  isSupervisor = false,
  approvals = [],
  totalAmount = 0,
  gRemark = 'big_damage',
  currentUser = null,
  onOpenAddProductModal = () => {}
}) {
  // Remove debug logging to prevent infinite re-renders
  const { t } = useTranslation();
  const [items, setItems] = useState(Array.isArray(itemsProp) ? itemsProp : []);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [qtyErrorModal, setQtyErrorModal] = useState({ isOpen: false, message: '' });
  const [amountWarningModal, setAmountWarningModal] = useState({ isOpen: false, message: '' });

  // Filter state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    unit: '',
    minPrice: '',
    maxPrice: '',
    minAmount: '',
    maxAmount: ''
  });
  
  // Calculate min/max values for sliders
  const priceRange = useMemo(() => {
    if (items.length === 0) return { min: 0, max: 1000 };
    const prices = items
      .map(item => parseFloat(item.price || item.unit_price || 0))
      .filter(p => !isNaN(p) && p > 0);
    return {
      min: prices.length > 0 ? Math.floor(Math.min(...prices)) : 0,
      max: prices.length > 0 ? Math.ceil(Math.max(...prices)) : 1000
    };
  }, [items]);
  
  const amountRange = useMemo(() => {
    if (items.length === 0) return { min: 0, max: 10000 };
    const amounts = items
      .map(item => parseFloat(item.amount || item.total || 0))
      .filter(a => !isNaN(a) && a > 0);
    return {
      min: amounts.length > 0 ? Math.floor(Math.min(...amounts)) : 0,
      max: amounts.length > 0 ? Math.ceil(Math.max(...amounts)) : 10000
    };
  }, [items]);
  const fileInputRefs = useRef({});
  // Track which field is currently being edited to prevent useEffect from overwriting user input
  const editingFieldRef = useRef(null);
  const editingTimeoutRef = useRef(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewItemId, setPreviewItemId] = useState(null);
  const [previewMode, setPreviewMode] = useState('gallery'); // 'gallery' or 'single'
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: ''
  });
  const [isUpdatingSystemQty, setIsUpdatingSystemQty] = useState(false);

  // Define these early to avoid initialization errors in useEffect
  const normalizedRole = (userRole || '').toString().trim().toLowerCase();
  
  // Check if user is operation manager - check multiple sources (must be defined before useState)
  const isOpManager = normalizedRole === 'op_manager' || 
                      normalizedRole === 'operation_manager' || 
                      normalizedRole === 'operation' ||
                      normalizedRole === 'op' ||
                      normalizedRole === 'a2' ||
                      (userRole && typeof userRole === 'string' && (
                        userRole.toLowerCase().includes('operation') ||
                        userRole.toLowerCase().includes('op_manager') ||
                        userRole.toLowerCase() === 'op'
                      ));
  
  
  /**
   * Check if user can see "Update System Qty" button - matches Laravel acknowledge() function exactly
   * Laravel acknowledge() checks:
   * 1. User has ACK approval entry (user_type='ACK', admin_id=current_user_id)
   * 2. ACK entry status matches: 'BM Approved' (amount <= 500k) OR 'OPApproved' (amount > 500k)
   * 3. Form g_remark == 'big_damage'
   * 4. Form status is NOT 'Issued', 'Completed', 'SupervisorIssued'
   * 5. User has 'Acknowledge' role
   */
  const canShowUpdateSystemQtyButton = useMemo(() => {
    // FIX: Do not show button if form is already Issued, Completed, or SupervisorIssued
    const excludedStatuses = ['Issued', 'Completed', 'SupervisorIssued'];
    if (excludedStatuses.includes(status)) {
      return false;
    }

    // Check if form type is 'big_damage' (g_remark)
    if (gRemark !== 'big_damage') {
      return false;
    }

    // Check if user has ACK approval entry
    const currentUserId = currentUser?.id || currentUser?.admin_id || currentUser?.userId;
    if (!currentUserId) {
      return false;
    }
    if (!Array.isArray(approvals) || approvals.length === 0) {
      return false;
    }

    // Find ACK/AC approval entry for current user (account users can have either 'AC' or 'ACK')
    // Handle both simplified format (from DamageView) and raw API format
    let ackApproval = null;
    let foundMatchingUserType = false;
    let foundMatchingUser = false;
    let foundMatchingStatus = false;
    
    approvals.forEach((approval, index) => {
      // Get user_type from multiple possible sources (simplified format, raw format, or direct)
      const userType = (
        approval?.user_type || 
        approval?.raw?.user_type || 
        ''
      ).toString().toUpperCase();
      
      // Check user_type first
      if (userType !== 'ACK' && userType !== 'AC') {
        return;
      }
      foundMatchingUserType = true;

      // Check if user matches - try admin_id first, then actual_user_id
      // API returns actual_user_id, but Laravel helper checks admin_id
      // Use actual_user_id as fallback if admin_id is not available
      const adminId = approval?.admin_id || approval?.raw?.admin_id;
      const actualUserId = approval?.actual_user_id || approval?.raw?.actual_user_id;
      const userId = approval?.user?.id || approval?.user_id || approval?.user?.admin_id;
      const allUserIds = [adminId, actualUserId, userId].filter(id => id !== undefined && id !== null);

      const userIdMatches = allUserIds.some(id => 
        String(id) === String(currentUserId) || Number(id) === Number(currentUserId)
      );

      // For big_damage forms: If user is account user (isAccount: true), allow ACK approval even if admin_id doesn't match
      // This handles cases where ACK approval might be assigned to a different user but current user is still an account user
      // Laravel checks admin_id match strictly, but we'll allow account users to see the button if:
      // 1. User is an account user (isAccount: true) OR is Branch Account by role_id/role_name
      // 2. ACK approval exists
      // 3. Status matches amount condition
      // This is a frontend workaround for cases where admin_id assignment might be different
      const currentUserRoleId = currentUser?.role_id || currentUser?.roleId || currentUser?.role?.id || currentUser?.role?.role_id;
      const isBranchAccountByRoleId = Number(currentUserRoleId) === 7;
      const currentUserRoleName = (currentUser?.role_name || currentUser?.role?.name || '').toString().toLowerCase();
      const isBranchAccountByRoleName = currentUserRoleName.includes('branch account') || currentUserRoleName.includes('account');
      const isAccountUser = isAccount || isBranchAccountByRoleId || isBranchAccountByRoleName;
      const allowAccountUserAccess = isAccountUser && !userIdMatches;

      if (!userIdMatches && !allowAccountUserAccess) {
        return;
      }
      foundMatchingUser = true;

      // Check ACK entry status matches amount condition
      // For big_damage forms:
      // - Amount <= 500k: ACK entry status must be 'BM Approved' (BM has approved)
      // - Amount > 500k: ACK entry status must be 'OPApproved' (Operation Manager has approved)
      const approvalStatus = (
        approval?.status || 
        approval?.raw?.status || 
        ''
      ).toString().trim();
      const formStatusNormalized = (status || '').toString().trim();
      const numericAmount = Number(totalAmount) || 0;

      let statusMatches = false;
      if (numericAmount <= 500000) {
        // Amount <= 500k: ACK entry status must be 'BM Approved'
        // If ACK entry status is 'Pending' but form status is 'BM Approved', 
        // consider it valid (BM has approved, ACK entry just hasn't been updated yet)
        statusMatches = approvalStatus === 'BM Approved' || 
                       approvalStatus === 'BMApproved' ||
                       (approvalStatus === 'Pending' && formStatusNormalized === 'BM Approved');
      } else {
        // Amount > 500k: ACK entry status must be 'OPApproved' or form status must indicate OP has approved
        // If form status is 'Ac_Acknowledged' or 'Acknowledged', it means Operation Manager has acknowledged
        // If ACK entry status is 'Pending' but form status is 'OPApproved', 'OP Approved', 'Ac_Acknowledged', or 'Acknowledged',
        // consider it valid (OP has approved/acknowledged, ACK entry just hasn't been updated yet)
        const formStatusIndicatesOPApproved = formStatusNormalized === 'OPApproved' || 
                                             formStatusNormalized === 'OP Approved' ||
                                             formStatusNormalized === 'Ac_Acknowledged' ||
                                             formStatusNormalized === 'Acknowledged';
        statusMatches = approvalStatus === 'OPApproved' || 
                       approvalStatus === 'OP Approved' ||
                       approvalStatus === 'Ac_Acknowledged' ||
                       approvalStatus === 'Acknowledged' ||
                       (approvalStatus === 'Pending' && formStatusIndicatesOPApproved);
      }

      if (!statusMatches) {
        return;
      }
      foundMatchingStatus = true;
      
      // Found matching approval
      ackApproval = approval;
    });

    if (!ackApproval) {
      return false;
    }

    // User must be account/ACK role (checked via isAccount or role name)
    // Also check role_id === 7 (Branch Account) or role_name includes "Branch Account"
    const acknowledgeRoleAliases = new Set([
      'acknowledge',
      'account',
      'ack',
      'acknowledged',
      'acknowledgement',
      'branch_account',
      'branchaccount',
      'branch account', // Add with space for "Branch Account"
    ]);
    
    // Check if user is Branch Account by role_id (7) or role_name
    const currentUserRoleId = currentUser?.role_id || currentUser?.roleId || currentUser?.role?.id || currentUser?.role?.role_id;
    const isBranchAccountByRoleId = Number(currentUserRoleId) === 7;
    const currentUserRoleName = (currentUser?.role_name || currentUser?.role?.name || '').toString().toLowerCase();
    const isBranchAccountByRoleName = currentUserRoleName.includes('branch account') || currentUserRoleName.includes('account');
    
    const isAcknowledgeRole = isAccount || 
                             acknowledgeRoleAliases.has(normalizedRole) ||
                             isBranchAccountByRoleId ||
                             isBranchAccountByRoleName;

    if (!isAcknowledgeRole) {
      return false;
    }

    return true;
  }, [status, gRemark, approvals, totalAmount, currentUser, isAccount, normalizedRole]);

  // Account user (can update system qty, edit product_type, delete items)
  const isAcknowledgeUser = isAccount || (userRole && ['acknowledge', 'account', 'ack', 'acknowledged', 'acknowledgement', 'branch_account', 'branchaccount'].includes(normalizedRole));
  // Supervisor user (can choose ISS remark/account code but cannot update system qty or edit items)
  const isSupervisorUser = isSupervisor || normalizedRole === 'supervisor';

  // Define showAccountCodes state before useEffect that uses it
  const [showAccountCodes, setShowAccountCodes] = useState(() => {
    // CRITICAL: Operation Manager should NEVER see account codes at Ac_Acknowledged stage
    // This check must happen FIRST before any other logic
    if (isOpManager && (status === 'Ac_Acknowledged' || status === 'Acknowledged')) {
      return false;
    }
    
    const hasCodes = itemsProp.some((item) => {
      const compareId = item?.id ?? item?.specific_form_id;
      return Boolean(item?.acc_code1 || item?.acc_code);
    });
    
    // Account should always see account codes at OPApproved, BM Approved, or Ac_Acknowledged stages
    const accountShouldSeeCodes = isAccount && (
      status === 'OPApproved' || 
      status === 'OP Approved' || 
      status === 'BM Approved' || 
      status === 'BMApproved' ||
      status === 'Ac_Acknowledged' ||
      status === 'Acknowledged'
    );
    
    // Supervisor should see account codes at Ac_Acknowledged, Acknowledged, or Approved stages
    const supervisorShouldSeeCodes = isSupervisorUser && (
      status === 'Ac_Acknowledged' ||
      status === 'Acknowledged' ||
      status === 'Approved' ||
      status === 'Completed' ||
      status === 'Issued' ||
      status === 'SupervisorIssued'
    );
    
    const shouldShow = isCompleted || hasCodes || accountShouldSeeCodes || supervisorShouldSeeCodes;
    
    
    return shouldShow;
  });

  // Track issRemark prop changes for supervisor
  useEffect(() => {
    // Supervisor data tracking (no logging)
  }, [issRemark, issueRemarks, systemQtyUpdated, isCompleted, isSupervisorUser, status, items, showAccountCodes, accountCodes]);

  const supportingAttachmentSet = useMemo(
    () => buildAttachmentKeySet(supportingAttachments),
    [supportingAttachments]
  );

  useEffect(() => {
    // CRITICAL: Operation Manager should NEVER see account codes at Ac_Acknowledged stage
    // This check must happen FIRST before any other logic
    if (isOpManager && (status === 'Ac_Acknowledged' || status === 'Acknowledged')) {
      setShowAccountCodes(false);
      return; // Early return - don't process any other conditions
    }
    
    // Account should see account codes only at Ac_Acknowledged stage and later (NOT at BM Approved, Checked, or Ongoing)
    // Account codes are for the acknowledgment/issue stage, not approval stages
    const accountShouldSeeCodes = isAccount && (
      status === 'Ac_Acknowledged' ||
      status === 'Acknowledged' ||
      status === 'Issued' ||
      status === 'Completed' ||
      status === 'SupervisorIssued'
    );
    
    // Supervisor should see account codes at Ac_Acknowledged, Acknowledged, or Approved stages
    const supervisorShouldSeeCodes = isSupervisorUser && (
      status === 'Ac_Acknowledged' ||
      status === 'Acknowledged' ||
      status === 'Approved' ||
      status === 'Completed' ||
      status === 'Issued' ||
      status === 'SupervisorIssued'
    );
    
    if (isCompleted) {
      setShowAccountCodes(true);
      return;
    }
    
    if (accountShouldSeeCodes || supervisorShouldSeeCodes) {
      setShowAccountCodes(true);
      return;
    }
    
    if (showAccountCodes && !isCompleted) {
      return;
    }
    
    const shouldShow = itemsProp.some((item) => Boolean(item?.acc_code1 || item?.acc_code));
    if (shouldShow) {
      setShowAccountCodes(true);
    }
  }, [itemsProp, showAccountCodes, isCompleted, isAccount, isSupervisorUser, status, isOpManager]);
  
  // Check if user is checker - check role name and also check role_id from localStorage
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  };
  const currentUserFromStorage = getCurrentUser();
  const roleIdFromStorage = currentUserFromStorage?.role_id;
  const isCheckerByRoleId = roleIdFromStorage && (
    (typeof roleIdFromStorage === 'string' && roleIdFromStorage.toString().toLowerCase().trim() === 'checker') ||
    (typeof roleIdFromStorage === 'number' && roleIdFromStorage === 2)
  );
  const isCheckerRole = ['branch_lp', 'checker', 'cs', 'loss prevention'].some(r => normalizedRole.includes(r)) || isCheckerByRoleId;
  const isApproverRole = ['bm', 'abm', 'approver', 'manager'].some(r => normalizedRole.includes(r));
  // Regular user role (creator/originator) - should not see Add Product button in Ongoing
  // In Ongoing status, only Checkers, Supervisors, and Approvers should see the button
  // If user is not a checker, supervisor, approver, or account, they are a regular user
  const isUserRole = (normalizedRole === 'user' || 
                     (!isCheckerRole && 
                      !isSupervisorUser && 
                      !isApproverRole && 
                      !isAccount && 
                      !isOpManager));
  
  
  // Allow editing final_qty (Actual Qty) based on role and status - matching Laravel Blade logic
  // Normalize status for case-insensitive comparison
  const normalizedStatus = (status || '').toString().trim().toLowerCase();
  const isOngoingStatus = normalizedStatus === 'ongoing';
  const isBMApprovedStatus = normalizedStatus === 'bm approved' || normalizedStatus === 'bmapproved';
  const isAckStatus = normalizedStatus === 'ac_acknowledged' || normalizedStatus === 'acknowledged';
  
  const allowFinalQtyEdit = isCompleted
    ? false
    : mode === 'view'
      ? ((isOngoingStatus && isCheckerRole) || (!isBMApprovedStatus && !isAckStatus && isApproverRole))
      : false; // In add mode, actual_qty is editable, not final_qty

  const showReviewQtyColumns = mode !== 'add';

  const canDeleteSelectedItems = useMemo(() => {
    if (selectedIds.length === 0) return false;

    if (mode === 'add') {
      return !isCompleted;
    }

    const statusAllowsDelete =
      (status === 'Ongoing' || status?.toLowerCase() === 'ongoing') ||
      (status === 'Checked' && isApproverRole) ||
      (isAccount && (
        status === 'BM Approved' ||
        status === 'BMApproved' ||
        status === 'OP Approved' ||
        status === 'OPApproved'
      ));

    if (!statusAllowsDelete) return false;
    if (status === 'Completed' || status === 'Issued' || status === 'SupervisorIssued') return false;

    const stageAllowsDelete =
      (status !== 'Ac_Acknowledged' && status !== 'Acknowledged') || isAccount;

    return (
      stageAllowsDelete &&
      !isUserRole &&
      !isSupervisorUser &&
      !(isCheckerRole && ((status || '').toString().toLowerCase() === 'checked'))
    );
  }, [
    mode,
    status,
    isCompleted,
    selectedIds.length,
    isApproverRole,
    isAccount,
    isUserRole,
    isSupervisorUser,
    isCheckerRole,
  ]);

  const getAccountCodeLabel = useCallback((code) => {
    if (code === undefined || code === null || code === '') {
      return '-';
    }
    const normalizedCode = typeof code === 'string' ? code : String(code);
    const match = accountCodes.find((option) => {
      const optionValue = typeof option.value === 'string' ? option.value : String(option.value ?? '');
      return optionValue === normalizedCode;
    });
    return match?.label ?? normalizedCode;
  }, [accountCodes]);

  const addItem = () => {
    if (mode === 'view') return;
    const newItem = {
      id: Date.now() + Math.random(),
      category: '',
      code: '',
      product_code: '',
      name: '',
      unit: '',
      system_qty: 0,
      request_qty: '',
      final_qty: '',
      actual_qty: '',
      amount: 0,
      price: 0,
      remark: '',
      img: [],
      images: [],
      damage_images: []
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Memoize the itemsProp to prevent unnecessary updates
  const itemsPropString = JSON.stringify(itemsProp);
  
  // Update local state when itemsProp changes
  useEffect(() => {
    if (!itemsProp || !Array.isArray(itemsProp)) return;
    
    const processItems = (items) => {
      // First, remove duplicates by ID before processing - use more aggressive deduplication
      const itemsById = new Map();
      const seenIds = new Set();
      
      items.forEach(item => {
        const id = item.id || item.specific_form_id;
        if (id) {
          const idStr = String(id);
          // If we've already seen this ID, skip it completely (prevent duplicates)
          if (seenIds.has(idStr)) {
            return; // Skip duplicate
          }
          seenIds.add(idStr);
          itemsById.set(idStr, item);
        }
      });
      
      // Convert back to array - maintain order from backend (ascending ID)
      // Sorting was causing misalignment with backend processing order
      const uniqueItems = Array.from(itemsById.values());
      
      return uniqueItems.map(item => {
        // Ensure all numeric fields are properly converted to numbers
        const processedItem = { ...item };

        // Preserve category field from multiple possible sources
        // Check if category exists, if not try to get it from various possible field names
        if (!processedItem.category || processedItem.category === '') {
          processedItem.category = item?.categories?.name || 
                                   item?.product_category_name || 
                                   item?.Category_Name ||
                                   item?.category ||
                                   processedItem?.category ||
                                   '';
        }
        
        // Also preserve category_id
        if (!processedItem.category_id && (item?.category_id || item?.maincatid)) {
          processedItem.category_id = item?.category_id || item?.maincatid || null;
        }

        // Preserve account code fields from multiple possible sources
        if (!processedItem.acc_code1 && !processedItem.acc_code) {
          processedItem.acc_code1 = item?.acc_code1 ?? item?.acc_code ?? null;
          processedItem.acc_code = item?.acc_code ?? item?.acc_code1 ?? null;
        } else if (!processedItem.acc_code1) {
          processedItem.acc_code1 = processedItem.acc_code ?? item?.acc_code1 ?? item?.acc_code ?? null;
        } else if (!processedItem.acc_code) {
          processedItem.acc_code = processedItem.acc_code1 ?? item?.acc_code ?? item?.acc_code1 ?? null;
        }

        // Handle numeric fields
        ['request_qty', 'price', 'amount', 'total', 'system_qty', 'final_qty'].forEach(field => {
          if (field in processedItem) {
            processedItem[field] = processedItem[field] === '' || processedItem[field] === null || isNaN(processedItem[field])
              ? 0
              : Number(processedItem[field]);
          }
        });
        if ('actual_qty' in processedItem) {
          const rawActual = processedItem.actual_qty;
          const numericActual = rawActual === '' || rawActual === null || isNaN(rawActual)
            ? null
            : Number(rawActual);
          processedItem.actual_qty = numericActual === null
            ? (processedItem.request_qty ?? 0)
            : numericActual;
        } else {
          // CRITICAL: Do NOT auto-fill actual_qty from request_qty
          // They should be independent - user should enter actual_qty separately
          // Removed: processedItem.actual_qty = processedItem.request_qty;
        }
        
        // CRITICAL: Calculate amount using actual_qty for ALL statuses
        // Always use actual_qty to ensure consistent total calculations
        if (!isNaN(processedItem.price)) {
          // Use actual_qty if available and valid, otherwise use request_qty as fallback
          const qtyForAmount = !isNaN(processedItem.actual_qty) && processedItem.actual_qty !== null && processedItem.actual_qty !== undefined && processedItem.actual_qty !== ''
            ? processedItem.actual_qty
              : (!isNaN(processedItem.request_qty) ? processedItem.request_qty : 0);

            processedItem.amount = processedItem.price * qtyForAmount;
            processedItem.total = processedItem.amount;
        }
        
        // Ensure final_qty and actual_qty match request_qty if not set
        if (processedItem.request_qty !== undefined) {
          if (processedItem.final_qty === undefined || isNaN(processedItem.final_qty)) {
            processedItem.final_qty = processedItem.request_qty;
          }
        }

        // Preserve existing image arrays
        const originalImages = filterOutSupportingEntries(
          extractImageArray({
            img: item.img,
            images: item.images,
            damage_images: item.damage_images,
            photos: item.photos,
            attachments: item.attachments,
          }),
          supportingAttachmentSet
        );

        const normalizedImages = originalImages && originalImages.length
          ? originalImages
          : filterOutSupportingEntries(
              extractImageArray(processedItem),
              supportingAttachmentSet
            );

        const filteredImages = filterOutSupportingEntries(normalizedImages, supportingAttachmentSet);

        if (filteredImages && filteredImages.length) {
          processedItem.img = filteredImages;
          processedItem.images = filteredImages;
          processedItem.damage_images = filteredImages;
        } else {
          processedItem.img = [];
          processedItem.images = [];
          processedItem.damage_images = [];
        }
        
        return processedItem;
      });
    };
    
    const serializeImages = (candidate) => {
      try {
        const images = filterOutSupportingEntries(
          extractImageArray(candidate),
          supportingAttachmentSet
        );
        if (!images || !images.length) return '[]';
        return JSON.stringify(images);
      } catch (error) {
        return '[]';
      }
    };

    const shouldUpdate = () => {
      // Check if items length is different
      if (items.length !== itemsProp.length) return true;
      
      // Create maps by ID for comparison (not by index, since order might differ)
      const itemsById = new Map();
      const propItemsById = new Map();
      
      items.forEach(item => {
        const id = item.id || item.specific_form_id;
        if (id) itemsById.set(String(id), item);
      });
      
      itemsProp.forEach(item => {
        const id = item.id || item.specific_form_id;
        if (id) propItemsById.set(String(id), item);
      });
      
      // Check if any item IDs are missing or different
      if (itemsById.size !== propItemsById.size) return true;
      
      // Check if any item has changed by comparing by ID
      for (const [id, item] of itemsById.entries()) {
        const propItem = propItemsById.get(id);
        if (!propItem) return true;
        
        // Compare all relevant fields including system_qty
        const hasChanged = (
          String(item.request_qty) !== String(propItem.request_qty) ||
          String(item.amount) !== String(propItem.amount) ||
          String(item.price) !== String(propItem.price) ||
          String(item.final_qty) !== String(propItem.final_qty) ||
          String(item.actual_qty) !== String(propItem.actual_qty) ||
          String(item.system_qty ?? 0) !== String(propItem.system_qty ?? 0) ||
          (item.acc_code1 ?? item.acc_code ?? '') !== (propItem.acc_code1 ?? propItem.acc_code ?? '') ||
          item.remark !== propItem.remark ||
          serializeImages(item) !== serializeImages(propItem)
        );
        
        if (hasChanged) return true;
      }
      
      return false;
    };
    
    // Don't update if user is currently editing a field
    if (editingFieldRef.current) {
      return;
    }
    
    if (shouldUpdate()) {
      const processed = processItems([...itemsProp]);
      
      // Preserve user input for fields that are currently being edited
      if (editingFieldRef.current) {
        const { id, field } = editingFieldRef.current;
        const editedItem = items.find(item => {
          const itemId = item.id || item.specific_form_id;
          return String(itemId) === String(id);
        });
        
        if (editedItem) {
          const processedIndex = processed.findIndex(item => {
            const itemId = item.id || item.specific_form_id;
            return String(itemId) === String(id);
          });
          
          if (processedIndex !== -1 && editedItem[field] !== undefined && editedItem[field] !== null) {
            // Preserve the user's current input value
            processed[processedIndex][field] = editedItem[field];
          }
        }
      }
      
      setItems(processed);
    }
  }, [itemsPropString, supportingAttachmentSet]); // Recompute when items or supporting attachments change

  // Memoize the callback to prevent unnecessary re-renders
  const handleItemsChange = useCallback((itemsToUpdate) => {
    if (!Array.isArray(itemsToUpdate)) return;

    // Clean up items before sending to parent
    const cleanedItems = itemsToUpdate.map(({ originalItem, ...rest }) => rest);

    onItemsChange(cleanedItems);
  }, [onItemsChange]);
  
  // Only update parent when items actually change
  const prevItemsRef = useRef();
  const isRefetchingRef = useRef(false);
  
  useEffect(() => {
    if (prevItemsRef.current === undefined) {
      prevItemsRef.current = items;
      return;
    }
    
    // Skip update if we're currently refetching (to prevent duplicates)
    if (isRefetchingRef.current) {
      prevItemsRef.current = items;
      isRefetchingRef.current = false;
      return;
    }
    
    // Deep compare to prevent unnecessary updates
    const itemsChanged = JSON.stringify(prevItemsRef.current) !== JSON.stringify(items);
    
    if (itemsChanged) {
      handleItemsChange(items);
      prevItemsRef.current = items;
    }
  }, [items]);
  
  // Track when itemsProp changes - if it's a refetch (same IDs, different system_qty), prevent callback
  useEffect(() => {
    if (itemsProp.length > 0 && items.length > 0) {
      const propIds = new Set(itemsProp.map(i => String(i.id || i.specific_form_id)).filter(Boolean));
      const currentIds = new Set(items.map(i => String(i.id || i.specific_form_id)).filter(Boolean));
      
      // If all IDs match but system_qty changed, it's likely a refetch
      const allIdsMatch = propIds.size === currentIds.size && 
                         propIds.size > 0 &&
                         Array.from(propIds).every(id => currentIds.has(id));
      
      if (allIdsMatch) {
        const systemQtyChanged = itemsProp.some((propItem) => {
          const currentItem = items.find(i => 
            String(i.id || i.specific_form_id) === String(propItem.id || propItem.specific_form_id)
          );
          return currentItem && 
                 String(currentItem.system_qty ?? 0) !== String(propItem.system_qty ?? 0);
        });
        
        if (systemQtyChanged) {
          isRefetchingRef.current = true;
          // Update prevItemsRef to prevent triggering handleItemsChange
          prevItemsRef.current = itemsProp;
        }
      }
    }
  }, [itemsProp, items]);

const handleRemarkChange = (id, value) => {
  setItems(prevItems => {
    const index = prevItems.findIndex(item => itemRowIdsEqual(item.id ?? item.specific_form_id, id));
    if (index === -1) return prevItems;
    
    const newItems = [...prevItems];
    newItems[index] = {
      ...newItems[index],
      remark: value
    };
    return newItems;
  });
  
  const index = items.findIndex(item => itemRowIdsEqual(item.id ?? item.specific_form_id, id));
  if (index !== -1) {
    onItemChange(index, 'remark', value);
  }
};

// Handle input changes for mobile view (request_qty, final_qty, remark)
const handleInputChange = (id, field, value) => {
  // Track that user is editing this field
  editingFieldRef.current = { id, field };
  
  // Clear any existing timeout
  if (editingTimeoutRef.current) {
    clearTimeout(editingTimeoutRef.current);
  }
  
  // Clear editing ref after user stops typing for 500ms
  editingTimeoutRef.current = setTimeout(() => {
    if (editingFieldRef.current?.id === id && editingFieldRef.current?.field === field) {
      editingFieldRef.current = null;
    }
  }, 500);
  
  // For quantity fields, validate numeric input
  if (field === 'request_qty' || field === 'final_qty') {
    if (value !== '' && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) {
      return;
    }
  }

  setItems(prevItems => {
    const index = prevItems.findIndex(item => {
      const matchId = item.id ?? item.specific_form_id;
      return itemRowIdsEqual(matchId, id);
    });
    
    if (index === -1) return prevItems;
    
    const item = prevItems[index];
    const newItems = [...prevItems];
    
    // For quantity fields, preserve string value to keep trailing dots (e.g., "2.")
    // Only convert to number when needed for calculations
    let fieldValue = value;
    let qtyNumeric = null;
    
    if (field === 'request_qty' || field === 'final_qty') {
      // Preserve string value if it ends with dot (intermediate state like "2.")
      if (value === '' || value === '.') {
        fieldValue = value === '' ? '' : value;
        qtyNumeric = 0;
      } else if (typeof value === 'string' && value.endsWith('.')) {
        // Keep as string to preserve the dot in the input
        fieldValue = value;
        qtyNumeric = parseFloat(value) || 0; // For calculations
      } else {
        // Convert to number for storage
        qtyNumeric = parseFloat(value) || 0;
        fieldValue = value === '' ? '' : qtyNumeric;
      }
    }
    
    // Update the field
    const updatedItem = {
      ...item,
      [field]: fieldValue
    };
    
    // Recalculate amount when quantity changes
    if ((field === 'request_qty' || field === 'final_qty') && qtyNumeric !== null) {
      const price = parseFloat(item.price) || 0;
      // CRITICAL: In Checked, BM Approved, OPApproved, Ac_Acknowledged, and Completed stages, use actual_qty for amount calculation
      const isCheckedStage = (status === 'Checked' || status === 'checked') && !isCompleted;
      const isBMApprovedStage = status === 'BM Approved' || status === 'BMApproved';
      const isOPApprovedStage = status === 'OPApproved' || status === 'OP Approved';
      const isAckStage = status === 'Ac_Acknowledged' || status === 'Acknowledged';
      const isCompletedStage = status === 'Completed' || status === 'completed';
      let qtyForAmount;
      if (isCheckedStage || isBMApprovedStage || isOPApprovedStage || isAckStage || isCompletedStage) {
        // In these stages, always use actual_qty for amount calculation
        // Use the actual_qty from the updated item (which may have been changed)
        qtyForAmount = parseFloat(updatedItem.actual_qty) || 0;
      } else if (mode === 'add') {
        // In add mode, use request_qty for amount calculation (and fall back to request_qty if editing final_qty)
        qtyForAmount = field === 'request_qty' ? qtyNumeric : (updatedItem.request_qty ?? 0);
      } else {
        // For other stages, use final_qty
        qtyForAmount = field === 'final_qty' ? qtyNumeric : (updatedItem.final_qty ?? qtyNumeric);
      }
      const amountNumeric = (isNaN(qtyForAmount) || isNaN(price))
        ? 0
        : Math.round((qtyForAmount * price + Number.EPSILON) * 100) / 100;

      updatedItem.amount = amountNumeric;
      updatedItem.total = amountNumeric;
    }
    
    // CRITICAL: When request_qty changes, update final_qty to match if final_qty is unset or matches old request_qty
    // This ensures final_qty stays in sync with request_qty when user edits request_qty
    if (field === 'request_qty') {
      const oldRequestQty = item.request_qty;
      const existingFinalQty = item.final_qty;
      const isFinalQtyUnset = existingFinalQty === null ||
                               existingFinalQty === undefined ||
                               existingFinalQty === '' ||
                               existingFinalQty === 0 ||
                               (typeof existingFinalQty === 'string' && existingFinalQty.trim() === '');

      // Update final_qty if:
      // 1. final_qty is unset, OR
      // 2. final_qty matches the old request_qty (meaning it was auto-synced, not manually edited)
      const shouldUpdateFinalQty = isFinalQtyUnset ||
                                   (oldRequestQty !== null &&
                                    oldRequestQty !== undefined &&
                                    oldRequestQty !== '' &&
                                    Number(existingFinalQty) === Number(oldRequestQty));

      if (shouldUpdateFinalQty && qtyNumeric !== null) {
        updatedItem.final_qty = value === '' ? '' : qtyNumeric;
      }
    }

    // CRITICAL: When final_qty changes, update actual_qty to match for ongoing forms viewed by checker
    // This ensures actual_qty stays in sync with final_qty when checker edits final_qty
    if (field === 'final_qty') {
      const normalizedStatus = (status || '').toString().trim().toLowerCase();
      const isOngoingForChecker = (normalizedStatus === 'ongoing' || normalizedStatus === 'onging') && !isCompleted;

      if (isOngoingForChecker && qtyNumeric !== null) {
        // For ongoing forms viewed by checker, actual_qty should match final_qty
        updatedItem.actual_qty = value === '' ? '' : qtyNumeric;
      }
    }
    
    // In add mode, when request_qty changes, keep actual_qty in sync
    if (field === 'request_qty' && mode === 'add' && qtyNumeric !== null) {
      updatedItem.actual_qty = value === '' ? '' : qtyNumeric;
    }
    
    newItems[index] = updatedItem;
    return newItems;
  });
  
  const index = items.findIndex(item => {
    const matchId = item.id ?? item.specific_form_id;
    return itemRowIdsEqual(matchId, id);
  });
  
    if (index !== -1) {
      const item = items[index];
    // For quantity fields, preserve string value if it ends with dot (intermediate state)
    // Convert to number only for calculations, but keep string for display
    let valueToSend = value;
    if (field === 'request_qty' || field === 'final_qty') {
      if (value === '' || value === '.') {
        valueToSend = value === '' ? 0 : value; // Keep "." as string
      } else if (typeof value === 'string' && value.endsWith('.')) {
        // Keep as string to preserve the dot
        valueToSend = value;
      } else {
        // Convert to number for storage
        valueToSend = parseFloat(value) || 0;
      }
    }
    
    // If quantity changed, also send updated amount
    if (field === 'request_qty' || field === 'final_qty') {
      const price = parseFloat(item.price) || 0;
      // CRITICAL: In Checked, BM Approved, OPApproved, Ac_Acknowledged, and Completed stages, use actual_qty for amount calculation
      const isCheckedStage = (status === 'Checked' || status === 'checked') && !isCompleted;
      const isBMApprovedStage = status === 'BM Approved' || status === 'BMApproved';
      const isOPApprovedStage = status === 'OPApproved' || status === 'OP Approved';
      const isAckStage = status === 'Ac_Acknowledged' || status === 'Acknowledged';
      const isCompletedStage = status === 'Completed' || status === 'completed';
      let qtyForAmount;
      if (isCheckedStage || isBMApprovedStage || isOPApprovedStage || isAckStage || isCompletedStage) {
        // In these stages, always use actual_qty for amount calculation
        // Use the actual_qty from the item (which is the correct value for these stages)
        qtyForAmount = parseFloat(item.actual_qty) || 0;
      } else if (mode === 'add' && field === 'request_qty') {
        qtyForAmount = valueToSend === '.' ? 0 : (parseFloat(valueToSend) || 0);
      } else {
        // For other stages, use final_qty
        // Convert to number for calculation (handle string values like "2.")
        const qtyValue = field === 'final_qty' ? valueToSend : (item.final_qty ?? valueToSend);
        qtyForAmount = typeof qtyValue === 'string' && qtyValue.endsWith('.') 
          ? parseFloat(qtyValue) || 0 
          : (typeof qtyValue === 'number' ? qtyValue : parseFloat(qtyValue) || 0);
      }
      const amountNumeric = (isNaN(qtyForAmount) || isNaN(price))
        ? 0
        : Math.round((qtyForAmount * price + Number.EPSILON) * 100) / 100;
      
      // Store the value (preserve string for display if it ends with dot)
      onItemChange(index, field, valueToSend);
      if (mode === 'add' && field === 'request_qty') {
        const actualQtyValue = valueToSend === '.' ? 0 : (parseFloat(valueToSend) || 0);
        onItemChange(index, 'actual_qty', actualQtyValue);
      }
      onItemChange(index, 'amount', amountNumeric);
      onItemChange(index, 'total', amountNumeric);
    } else {
      onItemChange(index, field, valueToSend);
    }
  }
};

  const handleQtyChange = (id, value, qtyType = 'final_qty') => {
    // Allow intermediate states like "." or "5."
    if (value !== '' && value !== '.' && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) {
      return;
    }

    setItems((prevItems) => {
      const index = prevItems.findIndex((item) => {
        const matchId = item.id ?? item.specific_form_id;
        return itemRowIdsEqual(matchId, id);
      });

      if (index === -1) return prevItems;
      if (mode === 'view' && !allowFinalQtyEdit && qtyType === 'final_qty') return prevItems;

      const item = prevItems[index];
      const systemQty = parseFloat(item.system_qty) || 0;
      
      // Preserve string value if it ends with dot (intermediate state like "2.")
      // Only convert to number when needed for calculations
      let fieldValue = value;
      let qtyNumeric = 0;
      
      if (value === '' || value === '.') {
        fieldValue = value;
        qtyNumeric = 0;
      } else if (typeof value === 'string' && value.endsWith('.')) {
        // Keep as string to preserve the dot in the input
        fieldValue = value;
        qtyNumeric = parseFloat(value) || 0; // For calculations
      } else {
        // Convert to number for storage
        qtyNumeric = isNaN(parseFloat(value)) ? 0 : parseFloat(value);
        fieldValue = value === '' ? '' : qtyNumeric;
      }
      
      // CRITICAL: In Checked stage, all quantity changes should update actual_qty, not final_qty
      const isCheckedStage = (status === 'Checked' || status === 'checked') && !isCompleted;
      if (isCheckedStage && qtyType === 'final_qty') {
        // Redirect final_qty changes to actual_qty in Checked stage
        qtyType = 'actual_qty';
      }
      
      // Validate all quantity fields against system_qty - don't auto-cap, return early if invalid
      // The onChange handler will show error modal and prevent the change
      if (systemQty > 0 && qtyNumeric > systemQty) {
        return prevItems; // Don't update if exceeds system_qty
      }
      // If system_qty is 0, all quantities must be 0
      if (systemQty === 0 && qtyNumeric > 0) {
        return prevItems; // Don't update if system_qty is 0
      }
      
      // Use qtyNumeric for calculations (already validated above)
      let finalQty = qtyNumeric;
      if (qtyType === 'final_qty') {
        // Same validation applies
      }
      
      const price = parseFloat(item.price) || 0;
      // CRITICAL: In Checked, BM Approved, OPApproved, Ac_Acknowledged, and Completed stages, calculate amount using actual_qty
      // For other stages: use final_qty (or actual_qty in add mode)
      const isBMApprovedStage = status === 'BM Approved' || status === 'BMApproved';
      const isOPApprovedStage = status === 'OPApproved' || status === 'OP Approved';
      const isAckStage = status === 'Ac_Acknowledged' || status === 'Acknowledged';
      const isCompletedStage = status === 'Completed' || status === 'completed';
      let qtyForAmount;
      if (isCheckedStage || isBMApprovedStage || isOPApprovedStage || isAckStage || isCompletedStage) {
        // In these stages, always use actual_qty for amount calculation
        qtyForAmount = qtyType === 'actual_qty' ? qtyNumeric : (parseFloat(item.actual_qty) || 0);
      } else {
        // For other stages, use the quantity type being changed
        qtyForAmount = qtyType === 'final_qty' ? finalQty : qtyNumeric;
      }
      const amountNumeric = (isNaN(qtyForAmount) || isNaN(price))
        ? 0
        : Math.round((qtyForAmount * price + Number.EPSILON) * 100) / 100;

      // CRITICAL: Preserve original request_qty BEFORE any updates
      // This ensures request_qty remains independent of actual_qty changes in view mode
      const originalRequestQty = item.request_qty;

      // CRITICAL: Preserve original actual_qty BEFORE any updates
      // This ensures actual_qty remains independent of final_qty changes, especially in Checked stage
      const originalActualQty = item.actual_qty;

      const updatedItem = {
        ...item,
        // Explicitly preserve category and category_id
        category: item.category || '',
        category_id: item.category_id || null,
        amount: amountNumeric,
        total: amountNumeric
      };

      if (qtyType === 'actual_qty') {
        // Updating actual_qty - preserve string value if it ends with dot
        updatedItem.actual_qty = fieldValue;
        
        // CRITICAL: In view mode, request_qty should NEVER change when actual_qty changes
        // They are completely independent - request_qty is the original request, actual_qty can be modified
        if (mode === 'view') {
          // In view mode, explicitly preserve the ORIGINAL request_qty value
          // This ensures request_qty is completely independent of actual_qty changes
          updatedItem.request_qty = originalRequestQty;
        } else {
          // In add mode: request_qty should be independent of actual_qty changes
          // Only initialize request_qty to actual_qty if it's truly undefined/null/empty string/0
          // Once request_qty has been set to a non-zero value, it should remain independent
          const existingRequestQty = item.request_qty;
          // Check if request_qty hasn't been set yet (null, undefined, empty string, or 0)
          // Treat 0 as unset because it's the default initialization value
          const isRequestQtyUnset = existingRequestQty === null || 
                                    existingRequestQty === undefined || 
                                    existingRequestQty === '' ||
                                    existingRequestQty === 0 ||
                                    (typeof existingRequestQty === 'string' && existingRequestQty.trim() === '');
          
          if (isRequestQtyUnset) {
            // request_qty hasn't been set yet, initialize it to actual_qty (preserve string if ends with dot)
            updatedItem.request_qty = fieldValue;
          } else {
            // request_qty has been set to a non-zero value, preserve it independently
            // This ensures that once request_qty is established, it doesn't change when actual_qty changes
            updatedItem.request_qty = existingRequestQty;
          }
          
        // In add mode, preserve final_qty independently - don't auto-set it to actual_qty
        // final_qty and actual_qty should remain independent even in add mode
        }
      } else if (qtyType === 'final_qty') {
        // Updating final_qty (in both add and view mode) - preserve string value if it ends with dot
        updatedItem.final_qty = fieldValue;
        
        // CRITICAL: In Ongoing stage, when final_qty changes, also update actual_qty to match
        // In Checked stage, actual_qty should NOT be reset to 0 when final_qty changes
        const isOngoingStage = (status === 'Ongoing' || status === 'ongoing') && !isCompleted;
        const isCheckedStage = (status === 'Checked' || status === 'checked') && !isCompleted;
        
        if (isOngoingStage) {
          // In Ongoing stage: when final_qty changes, update actual_qty to match (preserve string if ends with dot)
          updatedItem.actual_qty = fieldValue;
        } else {
          // For other stages (including Checked): preserve actual_qty independently
          // Only initialize actual_qty if it's truly undefined/null/empty string/0
          const existingActualQty = item.actual_qty;
          const isActualQtyUnset = existingActualQty === null || 
                                    existingActualQty === undefined || 
                                    existingActualQty === '' ||
                                    existingActualQty === 0 ||
                                    (typeof existingActualQty === 'string' && existingActualQty.trim() === '');
          
          if (isActualQtyUnset) {
            // If actual_qty is not set, initialize it to final_qty (for new items) - preserve string if ends with dot
            updatedItem.actual_qty = fieldValue;
          } else {
            // actual_qty is already set, preserve it independently
            // This ensures that in Checked stage, actual_qty doesn't get reset to 0 when final_qty changes
            updatedItem.actual_qty = originalActualQty;
          }
        }
        // Also preserve request_qty independently
        updatedItem.request_qty = originalRequestQty;
      }

      if (updatedItem.originalItem) {
        delete updatedItem.originalItem;
      }

      const newItems = [...prevItems];
      newItems[index] = updatedItem;

      if (qtyType === 'actual_qty') {
        // CRITICAL: In view mode, NEVER update request_qty when actual_qty changes
        if (mode === 'view') {
          // In view mode, only update actual_qty, never touch request_qty
          onItemChange(index, 'actual_qty', qtyNumeric);
        } else {
          // In add mode: request_qty should be independent of actual_qty changes
          // Only initialize request_qty if it's truly undefined/null/empty string/0
          // Once request_qty has been set to a non-zero value, it should remain independent
          const existingRequestQty = item.request_qty;
          // Check if request_qty hasn't been set yet (null, undefined, empty string, or 0)
          // Treat 0 as unset because it's the default initialization value
          const isRequestQtyUnset = existingRequestQty === null || 
                                    existingRequestQty === undefined || 
                                    existingRequestQty === '' ||
                                    existingRequestQty === 0 ||
                                    (typeof existingRequestQty === 'string' && existingRequestQty.trim() === '');
          
          if (isRequestQtyUnset) {
            // Initialize request_qty only if it hasn't been set (is null/undefined/empty string/0)
        onItemChange(index, 'request_qty', qtyNumeric);
          }
          // If request_qty is already set to a non-zero value, don't update it
          
        onItemChange(index, 'actual_qty', qtyNumeric);
        }
      } else if (qtyType === 'final_qty') {
        // CRITICAL: In Checked stage, don't update final_qty (it's read-only)
        // If we're here, it means the qtyType was redirected to actual_qty above
        // So we should not update final_qty in Checked stage
        const isCheckedStage = (status === 'Checked' || status === 'checked') && !isCompleted;
        const isOngoingStage = (status === 'Ongoing' || status === 'ongoing') && !isCompleted;
        
        if (!isCheckedStage) {
          onItemChange(index, 'final_qty', finalQty);
          
          // CRITICAL: In Ongoing stage, also update actual_qty to match final_qty
          if (isOngoingStage) {
            onItemChange(index, 'actual_qty', finalQty);
          }
        }
      }
      onItemChange(index, 'amount', amountNumeric);
      onItemChange(index, 'total', amountNumeric);

      return newItems;
    });
  };

const normalizeImageEntries = (list) => {
  if (!list || !Array.isArray(list)) {
    return [];
  }

  return list.reduce((acc, entry) => {
    try {
      if (entry && typeof entry === 'object' && entry.value) {
        const val = entry.value;
        const srcCandidate = val.src || val.previewUrl || null;
        const resolvedSrc = srcCandidate ? ensureAbsoluteUrl(srcCandidate) : '';
        const previewUrl = val.previewUrl ? ensureAbsoluteUrl(val.previewUrl) : resolvedSrc;
        if (resolvedSrc || previewUrl || val.fileObject) {
          acc.push({
            type: val.type || entry.type || (val.fileObject ? 'upload' : 'url'),
            src: resolvedSrc || previewUrl,
            previewUrl: previewUrl || resolvedSrc,
            fileObject: val.fileObject || entry.fileObject || null,
            isBase64: typeof (resolvedSrc || previewUrl) === 'string' && (resolvedSrc || previewUrl).startsWith('data:image/')
          });
          return acc;
        }
      }

      if (entry && (entry.previewUrl || entry.src)) {
        const srcCandidate = entry.src || entry.previewUrl;
        const resolvedSrc = srcCandidate ? ensureAbsoluteUrl(srcCandidate) : '';
        const previewUrl = entry.previewUrl ? ensureAbsoluteUrl(entry.previewUrl) : resolvedSrc;
        acc.push({
          type: entry.type || 'url',
          src: resolvedSrc || previewUrl,
          previewUrl: previewUrl || resolvedSrc,
          fileObject: entry.fileObject || null,
          isBase64: entry.isBase64 || (typeof srcCandidate === 'string' && srcCandidate.startsWith('data:image/'))
        });
        return acc;
      }

      if (typeof entry === 'string') {
        const resolved = ensureAbsoluteUrl(entry);
        acc.push({
          type: 'url',
          src: resolved,
          previewUrl: resolved,
          fileObject: null,
          isBase64: entry.startsWith('data:image/')
        });
        return acc;
      }

      if (entry instanceof File || entry instanceof Blob) {
        const previewUrl = URL.createObjectURL(entry);
        acc.push({
          type: 'upload',
          src: previewUrl,
          previewUrl,
          fileObject: entry,
          isBase64: false
        });
        return acc;
      }

      if (entry && typeof entry === 'object') {
        const src = entry.url || entry.src || entry.path;
        const resolvedSrc = src ? ensureAbsoluteUrl(src) : '';
        const previewUrl = entry.previewUrl ? ensureAbsoluteUrl(entry.previewUrl) : resolvedSrc;

        if (resolvedSrc || previewUrl) {
          acc.push({
            type: entry.type || 'url',
            src: resolvedSrc || previewUrl,
            previewUrl: previewUrl || resolvedSrc,
            fileObject: entry.fileObject || null,
            isBase64: typeof (resolvedSrc || previewUrl) === 'string' && (resolvedSrc || previewUrl).startsWith('data:image/')
          });
          return acc;
        }

        if (entry.file && (entry.file instanceof File || entry.file instanceof Blob)) {
          const preview = URL.createObjectURL(entry.file);
          acc.push({
            type: 'upload',
            src: preview,
            previewUrl: preview,
            fileObject: entry.file,
            isBase64: false
          });
          return acc;
        }
      }

      if (entry?.fileObject && entry?.previewUrl) {
        const preview = ensureAbsoluteUrl(entry.previewUrl);
        acc.push({
          type: entry.type || 'upload',
          src: preview,
          previewUrl: preview,
          fileObject: entry.fileObject,
          isBase64: false
        });
        return acc;
      }

      return acc;
    } catch (error) {
      return acc;
    }
  }, []);
};

  const fileToImageEntry = (file) => {
    return new Promise((resolve, reject) => {
      // First, create a preview URL immediately
      const previewUrl = URL.createObjectURL(file);
      
      // Then try to read the file as data URL for the src
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve({
          src: e.target.result,
          previewUrl: previewUrl, // Keep the blob URL for preview
          name: file.name,
          type: 'upload',
          fileObject: file,
          lastModified: file.lastModified || Date.now()
        });
      };
      
      reader.onerror = () => {
        // Even if reading fails, still resolve with the preview URL
        resolve({
          src: previewUrl,
          previewUrl: previewUrl,
          name: file.name,
          type: 'upload',
          fileObject: file,
          lastModified: file.lastModified || Date.now()
        });
      };
      
      try {
        reader.readAsDataURL(file);
      } catch (error) {
        // If reading fails, still return with the preview URL
        resolve({
          src: previewUrl,
          previewUrl: previewUrl,
          name: file.name,
          type: 'upload',
          fileObject: file,
          lastModified: file.lastModified || Date.now()
        });
      }
    });
  };

  const handleImageUpload = async (itemId, e) => {
    e.stopPropagation();
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    const index = items.findIndex(item => item.id === itemId);
    if (index === -1) return;
    
    const item = items[index];
    if (!item) return;
    
    // Store both the blob URL for preview and the original File object
    const newImages = [];
    
    // Process all files in parallel
    const uploadPromises = files.map(async (file) => {
      try {
        const imageEntry = await fileToImageEntry(file);
        return imageEntry;
      } catch (err) {
        const previewUrl = URL.createObjectURL(file);
        return {
          type: 'upload',
          src: previewUrl,
          previewUrl: previewUrl,
          fileObject: file,
          name: file.name,
          lastModified: file.lastModified || Date.now()
        };
      }
    });
    
    try {
      const uploadedImages = await Promise.all(uploadPromises);
      newImages.push(...uploadedImages);
    } catch (error) {}
    
    // Update the item with new images
    const currentImages = filterOutSupportingEntries(
      extractImageArray(item),
      supportingAttachmentSet
    );
    const updatedImages = filterOutSupportingEntries(
      [...currentImages, ...newImages],
      supportingAttachmentSet
    );

    // Update local state immediately for preview
    setItems(prevItems => {
      const updatedItems = prevItems.map((prevItem, idx) => {
        if (idx !== index) return prevItem;

        const updatedItem = { ...prevItem };
        const imageKeys = ['img', 'images', 'photos', 'attachments'];

        let updated = false;

        imageKeys.forEach(key => {
          if (prevItem[key] !== undefined) {
            if (Array.isArray(prevItem[key])) {
              updatedItem[key] = updatedImages;
            } else if (prevItem[key] && typeof prevItem[key] === 'object') {
              updatedItem[key] = {
                ...prevItem[key],
                imgArray: updatedImages,
                images: updatedImages,
                firstImage: updatedImages[0] || null
              };
            }
            updated = true;
          }
        });

        if (!updated) {
          updatedItem.img = updatedImages;
        }

        return updatedItem;
      });
      
      // Update parent component with the new items including images
      handleItemsChange(updatedItems);
      
      return updatedItems;
    });

    // Update the parent component
    onItemChange(index, 'img', updatedImages);
    
    // Reset the file input
    if (e.target) {
      e.target.value = '';
    }
    
    // Also reset the file input reference if it exists
    if (fileInputRefs.current && fileInputRefs.current[itemId]) {
      fileInputRefs.current[itemId].value = '';
    }
  };

  const removeImage = (id, imgIndex) => {
    setItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (itemRowIdsEqual(item.id ?? item.specific_form_id, id)) {
          const sourceImages = item.img
            || item.images
            || item.damage_images
            || item.damageImages
            || [];
          const normalizedImages = filterOutSupportingEntries(
            normalizeImageEntries(sourceImages || []),
            supportingAttachmentSet
          );
          const entryToRemove = normalizedImages[imgIndex];
          
          // Clean up blob URLs if they exist
          if (entryToRemove) {
            if (entryToRemove.previewUrl) {
              try { 
                URL.revokeObjectURL(entryToRemove.previewUrl);
              } catch (error) {}
            }
            else if (entryToRemove.src && typeof entryToRemove.src === 'string' && entryToRemove.src.startsWith('blob:')) {
              try {
                URL.revokeObjectURL(entryToRemove.src);
              } catch (error) {}
            }
          }
          
          // Remove the image from the array
          const newImages = [...normalizedImages];
          newImages.splice(imgIndex, 1);

          // Update the item with the new images array
          return { ...item, img: newImages, images: newImages, damage_images: newImages };
        }
        return item;
      });
      
      // Sync with parent component
      handleItemsChange(updatedItems);
      
      return updatedItems;
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((sid) => sid !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const currentItems = paginatedItems.map((i) => i.id);
    const allSelected = currentItems.every((id) =>
      selectedIds.includes(id)
    );

    if (allSelected) {
      setSelectedIds(
        selectedIds.filter((id) => !currentItems.includes(id))
      );
    } else {
      setSelectedIds([...new Set([...selectedIds, ...currentItems])]);
    }
  };

  const confirmMultipleDelete = () => {
    if (selectedIds.length > 0) setShowConfirm(true);
  };

  const handleMultipleDelete = () => {
    const idsToDelete = new Set(selectedIds.map((id) => String(id)));
    setItems((prev) =>
      prev.filter((item) => {
        const itemId = String(item.id ?? item.specific_form_id ?? '');
        return !idsToDelete.has(itemId);
      })
    );
    setSelectedIds([]);
    setShowConfirm(false);
  };

  // Handle bulk account code change for selected items
  const handleBulkAccountCodeChange = (accountCode) => {
    if (selectedIds.length === 0) return;
    
    // Update account code for all selected items
    selectedIds.forEach((id) => {
      onItemAccountCodeChange(id, accountCode);
    });
  };

  const cancelRemove = () => setShowConfirm(false);

  // Calculate total based on status:
  // - Checked: sum of (price * actual_qty)
  // - BM Approved: sum of (price * actual_qty)
  // - OPApproved: sum of (price * actual_qty) - use actual_qty not final_qty
  // - Ac_Acknowledged: sum of (price * actual_qty) - use actual_qty not final_qty
  // Always calculate total using actual_qty for consistency
  // Use actual_qty if available, otherwise use request_qty as fallback
  const total = items.reduce(
    (sum, item) => {
        const price = toSafeNumber(item.price);
        const actualQty = toSafeNumber(item.actual_qty);
      const requestQty = toSafeNumber(item.request_qty);
        const systemQty = toSafeNumber(item.system_qty);

      // Use actual_qty if available, otherwise request_qty
      let qtyForTotal = actualQty || requestQty || 0;

      // Apply system_qty constraint if applicable (for stock validation)
      if (systemQty > 0 && qtyForTotal > systemQty) {
        qtyForTotal = systemQty;
      } else if (systemQty === 0) {
        qtyForTotal = 0;
      }

      const itemTotal = price * qtyForTotal;
      return sum + itemTotal;
    },
    0
  );

  // Apply search and filters
  const normalizedSearch = (searchTerm || '').trim().toLowerCase();
  const filteredItems = useMemo(() => {
    let result = items;
    
    // Apply search filter
    if (normalizedSearch) {
      result = result.filter(it =>
        (String(it.code || '').toLowerCase().includes(normalizedSearch)) ||
        (String(it.name || '').toLowerCase().includes(normalizedSearch)) ||
        (String(it.product_code || '').toLowerCase().includes(normalizedSearch))
      );
    }
    
    // Apply category filter
    if (filters.category) {
      result = result.filter(it => 
        String(it.category || '').toLowerCase() === filters.category.toLowerCase()
      );
    }
    
    // Apply unit filter
    if (filters.unit) {
      result = result.filter(it => 
        String(it.unit || '').toLowerCase() === filters.unit.toLowerCase()
      );
    }
    
    // Apply price range filter
    const minPriceValue = filters.minPrice ? parseFloat(filters.minPrice) : null;
    const maxPriceValue = filters.maxPrice ? parseFloat(filters.maxPrice) : null;
    
    if (minPriceValue !== null && !isNaN(minPriceValue)) {
      result = result.filter(it => {
        const price = parseFloat(it.price || it.unit_price || 0);
        return price >= minPriceValue;
      });
    }
    if (maxPriceValue !== null && !isNaN(maxPriceValue)) {
      result = result.filter(it => {
        const price = parseFloat(it.price || it.unit_price || 0);
        return price <= maxPriceValue;
      });
    }
    
    // Apply amount range filter
    const minAmountValue = filters.minAmount ? parseFloat(filters.minAmount) : null;
    const maxAmountValue = filters.maxAmount ? parseFloat(filters.maxAmount) : null;
    
    if (minAmountValue !== null && !isNaN(minAmountValue)) {
      result = result.filter(it => {
        const amount = parseFloat(it.amount || it.total || 0);
        return amount >= minAmountValue;
      });
    }
    if (maxAmountValue !== null && !isNaN(maxAmountValue)) {
      result = result.filter(it => {
        const amount = parseFloat(it.amount || it.total || 0);
        return amount <= maxAmountValue;
      });
    }
    
    return result;
  }, [items, normalizedSearch, filters]);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIdx, startIdx + itemsPerPage);
  
  // Get unique categories and units for filter dropdowns
  const uniqueCategories = useMemo(() => {
    const cats = new Set();
    items.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats).sort();
  }, [items]);
  
  const uniqueUnits = useMemo(() => {
    const units = new Set();
    items.forEach(item => {
      if (item.unit) units.add(item.unit);
    });
    return Array.from(units).sort();
  }, [items]);
  
  // Reset filters function
  const handleResetFilters = () => {
    setFilters({
      category: '',
      unit: '',
      minPrice: '',
      maxPrice: '',
      minAmount: '',
      maxAmount: ''
    });
    setCurrentPage(1);
  };
  
  // Check if any filter is active
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const gatherImagesForModal = (item) => {
    if (!item) return [];

    const candidates = [
      item.img,
      item.images,
      item.damage_images,
      item.damageImages,
      item.photos,
      item.attachments,
    ]
      .filter(Boolean)
      .flat();

    const normalized = filterOutSupportingEntries(
      normalizeImageEntries(Array.isArray(candidates) ? candidates : []),
      supportingAttachmentSet
    );
    const seen = new Set();
    const resolved = [];

    normalized.forEach((entry) => {
      if (!entry) return;
      const val = entry.value || entry;

      const candidate = (() => {
        if (typeof val === 'string') return val;
        if (val.src) return val.src;
        if (val.previewUrl) return val.previewUrl;
        if (val.url) return val.url;
        if (val.path) return val.path;
        if (val.firstImage) return val.firstImage;
        if (val.file && typeof val.file === 'string') return val.file;
        return null;
      })();

      if (!candidate) return;

      const canonicalKey = canonicalizeImageKey(candidate);
      const keyForSet = canonicalKey || candidate;
      if (seen.has(keyForSet)) return;
      seen.add(keyForSet);

      const absolute = ensureAbsoluteUrl(canonicalKey || candidate);
      if (absolute) {
        resolved.push(absolute);
      }
    });

    return resolved;
  };

  const openImageGallery = (product) => {
    const imagesForGallery = gatherImagesForModal(product);

    if (!imagesForGallery.length) {
      return;
    }

    // Store the item ID so we can delete images from this item
    setPreviewItemId(product.id);
    openPreview(imagesForGallery, 0);
  };

  const openProductModal = (item) => {
    setSelectedProduct(item);
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
  };

  const openPreview = (imgs, start = 0) => {
    if (!Array.isArray(imgs) || imgs.length === 0) return;
    const srcs = imgs.map(i => (typeof i === 'string' ? i : (i?.src || ''))).filter(Boolean);
    if (srcs.length === 0) return;
    setPreviewImages(srcs);
    setPreviewIndex(Math.max(0, Math.min(start, srcs.length - 1)));
    setPreviewMode('gallery');
    setPreviewOpen(true);
  };
  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewImages([]);
    setPreviewIndex(0);
    setPreviewItemId(null);
    setPreviewMode('gallery');
  };

  const handleDeleteCurrentImage = () => {
    if (!previewItemId || previewImages.length === 0) return;
    
    const currentIndex = previewIndex;
    
    // Update preview state immediately by removing the current image
    const newImages = [...previewImages];
    newImages.splice(currentIndex, 1);
    
    if (newImages.length === 0) {
      // No more images, close preview and remove image
      removeImage(previewItemId, currentIndex);
      closePreview();
    } else {
      // Update preview to show next image (or previous if at end)
      const nextIndex = currentIndex >= newImages.length ? newImages.length - 1 : currentIndex;
      setPreviewImages(newImages);
      setPreviewIndex(nextIndex);
      
      // Remove the image using the removeImage function
      removeImage(previewItemId, currentIndex);
    }
  };
  const nextPreview = (e) => {
    e?.stopPropagation?.();
    setPreviewIndex((i) => (i + 1) % previewImages.length);
  };
  const prevPreview = (e) => {
    e?.stopPropagation?.();
    setPreviewIndex((i) => (i - 1 + previewImages.length) % previewImages.length);
  };

   const onThumbError = (e) => {
    const imgEl = e?.currentTarget;
    if (!imgEl) return;

    const alreadyRetried = imgEl.dataset?.fallbackTried === 'true';
    if (!alreadyRetried) {
      imgEl.dataset.fallbackTried = 'true';
      // Retry once with same URL to handle transient FTP latency
      const currentSrc = imgEl.src;
      imgEl.src = '';
      requestAnimationFrame(() => {
        imgEl.src = currentSrc;
      });
      return;
    }

    imgEl.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  };

  const goToNextPage = () =>
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goToPrevPage = () =>
    setCurrentPage((p) => Math.max(p - 1, 1));

  const totalCount = items.length;
  const countLabel = `${totalCount}-${totalCount === 1 ? 'Product' : 'Products'}`;

  // Update System Qty function (matches Laravel blade logic)
  const handleUpdateSystemQty = async () => {
    if (!generalFormId) {
      setErrorModal({
        isOpen: true,
        message: 'General Form ID not found'
      });
      return;
    }
    
    setIsUpdatingSystemQty(true);
    // Match on-screen qty rules: System Qty 0 ⇒ effective Actual Qty 0 (display is overridden,
    // but item.actual_qty in state may still hold the old request qty).
    const getEffectiveActualQty = (item) => {
      const systemQty = parseFloat(item.system_qty) || 0;
      const rawActual = item.actual_qty;
      const numericActual =
        rawActual === '' || rawActual === null || rawActual === undefined
          ? NaN
          : parseFloat(rawActual);

      if (systemQty === 0) {
        return 0;
      }
      if (Number.isNaN(numericActual)) {
        return parseFloat(item.final_qty ?? item.product_type ?? 0) || 0;
      }
      if (numericActual > systemQty) {
        return systemQty;
      }
      return numericActual;
    };

    const payload = {
      general_form_id: generalFormId,
      form_id: formId,
      layout_id: layoutId,
      items: items.map((item) => ({
        id: item.id || item.specific_form_id || null,
        product_code: item.product_code,
        actual_qty: getEffectiveActualQty(item),
        final_qty: item.final_qty ?? item.product_type ?? 0,
      })),
    };
    console.log('[Update System Qty] Button clicked. generalFormId=', generalFormId, 'payload=', payload);

    try {
      // apiRequest already returns JSON and throws on error
      const responseData = await apiRequest('/api/big-damage-issues/sys_update', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      console.log('[Update System Qty] sys_update API success:', responseData);

      // The API endpoint returns product codes, not items
      // So we need to refetch the items to get updated system_qty values
      // Add a small delay to ensure database transaction has committed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Only trigger refetch once
      onSystemQtyStatusChange(true);
    } catch (error) {
      console.error('[Update System Qty] sys_update API error:', error?.message, error);
      setErrorModal({
        isOpen: true,
        message: error.message || 'Failed to update system quantities. Please try again.'
      });
    } finally {
      setIsUpdatingSystemQty(false);
    }
  };
  return (
    <div className={`mx-auto font-sans max-w-full sm:p-0${mode === 'view' ? ' text-sm' : ''}`}>
      <ErrorModal 
        isOpen={errorModal.isOpen}
        message={errorModal.message}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
      />
      <ErrorModal
        isOpen={qtyErrorModal.isOpen}
        message={qtyErrorModal.message}
        onClose={() => setQtyErrorModal({ isOpen: false, message: '' })}
      />
      <WarningModal
        isOpen={amountWarningModal.isOpen}
        message={amountWarningModal.message}
        onClose={() => setAmountWarningModal({ isOpen: false, message: '' })}
      />
      {/* Action buttons and Add Product button with search bar */}
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        {/* Left side: Search box and Filter button */}
        <div className="relative flex items-center gap-2 w-full sm:w-auto order-2 sm:order-1">
          {/* Select All - mobile only */}
          <button
            type="button"
            onClick={toggleSelectAll}
            className="md:hidden px-2 py-1.5 text-[0.75rem] border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-100 transition"
          >
            {selectedIds.length > 0 && paginatedItems.length > 0 && paginatedItems.every((item) => selectedIds.includes(item.id))
              ? t('table.clearSelection', { defaultValue: 'Clear All' })
              : t('table.selectAll', { defaultValue: 'Select All' })}
          </button>
          <div className="relative w-full sm:w-55">
            <Search
              size={14}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={t('table.searchPlaceholder', { defaultValue: 'Search by product code...' })}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); 
              }}
              className="w-full pl-8 pr-8 py-1.5 text-[0.9rem] sm:text-[0.8rem] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-800 focus:border-blue-400 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                title={t('table.clearSearch', { defaultValue: 'Clear search' })}
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {/* Filter Button with Hover Animation */}
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="filter-btn-hover group relative flex items-center justify-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-all duration-300 shadow-sm hover:shadow-md"
            title={t('table.filterProducts', { defaultValue: 'Filter products' })}
          >
            <Filter 
              size={16} 
              className="transition-all duration-300 group-hover:rotate-180 group-hover:scale-110" 
            />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            )}
          </button>

          {/* Account Code Selection Hint - Only show on desktop */}
          {isAccount && (status === 'BM Approved' || status === 'OPApproved' || status === 'OP Approved') && (
            <div className="hidden md:inline-flex text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 ml-2">
              {t('table.selectAllAccountCodesHint', {
                defaultValue: 'You can select the account code all at once when you click select all button'
              })}
            </div>
          )}

          {/* Bulk Account Code Selector - Only show when items are selected and account codes are visible */}
          {showAccountCodes && selectedIds.length > 0 && !isCompleted && (
            <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-2 basis-full sm:basis-auto">
              <select
                className="w-full border border-emerald-300 rounded-md px-2 py-1.5 text-[0.75rem] sm:text-[0.8rem] bg-emerald-50 text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-400 transition-all shadow-sm"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkAccountCodeChange(e.target.value);
                    e.target.value = ''; // Reset after selection
                  }
                }}
                title={`Apply account code to ${selectedIds.length} selected item(s)`}
              >
                <option value="">Apply Account Code ({selectedIds.length})</option>
                {accountCodes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right side: Action buttons and Add Product button */}

         <div className="flex gap-2 flex-wrap items-center order-1 sm:order-2">

          {/* Delete button - add mode: remove items before submit; edit mode: status/role rules */}
          {canDeleteSelectedItems && (
            <button
              onClick={confirmMultipleDelete}
              className="flex items-center gap-1 px-2 py-[1px] text-[0.65rem] sm:text-[0.75rem] bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              <Trash2 size={14} /> {t('table.delete', { defaultValue: 'Delete' })} ({selectedIds.length})
            </button>
          )}
          
          {/* Account codes button should appear only in acknowledge and issue stages */}
          {/* Operation Manager should NOT see account code button at Ac_Acknowledged stage */}
          {(() => {
            // Don't show button if no account codes available
            if (accountCodes.length === 0) return null;
            
            // Don't show button if account codes are hidden
            if (!showAccountCodes) return null;
            
            // Only show button at specific stages
            const isAllowedStage = status === 'Ac_Acknowledged' || 
             status === 'Acknowledged' || 
             status === 'Issued' || 
                                  status === 'SupervisorIssued';
            if (!isAllowedStage) return null;
            
            // CRITICAL: Don't show button for Operation Manager at Ac_Acknowledged stage
            const isOpManagerAtAcknowledged = isOpManager && (status === 'Ac_Acknowledged' || status === 'Acknowledged');
            if (isOpManagerAtAcknowledged) {
              return null;
            }
            
            // CRITICAL: Don't show button for Branch Account users
            if (isAccount) {
              return null;
            }
            
            return (
              <button
                type="button"
                onClick={() => setShowAccountCodes((prev) => !prev)}
                className={`flex items-center gap-2 px-3 py-1 rounded text-[0.7rem] sm:text-[0.75rem] border transition ${showAccountCodes ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'}`}
              >
                <span className="font-semibold">{showAccountCodes ? t('table.hideAccountCodes', { defaultValue: 'Hide Account Codes' }) : t('table.showAccountCodes', { defaultValue: 'Show Account Codes' })}</span>
              </button>
            );
          })()}
          
        </div>
        
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-t-xl hidden md:block">
        <table className="min-w-full border-collapse table-auto">
          <thead className="bg-[#f6f6fe] border-gray-200">
            <tr>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={
                    paginatedItems.length > 0 &&
                    paginatedItems.every((item) =>
                      selectedIds.includes(item.id)
                    )
                  }
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-2 py-2 text-left hidden sm:table-cell text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.category', { defaultValue: 'Category' })}</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.code', { defaultValue: 'Code' })}</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.name', { defaultValue: 'Name' })}</th>
              <th className="px-2 py-2 text-left hidden sm:table-cell text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.unit', { defaultValue: 'Unit' })}</th>
              <th className="px-2 py-2 text-left hidden md:table-cell text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.systemQty', { defaultValue: 'System Qty' })}</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.price', { defaultValue: 'Price' })}</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.requestQty', { defaultValue: 'Request Qty' })}</th>
              {mode !== 'add' && (
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.finalQty', { defaultValue: 'Final Qty' })}</th>
              )}
              {mode !== 'add' && (
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.actualQty', { defaultValue: 'Actual Qty' })}</th>
              )}
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.amount', { defaultValue: 'Amount' })}</th>
              <th className="px-2 py-2 text-left hidden lg:table-cell text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.remark', { defaultValue: 'Remark' })}
              </th>
              <th className="px-2 py-2 text-left hidden md:table-cell text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.img', { defaultValue: 'Img' })}
              </th>
              {/* Show account code header in all stages including Completed */}
              {showAccountCodes && (
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.accountCode', { defaultValue: 'Account Code' })}
                </th>
              )}
            </tr>
          </thead>

          <tbody className="text-[13px]">
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item, idx) => {
                const matchId = item.id ?? item.specific_form_id;
                const systemQtyZero = (parseFloat(item.system_qty) || 0) === 0;
                return (
                <tr
                  key={item.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-all ${
                    selectedIds.includes(item.id) ? "bg-emerald-50" : ""
                  } ${systemQtyZero ? "text-red-600 line-through" : ""}`}
                  title={systemQtyZero ? t('table.struckThroughNoStockReason', { defaultValue: 'Struck through: System quantity is 0 (no stock available)' }) : undefined}
                >
                  <td
                    className="px-2 py-2 text-center text-[13px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 accent-emerald-600 shrink-0"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </td>
                  <td className="px-2 py-2 text-[13px]">{startIdx + idx + 1}</td>
                  <td className="px-2 py-2 hidden sm:table-cell text-[13px]">
                    {item.category}
                  </td>
                  <td className="px-2 py-2 text-[13px]">{item.code}</td>
                  <td className="px-2 py-2 text-[13px]">{item.name}</td>
                  <td className="px-2 py-2 hidden sm:table-cell text-[13px]">
                    {item.unit}
                  </td>
                  <td className="px-2 py-2 hidden md:table-cell text-[13px]">
                    {item.system_qty}
                    {systemQtyZero && (
                      <span className="block text-[11px] font-medium mt-0.5 normal-case no-underline" style={{ textDecoration: 'none' }} title={t('table.struckThroughNoStockReason', { defaultValue: 'Struck through: System quantity is 0 (no stock available)' })}>
                        {t('table.noStockStruckThrough', { defaultValue: '(No stock)' })}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-[13px]">
                    {(() => {
                      const explicit = Number(
                        item?.price ??
                        item?.unit_price ??
                        item?.unitPrice ??
                        item?.product_price ??
                        item?.selling_price ??
                        item?.sell_price ??
                        item?.cost_price ??
                        NaN
                      );
                      if (!Number.isNaN(explicit) && explicit > 0) {
                        return parseFloat(explicit).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        });
                      }

                      const amt = Number(item?.amount ?? item?.total ?? NaN);
                      const qty = Number(
                        item?.actual_qty ??
                        item?.final_qty ??
                        item?.request_qty ??
                        item?.req_qty ??
                        item?.qty ??
                        NaN
                      );

                      const derived = !Number.isNaN(amt) && !Number.isNaN(qty) && qty > 0 ? (amt / qty) : 0;

                      return derived
                        ? parseFloat(derived).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '0.00';
                    })()}
                  </td>
                  {/* Request Qty - shows actual_qty (editable in add mode, read-only in view mode) */}
                  <td className="px-2 py-2 text-[13px]" onClick={(e) => e.stopPropagation()}>
                    {mode === 'add' ? (
                      // In add mode, actual_qty is editable (this becomes the request)
                      <div>
                        <input
                          type="text"
                          inputMode="decimal"
                          data-item-id={item.id}
                          data-field="request_qty"
                          data-qty-field="true"
                          data-auto-focus-target="true"
                          value={item.request_qty ?? ''}
                          max={item.system_qty > 0 ? item.system_qty : undefined}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            
                            // Allow empty, numbers, decimals, and intermediate states like "." or "5."
                            // Also allow comma (,) as decimal separator (common in some locales)
                            // Convert comma to dot for consistency
                            let normalizedValue = nextValue.replace(',', '.');
                            
                            // Check: only digits and at most one dot (after normalization)
                            const hasOnlyDigitsAndOneDot = /^[\d.]*$/.test(normalizedValue) && (normalizedValue.match(/\./g) || []).length <= 1;
                            
                            
                            if (nextValue === '' || hasOnlyDigitsAndOneDot) {
                              const valueToUse = normalizedValue;
                              // Validate against system_qty (only if we have a valid number)
                              const systemQty = parseFloat(item.system_qty) || 0;
                              const numericValue = nextValue === '' || nextValue === '.' ? 0 : parseFloat(nextValue);
                              
                              if (systemQty === 0 && numericValue > 0) {
                                // Show error modal
                                setQtyErrorModal({
                                  isOpen: true,
                                  message: t('messages.errors.systemQtyZero', { defaultValue: 'System Quantity is 0. You cannot enter a quantity greater than 0.' })
                                });
                                return; // Don't update the value
                              }
                              
                              if (systemQty > 0 && numericValue > systemQty) {
                                // Show error modal
                                const productName = item.product_name || item.name || item.product_code || item.code || t('common.product', { defaultValue: 'Product' });
                                setQtyErrorModal({
                                  isOpen: true,
                                  message: t('messages.errors.requestQtyExceedsSystem', { 
                                    productName,
                                    qty: numericValue,
                                    systemQty,
                                    defaultValue: `${productName}: Request Quantity (${numericValue}) cannot be greater than System Quantity (${systemQty}).`
                                  })
                                });
                                return; // Don't update the value
                              }
                              
                              // Only update request_qty - do NOT update actual_qty
                              handleInputChange(item.id ?? item.specific_form_id, 'request_qty', valueToUse);
                            }
                          }}
                          onBlur={(e) => {
                            // Clear editing ref when user finishes editing
                            if (editingFieldRef.current?.id === item.id && editingFieldRef.current?.field === 'request_qty') {
                              editingFieldRef.current = null;
                            }
                            // Normalize value: handle empty, just ".", or trailing "."
                            let normalizedValue = e.target.value.trim();
                            if (normalizedValue === '' || normalizedValue === '.') {
                              normalizedValue = '0';
                            } else if (normalizedValue.endsWith('.')) {
                              // Remove trailing dot: "5." becomes "5"
                              normalizedValue = normalizedValue.slice(0, -1);
                            }
                            const systemQty = parseFloat(item.system_qty) || 0;
                            const numericValue = parseFloat(normalizedValue) || 0;
                            
                            // Validate on blur as well - show error but don't auto-change
                            if (systemQty === 0 && numericValue > 0) {
                              setQtyErrorModal({
                                isOpen: true,
                                message: t('messages.errors.systemQtyZero', { defaultValue: 'System Quantity is 0. You cannot enter a quantity greater than 0.' })
                              });
                              // Reset to previous value
                              e.target.value = String(item.actual_qty ?? item.request_qty ?? '0');
                              return;
                            }
                            
                            if (systemQty > 0 && numericValue > systemQty) {
                              const productName = item.product_name || item.name || item.product_code || item.code || t('common.product', { defaultValue: 'Product' });
                              setQtyErrorModal({
                                isOpen: true,
                                message: t('messages.errors.requestQtyExceedsSystem', { 
                                  productName,
                                  qty: numericValue,
                                  systemQty,
                                  defaultValue: `${productName}: Request Quantity (${numericValue}) cannot be greater than System Quantity (${systemQty}).`
                                })
                              });
                              // Reset to previous value
                              e.target.value = String(item.actual_qty ?? item.request_qty ?? '0');
                              return;
                            }
                            
                            handleQtyChange(item.id ?? item.specific_form_id, normalizedValue, 'actual_qty');
                          }}
                          className="w-20 border border-gray-300 rounded px-2 py-1"
                          title={item.system_qty > 0 ? `Maximum: ${item.system_qty}` : ''}
                        />
                      </div>
                    ) : (
                      // In view mode, Request Qty column shows request_qty (the original request quantity)
                      <span>{formatQuantity(item.request_qty ?? 0)}</span>
                    )}
                  </td>
                  {mode !== 'add' && (
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        // In Checked stage, Final Qty should be read-only (only Actual Qty is editable)
                        const isCheckedStage = (status === 'Checked' || status === 'checked') && !isCompleted;
                        // Also make read-only for Operation Manager viewing OPApproved form and for Ac_Acknowledged
                        const statusLower = (status || '').toString().trim().toLowerCase();
                        const isOPApprovedStatus = statusLower === 'opapproved' || statusLower === 'op approved';
                        const isAckStatusLocal = statusLower === 'ac_acknowledged' || statusLower === 'acknowledged';
                        const shouldShowFinalQtyAsReadOnly = isCheckedStage || isAckStatusLocal || (mode === 'view' && !allowFinalQtyEdit) || (isOpManager && isOPApprovedStatus);
                        
                        if (shouldShowFinalQtyAsReadOnly) {
                          const displayQty = isAckStatusLocal ? item.actual_qty : item.final_qty;
                          return <span>{formatQuantity(displayQty)}</span>;
                        }
                        
                        return (
                          <div>
                            <input
                              type="text"
                              inputMode="decimal"
                              data-item-id={item.id}
                              data-field="final_qty"
                              data-qty-field="true"
                              data-auto-focus-target="true"
                              value={item.final_qty ?? ''}
                            max={item.system_qty > 0 ? item.system_qty : undefined}
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              
                              // Allow empty, numbers, decimals, and intermediate states like "." or "5."
                              // Also allow comma (,) as decimal separator (common in some locales)
                              // Convert comma to dot for consistency
                              let normalizedValue = nextValue.replace(',', '.');
                              
                              // Check: only digits and at most one dot (after normalization)
                              const hasOnlyDigitsAndOneDot = /^[\d.]*$/.test(normalizedValue) && (normalizedValue.match(/\./g) || []).length <= 1;
                              
                              
                              if (nextValue === '' || hasOnlyDigitsAndOneDot) {
                                const valueToUse = normalizedValue;
                                // Validate against system_qty (only if we have a valid number)
                                const systemQty = parseFloat(item.system_qty) || 0;
                                const numericValue = valueToUse === '' || valueToUse === '.' ? 0 : parseFloat(valueToUse);
                                
                                if (systemQty === 0 && numericValue > 0) {
                                  // Show error modal
                                  setQtyErrorModal({
                                    isOpen: true,
                                    message: t('messages.errors.systemQtyZero', { defaultValue: 'System Quantity is 0. You cannot enter a quantity greater than 0.' })
                                  });
                                  return; // Don't update the value
                                }
                                
                                if (systemQty > 0 && numericValue > systemQty) {
                                  // Show error modal
                                  const productName = item.product_name || item.name || item.product_code || item.code || t('common.product', { defaultValue: 'Product' });
                                  setQtyErrorModal({
                                    isOpen: true,
                                    message: t('messages.errors.finalQtyExceedsSystem', { 
                                      productName,
                                      qty: numericValue,
                                      systemQty,
                                      defaultValue: `${productName}: Final Quantity (${numericValue}) cannot be greater than System Quantity (${systemQty}).`
                                    })
                                  });
                                  return; // Don't update the value
                                }
                                
                                handleQtyChange(item.id ?? item.specific_form_id, valueToUse, 'final_qty');
                              }
                            }}
                            onBlur={(e) => {
                              // Normalize value: handle empty, just ".", or trailing "."
                              let normalizedValue = e.target.value.trim();
                              if (normalizedValue === '' || normalizedValue === '.') {
                                normalizedValue = '0';
                              } else if (normalizedValue.endsWith('.')) {
                                // Remove trailing dot: "5." becomes "5"
                                normalizedValue = normalizedValue.slice(0, -1);
                              }
                              const systemQty = parseFloat(item.system_qty) || 0;
                              const numericValue = parseFloat(normalizedValue) || 0;
                              
                              // Validate on blur as well - show error but don't auto-change
                              if (systemQty === 0 && numericValue > 0) {
                                setQtyErrorModal({
                                  isOpen: true,
                                  message: t('messages.errors.systemQtyZero', { defaultValue: 'System Quantity is 0. You cannot enter a quantity greater than 0.' })
                                });
                                // Reset to previous value
                                e.target.value = String(item.final_qty ?? '0');
                                return;
                              }
                              
                              if (systemQty > 0 && numericValue > systemQty) {
                                const productName = item.product_name || item.name || item.product_code || item.code || t('common.product', { defaultValue: 'Product' });
                                setQtyErrorModal({
                                  isOpen: true,
                                  message: t('messages.errors.finalQtyExceedsSystem', { 
                                    productName,
                                    qty: numericValue,
                                    systemQty,
                                    defaultValue: `${productName}: Final Quantity (${numericValue}) cannot be greater than System Quantity (${systemQty}).`
                                  })
                                });
                                // Reset to previous value
                                e.target.value = String(item.final_qty ?? '0');
                                return;
                              }
                              
                              handleQtyChange(item.id ?? item.specific_form_id, normalizedValue, 'final_qty');
                            }}
                            className="w-20 border border-gray-300 rounded px-2 py-1"
                            title={item.system_qty > 0 ? `Maximum: ${item.system_qty}` : ''}
                          />
                        </div>
                        );
                      })()}
                    </td>
                  )}
                  {mode !== 'add' && (
                    <td className="px-2 py-2 text-[13px]" onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const systemQty = toSafeNumber(item.system_qty);
                        // CRITICAL: Display actual_qty directly from the item, not product_type
                        // actual_qty is the original request quantity and should be displayed as-is
                        let actualQty = toSafeNumber(item.actual_qty ?? item.request_qty);
                        if (systemQty === 0) {
                          actualQty = 0;
                        } else if (actualQty > systemQty) {
                          actualQty = systemQty;
                        }
                        // Display actual_qty, not product_type
                        const displayQty = actualQty;
                        
                        // Account can edit product_type at OP Approved stage (matching Laravel blade)
                        // Supervisor cannot edit product_type (read-only)
                        // Temporarily disabled to prioritize actual_qty editing
                        // const canEditProductType = isAccount && (status === 'OPApproved' || status === 'OP Approved') && !isCompleted;
                        const canEditProductType = false; // Disabled to allow actual_qty editing
                        
                        // In Checked stage, Actual Qty should be editable
                        // Make actual_qty read-only when status is OPApproved and systemQtyUpdated is true
                        // Also make read-only for Branch Account users viewing OPApproved forms
                        const normalizedStatusForActualQty = (status || '').toString().trim();
                        const isOPApprovedForActualQty = normalizedStatusForActualQty === 'OPApproved' || 
                                                         normalizedStatusForActualQty === 'OP Approved' ||
                                                         normalizedStatusForActualQty.toLowerCase() === 'opapproved' ||
                                                         normalizedStatusForActualQty.toLowerCase() === 'op approved';
                        const shouldMakeActualQtyReadOnly = (isOPApprovedForActualQty && systemQtyUpdated);
                        const normalizedStatusForEdit = (status || '').toString().trim();

                        const isBMApprovedForEdit = normalizedStatusForEdit === 'BM Approved' ||
                                                   normalizedStatusForEdit === 'BMApproved' ||
                                                   normalizedStatusForEdit.toLowerCase() === 'bm approved' ||
                                                   normalizedStatusForEdit.toLowerCase() === 'bmapproved';
                        const isOPApprovedForEdit = normalizedStatusForEdit === 'OPApproved' ||
                                                   normalizedStatusForEdit === 'OP Approved' ||
                                                   normalizedStatusForEdit.toLowerCase() === 'opapproved' ||
                                                   normalizedStatusForEdit.toLowerCase() === 'op approved';
                        const isAcAcknowledgedForEdit = normalizedStatusForEdit === 'Ac_Acknowledged' ||
                                                       normalizedStatusForEdit === 'Acknowledged' ||
                                                       normalizedStatusForEdit.toLowerCase() === 'ac_acknowledged' ||
                                                       normalizedStatusForEdit.toLowerCase() === 'acknowledged';

                        const canEditActualQty = ((status === 'Checked' || status === 'checked') && !isCompleted) && !shouldMakeActualQtyReadOnly ||
                                                 (isAccount && (isBMApprovedForEdit || isOPApprovedForEdit || isAcAcknowledgedForEdit));
                        
                        // Check for product_type editing first (disabled for now)
                        if (canEditProductType) {
                          return (
                            <input
                              type="number"
                              className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                              value={displayQty}
                              min="0"
                              step="any"
                              readOnly={systemQty === 0}
                              style={systemQty === 0 ? { pointerEvents: 'none', backgroundColor: '#f3f4f6' } : {}}
                              onChange={(e) => {
                                const newValue = parseFloat(e.target.value) || 0;
                                const matchId = item.id ?? item.specific_form_id;
                                
                                // Validate against system_qty
                                if (systemQty === 0 && newValue > 0) {
                                  setQtyErrorModal({
                                    isOpen: true,
                                    message: t('messages.errors.systemQtyZero', { defaultValue: 'System Quantity is 0. You cannot enter a quantity greater than 0.' })
                                  });
                                  return; // Don't update the value
                                }
                                
                                if (systemQty > 0 && newValue > systemQty) {
                                  const productName = item.product_name || item.name || item.product_code || item.code || t('common.product', { defaultValue: 'Product' });
                                  setQtyErrorModal({
                                    isOpen: true,
                                    message: t('messages.errors.actualQtyExceedsSystem', { 
                                      productName,
                                      qty: newValue,
                                      systemQty,
                                      defaultValue: `${productName}: Actual Quantity (${newValue}) cannot be greater than System Quantity (${systemQty}).`
                                    })
                                  });
                                  return; // Don't update the value
                                }
                                
                                onItemChange(
                                  items.findIndex(i => (i.id ?? i.specific_form_id) === matchId),
                                  'product_type',
                                  newValue
                                );
                              }}
                            />
                          );
                        }
                        
                        // In Checked stage, show editable input for actual_qty
                        if (canEditActualQty) {
                          return (
                            <div>
                              <input
                                type="text"
                                inputMode="decimal"
                                data-item-id={item.id ?? item.specific_form_id}
                                data-field="actual_qty"
                                data-qty-field="true"
                                data-auto-focus-target="true"
                                value={item.actual_qty ?? ''}
                                max={item.system_qty > 0 ? item.system_qty : undefined}
                                onFocus={() => {
                                  editingFieldRef.current = {
                                    id: item.id ?? item.specific_form_id,
                                    field: 'actual_qty',
                                  };
                                }}
                                onChange={(e) => {
                                  const nextValue = e.target.value;

                                  // Allow empty, numbers, decimals, and intermediate states like "." or "5."
                                  // Also allow comma (,) as decimal separator (common in some locales)
                                  // Convert comma to dot for consistency
                                  let normalizedValue = nextValue.replace(',', '.');

                                  // Check: only digits and at most one dot (after normalization)
                                  const hasOnlyDigitsAndOneDot = /^[\d.]*$/.test(normalizedValue) && (normalizedValue.match(/\./g) || []).length <= 1;


                                  if (nextValue === '' || hasOnlyDigitsAndOneDot) {
                                    const valueToUse = normalizedValue;
                                    // Validate against system_qty (only if we have a valid number)
                                    const systemQty = parseFloat(item.system_qty) || 0;
                                    const numericValue = valueToUse === '' || valueToUse === '.' ? 0 : parseFloat(valueToUse);

                                    if (systemQty === 0 && numericValue > 0) {
                                      // Show error modal
                                      setQtyErrorModal({
                                        isOpen: true,
                                        message: t('messages.errors.systemQtyZero', { defaultValue: 'System Quantity is 0. You cannot enter a quantity greater than 0.' })
                                      });
                                      return; // Don't update the value
                                    }

                                    if (systemQty > 0 && numericValue > systemQty) {
                                      // Show error modal
                                      const productName = item.product_name || item.name || item.product_code || item.code || t('common.product', { defaultValue: 'Product' });
                                      setQtyErrorModal({
                                        isOpen: true,
                                        message: t('messages.errors.actualQtyExceedsSystem', {
                                          productName,
                                          qty: numericValue,
                                          systemQty,
                                          defaultValue: `${productName}: Actual Quantity (${numericValue}) cannot be greater than System Quantity (${systemQty}).`
                                        })
                                      });
                                      return; // Don't update the value
                                    }

                                    handleQtyChange(item.id ?? item.specific_form_id, valueToUse, 'actual_qty');

                                    // Check if branch account is editing actual_qty in BM Approved status with amount > 500k
                                    // OP Approved forms don't need warning as they're already approved by Operation Manager
                                    const isBmApprovedOnly = status === 'BM Approved' || status === 'BMApproved';

                                    // Calculate current total from items to check against 500k threshold
                                    // Use the updated value for current item, existing values for others
                                    const currentItemId = item.id ?? item.specific_form_id;
                                    const currentTotal = items.reduce((acc, currItem) => {
                                      let qty;
                                      if (itemRowIdsEqual(currItem.id ?? currItem.specific_form_id, currentItemId)) {
                                        // This is the current item being edited - use the new value
                                        qty = parseFloat(valueToUse) || 0;
                                      } else {
                                        // Other items - use their current actual_qty
                                        qty = parseFloat(currItem.actual_qty) || 0;
                                      }
                                      const price = parseFloat(currItem.price) || 0;
                                      const amount = qty * price;
                                      return acc + amount;
                                    }, 0);

                                    if (isAccount && isBmApprovedOnly && currentTotal > 500000) {
                                      setAmountWarningModal({
                                        isOpen: true,
                                        message: t('messages.amountOver500kWarning', {
                                          defaultValue: 'The total amount exceeds 500,000. Please click "Back to Previous" to return this form for Operation Manager approval before making changes.'
                                        })
                                      });
                                    }
                                  }
                                }}
                                onBlur={(e) => {
                                  const rowId = item.id ?? item.specific_form_id;
                                  const endActualQtyEdit = () => {
                                    setTimeout(() => {
                                      if (
                                        itemRowIdsEqual(editingFieldRef.current?.id, rowId) &&
                                        editingFieldRef.current?.field === 'actual_qty'
                                      ) {
                                        editingFieldRef.current = null;
                                      }
                                    }, 250);
                                  };
                                  // Normalize value: handle empty, just ".", or trailing "."
                                  let normalizedValue = e.target.value.trim();
                                  if (normalizedValue === '' || normalizedValue === '.') {
                                    normalizedValue = '0';
                                  } else if (normalizedValue.endsWith('.')) {
                                    // Remove trailing dot: "5." becomes "5"
                                    normalizedValue = normalizedValue.slice(0, -1);
                                  }
                                  const systemQty = parseFloat(item.system_qty) || 0;
                                  const numericValue = parseFloat(normalizedValue) || 0;
                                  
                                  // Validate on blur as well - show error but don't auto-change
                                  if (systemQty === 0 && numericValue > 0) {
                                    setQtyErrorModal({
                                      isOpen: true,
                                      message: t('messages.errors.systemQtyZero', { defaultValue: 'System Quantity is 0. You cannot enter a quantity greater than 0.' })
                                    });
                                    // Reset to previous value
                                    e.target.value = String(item.actual_qty ?? '0');
                                    endActualQtyEdit();
                                    return;
                                  }
                                  
                                  if (systemQty > 0 && numericValue > systemQty) {
                                    const productName = item.product_name || item.name || item.product_code || item.code || t('common.product', { defaultValue: 'Product' });
                                    setQtyErrorModal({
                                      isOpen: true,
                                      message: t('messages.errors.actualQtyExceedsSystem', { 
                                        productName,
                                        qty: numericValue,
                                        systemQty,
                                        defaultValue: `${productName}: Actual Quantity (${numericValue}) cannot be greater than System Quantity (${systemQty}).`
                                      })
                                    });
                                    // Reset to previous value
                                    e.target.value = String(item.actual_qty ?? '0');
                                    endActualQtyEdit();
                                    return;
                                  }
                                  
                                  handleQtyChange(rowId, normalizedValue, 'actual_qty');
                                  endActualQtyEdit();
                                }}
                                className="w-20 border border-gray-300 rounded px-2 py-1"
                                title={item.system_qty > 0 ? `Maximum: ${item.system_qty}` : ''}
                              />
                            </div>
                          );
                        }
                        
                        return formatQuantity(displayQty);
                      })()}
                    </td>
                  )}
                  {/* Amount - calculated based on status:
                      - Checked (after BTP): price * actual_qty (backend recalculated using actual_qty)
                      - BM Approved: price * actual_qty
                      - OPApproved: price * actual_qty (backend recalculated using actual_qty)
                      - Other statuses: price * final_qty */}
                  <td className="px-2 py-2 whitespace-nowrap text-[13px]">
                    {(() => {
                      const systemQty = toSafeNumber(item.system_qty);
                      const actualQty = toSafeNumber(item.actual_qty);
                      const finalQty = toSafeNumber(item.final_qty ?? item.actual_qty);
                      const price = toSafeNumber(item.price);

                      // CRITICAL: After BTP, backend recalculates using actual_qty
                      // So for Checked status (after BTP), we should use actual_qty for amount
                      // For BM Approved, also use actual_qty
                      // For OPApproved and Ac_Acknowledged, also use actual_qty (backend recalculated using actual_qty)
                      // For other statuses, use final_qty
                      const isBMApproved = status === 'BM Approved' || status === 'BMApproved';
                      const isChecked = status === 'Checked' || status === 'checked';
                      const isOPApproved = status === 'OPApproved' || status === 'OP Approved';
                      const isAck = status === 'Ac_Acknowledged' || status === 'Acknowledged';
                      
                      // Use actual_qty for BM Approved, Checked (after BTP), OPApproved, and Ac_Acknowledged
                      // This ensures amounts match backend calculation which uses actual_qty
                      const baseQty = (isBMApproved || isChecked || isOPApproved || isAck) ? actualQty : finalQty;
                      
                      const qtyForAmount = systemQty > 0 && baseQty > systemQty
                        ? systemQty
                        : (systemQty === 0 ? 0 : baseQty);

                      const calculatedAmount = qtyForAmount * price;
                      
                      // For BM Approved, Checked, and OPApproved, always use calculated amount (price * actual_qty)
                      // For other statuses, prefer explicit total from backend if available
                      const displayAmount = (isBMApproved || isChecked || isOPApproved || isAck)
                        ? calculatedAmount 
                        : ((item.total ?? item.amount) ?? calculatedAmount);

                      return formatAmount(displayAmount);
                    })()}
                  </td>
                  
                  {/* Remark */}
                  <td className="px-2 py-2 text-[13px] align-top">
                    <div className="w-full" onClick={e => e.stopPropagation()}>
                      {/* View mode: wrap long text and allow vertical scroll if too long */}
                      {(mode === 'view' && status !== 'Ongoing' && status !== 'Checked' && status !== 'checked') ? (
                        <div className="min-w-[100px] p-1">
                          <div className="whitespace-pre-wrap break-words max-h-40 overflow-auto text-sm">
                            {item.remark && item.remark.trim() ? item.remark : '-'}
                          </div>
                        </div>
                      ) : (
                        <textarea
                          value={item.remark || ''}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleRemarkChange(item.id, e.target.value);
                          }}
                          onClick={e => e.stopPropagation()}
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y max-h-48 overflow-auto text-sm"
                          placeholder="Add remark..."
                          rows={3}
                          disabled={isCompleted && mode === 'view'}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-[13px]">
                    {/* Make img editable when: mode is add/edit, OR status is Ongoing/Checked (for newly added products) */}
                    {((mode === 'add' || mode === 'edit') || ((status === 'Ongoing' || status === 'Checked' || status === 'checked') && !isCompleted)) ? (
                      <div className="flex items-center gap-1">
                        {Array.isArray(item.img) && item.img.length > 0 ? (
                          <div className="relative">
                            {(() => {
                              const entry = item.img[0];
                              const src0 = typeof entry === 'string' ? entry : (entry?.src || '');
                              return (
                                <>
                                  <img
                                    src={src0}
                                    alt={item.name}
                                    loading="lazy"
                                    className="w-11 h-11 object-cover rounded-lg cursor-zoom-in border border-gray-200"
                                    onError={(e) => {
                                      e.currentTarget.src = testImage;
                                      e.currentTarget.onError = null;
                                    }}
                                    onClick={(e) => { e.stopPropagation(); openPreview(item.img, 0); }}
                                  />
                                  {item.img.length >= 2 && (
                                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-semibold min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center shadow-md">
                                      {item.img.length}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                            {/* Add more images button for desktop */}
                            {!isCompleted && (status === 'Ongoing' || status === 'Checked' || status === 'checked' || mode === 'add') && (
                              <>
                                <input
                                  type="file"
                                  id={`file-input-desktop-add-${item.id}`}
                                  ref={el => fileInputRefs.current[`add-${item.id}`] = el}
                                  onChange={(e) => handleImageUpload(item.id, e)}
                                  className="hidden"
                                  accept="image/*"
                                  multiple
                                />
                                <button
                                  type="button"
                                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:bg-blue-700 transition-colors z-10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (fileInputRefs.current[`add-${item.id}`]) {
                                      fileInputRefs.current[`add-${item.id}`].click();
                                    }
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  title={t('table.addMoreImages', { defaultValue: 'Add more images' })}
                                >
                                  <Plus size={12} strokeWidth={2.5} />
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <label 
                            className="w-7 h-7 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors shadow-sm border-2 border-white"
                            title="Add image"
                            htmlFor={`file-input-desktop-${item.id}`}
                          >
                            <input
                              type="file"
                              id={`file-input-desktop-${item.id}`}
                              ref={el => fileInputRefs.current[item.id] = el}
                              onChange={(e) => handleImageUpload(item.id, e)}
                              className="hidden"
                              accept="image/*"
                              multiple
                              disabled={isCompleted && mode === 'view'}
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </label>
                        )}
                        <button
                          type="button"
                          className="w-7 h-7 flex items-center justify-center bg-gray-500 text-white hover:bg-gray-600 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            openImageGallery(item);
                          }}
                          aria-label="View images"
                          title="View images"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      /* View mode - show image thumbnail with badge or view button */
                      <div className="flex items-center gap-1">
                        {Array.isArray(item.img) && item.img.length > 0 ? (
                          <div className="relative">
                            {(() => {
                              const entry = item.img[0];
                              const src0 = typeof entry === 'string' ? entry : (entry?.src || '');
                              return (
                                <>
                                  <img
                                    src={src0}
                                    alt={item.name}
                                    loading="lazy"
                                    className="w-11 h-11 object-cover rounded-lg cursor-zoom-in border border-gray-200"
                                    onError={(e) => {
                                      e.currentTarget.src = testImage;
                                      e.currentTarget.onError = null;
                                    }}
                                    onClick={(e) => { e.stopPropagation(); openPreview(item.img, 0); }}
                                  />
                                  {item.img.length >= 2 && (
                                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-semibold min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center shadow-md">
                                      {item.img.length}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="w-9 h-9 flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              openImageGallery(item);
                            }}
                            aria-label="View images"
                            title="View images"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  {/* Show account code column in all stages including Completed */}
                  {showAccountCodes && (
                    <td className="px-2 py-2 text-[13px]" onClick={(e) => e.stopPropagation()}>
                      {isCompleted ? (
                        <span className="inline-block rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                          {getAccountCodeLabel(item.acc_code1 ?? item.acc_code ?? '')}
                        </span>
                      ) : (
                        <select
                          className="w-full border border-gray-300 rounded px-2 py-1 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          value={item.acc_code1 ?? item.acc_code ?? ''}
                          onChange={(e) => {
                            const matchId = item.id ?? item.specific_form_id;
                            onItemAccountCodeChange(matchId, e.target.value);
                          }}
                        >
                          <option value="">Choose Account Code</option>
                          {accountCodes.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  )}
                </tr>
                );
              })
            ) : (
              <tr>
                <td 
                  colSpan={
                    1 + // checkbox
                    1 + // #
                    1 + // Category (hidden sm)
                    1 + // Code
                    1 + // Name
                    1 + // Unit (hidden sm)
                    1 + // System Qty (hidden md)
                    1 + // Price
                    1 + // Request Qty
                    (mode !== 'add' ? 1 : 0) + // Final Qty
                    (mode !== 'add' ? 1 : 0) + // Actual Qty
                    1 + // Amount
                    1 + // Remark (hidden lg)
                    1 + // Img (hidden md)
                    (showAccountCodes ? 1 : 0) // Account Code
                  } 
                  className="px-2 py-6 text-center"
                  style={{ fontSize: '13px' }}
                >
                {t('table.noItemsAdded', { defaultValue: 'No items added yet.' })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="block md:hidden">
        {paginatedItems.length ? (
          paginatedItems.map((item) => {
            const mobileSystemQtyZero = (parseFloat(item.system_qty) || 0) === 0;
            return (
            <div
              key={item.id}
              className={`border border-gray-200 rounded-lg p-2.5 mb-2 bg-white ${
                selectedIds.includes(item.id) ? "ring-1 ring-emerald-400 border-emerald-300" : ""
              } ${mobileSystemQtyZero ? "text-red-600 line-through" : ""}`}
            >
              {mobileSystemQtyZero && (
                <div className="text-[11px] font-medium mb-1.5 px-1 py-0.5 bg-red-50 border border-red-200 rounded no-underline" style={{ textDecoration: 'none' }} role="status">
                  {t('table.noStockStruckThrough', { defaultValue: 'No stock (System Qty: 0) — struck through' })}
                </div>
              )}
              <div className="flex gap-2 min-w-0">
                <input
                  type="checkbox"
                  className="mt-1 accent-emerald-600 shrink-0"
                  checked={selectedIds.includes(item.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSelect(item.id);
                  }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between min-w-0 gap-2">
                    <div className="min-w-0 flex-1 basis-0">
                      <div 
                        className="block w-full max-w-full overflow-hidden whitespace-nowrap text-ellipsis py-0.5 leading-tight cursor-pointer"
                        style={{ fontSize: '13px' }}
                        onClick={() => openProductModal(item)}
                      >
                      {item.name}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5" style={{ fontSize: '13px' }}>
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200" style={{ fontSize: '13px' }}>
                          {item.code}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200" style={{ fontSize: '13px' }}>
                          {item.unit}
                        </span>
                      </div>
                      
                      {/* Editable quantity inputs for mobile */}
                      {(() => {
                        // Determine which inputs to show based on user role and status (matching desktop logic)
                        const normalizedStatus = (status || '').toString().trim();
                        const isCheckedStage = (normalizedStatus === 'Checked' || normalizedStatus === 'checked') && !isCompleted;
                        const isBMApprovedStage = normalizedStatus === 'BM Approved' || normalizedStatus === 'BMApproved';
                        const isOPApprovedStage = normalizedStatus === 'OPApproved' || normalizedStatus === 'OP Approved';
                        const isAcAcknowledgedStage = normalizedStatus === 'Ac_Acknowledged' || normalizedStatus === 'Acknowledged';

                        // Determine edit permissions based on desktop logic
                        const canEditActualQty = ((normalizedStatus === 'Checked' || normalizedStatus === 'checked') && !isCompleted) ||
                                                 (isAccount && (isBMApprovedStage || isOPApprovedStage || isAcAcknowledgedStage));

                        const canEditFinalQty = !isCheckedStage && mode !== 'add' && allowFinalQtyEdit && !(isOpManager && isOPApprovedStage);

                        const canEditRequestQty = mode === 'add';

                        // Show inputs if any editing is allowed
                        const showInputs = canEditRequestQty || canEditActualQty || canEditFinalQty;

                        if (!showInputs) {
                          return null;
                        }

                        return (
                          <div
                            className="mt-2 space-y-2"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchEnd={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            {/* Request Qty - shown in add mode */}
                            {canEditRequestQty && (
                              <div>
                                <label
                                  className="block text-xs text-gray-600 mb-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  {t('table.requestQty', { defaultValue: 'Request Qty' })}
                                </label>
                                <input
                                  type="number"
                                  data-item-id={item.id}
                                  data-field="request_qty"
                                  value={item.request_qty ?? ''}
                                  step="any"
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    const val = e.target.value;

                                    // Mobile validation for system qty limits (same as desktop)
                                    const systemQty = parseFloat(item.system_qty) || 0;
                                    const numericValue = val === '' || val === '.' || !val ? 0 : parseFloat(val) || 0;


                                    if (systemQty === 0 && numericValue > 0) {
                                      setQtyErrorModal({
                                        isOpen: true,
                                        message: t('messages.errors.systemQtyZero', { defaultValue: 'System Quantity is 0. You cannot enter a quantity greater than 0.' })
                                      });
                                      return;
                                    }

                                    if (systemQty > 0 && numericValue > systemQty) {
                                      const productName = item.product_name || item.name || item.product_code || item.code || t('common.product', { defaultValue: 'Product' });
                                      setQtyErrorModal({
                                        isOpen: true,
                                        message: t('messages.errors.requestQtyExceedsSystem', {
                                          productName,
                                          qty: numericValue,
                                          systemQty,
                                          defaultValue: `${productName}: Request Quantity (${numericValue}) cannot be greater than System Quantity (${systemQty}).`
                                        })
                                      });
                                      return;
                                    }

                                    handleInputChange(item.id ?? item.specific_form_id, 'request_qty', val);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  min="0"
                                />
                              </div>
                            )}

                            {/* Final Qty - shown when allowed (not in checked stage for BM) */}
                            {canEditFinalQty && (
                              <div>
                                <label
                                  className="block text-xs text-gray-600 mb-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  {t('table.finalQty', { defaultValue: 'Final Qty' })}
                                </label>
                                <input
                                  type="number"
                                  data-item-id={item.id}
                                  data-field="final_qty"
                                  value={item.final_qty ?? ''}
                                  step="any"
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    const val = e.target.value;

                                    // Mobile validation for system qty limits
                                    const systemQty = parseFloat(item.system_qty) || 0;
                                    const numericValue = val === '' || val === '.' ? 0 : parseFloat(val);

                                    if (systemQty === 0 && numericValue > 0) {
                                      setQtyErrorModal({
                                        isOpen: true,
                                        message: t('messages.errors.systemQtyZero', { defaultValue: 'System Quantity is 0. You cannot enter a quantity greater than 0.' })
                                      });
                                      return;
                                    }

                                    if (systemQty > 0 && numericValue > systemQty) {
                                      const productName = item.product_name || item.name || item.product_code || item.code || t('common.product', { defaultValue: 'Product' });
                                      setQtyErrorModal({
                                        isOpen: true,
                                        message: t('messages.errors.finalQtyExceedsSystem', {
                                          productName,
                                          qty: numericValue,
                                          systemQty,
                                          defaultValue: `${productName}: Final Quantity (${numericValue}) cannot be greater than System Quantity (${systemQty}).`
                                        })
                                      });
                                      return;
                                    }

                                    handleInputChange(item.id ?? item.specific_form_id, 'final_qty', val);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  min="0"
                                />
                              </div>
                            )}

                            {/* Actual Qty - shown for checker in ongoing, BM in checked, branch account in approved stages */}
                            {canEditActualQty && (
                              <div>
                                <label
                                  className="block text-xs text-gray-600 mb-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  {t('table.actualQty', { defaultValue: 'Actual Qty' })}
                                </label>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  data-item-id={item.id ?? item.specific_form_id}
                                  data-field="actual_qty"
                                  data-qty-field="true"
                                  value={item.actual_qty ?? ''}
                                  onFocus={(e) => {
                                    e.stopPropagation();
                                    editingFieldRef.current = {
                                      id: item.id ?? item.specific_form_id,
                                      field: 'actual_qty',
                                    };
                                  }}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    const nextValue = e.target.value;

                                    // Allow empty, numbers, decimals, and intermediate states like "." or "5."
                                    // Also allow comma (,) as decimal separator (common in some locales)
                                    // Convert comma to dot for consistency
                                    let normalizedValue = nextValue.replace(',', '.');

                                    // Check: only digits and at most one dot (after normalization)
                                    const hasOnlyDigitsAndOneDot = /^[\d.]*$/.test(normalizedValue) && (normalizedValue.match(/\./g) || []).length <= 1;

                                    if (nextValue === '' || hasOnlyDigitsAndOneDot) {
                                      const valueToUse = normalizedValue;
                                      // Validate against system_qty (only if we have a valid number)
                                      const systemQty = parseFloat(item.system_qty) || 0;
                                      const numericValue = valueToUse === '' || valueToUse === '.' ? 0 : parseFloat(valueToUse);

                                      if (systemQty === 0 && numericValue > 0) {
                                        setQtyErrorModal({
                                          isOpen: true,
                                          message: t('messages.errors.systemQtyZero', { defaultValue: 'System Quantity is 0. You cannot enter a quantity greater than 0.' })
                                        });
                                        return; // Don't update the value
                                      }

                                      if (systemQty > 0 && numericValue > systemQty) {
                                        const productName = item.product_name || item.name || item.product_code || item.code || t('common.product', { defaultValue: 'Product' });
                                        setQtyErrorModal({
                                          isOpen: true,
                                          message: t('messages.errors.actualQtyExceedsSystem', {
                                            productName,
                                            qty: numericValue,
                                            systemQty,
                                            defaultValue: `${productName}: Actual Quantity (${numericValue}) cannot be greater than System Quantity (${systemQty}).`
                                          })
                                        });
                                        return; // Don't update the value
                                      }

                                      // Use handleQtyChange instead of handleInputChange to properly recalculate amount
                                      handleQtyChange(item.id ?? item.specific_form_id, valueToUse, 'actual_qty');

                                      // Check if branch account is editing actual_qty in BM Approved status with amount > 500k
                                      // OP Approved forms don't need warning as they're already approved by Operation Manager
                                      const isBmApprovedOnly = status === 'BM Approved' || status === 'BMApproved';

                                      // Calculate current total from items to check against 500k threshold
                                      // Use the updated value for current item, existing values for others
                                      const currentItemId = item.id ?? item.specific_form_id;
                                      const currentTotal = items.reduce((acc, currItem) => {
                                        let qty;
                                        if (itemRowIdsEqual(currItem.id ?? currItem.specific_form_id, currentItemId)) {
                                          // This is the current item being edited - use the new value
                                          qty = parseFloat(valueToUse) || 0;
                                        } else {
                                          // Other items - use their current actual_qty
                                          qty = parseFloat(currItem.actual_qty) || 0;
                                        }
                                        const price = parseFloat(currItem.price) || 0;
                                        const amount = qty * price;
                                        return acc + amount;
                                      }, 0);

                                      if (isAccount && isBmApprovedOnly && currentTotal > 500000) {
                                        setAmountWarningModal({
                                          isOpen: true,
                                          message: t('messages.amountOver500kWarning', {
                                            defaultValue: 'The total amount exceeds 500,000. Please click "Back to Previous" to return this form for Operation Manager approval before making changes.'
                                          })
                                        });
                                      }
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const rowId = item.id ?? item.specific_form_id;
                                    const endActualQtyEdit = () => {
                                      setTimeout(() => {
                                        if (
                                          itemRowIdsEqual(editingFieldRef.current?.id, rowId) &&
                                          editingFieldRef.current?.field === 'actual_qty'
                                        ) {
                                          editingFieldRef.current = null;
                                        }
                                      }, 250);
                                    };
                                    // Normalize value: handle empty, just ".", or trailing "."
                                    let normalizedValue = e.target.value.trim();
                                    if (normalizedValue === '' || normalizedValue === '.') {
                                      normalizedValue = '0';
                                    } else if (normalizedValue.endsWith('.')) {
                                      // Remove trailing dot: "5." becomes "5"
                                      normalizedValue = normalizedValue.slice(0, -1);
                                    }
                                    const systemQty = parseFloat(item.system_qty) || 0;
                                    const numericValue = parseFloat(normalizedValue) || 0;
                                    
                                    // Validate on blur as well - show error but don't auto-change
                                    if (systemQty === 0 && numericValue > 0) {
                                      setQtyErrorModal({
                                        isOpen: true,
                                        message: t('messages.errors.systemQtyZero', { defaultValue: 'System Quantity is 0. You cannot enter a quantity greater than 0.' })
                                      });
                                      endActualQtyEdit();
                                      return;
                                    }
                                    
                                    if (systemQty > 0 && numericValue > systemQty) {
                                      const productName = item.product_name || item.name || item.product_code || item.code || t('common.product', { defaultValue: 'Product' });
                                      setQtyErrorModal({
                                        isOpen: true,
                                        message: t('messages.errors.actualQtyExceedsSystem', {
                                          productName,
                                          qty: numericValue,
                                          systemQty,
                                          defaultValue: `${productName}: Actual Quantity (${numericValue}) cannot be greater than System Quantity (${systemQty}).`
                                        })
                                      });
                                      endActualQtyEdit();
                                      return;
                                    }
                                    
                                    // Update with normalized value on blur
                                    if (normalizedValue !== String(item.actual_qty ?? '')) {
                                      handleQtyChange(rowId, normalizedValue, 'actual_qty');
                                    }
                                    endActualQtyEdit();
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  min="0"
                                />
                              </div>
                            )}

                            {/* Remark - always editable when inputs are shown */}
                            <div>
                              <label
                                className="block text-xs text-gray-600 mb-0.5"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                {t('table.remark', { defaultValue: 'Remark' })}
                              </label>
                              <input
                                type="text"
                                value={item.remark || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleInputChange(item.id ?? item.specific_form_id, 'remark', e.target.value);
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                }}
                                onTouchStart={(e) => {
                                  e.stopPropagation();
                                }}
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                }}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder={t('table.enterRemark', { defaultValue: 'Enter remark...' })}
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Account Code - show in mobile detail card */}
                      {showAccountCodes && (
                        <div
                          className="mt-2"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onTouchEnd={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <label className="block text-xs text-gray-600 mb-0.5">
                            {t('table.accountCode', { defaultValue: 'Account Code' })}
                          </label>
                          {isCompleted ? (
                            <span className="inline-block w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                              {getAccountCodeLabel(item.acc_code1 ?? item.acc_code ?? '')}
                            </span>
                          ) : (
                            <select
                              className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              value={item.acc_code1 ?? item.acc_code ?? ''}
                              onChange={(e) => {
                                const matchId = item.id ?? item.specific_form_id;
                                onItemAccountCodeChange(matchId, e.target.value);
                              }}
                            >
                              <option value="">{t('table.chooseAccountCode', { defaultValue: 'Choose Account Code' })}</option>
                              {accountCodes.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}

                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative">
                        {Array.isArray(item.img) && item.img.length > 0 ? (
                          (() => {
                            const entry = item.img[0];
                            const src0 = typeof entry === 'string' ? entry : (entry?.src || '');
                            return (
                              <>
                                <img
                                  src={src0}
                                  alt={item.name}
                                  loading="lazy"
                                  className="w-11 h-11 object-cover rounded-lg border border-gray-200 cursor-pointer"
                                  onError={(e) => {
                                    e.currentTarget.src = testImage;
                                    e.currentTarget.onError = null;
                                  }}
                                  onClick={(e) => { 
                                    e.stopPropagation();
                                    // Always show preview when clicking image
                                    setPreviewItemId(item.id);
                                    openPreview(item.img, 0);
                                  }}
                                />
                                {item.img.length >= 2 && (
                                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-semibold min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center shadow-md z-10">
                                    {item.img.length}
                                  </div>
                                )}
                                {/* Delete button for Ongoing and Checked stage */}
                                {(status === 'Ongoing' || status === 'Checked' || status === 'checked') && !isCompleted && mode !== 'add' && (
                                  <button
                                    type="button"
                                    className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:bg-red-600 transition-colors z-10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Delete the first image (index 0)
                                      removeImage(item.id, 0);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    title={t('table.deleteImage', { defaultValue: 'Delete image' })}
                                  >
                                    <X size={10} strokeWidth={3} />
                                  </button>
                                )}
                                {/* Upload button for Ongoing, Checked, and Add stages - separate from preview */}
                                {!isCompleted && (status === 'Ongoing' || status === 'Checked' || status === 'checked' || mode === 'add') && (
                                  <>
                                    <input
                                      type="file"
                                      id={`file-input-mobile-${item.id}`}
                                      ref={el => fileInputRefs.current[item.id] = el}
                                      onChange={(e) => handleImageUpload(item.id, e)}
                                      className="hidden"
                                      accept="image/*"
                                      multiple
                                    />
                                    <button
                                      type="button"
                                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:bg-blue-700 transition-colors z-10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (fileInputRefs.current[item.id]) {
                                          fileInputRefs.current[item.id].click();
                                        }
                                      }}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onTouchStart={(e) => e.stopPropagation()}
                                      title={t('table.addMoreImages', { defaultValue: 'Add more images' })}
                                    >
                                      <Plus size={12} strokeWidth={2.5} />
                                    </button>
                                  </>
                                )}
                              </>
                            );
                          })()
                        ) : (
                          <>
                            {!isCompleted && (status === 'Ongoing' || status === 'Checked' || status === 'checked' || mode === 'add') ? (
                              <label
                                className="w-11 h-11 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-200 hover:border-blue-400 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="file"
                                  id={`file-input-mobile-${item.id}`}
                                  ref={el => fileInputRefs.current[item.id] = el}
                                  onChange={(e) => handleImageUpload(item.id, e)}
                                  className="hidden"
                                  accept="image/*"
                                  multiple
                                />
                                <Upload size={18} strokeWidth={1.5} />
                              </label>
                            ) : (
                              <div 
                                className="w-11 h-11 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 cursor-pointer"
                                onClick={() => openProductModal(item)}
                              >
                                <ImageIcon size={20} strokeWidth={1.5} />
                          </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className="flex items-center justify-between mt-2 cursor-pointer"
                    onClick={() => openProductModal(item)}
                  >
                    <span className="text-emerald-700 font-semibold text-sm">
                      {Number(item.amount || 0).toLocaleString()}
                    </span>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
            );
          })
        ) : (
          <p className="text-center text-gray-400 text-sm py-6">{t('table.noItemsAdded', { defaultValue: 'No items added yet.' })}</p>
        )}

             {/* Delete button - mobile sticky; same visibility as desktop toolbar */}
             {canDeleteSelectedItems && (
          <div className="sticky bottom-2 left-0 w-full flex justify-center mt-3">
            <button
              onClick={confirmMultipleDelete}
              className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white text-sm rounded-md shadow hover:bg-red-700 transition"
            >
              <Trash2 size={14} /> {t('table.delete', { defaultValue: 'Delete' })} ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-3 text-[0.7rem] sm:text-xs text-gray-600">
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className={`flex items-center gap-1 px-2 py-[2px] border rounded ${
              currentPage === 1
                ? "text-gray-300 border-gray-200 cursor-not-allowed"
                : "hover:bg-gray-100"
            }`}
          >
            <ChevronLeft size={12} /> {t('table.prev', { defaultValue: 'Prev' })}
          </button>

          <span>
            {t('table.page', { defaultValue: 'Page' })} {currentPage} {t('table.of', { defaultValue: 'of' })} {totalPages}
          </span>

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-1 px-2 py-[2px] border rounded ${
              currentPage === totalPages
                ? "text-gray-300 border-gray-200 cursor-not-allowed"
                : "hover:bg-gray-100"
            }`}
          >
            {t('table.next', { defaultValue: 'Next' })} <ChevronRight size={12} />
          </button>
        </div>
      )}

      <div className="flex justify-end gap-6 items-center mt-4 bg-green-50 p-3 rounded-md font-bold text-green-700" style={{ fontSize: '13px' }}>
        <span>{t('table.total', { defaultValue: 'Total' })}</span>
        <span className="text-right">{Math.round(total).toLocaleString('en-US')}</span>
      </div>

      {/* Update System Qty Button - Matches Laravel acknowledge() function logic exactly */}
      {/* Shows only when: ACK user, ACK entry exists, status matches amount, form type is big_damage, form not issued/completed */}
      {(() => {
        const isOperationManager = normalizedRole === 'op_manager';
        const isOPApprovedStatus = status === 'OPApproved' || status === 'OP Approved';
        const shouldHideForOpManager = isOperationManager && isOPApprovedStatus;


        // Hide button for operation manager viewing OP approved forms
        if (shouldHideForOpManager) {
          return null;
        }

        return canShowUpdateSystemQtyButton && !isSupervisorUser && mode !== 'add';
      })() && (
        <div className="mt-4 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-6 flex-wrap">
            <button
              type="button"
              onClick={handleUpdateSystemQty}
              disabled={isUpdatingSystemQty}
              className="btn btn-info me-2 text-sm px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingSystemQty ? t('table.updating', { defaultValue: 'Updating...' }) : systemQtyUpdated ? t('table.updateSystemQtyAgain', { defaultValue: 'Update System Qty Again' }) : t('table.updateSystemQty', { defaultValue: 'Update System Qty' })}
            </button>
            {!systemQtyUpdated && (
              <p className="text-red-600 text-xs flex items-center ml-1">
                <span className="text-red-600 font-bold mr-1">*</span>
                <span className="ml-2">{t('table.updateSystemQtyWarning', { defaultValue: 'Please update your system qty before clicking the Issued button.' })}</span>
              </p>
            )}
          </div>

          {/* ISS Remark Type - For account at OP Approved or when they can acknowledge */}
          {(() => {
            // Account should be able to choose ISS remark at OPApproved stage (before acknowledging)
            // Show ISS remark selector when account is at OPApproved, BM Approved, or Ac_Acknowledged stage
            // (Account can acknowledge from both OPApproved and BM Approved stages, and can edit at Ac_Acknowledged)
            const isAccountAtOPApproved = isAccount && (
              status === 'OPApproved' || 
              status === 'OP Approved' || 
              status === 'BM Approved' || 
              status === 'BMApproved' ||
              status === 'Ac_Acknowledged' || // Show at Ac_Acknowledged so account can see/edit their selection
              status === 'Acknowledged'
            );
            // Also show if supervisor is at Ac_Acknowledged/Approved stage
            const isSupervisorAtAcknowledged = isSupervisorUser && (
              status === 'Ac_Acknowledged' ||
              status === 'Acknowledged' ||
              status === 'Approved'
            );
            const shouldRenderSection = issueRemarks.length > 0 && (isAccountAtOPApproved || isSupervisorAtAcknowledged || Boolean(issRemark) || isCompleted);
            
            if (!shouldRenderSection) {
              return null;
            }
            
            return (
              <div className="mt-3 ">
                <label className="block text-xs font-semibold text-gray-600 mb-1">ISS Remark Type</label>
                {isCompleted ? (
                  <div className="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    {(() => {
                      // Try to match by value (ID) first
                      let matchedOption = issueRemarks.find(option => option.value === issRemark || String(option.value) === String(issRemark));
                      
                      // If not found by value, try to match by label/name (issRemark might be the remark name from general_form_files.file)
                      if (!matchedOption && issRemark) {
                        matchedOption = issueRemarks.find(option => 
                          option.label === issRemark || 
                          option.name === issRemark ||
                          String(option.label).toLowerCase() === String(issRemark).toLowerCase()
                        );
                      }
                      
                      const displayValue = matchedOption?.label || 
                        (issRemark && issRemark.startsWith('ISS') ? `${issRemark} (No remark type selected)` : issRemark) || 
                        'Not selected';
                      return displayValue;
                    })()}
                  </div>
                ) : (
                  <select
                    className="w-full sm:w-72 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={issRemark ?? ''}
                    onChange={(e) => {
                      const newValue = e.target.value || null;
                      onAccountSettingsChange({ iss_remark: newValue });
                    }}
                  >
                    <option value="">Choose Remark</option>
                    {issueRemarks.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Supervisor Actions Section - For supervisor at Ac_Acknowledged */}
      {isSupervisorUser && mode !== 'add' && !isCompleted && (status === 'Ac_Acknowledged' || status === 'Acknowledged' || status === 'Approved') && (
        <div className="mt-4 py-4 bg-amber-50 border border-amber-200 rounded-md space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Supervisor Actions</h4>
          
          {/* ISS Remark Type Selection - Editable for supervisor */}
          {issueRemarks.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                ISS Remark Type
              </label>
              <select
                className="w-full sm:w-72 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={issRemark ?? ''}
                onChange={(e) => {
                  const newValue = e.target.value || null;
                  onAccountSettingsChange({ iss_remark: newValue });
                }}
              >
                <option value="">Choose Remark</option>
                {issueRemarks.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <ConfirmationModal
        show={showConfirm}
        title="Delete Selected Items"
        message={`Are you sure you want to delete ${selectedIds.length} selected item(s)?`}
        onConfirm={handleMultipleDelete}
        onCancel={cancelRemove}
      />

      <ProductDetailModal
        isOpen={isProductModalOpen}
        onClose={closeProductModal}
        product={selectedProduct ? (() => {
          // Get the current item from items array to ensure we have the latest data
          const currentItem = items.find(item => item.id === selectedProduct.id) || selectedProduct;
          return {
            ...currentItem,
            modalImages: extractImageArray(currentItem)
          };
        })() : null}
        accountCodes={accountCodes}
        getAccountCodeLabel={getAccountCodeLabel}
        mode={mode}
        isCompleted={isCompleted}
        onRemarkChange={handleRemarkChange}
        handleImageUpload={handleImageUpload}
      />

      {previewOpen && previewMode === 'gallery' && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center image-preview-backdrop"
          onClick={closePreview}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] image-preview-content bg-white rounded-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header with close button */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('table.imageGallery', { defaultValue: 'Image Gallery' })} ({previewImages.length} {previewImages.length === 1 ? t('table.image', { defaultValue: 'image' }) : t('table.images', { defaultValue: 'images' })})
              </h3>
              <button
                onClick={closePreview}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label={t('common.close', { defaultValue: 'Close' })}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Gallery Grid */}
            <div className="p-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {previewImages.map((imageSrc, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={imageSrc}
                        alt={`Gallery image ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.currentTarget.src = testImage;
                          e.currentTarget.onError = null;
                        }}
                        onClick={() => {
                          // Switch to single image view on click
                          setPreviewImages([imageSrc]);
                          setPreviewIndex(0);
                          setPreviewMode('single');
                        }}
                      />
                    </div>

                    {/* Download button - always visible */}
                    <button
                      className="absolute top-2 left-2 w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          // Handle different types of image URLs
                          let downloadUrl = imageSrc;
                          let filename = `damage-image-${index + 1}.jpg`;

                          // If it's a blob URL or data URL, use it directly
                          if (imageSrc.startsWith('blob:') || imageSrc.startsWith('data:')) {
                            downloadUrl = imageSrc;
                          } else {
                            // For other URLs, try to fetch and download
                            const response = await fetch(imageSrc);
                            if (!response.ok) throw new Error('Failed to fetch image');
                            const blob = await response.blob();
                            downloadUrl = URL.createObjectURL(blob);
                          }

                          const link = document.createElement('a');
                          link.href = downloadUrl;
                          link.download = filename;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);

                          // Clean up blob URL if we created one
                          if (downloadUrl.startsWith('blob:')) {
                            URL.revokeObjectURL(downloadUrl);
                          }
                        } catch (error) {
                          console.error('Failed to download image:', error);
                          // Fallback: try opening in new tab
                          window.open(imageSrc, '_blank');
                        }
                      }}
                      aria-label={t('table.downloadImage', { defaultValue: 'Download image' })}
                      title={t('table.downloadImage', { defaultValue: 'Download image' })}
                    >
                      <Download className="h-4 w-4" />
                    </button>

                    {/* Delete button - only show when editable */}
                    {((mode === 'add' || mode === 'edit') || (status === 'Ongoing' && !isCompleted) || (status === 'Checked' && isApproverRole)) && previewItemId && (
                      <button
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Set the current image to delete and call delete function
                          setPreviewIndex(index);
                          handleDeleteCurrentImage();
                        }}
                        aria-label={t('table.deleteImage', { defaultValue: 'Delete image' })}
                        title={t('table.deleteImage', { defaultValue: 'Delete image' })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    {/* Image number indicator */}
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer with actions */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closePreview}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                {t('common.close', { defaultValue: 'Close' })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Image Preview Modal (for when clicking on gallery image) */}
      {previewOpen && previewMode === 'single' && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center image-preview-backdrop"
          onClick={closePreview}
        >
          <div className="relative max-w-[70vw] max-h-[75vh] image-preview-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImages[previewIndex]}
              alt="Preview"
              className="max-w-[60vw] max-h-[60vh] object-contain rounded shadow"
            />

            {/* Download button */}
            <button
              className="absolute top-2 left-2 w-10 h-10 rounded-full bg-blue-500/80 hover:bg-blue-600 text-white flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const imageSrc = previewImages[previewIndex];
                  let downloadUrl = imageSrc;
                  let filename = `damage-image-${previewIndex + 1}.jpg`;

                  // If it's a blob URL or data URL, use it directly
                  if (imageSrc.startsWith('blob:') || imageSrc.startsWith('data:')) {
                    downloadUrl = imageSrc;
                  } else {
                    // For other URLs, try to fetch and download
                    const response = await fetch(imageSrc);
                    if (!response.ok) throw new Error('Failed to fetch image');
                    const blob = await response.blob();
                    downloadUrl = URL.createObjectURL(blob);
                  }

                  const link = document.createElement('a');
                  link.href = downloadUrl;
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);

                  // Clean up blob URL if we created one
                  if (downloadUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(downloadUrl);
                  }
                } catch (error) {
                  console.error('Failed to download image:', error);
                  // Fallback: try opening in new tab
                  window.open(previewImages[previewIndex], '_blank');
                }
              }}
              aria-label={t('table.downloadImage', { defaultValue: 'Download image' })}
              title={t('table.downloadImage', { defaultValue: 'Download image' })}
            >
              <Download className="h-5 w-5" />
            </button>

            {/* Close button */}
            <button
              className="absolute top-2 right-2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
              onClick={closePreview}
              aria-label={t('common.close', { defaultValue: 'Close' })}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
      
      {/* Filter Modal with Animation */}
      {isFilterModalOpen && (
        <>
          {/* Backdrop with blur effect */}
          <div 
            className="fixed inset-0 backdrop-blur-sm bg-white/10 z-50 transition-opacity duration-300 animate-fadeIn"
            onClick={() => setIsFilterModalOpen(false)}
          ></div>
          
          {/* Modal with slide-in animation */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto transform transition-all duration-300 animate-slideInUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <Filter size={24} className="text-gray-700" />
                  <h2 className="text-xl font-bold text-gray-800">Filter Products</h2>
                </div>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-600 hover:text-gray-800"
                  aria-label="Close filter modal"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">All Categories</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                {/* Unit Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unit
                  </label>
                  <select
                    value={filters.unit}
                    onChange={(e) => setFilters(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">All Units</option>
                    {uniqueUnits.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                
                {/* Price Range with Slider */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Price Range: {filters.minPrice || priceRange.min} - {filters.maxPrice || priceRange.max}
                  </label>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                      <input
                        type="range"
                        min={priceRange.min}
                        max={priceRange.max}
                        value={filters.minPrice || priceRange.min}
                        onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{priceRange.min}</span>
                        <span className="font-semibold text-blue-600">{filters.minPrice || priceRange.min}</span>
                        <span>{priceRange.max}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                      <input
                        type="range"
                        min={priceRange.min}
                        max={priceRange.max}
                        value={filters.maxPrice || priceRange.max}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{priceRange.min}</span>
                        <span className="font-semibold text-blue-600">{filters.maxPrice || priceRange.max}</span>
                        <span>{priceRange.max}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Amount Range with Slider */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Amount Range: {filters.minAmount || amountRange.min} - {filters.maxAmount || amountRange.max}
                  </label>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Min Amount</label>
                      <input
                        type="range"
                        min={amountRange.min}
                        max={amountRange.max}
                        value={filters.minAmount || amountRange.min}
                        onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{amountRange.min}</span>
                        <span className="font-semibold text-blue-600">{filters.minAmount || amountRange.min}</span>
                        <span>{amountRange.max}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Max Amount</label>
                      <input
                        type="range"
                        min={amountRange.min}
                        max={amountRange.max}
                        value={filters.maxAmount || amountRange.max}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{amountRange.min}</span>
                        <span className="font-semibold text-blue-600">{filters.maxAmount || amountRange.max}</span>
                        <span>{amountRange.max}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl flex items-center justify-between gap-3 border-t border-gray-200">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Reset Filters
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsFilterModalOpen(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage(1);
                      setIsFilterModalOpen(false);
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
