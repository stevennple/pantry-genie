"use client";
import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, Button, TextField, Stack, Modal, Grid, Paper, Box, IconButton, Container, InputAdornment, useMediaQuery } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SearchIcon from '@mui/icons-material/Search';
import { signOut } from "firebase/auth";
import { collection, getDocs, query, doc, setDoc, getDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { firestore, auth } from "@/firebase";
import SignIn from "/app/sign-in";
import Image from "next/image";
import theme from '/app/theme'; 
import logo from '/public/logo.png'; 

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
        <Image
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
          sx={{ backgroundColor: "#E98074", color: "#fff" }}
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
  const [itemName, setItemName] = useState("");
  const [editItemName, setEditItemName] = useState("");
  const [currentItem, setCurrentItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [file, setFile] = useState(null);
  const [recipes, setRecipes] = useState([]); // State for recipes

  const storage = getStorage();

  const uploadImage = async (file) => {
    if (!file) return "";
    const storageRef = ref(storage, `images/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  };

  const updateInventory = useCallback(async () => {
    if (user) {
      try {
        const snapshot = await getDocs(query(collection(firestore, `users/${user.uid}/inventory`)));
        const inventoryList = snapshot.docs.map((doc) => ({
          name: doc.id,
          ...doc.data(),
        }));
        setInventory(inventoryList);
        setFilteredInventory(inventoryList);
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    }
  }, [user]);

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
      updateInventory();
    }
  };

  const addItem = async (item, file) => {
    const docRef = doc(collection(firestore, `users/${user.uid}/inventory`), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity, imageUrl } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1, imageUrl: imageUrl });
    } else {
      let imageUrl = await uploadImage(file);
      await setDoc(docRef, { quantity: 1, imageUrl });
    }
    updateInventory();
  };

  const editItem = async (item, newName) => {
    if (item !== newName) {
      const docRef = doc(collection(firestore, `users/${user.uid}/inventory`), item);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const itemData = docSnap.data();
        await setDoc(doc(firestore, `users/${user.uid}/inventory`, newName), itemData);
        await deleteDoc(docRef);
        updateInventory();
      }
    }
  };

  useEffect(() => {
    updateInventory();
  }, [user, updateInventory]);

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
    }, 300),  // 300ms debounce
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

  const handleAddItem = async () => {
    if (itemName) {
      await addItem(itemName, file);
      setFile(null);
      setItemName("");
      handleClose();
    }
  };

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

  const getRecipeSuggestions = async () => {
    const ingredients = inventory.map(item => item.name);
    try {
      const response = await fetch('/api/get-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });
      const data = await response.json();
      setRecipes(data); // Set the recipe suggestions
    } catch (error) {
      console.error(error);
    }
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
            <Image src={logo} alt="PantryGenie" width={40} height={40} sx={{ mr: 1 }} />
            {!isMobile && (
              <Typography variant="h6" sx={{ flexGrow: 1, ml: 1, fontWeight: 'bold' }}>
                PantryGenie
              </Typography>
            )}
            <Box sx={{ flexGrow: 1.8, display: 'flex' }}>
              <TextField
                variant="outlined"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{
                  backgroundColor: "white",
                  borderRadius: 1,
                  width: { xs: '100%', sm: '50%' },
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
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Button color="inherit" onClick={handleLogout} aria-label="Logout">
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
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpen}
            startIcon={<AddCircleIcon />}
            sx={{
              bgcolor: "#D8C3A5",
              '&:hover': {
                bgcolor: "#d46b63",
              },
            }}
          >
            Add Item
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={getRecipeSuggestions}
            sx={{
              bgcolor: "#E98074",
              '&:hover': {
                bgcolor: "#d46b63",
              },
            }}
          >
            Get Recipe Suggestions
          </Button>
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
              <input
                accept="image/*"
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ marginTop: 10 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddItem}
                sx={{
                  bgcolor: "#E98074",
                  '&:hover': {
                    bgcolor: "#d46b63",
                  },
                }}
              >
                Add
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
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleEditItem}
                sx={{
                  bgcolor: "#E98074",
                  '&:hover': {
                    bgcolor: "#d46b63",
                  },
                }}
              >
                Save
              </Button>
            </Box>
          </Modal>

          <Stack width="100%" height="auto" spacing={2} overflow="auto">
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
            {recipes && recipes.map((recipe, index) => (
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
                <Typography>{recipe}</Typography>
              </Paper>
            ))}
          </Container>

        </Container>
      </Box>
    </ThemeProvider>
  );
}
