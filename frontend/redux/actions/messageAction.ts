import { AppDispatch } from "../store/store";
import { Message } from "@/types/chat.types";
import {
  SET_MESSAGES,
  ADD_MESSAGE,
  DELETE_MESSAGE,
  CLEAR_CHAT_MESSAGES,
  SET_LOADING,
  SET_ERROR,
} from "../reducers/messageReducer";

const SET_MESSAGES_ACTION = (chatId: string, messages: Message[]) => {
  return (dispatch: AppDispatch) => {
    dispatch(SET_MESSAGES({ chatId, messages }));
  };
};

const ADD_MESSAGE_ACTION = (chatId: string, message: Message) => {
  console.log("ADD MESSAGE ACTION RUNS")
  return (dispatch: AppDispatch) => {
    dispatch(ADD_MESSAGE({ chatId, message }));
  };
};

const DELETE_MESSAGE_ACTION = (chatId: string, messageId: string) => {
  return (dispatch: AppDispatch) => {
    dispatch(DELETE_MESSAGE({ chatId, messageId }));
  };
};

const CLEAR_CHAT_MESSAGES_ACTION = (chatId: string) => {
  return (dispatch: AppDispatch) => {
    dispatch(CLEAR_CHAT_MESSAGES(chatId));
  };
};

const SET_LOADING_ACTION = (loading: boolean) => {
  return (dispatch: AppDispatch) => {
    dispatch(SET_LOADING(loading));
  };
};

const SET_ERROR_ACTION = (error: string | null) => {
  return (dispatch: AppDispatch) => {
    dispatch(SET_ERROR(error));
  };
};

export {
  SET_MESSAGES_ACTION,
  ADD_MESSAGE_ACTION,
  DELETE_MESSAGE_ACTION,
  CLEAR_CHAT_MESSAGES_ACTION,
  SET_LOADING_ACTION,
  SET_ERROR_ACTION,
};
