export const initialChatState = {
  conversations: [],
  contacts: [],
  messagesByConversation: {},
  loading: true,
  error: "",
  saving: false,
  reload: 0,
};

export const chatReducer = (state, action) => {
  if (!Object.hasOwn(state, action.type)) return state;
  const currentValue = state[action.type];
  const nextValue = typeof action.payload === "function"
    ? action.payload(currentValue)
    : action.payload;
  return Object.is(currentValue, nextValue) ? state : { ...state, [action.type]: nextValue };
};
