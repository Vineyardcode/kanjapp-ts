//react
import { useState } from "react";
import { supabase } from "../config/supabase";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/Home` },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
      setMessage(`We sent a login link to ${email}. Check your inbox.`);
    }
  };

  return (
    <div className="login-main">
      <h3>save your learning progress by signing in</h3>

      {status === "sent" ? (
        <h5>{message}</h5>
      ) : (
        <form onSubmit={sendMagicLink}>
          <input
            type="email"
            value={email}
            required
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={status === "sending"}>
            <h5>{status === "sending" ? "Sending..." : "Send magic link"}</h5>
          </button>
          {status === "error" && <h5>{message}</h5>}
        </form>
      )}
    </div>
  );
};
