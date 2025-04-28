// script.js
let globalData = null;
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
  : [];
const sliderTrackElement = document.querySelector("#slider-track");
const prevButtonElement = document.querySelector("#prev-button");
const nextButtonElement = document.querySelector("#next-button");

// State variables
let currentIndex = 0;
const totalImages = imageElements.length;

function updateNetworkStatus() {
  const isOnline = navigator.onLine;
  document.body.classList.toggle("offline", !isOnline);

  if (isOnline) {
    globalData = null;
    currentIndex = 0;
    fetchImages(searchQueryFemale);
  }
}

// Initial check
updateNetworkStatus();

// Event listeners
window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);

function updateSliderPosition() {
  const offset = -currentIndex * (100 / totalImages);
  sliderTrackElement.style.transform = `translateX(${offset}%)`;

  if (globalData?.results?.[currentIndex]) {
    const currentImageData = globalData.results[currentIndex];
    const titleText =
      currentImageData.description ||
      currentImageData.alt_description ||
      "My Models";
    cardTitleElement.textContent = titleText.toUpperCase();
  } else {
    cardTitleElement.textContent = "MY MODELS"; // Fallback title
  }
}

nextButtonElement.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % totalImages;
  updateSliderPosition();
});

prevButtonElement.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + totalImages) % totalImages;
  updateSliderPosition();
});

function fetchImages(query) {
  if (!navigator.onLine) {
    console.log("Skipping fetch - offline");
    return;
  }

  const apiUrl = `${baseUrl}${searchEndpoint}?query=${query}&per_page=${perPage}&client_id=${apiKey}`;

  fetch(apiUrl)
    .then((response) => {
      if (response.ok) {
        return response.json().then((data) => {
          globalData = data;
          console.log("Data from Unsplash API:", data);

          // --- Start of changes ---
          if (data?.results?.length > 0) {
            data.results.forEach((imageData, index) => {
              if (index < imageElements.length) {
                const imageUrl = imageData.urls.regular;
                const altText = imageData.alt_description || query;
                imageElements[index].src = imageUrl;
                imageElements[index].alt = altText;

                if (index === 0) {
                  imageElements[index].classList.add("active");
                } else {
                  imageElements[index].classList.remove("active");
                }
              }
            });

            // Reset to first image and update title
            currentIndex = 0; // Add this line
            updateSliderPosition(); // Uncommented this line
          }
          // --- End of changes ---
          else {
            cardTitleElement.textContent = "No images found for this query.";
            imageElements.forEach((img) => {
              img.src = "";
              img.alt = "No image found";
              img.classList.remove("active");
            });
          }
        });
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    })
    .catch((error) => {
      console.error("Error fetching images:", error);
      imageElements.forEach((img) => {
        img.alt = "Image failed to load";
        img.classList.remove("active");
      });

      if (cardTitleElement) {
        cardTitleElement.textContent =
          "⚠️ Failed to load images. Check your connection!";
      }

      if (!document.querySelector(".retry-button")) {
        const retryButton = document.createElement("button");
        retryButton.textContent = "Retry";
        retryButton.classList.add("retry-button");
        retryButton.onclick = () => {
          retryButton.remove();
          fetchImages(searchQueryFemale);
        };
        document.querySelector(".card").appendChild(retryButton);
      }
    });
}

// Remove the initial updateSliderPosition() call from here
fetchImages(searchQueryFemale);

// You can later call it again for male models or other queries
// fetchImages(searchQueryMale);
