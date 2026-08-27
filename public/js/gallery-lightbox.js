/**
 * Mugee Gallery Lightbox
 * - Classic dark overlay + centered image
 * - Prev / Next arrows
 * - Close: button, background click, Esc
 * - Mobile: swipe left/right
 */
(function () {
  "use strict";

  let lightbox = null;
  let imgEl = null;
  let counterEl = null;
  let prevBtn = null;
  let nextBtn = null;
  let currentGallery = null;
  let currentIndex = 0;
  let images = [];

  // Touch swipe state
  let touchStartX = 0;
  let touchStartY = 0;
  let touchDeltaX = 0;
  let isSwiping = false;

  function createLightbox() {
    if (lightbox) return;

    lightbox = document.createElement("div");
    lightbox.className = "mugee-lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "图片查看器");
    lightbox.innerHTML = `
      <button type="button" class="mugee-lightbox__close" aria-label="关闭">&times;</button>
      <button type="button" class="mugee-lightbox__nav mugee-lightbox__prev" aria-label="上一张">&#10094;</button>
      <button type="button" class="mugee-lightbox__nav mugee-lightbox__next" aria-label="下一张">&#10095;</button>
      <div class="mugee-lightbox__stage">
        <img class="mugee-lightbox__img" alt="" />
      </div>
      <div class="mugee-lightbox__counter" aria-live="polite"></div>
    `;

    document.body.appendChild(lightbox);

    imgEl = lightbox.querySelector(".mugee-lightbox__img");
    counterEl = lightbox.querySelector(".mugee-lightbox__counter");
    prevBtn = lightbox.querySelector(".mugee-lightbox__prev");
    nextBtn = lightbox.querySelector(".mugee-lightbox__next");
    const closeBtn = lightbox.querySelector(".mugee-lightbox__close");

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      showPrev();
    });
    nextBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      showNext();
    });

    // Click background (not image/stage controls) to close
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) {
        close();
      }
    });

    // Keyboard
    document.addEventListener("keydown", onKeyDown);

    // Touch / swipe
    lightbox.addEventListener("touchstart", onTouchStart, { passive: true });
    lightbox.addEventListener("touchmove", onTouchMove, { passive: false });
    lightbox.addEventListener("touchend", onTouchEnd, { passive: true });
  }

  function onKeyDown(e) {
    if (!lightbox || !lightbox.classList.contains("is-open")) return;

    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      showPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      showNext();
    }
  }

  function onTouchStart(e) {
    if (!e.touches || e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchDeltaX = 0;
    isSwiping = false;
  }

  function onTouchMove(e) {
    if (!e.touches || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;

    // Prefer horizontal swipe; prevent vertical scroll only when clearly horizontal
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isSwiping = true;
      touchDeltaX = dx;
      e.preventDefault(); // stop page scroll while swiping
    }
  }

  function onTouchEnd() {
    if (!isSwiping) return;
    const threshold = 50;
    if (touchDeltaX < -threshold) {
      showNext();
    } else if (touchDeltaX > threshold) {
      showPrev();
    }
    isSwiping = false;
    touchDeltaX = 0;
  }

  function collectImages(galleryEl) {
    const links = galleryEl.querySelectorAll(".gallery-item-link");
    return Array.from(links).map(function (link) {
      return {
        src: link.getAttribute("data-gallery-src") || link.href,
        alt: link.getAttribute("data-gallery-alt") || "",
        index: parseInt(link.getAttribute("data-gallery-index"), 10) || 0,
      };
    });
  }

  function open(galleryEl, startIndex) {
    createLightbox();
    currentGallery = galleryEl;
    images = collectImages(galleryEl);
    if (!images.length) return;

    currentIndex = Math.max(0, Math.min(startIndex, images.length - 1));
    updateImage();
    lightbox.classList.add("is-open");
    document.body.classList.add("mugee-lightbox-open");

    // Focus close button for a11y
    const closeBtn = lightbox.querySelector(".mugee-lightbox__close");
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    document.body.classList.remove("mugee-lightbox-open");
    // Clear src after transition to free memory (optional)
    setTimeout(function () {
      if (!lightbox.classList.contains("is-open") && imgEl) {
        imgEl.removeAttribute("src");
        imgEl.alt = "";
      }
    }, 300);
  }

  function updateImage() {
    if (!images.length || !imgEl) return;
    const item = images[currentIndex];
    imgEl.classList.add("is-loading");

    const temp = new Image();
    temp.onload = function () {
      imgEl.src = item.src;
      imgEl.alt = item.alt || "图片 " + (currentIndex + 1);
      imgEl.classList.remove("is-loading");
    };
    temp.onerror = function () {
      imgEl.src = item.src;
      imgEl.alt = item.alt || "图片加载失败";
      imgEl.classList.remove("is-loading");
    };
    temp.src = item.src;

    if (counterEl) {
      counterEl.textContent = currentIndex + 1 + " / " + images.length;
    }

    if (prevBtn) prevBtn.disabled = currentIndex <= 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= images.length - 1;
  }

  function showPrev() {
    if (currentIndex <= 0) return;
    currentIndex -= 1;
    updateImage();
  }

  function showNext() {
    if (currentIndex >= images.length - 1) return;
    currentIndex += 1;
    updateImage();
  }

  function onGalleryClick(e) {
    const link = e.target.closest(".gallery-item-link");
    if (!link) return;

    const galleryEl = link.closest("[data-gallery]");
    if (!galleryEl) return;

    e.preventDefault();
    e.stopPropagation();

    const index = parseInt(link.getAttribute("data-gallery-index"), 10) || 0;
    open(galleryEl, index);
  }

  function init() {
    // Event delegation for all galleries
    document.addEventListener("click", onGalleryClick);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();