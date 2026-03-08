import { create } from "zustand";
import { persist } from "zustand/middleware";

// create initial state
const initialState = {
  token: null,
  userToken: null,
  username: null,
  tmpData: {
    phone: "",
    newUser: false,
  },
};

export const useUserStore = create(
  persist(
    (set, get) => ({
      ...initialState, //spread  the initial state into the store
      login: ({ token, username }) => set(() => ({ token, username })), //set the user and token into  the store
      setTmpData: (data) =>
        set((state) => ({
          tmpData: { ...state.tmpData, ...data },
        })),
      logout: () => {
        set(() => ({ admin: null, token: null })); // clear  the user and token from the store
        get().clearStorage(); // clear your states from localStorage
      },
      // write function to clear localStorage
      clearStorage: () => {
        get()?.persist?.clearStorage();
      },
    }),
    {
      // here the  persist options
      name: "TaskMentor", // name key  in localStorage
      getStorage: () => localStorage, // it's maybe you want use session storage or cookie storage
    },
  ),
);
