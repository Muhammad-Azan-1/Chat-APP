import {configureStore} from '@reduxjs/toolkit'
import  {rootReducers} from '../reducers/rootReducer'
import {
persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from 'redux-persist'

import storage from 'redux-persist/lib/storage'
import { socketMiddleware } from '../middleware/socketMidlleware'


const persistConfig = {
    key : 'root',
    storage,
    whitelist : ['auth']
}

const persistedReducer = persistReducer(persistConfig , rootReducers)

export const store = configureStore({
    reducer : persistedReducer,

   middleware : (getDefaultMiddleware) =>(
        getDefaultMiddleware({
            serializableCheck : {
                ignoredActions :  [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }).concat(socketMiddleware)
    )
    
})



export const persistor = persistStore(store)



// Get the type of our store variable
export type AppStore = typeof store;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
// Inferred type for dispatch
export type AppDispatch = AppStore['dispatch'];



