import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Import reducers at the top level - this ensures they're loaded before store creation
// The key is to import them directly, not conditionally
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import registerStepReducer from './slices/registerStepSlice';

// Persist config
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth slice
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  registerStep: registerStepReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

// Handle HMR - only update reducer, don't recreate store
if (import.meta.hot) {
  import.meta.hot.accept(
    ['./slices/authSlice', './slices/userSlice', './slices/registerStepSlice'],
    (newModules) => {
      if (newModules) {
        // Get the new reducers
        const newAuthReducer = newModules[0]?.default || authReducer;
        const newUserReducer = newModules[1]?.default || userReducer;
        const newRegisterStepReducer = newModules[2]?.default || registerStepReducer;
        
        // Create new root reducer with updated reducers
        const newRootReducer = combineReducers({
          auth: newAuthReducer,
          user: newUserReducer,
          registerStep: newRegisterStepReducer
        });
        
        // Replace reducer in store
        store.replaceReducer(persistReducer(persistConfig, newRootReducer));
      }
    }
  );
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
