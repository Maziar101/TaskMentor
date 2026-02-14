import toast from "react-hot-toast";

export const HotToast = (status, message) => {
  toast.dismiss();
  return toast[status](message);
};
