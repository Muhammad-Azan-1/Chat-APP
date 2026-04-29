"use client";

import React from "react";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/redux/store/store";
import { Provider } from "react-redux";
import SocketProvider from "./SocketProvider";

const MainProvider = ({ children }: { children: React.ReactNode }) => {
  // console.log("component rendered");

  return (
    <>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SocketProvider>{children}</SocketProvider>
        </PersistGate>
      </Provider>
    </>
  );
};

export default MainProvider;
