// script.js (Modified)

// ========== Configuration ==========
// const API_KEY = "XtbC1H3JD0jUREu9cYb7tQuPAd4pc2V4r-Pt6SRUMA8"; // REMOVE THIS LINE - Key will be on the server
const BASE_URL = "https://api.unsplash.com"; // Keep this if needed elsewhere, or remove if only used in fetch
const SEARCH_QUERIES = {
  female: "female models",
  male: "male models",
};
const PER_PAGE = 3; // We'll pass this to our proxy
const AUTO_SLIDE_INTERVAL = 5000;

// ========== DOM Elements ==========
const cardTitle = document.querySelector(".card-title");
const sliderTrack = document.querySelector("#slider-track");
const images = document.querySelectorAll(".image-slider img");
const [prevBtn, nextBtn] = [
  document.querySelector("#prev-button"),
  document.querySelector("#next-button"),
];

// ========== Global State ==========
let currentImageIndex = 0;
let imageData = null;
let currentQuery = SEARCH_QUERIES.female;
let autoSlideTimer = null;
let dots = [];

// ========== Pagination Functions ==========
function createPagination() {
  // Remove existing pagination if any
  const existingPagination = document.querySelector(".pagination-dots");
  if (existingPagination) existingPagination.remove();

  const paginationContainer = document.createElement("div");
  paginationContainer.className = "pagination-dots";

  dots = [];

  images.forEach((_, index) => {
    const dot = document.createElement("div");
    dot.className = `dot ${index === currentImageIndex ? "active" : ""}`;
    dot.addEventListener("click", () => {
      stopAutoSlide();
      currentImageIndex = index;
      updateSlider();
      startAutoSlide();
    });
    dots.push(dot);
    paginationContainer.appendChild(dot);
  });

  document.querySelector(".image-slider").appendChild(paginationContainer);
}

function updatePagination() {
  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentImageIndex);
  });
}

// ========== Network Detection ==========
function handleNetworkStatus() {
  const isOnline = navigator.onLine;
  document.body.classList.toggle("offline", !isOnline);

  if (isOnline) {
    // Only try fetching if we don't have data OR if the query changed (handle this logic if needed)
    if (!imageData) {
      fetchImages(currentQuery); // Fetch initial images if online and no data yet
    }
    startAutoSlide();
  } else {
    stopAutoSlide();
  }
}

// ========== Auto-Slide Functions ==========
function startAutoSlide() {
  if (!autoSlideTimer) {
    autoSlideTimer = setInterval(() => {
      currentImageIndex = (currentImageIndex + 1) % images.length;
      updateSlider();
    }, AUTO_SLIDE_INTERVAL);
  }
}

function stopAutoSlide() {
  clearInterval(autoSlideTimer);
  autoSlideTimer = null;
}

// ========== Slider Controls ==========
function updateSlider() {
  // Ensure images array has elements before calculating width/offset
  if (images.length === 0) return;

  const slideWidthPercentage = 100 / images.length;
  const offset = -currentImageIndex * slideWidthPercentage;
  sliderTrack.style.transform = `translateX(${offset}%)`;

  // Check if imageData and results exist and the index is valid
  if (imageData?.results?.[currentImageIndex]) {
    const current = imageData.results[currentImageIndex];
    cardTitle.textContent = (
      current.description ||
      current.alt_description ||
      "Fashion Model"
    ).toUpperCase();
  }

  updatePagination(); // Update dots based on the current index
}

// ========== Event Listeners ==========
nextBtn.addEventListener("click", () => {
  if (images.length === 0) return; // Don't slide if no images
  stopAutoSlide();
  currentImageIndex = (currentImageIndex + 1) % images.length;
  updateSlider();
  startAutoSlide();
});

prevBtn.addEventListener("click", () => {
  if (images.length === 0) return; // Don't slide if no images
  stopAutoSlide();
  currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
  updateSlider();
  startAutoSlide();
});

document
  .querySelector(".image-slider")
  .addEventListener("mouseenter", stopAutoSlide);
document
  .querySelector(".image-slider")
  .addEventListener("mouseleave", startAutoSlide);

// ========== Image Loading (MODIFIED) ==========
async function fetchImages(queryType) {
  if (!navigator.onLine) return;

  // Construct the URL for your proxy function, passing parameters
  const proxyUrl = `/.netlify/functions/unsplash-proxy?query=${encodeURIComponent(
    queryType
  )}&per_page=${PER_PAGE}`;
  // Note: Using encodeURIComponent for the query is good practice

  try {
    // Fetch from your proxy endpoint INSTEAD of api.unsplash.com
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      // Handle errors returned specifically from your proxy function
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText })); // Try to get JSON error, fallback to status text
      throw new Error(
        `Proxy Error (${response.status}): ${
          errorData.error || errorData.message || "Unknown error"
        }`
      );
    }

    imageData = await response.json(); // This is the data forwarded by your proxy

    // Check if results exist and have the expected length
    if (!imageData || !imageData.results || imageData.results.length === 0) {
      console.warn("No image results received from proxy.");
      handleLoadingError("No images found for this query."); // Pass specific message
      return; // Stop processing if no results
    }

    // Ensure we only try to update images that exist in the HTML
    const numImagesToUpdate = Math.min(images.length, imageData.results.length);

    images.forEach((img, index) => {
      if (index < numImagesToUpdate) {
        img.src = imageData.results[index].urls.regular;
        img.alt = imageData.results[index].alt_description || queryType;
      } else {
        // Optional: Clear or hide unused image elements if API returns fewer than expected
        img.src = "";
        img.alt = "";
      }
    });

    currentImageIndex = 0;
    currentQuery = queryType; // Update current query state

    createPagination(); // Recreate pagination based on the actual number of loaded images (or fixed number)
    updateSlider();
    startAutoSlide();

    // Remove potential retry button if fetch was successful
    const retryBtn = document.querySelector(".retry-button");
    if (retryBtn) retryBtn.remove();
  } catch (error) {
    console.error("Error in fetchImages:", error);
    handleLoadingError(error.message); // Pass error message for display
  }
}

// ========== Error Handling ==========
function handleLoadingError(errorMessage = "Failed to load images") {
  stopAutoSlide();
  images.forEach((img) => {
    img.src = ""; // Clear potentially broken images
    img.alt = "";
  });
  cardTitle.textContent = `⚠️ ${errorMessage}`; // Show the specific error

  const dotsContainer = document.querySelector(".pagination-dots");
  if (dotsContainer) dotsContainer.remove();

  if (!document.querySelector(".retry-button")) {
    const retryBtn = document.createElement("button");
    retryBtn.className = "retry-button";
    retryBtn.textContent = "Try Again";
    retryBtn.onclick = () => {
      retryBtn.remove(); // Remove button on click
      cardTitle.textContent = "Loading..."; // Give feedback
      fetchImages(currentQuery); // Retry with the last used query
    };
    // Append to .card or a more specific error message container
    document.querySelector(".card").appendChild(retryBtn);
  }
}

// ========== Initialization ==========
window.addEventListener("online", handleNetworkStatus);
window.addEventListener("offline", handleNetworkStatus);
// Initial setup
document.addEventListener("DOMContentLoaded", () => {
  handleNetworkStatus(); // Check network and potentially fetch initial images
});
// Fetch initial images on load
