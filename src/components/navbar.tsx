import { Link } from "react-router-dom";
import { auth } from "../config/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";

export const Navbar = () => {
  
  const [user] = useAuthState(auth);

  const signUserOut = async () => {
    await signOut(auth);
  };

  return (
    <div className="navbar">
      <div className="links">
        <Link to="/"><h5>Learn</h5></Link>
        <Link to="/Test"><h5>Test</h5></Link> 
        <Link to="/Home"><h5>Home</h5></Link>    
        <Link to="/Login"><h5>Login</h5></Link>
      </div>
    {user && (
      <div className="user">
        
          <>
            <p> {user?.displayName} </p>
            <img src={user?.photoURL || ""} width="20" height="20" />
            <button onClick={signUserOut}> Log Out</button>
          </>
        
      </div>
      )}
    </div>
  );
};