import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { ingredients } = req.body;
    const prompt = `Suggest a recipe using the following ingredients: ${ingredients.join(', ')}.`;

    try {
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          { role: 'user', content: prompt },
        ],
      }, {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      res.status(200).json(response.data.choices[0].message.content);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
