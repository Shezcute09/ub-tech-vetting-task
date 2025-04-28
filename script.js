// script.js
// ========== Configuration ==========
const API_KEY = "XtbC1H3JD0jUREu9cYb7tQuPAd4pc2V4r-Pt6SRUMA8";
const BASE_URL = "https://api.unsplash.com";
const SEARCH_QUERIES = {
  female: "female models",
  male: "male models",
};
const PER_PAGE = 3;
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
    if (!imageData) fetchImages(currentQuery);
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
  const slideWidthPercentage = 100 / images.length;
  const offset = -currentImageIndex * slideWidthPercentage;
  sliderTrack.style.transform = `translateX(${offset}%)`;

  if (imageData?.results?.[currentImageIndex]) {
    const current = imageData.results[currentImageIndex];
    cardTitle.textContent = (
      current.description ||
      current.alt_description ||
      "Fashion Model"
    ).toUpperCase();
  }

  updatePagination();
}

// ========== Event Listeners ==========
nextBtn.addEventListener("click", () => {
  stopAutoSlide();
  currentImageIndex = (currentImageIndex + 1) % images.length;
  updateSlider();
  startAutoSlide();
});

prevBtn.addEventListener("click", () => {
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

// ========== Image Loading ==========
async function fetchImages(queryType) {
  if (!navigator.onLine) return;

  try {
    const response = await fetch(
      `${BASE_URL}/search/photos?query=${queryType}&per_page=${PER_PAGE}&client_id=${API_KEY}`
    );

    imageData = await response.json();
    currentQuery = queryType;

    images.forEach((img, index) => {
      if (imageData.results[index]) {
        img.src = imageData.results[index].urls.regular;
        img.alt = imageData.results[index].alt_description || queryType;
      }
    });

    currentImageIndex = 0;
    createPagination();
    updateSlider();
    startAutoSlide();
  } catch (error) {
    handleLoadingError();
  }
}

// ========== Error Handling ==========
function handleLoadingError() {
  stopAutoSlide();
  images.forEach((img) => (img.src = ""));
  cardTitle.textContent = "⚠️ Failed to load images";

  const dotsContainer = document.querySelector(".pagination-dots");
  if (dotsContainer) dotsContainer.remove();

  if (!document.querySelector(".retry-button")) {
    const retryBtn = document.createElement("button");
    retryBtn.className = "retry-button";
    retryBtn.textContent = "Try Again";
    retryBtn.onclick = () => {
      retryBtn.remove();
      fetchImages(currentQuery);
    };
    document.querySelector(".card").appendChild(retryBtn);
  }
}

// ========== Initialization ==========
window.addEventListener("online", handleNetworkStatus);
window.addEventListener("offline", handleNetworkStatus);
handleNetworkStatus();
fetchImages(SEARCH_QUERIES.female);
