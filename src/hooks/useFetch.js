import { useUserStore } from "../store/userStore";
import { HotToast } from "../utils/HotToast";

export const useFetch = () => {
  const {
    logout,
    tmpData: { token: tmpToken },
    token,
  } = useUserStore();

  const fetchData = async (
    url,
    option = {},
    { type = "token", haveToken = true } = {}
  ) => {
    try {
      const res = await fetch(url, {
        ...option,
        headers: {
          ...(haveToken && {
            authorization: `Bearer ${
              type === "token" ? `${token}` : `${tmpToken}`
            }`,
          }),
          ...option.headers,
        },
      });

      if (res.status === 401) {
        logout();
      }

      const data = await res.json();
      return { res: data, status: res.status, ok: res.ok };
    } catch (err) {
      HotToast("error", "مشکلی در اتصال رخ داد !");
      return { res: { data: null }, status: 500, ok: false };
    }
  };

  return { fetchData };
};