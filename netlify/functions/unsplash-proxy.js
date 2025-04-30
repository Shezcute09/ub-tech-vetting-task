// Use node-fetch for making HTTP requests in a Node.js environment

const fetch = require("node-fetch");

// The Unsplash base URL
const UNSPLASH_BASE_URL = "https://api.unsplash.com";

// Access The  secret API key from environment variables
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
  const query = queryParams.query || "models";
  const perPage = queryParams.per_page || 3;

  // Construct the target URL for the actual Unsplash API
  const targetURL = `${UNSPLASH_BASE_URL}/search/photos?query=${encodeURIComponent(
    query
  )}&per_page=${perPage}&client_id=${API_KEY}`;

  // console.log(`Proxying request to: ${targetURL}`);

  try {
    const response = await fetch(targetURL, {
      method: "GET",
      headers: {
        "Accept-Version": "v1",
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

    // --- Security Enhancement: Filter Data ---
    const filteredResults = data.results.map((img) => ({
      id: img.id,
      urls: { regular: img.urls.regular },
      alt_description: img.alt_description,
      description: img.description,
    }));
    const responseBody = JSON.stringify({ results: filteredResults });
    // --- End Enhancement ---

    // Return the successful response data (as received from Unsplash)
    // back to client-side JavaScript
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },

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
