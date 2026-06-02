// seedAllQuestions.js
// Run: node src/scripts/seedAllQuestions.js
// Seeds 50+ HR, 50+ Technical MCQ, 50+ Aptitude questions + 50 coding per 23 languages
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smart_resume_verifier',
});

// ═══════════════════════════════════════════
// HR QUESTIONS (50 behavioral/soft-skill)
// ═══════════════════════════════════════════
const hrQuestions = [
  { t: 'Tell me about yourself', d: 'Give a brief professional summary covering your background, key skills, and career goals.', diff: 'easy' },
  { t: 'Why do you want this job?', d: 'Explain what attracted you to this role and how it aligns with your career aspirations.', diff: 'easy' },
  { t: 'Describe your greatest strength', d: 'Identify your top professional strength and provide a real-world example demonstrating it.', diff: 'easy' },
  { t: 'What is your biggest weakness?', d: 'Honestly describe a weakness and what steps you are taking to overcome it.', diff: 'easy' },
  { t: 'Where do you see yourself in 5 years?', d: 'Share your professional goals for the next five years and how this role fits into that plan.', diff: 'easy' },
  { t: 'Why are you leaving your current job?', d: 'Explain the reasons for wanting to move on, focusing on positive motivations.', diff: 'easy' },
  { t: 'Describe a time you handled conflict at work', d: 'Share a specific conflict situation, what actions you took, and the resolution achieved.', diff: 'medium' },
  { t: 'Tell me about a time you failed', d: 'Describe a professional failure, what you learned from it, and how you applied that learning.', diff: 'medium' },
  { t: 'How do you handle pressure and stress?', d: 'Describe your strategies for managing stressful situations with a concrete example.', diff: 'medium' },
  { t: 'Describe your leadership style', d: 'Explain how you lead others and provide an example of successful leadership.', diff: 'medium' },
  { t: 'Tell me about a time you went above and beyond', d: 'Share a specific instance where you exceeded expectations and what drove you.', diff: 'medium' },
  { t: 'How do you prioritize tasks?', d: 'Walk through your method for handling multiple competing priorities with examples.', diff: 'easy' },
  { t: 'Describe a time you had to learn something quickly', d: 'Share a situation where you needed to acquire a new skill rapidly and how you accomplished it.', diff: 'medium' },
  { t: 'How do you handle criticism?', d: 'Describe how you receive and act on constructive feedback with a specific example.', diff: 'medium' },
  { t: 'Tell me about a successful team project', d: 'Describe a team project you contributed to, your role, and the outcome.', diff: 'easy' },
  { t: 'What motivates you?', d: 'Explain the factors that drive your best performance at work.', diff: 'easy' },
  { t: 'Describe a difficult decision you made', d: 'Walk through a tough decision, the options considered, and the reasoning behind your choice.', diff: 'hard' },
  { t: 'How do you handle disagreement with a manager?', d: 'Describe a situation where you disagreed with your boss and how you navigated it professionally.', diff: 'hard' },
  { t: 'Tell me about a time you had to persuade someone', d: 'Share how you convinced a colleague or stakeholder to adopt your viewpoint or approach.', diff: 'medium' },
  { t: 'What would your previous manager say about you?', d: 'Describe how your former supervisor would characterize your work ethic and contributions.', diff: 'easy' },
  { t: 'How do you handle ambiguity?', d: 'Describe a situation with unclear requirements and how you moved forward effectively.', diff: 'hard' },
  { t: 'What is your approach to work-life balance?', d: 'Explain how you maintain productivity while preserving personal well-being.', diff: 'easy' },
  { t: 'Describe a time you mentored someone', d: 'Share your experience guiding or coaching a colleague and the impact it had.', diff: 'medium' },
  { t: 'How do you stay current in your field?', d: 'Describe your methods for keeping skills and knowledge up-to-date.', diff: 'easy' },
  { t: 'Tell me about a creative solution you devised', d: 'Share an innovative approach to a problem that yielded positive results.', diff: 'hard' },
  { t: 'Describe your ideal work environment', d: 'Explain what kind of workplace culture and conditions help you perform your best.', diff: 'easy' },
  { t: 'How do you build relationships with new colleagues?', d: 'Describe your approach to connecting with new team members.', diff: 'easy' },
  { t: 'Tell me about a time you managed multiple deadlines', d: 'Walk through how you organized and delivered on overlapping deadlines.', diff: 'medium' },
  { t: 'How would you deal with an underperforming team member?', d: 'Explain your approach to addressing poor performance while maintaining team morale.', diff: 'hard' },
  { t: 'Describe a time you received negative feedback', d: 'How did you respond to critical feedback and what changes did you make?', diff: 'medium' },
  { t: 'What do you know about our company?', d: 'Demonstrate your research about the company, its mission, values, and recent initiatives.', diff: 'easy' },
  { t: 'What makes you unique as a candidate?', d: 'Highlight what sets you apart from other candidates applying for this role.', diff: 'medium' },
  { t: 'How do you handle tight deadlines?', d: 'Provide an example of delivering quality work under severe time constraints.', diff: 'medium' },
  { t: 'Tell me about a time you took initiative', d: 'Describe a situation where you proactively identified and solved a problem.', diff: 'medium' },
  { t: 'Describe your communication style', d: 'Explain how you adapt your communication for different audiences and situations.', diff: 'easy' },
  { t: 'How do you deal with a fast-changing environment?', d: 'Share an example of adapting to rapid organizational or technical change.', diff: 'hard' },
  { t: 'Tell me about an ethical dilemma at work', d: 'Describe a situation involving an ethical challenge and how you resolved it.', diff: 'hard' },
  { t: 'What questions do you have for us?', d: 'Prepare thoughtful questions that demonstrate genuine interest and research about the role.', diff: 'easy' },
  { t: 'How do you measure personal success?', d: 'Explain the criteria or benchmarks you use to evaluate your own performance.', diff: 'easy' },
  { t: 'Describe a cross-functional project you worked on', d: 'Share your experience collaborating with teams from different departments.', diff: 'medium' },
  { t: 'How do you handle a situation where you disagree with company policy?', d: 'Explain your approach to navigating internal policy disagreements constructively.', diff: 'hard' },
  { t: 'Tell me about a time you had to adapt your approach mid-project', d: 'Describe pivoting your strategy and the outcome of that change.', diff: 'medium' },
  { t: 'What is your biggest professional achievement?', d: 'Share your proudest work accomplishment and why it matters to you.', diff: 'easy' },
  { t: 'How do you keep yourself organized?', d: 'Walk through the tools and techniques you use for organization and productivity.', diff: 'easy' },
  { t: 'Describe a time you had to deliver bad news', d: 'Explain how you communicated difficult information to a team or stakeholder.', diff: 'hard' },
  { t: 'What role do you typically play in a team?', d: 'Identify whether you tend to lead, support, or mediate, with examples.', diff: 'easy' },
  { t: 'How do you approach continuous improvement?', d: 'Describe practices you follow to consistently improve your skills and processes.', diff: 'medium' },
  { t: 'Tell me about a time you had to manage up', d: 'Describe influencing or guiding a senior leader toward a better decision.', diff: 'hard' },
  { t: 'Describe how you handle competing stakeholder interests', d: 'Explain your approach to balancing conflicting priorities from different stakeholders.', diff: 'hard' },
  { t: 'What would you do in your first 90 days?', d: 'Outline your plan for ramping up and making an impact in a new role.', diff: 'medium' },
];

