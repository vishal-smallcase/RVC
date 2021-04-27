import { OAD_SUCCESS, LOGIN_SUCCESS } from '../actions/actionTypes';

const initialState = {
  userId: '',
  custId: '',
  uid: '',
  email: ''
};

const userReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case OAD_SUCCESS:
      return { ...state, userId: payload.userId, custId: payload.custId };
    case LOGIN_SUCCESS:
      return { ...state, uid: payload.uid, email: payload.email };
    default:
      return state;
  }
};

export default userReducer;
