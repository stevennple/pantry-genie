import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { ingredients } = req.body;

    if (!ingredients || !Array.isArray(ingredients)) {
      console.error("Invalid request: 'ingredients' must be an array.");
      return res.status(400).json({ error: "Invalid request: 'ingredients' must be an array." });
    }

    const prompt = `Suggest a recipe using the following ingredients: ${ingredients.join(', ')}.`;
    console.log("Prompt:", prompt);

    try {
      const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          { role: 'user', content: prompt },
        ],
      }, {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("API Response:", response.data);

      if (response.data && response.data.choices && response.data.choices[0]) {
        res.status(200).json({ recipes: response.data.choices[0].message.content });
      } else {
        console.error("Invalid response from the OpenRouter API.");
        res.status(500).json({ error: "Invalid response from the OpenRouter API." });
      }
    } catch (error) {
      console.error("Error fetching from OpenRouter API:", error.message);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