// ═══════════════════════════════════════════
// TECHNICAL MCQ QUESTIONS (60)
// ═══════════════════════════════════════════
const technicalQuestions = [
  { t: 'What does REST stand for?', d: 'Choose the correct expansion of REST.', opts: [{id:'a',text:'Representational State Transfer'},{id:'b',text:'Remote Execution Standard'},{id:'c',text:'Resource State Type'},{id:'d',text:'Real-time Service Technology'}], ans: 'a', diff: 'easy', tags: ['rest','api'] },
  { t: 'Which HTTP method is idempotent?', d: 'Select the idempotent HTTP method.', opts: [{id:'a',text:'POST'},{id:'b',text:'PUT'},{id:'c',text:'PATCH'},{id:'d',text:'CONNECT'}], ans: 'b', diff: 'easy', tags: ['http','rest'] },
  { t: 'Time complexity of binary search', d: 'What is the time complexity of binary search on a sorted array?', opts: [{id:'a',text:'O(n)'},{id:'b',text:'O(n²)'},{id:'c',text:'O(log n)'},{id:'d',text:'O(1)'}], ans: 'c', diff: 'easy', tags: ['algorithms','searching'] },
  { t: 'What is a foreign key?', d: 'In relational databases, a foreign key is:', opts: [{id:'a',text:'A primary key in another table referenced here'},{id:'b',text:'A key used for encryption'},{id:'c',text:'An index on the primary key'},{id:'d',text:'A unique key that cannot be null'}], ans: 'a', diff: 'easy', tags: ['database','sql'] },
  { t: 'What is polymorphism?', d: 'In OOP, polymorphism means:', opts: [{id:'a',text:'Objects of different classes treated as same type'},{id:'b',text:'Classes can only have one method'},{id:'c',text:'Variables cannot change type'},{id:'d',text:'Inheritance is disabled'}], ans: 'a', diff: 'easy', tags: ['oop','concepts'] },
  { t: 'Which sorting algorithm has best average case?', d: 'Among these, which has O(n log n) average case?', opts: [{id:'a',text:'Bubble Sort'},{id:'b',text:'Selection Sort'},{id:'c',text:'Quick Sort'},{id:'d',text:'Insertion Sort'}], ans: 'c', diff: 'medium', tags: ['algorithms','sorting'] },
  { t: 'Deadlock requires how many conditions?', d: 'How many conditions must hold simultaneously for deadlock?', opts: [{id:'a',text:'2'},{id:'b',text:'3'},{id:'c',text:'4'},{id:'d',text:'5'}], ans: 'c', diff: 'medium', tags: ['os','concurrency'] },
  { t: 'What does ACID stand for?', d: 'In database transactions, ACID stands for:', opts: [{id:'a',text:'Atomicity, Consistency, Isolation, Durability'},{id:'b',text:'Access, Control, Identity, Data'},{id:'c',text:'Async, Concurrent, Indexed, Distributed'},{id:'d',text:'Atomic, Complete, Integrated, Durable'}], ans: 'a', diff: 'easy', tags: ['database','transactions'] },
  { t: 'What is DNS?', d: 'DNS resolves:', opts: [{id:'a',text:'Domain names to IP addresses'},{id:'b',text:'IP addresses to MAC addresses'},{id:'c',text:'URLs to file paths'},{id:'d',text:'Ports to protocols'}], ans: 'a', diff: 'easy', tags: ['networking','dns'] },
  { t: 'What is TCP vs UDP?', d: 'TCP differs from UDP primarily because TCP is:', opts: [{id:'a',text:'Connection-oriented and reliable'},{id:'b',text:'Faster and connectionless'},{id:'c',text:'Used only for video streaming'},{id:'d',text:'An application layer protocol'}], ans: 'a', diff: 'easy', tags: ['networking','protocols'] },
  { t: 'What is a stack overflow?', d: 'A stack overflow occurs when:', opts: [{id:'a',text:'The call stack exceeds its size limit'},{id:'b',text:'Memory is allocated dynamically'},{id:'c',text:'A variable exceeds int range'},{id:'d',text:'The heap runs out of space'}], ans: 'a', diff: 'easy', tags: ['memory','debugging'] },
  { t: 'Purpose of an index in a database', d: 'Database indexes are used to:', opts: [{id:'a',text:'Speed up data retrieval operations'},{id:'b',text:'Encrypt stored data'},{id:'c',text:'Enforce data types'},{id:'d',text:'Prevent SQL injection'}], ans: 'a', diff: 'easy', tags: ['database','performance'] },
  { t: 'What is a hash table?', d: 'A hash table provides average-case lookup time of:', opts: [{id:'a',text:'O(1)'},{id:'b',text:'O(log n)'},{id:'c',text:'O(n)'},{id:'d',text:'O(n²)'}], ans: 'a', diff: 'easy', tags: ['data-structures','hashing'] },
  { t: 'What is JWT?', d: 'JSON Web Token is used for:', opts: [{id:'a',text:'Authentication and information exchange'},{id:'b',text:'Database queries'},{id:'c',text:'CSS rendering'},{id:'d',text:'File compression'}], ans: 'a', diff: 'easy', tags: ['security','auth'] },
  { t: 'What is a race condition?', d: 'A race condition occurs when:', opts: [{id:'a',text:'Output depends on timing of uncontrollable events'},{id:'b',text:'A program runs too slowly'},{id:'c',text:'Two programs compete for CPU'},{id:'d',text:'Memory is accessed sequentially'}], ans: 'a', diff: 'medium', tags: ['concurrency','bugs'] },
  { t: 'Which data structure uses FIFO?', d: 'FIFO (First In, First Out) is a property of:', opts: [{id:'a',text:'Stack'},{id:'b',text:'Queue'},{id:'c',text:'Tree'},{id:'d',text:'Graph'}], ans: 'b', diff: 'easy', tags: ['data-structures'] },
  { t: 'What is the CAP theorem?', d: 'The CAP theorem states that a distributed system can guarantee at most:', opts: [{id:'a',text:'2 of: Consistency, Availability, Partition Tolerance'},{id:'b',text:'All 3: Consistency, Availability, Partition Tolerance'},{id:'c',text:'1 of: Consistency, Availability, Partition Tolerance'},{id:'d',text:'None — all must be sacrificed'}], ans: 'a', diff: 'hard', tags: ['distributed','systems'] },
  { t: 'What is normalization?', d: 'Database normalization eliminates:', opts: [{id:'a',text:'Data redundancy and anomalies'},{id:'b',text:'All indexes'},{id:'c',text:'Foreign keys'},{id:'d',text:'Primary keys'}], ans: 'a', diff: 'easy', tags: ['database','normalization'] },
  { t: 'What is a microservice?', d: 'Microservices architecture means applications are built as:', opts: [{id:'a',text:'Small, independently deployable services'},{id:'b',text:'One large monolithic application'},{id:'c',text:'Client-side only applications'},{id:'d',text:'Services that share one database'}], ans: 'a', diff: 'medium', tags: ['architecture','microservices'] },
  { t: 'What is Big O notation?', d: 'Big O notation describes:', opts: [{id:'a',text:'Upper bound of algorithm time/space complexity'},{id:'b',text:'Exact running time in seconds'},{id:'c',text:'Memory address layout'},{id:'d',text:'Number of code lines'}], ans: 'a', diff: 'easy', tags: ['algorithms','complexity'] },
  { t: 'What is a linked list advantage over arrays?', d: 'Linked lists excel over arrays in:', opts: [{id:'a',text:'Dynamic size and O(1) insertion at known position'},{id:'b',text:'Random access speed'},{id:'c',text:'Cache locality'},{id:'d',text:'Memory efficiency for small data'}], ans: 'a', diff: 'easy', tags: ['data-structures'] },
  { t: 'What is a Docker container?', d: 'A Docker container is:', opts: [{id:'a',text:'A lightweight, standalone executable package'},{id:'b',text:'A virtual machine'},{id:'c',text:'A database'},{id:'d',text:'A programming language'}], ans: 'a', diff: 'easy', tags: ['devops','docker'] },
  { t: 'What is CI/CD?', d: 'CI/CD stands for:', opts: [{id:'a',text:'Continuous Integration / Continuous Delivery'},{id:'b',text:'Code Integration / Code Deployment'},{id:'c',text:'Central Interface / Central Database'},{id:'d',text:'Container Integration / Container Delivery'}], ans: 'a', diff: 'easy', tags: ['devops','cicd'] },
  { t: 'What is SQL injection?', d: 'SQL injection is:', opts: [{id:'a',text:'Inserting malicious SQL via user input'},{id:'b',text:'Running SQL queries too fast'},{id:'c',text:'A method to optimize queries'},{id:'d',text:'A backup technique'}], ans: 'a', diff: 'medium', tags: ['security','sql'] },
  { t: 'Difference between process and thread', d: 'A thread differs from a process because threads:', opts: [{id:'a',text:'Share memory space within the same process'},{id:'b',text:'Have their own memory space'},{id:'c',text:'Cannot communicate with each other'},{id:'d',text:'Run on separate machines'}], ans: 'a', diff: 'medium', tags: ['os','concurrency'] },
  { t: 'What is garbage collection?', d: 'Garbage collection in programming:', opts: [{id:'a',text:'Automatically reclaims unused memory'},{id:'b',text:'Deletes unused files'},{id:'c',text:'Optimizes CPU usage'},{id:'d',text:'Manages network connections'}], ans: 'a', diff: 'easy', tags: ['memory','gc'] },
  { t: 'What is a binary tree?', d: 'A binary tree is a tree where each node has at most:', opts: [{id:'a',text:'2 children'},{id:'b',text:'3 children'},{id:'c',text:'1 child'},{id:'d',text:'Unlimited children'}], ans: 'a', diff: 'easy', tags: ['data-structures','trees'] },
  { t: 'What is virtual memory?', d: 'Virtual memory allows:', opts: [{id:'a',text:'Programs to use more memory than physically available'},{id:'b',text:'Faster CPU execution'},{id:'c',text:'Programs to run without RAM'},{id:'d',text:'Direct hardware access'}], ans: 'a', diff: 'medium', tags: ['os','memory'] },
  { t: 'Saga pattern in microservices', d: 'The Saga pattern handles:', opts: [{id:'a',text:'Distributed transactions without 2PC'},{id:'b',text:'Load balancing'},{id:'c',text:'Service discovery'},{id:'d',text:'Authentication'}], ans: 'a', diff: 'hard', tags: ['microservices','distributed'] },
  { t: 'What is GraphQL?', d: 'GraphQL is:', opts: [{id:'a',text:'A query language for APIs'},{id:'b',text:'A graph database'},{id:'c',text:'A CSS framework'},{id:'d',text:'A testing tool'}], ans: 'a', diff: 'easy', tags: ['api','graphql'] },
  { t: 'What are WebSockets?', d: 'WebSockets provide:', opts: [{id:'a',text:'Full-duplex communication over single TCP connection'},{id:'b',text:'One-way server push only'},{id:'c',text:'File transfer protocol'},{id:'d',text:'Database connections'}], ans: 'a', diff: 'medium', tags: ['networking','websockets'] },
  { t: 'What is an ORM?', d: 'Object-Relational Mapping:', opts: [{id:'a',text:'Maps database tables to programming objects'},{id:'b',text:'Optimizes raw SQL queries'},{id:'c',text:'Manages server resources'},{id:'d',text:'Encrypts database connections'}], ans: 'a', diff: 'easy', tags: ['database','orm'] },
  { t: 'What is DFS vs BFS?', d: 'DFS uses which data structure?', opts: [{id:'a',text:'Stack'},{id:'b',text:'Queue'},{id:'c',text:'Array'},{id:'d',text:'Hash table'}], ans: 'a', diff: 'medium', tags: ['algorithms','graphs'] },
  { t: 'What is a load balancer?', d: 'A load balancer:', opts: [{id:'a',text:'Distributes traffic across multiple servers'},{id:'b',text:'Increases database speed'},{id:'c',text:'Compresses files'},{id:'d',text:'Manages DNS records'}], ans: 'a', diff: 'medium', tags: ['systems','scaling'] },
  { t: 'What are design patterns?', d: 'Design patterns in software engineering are:', opts: [{id:'a',text:'Reusable solutions to common problems'},{id:'b',text:'UI design guidelines'},{id:'c',text:'Database schemas'},{id:'d',text:'Testing frameworks'}], ans: 'a', diff: 'easy', tags: ['design-patterns'] },
  { t: 'Singleton pattern purpose', d: 'The Singleton pattern ensures:', opts: [{id:'a',text:'Only one instance of a class exists'},{id:'b',text:'Multiple inheritance'},{id:'c',text:'Thread safety'},{id:'d',text:'Data encryption'}], ans: 'a', diff: 'medium', tags: ['design-patterns'] },
  { t: 'What is NoSQL?', d: 'NoSQL databases are best for:', opts: [{id:'a',text:'Unstructured/semi-structured data with flexible schemas'},{id:'b',text:'Only SQL queries'},{id:'c',text:'Replacing all relational databases'},{id:'d',text:'Small data sets only'}], ans: 'a', diff: 'easy', tags: ['database','nosql'] },
  { t: 'What is Redis used for?', d: 'Redis is primarily:', opts: [{id:'a',text:'An in-memory data store for caching'},{id:'b',text:'A relational database'},{id:'c',text:'A front-end framework'},{id:'d',text:'A CI/CD tool'}], ans: 'a', diff: 'easy', tags: ['database','caching'] },
  { t: 'What is CORS?', d: 'CORS stands for:', opts: [{id:'a',text:'Cross-Origin Resource Sharing'},{id:'b',text:'Central Origin Request Service'},{id:'c',text:'Cached Object Retrieval System'},{id:'d',text:'Client-Only Resource Scope'}], ans: 'a', diff: 'easy', tags: ['web','security'] },
  { t: 'What is the Observer pattern?', d: 'The Observer pattern allows:', opts: [{id:'a',text:'Objects to be notified of state changes'},{id:'b',text:'Single instance creation'},{id:'c',text:'Method overriding'},{id:'d',text:'Data encryption'}], ans: 'a', diff: 'medium', tags: ['design-patterns'] },
  { t: 'What is sharding?', d: 'Database sharding involves:', opts: [{id:'a',text:'Splitting data across multiple database instances'},{id:'b',text:'Encrypting database fields'},{id:'c',text:'Creating backup copies'},{id:'d',text:'Deleting old records'}], ans: 'a', diff: 'hard', tags: ['database','scaling'] },
  { t: 'What is event-driven architecture?', d: 'Event-driven architecture:', opts: [{id:'a',text:'Components communicate via events/messages'},{id:'b',text:'Uses only synchronous calls'},{id:'c',text:'Requires a monolithic structure'},{id:'d',text:'Avoids all message queues'}], ans: 'a', diff: 'medium', tags: ['architecture','events'] },
  { t: 'What is a CDN?', d: 'A Content Delivery Network:', opts: [{id:'a',text:'Caches content across geographically distributed servers'},{id:'b',text:'Creates database connections'},{id:'c',text:'Manages source code'},{id:'d',text:'Runs unit tests'}], ans: 'a', diff: 'easy', tags: ['web','performance'] },
  { t: 'What is Kubernetes?', d: 'Kubernetes is:', opts: [{id:'a',text:'A container orchestration platform'},{id:'b',text:'A programming language'},{id:'c',text:'A database management system'},{id:'d',text:'A version control system'}], ans: 'a', diff: 'medium', tags: ['devops','kubernetes'] },
  { t: 'Heap vs Stack memory', d: 'The heap differs from the stack because heap:', opts: [{id:'a',text:'Stores dynamically allocated memory'},{id:'b',text:'Is faster to access'},{id:'c',text:'Is automatically managed in C'},{id:'d',text:'Has a fixed size'}], ans: 'a', diff: 'medium', tags: ['memory','os'] },
  { t: 'What is an API Gateway?', d: 'An API Gateway:', opts: [{id:'a',text:'Single entry point for all client requests to microservices'},{id:'b',text:'Stores API documentation'},{id:'c',text:'Generates API code'},{id:'d',text:'Tests API endpoints'}], ans: 'a', diff: 'medium', tags: ['microservices','architecture'] },
  { t: 'Time complexity of merge sort', d: 'Merge sort has worst-case time complexity:', opts: [{id:'a',text:'O(n log n)'},{id:'b',text:'O(n²)'},{id:'c',text:'O(n)'},{id:'d',text:'O(log n)'}], ans: 'a', diff: 'medium', tags: ['algorithms','sorting'] },
  { t: 'What is XSS?', d: 'Cross-Site Scripting (XSS) is:', opts: [{id:'a',text:'Injecting malicious scripts into web pages'},{id:'b',text:'A CSS framework'},{id:'c',text:'A server monitoring tool'},{id:'d',text:'A database optimization'}], ans: 'a', diff: 'medium', tags: ['security','web'] },
  { t: 'What is a B-tree?', d: 'B-trees are commonly used in:', opts: [{id:'a',text:'Database indexing and file systems'},{id:'b',text:'Only sorting algorithms'},{id:'c',text:'Network routing'},{id:'d',text:'UI rendering'}], ans: 'a', diff: 'hard', tags: ['data-structures','database'] },
  { t: 'What is eventual consistency?', d: 'Eventual consistency means:', opts: [{id:'a',text:'All replicas will eventually return the same value'},{id:'b',text:'Data is always immediately consistent'},{id:'c',text:'Consistency is never achieved'},{id:'d',text:'Only one replica exists'}], ans: 'a', diff: 'hard', tags: ['distributed','consistency'] },
];

