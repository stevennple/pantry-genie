"use client";
import { useState } from "react";
import { ThemeProvider, CssBaseline, Box, Button, TextField, Typography, Link, CircularProgress } from "@mui/material";
import theme from '/app/theme'; 
import { auth } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import Image from "next/image";
import logo from '/public/logo.png'; 

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignUp) {
      handleSignUp();
    } else {
      handleSignIn();
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
        component="form"
        onSubmit={handleSubmit}
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
          type="email"
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
          type="submit"
          sx={{ mt: 2, width: { xs: "100%", sm: "300px" }, bgcolor: "#E98074", '&:hover': { bgcolor: "#d46b63" } }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : isSignUp ? "Sign Up" : "Sign In"}
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
