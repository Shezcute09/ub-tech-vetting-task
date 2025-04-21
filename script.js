// script.js

const apiKey = "XtbC1H3JD0jUREu9cYb7tQuPAd4pc2V4r-Pt6SRUMA8"; // Replace with your actual Unsplash API key
const baseUrl = "https://api.unsplash.com";
const searchEndpoint = "/search/photos";
const searchQueryFemale = "female models";
const searchQueryMale = "male models";
const perPage = 3;

const cardTitleElement = document.querySelector(".card-title");
const imageSliderContainer = document.querySelector(".image-slider"); // The container for images
const imageElements = imageSliderContainer
  ? imageSliderContainer.querySelectorAll("img")
  : []; // Get all <img> inside .image-slider

function fetchImages(query) {
  const apiUrl = `${baseUrl}${searchEndpoint}?query=${query}&per_page=${perPage}&client_id=${apiKey}`;

  fetch(apiUrl)
    .then((response) => {
      if (response.ok) {
        return response.json().then((data) => {
          console.log("Data from Unsplash API:", data);
          // We'll process the data here to get image URLs

          if (!cardTitleElement) {
            console.error("Could not find element with class 'card-title'");
          }
          if (!imageSliderContainer) {
            console.error("Could not find element with class 'image-slider'");
          }
          if (imageElements.length === 0 && imageSliderContainer) {
            console.warn(
              "Could not find any 'img' elements inside '.image-slider'"
            );
          }

          // --- Processing the Data if Results Exist ---
          if (data && data.results && data.results.length > 0) {
            // --- 1. Update the Card Title ---
            const firstImage = data.results[0];
            const titleText = firstImage.alt_description || query; // Use the alt text of the first image or fallback to the query

            // Actually update the HTML element's text
            if (cardTitleElement) {
              // Check if the element exists before using it
              cardTitleElement.textContent = titleText; // <<< ADD THIS LINE
            }
            // --- 2. Updating the Images ---
            data.results.forEach((imageData, index) => {
              if (index < imageElements.length) {
                const imageUrl = imageData.urls.regular;
                const altText = imageData.alt_description || titleText || query; // Use the alt text of the image or fallback to the title text or query

                // Access the specific <img> element from our 'imageElements' list using its index.
                // Set its 'src' attribute to the URL we just got. This makes the browser load the image.
                imageElements[index].src = imageUrl;
                // Set its 'alt' attribute to the alt text we determined.
                imageElements[index].alt = altText;

                // --- TEMPORARY STYLING LOGIC ---
                if (index === 0) {
                  // If it's the first image (index is 0), add the 'active' class.
                  imageElements[index].classList.add("active");
                } else {
                  // For all other images, remove the 'active' class (making them opacity: 0).
                  imageElements[index].classList.remove("active");
                }
                // --- END TEMPORARY ---
              }
            }); // End of the forEach loop
            console.log("Card title and images updated successfully!");
          } else {
            // --- Handle No Results Found ---
            // This 'else' block runs if 'data.results' was empty or didn't exist.
            console.log("No results found for query:", query);
            // Update the title to tell the user no images were found.
            cardTitleElement.textContent = "No images found for this query.";
            // Clear out any previous images or placeholders in the slider.
            imageElements.forEach((img) => {
              img.src = ""; // Set src to empty
              img.alt = "No image found"; // Update alt text
              img.classList.remove("active"); // Ensure it's not visible
            });
          }
        }); // This marks the end of the .then((data) => { ... }) block
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    })

    .catch((error) => {
      console.error("Error fetching images:", error);
    });
}

// Call the function to fetch images (initially for female models)
fetchImages(searchQueryFemale);

// You can later call it again for male models or other queries
// fetchImages(searchQueryMale);