// ═══════════════════════════════════════════
// APTITUDE QUESTIONS (50)
// ═══════════════════════════════════════════
const aptitudeQuestions = [
  { t: 'Speed and Distance I', d: 'A train travels at 60 km/h for 3 hours. What distance does it cover?', opts: [{id:'a',text:'120 km'},{id:'b',text:'180 km'},{id:'c',text:'200 km'},{id:'d',text:'240 km'}], ans: 'b', diff: 'easy', tags: ['speed','distance'] },
  { t: 'Percentage Calculation', d: 'What is 25% of 480?', opts: [{id:'a',text:'100'},{id:'b',text:'110'},{id:'c',text:'120'},{id:'d',text:'125'}], ans: 'c', diff: 'easy', tags: ['percentage'] },
  { t: 'Profit and Loss I', d: 'A product bought at ₹500 is sold at ₹600. What is the profit %?', opts: [{id:'a',text:'10%'},{id:'b',text:'15%'},{id:'c',text:'20%'},{id:'d',text:'25%'}], ans: 'c', diff: 'easy', tags: ['profit-loss'] },
  { t: 'Simple Interest', d: 'Find SI on ₹10000 at 8% for 2 years.', opts: [{id:'a',text:'₹1200'},{id:'b',text:'₹1600'},{id:'c',text:'₹1800'},{id:'d',text:'₹2000'}], ans: 'b', diff: 'easy', tags: ['interest'] },
  { t: 'Average of Numbers', d: 'Average of 12, 15, 18, 21, 24 is:', opts: [{id:'a',text:'17'},{id:'b',text:'18'},{id:'c',text:'19'},{id:'d',text:'20'}], ans: 'b', diff: 'easy', tags: ['average'] },
  { t: 'Time and Work I', d: 'A does a job in 10 days, B in 15 days. Together how many days?', opts: [{id:'a',text:'5'},{id:'b',text:'6'},{id:'c',text:'7'},{id:'d',text:'8'}], ans: 'b', diff: 'easy', tags: ['time-work'] },
  { t: 'Ratio and Proportion', d: 'If A:B = 3:4 and B:C = 2:3, find A:C.', opts: [{id:'a',text:'1:2'},{id:'b',text:'3:6'},{id:'c',text:'1:3'},{id:'d',text:'2:3'}], ans: 'a', diff: 'medium', tags: ['ratio'] },
  { t: 'Number Series I', d: 'Find the next number: 2, 6, 12, 20, 30, ?', opts: [{id:'a',text:'40'},{id:'b',text:'42'},{id:'c',text:'44'},{id:'d',text:'45'}], ans: 'b', diff: 'easy', tags: ['series','pattern'] },
  { t: 'Compound Interest', d: 'CI on ₹5000 at 10% for 2 years compounded annually:', opts: [{id:'a',text:'₹1000'},{id:'b',text:'₹1050'},{id:'c',text:'₹1100'},{id:'d',text:'₹1150'}], ans: 'b', diff: 'medium', tags: ['interest'] },
  { t: 'Probability I', d: 'Probability of getting a head in a single coin toss:', opts: [{id:'a',text:'1/4'},{id:'b',text:'1/3'},{id:'c',text:'1/2'},{id:'d',text:'1'}], ans: 'c', diff: 'easy', tags: ['probability'] },
  { t: 'Boats and Streams', d: 'Speed of boat in still water 10 km/h, stream 2 km/h. Downstream speed?', opts: [{id:'a',text:'8 km/h'},{id:'b',text:'10 km/h'},{id:'c',text:'12 km/h'},{id:'d',text:'14 km/h'}], ans: 'c', diff: 'easy', tags: ['speed','streams'] },
  { t: 'Age Problem I', d: 'Father is 30 years older than son. In 5 years, father is 3× son\'s age. Son\'s current age?', opts: [{id:'a',text:'10'},{id:'b',text:'12'},{id:'c',text:'15'},{id:'d',text:'8'}], ans: 'a', diff: 'medium', tags: ['age-problems'] },
  { t: 'LCM and HCF', d: 'LCM of 12 and 18 is:', opts: [{id:'a',text:'24'},{id:'b',text:'36'},{id:'c',text:'48'},{id:'d',text:'72'}], ans: 'b', diff: 'easy', tags: ['lcm-hcf'] },
  { t: 'Permutation', d: 'How many ways to arrange 4 people in a row?', opts: [{id:'a',text:'12'},{id:'b',text:'16'},{id:'c',text:'24'},{id:'d',text:'32'}], ans: 'c', diff: 'easy', tags: ['permutation'] },
  { t: 'Combination', d: 'How many ways to choose 3 from 5?', opts: [{id:'a',text:'5'},{id:'b',text:'10'},{id:'c',text:'15'},{id:'d',text:'20'}], ans: 'b', diff: 'easy', tags: ['combination'] },
  { t: 'Pipes and Cisterns', d: 'Pipe A fills in 12 hrs, B empties in 18 hrs. Both open, time to fill?', opts: [{id:'a',text:'24 hrs'},{id:'b',text:'30 hrs'},{id:'c',text:'36 hrs'},{id:'d',text:'42 hrs'}], ans: 'c', diff: 'medium', tags: ['pipes'] },
  { t: 'Train Crossing I', d: 'A 200m train at 72 km/h crosses a pole in how many seconds?', opts: [{id:'a',text:'8'},{id:'b',text:'10'},{id:'c',text:'12'},{id:'d',text:'15'}], ans: 'b', diff: 'easy', tags: ['trains'] },
  { t: 'Clock Angle', d: 'Angle between clock hands at 3:00?', opts: [{id:'a',text:'60°'},{id:'b',text:'90°'},{id:'c',text:'120°'},{id:'d',text:'180°'}], ans: 'b', diff: 'easy', tags: ['clocks'] },
  { t: 'Discount Problem', d: 'Marked price ₹800, discount 15%. Selling price?', opts: [{id:'a',text:'₹640'},{id:'b',text:'₹680'},{id:'c',text:'₹700'},{id:'d',text:'₹720'}], ans: 'b', diff: 'easy', tags: ['discount'] },
  { t: 'Mixture Problem', d: 'Mix 5L of 20% solution with 10L of 50% solution. Concentration?', opts: [{id:'a',text:'30%'},{id:'b',text:'35%'},{id:'c',text:'40%'},{id:'d',text:'45%'}], ans: 'c', diff: 'medium', tags: ['mixtures'] },
  { t: 'Probability II', d: 'Probability of getting sum 7 with two dice:', opts: [{id:'a',text:'1/6'},{id:'b',text:'5/36'},{id:'c',text:'1/9'},{id:'d',text:'7/36'}], ans: 'a', diff: 'medium', tags: ['probability'] },
  { t: 'Partnership Problem', d: 'A invests ₹10000 for 12 months, B invests ₹15000 for 8 months. Profit ratio?', opts: [{id:'a',text:'1:1'},{id:'b',text:'2:1'},{id:'c',text:'1:2'},{id:'d',text:'3:2'}], ans: 'a', diff: 'medium', tags: ['partnership'] },
  { t: 'Work and Wages', d: 'A does 2/5 of work. Total wages ₹5000. A\'s share?', opts: [{id:'a',text:'₹1500'},{id:'b',text:'₹2000'},{id:'c',text:'₹2500'},{id:'d',text:'₹3000'}], ans: 'b', diff: 'easy', tags: ['work-wages'] },
  { t: 'Number Series II', d: '3, 7, 15, 31, 63, ?', opts: [{id:'a',text:'115'},{id:'b',text:'125'},{id:'c',text:'127'},{id:'d',text:'130'}], ans: 'c', diff: 'medium', tags: ['series'] },
  { t: 'Coding-Decoding I', d: 'If PAINT is coded as RCKPV, how is BRUSH coded?', opts: [{id:'a',text:'DTWUJ'},{id:'b',text:'DTWUI'},{id:'c',text:'DTVUI'},{id:'d',text:'DTWUH'}], ans: 'a', diff: 'medium', tags: ['coding-decoding'] },
  { t: 'Blood Relations', d: "A says 'B is my father's only son's daughter'. How is B related to A?", opts: [{id:'a',text:'Daughter'},{id:'b',text:'Sister'},{id:'c',text:'Niece'},{id:'d',text:'Mother'}], ans: 'a', diff: 'medium', tags: ['blood-relations'] },
  { t: 'Direction Sense I', d: 'A walks 10m North, turns left, walks 5m. Which direction is he facing?', opts: [{id:'a',text:'East'},{id:'b',text:'West'},{id:'c',text:'South'},{id:'d',text:'North'}], ans: 'b', diff: 'easy', tags: ['direction'] },
  { t: 'Calendar Problem', d: 'What day of the week was January 1, 2023?', opts: [{id:'a',text:'Saturday'},{id:'b',text:'Sunday'},{id:'c',text:'Monday'},{id:'d',text:'Tuesday'}], ans: 'b', diff: 'medium', tags: ['calendar'] },
  { t: 'Logarithm', d: 'log₂(32) = ?', opts: [{id:'a',text:'3'},{id:'b',text:'4'},{id:'c',text:'5'},{id:'d',text:'6'}], ans: 'c', diff: 'easy', tags: ['logarithm'] },
  { t: 'Progressions I', d: 'Sum of first 10 natural numbers:', opts: [{id:'a',text:'45'},{id:'b',text:'55'},{id:'c',text:'65'},{id:'d',text:'50'}], ans: 'b', diff: 'easy', tags: ['progressions'] },
  { t: 'Number Divisibility', d: 'Which number is divisible by both 3 and 4?', opts: [{id:'a',text:'16'},{id:'b',text:'18'},{id:'c',text:'24'},{id:'d',text:'28'}], ans: 'c', diff: 'easy', tags: ['divisibility'] },
  { t: 'Area of Circle', d: 'Area of circle with radius 7 cm (π=22/7):', opts: [{id:'a',text:'144 cm²'},{id:'b',text:'154 cm²'},{id:'c',text:'164 cm²'},{id:'d',text:'174 cm²'}], ans: 'b', diff: 'easy', tags: ['geometry'] },
  { t: 'Volume of Cylinder', d: 'Volume of cylinder r=7cm, h=10cm (π=22/7):', opts: [{id:'a',text:'1540 cm³'},{id:'b',text:'1440 cm³'},{id:'c',text:'1640 cm³'},{id:'d',text:'1340 cm³'}], ans: 'a', diff: 'medium', tags: ['geometry'] },
  { t: 'Relative Speed', d: 'Two cars travel towards each other at 60 km/h and 40 km/h. Relative speed?', opts: [{id:'a',text:'20 km/h'},{id:'b',text:'60 km/h'},{id:'c',text:'100 km/h'},{id:'d',text:'80 km/h'}], ans: 'c', diff: 'easy', tags: ['speed'] },
  { t: 'Venn Diagram I', d: '30 students: 18 play cricket, 20 play football, 12 play both. How many play neither?', opts: [{id:'a',text:'2'},{id:'b',text:'4'},{id:'c',text:'6'},{id:'d',text:'8'}], ans: 'b', diff: 'medium', tags: ['sets'] },
  { t: 'Algebra: Quadratic', d: 'Roots of x² - 5x + 6 = 0:', opts: [{id:'a',text:'2 and 3'},{id:'b',text:'1 and 6'},{id:'c',text:'-2 and -3'},{id:'d',text:'2 and -3'}], ans: 'a', diff: 'easy', tags: ['algebra'] },
  { t: 'Data Interpretation I', d: 'If a graph shows sales: Jan=100, Feb=150, Mar=200. Average monthly sales?', opts: [{id:'a',text:'140'},{id:'b',text:'150'},{id:'c',text:'160'},{id:'d',text:'170'}], ans: 'b', diff: 'easy', tags: ['data-interpretation'] },
  { t: 'Surds and Indices', d: '√(144) + √(81) = ?', opts: [{id:'a',text:'19'},{id:'b',text:'20'},{id:'c',text:'21'},{id:'d',text:'23'}], ans: 'c', diff: 'easy', tags: ['surds'] },
  { t: 'Time Speed Distance II', d: 'A car at 40km/h covers a distance in 3h. At 60km/h, time taken?', opts: [{id:'a',text:'1.5 hrs'},{id:'b',text:'2 hrs'},{id:'c',text:'2.5 hrs'},{id:'d',text:'1 hr'}], ans: 'b', diff: 'easy', tags: ['speed'] },
  { t: 'Successive Discount', d: 'Price after successive discounts of 10% and 20% on ₹1000:', opts: [{id:'a',text:'₹700'},{id:'b',text:'₹720'},{id:'c',text:'₹680'},{id:'d',text:'₹750'}], ans: 'b', diff: 'medium', tags: ['discount'] },
  { t: 'Surface Area of Cube', d: 'Total surface area of cube with side 5 cm:', opts: [{id:'a',text:'100 cm²'},{id:'b',text:'125 cm²'},{id:'c',text:'150 cm²'},{id:'d',text:'175 cm²'}], ans: 'c', diff: 'easy', tags: ['geometry'] },
  { t: 'Logarithm II', d: 'If log(x) = 3, then x = ?', opts: [{id:'a',text:'100'},{id:'b',text:'1000'},{id:'c',text:'10000'},{id:'d',text:'30'}], ans: 'b', diff: 'easy', tags: ['logarithm'] },
  { t: 'Trigonometry I', d: 'sin(30°) = ?', opts: [{id:'a',text:'0'},{id:'b',text:'1/2'},{id:'c',text:'√3/2'},{id:'d',text:'1'}], ans: 'b', diff: 'easy', tags: ['trigonometry'] },
  { t: 'Probability III', d: 'Drawing a red ball from a bag with 3 red, 5 blue, 2 green balls:', opts: [{id:'a',text:'3/10'},{id:'b',text:'1/3'},{id:'c',text:'2/5'},{id:'d',text:'1/2'}], ans: 'a', diff: 'easy', tags: ['probability'] },
  { t: 'Time and Work II', d: '10 workers finish in 12 days. How many workers for 8 days?', opts: [{id:'a',text:'12'},{id:'b',text:'15'},{id:'c',text:'18'},{id:'d',text:'20'}], ans: 'b', diff: 'medium', tags: ['time-work'] },
  { t: 'Allegation', d: 'Mix ₹40/kg rice with ₹60/kg rice to get ₹45/kg. Ratio?', opts: [{id:'a',text:'3:1'},{id:'b',text:'2:1'},{id:'c',text:'1:1'},{id:'d',text:'4:1'}], ans: 'a', diff: 'hard', tags: ['allegation'] },
  { t: 'Number Properties', d: 'Sum of first 20 odd numbers:', opts: [{id:'a',text:'200'},{id:'b',text:'300'},{id:'c',text:'400'},{id:'d',text:'500'}], ans: 'c', diff: 'medium', tags: ['numbers'] },
  { t: 'Mensuration', d: 'Area of triangle with base 12 cm and height 8 cm:', opts: [{id:'a',text:'36 cm²'},{id:'b',text:'48 cm²'},{id:'c',text:'60 cm²'},{id:'d',text:'96 cm²'}], ans: 'b', diff: 'easy', tags: ['geometry'] },
  { t: 'Coding-Decoding II', d: 'If 1=A, 2=B... FACE = ?', opts: [{id:'a',text:'6+1+3+5'},{id:'b',text:'7+2+4+6'},{id:'c',text:'5+1+3+5'},{id:'d',text:'6+1+3+4'}], ans: 'a', diff: 'easy', tags: ['coding-decoding'] },
  { t: 'Age Problem II', d: 'Sum of ages of A and B is 40. A is 10 years older. A\'s age?', opts: [{id:'a',text:'20'},{id:'b',text:'25'},{id:'c',text:'30'},{id:'d',text:'15'}], ans: 'b', diff: 'easy', tags: ['age-problems'] },
];

