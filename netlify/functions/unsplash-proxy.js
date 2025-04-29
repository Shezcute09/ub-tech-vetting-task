// netlify/functions/unsplash-proxy.js

// Use node-fetch for making HTTP requests in a Node.js environment
// If your serverless provider runtime has built-in fetch (like newer Node versions or Deno/Cloudflare Workers),
// you might not need to install/require this. Check your provider's docs.
// If needed: run `npm install node-fetch` in your project root.
const fetch = require("node-fetch");

// The Unsplash base URL
const UNSPLASH_BASE_URL = "https://api.unsplash.com";

// Access your secret API key from environment variables
// IMPORTANT: Set this in your Netlify Site settings > Build & deploy > Environment variables
const API_KEY = process.env.UNSPLASH_ACCESS_KEY;

exports.handler = async function (event, context) {
  // Check if the API key is configured on the server
  if (!API_KEY) {
    console.error("Unsplash API key is not set in environment variables.");
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Server configuration error: API key missing.",
      }),
    };
  }

  // Get query parameters passed from the client-side fetch
  const queryParams = event.queryStringParameters;
  const query = queryParams.query || "models"; // Default query if none provided
  const perPage = queryParams.per_page || 3; // Default per_page if none provided

  // Construct the target URL for the actual Unsplash API
  const targetURL = `${UNSPLASH_BASE_URL}/search/photos?query=${encodeURIComponent(
    query
  )}&per_page=${perPage}&client_id=${API_KEY}`;

  console.log(`Proxying request to: ${targetURL}`); // Log for debugging (optional)

  try {
    const response = await fetch(targetURL, {
      method: "GET",
      headers: {
        // Unsplash API often requires this version header
        "Accept-Version": "v1",
        // Add any other headers Unsplash might require
      },
    });

    // Check if the request to Unsplash failed
    if (!response.ok) {
      console.error(
        `Unsplash API Error: ${response.status} ${response.statusText}`
      );
      // Try to forward Unsplash's error message if possible
      const errorBody = await response.text(); // Get raw error text
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        // Try to parse errorBody as JSON, otherwise return raw text
        body: JSON.stringify({
          error: `Unsplash API Error: ${response.statusText}`,
          details: errorBody,
        }),
      };
    }

    // Get the JSON data from Unsplash
    const data = await response.json();

    // --- Optional Security Enhancement: Filter Data ---
    // You might only want to return specific fields to the client,
    // reducing the amount of data transferred and potentially hiding
    // sensitive info Unsplash might include in the future.

    const filteredResults = data.results.map((img) => ({
      id: img.id,
      urls: { regular: img.urls.regular },
      alt_description: img.alt_description,
      description: img.description,
    }));
    const responseBody = JSON.stringify({ results: filteredResults });
    // --- End Optional Enhancement ---

    // Return the successful response data (as received from Unsplash)
    // back to your client-side JavaScript
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // IMPORTANT for security: Restrict who can call this function
        // Adjust '*' to your specific domain in production
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      // If using the optional filtering:
      body: responseBody,
    };
  } catch (error) {
    console.error("Error in proxy function:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Internal Server Error in proxy function.",
        details: error.message,
      }),
    };
  }
};
