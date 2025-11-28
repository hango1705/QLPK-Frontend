import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RegisterState {
  currentStep: number;
  formData: Record<string, any>;
  countdown: number;
}

const initialState: RegisterState = {
  currentStep: 1,
  formData: {},
  countdown: 0
};

const registerStepSlice = createSlice({
  name: 'registerStep',
  initialState,
  reducers: {
    setCurrentStep(state, action: PayloadAction<number>) {
      state.currentStep = action.payload;
    },
    setFormData(state, action: PayloadAction<Record<string, any>>) {
      state.formData = { ...state.formData, ...action.payload };
    },
    setCountdown(state, action: PayloadAction<number>) {
      state.countdown = action.payload;
    },
    resetRegisterState(state) {
      state.currentStep = 1;
      state.formData = {};
      state.countdown = 0;
    }
  }
});

export const { setCurrentStep, setFormData, setCountdown, resetRegisterState } = registerStepSlice.actions;
export default registerStepSlice.reducer;
