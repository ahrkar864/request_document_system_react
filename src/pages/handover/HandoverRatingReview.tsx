import React, { useState } from "react";
import type {
  HandoverDataType,
  RecipientData,
  ReviewAttachment,
} from "../../utils/HandoverUtil/handovertype";
import { dateFormat } from "../../utils/requestDiscountUtil/helper";
import {
  FiPaperclip,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";

interface Props {
  detailData: HandoverDataType;
}

interface LightboxState {
  reviewIndex: number;
  attachmentIndex: number;
}

const HandoverRatingReview: React.FC<Props> = ({ detailData }) => {
  const reviews: RecipientData[] = Array.isArray(detailData?.recipientData)
    ? detailData.recipientData
    : detailData?.recipientData
      ? [detailData.recipientData]
      : [];
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const authUserId = detailData?.authUserId;
  const isRecipientStage =
    detailData?.recipient === true &&
    detailData?.generalForm?.status === "Checked" || detailData?.recipient === true &&
    detailData?.generalForm?.status === "Recipient Received";

  const visibleReviews = reviews.filter((item) => {
    if (isRecipientStage) {
      return String(item.user_id) === String(authUserId);
    }
    return true;
  });

  if (visibleReviews.length === 0) return null;

  const openLightbox = (
    reviewIndex: number,
    attachmentIndex: number,
  ): void => setLightbox({ reviewIndex, attachmentIndex });
  const closeLightbox = (): void => setLightbox(null);

  const activeAttachments: ReviewAttachment[] =
    lightbox !== null ? (visibleReviews[lightbox.reviewIndex]?.files ?? []) : [];
  const activeAttachment =
    lightbox !== null ? activeAttachments[lightbox.attachmentIndex] : undefined;

  const prevImage = (): void =>
    setLightbox((prev) =>
      prev !== null && activeAttachments.length > 0
        ? {
            ...prev,
            attachmentIndex:
              (prev.attachmentIndex - 1 + activeAttachments.length) %
              activeAttachments.length,
          }
        : null,
    );

  const nextImage = (): void =>
    setLightbox((prev) =>
      prev !== null && activeAttachments.length > 0
        ? {
            ...prev,
            attachmentIndex:
              (prev.attachmentIndex + 1) % activeAttachments.length,
          }
        : null,
    );

  return (
    <>
      {/* ── Rating & Review Card ── */}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {visibleReviews.map((item, reviewIndex) => {
          const rating = item.rating ?? 0;
          const review = item.review ?? "";
          const submittedAt = item.created_at ?? "";
          const attachments = item.files ?? [];

          return item?.rating ? (
            <div
              key={item.id ?? reviewIndex}
              className="bg-gray-50 rounded-lg p-4 sm:p-5"
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Recipient Rating &amp; Review
                </h3>
              </div>

              {/* Score + Stars + Date */}
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-2xl font-semibold text-gray-800">
                  {rating.toFixed(1)}
                </span>
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) =>
                      n <= rating ? (
                        <AiFillStar
                          key={n}
                          className="text-yellow-400 w-5 h-5"
                        />
                      ) : (
                        <AiOutlineStar
                          key={n}
                          className="text-gray-300 w-5 h-5"
                        />
                      ),
                    )}
                  </div>
                  {submittedAt && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      submitted {dateFormat(submittedAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Review */}

              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-1">Review By {item?.user?.name}</p>
                <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-md px-3 py-2 leading-relaxed whitespace-pre-wrap break-words">
                  {review}
                </p>
              </div>

              {/* Attachments Grid */}
              {attachments.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <FiPaperclip className="w-3 h-3" />
                    Attachments
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {attachments.map((att, attachmentIndex) => (
                      <button
                        key={att.id}
                        type="button"
                        onClick={() =>
                          openLightbox(reviewIndex, attachmentIndex)
                        }
                        className="relative aspect-[4/2] rounded-md overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        title={att.file_name}
                      >
                        <img
                          src={att.file_url}
                          alt={att.file_name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-white/90 text-[10px] text-gray-500 px-1.5 py-0.5 truncate border-t border-gray-100">
                          {att.file_name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null;
        })}
      </div>

      {/* ── Lightbox Overlay ── */}
      {lightbox !== null && activeAttachment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={closeLightbox}
        >
          <div
            className="relative bg-white rounded-xl p-3 shadow-xl max-w-2xl w-[92%]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute -top-3 -right-3 bg-gray-800 hover:bg-gray-900 text-white rounded-full w-7 h-7 flex items-center justify-center z-10 transition-colors"
              aria-label="Close"
            >
              <FiX className="w-4 h-4" />
            </button>

            {/* Full image */}
            <img
              src={activeAttachment.file_url}
              alt={activeAttachment.file_name}
              className="w-full rounded-lg object-contain max-h-[70vh]"
            />

            {/* Caption + counter */}
            <p className="text-xs text-gray-400 text-center mt-2 truncate px-8">
              {activeAttachment.file_name}
              {activeAttachments.length > 1 && (
                <span className="ml-2 text-gray-300">
                  {lightbox.attachmentIndex + 1} / {activeAttachments.length}
                </span>
              )}
            </p>

            {/* Prev / Next */}
            {activeAttachments.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center shadow transition-colors"
                  aria-label="Previous image"
                >
                  <FiChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center shadow transition-colors"
                  aria-label="Next image"
                >
                  <FiChevronRight className="w-4 h-4 text-gray-700" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default HandoverRatingReview;
