'use client';

import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from '@react-oauth/google';

interface GoogleAuthButtonProps {
  clientId: string;
  onSuccess: (response: CredentialResponse) => void | Promise<void>;
  onError: () => void;
}

export function GoogleAuthButton({ clientId, onSuccess, onError }: GoogleAuthButtonProps) {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex justify-center [&>div]:w-full">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          theme="filled_black"
          shape="rectangular"
          size="large"
          text="continue_with"
        />
      </div>
    </GoogleOAuthProvider>
  );
}