// ═══════════════════════════════════════════
// CODING QUESTIONS (23 languages × 50 each)
// ═══════════════════════════════════════════
const languages = [
  'Java','Python','C','C++','JavaScript','TypeScript','Go','Rust','Kotlin',
  'Swift','PHP','Ruby','C#','Dart','R','MATLAB','SQL','Bash','Scala',
  'Objective-C','Haskell','Perl','Julia'
];

const codingTemplates = {
  easy: [
    { title: 'Print Hello World', desc: "Write a program that outputs 'Hello World'.", expected: 'Hello World' },
    { title: 'Sum of Two Numbers', desc: 'Given a=5 and b=7, print their sum.', expected: '12' },
    { title: 'Even or Odd', desc: "Check if 10 is even. Print 'Even' or 'Odd'.", expected: 'Even' },
    { title: 'Find Maximum', desc: 'Print the maximum of 15 and 22.', expected: '22' },
    { title: 'String Length', desc: "Print the length of the string 'OpenAI'.", expected: '6' },
    { title: 'Swap Two Variables', desc: 'Swap a=3, b=5 and print both values.', expected: '5 3' },
    { title: 'Celsius to Fahrenheit', desc: 'Convert 100°C to °F and print result.', expected: '212' },
    { title: 'Check Positive Number', desc: "Check if -7 is positive. Print 'Yes' or 'No'.", expected: 'No' },
    { title: 'Area of Rectangle', desc: 'Calculate area of rectangle with l=5, w=3.', expected: '15' },
    { title: 'Last Digit', desc: 'Print the last digit of 4567.', expected: '7' },
    { title: 'Count Vowels', desc: "Count vowels in 'Education' and print the count.", expected: '5' },
    { title: 'Absolute Value', desc: 'Print absolute value of -42.', expected: '42' },
    { title: 'Is Leap Year', desc: "Check if 2024 is a leap year. Print 'true' or 'false'.", expected: 'true' },
    { title: 'Multiply Digits', desc: 'Find product of digits of 234. Print result.', expected: '24' },
    { title: 'Simple Calculator', desc: 'Print the result of 15 + 27.', expected: '42' },
    { title: 'Character to ASCII', desc: "Print ASCII value of 'A'.", expected: '65' },
    { title: 'Square of Number', desc: 'Print the square of 9.', expected: '81' },
    { title: 'Cube of Number', desc: 'Print the cube of 4.', expected: '64' },
    { title: 'Floor Division', desc: 'Print floor division of 17 by 5.', expected: '3' },
    { title: 'Modulo Operation', desc: 'Print 17 % 5.', expected: '2' },
  ],
  medium: [
    { title: 'Reverse String', desc: "Reverse the string 'programming' and print it.", expected: 'gnimmargorp' },
    { title: 'Factorial', desc: 'Compute and print the factorial of 5.', expected: '120' },
    { title: 'Fibonacci 10th', desc: 'Print the 10th Fibonacci number (start 0,1).', expected: '34' },
    { title: 'Palindrome Check', desc: "Check if 'radar' is a palindrome. Print 'true' or 'false'.", expected: 'true' },
    { title: 'Array Sum', desc: 'Sum the array [1, 2, 3, 4, 5] and print.', expected: '15' },
    { title: 'Count Words', desc: "Count words in 'Hello World Good Day' and print.", expected: '4' },
    { title: 'Prime Check', desc: "Check if 17 is prime. Print 'true' or 'false'.", expected: 'true' },
    { title: 'GCD of Two Numbers', desc: 'Print GCD of 48 and 18.', expected: '6' },
    { title: 'Power of Two', desc: "Check if 16 is a power of 2. Print 'true' or 'false'.", expected: 'true' },
    { title: 'Sum of Digits', desc: 'Print sum of digits of 9876.', expected: '30' },
    { title: 'Remove Duplicates', desc: "Remove duplicates from 'abracadabra', print sorted unique chars.", expected: 'abcdr' },
    { title: 'Matrix Diagonal Sum', desc: 'Print sum of main diagonal of [[1,2,3],[4,5,6],[7,8,9]].', expected: '15' },
    { title: 'Bubble Sort First Pass', desc: 'Perform one pass of bubble sort on [5,1,4,2,8]. Print array.', expected: '1,4,2,5,8' },
    { title: 'Binary to Decimal', desc: 'Convert binary 1010 to decimal. Print result.', expected: '10' },
    { title: 'Count Consonants', desc: "Count consonants in 'Programming'. Print count.", expected: '8' },
    { title: 'Second Largest', desc: 'Find second largest in [3,1,4,1,5,9,2,6]. Print it.', expected: '6' },
    { title: 'String Title Case', desc: "Convert 'hello world' to title case and print.", expected: 'Hello World' },
    { title: 'Reverse Array', desc: "Reverse [1,2,3,4,5] and print as '5,4,3,2,1'.", expected: '5,4,3,2,1' },
    { title: 'Is Anagram', desc: "Check if 'listen' and 'silent' are anagrams. Print 'true'.", expected: 'true' },
    { title: 'Star Pattern', desc: 'Print a right triangle with 3 rows: *\\n**\\n***', expected: '*\n**\n***' },
  ],
  hard: [
    { title: 'Two Sum', desc: "Find indices in [2,7,11,15] that add to 9. Print '0,1'.", expected: '0,1' },
    { title: 'Longest Substring', desc: "Length of longest substring without repeating chars in 'abcabcbb'.", expected: '3' },
    { title: 'Valid Parentheses', desc: "Check if '{()}' is valid. Print 'true' or 'false'.", expected: 'true' },
    { title: 'Merge Sorted Arrays', desc: "Merge [1,3] and [2,4], print as '1,2,3,4'.", expected: '1,2,3,4' },
    { title: 'Binary Search', desc: 'Find index of 5 in sorted array [1,3,5,7,9].', expected: '2' },
    { title: 'Max Subarray Sum', desc: 'Find max subarray sum in [-2,1,-3,4,-1,2,1,-5,4].', expected: '6' },
    { title: 'Count Inversions Hint', desc: 'Count how many pairs (i<j) have a[i]>a[j] in [2,4,1,3,5]. Print count.', expected: '3' },
    { title: 'Rotate Array', desc: "Rotate [1,2,3,4,5] by 2 positions right. Print as '4,5,1,2,3'.", expected: '4,5,1,2,3' },
    { title: 'Climb Stairs', desc: 'How many ways to climb 5 stairs (1 or 2 steps at a time)?', expected: '8' },
    { title: 'Longest Palindrome Substring Length', desc: "Find length of longest palindrome substring in 'babad'.", expected: '3' },
  ],
};

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Clear old questions (but keep group-specific ones) ──
    console.log('Removing old public seed questions...');
    await client.query("DELETE FROM practice_attempts WHERE question_id IN (SELECT id FROM questions WHERE group_id IS NULL)");
    await client.query("DELETE FROM questions WHERE group_id IS NULL");

    let total = 0;

    // ── HR Questions ──
    console.log(`\nSeeding ${hrQuestions.length} HR questions...`);
    for (const q of hrQuestions) {
      await client.query(
        `INSERT INTO questions (category, difficulty, title, description, question_type, points, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        ['hr', q.diff, q.t, q.d, 'text', q.diff === 'easy' ? 10 : q.diff === 'medium' ? 20 : 30, ['behavioral', 'hr', q.diff]]
      );
      total++;
    }

    // ── Technical MCQ Questions ──
    console.log(`Seeding ${technicalQuestions.length} Technical MCQ questions...`);
    for (const q of technicalQuestions) {
      await client.query(
        `INSERT INTO questions (category, difficulty, title, description, question_type, options, correct_answer, points, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        ['technical_mcq', q.diff, q.t, q.d, 'mcq', JSON.stringify(q.opts), q.ans,
         q.diff === 'easy' ? 10 : q.diff === 'medium' ? 20 : 30, q.tags]
      );
      total++;
    }

    // ── Aptitude Questions ──
    console.log(`Seeding ${aptitudeQuestions.length} Aptitude questions...`);
    for (const q of aptitudeQuestions) {
      await client.query(
        `INSERT INTO questions (category, difficulty, title, description, question_type, options, correct_answer, points, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        ['aptitude', q.diff, q.t, q.d, 'mcq', JSON.stringify(q.opts), q.ans,
         q.diff === 'easy' ? 10 : q.diff === 'medium' ? 20 : 30, q.tags]
      );
      total++;
    }

    // ── Coding Questions (23 × 50) ──
    const getQuestions = (diff, count) => {
      const qList = [];
      const templates = codingTemplates[diff];
      for (let i = 0; i < count; i++) {
        const t = templates[i % templates.length];
        qList.push({ ...t, title: count > templates.length ? `${t.title} #${i + 1}` : t.title });
      }
      return qList;
    };

    for (const lang of languages) {
      console.log(`Seeding 50 coding questions for ${lang}...`);
      const allQ = [
        ...getQuestions('easy', 20).map(q => ({ ...q, diff: 'easy', pts: 10 })),
        ...getQuestions('medium', 20).map(q => ({ ...q, diff: 'medium', pts: 20 })),
        ...getQuestions('hard', 10).map(q => ({ ...q, diff: 'hard', pts: 30 })),
      ];

      for (const q of allQ) {
        await client.query(
          `INSERT INTO questions (category, difficulty, title, description, question_type, options, correct_answer, points, tags)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          ['coding', q.diff, `${lang}: ${q.title}`,
           `Language: ${lang}. ${q.desc}\n\nExpected Output: ${q.expected}\n\nWrite your solution in ${lang}. Output is compared against stdout.`,
           'code', JSON.stringify({ language: lang }), q.expected, q.pts,
           [lang.toLowerCase(), q.diff]]
        );
        total++;
      }
    }

    await client.query('COMMIT');
    console.log(`\n✅ SUCCESS: Seeded ${total} total questions`);
    console.log(`   HR: ${hrQuestions.length}`);
    console.log(`   Technical MCQ: ${technicalQuestions.length}`);
    console.log(`   Aptitude: ${aptitudeQuestions.length}`);
    console.log(`   Coding: ${languages.length} languages × 50 = ${languages.length * 50}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('SEED FAILED:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
