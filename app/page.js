"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, Button, TextField, Stack, Modal, Grid, Paper, Box, Container, InputAdornment, useMediaQuery, Checkbox, FormControlLabel, CircularProgress } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SearchIcon from '@mui/icons-material/Search';
import { signOut } from "firebase/auth";
import { collection, query, doc, setDoc, getDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { firestore, auth } from "@/firebase";
import SignIn from "/app/sign-in";
import NextImage from "next/image";
import Webcam from "react-webcam";
import theme from '/app/theme'; 
import logo from '/public/logo.png'; 
import * as mobilenet from '@tensorflow-models/mobilenet';
import '@tensorflow/tfjs';

const knownFoodItems = [
  'banana', 'apple', 'orange', 'pomegranate', 'tomato', 'potato', 'carrot', 'broccoli', 'cucumber', 'lettuce', 'pasta',
  'spinach', 'grape', 'strawberry', 'blueberry', 'watermelon', 'melon', 'kiwi', 'pineapple', 'mango', 'peach', 'cherry',
  'pear', 'plum', 'apricot', 'avocado', 'asparagus', 'eggplant', 'bell pepper', 'chili pepper', 'corn', 'peas', 'green beans',
  'zucchini', 'squash', 'pumpkin', 'sweet potato', 'onion', 'garlic', 'ginger', 'lemon', 'lime', 'cabbage', 'cauliflower',
  'mushroom', 'radish', 'beetroot', 'lettuce'
].map(item => item.toLowerCase());

const InventoryItem = ({ item, onAdd, onRemove, onEdit }) => (
  <Grid item xs={12} sm={6} md={4} key={item.name}>
    <Paper
      elevation={3}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 2,
        bgcolor: "#fff7e6",
        borderRadius: 2,
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        flexDirection: { xs: 'column', sm: 'row' },
        textAlign: { xs: 'center', sm: 'left' },
      }}
    >
      {item.imageUrl && (
        <NextImage
          src={item.imageUrl}
          alt={item.name}
          width={50}
          height={50}
          style={{ borderRadius: "50%" }}
        />
      )}
      <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
        <Typography variant="body1" sx={{ textTransform: "uppercase", fontWeight: "bold" }}>
          {item.name}
        </Typography>
        <Typography variant="body1">Qty: {item.quantity}</Typography>
      </Box>
      <Box display="flex" gap={1} sx={{ flexDirection: { xs: 'column', sm: 'row' }, mt: { xs: 1, sm: 0 } }}>
        <Button variant="contained" color="primary" onClick={() => onAdd(item.name)} aria-label={`Add ${item.name}`}>
          Add
        </Button>
        <Button
          variant="contained"
          sx={{ backgroundColor: "#E98074", color: "#000000" }}
          onClick={() => onRemove(item.name)}
          aria-label={`Remove ${item.name}`}
        >
          Remove
        </Button>
        <Button variant="contained" onClick={() => onEdit(item.name)} aria-label={`Edit ${item.name}`}>
          Edit
        </Button>
      </Box>
    </Paper>
  </Grid>
);

