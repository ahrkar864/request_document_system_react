import React, { useState } from "react";
import cctvPhoto from "../../assets/images/ban1.png";
import CctvInput from "./inputs/CctvInput";
import CctvSelect from "./inputs/CctvSelect";
import CctvTextarea from "./inputs/CctvTextarea";
import CctvCheckbox from "./inputs/CctvCheckbox";
import { confirmAlert } from "react-confirm-alert";
import { useNavigate } from "react-router-dom";
import NavPath from "../../components/NavPath";

export default function () {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        start_time: "",
        place: "",
        end_time: "",
        case_type: "",
        record_type: "",
        issue_date: "",
        description: "",
        cctv_record: false,
        form_id: 15,
        layout_id: 14,
        route: "cctv_record"
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

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
    ]


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch("/api/cctv-records", {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                credentials: "include",
                body: JSON.stringify(formData),
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
            }
        } catch (error) {
            console.error("Error submitting form:", error);
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
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            {/* <div
                className="h-40 sm:h-48 w-full bg-cover bg-center rounded-lg shadow-md mb-6"
                style={{ backgroundImage: `url(${cctvPhoto})` }}
            ></div> */}
            <img
                src={cctvPhoto}
                className="w-full h-auto object-contain rounded-lg shadow-md mb-6"
            />
            <NavPath
                segments={[
                    { path: "/dashboard", label: "Home" },
                    { path: "/dashboard", label: "Dashboard" },
                    { path: "/cctv_record", label: "Cctv Request" },
                    { path: "/cctv-request", label: "Cctv Record" },
                    { path: "/cctv-form", label: "Cctv Form" },
                ]}
            />
            <div className="p-4 sm:p-6 bg-white-100 rounded-lg shadow-md w-full">
                <h2 className="text-center text-lg sm:text-xl font-semibold mb-4">
                    CCTV Request Form
                </h2>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                    <CctvInput
                        label="Start Time (AM/PM):"
                        type="time"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleChange}
                        required={true}
                    />
                    <CctvInput
                        label="Place"
                        type="text"
                        name="place"
                        value={formData.place}
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
                    <CctvSelect
                        label="Case Type"
                        name="case_type"
                        options={caseTypes}
                        value={formData.case_type}
                        onChange={handleChange}
                        required={true}
                    />
                    <CctvInput
                        label="Case Date"
                        type="date"
                        name="issue_date"
                        value={formData.issue_date}
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
                    <CctvCheckbox
                        label="CCTV Record:"
                        name="cctv_record"
                        checked={formData.cctv_record}
                        onChange={handleChange}
                        required={true}
                    />
                    {formData.cctv_record && (
                        <CctvSelect
                            label="Record Type"
                            name="record_type"
                            options={recordTypes}
                            value={formData.record_type}
                            onChange={handleChange}
                            required={true}
                        />
                    )}
                    <div className="col-span-1 sm:col-span-2 text-center">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-green-400 to-purple-500 text-white px-6 py-2 rounded-md w-full sm:w-auto"
                        >
                            {isSubmitting ? 'Processing...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
