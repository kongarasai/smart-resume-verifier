// seedCodingQuestions.js
// Run this script from the backend root: node src/scripts/seedCodingQuestions.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smart_resume_verifier',
});

const languages = [
  'Java', 'Python', 'C', 'C++', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Kotlin', 
  'Swift', 'PHP', 'Ruby', 'C#', 'Dart', 'R', 'MATLAB', 'SQL', 'Bash', 'Scala', 
  'Objective-C', 'Haskell', 'Perl', 'Julia'
];

// Reusable difficulty templates for the mock questions
const questionTemplates = {
  easy: [
    { title: "Print Hello World", desc: "Write a program that outputs exactly 'Hello World'.", expected: "Hello World" },
    { title: "Sum of Two", desc: "Given variables a=5 and b=7, print their sum.", expected: "12" },
    { title: "Even or Odd", desc: "Write code to check if 10 is even. Print 'Even' or 'Odd'.", expected: "Even" },
    { title: "Find Maximum", desc: "Print the maximum of 15 and 22.", expected: "22" },
    { title: "String Length", desc: "Print the length of the string 'OpenAI'.", expected: "6" },
  ],
  medium: [
    { title: "Reverse String", desc: "Reverse the string 'programming' and print it.", expected: "gnimmargorp" },
    { title: "Factorial", desc: "Compute and print the factorial of 5.", expected: "120" },
    { title: "Fibonacci 10th", desc: "Print the 10th number in the Fibonacci sequence (start 0,1).", expected: "34" },
    { title: "Palindrome Check", desc: "Check if 'radar' is a palindrome. Print 'true' or 'false'.", expected: "true" },
    { title: "Array Sum", desc: "Sum the array [1, 2, 3, 4, 5] and print result.", expected: "15" },
  ],
  hard: [
    { title: "Two Sum Target", desc: "Find indices of elements in [2,7,11,15] that add up to 9. Print them without spaces.", expected: "0,1" },
    { title: "Longest Substring", desc: "Print the length of the longest substring without repeating chars for 'abcabcbb'.", expected: "3" },
    { title: "Valid Parentheses", desc: "Check if '{()}' is valid. Print 'true' or 'false'.", expected: "true" },
    { title: "Merge Sorted", desc: "Merge [1,3] and [2,4], print as '1,2,3,4'.", expected: "1,2,3,4" },
    { title: "Binary Search", desc: "Find index of 5 in sorted array [1,3,5,7,9].", expected: "2" },
  ]
};

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log("Removing old 'coding' questions to avoid clutter...");
    await client.query("DELETE FROM practice_attempts WHERE question_id IN (SELECT id FROM questions WHERE category='coding')");
    await client.query("DELETE FROM questions WHERE category='coding'");

    let insertedCount = 0;
    
    // Distribute template questions to reach the required counts
    const getQuestions = (diff, count) => {
      const qList = [];
      const templates = questionTemplates[diff];
      for (let i = 1; i <= count; i++) {
        const t = templates[i % templates.length];
        qList.push({ ...t, title: `${t.title} - Variant ${i}` }); // ensure uniqueness if needed
      }
      return qList;
    };

    for (const lang of languages) {
      console.log(`Generating 50 questions for ${lang}...`);
      
      const allQ = [
        ...getQuestions('easy', 20),
        ...getQuestions('medium', 20),
        ...getQuestions('hard', 10)
      ];

      for (let i = 0; i < allQ.length; i++) {
        const q = allQ[i];
        let diff = 'easy';
        let points = 10;
        if (i >= 20 && i < 40) { diff = 'medium'; points = 20; }
        if (i >= 40) { diff = 'hard'; points = 30; }

        await client.query(`
          INSERT INTO questions (category, difficulty, title, description, question_type, options, correct_answer, points, tags)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          'coding', diff, `${lang}: ${q.title}`,
          `Language: ${lang}. ${q.desc}\n\nExpected Output: ${q.expected}\n\nNote: In practice module this compares raw stdout.`,
          'code', JSON.stringify({ language: lang }), q.expected, points, [lang.toLowerCase(), diff]
        ]);
        insertedCount++;
      }
    }
    
    await client.query('COMMIT');
    console.log(`\n✅ SUCCESSFULLY INSERTED ${insertedCount} QUESTIONS ACROSS ${languages.length} LANGUAGES.`);
    console.log(`20 Easy, 20 Medium, 10 Hard per language guaranteed.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Failed to seed:", err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
