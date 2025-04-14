document.querySelector(".post-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const textarea = this.querySelector(".post-textarea");
  const imageInput = document.getElementById("image-upload");
  const topicSelect = document.getElementById("topic-select"); // NEW
  const postText = textarea.value.trim();

  if (!postText) return;

  // Capture the selected topic
  const chosenTopic = topicSelect.value || "General";

  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      createPost(postText, event.target.result, chosenTopic);
    };
    reader.readAsDataURL(file);
  } else {
    createPost(postText, null, chosenTopic);
  }

  // Clear out the form + file name after posting
  textarea.value = "";
  imageInput.value = "";
  document.getElementById("selected-file-name").textContent = "";
});

function createPost(postText, imageURL, topic) {
  const postContainer = document.createElement("article");
  postContainer.classList.add("post");

  const timestamp = new Date().toLocaleString();

  postContainer.innerHTML = `
    <header>
      <img class="user-avatar" src="https://c.animaapp.com/m9cq51g1Jevf3Y/img/image-10-2.png" alt="User avatar" />
      <h3>username_</h3>
      <div class="more-options-wrapper">
        <button class="more-options" aria-label="More options">
          <i class="fas fa-cog"></i>
        </button>
        <ul class="options-menu">
          <li>
            <button class="remove-post">
              <i class="fas fa-minus-circle"></i>
              Delete
            </button>
          </li>
          <li>
            <button class="report-post">
              <i class="fas fa-ban"></i>
              Report
            </button>
          </li>
        </ul>
      </div>
      <span class="post-tag">${topic}</span>
    </header>
    <p class="post-content">${postText}</p>
    ${
      imageURL
        ? `<img src="${imageURL}" class="uploaded-image" alt="User post image"
            style="max-width: 100%; border-radius: 8px; margin-top: 10px;" />`
        : ""
    }
    <p class="timestamp" style="font-size: 0.8rem; color: #777; margin-top: 8px;">
      Posted on ${timestamp}
    </p>
    <footer>
      <button class="like-button" aria-label="Like post">
        <i class="far fa-thumbs-up"></i> <span class="like-count">0</span>
      </button>
      <button class="comment-button" aria-label="Comment on post">
        <i class="far fa-comment-dots"></i>
      </button>
    </footer>
    <div class="comment-section">
      <!-- 
        We'll let CSS handle placing the button on the right,
        see style.css .comment-section for details.
      -->
      <textarea class="comment-input" placeholder="Write a comment..."></textarea>
      <button class="submit-comment">
        <i class="far fa-paper-plane"></i> Comment
      </button>
      <div class="comments-list"></div>
    </div>
  `;

  // Like logic
  const likeButton = postContainer.querySelector(".like-button");
  const likeCount = postContainer.querySelector(".like-count");
  let liked = false;
  likeButton.addEventListener("click", () => {
    liked = !liked;
    likeCount.textContent = liked ? 1 : 0;
    likeButton.classList.toggle("liked", liked);
    // Switch icon from regular to solid thumbs-up
    likeButton.querySelector("i").className = liked
      ? "fas fa-thumbs-up"
      : "far fa-thumbs-up";
  });

  // Comment logic
  const commentButton = postContainer.querySelector(".comment-button");
  const commentSection = postContainer.querySelector(".comment-section");
  const commentInput = postContainer.querySelector(".comment-input");
  const submitComment = postContainer.querySelector(".submit-comment");
  const commentsList = postContainer.querySelector(".comments-list");

  commentButton.addEventListener("click", () => {
    commentSection.style.display =
      commentSection.style.display === "none" ? "block" : "none";
  });

  submitComment.addEventListener("click", () => {
    const text = commentInput.value.trim();
    if (text) {
      const comment = document.createElement("div");
      comment.classList.add("comment-entry");
      // Include user avatar here
      comment.innerHTML = `
        <img
          src="https://c.animaapp.com/m9cq51g1Jevf3Y/img/image-10-2.png"
          alt="Commenter avatar"
          class="comment-avatar"
        />
        <div class="comment-body">
          <strong>user_01</strong>
          <span class="comment-time">${new Date().toLocaleString()}</span>
          <br>
          <span class="comment-text">${text}</span>
          <div class="comment-actions">
            <button class="edit-comment">Edit</button>
            <button class="delete-comment">Delete</button>
          </div>
        </div>
      `;

      // Edit
      comment.querySelector(".edit-comment").addEventListener("click", () => {
        const textSpan = comment.querySelector(".comment-text");
        const newText = prompt("Edit your comment:", textSpan.textContent);
        if (newText !== null) {
          textSpan.textContent = newText;
        }
      });

      // Delete
      comment.querySelector(".delete-comment").addEventListener("click", () => {
        comment.remove();
      });

      commentsList.appendChild(comment);
      commentInput.value = "";
    }
  });

  // Remove post
  postContainer.querySelector(".remove-post").addEventListener("click", () => {
    postContainer.remove();
  });

  // Report post
  postContainer.querySelector(".report-post").addEventListener("click", () => {
    alert("🚩 This post has been reported.");
  });

  // Finally, append the new post to the main feed
  document.querySelector(".main-feed").appendChild(postContainer);
}

// Display selected file name in the post form
const imageUpload = document.getElementById("image-upload");
if (imageUpload) {
  imageUpload.addEventListener("change", function () {
    const fileNameDisplay = document.getElementById("selected-file-name");
    if (this.files && this.files[0]) {
      fileNameDisplay.textContent = this.files[0].name;
    } else {
      fileNameDisplay.textContent = "";
    }
  });
}