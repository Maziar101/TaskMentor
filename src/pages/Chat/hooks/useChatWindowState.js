import { useMemo, useReducer } from "react";
import { HandleReduce } from "../../../utils/HandleReducer";

const initialState = {
  searchOpen: false,
  messageSearch: "",
  messageMenu: null,
  replyTarget: null,
  editTarget: null,
  previewImage: null,
  pinnedJump: null,
  pinnedListOpen: false,
  profileOpen: false,
};

const reducer = (state, action) => {
  if (!Object.hasOwn(state, action.type)) return state;
  const currentValue = state[action.type];
  const nextValue = typeof action.payload === "function"
    ? action.payload(currentValue)
    : action.payload;
  return Object.is(currentValue, nextValue) ? state : { ...state, [action.type]: nextValue };
};

export default function useChatWindowState() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const update = useMemo(() => HandleReduce(dispatch), []);
  return { state, update };
}
