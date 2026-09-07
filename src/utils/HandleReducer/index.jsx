export const HandleReduce = (dispatch) => (type, payload) => {
  if (
    Array.isArray(type) &&
    Array.isArray(payload) &&
    type.length === payload.length
  ) {
    type.forEach((tp, index) => {
      dispatch({ type: tp, payload: payload[index] });
    });
  } else {
    dispatch({ type, payload });
  }
};
