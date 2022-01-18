import {useEffect} from 'react';
import '../styles/globals.css'

import { useAuthState } from "react-firebase-hooks/auth";
import {auth } from "../firebase";
import Login from "./login"
import Loading from "../components/Loading"
import { AuthProvider } from '../lib/auth';
import { createUser } from '../lib/db';

function MyApp({ Component, pageProps }) {
  const [user, loading] = useAuthState(auth);

  // Utility function for setting up a user
  const formatUser = async (user) => {
    // const token = await user.getIdToken(/* forceRefresh */ true);
    const decodedToken = await user.getIdTokenResult(/*forceRefresh*/ true);
    const { token, expirationTime } = decodedToken;

    // console.log(token);
    return {
      uid: user.uid,
      email: user.email,
      name: user.displayName,
      provider: user.providerData[0].providerId,
      photoUrl: user.photoURL,
      token,
      expirationTime,
      // stripeRole: await getStripeRole(),
    };
  };

  // Run the first time the component is mounted
  useEffect(() => {
    if (user) {
      // Format the user to store it into the DB
     (async () => await formatUser(user))()
     .then((userFormatted) => {

        // Extract everything but and discard the token
        const { token, ...userWithoutToken } = userFormatted;

        // Push the user to the DB
        createUser(userFormatted.uid, userWithoutToken);
     })
    }
  }, [user])

  if (loading) return <Loading />
  if (!user) return <Login />

  // Insert AuthProvider so all pages in the app can use it.
  // This is not really required since we can use firebase hooks
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp
