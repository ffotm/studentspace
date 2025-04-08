document.addEventListener("DOMContentLoaded", function () { 
 
    let subMenu = document.getElementById("subMenu");
    let profilePic = document.querySelector(".profile-pic");

    if (subMenu && profilePic) {
        profilePic.addEventListener("click", function () {
            subMenu.classList.toggle("open-menu");
        });

        document.addEventListener("click", function (event) {
            if (!subMenu.contains(event.target) && !profilePic.contains(event.target)) {
                subMenu.classList.remove("open-menu");
            }
        });
    }

   
    const themeToggle = document.getElementById("theme-toggle");
    const themeIcon = document.getElementById("theme-icon");

    if (themeToggle && themeIcon) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode"); 
            themeIcon.classList.replace(
                document.body.classList.contains("dark-mode") ? "bx-moon" : "bx-sun",
                document.body.classList.contains("dark-mode") ? "bx-sun" : "bx-moon"
            );
        });
    }

    
    const editIcon = document.getElementById("edit-icon");
    const inputField = document.getElementById("username-input");

    if (editIcon && inputField) {
        editIcon.addEventListener("click", function () {
            let oldValue = inputField.value; 
            inputField.value = ""; 
            inputField.removeAttribute("disabled"); 
            inputField.focus(); 
            inputField.style.cursor = "text"; 

            inputField.addEventListener("blur", function () {
                if (inputField.value.trim() === "") {
                    inputField.value = oldValue;
                }
                inputField.setAttribute("disabled", "true");
                inputField.style.cursor = "default";
            }, { once: true });
        });
    }

   
    let profileLink = document.getElementById("profile-link");
    let myInfo = document.getElementById("myInfo");
    let avatarImg = document.getElementById("avatar-img");
    let chooseAvatar = document.getElementById("choose-avatar");

    if (profileLink && myInfo) {
        profileLink.addEventListener("click", function(event) {
            event.preventDefault();
            myInfo.classList.toggle("open-menu");
        });

        document.addEventListener("click", function(event) {
            if (!myInfo.contains(event.target) && !profileLink.contains(event.target) && !chooseAvatar.contains(event.target)) {
                myInfo.classList.remove("open-menu");
            }
        });
    }

   
    if (avatarImg && chooseAvatar) {
        avatarImg.addEventListener("click", function(event) {
            event.preventDefault();
            chooseAvatar.classList.toggle("open-menu");
        });

        document.addEventListener("click", function(event) {
            if (!chooseAvatar.contains(event.target) && !avatarImg.contains(event.target)) {
                chooseAvatar.classList.remove("open-menu");
            }
        });

        // منع إغلاق القائمة عند النقر على صورة داخل choose-avatar
        chooseAvatar.addEventListener("click", function(event) {
            event.stopPropagation();
        });
    }
});
























document.addEventListener("DOMContentLoaded", function() {
    var profileLink = document.getElementById("icon-notificaion");
    var myInfo = document.getElementById("notification");

    profileLink.addEventListener("click", function(event) {
        event.preventDefault();
        myInfo.classList.toggle("open-menu");
    });

    document.addEventListener("click", function(event) {
        if (!myInfo.contains(event.target) && !profileLink.contains(event.target)) {
            if (!event.target.closest("#notification")) { 
                myInfo.classList.remove("open-menu");
            }
        }
    });
});
document.addEventListener("DOMContentLoaded", function() {
    var notificationIcon = document.getElementById("icon-notification");
    var notificationMenu = document.getElementById("notification");

    notificationIcon.addEventListener("click", function(event) {
        event.preventDefault();
        notificationMenu.classList.toggle("open-menu");
    });

    document.addEventListener("click", function(event) {
        if (!notificationMenu.contains(event.target) && !notificationIcon.contains(event.target)) {
            notificationMenu.classList.remove("open-menu");
        }
    });
});

   












