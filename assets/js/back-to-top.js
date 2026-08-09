document.addEventListener("DOMContentLoaded", function () {
  var button = document.getElementById("back-to-top");
  if (!button) return;

  button.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
