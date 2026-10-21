import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export async function signInWithGoogle() {
  if (!Capacitor.isNativePlatform()) {
    return signInWithPopup(auth, googleProvider);
  }

  const result = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
  const idToken = result.credential?.idToken;
  if (!idToken) throw new Error('Google sign-in returned no ID token');

  return signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
}