export default function Home() {
  const isMobile = useMediaQuery('(max-width:600px)');
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [predictionModalOpen, setPredictionModalOpen] = useState(false);
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [editItemName, setEditItemName] = useState("");
  const [currentItem, setCurrentItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [file, setFile] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetchedRecipes, setHasFetchedRecipes] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [selectedPredictions, setSelectedPredictions] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true); // New state for camera type
  const webcamRef = useRef(null); // Reference to the webcam component

  const storage = getStorage();

  const uploadImage = async (file) => {
    if (!file) return "";
    const storageRef = ref(storage, `images/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  };

  const updateInventory = useCallback((snapshot) => {
    const inventoryList = snapshot.docs.map((doc) => ({
      name: doc.id,
      ...doc.data(),
    }));
    setInventory(inventoryList);
    setFilteredInventory(inventoryList);
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(firestore, `users/${user.uid}/inventory`));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        updateInventory(snapshot);
      }, (error) => {
        console.error("Error fetching inventory:", error);
      });
  
      return () => unsubscribe();
    }
  }, [user, updateInventory]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const classifyImage = async (image) => {
    setAnalyzing(true);
    const img = document.createElement('img');
    img.src = image;
    img.onload = async () => {
      try {
        const model = await mobilenet.load();
        let predictions = await model.classify(img);
        console.log(predictions);
  
        // Temporarily remove the filtering to include all predictions
        // predictions = predictions.filter(prediction => knownFoodItems.includes(prediction.className.toLowerCase()));
  
        setPredictions(predictions);
        setPredictionModalOpen(true);
      } catch (error) {
        console.error("Error classifying image:", error);
      } finally {
        setAnalyzing(false);
      }
    };
  };  
  
  const handleUploadImage = async () => {
    if (file && imagePreview) {
      await classifyImage(imagePreview);
      setFile(null);
      setImagePreview(null);
      handleUploadClose();
    }
  };

  const handleAddItem = async () => {
    if (itemName) {
      await addItem(itemName);
      setFile(null);
      setImagePreview(null);
      setItemName("");
      handleClose();
    }
  };

  const handleSelectPrediction = async () => {
    const imageUrl = await uploadImage(file);
    for (const selectedClassName of selectedPredictions) {
      await addItem(selectedClassName, imageUrl);
    }
    setSelectedPredictions([]);
    setPredictionModalOpen(false);
  };

  const handlePredictionChange = (className, isChecked) => {
    setSelectedPredictions((prevSelected) =>
      isChecked ? [...prevSelected, className] : prevSelected.filter((item) => item !== className)
    );
  };

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImagePreview(imageSrc);
    classifyImage(imageSrc);
    setWebcamOpen(false);
  }, [webcamRef]);

  const toggleCamera = () => {
    setIsFrontCamera((prev) => !prev);
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, `users/${user.uid}/inventory`), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity, imageUrl } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);

        if (imageUrl) {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef).catch((error) => {
            console.error("Error deleting image:", error);
          });
        }
      } else {
        await setDoc(docRef, { quantity: quantity - 1 }, { merge: true });
      }
    }
  };

  const addItem = async (itemName, imageUrl = null) => {
    const docRef = doc(collection(firestore, `users/${user.uid}/inventory`), itemName);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1, imageUrl: imageUrl || docSnap.data().imageUrl });
    } else {
      await setDoc(docRef, { quantity: 1, imageUrl });
    }
  };

  const editItem = async (item, newName) => {
    if (item !== newName) {
      const docRef = doc(collection(firestore, `users/${user.uid}/inventory`), item);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const itemData = docSnap.data();
        await setDoc(doc(firestore, `users/${user.uid}/inventory`, newName), itemData);
        await deleteDoc(docRef);
      }
    }
  };

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const debouncedSearch = useCallback(
    debounce((query) => {
      if (query) {
        const filtered = inventory.filter((item) =>
          item.name.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredInventory(filtered);
      } else {
        setFilteredInventory(inventory);
      }
    }, 300),
    [inventory]
  );
  
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleEditOpen = (item) => {
    setCurrentItem(item);
    setEditItemName(item);
    setEditOpen(true);
  };
  const handleEditClose = () => setEditOpen(false);

  const handleUploadOpen = () => setUploadOpen(true);
  const handleUploadClose = () => setUploadOpen(false);

  const handleWebcamOpen = () => setWebcamOpen(true);
  const handleWebcamClose = () => setWebcamOpen(false);

  const handleEditItem = async () => {
    if (currentItem && editItemName) {
      await editItem(currentItem, editItemName);
      setCurrentItem(null);
      setEditItemName("");
      handleEditClose();
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const stripMarkdown = (text) => {
    return text.replace(/\*\*/g, '') 
    .replace(/\*/g, '');  
  };

  const getRecipeSuggestions = async () => {
    const ingredients = inventory.map(item => item.name);
    setIsLoading(true); 
    try {
      console.log("Sending ingredients to API:", ingredients); 
      const response = await fetch('/api/get-recipes', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });
  
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log("Received recipes:", data); 
      const processedRecipes = data.recipes.map(recipe => stripMarkdown(recipe));
      setRecipes(processedRecipes || []);
      setHasFetchedRecipes(true); 
    } catch (error) {
      console.error("Failed to fetch recipe suggestions:", error);
      alert(`Failed to fetch recipe suggestions: ${error.message}`); 
    } finally {
      setIsLoading(false); 
    }
  };

  const generateNewRecipeSuggestions = async () => {
    setRecipes([]); 
    await getRecipeSuggestions(); 
  };
  
  if (!user) {
    return <SignIn />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        sx={{ backgroundColor: "#EAE7DC" }}
      >
        <AppBar position="fixed" sx={{ zIndex: 1201 }}>
          <Toolbar>
            <NextImage src={logo} alt="PantryGenie" width={40} height={40} sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ flexGrow: 1, ml: 2, fontWeight: 'bold' }}>
              PantryGenie
            </Typography>
            <Button
              color="inherit"
              onClick={handleLogout}
              aria-label="Logout"
              sx={{
                bgcolor: "#E98074",
                '&:hover': {
                  bgcolor: "#978873",
                },
                color: "#000000",
                textTransform: "none",
                boxShadow: "0 1.4px 1px 1px rgba(0, 0, 0, 0.2)", 
                borderRadius: 2, 
                padding: "6px 16px", 
              }}
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>
        <Toolbar />
        <Container
          maxWidth="md"
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: 2,
            bgcolor: "transparent",
            p: 2,
            flexGrow: 1,
            mt: 2.4,
          }}
        >
          <TextField
            variant="outlined"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{
              backgroundColor: "white",
              borderRadius: 1,
              width: '100%',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'transparent',
                },
                '&:hover fieldset': {
                  borderColor: 'transparent',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'transparent',
                },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpen}
              startIcon={<AddCircleIcon />}
              sx={{
                bgcolor: "#D8C3A5",
                '&:hover': {
                  backgroundColor: "#978873",
                },
              }}
            >
              Add Item
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUploadOpen}
              startIcon={<AddCircleIcon />}
              sx={{
                bgcolor: "#D8C3A5",
                color: "#000000",
                '&:hover': {
                  backgroundColor: "#978873",
                },
              }}
            >
              Upload Image
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleWebcamOpen}
              startIcon={<AddCircleIcon />}
              sx={{
                bgcolor: "#D8C3A5",
                color: "#000000",
                '&:hover': {
                  backgroundColor: "#978873",
                },
              }}
            >
              Use Camera
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={getRecipeSuggestions}
              disabled={isLoading}
              sx={{
                bgcolor: "#E98074",
                color: "#000000", 
                '&:hover': {
                  backgroundColor: "#978873",
                },
              }}
            >
              {isLoading ? "Generating..." : "Get Recipes"}
            </Button>
          </Box>
          {hasFetchedRecipes && (
            <Button
              variant="contained"
              color="primary"
              onClick={generateNewRecipeSuggestions}
              disabled={isLoading}
              sx={{
                bgcolor: "#E98074",
                color: "#fff",
                '&:hover': {
                  backgroundColor: "#C7B198",
                },
              }}
            >
              {isLoading ? "Generating..." : "Get More Recipes"}
            </Button>
          )}
          {isLoading && (
            <Typography variant="body1" sx={{ mt: 2 }}>
              Generating recipe suggestions...
            </Typography>
          )}
          <Modal open={open} onClose={handleClose}>
            <Box
              position="absolute"
              top="50%"
              left="50%"
              width={isMobile ? '90%' : 400}
              bgcolor="background.paper"
              boxShadow={24}
              p={4}
              display="flex"
              flexDirection="column"
              gap={3}
              sx={{
                transform: "translate(-50%, -50%)",
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" color="#000000">Add Item</Typography>
              <TextField
                label="Item Name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                fullWidth
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddItem}
                sx={{
                  bgcolor: "#E98074",
                  '&:hover': {
                    backgroundColor: "#C7B198",
                  },
                }}
              >
                Add
              </Button>
            </Box>
          </Modal>

          <Modal open={uploadOpen} onClose={handleUploadClose}>
            <Box
              position="absolute"
              top="50%"
              left="50%"
              width={isMobile ? '90%' : 400}
              bgcolor="background.paper"
              boxShadow={24}
              p={4}
              display="flex"
              flexDirection="column"
              gap={3}
              sx={{
                transform: "translate(-50%, -50%)",
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" color="#000000">Upload Image</Typography>
              <input
                accept="image/*"
                type="file"
                onChange={handleFileChange}
                style={{ marginTop: 10 }}
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: 'auto', marginTop: 10 }} />
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={handleUploadImage}
                sx={{
                  bgcolor: "#E98074",
                  '&:hover': {
                    backgroundColor: "#C7B198",
                  },
                }}
              >
                Upload
              </Button>
            </Box>
          </Modal>

          <Modal open={webcamOpen} onClose={handleWebcamClose}>
            <Box
              position="absolute"
              top="50%"
              left="50%"
              width={isMobile ? '90%' : 400}
              bgcolor="background.paper"
              boxShadow={24}
              p={4}
              display="flex"
              flexDirection="column"
              gap={3}
              sx={{
                transform: "translate(-50%, -50%)",
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" color="#000000">Capture Image</Typography>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                videoConstraints={{ facingMode: isFrontCamera ? "user" : "environment" }} // Update facingMode
                onUserMediaError={(error) => console.error("Webcam error:", error)}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={toggleCamera} // Add toggle camera button
                sx={{
                  bgcolor: "#E98074",
                  '&:hover': {
                    backgroundColor: "#C7B198",
                  },
                }}
              >
                {isFrontCamera ? "Switch to Rear Camera" : "Switch to Front Camera"}
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCapture}
                sx={{
                  bgcolor: "#E98074",
                  '&:hover': {
                    backgroundColor: "#C7B198",
                  },
                }}
              >
                Capture
              </Button>
            </Box>
          </Modal>

          <Modal open={editOpen} onClose={handleEditClose}>
            <Box
              position="absolute"
              top="50%"
              left="50%"
              width={isMobile ? '90%' : 400}
              bgcolor="background.paper"
              boxShadow={24}
              p={4}
              display="flex"
              flexDirection="column"
              gap={3}
              sx={{
                transform: "translate(-50%, -50%)",
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" color="primary">Edit Item</Typography>
              <TextField
                label="New Item Name"
                value={editItemName}
                onChange={(e) => setEditItemName(e.target.value)}
                fullWidth
                InputProps={{
                  style: {
                    color: 'black',
                  },
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleEditItem}
                sx={{
                  bgcolor: "#E98074",
                  '&:hover': {
                    backgroundColor: "#C7B198",
                  },
                }}
              >
                Save
              </Button>
            </Box>
          </Modal>

          <Modal open={predictionModalOpen} onClose={() => setPredictionModalOpen(false)}>
            <Box
              position="absolute"
              top="50%"
              left="50%"
              width={isMobile ? '90%' : 400}
              bgcolor="background.paper"
              boxShadow={24}
              p={4}
              display="flex"
              flexDirection="column"
              gap={3}
              sx={{
                transform: "translate(-50%, -50%)",
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" color="#000000">Select Correct Items</Typography>
              {predictions.map((prediction, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={selectedPredictions.includes(prediction.className)}
                      onChange={(e) => handlePredictionChange(prediction.className, e.target.checked)}
                      color="primary"
                    />
                  }
                  label={`${prediction.className} (${(prediction.probability * 100).toFixed(2)}%)`}
                />
              ))}
              <Button
                variant="contained"
                color="primary"
                onClick={handleSelectPrediction}
                sx={{
                  bgcolor: "#E98074",
                  '&:hover': {
                    backgroundColor: "#C7B198",
                  },
                }}
              >
                Confirm Selection
              </Button>
            </Box>
          </Modal>

          {analyzing && (
            <Box display="flex" alignItems="center" mt={2}>
              <CircularProgress size={24} />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Analyzing the image, please wait...
              </Typography>
            </Box>
          )}

          <Box
            sx={{
              width: '100%',
              maxHeight: '600px',
              overflow: 'auto',
              border: '1px solid #ddd',
              borderRadius: '8px',
              p: 2,
            }}
          >
            <Stack width="100%" spacing={2}>
              {filteredInventory.map((item) => (
                <InventoryItem
                  key={item.name}
                  item={item}
                  onAdd={addItem}
                  onRemove={removeItem}
                  onEdit={handleEditOpen}
                />
              ))}
            </Stack>
          </Box>

          <Container
            maxWidth="md"
            sx={{
              mt: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              bgcolor: "transparent",
            }}
          >
            {Array.isArray(recipes) && recipes.map((recipe, index) => (
              <Paper
                key={index}
                elevation={3}
                sx={{
                  p: 2,
                  bgcolor: "#fff7e6",
                  borderRadius: 2,
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                <Typography variant="h6">Recipe Suggestion:</Typography>
                <Typography>{stripMarkdown(recipe)}</Typography>
              </Paper>
            ))}
          </Container>

        </Container>
      </Box>
    </ThemeProvider>
  );
}
