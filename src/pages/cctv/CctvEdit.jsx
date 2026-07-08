import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchData } from '../../api/FetchApi';
import CctvInput from './inputs/CctvInput';
import CctvTextarea from './inputs/CctvTextarea';
import CctvSelect from './inputs/CctvSelect';
import CctvCheckbox from './inputs/CctvCheckbox';
import { confirmAlert } from 'react-confirm-alert';

export default function CctvEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [recordDetails, setRecordDetails] = useState(null);
    console.log(recordDetails);

    // ✅ Updated: initial formData now includes all keys, including cctv_record
    const [formData, setFormData] = useState({
        general_form_id: '',
        start_time: '',
        date: '',
        end_time: '',
        description: '',
        place: '',
        record_type: '',
        case_type: '',
        cctv_record: false // ✅ ensures checkbox is controlled from the start
    });

    // console.log("Form Data State:", formData); // Debugging log

    // ✅ Enhanced handleChange: handles both text/select and checkbox inputs
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? "on" : "off") : value
        }));
    };


    // Load record details into form
    useEffect(() => {
        if (recordDetails) {
            setFormData({
                general_form_id: recordDetails.general_form_id || '',
                start_time: recordDetails.start_time || '',
                date: recordDetails.date || '',
                end_time: recordDetails.end_time || '',
                description: recordDetails.description || '',
                place: recordDetails.place || '',
                record_type: recordDetails.record_type || '',
                case_type: recordDetails.case_type || '',
                cctv_record: recordDetails.cctv_record ?? false // ✅ fallback to false
            });
        }
    }, [recordDetails]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!id || !token) return;
        fetchData(
            `/api/cctv-data/${id}`,
            token,
            'data details',
            setRecordDetails
        );
    }, [id]);

    const caseTypes = [
        { label: "Check Process - လုပ်ငန်းစဉ်ကို စစ်ဆေးခြင်း", value: 1 },
        { label: "Customer Complain - customer တိုင်ကြားခြင်းအကြောင်းအရာများ", value: 2 },
        { label: "Accident Case - မတော်တဆဖြစ်ရပ်များ စစ်ဆေးခြင်း", value: 3 },
        { label: "HR Case - HR နှင်ပတ်သတ်သောဖြစ်ရပ်များ စစ်ဆေးခြင်း", value: 4 },
        { label: "Stolen Case - ခိုးယူမူ နှင့်သက်ဆိုင်သော ဖြစ်ရပ်များ စစ်ဆေးခြင်း", value: 5 },
        { label: "Other - အခြားအကြောင်းအရာများ စစ်ဆေးခြင်း", value: 6 },
    ];

    const recordTypes = [
        { label: "Phone Camera", value: "Phone Camera" },
        { label: "Download Data", value: "Download Data" }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`/api/cctv-records/${id}`, {
                method: 'PUT',
                mode: "cors",
                headers: {
                    'Content-Type': 'application/json',
                    "Accept": "application/json",
                    Authorization: `Bearer ${token}`
                },
                credentials: "include",
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 422) {
                    let errorMessages = "";
                    Object.values(data.errors).forEach(errorArray => {
                        errorArray.forEach(error => {
                            errorMessages += `• ${error}\n`;
                        });
                    });
                    confirmAlert({
                        title: "Oops! Please fix these errors",
                        message: errorMessages,
                        buttons: [
                            {
                                label: "OK",
                                onClick: () => { },
                            },
                        ],
                    });
                } else {
                    throw new Error(data.message || "Something went wrong");
                }
            } else {
                confirmAlert({
                    title: "Success",
                    message: "Updated successfully!",
                    buttons: [
                        {
                            label: "OK",
                            onClick: () => {
                                navigate("/cctv_record");
                            },
                        },
                    ],
                });
            }
        } catch (error) {
            onsole.error("Error submitting form:", error);
            confirmAlert({
                title: "Error",
                message: "Something went wrong while submitting the form.",
                buttons: [
                    {
                        label: "OK",
                        onClick: () => { },
                    },
                ],
            });
        }
    };



    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="p-4 sm:p-6 bg-white-100 rounded-lg shadow-md w-full">

                <h2 className="text-center text-lg sm:text-xl font-semibold mb-4">
                    Edit CCTV Request Form
                </h2>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CctvInput
                        label="Start Time (AM/PM):"
                        type="time"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleChange}
                        required={true}
                    />
                    <CctvSelect
                        label="Case Type"
                        name="case_type"
                        options={caseTypes}
                        value={formData.case_type}
                        onChange={handleChange}
                        required={true}
                    />
                    <CctvInput
                        label="End Time (AM/PM):"
                        type="time"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleChange}
                        required={true}
                    />
                    <CctvTextarea
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required={true}
                    />
                    <div>
                        <span className="text-red-500">
                            ***cctv record ယူသွားလျှင် button ကို on ထားပေးရန်
                            နှင့် record type ရွေးပေးရန်***
                        </span>
                        <CctvCheckbox
                            label="CCTV Record:"
                            name="cctv_record"
                            checked={formData.cctv_record === "on"} // ✅ checked only if value is "on"
                            onChange={handleChange}
                            required={false}
                        />
                    </div>

                    <CctvInput
                        label="Place"
                        type="text"
                        name="place"
                        value={formData.place}
                        onChange={handleChange}
                        required={true}
                    />

                    {/* ✅ conditional rendering for Record Type */}
                    {formData.cctv_record === "on" && (
                        <CctvSelect
                            label="Record Type"
                            name="record_type"
                            options={recordTypes}
                            value={formData.record_type}
                            onChange={handleChange}
                            required={true} // only required when on
                        />
                    )}



                    <div className="col-span-1 sm:col-span-2 text-center">
                        <button
                            type="submit"
                            className="text-white px-6 py-2 rounded-md w-full sm:w-auto"
                            style={{ backgroundColor: '#2ea2d1' }}
                        >
                            Update
                        </button>
                    </div>
                </form>

                <Link
                    to="/cctv_record"
                    className="inline-flex px-3 py-1 sm:px-4 sm:py-2 bg-gray-200 rounded hover:bg-gray-300 items-center text-sm sm:text-base mt-4"
                >
                    <span className="mr-1 sm:mr-2">←</span> Back
                </Link>
            </div>
        </div>
    );
}
