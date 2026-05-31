import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import userReducer from "./features/userSlice";
import customerReducer from "./features/customerSlice";
import brokerReducer from "./features/brokerSlice";
import assetReducer from "./features/assetSlice";
import investmentReducer from "./features/investmentSlice";

import customerPayReducer from "./features/customerpaySlice";
import brokerPayReducer from "./features/brokerpaySlice";

import { userApi } from "./userApi";
import { customerApi } from "./customerApi";
import { brokerApi } from "./brokerApi";
import { assetApi } from "./assetApi";
import { investmentApi } from "./investmentApi";

import { customerPayApi } from "./customerpayApi";
import { brokerPayApi } from "./brokerpayApi";

import { customerPayHistoryApi } from "./customerPayHistoryApi";
import { brokerPayHistoryApi } from "./brokerPayHistoryApi";

import { dashboardApi } from "./dashboardApi";
import { notificationApi } from "./notificationApi.js";

const store = configureStore({
  reducer: {
    user: userReducer,
    customer: customerReducer,
    broker: brokerReducer,
    asset: assetReducer,
    investment: investmentReducer,

    customerPay: customerPayReducer,
    brokerPay: brokerPayReducer,

    [userApi.reducerPath]: userApi.reducer,
    [customerApi.reducerPath]: customerApi.reducer,
    [brokerApi.reducerPath]: brokerApi.reducer,
    [assetApi.reducerPath]: assetApi.reducer,
    [investmentApi.reducerPath]: investmentApi.reducer,

    [customerPayApi.reducerPath]: customerPayApi.reducer,
    [brokerPayApi.reducerPath]: brokerPayApi.reducer,

    [customerPayHistoryApi.reducerPath]: customerPayHistoryApi.reducer,
    [brokerPayHistoryApi.reducerPath]: brokerPayHistoryApi.reducer,

    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      userApi.middleware,
      customerApi.middleware,
      brokerApi.middleware,
      assetApi.middleware,
      investmentApi.middleware,

      customerPayApi.middleware,
      brokerPayApi.middleware,

      customerPayHistoryApi.middleware,
      brokerPayHistoryApi.middleware,

      dashboardApi.middleware,
      notificationApi.middleware
    ),
});

setupListeners(store.dispatch);

export default store;