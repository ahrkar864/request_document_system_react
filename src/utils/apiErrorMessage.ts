type ErrorBag = Record<string, string[] | string>;

const flattenValidationErrors = (errors: unknown): string | null => {
  if (!errors || typeof errors !== "object") {
    return null;
  }

  const messages = Object.values(errors as ErrorBag)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim() !== "",
    );

  return messages.length > 0 ? messages.join("\n") : null;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong",
) => {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const responseData = (error as any)?.response?.data;

  if (typeof responseData === "string" && responseData.trim() !== "") {
    return responseData;
  }

  const validationMessage = flattenValidationErrors(responseData?.errors);
  if (validationMessage) {
    return validationMessage;
  }

  if (typeof responseData?.error === "string" && responseData.error.trim() !== "") {
    return responseData.error;
  }

  if (typeof responseData?.message === "string" && responseData.message.trim() !== "") {
    return responseData.message;
  }

  if (
    typeof (error as any)?.message === "string" &&
    (error as any).message.trim() !== ""
  ) {
    return (error as any).message;
  }

  return fallback;
};
