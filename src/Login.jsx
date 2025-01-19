import {GoogleLogin, GoogleOAuthProvider} from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode';
import { useState, useEffect } from 'react';

function Login(){
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(()=>{
            
        if(localStorage.getItem("email")){
            setLoggedIn(true);
        }

    })

    const onSuccess = (res) =>{
        const decodedCred = jwtDecode(res.credential);
        console.log("Logged in successfully", decodedCred.name);
        localStorage.setItem("email", decodedCred.email);
        localStorage.setItem("username", decodedCred.name);
        window.location.reload(false);
    }

    const onError = (res) => {
        console.log("Log in failed", res);
    }
    return(
        <GoogleOAuthProvider>
            <div className="mt-6">
                {loggedIn ? <></>:<GoogleLogin
                    client_id={clientId}
                    ButtonText= "Login"
                    onSuccess={onSuccess}
                    onError={onError}
                    cookiePolicy={'single_host_origin'}
                    isSignedIn={true}/>}
            </div>
        </GoogleOAuthProvider>
    );
}

export default Login