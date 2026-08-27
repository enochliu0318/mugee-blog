document.addEventListener("DOMContentLoaded", function () {
  var button = document.getElementById("back-to-top");
  if (!button) return;

  var SHOW_AFTER = 300; // 页面向下滚动超过该像素值后才显示按钮

  var toggleVisibility = function () {
    if (window.scrollY > SHOW_AFTER) {
      button.classList.add("is-visible");
    } else {
      button.classList.remove("is-visible");
    }
  };

  toggleVisibility();
  window.addEventListener("scroll", toggleVisibility, { passive: true });

  button.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
