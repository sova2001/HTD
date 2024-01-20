document.addEventListener('DOMContentLoaded', function () {
    // Initialize Firebase Authentication
    const auth = firebase.auth();

    // Check user authentication state
    auth.onAuthStateChanged(function (user) {
        if (user) {
            // User is signed in, you can access user information using 'user'
            // Update the UI or load the to-do list accordingly
            loadClasses();
            showClassAssignments();
        } else {
            // User is signed out, prompt for sign-in
            // You may redirect to a sign-in page or show a sign-in button
            console.log("User is signed out");
        }
    });
});

function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then(function (result) {
            // This gives you a Google Access Token
            const token = result.credential.accessToken;
            // This gives you the signed-in user info
            const user = result.user;
            console.log("User signed in:", user);
        })
        .catch(function (error) {
            // Handle errors
            console.error("Sign-in error:", error);
        });
}

function signOut() {
    firebase.auth().signOut().then(function () {
        // Sign-out successful
        console.log("User signed out");
    }).catch(function (error) {
        // Handle errors
        console.error("Sign-out error:", error);
    });
}



function showClassAssignments() {
    document.getElementById('classAssignments').style.display = 'block';
    document.getElementById('allAssignments').style.display = 'none';

    loadTasks(); // Load and display tasks for the selected class
}

function showAllAssignments() {
    document.getElementById('classAssignments').style.display = 'none';
    document.getElementById('allAssignments').style.display = 'block';

    loadAllAssignments(); // Load and display all assignments
    loadOverallProgress(); // Load and display overall progress
}


function loadClasses() {
    const classDropdown = document.getElementById('classDropdown');
    classDropdown.innerHTML = ''; // Clear existing options

    // Load existing classes from localStorage
    const classes = getClasses();

    // Add each class as an option
    classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.text = className;
        classDropdown.add(option);
    });

    // Add "Add New Class" option at the bottom
    const addNewClassOption = document.createElement('option');
    addNewClassOption.value = 'addNewClass';
    addNewClassOption.text = 'Add New Class';
    classDropdown.add(addNewClassOption);
}

function getClasses() {
    // Retrieve existing classes from localStorage
    const classesString = localStorage.getItem('classes');
    return classesString ? JSON.parse(classesString) : [];
}

function saveClasses(classes) {
    // Save classes to localStorage
    localStorage.setItem('classes', JSON.stringify(classes));
}

function addNewClass() {
    const newClassInput = document.getElementById('newClassInput');
    const classDropdown = document.getElementById('classDropdown');

    const newClassName = newClassInput.value.trim();
    if (newClassName === '') {
        alert('Please enter a new class name.');
        return;
    }

    // Get existing classes
    const classes = getClasses();

    // Check if the class already exists
    if (classes.includes(newClassName)) {
        alert('Class already exists.');
        return;
    }

    // Add the new class
    classes.push(newClassName);

    // Save the updated classes
    saveClasses(classes);

    // Reload classes in the dropdown
    loadClasses();

    // Select the new class
    classDropdown.value = newClassName;

    // Hide the new class input
    newClassInput.style.display = 'none';

    // Clear the input field
    newClassInput.value = '';

    // Load tasks for the new class
    loadTasks();
}

function changeClass() {
    const classDropdown = document.getElementById('classDropdown');
    const newClassInput = document.getElementById('newClassInput');

    if (classDropdown.value === 'addNewClass') {
        newClassInput.style.display = 'inline-block';
        newClassInput.value = ''; // Clear the input field
        newClassInput.focus(); // Set focus to the input field
    } else {
        newClassInput.style.display = 'none';
        loadTasks();
    }
}

// Add this function to format the date
function formatDate(dateString) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const formattedDate = new Date(dateString).toLocaleDateString('en-US', options);
    return formattedDate;
}

// Update the addTask function to format the date
function addTask() {
    const taskInput = document.getElementById('taskInput');
    const dueDate = document.getElementById('dueDate');
    const classDropdown = document.getElementById('classDropdown');

    if (taskInput.value.trim() === '') {
        alert('Please enter a task.');
        return;
    }

    const selectedClass = classDropdown.value;

    const task = {
        text: taskInput.value,
        date: formatDate(dueDate.value) || 'No due date',
        completed: false,
        class: selectedClass
    };

    saveTask(task, selectedClass);
    loadTasks(); // Load tasks for the selected class
    loadAllAssignments(); // Load and display all assignments
    taskInput.value = '';
    dueDate.value = '';
}

function saveTask(task, selectedClass) {
    let tasks = JSON.parse(localStorage.getItem(selectedClass)) || [];
    tasks.push(task);
    localStorage.setItem(selectedClass, JSON.stringify(tasks));
}

