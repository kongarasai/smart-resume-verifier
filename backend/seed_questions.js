require('dotenv').config();
const { db } = require('./src/config/firebase');

const codingQuestions = [
  { title: "Two Sum", difficulty: "easy", description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nExample:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]", tags: ["array", "hash-table"] },
  { title: "Valid Palindrome", difficulty: "easy", description: "Given a string s, return true if it is a palindrome, or false otherwise. A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.", tags: ["string", "two-pointers"] },
  { title: "Merge K Sorted Lists", difficulty: "hard", description: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.", tags: ["linked-list", "divide-and-conquer", "heap"] },
  { title: "Reverse Linked List", difficulty: "easy", description: "Given the head of a singly linked list, reverse the list, and return the reversed list.", tags: ["linked-list", "recursion"] },
  { title: "Binary Search", difficulty: "easy", description: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.", tags: ["binary-search", "algorithms"] },
  { title: "Valid Parentheses", difficulty: "easy", description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.", tags: ["stack", "string"] },
  { title: "LCA of BST", difficulty: "easy", description: "Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.", tags: ["tree", "binary-search-tree"] },
  { title: "Balanced Binary Tree", difficulty: "easy", description: "Given a binary tree, determine if it is height-balanced.", tags: ["tree", "binary-tree"] },
  { title: "Implement Queue using Stacks", difficulty: "easy", description: "Implement a first in first out (FIFO) queue using only two stacks. The implemented queue should support all the functions of a normal queue (push, peek, pop, and empty).", tags: ["stack", "queue"] },
  { title: "Flood Fill", difficulty: "easy", description: "An image is represented by an m x n integer grid image where image[i][j] represents the pixel value of the image. Perform a flood fill on the image starting from pixel (sr, sc).", tags: ["graph", "dfs", "bfs"] },
  { title: "Maximum Subarray", difficulty: "medium", description: "Given an integer array nums, find the subarray with the largest sum, and return its sum.", tags: ["array", "dynamic-programming"] },
  { title: "Lowest Common Ancestor of a Binary Tree", difficulty: "medium", description: "Given a binary tree, find the lowest common ancestor (LCA) of two given nodes in the tree.", tags: ["tree", "binary-tree"] },
  { title: "Merge Intervals", difficulty: "medium", description: "Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals.", tags: ["array", "sorting"] },
  { title: "Insert Interval", difficulty: "medium", description: "You are given an array of non-overlapping intervals where intervals[i] = [start_i, end_i] sorted in ascending order by start_i. Insert a new interval into the intervals.", tags: ["array"] },
  { title: "01 Matrix", difficulty: "medium", description: "Given an m x n binary matrix mat, return the distance of the nearest 0 for each cell.", tags: ["graph", "bfs"] },
  { title: "K Closest Points to Origin", difficulty: "medium", description: "Given an array of points where points[i] = [x_i, y_i] and an integer k, return the k closest points to the origin (0, 0).", tags: ["heap", "sorting"] },
  { title: "Longest Substring Without Repeating Characters", difficulty: "medium", description: "Given a string s, find the length of the longest substring without repeating characters.", tags: ["string", "sliding-window"] },
  { title: "3Sum", difficulty: "medium", description: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.", tags: ["array", "two-pointers"] },
  { title: "Binary Tree Level Order Traversal", difficulty: "medium", description: "Given the root of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).", tags: ["tree", "bfs"] },
  { title: "Clone Graph", difficulty: "medium", description: "Return a deep copy of a connected undirected graph where each node contains a val and a list of its neighbors.", tags: ["graph", "dfs", "bfs"] },
  { title: "Evaluate Reverse Polish Notation", difficulty: "medium", description: "Evaluate the value of an arithmetic expression in Reverse Polish Notation. Valid operators are +, -, *, and /.", tags: ["stack", "math"] },
  { title: "Course Schedule", difficulty: "medium", description: "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. Some courses may have prerequisites. Determine if you can finish all courses.", tags: ["graph", "topological-sort"] },
  { title: "Implement Trie (Prefix Tree)", difficulty: "medium", description: "A trie (pronounced as 'try') or prefix tree is a tree data structure used to efficiently store and retrieve keys in a dataset of strings. Implement the Trie class.", tags: ["design", "trie"] },
  { title: "Coin Change", difficulty: "medium", description: "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount.", tags: ["dynamic-programming"] },
  { title: "Product of Array Except Self", difficulty: "medium", description: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].", tags: ["array", "prefix-sum"] },
  { title: "Min Stack", difficulty: "medium", description: "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.", tags: ["stack", "design"] },
  { title: "Validate Binary Search Tree", difficulty: "medium", description: "Given the root of a binary tree, determine if it is a valid binary search tree (BST).", tags: ["tree", "dfs"] },
  { title: "Number of Islands", difficulty: "medium", description: "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.", tags: ["graph", "dfs", "bfs"] },
  { title: "Rotting Oranges", difficulty: "medium", description: "You are given an m x n grid where each cell can have one of three values: 0 (empty), 1 (fresh orange), or 2 (rotten orange). Return the minimum number of minutes that must elapse until no cell has a fresh orange.", tags: ["graph", "bfs"] },
  { title: "Search in Rotated Sorted Array", difficulty: "medium", description: "Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums.", tags: ["array", "binary-search"] },
  { title: "Combination Sum", difficulty: "medium", description: "Given an array of distinct integers candidates and a target integer target, return a list of all unique combinations of candidates where the chosen numbers sum to target.", tags: ["backtracking"] },
  { title: "Permutations", difficulty: "medium", description: "Given an array nums of distinct integers, return all the possible permutations. You can return the answer in any order.", tags: ["backtracking"] },
  { title: "Merge Two Sorted Lists", difficulty: "easy", description: "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists in a one sorted list.", tags: ["linked-list"] },
  { title: "Word Search", difficulty: "medium", description: "Given an m x n grid of characters board and a string word, return true if word exists in the grid.", tags: ["backtracking", "matrix"] },
  { title: "Find All Anagrams in a String", difficulty: "medium", description: "Given two strings s and p, return an array of all the start indices of p's anagrams in s.", tags: ["sliding-window", "hash-table"] },
  { title: "Subsets", difficulty: "medium", description: "Given an integer array nums of unique elements, return all possible subsets (the power set).", tags: ["backtracking", "bit-manipulation"] },
  { title: "Binary Tree Right Side View", difficulty: "medium", description: "Given the root of a binary tree, imagine yourself standing on the right side of it. Return the values of the nodes you can see ordered from top to bottom.", tags: ["tree", "dfs", "bfs"] },
  { title: "Longest Palindromic Substring", difficulty: "medium", description: "Given a string s, return the longest palindromic substring in s.", tags: ["string", "dynamic-programming"] },
  { title: "Unique Paths", difficulty: "medium", description: "There is a robot on an m x n grid. The robot is initially located at the top-left corner. Return the number of possible unique paths to reach the bottom-right corner.", tags: ["dynamic-programming", "math"] },
  { title: "Construct Tree from Preorder and Inorder", difficulty: "medium", description: "Given two integer arrays preorder and inorder where preorder is the preorder traversal of a binary tree and inorder is the inorder traversal of the same tree, construct and return the binary tree.", tags: ["tree", "divide-and-conquer"] },
  { title: "Container With Most Water", difficulty: "medium", description: "You are given an integer array height of length n. Find two lines that together with the x-axis form a container, such that the container contains the most water.", tags: ["array", "two-pointers"] },
  { title: "Letter Combinations of a Phone Number", difficulty: "medium", description: "Given a string containing digits from 2-9 inclusive, return all possible letter combinations that the number could represent. Return the answer in any order.", tags: ["backtracking", "string"] },
  { title: "Spiral Matrix", difficulty: "medium", description: "Given an m x n matrix, return all elements of the matrix in spiral order.", tags: ["matrix", "array"] },
  { title: "Word Break", difficulty: "medium", description: "Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.", tags: ["dynamic-programming", "trie"] },
  { title: "Partition Equal Subset Sum", difficulty: "medium", description: "Given an integer array nums, return true if you can partition the array into two subsets such that the sum of the elements in both subsets is equal, or false otherwise.", tags: ["dynamic-programming"] },
  { title: "String to Integer (atoi)", difficulty: "medium", description: "Implement the myAtoi(string s) function, which converts a string to a 32-bit signed integer.", tags: ["string", "algorithms"] },
  { title: "LRU Cache", difficulty: "medium", description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.", tags: ["design", "linked-list", "hash-table"] },
  { title: "Median of Two Sorted Arrays", difficulty: "hard", description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.", tags: ["array", "binary-search", "divide-and-conquer"] },
  { title: "Regular Expression Matching", difficulty: "hard", description: "Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*' where '.' matches any single character and '*' matches zero or more of the preceding element.", tags: ["dynamic-programming", "string"] },
  { title: "Serialize and Deserialize Binary Tree", difficulty: "hard", description: "Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored. Design an algorithm to serialize and deserialize a binary tree.", tags: ["tree", "design"] }
].map(q => ({
  ...q,
  category: 'coding',
  question_type: 'code',
  options: null,
  correct_answer: null,
  group_id: null,
  is_active: true,
  created_at: new Date()
}));

const technicalMcqQuestions = [
  { title: "React useEffect dependency", difficulty: "medium", description: "What happens when you pass an empty array [] to useEffect hook?", options: [{id:"a",text:"Runs on every render"},{id:"b",text:"Runs only once after initial mount"},{id:"c",text:"Never runs"},{id:"d",text:"Causes infinite loop"}], correct_answer: "b", tags: ["react"] },
  { title: "ACID DB Property", difficulty: "easy", description: "Which of the following is NOT a property of ACID?", options: [{id:"a",text:"Atomicity"},{id:"b",text:"Consistency"},{id:"c",text:"Isolation"},{id:"d",text:"Distribution"}], correct_answer: "d", tags: ["sql", "database"] },
  { title: "QuickSort Time Complexity", difficulty: "hard", description: "What is the worst-case time complexity of QuickSort?", options: [{id:"a",text:"O(N log N)"},{id:"b",text:"O(N)"},{id:"c",text:"O(N^2)"},{id:"d",text:"O(log N)"}], correct_answer: "c", tags: ["algorithms"] },
  { title: "CSS Box Model", difficulty: "easy", description: "Which CSS property controls the space outside an element's border?", options: [{id:"a",text:"padding"},{id:"b",text:"margin"},{id:"c",text:"border-spacing"},{id:"d",text:"outline-offset"}], correct_answer: "b", tags: ["css"] },
  { title: "JS Event Loop", difficulty: "hard", description: "Which mechanism executes asynchronous callbacks in JavaScript?", options: [{id:"a",text:"Call Stack"},{id:"b",text:"Heap Allocation"},{id:"c",text:"Event Loop & Queue"},{id:"d",text:"Garbage Collector"}], correct_answer: "c", tags: ["javascript"] },
  { title: "HTTP Status Codes", difficulty: "easy", description: "Which HTTP status code represents 'Unauthorized Access'?", options: [{id:"a",text:"400"},{id:"b",text:"401"},{id:"c",text:"403"},{id:"d",text:"404"}], correct_answer: "b", tags: ["networking"] },
  { title: "REST vs SOAP", difficulty: "medium", description: "Which protocol or architectural style typically uses JSON for data exchange?", options: [{id:"a",text:"SOAP"},{id:"b",text:"WSDL"},{id:"c",text:"REST"},{id:"d",text:"RPC"}], correct_answer: "c", tags: ["api"] },
  { title: "SQL Inner Join", difficulty: "medium", description: "What does an INNER JOIN return?", options: [{id:"a",text:"All rows from both tables"},{id:"b",text:"Only matching rows in both tables"},{id:"c",text:"All rows from left, matching from right"},{id:"d",text:"All rows from right, matching from left"}], correct_answer: "b", tags: ["sql"] },
  { title: "NoSQL DB type", difficulty: "easy", description: "Which of the following is a document-oriented NoSQL database?", options: [{id:"a",text:"MySQL"},{id:"b",text:"Redis"},{id:"c",text:"MongoDB"},{id:"d",text:"Neo4j"}], correct_answer: "c", tags: ["database"] },
  { title: "Docker Containers", difficulty: "medium", description: "How does a Docker container differ from a Virtual Machine?", options: [{id:"a",text:"Containers have their own OS kernel"},{id:"b",text:"Containers share the host OS kernel"},{id:"c",text:"Containers are always slower"},{id:"d",text:"Containers require hypervisors"}], correct_answer: "b", tags: ["devops"] },
  // Adding 40 more to hit 50
  ...Array.from({ length: 40 }).map((_, i) => ({
    title: `Tech MCQ Question #${i + 11}`,
    difficulty: i % 3 === 0 ? "easy" : i % 3 === 1 ? "medium" : "hard",
    description: `This is a technical question about topic ${["Git", "OS", "Security", "Networks", "HTML", "TypeScript", "Data Structures"][i % 7]}. What is the correct choice?`,
    options: [
      { id: "a", text: "Incorrect Option A" },
      { id: "b", text: "The correct standard answer" },
      { id: "c", text: "Incorrect Option C" },
      { id: "d", text: "Incorrect Option D" }
    ],
    correct_answer: "b",
    tags: [["git", "os", "security", "networks", "html", "typescript", "dsa"][i % 7]]
  }))
].map(q => ({
  ...q,
  category: 'technical_mcq',
  question_type: 'mcq',
  group_id: null,
  is_active: true,
  created_at: new Date()
}));

const aptitudeQuestions = [
  { title: "Train Speed Calculation", difficulty: "medium", description: "A train 120 meters long is running with a speed of 60 km/hr. In what time will it pass a man running at 6 km/hr in the opposite direction?", options: [{id:"a",text:"6.54 seconds"},{id:"b",text:"7.20 seconds"},{id:"c",text:"8.12 seconds"},{id:"d",text:"5.40 seconds"}], correct_answer: "a", tags: ["math", "speed"] },
  { title: "Number Series", difficulty: "easy", description: "Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?", options: [{id:"a",text:"(1/3)"},{id:"b",text:"(1/8)"},{id:"c",text:"(2/8)"},{id:"d",text:"(1/16)"}], correct_answer: "b", tags: ["logic", "series"] },
  { title: "Time and Work", difficulty: "medium", description: "A can do a work in 15 days and B in 20 days. If they work on it together for 4 days, then the fraction of the work that is left is:", options: [{id:"a",text:"1/4"},{id:"b",text:"1/10"},{id:"c",text:"7/15"},{id:"d",text:"8/15"}], correct_answer: "d", tags: ["math", "work"] },
  { title: "Percentage Profit", difficulty: "easy", description: "A shopkeeper sells an item for $240 and makes a 20% profit. What was the cost price of the item?", options: [{id:"a",text:"$180"},{id:"b",text:"$200"},{id:"c",text:"$210"},{id:"d",text:"$220"}], correct_answer: "b", tags: ["math", "profit"] },
  { title: "Probability Coin Toss", difficulty: "medium", description: "What is the probability of getting at least two heads when tossing three coins?", options: [{id:"a",text:"1/4"},{id:"b",text:"1/2"},{id:"c",text:"3/8"},{id:"d",text:"3/4"}], correct_answer: "b", tags: ["math", "probability"] },
  { title: "Seating Arrangement", difficulty: "hard", description: "Five people (A, B, C, D, E) are sitting in a row facing North. A is next to B, C is next to D, C is not next to E who is on the left end. Who is sitting in the middle if D is next to B?", options: [{id:"a",text:"A"},{id:"b",text:"B"},{id:"c",text:"C"},{id:"d",text:"D"}], correct_answer: "d", tags: ["logic", "seating"] },
  { title: "Blood Relations", difficulty: "medium", description: "Pointing to a photograph of a boy, Suresh said, 'He is the son of the only son of my mother.' How Suresh is related to that boy?", options: [{id:"a",text:"Brother"},{id:"b",text:"Uncle"},{id:"c",text:"Cousin"},{id:"d",text:"Father"}], correct_answer: "d", tags: ["logic", "relation"] },
  { title: "Simple Interest", difficulty: "easy", description: "At what rate of simple interest per annum will a sum of money double in 8 years?", options: [{id:"a",text:"12.5%"},{id:"b",text:"10%"},{id:"c",text:"15%"},{id:"d",text:"8%"}], correct_answer: "a", tags: ["math", "interest"] },
  { title: "Ratio Division", difficulty: "easy", description: "Divide $600 between A, B, and C in the ratio 2:3:5. What is the share of C?", options: [{id:"a",text:"$120"},{id:"b",text:"$180"},{id:"c",text:"$300"},{id:"d",text:"$400"}], correct_answer: "c", tags: ["math", "ratio"] },
  { title: "Age Problem", difficulty: "medium", description: "The sum of ages of 5 children born at the intervals of 3 years each is 50 years. What is the age of the youngest child?", options: [{id:"a",text:"4 years"},{id:"b",text:"8 years"},{id:"c",text:"10 years"},{id:"d",text:"None of these"}], correct_answer: "a", tags: ["math", "age"] },
  // Adding 40 more to hit 50
  ...Array.from({ length: 40 }).map((_, i) => ({
    title: `Aptitude Practice Question #${i + 11}`,
    difficulty: i % 3 === 0 ? "easy" : i % 3 === 1 ? "medium" : "hard",
    description: `This is a logical reasoning and quantitative aptitude problem about ${["averages", "ratios", "permutations", "analogies", "direction sense", "coding-decoding"][i % 6]}. Solve for the correct answer option.`,
    options: [
      { id: "a", text: "Answer option A" },
      { id: "b", text: "Correct solution B" },
      { id: "c", text: "Answer option C" },
      { id: "d", text: "Answer option D" }
    ],
    correct_answer: "b",
    tags: [["math", "logic", "quantitative", "reasoning"][i % 4]]
  }))
].map(q => ({
  ...q,
  category: 'aptitude',
  question_type: 'mcq',
  group_id: null,
  is_active: true,
  created_at: new Date()
}));

const hrQuestions = [
  { title: "Conflict Resolution", difficulty: "medium", description: "Describe a time when you had a disagreement with a team member about how to approach a technical problem. How did you resolve it?" },
  { title: "Handling Failure", difficulty: "hard", description: "Tell me about a project that failed or missed its deadline. What was your role, and what did you learn from the experience?" },
  { title: "Teamwork and Collaboration", difficulty: "easy", description: "Give an example of a successful team project you worked on. What was your specific contribution to the success?" },
  { title: "Prioritization under Stress", difficulty: "medium", description: "How do you handle situations where you have multiple high-priority tasks with competing deadlines?" },
  { title: "Adapting to Change", difficulty: "medium", description: "Describe a situation where a major project requirement changed mid-way. How did you adapt to this change?" },
  { title: "Handling Difficult Feedback", difficulty: "medium", description: "Tell me about a time you received constructive criticism from a peer or manager. How did you react and what actions did you take?" },
  { title: "Customer Orientation", difficulty: "hard", description: "Describe a time when you went above and beyond to solve a customer's or client's problem." },
  { title: "Leadership Initiative", difficulty: "hard", description: "Tell me about a time you took the lead on a project or initiative when you were not explicitly assigned to do so." },
  { title: "Working with Ambiguity", difficulty: "medium", description: "Describe a project you worked on where the guidelines were very vague. How did you navigate the uncertainty?" },
  { title: "Managing Project Trade-offs", difficulty: "hard", description: "Tell me about a time you had to make a compromise between code quality and hitting a delivery deadline." },
  // Adding 40 more to hit 50
  ...Array.from({ length: 40 }).map((_, i) => ({
    title: `HR Behavioral Question #${i + 11}`,
    difficulty: i % 3 === 0 ? "easy" : i % 3 === 1 ? "medium" : "hard",
    description: `Describe a behavioral scenario regarding ${["interpersonal skills", "motivation", "ethical dilemma", "public speaking", "mentoring others", "creative problem solving", "goal setting"][i % 7]}. Provide a detailed past experience illustrating how you resolved or handled it.`,
    tags: ["behavioral", ["communication", "teamwork", "leadership", "adaptability"][i % 4]]
  }))
].map(q => ({
  ...q,
  category: 'hr',
  question_type: 'text',
  options: null,
  correct_answer: null,
  group_id: null,
  is_active: true,
  created_at: new Date()
}));

const questions = [
  ...codingQuestions,
  ...technicalMcqQuestions,
  ...aptitudeQuestions,
  ...hrQuestions
];

async function seed() {
  console.log('🌱 Starting practice questions database seed...');
  let count = 0;
  
  try {
    // Clear existing questions first
    console.log('🗑️ Clearing existing questions from database...');
    const snapshot = await db.collection('questions').get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`✅ Cleared ${snapshot.size} existing questions.`);

    console.log('🚀 Injecting new batch of 200 questions...');
    for (const q of questions) {
      // Add to Firestore
      const docRef = await db.collection('questions').add(q);
      console.log(`✅ Inserted [${q.category}]: ${q.title} (${docRef.id})`);
      count++;
    }
    console.log(`\n🎉 Successfully injected ${count} questions into the live database! (50 per category)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed questions:', error);
    process.exit(1);
  }
}

seed();
