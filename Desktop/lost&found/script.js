const popup = document.getElementById("popup");
const sellBtn = document.getElementById("sellbut");
const cancelBtn = document.getElementById("cancel");

// Show popup when "Post" button is clicked
sellBtn.addEventListener("click", () => {
  popup.classList.add("active");
});

// Hide popup when "Cancel" is clicked
cancelBtn.addEventListener("click", (e) => {
  e.preventDefault(); 
  popup.classList.remove("active");
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
// add post

const form = document.getElementById("form");
const container = document.getElementById("newcont");

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const object = document.getElementById("inobject").value;
  const email = document.getElementById("inemail").value;
  const place = document.getElementById("inplace").value;


  addCard(object,email, place,imageDataURL);

  // Clear input fields
  form.reset();
  imageDataURL = ""; 
});

function addCard(itemObject,itemEmail, itemPlace, imgSrc) {
    const card = document.createElement("div");
    card.className = "card";
  
    card.innerHTML = `
     <div class="flip-card"">
      <div class="flip-card-inner">
      <div class="flip-card-front">
       ${imgSrc ? `<img src="${imgSrc}" alt="Attached Image" style="width:100%; height:80%; border-radius:5px;object-fit: cover;">` : ''}
       </div>
      <div class="flip-card-back">
      <p><strong>Object:</strong> ${itemObject}</p>
      <p><strong>Email:</strong> ${itemEmail}</p>
      <p><strong>Place:</strong> ${itemPlace}</p>
      </div>
      </div>
     </div>
    `;
  
    container.prepend(card);
  }

  
