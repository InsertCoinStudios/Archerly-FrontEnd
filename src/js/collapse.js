var coll = document.getElementsByClassName("collapsible");

for (let i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function () {

    for (let j = 0; j < coll.length; j++) {
      if (j !== i) {
        coll[j].classList.remove("active");
        coll[j].nextElementSibling.style.maxHeight = null;
      }
    }

    this.classList.toggle("active");
    var content = this.nextElementSibling;

    if (content.style.maxHeight) {
      content.style.maxHeight = null; // schließen
    } else {
      content.style.maxHeight = content.scrollHeight + "px"; // öffnen
    }
  });
}
