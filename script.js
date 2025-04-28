// script.js
// ========== Configuration ==========
const API_KEY = "XtbC1H3JD0jUREu9cYb7tQuPAd4pc2V4r-Pt6SRUMA8";
const BASE_URL = "https://api.unsplash.com";
const SEARCH_QUERIES = {
  female: "female models",
  male: "male models",
};
const PER_PAGE = 3;

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
let currentQuery = SEARCH_QUERIES.female; // Default to female

// ========== Network Detection ==========
function handleNetworkStatus() {
  const isOnline = navigator.onLine;
  document.body.classList.toggle("offline", !isOnline);

  if (isOnline && !imageData) {
    fetchImages(currentQuery);
  }
}

window.addEventListener("online", handleNetworkStatus);
window.addEventListener("offline", handleNetworkStatus);

// ========== Slider Controls ==========
function updateSlider() {
  const slideWidthPercentage = 100 / images.length;
  const offset = -currentImageIndex * slideWidthPercentage;
  // Apply the translation
  sliderTrack.style.transform = `translateX(${offset}%)`; // Add % sign here

  if (imageData?.results?.[currentImageIndex]) {
    const current = imageData.results[currentImageIndex];
    cardTitle.textContent = (
      current.description ||
      current.alt_description ||
      "Fashion Model"
    ).toUpperCase();
  }
}

nextBtn.addEventListener("click", () => {
  currentImageIndex = (currentImageIndex + 1) % images.length;
  updateSlider();
});

prevBtn.addEventListener("click", () => {
  currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
  updateSlider();
});

// ========== Image Loading ==========
async function fetchImages(queryType) {
  if (!navigator.onLine) return;

  try {
    const response = await fetch(
      `${BASE_URL}/search/photos?query=${queryType}&per_page=${PER_PAGE}&client_id=${API_KEY}`
    );

    imageData = await response.json();
    currentQuery = queryType; // Store active query

    images.forEach((img, index) => {
      if (imageData.results[index]) {
        img.src = imageData.results[index].urls.regular;
        img.alt = imageData.results[index].alt_description || queryType;
      }
    });

    currentImageIndex = 0;
    updateSlider();
  } catch (error) {
    handleLoadingError();
  }
}

// ========== Error Handling ==========
function handleLoadingError() {
  images.forEach((img) => (img.src = ""));
  cardTitle.textContent = "⚠️ Failed to load images";

  if (!document.querySelector(".retry-button")) {
    const retryBtn = document.createElement("button");
    retryBtn.className = "retry-button";
    retryBtn.textContent = "Try Again";
    retryBtn.onclick = () => {
      retryBtn.remove();
      fetchImages(currentQuery); // Retry with last used query
    };
    document.querySelector(".card").appendChild(retryBtn);
  }
}

// ========== Initialization ==========
handleNetworkStatus();
fetchImages(SEARCH_QUERIES.female); // Initial load

// ========== Public API ==========
// To switch to male models later:
// fetchImages(SEARCH_QUERIES.male);
