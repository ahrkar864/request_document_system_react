import { Link, useLocation, useParams } from 'react-router-dom';
import dashboardPhoto from "../../assets/images/reqBa.png";
import { FiCopy } from 'react-icons/fi';
import { useEffect, useRef, useState } from 'react';
import NavPath from '../../components/NavPath';
import { fetchData } from '../../api/FetchApi';
import { confirmAlert } from 'react-confirm-alert';
import { useNavigate } from "react-router-dom";
import CctvUploadVideo from './inputs/CctvUploadVideo';
import StatusBadge from '../../components/ui/StatusBadge';
import CctvDownloadVideo from './inputs/CctvDownloadVideo';
import { useDispatch, useSelector } from 'react-redux';

export default function CctvDetails() {
    
    const navigate = useNavigate();
    const { id } = useParams();
    const dispatch = useDispatch();
    const { user, token } = useSelector((state) => state.auth);
    const [copied, setCopied] = useState(false);
    const [recordDetails, setRecordDetails] = useState(null);
    const [isApprover, setIsApprover] = useState(false);
    const [isBranchITApprover, setIsBranchITApprover] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const actualUserId = user?.id;
    const route = "cctv_record";
    const form_id = 15;
    const layout_id = 14;

    const [remark, setRemark] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [action, setAction] = useState('');
    const [isOpen, setIsOpen] = useState(true);
    const [IsVideoDownloadOpen, setIsVideoDownloadOpen] = useState(false);
    const [showAlert, setShowAlert] = useState(true);
    const [loading, setLoading] = useState(true);

    const location = useLocation();
    const fromSearch = location.state?.fromSearch;
    const searchPayload = location.state?.searchPayload;
    const formData = location.state?.formData;
    const hasFetchedInitial = useRef(false);


    const checkApprover = () => {
        if (!recordDetails || recordDetails.form.status !== 'Ongoing') return false;

        const approvalProcessUsers = recordDetails.approval_process_users;
        if (!approvalProcessUsers) return false;

        const isSpecialRemark = ['change form', 'create brand', 'create category'].includes(recordDetails.form.g_remark);
        const checkerType = isSpecialRemark ? 'CS' : 'C';
        const checker = approvalProcessUsers.find(u => u.user_type === checkerType);
        const statusConditions = (
            (checker && recordDetails.form.status === 'Checked') ||
            (!checker && ['Ongoing', 'Ongoing(Edit)'].includes(recordDetails.form.status)) ||
            (checker && recordDetails.form.status === 'Ongoing' )
        );
        if (statusConditions) {
            console.log('currentUser')
            const currentUser = approvalProcessUsers.find(u =>
                u.user_type === 'A1' &&
                u.general_form_id === recordDetails.form.id &&
                u.admin_id === actualUserId
            );
            const isUserApprover = user?.role_id =='Approver';
            return currentUser && isUserApprover;
        }
        return false;
    };

    const checkBranchITApprover = () => {
        if (!recordDetails || recordDetails.form.status !== 'BM Approved') return false;

        const approvalProcessUsers = recordDetails.approval_process_users;
        if (!approvalProcessUsers) return false;

        const current_user = approvalProcessUsers.find(
            u => u.user_type === 'ACK' &&
                u.general_form_id === recordDetails.form.id &&
                u.admin_id === user.id
        );
        console.log('is branch it user=>','role id =>',user?.role_id,user?.id);
        const isBranchITUser = user?.role_id === 'Branch IT';
        console.log('is branch it user=>',isBranchITUser,'role id =>',user.role_id);
        return current_user && isBranchITUser;
    };

    const checkManager = () => {
        if (!recordDetails || recordDetails.form.status !== 'Checked') return false;    

        const approvalProcessUsers = recordDetails.approval_process_users;
        if (!approvalProcessUsers) return false;

        const current_user = approvalProcessUsers.find(
            u => u.user_type === 'A2' &&
                u.general_form_id === recordDetails.form.id &&
                u.admin_id === user.id
        );
        const isManager = user?.role_id === 'Approver';
        return current_user && isManager || user?.employee_number === '000-000548';
    }

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!id || !token || hasFetchedInitial.current) return;

        const fetchRecordDetails = async () => {
            hasFetchedInitial.current = true;
            setLoading(true);
            
            try {
                const recordData = await fetchData(`/api/cctv-records/${id}`, token, 'record details');
                if (recordData) {
                    setRecordDetails(recordData);
                } else {
                    console.error('No data received from API');
                    // Handle case where no data is returned
                }
            } catch (error) {
                console.error('Error fetching record details:', error);
                if (error.message.includes('404')) {
                    // Handle 404 - Record not found
                    navigate('/cctv-request', { 
                        state: { 
                            error: 'Record not found or you do not have permission to view it.' 
                        } 
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchRecordDetails();
    }, [id, navigate]);



    // ✅ 3. Set user roles once related data is loaded
    useEffect(() => {
        setIsApprover(checkApprover());
        setIsBranchITApprover(checkBranchITApprover());
        setIsManager(checkManager());
    }, [recordDetails, user]);


    function formatDateTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(',', '');
    }

    const handleSubmit = async (submitStatus) => {
        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        try {
            const url = `/api/users/cctv_record/${form_id}/${layout_id}/${id}/approve?route=${route}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    comment: remark,
                    actual_user_id: actualUserId,
                    status: submitStatus,
                    action: action
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    const errorMessages = Object.values(data.errors).flat().join('\n');
                    confirmAlert({
                        title: "Validation Error",
                        message: errorMessages,
                        buttons: [{ label: "OK" }],
                    });
                } else {
                    confirmAlert({
                        title: "Error",
                        message: data.message || 'Failed to submit',
                        buttons: [{ label: "OK" }],
                    });
                }
                return;
            }

            confirmAlert({
                title: "Success",
                message: "Form submitted successfully!",
                buttons: [
                    {
                        label: "OK",
                        onClick: () => {
                            navigate("/cctv_record");
                        },
                    },
                ],
            });

        } catch (error) {
            confirmAlert({
                title: "Unexpected Error",
                message: error.message || 'An unexpected error occurred',
                buttons: [{ label: "OK" }],
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleApprove = () => handleSubmit('Approved');
    const handleBTP = () => handleSubmit('Back To Previous');
    const handleCancel = () => handleSubmit('Cancel');
    const handleNeedEdit = () => handleSubmit('Need To Edit');
    const handleBMApprove = () => handleSubmit('BM Approved');
    const handleComplete = () => handleSubmit('Completed');
    const ApproveBackToPrevious = () => handleSubmit('Back To Previous');

    const formDocno = recordDetails?.form?.form_doc_no ? recordDetails.form.form_doc_no : '';


    const fallbackCopy = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "0";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand("copy");
            if (successful) {
                console.log("Fallback: Copying text command was successful");
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } else {
                console.error("Fallback: Copying text command was unsuccessful");
            }
        } catch (err) {
            console.error("Fallback: Unable to copy", err);
        }

        document.body.removeChild(textArea);
    };

    const handleCopy = () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(formDocno)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch((err) => {
                    console.error("Clipboard copy failed:", err);
                    fallbackCopy(formDocno);
                });
        } else {
            fallbackCopy(formDocno);
        }
    };

    function formatTime(time) {
        if (!time) return '-';
        const [hour, minute] = time.split(':');
        const date = new Date();
        date.setHours(hour);
        date.setMinutes(minute);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
    }

    function renderCaseType(caseType) {
        switch (caseType) {
            case 1: return 'Check Process - လုပ်ငန်းစဉ်ကို စစ်ဆေးခြင်း';
            case 2: return 'Customer Complain - customer တိုင်ကြားခြင်းအကြောင်းအရာများ';
            case 3: return 'Accident Case - မတော်တဆဖြစ်ရပ်များ စစ်ဆေးခြင်း';
            case 4: return 'HR Case - HR နှင်ပတ်သတ်သောဖြစ်ရပ်များ စစ်ဆေးခြင်း';
            case 5: return 'Stolen Case - ခိုးယူမူ နှင့်သက်ဆိုင်သော ဖြစ်ရပ်များ စစ်ဆေးခြင်း';
            case 6: return 'Other - အခြားအကြောင်းအရာများ စစ်ဆေးခြင်း';
            default: return '—';
        }
    }

    const openVideoDownloadModal = () => {
        setIsVideoDownloadOpen(true);
    }
    console.log('detail',recordDetails??'no detail',isBranchITApprover,recordDetails?.form?.status,recordDetails?.detail_datas?.[0]?.[0]?.id,'id');

    return (
        <>
            {
                loading ? (
                    <div className="flex justify-center items-center min-h-screen" >
                        <div className="text-xl font-bold text-black">
                            Loading
                            <span className="animate-pulse">.</span>
                            <span className="animate-pulse delay-200">.</span>
                            <span className="animate-pulse delay-400">.</span>
                        </div>
                    </div>

                ) : (

                    <div className="p-4 sm:p-6">
                    
                        {isBranchITApprover && isOpen && (
                            <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                                    <div className="border-b-4 border-red-500 p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-gray-800">
                                                CCTV Form တွင် ပြင်ဆင်ထားသည့်အချက်များ
                                            </h3>
                                            <button
                                                onClick={() => setIsOpen(false)}
                                                className="text-gray-500 hover:text-gray-700 transition-colors"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-6 w-6"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="space-y-3 text-gray-700 mb-6">
                                            <p>
                                                1. <strong>video record</strong> ယူခြင်း မယူခြင်းများကို သက်ဆိုင်ရာ{' '}
                                                <strong>Branch IT</strong> များပြင်ဆင်နိုင်ခြင်း
                                            </p>
                                            <p>
                                                2. <strong>Case Type</strong> ရွေးချယ်ခြင်းများကို{' '}
                                                <strong>SD Manager</strong> နှင့် သက်ဆိုင်ရာ{' '}
                                                <strong>Branch IT</strong> များပြင်ဆင်နိုင်ခြင်း
                                            </p>
                                            <p>
                                                3. အထက်ဖော်ပြပါ အဆင့်များကို approve မပေးရသေးသောအချိန်တွင် သာပြုလုပ်ပေးပါရန်
                                            </p>
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => setIsOpen(false)}
                                                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                            >
                                                Close
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )}
                        <div
                            className="h-48 w-full bg-cover bg-center rounded-lg shadow-md mb-6"
                            style={{ backgroundImage: `url(${dashboardPhoto})` }}
                        >
                        </div>
                        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6">
                            <NavPath
                                segments={[
                                    { path: "/dashboard", label: "Dashboard" },
                                    { path: "/cctv_record", label: "Cctv Request" },
                                    { path: `/cctv-details/${id}`, label: "Cctv Details" }
                                ]}
                            />

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                                <h2 className="text-base sm:text-lg font-semibold">
                                    CCTV Request Form({recordDetails?.form?.form_doc_no ? recordDetails?.form?.form_doc_no : ''})
                                    <button
                                        onClick={handleCopy}
                                        className={`ml-2 px-2 py-1 text-xs rounded transition-all ${copied
                                            ? 'text-green-600 bg-green-50'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer'
                                            }`}
                                        title={copied ? "Copied!" : "Copy ID"}
                                        disabled={copied}
                                    >
                                        {copied ? 'Copied!' : <FiCopy className="w-4 h-4" />}
                                    </button>
                                    <StatusBadge status={recordDetails?.form?.status ? recordDetails?.form?.status : ''} />


                                </h2>
                                <div className="text-gray-600 text-sm sm:text-base">
                                    {recordDetails?.form?.created_at ? formatDate(recordDetails?.form?.created_at) : ''}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-medium mb-2">Detail ❶</h3>
                                <div className="overflow-x-auto">
                                    <table className="hidden xl:table  min-w-full border text-xs sm:text-sm">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border p-1 sm:p-2">No</th>
                                                <th className="border p-1 sm:p-2">Start Time</th>
                                                <th className="border p-1 sm:p-2">End Time</th>
                                                <th className="border p-1 sm:p-2">Case Date</th>
                                                <th className="border p-1 sm:p-2 hidden sm:table-cell">Case Type</th>
                                                <th className="border p-1 sm:p-2">Place</th>
                                                <th className="border p-1 sm:p-2 hidden md:table-cell">Branch</th>
                                                <th className="border p-1 sm:p-2 hidden lg:table-cell">Record Type</th>
                                                <th className="border p-1 sm:p-2 hidden xl:table-cell">Description</th>
                                                <th className="border p-1 sm:p-2 hidden md:table-cell">Replay Date</th>
                                                <th className="border p-1 sm:p-2 hidden lg:table-cell">Record Video</th>
                                                {/* {isApprover || isBranchITApprover || user?.employee_number === '000-000024' && (
                                        <th className="border p-1 sm:p-2 hidden lg:table-cell">Action</th>
                                    )} */}
                                                {(isApprover || isBranchITApprover || user?.employee_number === '000-000024' || user?.employee_number === '000-000548') && (
                                                    <th className="border p-1 sm:p-2 hidden lg:table-cell">Action</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recordDetails?.detail_datas?.map((item, index) => (
                                            
                                                <tr key={item[0].id}>
                                                    <td className="border p-1 sm:p-2">
                                                        {index + 1}
                                                        <input type="hidden" name="specific_form_id[]" value={item[0].id} />
                                                    </td>
                                                    <td className="border p-1 sm:p-2">
                                                        {formatTime(item[0].start_time)}
                                                       
                                                    </td>
                                                    <td className="border p-1 sm:p-2">
                                                        {formatTime(item[0].end_time)}
                                                    </td>
                                                    <td className="border p-1 sm:p-2">
                                                        {item[0].issue_date}
                                                    </td>
                                                    <td className="border p-1 sm:p-2 hidden sm:table-cell">
                                                        {renderCaseType(item[0].case_type)}
                                                    </td>
                                                    <td className="border p-1 sm:p-2">{item[0].place}</td>
                                                    <td className="border p-1 sm:p-2 hidden md:table-cell">

                                                        {item[0]?.branch_name || '-'}
                                                    </td>
                                                    <td className="border p-1 sm:p-2 hidden lg:table-cell">
                                                        {item[0].record_type && item[0].record_type !== 'null' ? item[0].record_type : '-'}
                                                    </td>
                                                    <td className="border p-1 sm:p-2 hidden xl:table-cell">
                                                        {item[0].description}
                                                    </td>
                                                    <td className="border p-1 sm:p-2 hidden md:table-cell">
                                                        {formatDate(item[0].created_at)}
                                                    </td>

                                                    {recordDetails?.video_record && (
                                                        (user?.role_id === 3 && recordDetails?.from_branch !== '1') ||
                                                        (user?.role_id === 3 && recordDetails?.from_branch === '1' && user?.department_id === recordDetails?.from_department) ||
                                                        (user?.employee_number === '000-000548')
                                                    ) ? (
                                                        <td className="text-center">
                                                            <button
                                                                onClick={() => setIsVideoDownloadOpen(true)}
                                                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                                                            >
                                                                <i className="bi bi-cloud-arrow-down-fill mr-1"></i>
                                                                Download video
                                                            </button>
                                                        </td>
                                                    ) : (
                                                        <td className="text-center">-</td>
                                                    )}

                                                    {(isApprover || isBranchITApprover || user?.employee_number === '000-000024' || user?.employee_number === '000-000548') && (
                                                        <td className="border p-1 sm:p-2 hidden lg:table-cell">
                                                            <Link
                                                                to={`/cctv-edit/${item[0].id}`}
                                                                className="text-white font-bold py-1 px-3 rounded cursor-pointer text-sm"
                                                                style={{
                                                                    backgroundColor: '#2ea2d1',
                                                                }}
                                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#6fc3df'}
                                                                onMouseLeave={(e) => e.target.style.backgroundColor = '#2ea2d1'}
                                                            >
                                                                Edit
                                                            </Link>
                                                        </td>
                                                    )}

                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {IsVideoDownloadOpen && (
                                        <CctvDownloadVideo
                                            empId={user?.employee_number}
                                            id={id}
                                            onClose={() => setIsVideoDownloadOpen(false)}
                                        />
                                    )}


                                    {/* <div className="lg:hidden space-y-4 mt-4 font-medium text-sm sm:text-base">
                                        {recordDetails?.detail_datas?.map((item, index) => (
                                            <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">No:</span>
                                                    <span>{index + 1}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">Start Time:</span>
                                                    <span>{formatTime(item.start_time)}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">End Time:</span>
                                                    <span>{formatTime(item.end_time)}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">Case Date:</span>
                                                    <span>{item.issue_date}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">Case Type:</span>
                                                    <span>{renderCaseType(item.case_type)}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">Place:</span>
                                                    <span>{item.place}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">Branch:</span>
                                                    <span>{item.branch_name || '-'}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">Record Type:</span>
                                                    <span>{item.record_type && item.record_type !== 'null' ? item.record_type : '-'}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">Description:</span>
                                                    <span>{item.description}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">Replay Date:</span>
                                                    <span>{formatDate(item.created_at)}</span>
                                                </div>

                                                <div className="flex flex-col mt-2">
                                                    <span className="font-semibold text-gray-700">Record Video:</span>

                                                </div>

                                                {recordDetails?.video_record && (
                                                    (user?.role_id === 3 && recordDetails?.from_branch !== '1') ||
                                                    (user?.role_id === 3 && recordDetails?.from_branch === '1' && user?.department_id === recordDetails?.from_department) ||
                                                    (user?.employee_number === '000-000548')
                                                ) ? (

                                                    <span className="text-gray-800">

                                                        <button
                                                            onClick={() => setIsVideoDownloadOpen(true)}
                                                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            <i className="bi bi-cloud-arrow-down-fill mr-1"></i>
                                                            Download video
                                                        </button>
                                                    </span>


                                                ) : (
                                                    <span className="text-gray-800"> - </span>
                                                )}

                                                {(isApprover || isBranchITApprover || user?.employee_number === '000-000024') && (
                                                    <div className="flex flex-col mt-2">
                                                        <span className="font-semibold text-gray-700">Action:</span>
                                                        <Link
                                                            to={`/cctv-edit/${item.id}`}
                                                            className="bg-[#2ea2d1] text-white font-semibold py-1 px-3 rounded w-fit hover:bg-[#6fc3df]"
                                                        >
                                                            Edit
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div> */}


                                    <div className="lg:hidden space-y-4 mt-4 px-2">
                                        {recordDetails?.detail_datas?.map((item, index) => (
                                            <div
                                                key={item.id}
                                                onClick={() => navigate(`/cctv-details/${item.id}`)}
                                                className="p-4 border border-gray-300 rounded-lg bg-white shadow-md hover:shadow-lg transition cursor-pointer"
                                                style={{ minWidth: "280px" }} // prevent too narrow cards
                                            >
                                                {/* Top row: No, Record Type, Branch */}
                                                <div className="flex justify-between items-center mb-3 text-blue-700 font-semibold text-sm tracking-wide">
                                                    <span>{index + 1}</span>
                                                    <span className="max-w-[40%] text-center">{item.record_type && item.record_type !== 'null' ? item.record_type : '-'}</span>
                                                    <span className="truncate max-w-[40%] text-right">{item.branch_name || '-'}</span>
                                                </div>

                                                {/* Data pairs grid */}
                                                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-gray-700 text-sm">
                                                    <span className="truncate">{formatTime(item.start_time)}</span>
                                                    <span className="truncate">{formatTime(item.end_time)}</span>

                                                    <span className="truncate">{item.issue_date}</span>
                                                    <span className="truncate">{item.place}</span>

                                                    <span className="truncate">{renderCaseType(item.case_type)}</span>
                                                    <span className="truncate">{formatDate(item.created_at)}</span>

                                                    {/* Description full width */}
                                                    <span className="col-span-2 truncate">{item.description}</span>
                                                </div>

                                                {/* Video download */}
                                                <div className="mt-4 flex items-center">
                                                    <span className="text-gray-700 font-semibold mr-2">Video:</span>
                                                    {recordDetails?.video_record && (
                                                        (user?.role_id === 3 && recordDetails?.from_branch !== '1') ||
                                                        (user?.role_id === 3 && recordDetails?.from_branch === '1' && user?.department_id === recordDetails?.from_department) ||
                                                        (user?.employee_number === '000-000548')
                                                    ) ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setIsVideoDownloadOpen(true);
                                                            }}
                                                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            <i className="bi bi-cloud-arrow-down-fill mr-1"></i> Download
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-500">-</span>
                                                    )}
                                                </div>

                                                {/* Edit button */}
                                                {(isApprover || isBranchITApprover || user?.employee_number === '000-000024' || user?.employee_number === '000-000548') && (
                                                    <div className="mt-4">
                                                        <Link
                                                            to={`/cctv-edit/${item.id}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="block bg-[#2ea2d1] text-white font-semibold py-1 px-3 rounded w-fit hover:bg-[#6fc3df] transition"
                                                        >
                                                            Edit
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>




                                </div>
                            </div>
                            <div className="mb-6">

                                {/* အထွေထွေဖောင် BM Approved ဖြစ်ပြီး၊ CCTV Record ကို on လုပ်ထားသည့်အချိန်တွင်သာ —
                    လက်ရှိ user က Branch IT ဖြစ်ရမယ်။
                    ဒီသုံးချက်အမှန်ဖြစ်မှသာ
                    ➡ "Upload" button တစ်ခုပြတယ်
                    ➡ ဖိုင်တင်ဖို့ Modal ဖွင့်ခေါ်မယ်
                    ➡ အနီရောင်သတိပေးစာပါပြတယ်။ */}
                    

                                {isBranchITApprover &&
                                    recordDetails.form.status === 'BM Approved' &&
                                    recordDetails?.detail_datas?.[0]?.[0]?.cctv_record==='on' && (
                                        <CctvUploadVideo
                                            recordId={recordDetails?.detail_datas?.[0]?.[0]?.id}
                                            generalId={id}
                                            docNo={formDocno}
                                        />
                                    )}

                                <div>
                                    {isBranchITApprover &&
                                        recordDetails.status === 'BM Approved' &&
                                        recordDetails?.detail_datas?.[0]?.[0]?.cctv_record==='on' && (
                                            <>
                                                <span className="text-red-500 text-sm"></span>
                                                {/* {errors.video} */}
                                                <span className="text-red-500 text-sm">**record vedio ယူခြင်း / မယူခြင်း များကို Action button တွင်ပြင်ဆင်နိုင်ပါသည်**</span>
                                            </>
                                        )}
                                </div>


                                {isApprover && (
                                    <div className="mb-6">
                                        <h4 className="font-medium mb-2">Remark</h4>
                                        <textarea
                                            value={remark}
                                            onChange={(e) => setRemark(e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Write remark about this and please be careful not more than 200 characters."
                                            rows={3}
                                            maxLength={200}
                                        />
                                        <div className="mt-2">
                                            <button
                                                onClick={handleBMApprove}
                                                disabled={isSubmitting}
                                                className="bg-green-400 hover:bg-green-500 text-white font-bold py-2 px-4 rounded cursor-pointer"
                                            >
                                                {isSubmitting ? 'Processing...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="bg-red-400 hover:bg-red-500 text-white font-bold py-2 px-4 rounded ml-2 cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {isBranchITApprover && (
                                    <div className="mb-6">
                                        <h4 className="font-medium mb-2">Remark</h4>
                                        <textarea
                                            value={remark}
                                            onChange={(e) => setRemark(e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Write remark about this and please be careful not more than 200 characters."
                                            rows={3}
                                            maxLength={200}
                                        />
                                        <div className="mt-2">
                                            <button
                                                onClick={handleApprove}
                                                disabled={isSubmitting}
                                                className="bg-green-400 hover:bg-green-500 text-white font-bold py-2 px-4 rounded cursor-pointer"
                                            >
                                                {isSubmitting ? 'Processing...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="bg-red-400 hover:bg-red-500 text-white font-bold py-2 px-4 rounded ml-2 cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {isManager && (

                                    <div className="mb-6">
                                        <h4 className="font-medium mb-2">Remark</h4>
                                        <textarea
                                            value={remark}
                                            onChange={(e) => setRemark(e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Write remark about this and please be careful not more than 200 characters."
                                            rows={3}
                                            maxLength={200}
                                        />

                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <button
                                                onClick={handleComplete}
                                                disabled={isSubmitting}
                                                className="bg-green-400 hover:bg-green-500 text-white font-bold py-2 px-4 rounded cursor-pointer"
                                            >
                                                {isSubmitting ? 'Processing...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="bg-red-400 hover:bg-red-500 text-white font-bold py-2 px-4 rounded cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            {route === 'cctv_record' && isManager && recordDetails?.status === 'Approved' && (
                                                <button
                                                    onClick={ApproveBackToPrevious}
                                                    className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded cursor-pointer"
                                                >
                                                    Back to Previous
                                                </button>
                                            )}
                                        </div>

                                    </div>

                                )}

                            </div>


                            {recordDetails?.form?.status === 'Cancel' && (
                                <>
                                    {showAlert && recordDetails?.cancel != null && (
                                        <div className="flex flex-row">
                                            <div
                                                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-full"
                                                role="alert"
                                            >
                                                <span className="block sm:inline">
                                                    This form was rejected by <span className="font-bold">{recordDetails?.cancel?.title}{recordDetails?.cancel?.name}</span>
                                                </span>
                                                <button
                                                    type="button"
                                                    className="absolute top-0 bottom-0 right-0 px-4 py-3 focus:outline-none cursor-pointe"
                                                    onClick={() => setShowAlert(false)}
                                                    aria-label="Close"
                                                >
                                                    <svg
                                                        className="fill-current h-6 w-6 text-red-500"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <title>Close</title>
                                                        <path d="M14.348 5.652a1 1 0 0 0-1.414 0L10 8.586 7.066 5.652a1 1 0 1 0-1.414 1.414L8.586 10l-2.934 2.934a1 1 0 1 0 1.414 1.414L10 11.414l2.934 2.934a1 1 0 0 0 1.414-1.414L11.414 10l2.934-2.934a1 1 0 0 0 0-1.414z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}



                                    {recordDetails?.form?.cancel_form?.file && (
                                        <>
                                            <div className="mt-4">
                                                <img
                                                    src={`/storage/uploads/cancel_form/${recordDetails?.form.cancel_form.file}`}
                                                    alt="Cancelled Form Attachment"
                                                    className="w-full max-w-lg mx-auto rounded shadow"
                                                />
                                            </div>
                                            <div className="mt-4">
                                                <img
                                                    src={`/storage/uploads/cancel_form/${recordDetails.cancel_form.file}`}
                                                    alt="Cancelled Form Attachment"
                                                    className="w-full max-w-lg mx-auto rounded shadow"
                                                />
                                            </div>
                                        </>
                                    )}

                                </>
                            )}


                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 mt-6">
                                <div className="space-y-1">
                                    <p className="text-gray-500">Staff / Eyewitness</p>
                                    <p className="text-sm text-gray-800 font-semibold">
                                        {recordDetails?.form?.originators?.title ? `${recordDetails.form.originators.title} ` : ''}
                                        {recordDetails?.form?.originators?.name ? `${recordDetails.form.originators.name}` : ''}
                                    </p>
                                    <p className="text-gray-700 text-sm">
                                        ({recordDetails?.form?.originators?.departments?.name ?? ''})
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {recordDetails?.form?.created_at
                                            ? formatDateTime(recordDetails.form.created_at)
                                            : ''}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-gray-500">
                                        {recordDetails?.approver &&
                                            (
                                                recordDetails?.form?.status === 'BM Approved' ||
                                                recordDetails?.form?.status === 'Approved' ||
                                                recordDetails?.form?.status === 'Received' ||
                                                recordDetails?.form?.status === 'Acknowledged' ||
                                                recordDetails?.form?.status === 'Completed' ||
                                                (recordDetails?.form?.status === 'Cancel' && recordDetails?.approver?.status !== 'Cancel')
                                            )
                                            ? 'Approved By'
                                            : 'Approved By BM / ABM'}
                                    </p>

                                    {recordDetails?.approver &&
                                        (
                                            recordDetails?.form?.status === 'BM Approved' ||
                                            recordDetails?.form?.status === 'Checked' ||
                                            recordDetails?.form?.status === 'Received' ||
                                            recordDetails?.form?.status === 'Acknowledged' ||
                                            recordDetails?.form?.status === 'Completed' ||
                                            (recordDetails?.form?.status === 'Cancel' && recordDetails?.approver?.status !== 'Cancel')
                                        ) ? (
                                        <>
                                            <p className="text-sm text-gray-800 font-semibold">
                                                {recordDetails.approver?.title ? `${recordDetails.approver.title}.` : ''}
                                                {recordDetails.approver?.name ?? ''}
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                ({recordDetails.approver?.department ?? ''})
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {recordDetails.approver?.created_at ? formatDateTime(recordDetails.approver.created_at) : ''}
                                            </p>
                                            {recordDetails.approver?.comment && (
                                                <p className="italic text-blue-500 text-sm">
                                                    "{recordDetails.approver.comment}"
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-xs text-gray-400 opacity-25">-</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <p className="text-gray-500">
                                        {recordDetails?.acknowledger &&
                                            (
                                                recordDetails?.form?.status === 'Checked' ||
                                                recordDetails?.form?.status === 'Completed' ||
                                                (recordDetails?.form?.status === 'Cancel' && recordDetails?.acknowledger?.status !== 'Cancel')
                                            )
                                            ? 'Checked By'
                                            : 'Checked by Branch IT'}
                                    </p>

                                    {recordDetails?.acknowledger &&
                                        (
                                            recordDetails?.form?.status === 'Checked' ||
                                            recordDetails?.form?.status === 'Completed' ||
                                            (recordDetails?.form?.status === 'Cancel' && recordDetails?.acknowledger?.status !== 'Cancel')
                                        ) ? (
                                        <>
                                            <p className="text-sm text-gray-800 font-semibold">
                                                {recordDetails.acknowledger?.title ? `${recordDetails.acknowledger.title}.` : ''}
                                                {recordDetails.acknowledger?.name ?? ''}
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                ({recordDetails.acknowledger?.department ?? ''})
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {recordDetails.acknowledger?.created_at ? formatDateTime(recordDetails.acknowledger.created_at) : ''}
                                            </p>
                                            {recordDetails.acknowledger?.comment && (
                                                <p className="italic text-blue-500 text-sm">
                                                    "{recordDetails.acknowledger.comment}"
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-xs text-gray-400 opacity-25">-</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <p className="text-gray-500">
                                        {recordDetails?.manager &&
                                            (
                                                recordDetails?.form?.status === 'Completed' ||
                                                (recordDetails?.form?.status === 'Cancel' && recordDetails?.manager?.status !== 'Cancel')
                                            )
                                            ? 'Acknowledged By'
                                            : 'Acknowledged by SD Manager'}
                                    </p>

                                    {recordDetails?.manager &&
                                        (
                                            recordDetails?.form?.status === 'Completed' ||
                                            (recordDetails?.form?.status === 'Cancel' && recordDetails?.manager?.status !== 'Cancel')
                                        ) ? (
                                        <>
                                            <p className="text-sm text-gray-800 font-semibold">
                                                {recordDetails.manager?.title ? `${recordDetails.manager.title}.` : ''}
                                                {recordDetails.manager?.name ?? ''}
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                {recordDetails.manager?.department ?? ''}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {recordDetails.manager?.created_at ? formatDateTime(recordDetails.manager.created_at) : ''}
                                            </p>
                                            {recordDetails.manager?.comment && (
                                                <p className="italic text-blue-500 text-sm">
                                                    "{recordDetails.manager.comment}"
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-xs text-gray-400 opacity-25">-</p>
                                    )}
                                </div>
                            </div>

                            <Link
                                to="/cctv_record"
                                state={{
                                    restoreSearch: true,
                                    searchPayload,
                                    formData,
                                }}
                                className="inline-flex px-3 py-1 sm:px-4 sm:py-2 bg-gray-200 rounded hover:bg-gray-300 items-center text-sm sm:text-base"
                            >
                                <span className="mr-1 sm:mr-2">←</span> Back
                            </Link>                          

                        </div>
                    </div >

                )

            }

        </>
    );
}