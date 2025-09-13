// src/Auth/Navigation/AuthStack.js
import { createStackNavigator } from '@react-navigation/stack';
import BusinessLoginScreen from '../Screens/BusinessLoginScreen';
import BusinessRegisterScreen from '../Screens/BusinessRegisterScreen';
import ForgotPasswordScreen from '../Screens/ForgotPasswordScreen';
import OTPVerificationScreen from '../Screens/OTPVerificationScreen';

const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'white' },
      }}
    >
      <Stack.Screen name="Login" component={BusinessLoginScreen} />
      <Stack.Screen name="BusinessRegister" component={BusinessRegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
