export type AuthScreen = 'login' | 'register' | 'forgetPassword';

export type AuthNavigation = {
  goTo: (screen: AuthScreen) => void;
};

export type AuthFlowProps = {
  onLoginSuccess: () => void;
};
