import { useState, useContext, createContext, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import Router from 'next/router';
import { provider } from "../firebase";
import { createUser } from './db';

const authContext = createContext();

// Create a context as a global state "auth" to be available to all children
export function AuthProvider({ children }) {
    // The provider will encapsulate all functionalities for firebase access.
    // In other words, the AuthProvider has an 'auth' object which is
    // the key thing that all the consumers consume 
    const auth = useFirebaseAuth();
    return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}

export const useAuth = () => {
    return useContext(authContext);
};

function useFirebaseAuth() {
    // This is the auth object of the AuthProvider.
    // The key thing auth need to achieve is subscribing 
    // to the changes in the user's login status (and associated user info).
    // These changes can be triggered through the Firebase SDK, 
    // specifically the sign-in / sign-out functions such as
    // GoogleAuthProvider() and onAuthStateChanged()
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Handle a user
    const handleUser = async (rawUser) => {
        if (rawUser) {
            const user = await formatUser(rawUser);
            const { token, ...userWithoutToken } = user;

            createUser(user.uid, userWithoutToken);
            setUser(user);

            // Done with loading the user
            setLoading(false);

            return user;
        } else {
            setUser(false);
            setLoading(false);
            return false;
        }
    };

    // Create new account: email and password
    const createAccount = (email, password, redirect) => {
        setLoading(true);
        return firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then((response) => {
            // Handle the user
            handleUser(response.user);

            if (redirect) {
                Router.push(redirect);
            }
        })
    }

    // Sign in type: email and password
    const signinWithEmail = (email, password, redirect) => {
        setLoading(true);
        return firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .then((response) => {
            // Handle the user
            handleUser(response.user);
            console.log("here")
            console.log(redirect)
            if (redirect) {
                Router.push(redirect);
            }
        })
    }

    // Sign in type: Google account
    const signinWithGoogle = (redirect) => {
        setLoading(true);
        return firebase
        .auth()
        .signInWithPopup(provider)
        .then((response) => {
            // Handle the user
            handleUser(response.user);

            if (redirect) {
                Router.push(redirect);
            }
        })
    }

    // Sign out
    const signOut = () => {
        return firebase
          .auth()
          .signOut()
          .then(() => handleUser(false));
    };

    // useEffect to capture the token refresh events and refresh the user state
    // accordingly with the new access token
    useEffect(() => {
        const unsubscribe = firebase.auth().onIdTokenChanged(handleUser);
        return () => unsubscribe();
    }, []);

    // Need to get a new Token to continue in the session
    const getFreshToken = async () => {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken(false);
          return `${token}`;
        } else {
          return '';
        }
    };

    // Return all functions above,
    // plus information about the user and loading
    return {
        user,
        loading,
        createAccount,
        signinWithEmail,
        // signinWithGitHub,
        // signinWithTwitter,
        signinWithGoogle,
        signOut,
        getFreshToken,
    };
}

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