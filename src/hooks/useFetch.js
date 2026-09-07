import { HotToast } from "../utils/HotToast";
import { apiRequest } from "../services/api";

export const useFetch = () => {
  const fetchData = async (
    url,
    option = {},
    _config = {},
  ) => {
    void _config;
    try {
      const data = await apiRequest(url, option);
      return { res: data, status: option.method === "POST" ? 201 : 200, ok: true };
    } catch (err) {
      HotToast("error", err.message || "مشکلی در اتصال رخ داد !");
      return { res: { data: null, message: err.message }, status: 500, ok: false };
    }
  };

  return { fetchData };
};
