# Campus-Life-Planner
Campus life planner is a responsive and accessible web application that helps students manage their daily tasks, events, and goals with ease.  
It combines smart organization, regex-powered search, and a clean dashboard — built entirely with HTML, CSS, and JavaScript.

**Live demo**: http://127.0.0.1:5500/index.html 

**Canva Design**: https://www.canva.com/design/DAG1_CBPZrs/M2QJ4bYG_uJi6G8nr4uePg/edit?utm_content=DAG1_CBPZrs&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

**Demo video** :

# Overview
This website helps balance coursework, deadlines, and student activities, which can be overwhelming.
This app provides a central planner where students can:

- Add, edit, and delete tasks  
- Track durations and due dates  
- Visualize time spent on tasks  
- Customize settings and tags  
- Search tasks using regular expressions (regex) 

Designed with accessibility and responsiveness in mind, the Campus Life Planner works across all devices and supports keyboard-only navigation

## Setup Guide

You can run this app locally or deploy it online — no installation required!

## Option 1: Run Locally
1. Download or clone the repository:
   git clone https://github.com/g-teta/campus-life-planner.git
2. After opening the project folder, open the index.html and run it.
   This will open the website.
***Key Features***
Feature	Description
Dashboard	Displays task statistics and a Chart.js visualization of total durations.
Tasks List	View, sort, search, and manage tasks in a responsive table.
Add/Edit Task	Form-based task creation with input validation and live feedback.
Settings: Choose duration units (minutes/hours) and preset common tags.
Regex Search	Filter tasks dynamically using case-insensitive regex patterns.
Import/Export JSON: Save or load your tasks between sessions.
Accessibility Support	Keyboard navigation, skip link, aria labels, and polite regions.
Responsive Design	Works smoothly across mobile, tablet, and desktop screens.
Regex Catalog

The search bar in the Tasks section supports regular expressions (regex) for advanced filtering.
This allows flexible, case-insensitive pattern matching.

Pattern	Matches	Example
exam	Any task containing the word “exam”	Midterm exam prep
^read	Tasks starting with “read”	Read Chapter 5
project$	Tasks ending with “project”	Biology project
`lab	test`	Tasks containing “lab” or “test”
[0-9]	Tasks containing numbers: Task 101, Meeting 2

Invalid regex patterns are automatically handled to prevent errors.
Accessibility Notes

This project was built following WCAG 2.1 accessibility principles:

Semantic HTML5 structure using <header>, <main>, <section>, and <footer>

ARIA roles for navigation, forms, and tables

Skip link (“Skip to content”) for screen readers and keyboard users

aria-live="polite" regions for real-time updates (such as validation messages)

Focusable table headers for sorting with the keyboard

Responsive font sizes and high-contrast color combinations

Accessibility testing was performed using:

Browser DevTools Accessibility Tree

Keyboard navigation checks

Screen reader simulation

***Testing Instructions***

Follow these steps to verify that the app works as expected:

**Functional Testing**

1. Open index.html in your browser.
2. Add a few tasks with different titles, dates, and durations.
3. Verify that tasks appear correctly in the Tasks table.
4. Edit and delete tasks to confirm functionality.
5. Use the Search (regex) field to test pattern matching (e.g., type exam$).
6. Import and export JSON files to ensure data persistence.
7. Check that the Dashboard chart updates after every task change.

**Responsive Testing**

- Resize the browser window or use Developer Tools → Mobile View.
- Confirm that the layout adapts correctly on different screen sizes.

**Accessibility Testing**

Use only the keyboard to navigate through the app.
Ensure that focus indicators are visible and the skip link works properly.
Check that validation messages are read correctly by screen readers.

Technologies Used
Technology	Purpose
HTML5	Structure, accessibility, and semantic layout
CSS3	Styling, responsiveness, and layout
JavaScript (ES6)	Dynamic functionality and DOM manipulation
Chart.js	Task duration data visualization
LocalStorage: Persistent task and settings storage in the browser

**Folder Structure**
campus-life-planner/

│

├── index.html                # Main web page

│

├── style/

│   ├── styles.css            # Core styling

│   └── responsive.css        # Mobile-first responsiveness

│

├── scripts/

│   └── main.js               # JavaScript logic

│

└── README.md                 # Documentation
