import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message, MessageState } from "@/types/chat.types";

const initialState: MessageState = {
  messages: {}, // { chatId: Message[] }
  loading: false,
  error: null,
};

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    // Set all messages for a specific chat
    SET_MESSAGES: (
      state,
      action: PayloadAction<{ chatId: string; messages: Message[] }>
    ) => {
      state.messages[action.payload.chatId] = action.payload.messages;
      state.loading = false;
      state.error = null;
    },

    // Add a new message to a specific chat
    ADD_MESSAGE: (
      state,
      action: PayloadAction<{ chatId: string; message: Message }>
    ) => {

      const { chatId, message } = action.payload;
      console.log("🔴 REDUCER: ADD_MESSAGE called", { chatId, messageId: message.id, currentCount: state.messages[chatId]?.length || 0 });

      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }

      // Create a new array reference to ensure React detects the change
      state.messages[chatId] = [...state.messages[chatId], message];

      console.log("✅ REDUCER: Message added to state", { chatId, newCount: state.messages[chatId].length })
    },

    // Delete a message from a specific chat
    DELETE_MESSAGE: (
      state,
      action: PayloadAction<{ chatId: string; messageId: string }>
    ) => {
      const { chatId, messageId } = action.payload;
      if (state.messages[chatId]) {
        state.messages[chatId] = state.messages[chatId].filter(
          (msg) => msg.id !== messageId
        );
      }
    },

    // Clear messages for a specific chat
    CLEAR_CHAT_MESSAGES: (state, action: PayloadAction<string>) => {
      delete state.messages[action.payload];
    },

    // Set loading state
    SET_LOADING: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error state
    SET_ERROR: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  SET_MESSAGES,
  ADD_MESSAGE,
  DELETE_MESSAGE,
  CLEAR_CHAT_MESSAGES,
  SET_LOADING,
  SET_ERROR,
} = messageSlice.actions;

export default messageSlice.reducer;