function loadTasks() {
    const taskList = document.getElementById('taskList');
    const progressBar = document.getElementById('progressBar');
    const classDropdown = document.getElementById('classDropdown');
    const overallProgressBar = document.getElementById('overallProgressBar');

    taskList.innerHTML = '';

    const selectedClass = classDropdown.value;
    const classes = Array.from(classDropdown.options).map(option => option.value);

    if (!classes.includes(selectedClass)) {
        // If the selected class is not in the dropdown, select the first class
        classDropdown.value = classes[0];
    }

    const tasks = JSON.parse(localStorage.getItem(selectedClass)) || [];
    const sortedTasks = tasks.sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by due date

    const completedTasks = sortedTasks.filter(task => task.completed);

    sortedTasks.forEach(task => {
        const formattedDate = formatDate(task.date);
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox" onchange="toggleCompletion('${selectedClass}', ${sortedTasks.indexOf(task)})" ${task.completed ? 'checked' : ''}>
            <span class="${task.completed ? 'completed' : ''}">${task.text} - Due: ${formattedDate}</span>
            <button onclick="deleteTask('${selectedClass}', ${sortedTasks.indexOf(task)})">Delete</button>
        `;
        taskList.appendChild(li);
    });

    const progress = (completedTasks.length / sortedTasks.length) * 100 || 0;

    progressBar.style.width = `${progress}%`;
    progressBar.style.backgroundColor = getProgressBarColor(progress);

    // Calculate and update overall progress
    const overallProgress = calculateOverallProgress();
    overallProgressBar.style.width = `${overallProgress}%`;
    overallProgressBar.style.backgroundColor = getProgressBarColor(overallProgress);

    // Load and display all assignments
    loadAllAssignments();
}

// Add this function to load and display all assignments
// Update the loadAllAssignments function to display all assignments sorted by due date
function loadAllAssignments() {
    const allAssignmentsList = document.getElementById('allAssignmentsList');
    allAssignmentsList.innerHTML = '';

    const allClasses = getClasses();
    const allAssignments = [];

    allClasses.forEach(className => {
        const tasks = JSON.parse(localStorage.getItem(className)) || [];
        allAssignments.push(...tasks);
    });

    const sortedAssignments = allAssignments.sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by due date

    sortedAssignments.forEach(task => {
        const formattedDate = formatDate(task.date);
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${task.class} - ${task.text} - Due: ${formattedDate}</span>
        `;
        allAssignmentsList.appendChild(li);
    });
}

function deleteSelectedClass() {
    const classDropdown = document.getElementById('classDropdown');
    const selectedClass = classDropdown.value;

    if (selectedClass === 'addNewClass') {
        alert('Please select a valid class to delete.');
        return;
    }

    const confirmDelete = confirm(`Are you sure you want to delete the class "${selectedClass}"? This action cannot be undone.`);

    if (confirmDelete) {
        // Get existing classes
        let classes = getClasses();

        // Remove the selected class
        classes = classes.filter(className => className !== selectedClass);

        // Save the updated classes
        saveClasses(classes);

        // Reload classes in the dropdown
        loadClasses();

        // Select the first class in the dropdown
        classDropdown.value = classes[0];

        // Load tasks for the new class
        loadTasks();
    }
}


function toggleCompletion(selectedClass, index) {
    let tasks = JSON.parse(localStorage.getItem(selectedClass)) || [];
    tasks[index].completed = !tasks[index].completed;
    localStorage.setItem(selectedClass, JSON.stringify(tasks));
    loadTasks();
}

function deleteTask(selectedClass, index) {
    let tasks = JSON.parse(localStorage.getItem(selectedClass)) || [];
    tasks.splice(index, 1);
    localStorage.setItem(selectedClass, JSON.stringify(tasks));
    loadTasks();
}

function getProgressBarColor(progress) {
    if (progress < 25) {
        return 'red';
    } else if (progress < 50) {
        return 'orange';
    } else if (progress < 75) {
        return 'yellow';
    } else {
        return 'green';
    }
}

// Update the calculateOverallProgress function to calculate progress based on all assignments
function calculateOverallProgress() {
    const allClasses = getClasses();
    const allAssignments = [];

    allClasses.forEach(className => {
        const tasks = JSON.parse(localStorage.getItem(className)) || [];
        allAssignments.push(...tasks);
    });

    const overallCompletedTasks = allAssignments.filter(task => task.completed).length;
    const overallTotalTasks = allAssignments.length;

    return (overallCompletedTasks / overallTotalTasks) * 100 || 0;
}



//// Placeholder code for educational purposes - NOT functional
//
//// Step 1: Authentication (OAuth example)
//function authenticateUser() {
//  // Implement OAuth flow to authenticate the user
//  // Obtain access token for further API requests
//}
//
//// Step 2: Fetch user's assignments from school's API
//function fetchAssignments(accessToken) {
//  // Use the obtained access token to make API requests to your school's system
//  // Retrieve assignment data (names, due dates, classes, etc.)
//}
//
//// Step 3: Process and format data
//function processAssignments(rawData) {
//  // Process the raw data obtained from the school's API
//  // Format it to match the structure of your to-do list
//}
//
//// Step 4: Update to-do list
//function updateToDoList(formattedData) {
//  // Update your to-do list with the formatted assignment data
//  // Add assignments with due dates to the appropriate classes
//  alert('To-do list updated with school assignments!');
//}
//
//// Step 5: Complete flow
//function synchronizeWithSchool() {
//  const accessToken = authenticateUser();
//  const assignmentsData = fetchAssignments(accessToken);
//  const formattedData = processAssignments(assignmentsData);
//  updateToDoList(formattedData);
//}





