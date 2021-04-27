import { OAD_SUCCESS, LOGIN_SUCCESS } from './actionTypes';

export const oadSuccess = (data) => ({
  type: OAD_SUCCESS,
  payload: { ...data }
});

export const loginSuccess = (data) => ({
  type: LOGIN_SUCCESS,
  payload: {...data}
})

