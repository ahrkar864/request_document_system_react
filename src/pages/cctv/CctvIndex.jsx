import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Pusher from 'pusher-js';
import NavPath from '../../components/NavPath';
import StatusBadge from '../../components/ui/StatusBadge';
import { fetchData } from '../../api/FetchApi';
import { useNavigate } from "react-router-dom";
import Select from 'react-select'
import { useDispatch, useSelector } from 'react-redux';


export default function CctvIndex() {
    const dispatch = useDispatch() ;
    const {user} = useSelector((state) => state.auth) ;
    const navigate = useNavigate();
    const [cctvRequests, setCctvRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationInfo, setPaginationInfo] = useState(null);
    const [branches, setBranches] = useState([]);
    const userId = user?.id ?? '';
    const [UserNotification, setUserNotification] = useState([]);
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [searchPayload, setSearchPayload] = useState(null);
    const location = useLocation();

    const statusOptions = [
        { value: "Ongoing", label: "Ongoing" },
        { value: "BM Approved", label: "BM Approved" },
        { value: "Completed", label: "Completed" },
        { value: "Cancel", label: "Cancel" },
    ];

    const [formData, setFormData] = useState({
        formDocNo: '',
        issueDate: '',
        startDate: '',
        endDate: '',
        status: [],
        branch: ''
    });

    const token = localStorage.getItem('token');
    const form_id = 15;
    const getCaseTypeLabel = (caseType) => {
        const type = Number(caseType);
        switch (type) {
            case 1:
                return 'Check Process';
            case 2:
                return 'Customer Complain';
            case 3:
                return 'Accident Case';
            case 4:
                return 'HR Case';
            case 5:
                return 'Stolen Case';
            case 6:
                return 'Other';
            default:
                return '—';
        }
    };

    const fetchCctvRecords = async (page = 1) => {
        try {
            const response = await fetch(`/api/cctv-records?page=${page}`, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error(`Error fetching CCTV records: ${response.statusText}`);
            const data = await response.json();
            const list = data?.data?.data ?? [];
            setCctvRequests(list);
            setPaginationInfo(data.data);
            setCurrentPage(data.data.current_page);
        } catch (error) {
            console.error("Error fetching CCTV records:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSearchResults = async (page = 1, payload) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/users/search_notifications/${form_id}?page=${page}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(`Search page failed: ${response.statusText}`);
            const result = await response.json();
            const list = result?.data?.data ?? [];
            setCctvRequests(list);
            setPaginationInfo(result.data);
            setCurrentPage(result.data.current_page);
        } catch (error) {
            console.error("Error fetching search page:", error);
        } finally {
            setLoading(false);
        }
    };


    const fetchBranches = async () => {
        try {
            const response = await fetch('/api/branches', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data?.data?.data)
                        ? data.data.data
                        : [];
            setBranches(list);
        } catch (error) {
            console.error('Fetch branches error:', error);
            setBranches([]);
        }
    }

    const handlePageClick = (page) => {
        if (page >= 1 && page <= paginationInfo.last_page) {
            if (isSearchMode && searchPayload) {
                fetchSearchResults(page, searchPayload);
            } else {
                fetchCctvRecords(page);
            }
        }
    };

    useEffect(() => {
        fetchBranches();
        fetchData(`/api/user/notifications/${userId}`, token, 'user unread notification', setUserNotification);
        const restoredPayload = location.state?.searchPayload;
        const restoredFormData = location.state?.formData;
        if (location.state?.restoreSearch && restoredPayload) {
            setIsSearchMode(true);
            setSearchPayload(restoredPayload);
            setFormData(restoredFormData || {});
            fetchSearchResults(1, restoredPayload);
        } else {
            setIsSearchMode(false);
            fetchCctvRecords();
        }
    }, [userId]);


    const handleSearch = async (e) => {
        e.preventDefault();
        setIsSearchMode(true);

        const payload = {
            form_doc_no: formData.formDocNo,
            start_date: formData.startDate,
            end_date: formData.endDate,
            search_status: formData.status,
            branch_id: formData.branch ? formData.branch : 0,
        };

        setSearchPayload(payload);
        await fetchSearchResults(1, payload);
    }

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

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
                    < div className="p-6 bg-white shadow-md rounded-lg" >
                        <NavPath
                            segments={[
                                { path: "/dashboard", label: "Home" },
                                { path: "/dashboard", label: "Dashboard" },
                                { path: "/cctv_record", label: "Cctv Request" }
                            ]}
                        />

                        <div className="flex justify-between mr-4">
                            <h2 className="text-xl font-semibold ">CCTV Request Form</h2>
                            <Link to="/cctv-request" className="text-white font-bold py-2 px-4 rounded cursor-pointer text-sm"
                                style={{
                                    backgroundColor: '#2ea2d1',
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#6fc3df'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#2ea2d1'}
                            >
                                Add
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 text-sm mt-4">
                            <div className="flex flex-col">
                                <label htmlFor="formDocNo" className="mb-1 font-medium text-gray-700">
                                    Form Doc No
                                </label>
                                <input
                                    id="formDocNo"
                                    type="text"
                                    placeholder="Enter Form Doc No"
                                    className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
                                    onFocus={(e) => e.target.style.borderColor = '#6fc3df'}
                                    onBlur={(e) => e.target.style.borderColor = '#2ea2d1'}
                                    style={{ borderColor: '#2ea2d1' }}
                                    value={formData.formDocNo}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="startDate" className="mb-1 font-medium text-gray-700">
                                    From Date
                                </label>
                                <input
                                    id="startDate"
                                    type="date"
                                    className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
                                    style={{ borderColor: '#2ea2d1' }}
                                    value={formData.startDate}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="endDate" className="mb-1 font-medium text-gray-700">
                                    End Date
                                </label>
                                <input
                                    id="endDate"
                                    type="date"
                                    className="border  focus:outline-none p-2 w-full rounded-md"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    style={{ borderColor: '#2ea2d1' }}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="status" className="mb-1 font-medium text-gray-700">
                                    Status
                                </label>
                                <Select
                                    id="status"
                                    isMulti
                                    name="status"
                                    options={statusOptions}
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                    value={statusOptions.filter(option => formData.status.includes(option.value))}
                                    onChange={(selected) => {
                                        const selectedValues = selected.map((opt) => opt.value);
                                        setFormData((prev) => ({
                                            ...prev,
                                            status: selectedValues,
                                        }));
                                    }}
                                    placeholder="Select Status"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="branch" className="mb-1 font-medium text-gray-700">
                                    Branch
                                </label>
                                <select
                                    id="branch"
                                    name="branch"
                                    className="border focus:outline-none p-2 w-full rounded-md"
                                    value={formData.branch}
                                    onChange={handleChange}
                                    style={{ borderColor: '#2ea2d1' }}
                                >
                                    <option value="">All Branch</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.branch_name}
                                        </option>
                                    ))}
                                </select>
                            </div>


                            <div className="flex items-end">
                                <button className="text-white px-4 py-2 rounded w-full cursor-pointer" onClick={handleSearch} style={{
                                    backgroundColor: '#2ea2d1',
                                }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#6fc3df'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#2ea2d1'}>
                                    Search
                                </button>
                            </div>

                            {isSearchMode && (
                                <div className="flex items-end">
                                    <button
                                        className="text-white px-4 py-2 rounded w-full cursor-pointer"
                                        onClick={() => {
                                            setLoading(true);
                                            setIsSearchMode(false);
                                            setSearchPayload(null);
                                            fetchCctvRecords(1);
                                            setFormData({
                                                formDocNo: '',
                                                startDate: '',
                                                endDate: '',
                                                status: [],
                                                branch: ''
                                            });

                                        }}
                                        style={{ backgroundColor: '#4b5563' }}
                                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#6b7280')}
                                        onMouseLeave={(e) => (e.target.style.backgroundColor = '#4b5563')}
                                    >
                                        Back
                                    </button>
                                </div>
                            )}


                        </div>

                        <div className="overflow-x-auto">
                            <table className="hidden xl:table min-w-full bg-white border border-gray-200 text-sm">
                                <thead className="bg-gray-100 text-left">
                                    <tr>
                                        <th className="py-2 px-4 border-b">No</th>
                                        <th className="py-2 px-4 border-b">Status</th>
                                        <th className="py-2 px-4 border-b">Document No</th>
                                        <th className="py-2 px-4 border-b">Branch</th>
                                        <th className="py-2 px-4 border-b">Requested By</th>
                                        <th className="py-2 px-4 border-b">Case Type</th>
                                        <th className="py-2 px-4 border-b">Description</th>
                                        <th className="py-2 px-4 border-b">Case Date</th>
                                        <th className="py-2 px-4 border-b">Video</th>
                                    </tr>
                                </thead>
                                <tbody>


                                    {cctvRequests && cctvRequests.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            onClick={() =>
                                                navigate(`/cctv-details/${item.id}`, {
                                                    state: {
                                                        fromSearch: isSearchMode,
                                                        searchPayload,
                                                        formData,
                                                    }
                                                })
                                            }

                                            className="cursor-pointer hover:bg-[#efefef] transition"
                                        >
                                            <td className="py-2 px-4 border-b">
                                                {(paginationInfo.current_page - 1) * paginationInfo.per_page + index + 1}.
                                            </td>
                                            <td className="py-2 px-4 border-b">
                                                <StatusBadge status={item.status} />
                                            </td>
                                            <td className="py-2 px-4 border-b text-blue-600 font-medium">
                                                {item.form_doc_no}
                                                {UserNotification.some(noti =>
                                                    noti.form_id === item.form_id &&
                                                    noti.specific_form_id === item.id &&
                                                    noti.form_doc_no === item.form_doc_no
                                                ) && (
                                                        <span className="inline-flex items-center justify-center w-3.5 h-3 rounded bg-red-600 text-white text-[10px] leading-none ml-1">
                                                            ...
                                                        </span>
                                                    )}
                                            </td>
                                            <td className="py-2 px-4 border-b">
                                                {item.branch_name ?? item.from_branches?.branch_name ?? branches.find(b => b.id == item.from_branch)?.branch_name ?? '—'}
                                            </td>

                                            <td className="py-2 px-4 border-b">Miss. {item.requester_name}</td>
                                            <td className="py-2 px-4 border-b">{getCaseTypeLabel(item.cctv_record?.case_type)}</td>
                                            <td className="py-2 px-4 border-b max-w-[300px] truncate" title={item.cctv_record?.description ?? ''}>
                                                {item.cctv_record?.description ?? '—'}
                                            </td>
                                            <td className="py-2 px-4 border-b">{item.case_date ?? (item.cctv_record?.issue_date ? String(item.cctv_record.issue_date).slice(0, 10) : null) ?? '—'}</td>
                                            <td className="py-2 px-4 border-b text-center">

                                                <button className="bg-gray-600 text-white p-2 rounded hover:bg-gray-700" title={item.asset_type === 1 ? "Camera On" : "Camera Off"}>
                                                    {item.asset_type === 1 || item.asset_type === 'on' ? (
                                                        // Camera ON
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" className="bi bi-camera-video-fill" viewBox="0 0 16 16">
                                                            <path d="M0 5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v.5l3.106-1.553A.5.5 0 0 1 15 4.5v7a.5.5 0 0 1-.894.316L11 10.5V11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5z" />
                                                        </svg>
                                                    ) : (
                                                        // Camera OFF
                                                        // <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" className="bi bi-camera-video-off-fill ml-[2px] mt-[1px]" viewBox="0 0 16 16">
                                                        //     <path d="M10.961 12.365 8.596 10H6.5A1.5 1.5 0 0 1 5 8.5V6.404L2.635 4.04a.5.5 0 1 1 .707-.707l11 11a.5.5 0 0 1-.707.707l-2.674-2.674z" />
                                                        //     <path d="M5 5.121v3.379a.5.5 0 0 0 .5.5h1.379L5 5.121z" />
                                                        //     <path d="M11 8.5v1.379l-1.121-1.121H11z" />
                                                        //     <path d="M14 4.833v6.334a.5.5 0 0 1-.854.353L12 10.086V11.5A1.5 1.5 0 0 1 10.5 13H9.121l-1-1H10.5a.5.5 0 0 0 .5-.5V9.879l-6-6V4.5a.5.5 0 0 1 .146.354V4.5a.5.5 0 0 1 .5-.5h3A1.5 1.5 0 0 1 11 5.5v1.586l2.146-2.146a.5.5 0 0 1 .854.353z" />
                                                        // </svg>

                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="white">

                                                            <rect x="3" y="6" width="10" height="10" rx="2" fill="white" />
                                                            <polygon points="13,8 17,6 17,14 13,12" fill="white" />


                                                            <line x1="3" y1="3" x2="17" y2="17" stroke="black" strokeWidth="2" />
                                                        </svg>


                                                    )}
                                                </button>
                                            </td>
                                        </tr>

                                    ))}
                                </tbody>
                            </table>



                            <div className="xl:hidden space-y-4 mt-4">
                                {cctvRequests?.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() =>
                                            navigate(`/cctv-details/${item.id}`, {
                                                state: { fromSearch: isSearchMode, searchPayload, formData }
                                            })
                                        }
                                        className="p-4 border border-gray-200 rounded-lg bg-white shadow hover:bg-gray-100 transition cursor-pointer"
                                    >
                                        {/* <div className="flex items-center justify-between mb-2">
                                            <span className="text-blue-600 font-semibold text-base flex items-center">
                                                {item.form_doc_no}

                                            </span>
                                            {UserNotification?.some(noti =>
                                                noti.form_id === item.form_id &&
                                                noti.specific_form_id === item.id &&
                                                noti.form_doc_no === item.form_doc_no
                                            ) && (
                                                    <span
                                                        title="New Notification"
                                                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-xs"
                                                    >
                                                        !
                                                    </span>
                                                )}

                                        </div> */}

                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1 text-blue-600 font-semibold text-base">
                                                <span>{item.form_doc_no}</span>
                                                {UserNotification?.some(noti =>
                                                    noti.form_id === item.form_id &&
                                                    noti.specific_form_id === item.id &&
                                                    noti.form_doc_no === item.form_doc_no
                                                ) && (
                                                        <span
                                                            title="New Notification"
                                                            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-xs"
                                                        >
                                                            !
                                                        </span>
                                                    )}
                                            </div>
                                            <span className="text-sm text-gray-700">
                                                {/* {branches.find(branch => branch.id === item.from_branch)?.branch_name || '—'} */}
                                                <StatusBadge status={item.status} />
                                            </span>
                                        </div>


                                        <div className="text-sm text-gray-700 space-y-1">


                                            <div className="flex justify-between">
                                                <span> {item.requester_name}</span>
                                                <span>{item.branch_name ?? item.from_branches?.branch_name ?? branches.find(b => b.id == item.from_branch)?.branch_name ?? '—'}</span>

                                            </div>

                                            <div className="flex justify-between gap-2">
                                                <span className="font-semibold">Case Type:</span>
                                                <span className="text-right">{getCaseTypeLabel(item.cctv_record?.case_type)}</span>
                                            </div>

                                            <div>
                                                <span className="font-semibold">Description: </span>
                                                <span>{item.cctv_record?.description ?? '—'}</span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="font-semibold">Case Date:</span>
                                                <span>{item.case_date ?? (item.cctv_record?.issue_date ? String(item.cctv_record.issue_date).slice(0, 10) : null) ?? '—'}</span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <button
                                                    className="bg-gray-600 text-white p-2 rounded hover:bg-gray-700"
                                                    title={item.asset_type === 1 || item.asset_type === 'on' ? "Camera On" : "Camera Off"}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {item.asset_type === 1 || item.asset_type === 'on' ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16">
                                                            <path d="M0 5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v.5l3.106-1.553A.5.5 0 0 1 15 4.5v7a.5.5 0 0 1-.894.316L11 10.5V11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5z" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="white">
                                                            <rect x="3" y="6" width="10" height="10" rx="2" fill="white" />
                                                            <polygon points="13,8 17,6 17,14 13,12" fill="white" />
                                                            <line x1="3" y1="3" x2="17" y2="17" stroke="black" strokeWidth="2" />
                                                        </svg>
                                                    )}
                                                </button>


                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>


                            {paginationInfo && (
                                <div className="text-center text-sm text-gray-600 mt-4">
                                    Total {paginationInfo.total} Rows
                                </div>
                            )}
                        </div>

                        {/* <div className="navigation">
                            <ul className="inline-flex -space-x-px text-sm">
                                {paginationInfo?.links?.map((link, index) => (
                                    <li key={index}>
                                        <button
                                            onClick={() => {
                                                if (link.url) {
                                                    const url = new URL(link.url);
                                                    const page = url.searchParams.get('page');
                                                    handlePageClick(Number(page));
                                                }
                                            }}
                                            disabled={!link.url}
                                            className={`flex items-center justify-center px-3 h-8 leading-tight cursor-pointer
                                            ${link.active ? 'text-gray-600 border border-[#2ea2d1] bg-[#2ea2d1]' : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700'}
                                            ${index === 0 ? 'rounded-s-lg' : ''}
                                            ${index === paginationInfo.links.length - 1 ? 'rounded-e-lg' : ''}
                                        `}
                                        >
                                            {link.label === '&laquo; Previous' ? 'Previous' :
                                                link.label === 'Next &raquo;' ? 'Next' : link.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div> */}


                        <div className="navigation w-full overflow-x-auto">
                            <ul className="inline-flex whitespace-nowrap min-w-max -space-x-px text-sm">
                                {paginationInfo?.links?.map((link, index) => (
                                    <li key={index}>
                                        <button
                                            onClick={() => {
                                                if (link.url) {
                                                    const url = new URL(link.url);
                                                    const page = url.searchParams.get('page');
                                                    handlePageClick(Number(page));
                                                }
                                            }}
                                            disabled={!link.url}
                                            className={`flex items-center justify-center px-3 min-w-[40px] h-8 leading-tight cursor-pointer
                        ${link.active ? 'text-gray-600 border border-[#2ea2d1] bg-[#2ea2d1]' : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700'}
                        ${index === 0 ? 'rounded-s-lg' : ''}
                        ${index === paginationInfo.links.length - 1 ? 'rounded-e-lg' : ''}
                    `}
                                        >
                                            {link.label === '&laquo; Previous' ? 'Previous' :
                                                link.label === 'Next &raquo;' ? 'Next' : link.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>


                    </div >
                )
            }
        </>
    )
}