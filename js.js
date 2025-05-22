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

   













function updateTaskStatusColors() {
    document.querySelectorAll(".task").forEach(task => {
      const status = task.dataset.status;
      const dot = task.querySelector(".status-dot");

      switch (status) {
        case "Pending":
          dot.style.backgroundColor = "rgb(45, 55, 208)";
          break;
        case "progress":
          dot.style.backgroundColor = "rgb(194, 210, 50)";
          break;
        case "Completed":
          dot.style.backgroundColor = "rgb(45, 213, 71)";
          break;
        case "Canceled":
          dot.style.backgroundColor = "rgb(226, 47, 51)";
          break;
        default:
          dot.style.backgroundColor = "#a6a0e7";
       }
     });
   }
  updateTaskStatusColors();


 









 document.addEventListener("DOMContentLoaded", function () {
  
    const data = [
        { circleId: 1, percentage: 25 },
        { circleId: 2, percentage: 60 },
        { circleId: 3, percentage: 27 },
        { circleId: 4, percentage: 87 }
    ];

  
   function updateCircleProgress(circleId, percentage) {
    const progress = document.getElementById(`progress${circleId}`);
    const text = document.getElementById(`text${circleId}`);
    const radius = 15.9155; 
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    progress.style.strokeDasharray = `${(percentage / 100) * circumference}, ${circumference}`;

    text.style.opacity = 0;  
    setTimeout(() => {
        text.textContent = `${percentage}%`;
        text.style.opacity = 1;  
    }, 100);  
}

function updateLineProgress(lineId, percentage) {
    const bar = document.getElementById(`line-bar${lineId}`);
    const text = document.getElementById(`line-text${lineId}`);

    bar.style.width = percentage + '%';

    text.style.opacity = 0;
    setTimeout(() => {
        text.textContent = `${percentage}%`;
        text.style.opacity = 1;
    }, 100);  
}


    
    fetch('http://.....')
    .then(response => response.json())
    .then(apiData => {
        apiData.circles.forEach(item => {
            updateCircleProgress(item.circleId, item.percentage);
        });
        apiData.lines.forEach(item => {
            updateLineProgress(item.lineId, item.percentage);
        });
    });


 const circleData = [
    { circleId: 1, percentage: 80 },
    { circleId: 2, percentage: 60 },
    { circleId: 3, percentage: 25 },
    { circleId: 4, percentage: 40 }
];

const lineData = [
    { lineId: 1, percentage: 55 },
   
];


circleData.forEach(item => {
    updateCircleProgress(item.circleId, item.percentage);
});


lineData.forEach(item => {
    updateLineProgress(item.lineId, item.percentage);
});













  
    const buttons = document.querySelectorAll(".view-details");
    buttons.forEach(button => {
        button.addEventListener("click", function() {
            const task = this.closest(".task"); 
            task.classList.toggle("expanded");  
        });
    });

    



    function updateTaskStatusColors() {
        document.querySelectorAll(".task").forEach(task => {
            const status = task.dataset.status;
            const dot = task.querySelector(".status-dot");

            switch (status) {
                case "Pending":
                    dot.style.backgroundColor = "rgb(45, 55, 208)";
                    break;
                case "progress":
                    dot.style.backgroundColor = "rgb(194, 210, 50)";
                    break;
                case "Completed":
                    dot.style.backgroundColor = "rgb(45, 213, 71)";
                    break;
                case "Canceled":
                    dot.style.backgroundColor = "rgb(226, 47, 51)";
                    break;
                default:
                    dot.style.backgroundColor = "#a6a0e7";
            }
        });
    }
    updateTaskStatusColors();

   
    function reorderTasks() {
        const tasksContainer = document.querySelector(".tasks");
        const tasks = Array.from(tasksContainer.querySelectorAll(".task"));

        const completedTasks = tasks.filter(task => task.dataset.status === "Completed");
        const otherTasks = tasks.filter(task => task.dataset.status !== "Completed");

        tasksContainer.innerHTML = "";

        otherTasks.concat(completedTasks).forEach(task => {
            tasksContainer.appendChild(task);
        });
    }

    updateTaskStatusColors(); 
    reorderTasks();
});







document.addEventListener("DOMContentLoaded", () => {
  const tasks = document.querySelectorAll(".task");

  tasks.forEach(task => {
    const statusDateSpan = task.querySelector(".status-date");
    const taskId = task.getAttribute("data-id"); 

    fetch(`API ${taskId}`)
      .then(response => response.json())
      .then(data => {
        const date = new Date(data.completedDate); 
        statusDateSpan.textContent = formatDate(date);
      })
      .catch(error => {
        console.error( error);
        statusDateSpan.textContent = "xx/xx/xxxx";
      });
  });
});

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${year}`;
}















// function toggleSize() {
//   document.getElementById("content").classList.toggle("big");
// }


document.getElementById("toggleButton").addEventListener("click", function () {
  const team = document.getElementById("teamBox");
  const wrapper = team.parentElement;
  team.classList.toggle("expanded");
  wrapper.classList.toggle("expanded");
});





document.addEventListener("DOMContentLoaded", function () {
    const members = document.querySelectorAll('.team-members-expended img');
    members.forEach((img, index) => {
      img.style.left = `${index * 1.5}rem`;
    });
  });






document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector('.calendar h3');
  const dates = document.querySelector('.dates');
  const navs = document.querySelectorAll('#prev, #next');

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  let today = new Date();
  let month = today.getMonth();
  let year = today.getFullYear();

  const events = [
    { date: '2025-05-23', type: 'team-meet' },
    { date: '2025-05-25', type: 'teacher-meet' },
    { date: '2025-05-28', type: 'final-reveal' }
  ];

  function renderCalendar() {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lastDayOfMonth = new Date(year, month, daysInMonth).getDay();
    const prevMonthDays = new Date(year, month, 0).getDate();

    let datesHtml = "";

 
    for (let i = firstDayOfMonth; i > 0; i--) {
      datesHtml += `<li class="inactive">${prevMonthDays - i + 1}</li>`;
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = i === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

   
      const currentDateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const event = events.find(e => e.date === currentDateStr);

      let classNames = [];
      if (isToday) classNames.push("today");
      if (event) classNames.push(event.type);

      datesHtml += `<li class="${classNames.join(" ")}">${i}</li>`;
    }

    for (let i = lastDayOfMonth + 1; i < 7; i++) {
      datesHtml += `<li class="inactive">${i - lastDayOfMonth}</li>`;
    }

    dates.innerHTML = datesHtml;
    header.textContent = `${months[month]} ${year}`;
  }

  navs.forEach(nav => {
    nav.addEventListener('click', e => {
      const btnId = e.target.id;
      if (btnId === 'prev') {
        month--;
        if (month < 0) {
          month = 11;
          year--;
        }
      } else if (btnId === 'next') {
        month++;
        if (month > 11) {
          month = 0;
          year++;
        }
      }
      renderCalendar();
    });
  });

  renderCalendar();
});






