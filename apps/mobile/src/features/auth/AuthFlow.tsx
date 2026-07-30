import React, {useState} from 'react';

import {ForgetPasswordScreen} from './screens/ForgetPasswordScreen';
import {LoginScreen} from './screens/LoginScreen';
import {RegisterScreen} from './screens/RegisterScreen';
import type {AuthFlowProps, AuthScreen} from './types';

export function AuthFlow({onLoginSuccess}: AuthFlowProps): React.JSX.Element {
  const [screen, setScreen] = useState<AuthScreen>('login');

  if (screen === 'register') {
    return <RegisterScreen goTo={setScreen} onLoginSuccess={onLoginSuccess} />;
  }

  if (screen === 'forgetPassword') {
    return <ForgetPasswordScreen goTo={setScreen} />;
  }

  return <LoginScreen goTo={setScreen} onLoginSuccess={onLoginSuccess} />;
}
