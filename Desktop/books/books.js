const openBtn = document.getElementById("sellbut");
const closeBtn= document.getElementById("cancel");
const sell = document.getElementById("sellingpop");
const cancelBtn = document.getElementById("cancel");

openBtn.addEventListener("click",() => {
    sell.classList.add("open");
})
closeBtn.addEventListener("click",() => {
    sell.classList.remove("open");
})
const overlay = document.getElementById("overlay");

openBtn.addEventListener("click", () => {
    sell.classList.add("open");
    overlay.classList.add("active");
});

closeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    sell.classList.remove("open");
    overlay.classList.remove("active");
});

cancelBtn.addEventListener("click", (e) => {
    e.preventDefault();
    sell.classList.remove("open");
    overlay.classList.remove("active");
});

//filterpopup
const OPENBtn = document.getElementById("filter");
const CLOSEBtn= document.getElementById("clearfilter");
const FILTER = document.getElementById("filterpop");
const cancellBtn = document.getElementById("clearfilter");

OPENBtn.addEventListener("click",() => {
    FILTER.classList.add("open");
})
CLOSEBtn.addEventListener("click",() => {
    FILTER.classList.remove("open");
})
const Overlay = document.getElementById("overlay");

OPENBtn.addEventListener("click", () => {
    FILTER.classList.add("open");
    Overlay.classList.add("active");
});

CLOSEBtn.addEventListener("click", (e) => {
    e.preventDefault();
    FILTER.classList.remove("open");
    Overlay.classList.remove("active");
});

cancellBtn.addEventListener("click", (e) => {
    e.preventDefault();
    FILTER.classList.remove("open");
    Overlay.classList.remove("active");
});

//attach image 
let imageDataURL = ""; 

// When an image is selected
document.getElementById('imageInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imageDataURL = e.target.result; 
            console.log("Image loaded");
        };
        reader.readAsDataURL(file);
    }
});

//ADD CARD FUNCTION
const form = document.getElementById("enterinfos");
const container = document.getElementById("newcont");

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const price = document.getElementById("price").value;
  const title = document.getElementById("title").value;
  const author = document.getElementById("author").value;
  const descrip = document.getElementById("descrip").value;
  const category = document.getElementById("category").value;

  addCard(name, price,title,author,descrip,imageDataURL,category);

  // Clear input fields
  form.reset();
  imageDataURL = ""; 
});

function addCard(itemName, itemPrice, itemTitle, itemAuthor, itemDescrip, imgSrc) {
    const card = document.createElement("div");
    card.className = "card";
  
    card.innerHTML = `
     <div class="flip-card" data-category="${category}">
      <div class="flip-card-inner">
      <div class="flip-card-front">
       ${imgSrc ? `<img src="${imgSrc}" alt="Attached Image" style="width:100%; height:80%; border-radius:5px;object-fit: cover;">` : ''}
       <h3> ${itemTitle}</h3>
       </div>
      <div class="flip-card-back">
      <p><strong>Price:</strong> $${itemPrice}</p>
      <p><strong>Title:</strong> ${itemName}</p>
      <p><strong>Author:</strong> ${itemAuthor}</p>
      <p><strong>Field:</strong> ${category}</p>
      <p><strong>Description:</strong> ${itemDescrip}</p>
      </div>
      </div>
     </div>
    `;
  
    container.prepend(card);
  }
//filtering logic 
const applyBtn = document.getElementById("apply");
const checkboxes = document.querySelectorAll(".category-filter");

applyBtn.addEventListener("click", () => {
  // Get all checked categories
  const selectedCategories = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

    const itemCards = document.querySelectorAll(".flip-card");

  itemCards.forEach(card => {
    const cardCategory = card.getAttribute("data-category");

    // Show matching cards or all if none selected
    if (selectedCategories.length === 0 || selectedCategories.includes(cardCategory)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
  FILTER.classList.remove("open");
overlay.classList.remove("active");
}); 

