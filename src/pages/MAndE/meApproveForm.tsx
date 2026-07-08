import React, { useContext, useState } from "react";
import { approveFormME } from "../../api/ME/meData";
import { Button, Textarea } from "@mantine/core";
import Swal from "sweetalert2";
import { NotificationContext } from "../../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import type { meGeneratorDataType } from "../../utils/meDataUtil/metype";

type MeApproveFormProps = {
  detailData?: meGeneratorDataType; // make optional
  onRefresh: () => void;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const MeApproveForm: React.FC<MeApproveFormProps> = ({
  detailData,
  onRefresh,
  loading,
  setLoading,
}) => {
  const { refreshNotifications } = useContext(NotificationContext);

  const [comment, setComment] = useState("");

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
  console.log("DetailData>>", detailData);
  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };
  const handleSubmit = async (statusValue: string) => {
    console.log("StatusValue>>", statusValue);
    let confirmText;
    if (statusValue == "Ongoing") {
      confirmText = "Send To Manager?";
    } else if (statusValue == "checked") {
      confirmText = "Want to check?";
    } else if (statusValue == "completed") {
      confirmText = "Want to complete?";
    } else if (statusValue == "Cancel") {
      confirmText = "Want to cancel ?";
    } else if (
      statusValue == "back_to_previous_checked" ||
      statusValue == "back_to_previous"
    ) {
      confirmText = "Want to previous back?";
    } else {
      confirmText = "Want to do this?";
    }

    if (
      statusValue == "Ongoing" ||
      statusValue == "checked" ||
      statusValue == "completed" ||
      statusValue === "Cancel" ||
      statusValue == "back_to_previous_checked" ||
      statusValue == "back_to_previous"
    ) {
      const confirmBox = await Swal.fire({
        title: "Are you sure",
        text: confirmText,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "rgb(29, 95, 219)",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      });

      if (!confirmBox.isConfirmed) return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const generalFormId = detailData?.generalForm?.id;
    const subFormId = detailData?.subForm?.sub_form_id;
    const formID = detailData?.generalForm?.form_id;

    if (!generalFormId || !subFormId || !formID) {
      Swal.fire("Error", "Form ID is missing", "error");
      return;
    }

    const isBack =
      statusValue === "back_to_previous" || "back_to_previous_checked";
    const isCancel = statusValue === "Cancel";
    const isSendManager = statusValue === "Ongoing";

    const needsRemark = isBack || isCancel;
    const hasComment = comment?.trim().length > 0;
    const isDefaultStatus = detailData?.generalForm?.status === "Default";

    if (
      needsRemark &&
      !hasComment &&
      !isDefaultStatus &&
      statusValue !== "checked" &&
      statusValue !== "completed"
    ) {
      Swal.fire({
        icon: "warning",
        title: "Remark required",
        text: "You must fill a reason.",
      });
      return;
    }
    setLoading(true);
    try {
      await approveFormME(
        token,
        { status: statusValue, comment },
        formID,
        generalFormId,
        subFormId,
      );
      console.log(
        { status: statusValue, comment },
        formID,
        generalFormId,
        subFormId,
      );
      const successMap: Record<string, string> = {
        Ongoing: "Form sent to manager successfully",
        back_to_previous: "Form sent back successfully",
        back_to_previous_checked: "Form sent back successfully",
        Cancel: "Form cancelled successfully",
      };

      Swal.fire({
        icon: "success",
        title: "Success",
        text: successMap[statusValue] ?? `Form ${statusValue} successfully`,
      });
      await refreshNotifications();
      setComment("");
      onRefresh();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };
  console.log("DetailData>>", detailData);

  return (
    <div className="mb-6">
      {detailData?.generalForm?.status === "Default" &&
        detailData?.sendManagerAssettype === true && (
          <>
            {/* <h1>Remark</h1> */}
            <div className="flex items-center gap-4 w-full">
              <div className="flex items-center gap-4">
                <Button
                  color="blue"
                  loading={loading}
                  disabled={loading}
                  onClick={() => handleSubmit("Ongoing")}
                >
                  Send to manager
                </Button>

                {/* <Button color="red" disabled={loading} onClick={handleBack}>
                  Cancel
                </Button> */}
              </div>
            </div>
          </>
        )}

      {detailData?.checker === true &&
        detailData?.generalForm?.status === "Ongoing" && (
          <>
            <h1>Remark</h1>
            <div className="grid lg:grid-cols-2 grid-cols-1 gap-6">
              <div className="">
                <Textarea
                  resize="vertical"
                  name="comment"
                  className="w-full"
                  placeholder="Your comment"
                  value={comment}
                  onChange={handleCommentChange}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 md:justify-start ">
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

        

      {detailData?.approver === true &&
        detailData?.generalForm?.status === "checked" && (
          <>
            <h1>Remark</h1>
            <div className="grid lg:grid-cols-2   grid-cols-1 gap-6">
              <div className=" ">
                <Textarea
                  resize="vertical"
                  name="comment"
                  className="w-full"
                  placeholder="Your comment"
                  value={comment}
                  onChange={handleCommentChange}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 md:justify-start ">
                <Button
                  color="green"
                  loading={loading}
                  disabled={loading}
                  onClick={() => handleSubmit("completed")}
                >
                  Complete
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
    </div>
  );
};

export default MeApproveForm;
