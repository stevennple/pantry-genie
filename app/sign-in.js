"use client";
import { useState } from "react";
import { ThemeProvider, CssBaseline, Box, Button, TextField, Typography, Link } from "@mui/material";
import theme from '/app/theme'; 
import { auth } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import Image from "next/image";
import logo from '/public/logo.png'; 

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // New state for confirm password
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        height="100vh" 
        gap={2} 
        sx={{ backgroundColor: "#EAE7DC", p: 3, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
      >
        <Image src={logo} alt="PantryGenie" width={60} height={60} />
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#E98074' }}>
          {isSignUp ? "Sign Up" : "Sign In"}
        </Typography>
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ width: { xs: "100%", sm: "300px" }, mt: 2 }}
          variant="outlined"
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ width: { xs: "100%", sm: "300px" }, mt: 2 }}
          variant="outlined"
          required
        />
        {isSignUp && (
          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{ width: { xs: "100%", sm: "300px" }, mt: 2 }}
            variant="outlined"
            required
          />
        )}
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        <Button 
          variant="contained" 
          color="primary" 
          onClick={isSignUp ? handleSignUp : handleSignIn}
          sx={{ mt: 2, width: { xs: "100%", sm: "300px" }, bgcolor: "#E98074", '&:hover': { bgcolor: "#d46b63" } }}
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>
        <Link
          component="button"
          variant="body2"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
          sx={{ mt: 2, color: "#E98074", textDecoration: 'underline' }}
        >
          {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
        </Link>
      </Box>
    </ThemeProvider>
  );
}
