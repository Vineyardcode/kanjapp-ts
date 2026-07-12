import { Link } from "react-router-dom";
import { supabase } from "../config/supabase";
import { useSession } from "../hooks/useSession";

export const Navbar = () => {
  const session = useSession();

  const signUserOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="navbar">
      <div className="links">
        <Link to="/"><h5>Learn</h5></Link>
        <Link to="/Test"><h5>Test</h5></Link>
        <Link to="/Home"><h5>Home</h5></Link>
        {session ? (
          <button onClick={signUserOut}><h5>Log Out</h5></button>
        ) : (
          <Link to="/Login"><h5>Login</h5></Link>
        )}
      </div>

      {session && (
        <div className="user">
          <p>{session.user.email}</p>
        </div>
      )}
    </div>
  );
};
