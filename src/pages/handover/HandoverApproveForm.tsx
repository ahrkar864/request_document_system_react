import React, { useContext, useState, useRef } from "react";
import { Button, Textarea, Rating } from "@mantine/core";
import Swal from "sweetalert2";
import { NotificationContext } from "../../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import type { HandoverDataType } from "../../utils/HandoverUtil/handovertype";
import { approveFormHandover } from "../../api/Handover/handover";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

interface RecipientUser {
  id: number;
  name: string;
  emp_id: string;
}

type AttachmentPreview = {
  name: string;
  url: string | null;
  isImage: boolean;
};

type HandoverApproveFormProps = {
  recipients?: RecipientUser[];
  detailData?: HandoverDataType;
  canAddRecipients?: boolean;
  checkedHandoverIds?: Array<number | string>;
  onRefresh: () => void;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const HandoverApproveForm: React.FC<HandoverApproveFormProps> = ({
  recipients,
  detailData,
  canAddRecipients = false,
  checkedHandoverIds = [],
  onRefresh,
  loading,
  setLoading,
}) => {
  const { refreshNotifications } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0); // ★ star rating
  const [photos, setPhotos] = useState<File[]>([]); // multiple attachments
  const [previews, setPreviews] = useState<AttachmentPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recipientReviews = Array.isArray(detailData?.recipientData)
    ? detailData.recipientData
    : detailData?.recipientData
      ? [detailData.recipientData]
      : [];
  const authUserId = detailData?.authUserId;
  const pendingRecipientReviews = recipientReviews.filter(
    (item) =>
      String(item.user_id) === String(authUserId) && item.rating == null,
  );
  const canUploadRecipientReview =
    detailData?.recipient === true &&
    detailData?.generalForm?.status === "Checked" &&
    pendingRecipientReviews.length > 0;

  // ── Comment handler ──────────────────────────────────
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > 150) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Comment cannot exceed 150 characters",
      });
      return;
    }
    setComment(e.target.value);
  };

  // ── Attachment select handler ────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Maximum 5 attachments allowed",
      });
      return;
    }
    const newPreviews = files.map((file) => {
      const isImage =
        file.type.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp)$/i.test(file.name);

      return {
        name: file.name,
        url: isImage ? URL.createObjectURL(file) : null,
        isImage,
      };
    });
    setPhotos((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  // ── Remove attachment ────────────────────────────────
  const handleRemovePhoto = (index: number) => {
    const preview = previews[index];
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Main submit ──────────────────────────────────────
  const handleSubmit = async (statusValue: string) => {
    if (statusValue === "Ongoing" && !canAddRecipients) {
      Swal.fire({
        icon: "warning",
        title: "Not allowed",
        text: "Only the originator can add recipients.",
      });
      return;
    }

    if (
      ["checked", "recipient_received"].includes(statusValue) &&
      checkedHandoverIds.length === 0
    ) {
      Swal.fire({
        icon: "warning",
        title: "Checked item required",
        text: "Please check at least one handover item.",
      });
      return;
    }

    if (
      statusValue === "recipient_received" &&
      pendingRecipientReviews.length === 0
    ) {
      Swal.fire({
        icon: "warning",
        title: "Review already submitted",
        text: "You have already uploaded your rating and review.",
      });
      return;
    }

    const confirmMap: Record<string, string> = {
      Ongoing: "Send to Supervisor?",
      checked: "Want to check?",
      recipient_received: "Confirm done and send to Branch Manager?",
      approved: "Want to approve?",
      completed: "Want to complete?",
      Cancel: "Want to cancel?",
      back_to_previous: "Want to send back?",
      back_to_previous_checked: "Want to send back?",
    };

    const confirmBox = await Swal.fire({
      title: "Are you sure",
      text: confirmMap[statusValue] ?? "Want to do this?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "rgb(29, 95, 219)",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });
    if (!confirmBox.isConfirmed) return;

    const token = localStorage.getItem("token");
    const generalFormId = detailData?.generalForm?.id;
    const formID = detailData?.generalForm?.form_id;

    if (!token || !generalFormId || !formID) {
      Swal.fire("Error", "Form ID is missing", "error");
      return;
    }

    if (statusValue === "Ongoing" && recipients?.length == 0) {
      Swal.fire({
        icon: "warning",
        title: "Recipient required",
        text: "Please add recipients.",
      });
      return;
    }

    if (statusValue === "recipient_received" && rating === 0) {
      Swal.fire({
        icon: "warning",
        title: "Rating required",
        text: "Please give a star rating.",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("status", statusValue);
      formData.append("comment", comment);
      formData.append("rating", String(rating));
      console.log("RECEEE", recipients);
      recipients?.forEach((recipient) =>
        formData.append("recipients[]", String(recipient.id)),
      );
      checkedHandoverIds.forEach((handoverId) =>
        formData.append("checked[]", String(handoverId)),
      );

      photos.forEach((photo) => formData.append("attachments[]", photo));

      await approveFormHandover(token, formData, formID, generalFormId);

      const successMap: Record<string, string> = {
        Ongoing: "Form sent to supervisor successfully",
        checked: "Form checked successfully",
        recipient_received: "Done! Sent to Branch Manager",
        completed: "Form completed successfully",
        approved: "Form Approved successfully",
        Cancel: "Form cancelled successfully",
        back_to_previous: "Form sent back successfully",
        back_to_previous_checked: "Form sent back successfully",
      };

      Swal.fire({
        icon: "success",
        title: "Success",
        text: successMap[statusValue] ?? `Form ${statusValue} successfully`,
      });
      await refreshNotifications();
      setComment("");
      setRating(0);
      setPhotos([]);
      setPreviews([]);
      onRefresh();
    } catch (error) {
      console.error(error);
      Swal.fire(
        "Error",
        getApiErrorMessage(error, "Something went wrong"),
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      {/* ── 1. Creator → Send to Supervisor ── */}
      {detailData?.generalForm?.status === "Default" &&
        canAddRecipients &&
        detailData?.sendManagerAssettype === true && (
          <div className="flex items-center gap-4">
            <Button
              color="blue"
              loading={loading}
              disabled={loading}
              onClick={() => handleSubmit("Ongoing")}
            >
              Send to Supervisor
            </Button>
          </div>
        )}

      {/* ── 2. Supervisor → Check ── */}
      {detailData?.supervisor === true &&
        detailData?.generalForm?.status === "Ongoing" && (
          <>
            <h1>Remark</h1>
            <div className="grid lg:grid-cols-2 grid-cols-1 gap-6">
              <Textarea
                resize="vertical"
                placeholder="Your comment"
                value={comment}
                onChange={handleCommentChange}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  color="green"
                  loading={loading}
                  disabled={loading}
                  onClick={() => handleSubmit("checked")}
                >
                  Check
                </Button>
                <Button
                  color="yellow"
                  disabled={loading}
                  onClick={() => handleSubmit("back_to_previous_checked")}
                >
                  Back To Previous
                </Button>
                <Button
                  color="red"
                  disabled={loading}
                  onClick={() => handleSubmit("Cancel")}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}

      {/* ── 3. Recipient → Rating + Photo + Done ── (အသစ်) */}
      {canUploadRecipientReview && (
        <>
          <h1>Recipient Proof</h1>
          <div className="grid lg:grid-cols-2 grid-cols-1 gap-6">
            <div className="flex flex-col gap-4">
              {/* Star Rating */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Rating</p>
                <Rating
                  value={rating}
                  onChange={setRating}
                  size="xl"
                  color="yellow"
                />
              </div>

              {/* Remark */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Review</p>
                <Textarea
                  resize="vertical"
                  placeholder="Your comment"
                  value={comment}
                  onChange={handleCommentChange}
                />
              </div>

              {/* Attachment Upload */}
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Attachments (max:5)
                </p>
                <span className="block text-sm text-gray-500 font-normal mt-1">
                  File Type Accepts: (.xlsx, .xls, .csv, .pdf, .doc, .docx, .jpg,
                  .jpeg, .png, .webp)
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handlePhotoChange}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  Choose Files
                </button>

                {/* Preview Grid */}
                {previews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {previews.map((preview, i) => (
                      <div
                        key={i}
                        className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                      >
                        {preview.isImage && preview.url ? (
                          <img
                            src={preview.url}
                            alt={preview.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="h-full p-2 flex flex-col items-center justify-center text-center text-xs text-gray-600">
                            <span className="text-lg">📄</span>
                            <span className="line-clamp-2 break-all">
                              {preview.name}
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-start gap-3 pt-6">
              <Button
                color="green"
                loading={loading}
                disabled={loading}
                onClick={() => handleSubmit("recipient_received")}
              >
                Done
              </Button>
              <Button
                color="red"
                disabled={loading}
                onClick={() => handleSubmit("Cancel")}
              >
                Cancel
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ── 4. Branch Manager → Complete ── */}
      {detailData?.approver === true &&
        detailData?.generalForm?.status === "Recipient Received" && (
          <>
            <h1>Remark</h1>
            <div className="grid lg:grid-cols-2 grid-cols-1 gap-6">
              <Textarea
                resize="vertical"
                placeholder="Your comment"
                value={comment}
                onChange={handleCommentChange}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  color="green"
                  loading={loading}
                  disabled={loading}
                  onClick={() => handleSubmit("approved")}
                >
                  Approve
                </Button>
                <Button
                  color="yellow"
                  disabled={loading}
                  onClick={() => handleSubmit("back_to_previous")}
                >
                  Back To Previous
                </Button>
                <Button
                  color="red"
                  disabled={loading}
                  onClick={() => handleSubmit("Cancel")}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}

      {/* ── 4. IT Manager → Complete ── */}
      {detailData?.manager === true &&
        detailData?.generalForm?.status === "Approved" && (
          <>
            <h1>Remark</h1>
            <div className="grid lg:grid-cols-2 grid-cols-1 gap-6">
              <Textarea
                resize="vertical"
                placeholder="Your comment"
                value={comment}
                onChange={handleCommentChange}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  color="green"
                  loading={loading}
                  disabled={loading}
                  onClick={() => handleSubmit("completed")}
                >
                  Complete
                </Button>
              </div>
            </div>
          </>
        )}
    </div>
  );
};

export default HandoverApproveForm;
