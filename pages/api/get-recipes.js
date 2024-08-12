import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure the API key is loaded from environment variables
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in the environment variables.");
  throw new Error("GEMINI_API_KEY is missing. Please set it in your environment variables.");
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(apiKey);

// Define the model configuration
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// API route handler
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { ingredients } = req.body;

    // Validate the request body
    if (!ingredients || !Array.isArray(ingredients)) {
      console.error("Invalid request: 'ingredients' must be an array.");
      return res.status(400).json({ error: "Invalid request: 'ingredients' must be an array." });
    }

    const prompt = `Suggest a recipe using the following ingredients: ${ingredients.join(', ')}.`;
    console.log("Prompt:", prompt);

    try {
      // Start a chat session with the model
      const chatSession = model.startChat({
        generationConfig,
        history: [],
      });

      // Send the prompt to the model and get the response
      const result = await chatSession.sendMessage(prompt);
      const responseText = await result.response.text();
      console.log("API Response:", responseText);

      // Validate the response and send it back to the client
      if (responseText) {
        res.status(200).json({ recipes: [responseText] });
      } else {
        console.error("Invalid response from the Gemini API.");
        res.status(500).json({ error: "Invalid response from the Gemini API." });
      }
    } catch (error) {
      console.error("Error fetching from Gemini API:", error.message);
      res.status(500).json({ error: `Error fetching from Gemini API: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
