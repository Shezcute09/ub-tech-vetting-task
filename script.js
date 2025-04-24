// script.js
let globalData = null; // Add this line
const apiKey = "XtbC1H3JD0jUREu9cYb7tQuPAd4pc2V4r-Pt6SRUMA8";
const baseUrl = "https://api.unsplash.com";
const searchEndpoint = "/search/photos";
const searchQueryFemale = "female models";
const searchQueryMale = "male models";
const perPage = 3;

const cardTitleElement = document.querySelector(".card-title");
const imageSliderContainer = document.querySelector(".image-slider");
const imageElements = imageSliderContainer
  ? imageSliderContainer.querySelectorAll("img")
  : []; // Get all <img> inside .image-slider
const sliderTrackElement = document.querySelector("#slider-track");
const prevButtonElement = document.querySelector("#prev-button");
const nextButtonElement = document.querySelector("#next-button");

// State variables for the slider
let currentIndex = 0; // Keeps track of the index (0, 1, 2...) of the image currently shown. Starts at 0 (the first image). Use 'let' because this will change.
const totalImages = imageElements.length; // Stores the total number of images we found earlier. Use 'const' assuming this doesn't change after page load.

function updateSliderPosition() {
  // Calculating how far to move the track (negative % because I am sliding left)
  const offset = -currentIndex * (100 / totalImages);
  sliderTrackElement.style.transform = `translateX(${offset}%)`;

  // Update the title with the current image's data;
  if (globalData && globalData.results) {
    const currentImageData = globalData.results[currentIndex];
    const titleText =
      currentImageData.description ||
      currentImageData.alt_description ||
      "My Models";
    cardTitleElement.textContent = titleText;
  }
}
updateSliderPosition();

nextButtonElement.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % totalImages;
  updateSliderPosition();
});

prevButtonElement.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + totalImages) % totalImages;
  updateSliderPosition();
});

function fetchImages(query) {
  const apiUrl = `${baseUrl}${searchEndpoint}?query=${query}&per_page=${perPage}&client_id=${apiKey}`;

  fetch(apiUrl)
    .then((response) => {
      if (response.ok) {
        return response.json().then((data) => {
          globalData = data; // Store the data in the global variable
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

            //  updating the HTML element's text
            if (cardTitleElement) {
              // Check if the element exists before using it
              cardTitleElement.textContent = titleText; // <<< ADD THIS LINE
            }
            // --- 2. Updating the Images ---
            data.results.forEach((imageData, index) => {
              if (index < imageElements.length) {
                const imageUrl = imageData.urls.regular;
                const altText = imageData.alt_description || titleText || query; // Use the alt text of the image or fallback to the title text or query

                // Accessing the specific <img> element from our 'imageElements' list using its index.
                //I set its 'src' attribute to the URL we just got. This makes the browser load the image.
                imageElements[index].src = imageUrl;
                // I Set its 'alt' attribute to the alt text we determined.
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
